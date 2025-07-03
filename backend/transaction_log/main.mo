import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Iter "mo:base/Iter";
import Buffer "mo:base/Buffer";

actor TransactionLog {
    
    // Data Types
    public type TransactionStatus = {
        #Pending;
        #Confirmed;
        #Failed;
    };
    
    public type TransactionType = {
        #Payment;
        #Refund;
    };
    
    public type Transaction = {
        transactionId: Nat;
        subscriptionId: Nat;
        planId: Text;
        subscriber: Principal;
        creator: Principal;
        amount: Nat64;
        btcTxHash: ?Text;
        btcAddress: Text;
        transactionType: TransactionType;
        status: TransactionStatus;
        createdAt: Int;
        confirmedAt: ?Int;
    };
    
    // Storage
    private stable var nextTransactionId: Nat = 0;
    private var transactions = HashMap.HashMap<Nat, Transaction>(10, func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
    private var userTransactions = HashMap.HashMap<Principal, [Nat]>(10, Principal.equal, Principal.hash);
    private var subscriptionTransactions = HashMap.HashMap<Nat, [Nat]>(10, func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
    
    // Log new transaction
    public func logTransaction(
        subscriptionId: Nat,
        planId: Text,
        subscriber: Principal,
        creator: Principal,
        amount: Nat64,
        btcAddress: Text,
        transactionType: TransactionType
    ): async Nat {
        let transactionId = nextTransactionId;
        nextTransactionId += 1;
        
        let transaction: Transaction = {
            transactionId = transactionId;
            subscriptionId = subscriptionId;
            planId = planId;
            subscriber = subscriber;
            creator = creator;
            amount = amount;
            btcTxHash = null;
            btcAddress = btcAddress;
            transactionType = transactionType;
            status = #Pending;
            createdAt = Time.now();
            confirmedAt = null;
        };
        
        transactions.put(transactionId, transaction);
        
        // Update user transaction lists
        updateUserTransactions(subscriber, transactionId);
        updateUserTransactions(creator, transactionId);
        
        // Update subscription transaction list
        let currentSubTxs = switch (subscriptionTransactions.get(subscriptionId)) {
            case null { [] };
            case (?existing) { existing };
        };
        let buffer = Buffer.fromArray<Nat>(currentSubTxs);
        buffer.add(transactionId);
        subscriptionTransactions.put(subscriptionId, Buffer.toArray(buffer));
        
        transactionId
    };
    
    // Confirm transaction
    public func confirmTransaction(transactionId: Nat, btcTxHash: Text): async Bool {
        switch (transactions.get(transactionId)) {
            case null { false };
            case (?tx) {
                let updatedTx = {
                    tx with 
                    status = #Confirmed;
                    btcTxHash = ?btcTxHash;
                    confirmedAt = ?Time.now();
                };
                transactions.put(transactionId, updatedTx);
                true
            };
        }
    };
    
    // Get user transactions
    public query func getUserTransactions(user: Principal): async [Transaction] {
        switch (userTransactions.get(user)) {
            case null { [] };
            case (?txIds) {
                Array.mapFilter<Nat, Transaction>(txIds, func(id) {
                    transactions.get(id)
                })
            };
        }
    };
    
    // Get subscription transactions
    public query func getSubscriptionTransactions(subscriptionId: Nat): async [Transaction] {
        switch (subscriptionTransactions.get(subscriptionId)) {
            case null { [] };
            case (?txIds) {
                Array.mapFilter<Nat, Transaction>(txIds, func(id) {
                    transactions.get(id)
                })
            };
        }
    };
    
    // Get transaction by ID
    public query func getTransaction(transactionId: Nat): async ?Transaction {
        transactions.get(transactionId)
    };
    
    // Get all pending transactions
    public query func getPendingTransactions(): async [Transaction] {
        Iter.toArray(
            Iter.filter(transactions.vals(), func(tx: Transaction): Bool { 
                switch (tx.status) {
                    case (#Pending) { true };
                    case (_) { false };
                }
            })
        )
    };
    
    // Helper function to update user transaction lists
    private func updateUserTransactions(user: Principal, transactionId: Nat) {
        let currentTxs = switch (userTransactions.get(user)) {
            case null { [] };
            case (?existing) { existing };
        };
        let buffer = Buffer.fromArray<Nat>(currentTxs);
        buffer.add(transactionId);
        userTransactions.put(user, Buffer.toArray(buffer));
    };
}