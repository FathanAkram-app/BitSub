import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";
import Int "mo:base/Int";

actor BitcoinTestnet {
    
    public type BitcoinAddress = Text;
    public type Satoshis = Nat64;
    public type TxHash = Text;
    
    public type PaymentRequest = {
        address: BitcoinAddress;
        amount: Satoshis;
        subscriptionId: Nat;
    };
    
    public type PaymentStatus = {
        #Pending;
        #Confirmed;
        #Failed;
    };
    
    public type Transaction = {
        txHash: TxHash;
        address: BitcoinAddress;
        amount: Satoshis;
        confirmations: Nat;
        status: PaymentStatus;
        timestamp: Int;
    };
    
    private var payments = HashMap.HashMap<BitcoinAddress, PaymentRequest>(10, Text.equal, Text.hash);
    private var transactions = HashMap.HashMap<TxHash, Transaction>(50, Text.equal, Text.hash);
    private var addressToTx = HashMap.HashMap<BitcoinAddress, TxHash>(10, Text.equal, Text.hash);
    
    public func createPaymentRequest(subscriptionId: Nat, amount: Satoshis): async BitcoinAddress {
        let address = "tb1q" # Nat.toText(subscriptionId) # "test" # Int.toText(Time.now());
        
        let paymentRequest: PaymentRequest = {
            address = address;
            amount = amount;
            subscriptionId = subscriptionId;
        };
        
        payments.put(address, paymentRequest);
        Debug.print("Created testnet payment: " # address);
        
        address
    };
    
    public func monitorPayment(address: BitcoinAddress): async ?Transaction {
        switch (addressToTx.get(address)) {
            case (?txHash) {
                transactions.get(txHash)
            };
            case null {
                switch (payments.get(address)) {
                    case (?payment) {
                        // Simulate finding transaction after 10 seconds
                        let txHash = "testnet_tx_" # Int.toText(Time.now());
                        let transaction: Transaction = {
                            txHash = txHash;
                            address = address;
                            amount = payment.amount;
                            confirmations = 1;
                            status = #Pending;
                            timestamp = Time.now();
                        };
                        
                        transactions.put(txHash, transaction);
                        addressToTx.put(address, txHash);
                        
                        ?transaction
                    };
                    case null { null };
                }
            };
        }
    };
    
    public func updateConfirmations(txHash: TxHash): async Bool {
        switch (transactions.get(txHash)) {
            case (?tx) {
                let updatedTx = {
                    tx with 
                    confirmations = tx.confirmations + 1;
                    status = if (tx.confirmations >= 3) #Confirmed else #Pending;
                };
                transactions.put(txHash, updatedTx);
                true
            };
            case null { false };
        }
    };
    
    public query func getTransaction(address: BitcoinAddress): async ?Transaction {
        switch (addressToTx.get(address)) {
            case (?txHash) { transactions.get(txHash) };
            case null { null };
        }
    };
    
    public func requestTestnetFunds(address: BitcoinAddress): async Text {
        Debug.print("Testnet faucet request for: " # address);
        "Testnet funds requested for " # address # ". Check testnet explorer in 2-3 minutes."
    };
}