import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import Iter "mo:base/Iter";

actor WalletManager {
    
    // Error Types
    public type Error = {
        #InvalidInput: Text;
        #InsufficientBalance: Text;
        #NotFound: Text;
        #SystemError: Text;
    };
    
    // Data Types
    public type BTCAddress = {
        address: Text;
        subscriptionId: Nat;
        isUsed: Bool;
    };
    
    // Stable Storage
    private stable var nextAddressId: Nat = 0;
    private stable var addressesEntries: [(Nat, BTCAddress)] = [];
    private stable var subscriptionAddressesEntries: [(Nat, Text)] = [];
    private stable var userBalancesEntries: [(Principal, Nat64)] = [];
    
    // Working hashmaps
    private var addresses = HashMap.HashMap<Nat, BTCAddress>(10, func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
    private var subscriptionAddresses = HashMap.HashMap<Nat, Text>(10, func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
    private var userBalances = HashMap.HashMap<Principal, Nat64>(10, Principal.equal, Principal.hash);
    
    // System functions for upgrade persistence
    system func preupgrade() {
        addressesEntries := Iter.toArray(addresses.entries());
        subscriptionAddressesEntries := Iter.toArray(subscriptionAddresses.entries());
        userBalancesEntries := Iter.toArray(userBalances.entries());
    };
    
    system func postupgrade() {
        addresses := HashMap.fromIter<Nat, BTCAddress>(addressesEntries.vals(), addressesEntries.size(), func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
        subscriptionAddresses := HashMap.fromIter<Nat, Text>(subscriptionAddressesEntries.vals(), subscriptionAddressesEntries.size(), func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
        userBalances := HashMap.fromIter<Principal, Nat64>(userBalancesEntries.vals(), userBalancesEntries.size(), Principal.equal, Principal.hash);
        
        // Clear stable arrays
        addressesEntries := [];
        subscriptionAddressesEntries := [];
        userBalancesEntries := [];
    };
    
    // Input validation
    private func validateSubscriptionId(subscriptionId: Nat): Result.Result<(), Error> {
        if (subscriptionId == 0) {
            #err(#InvalidInput("Subscription ID must be greater than 0"))
        } else {
            #ok(())
        }
    };
    
    private func validateAmount(amount: Nat64): Result.Result<(), Error> {
        if (amount == 0) {
            #err(#InvalidInput("Amount must be greater than 0"))
        } else if (amount > 2_100_000_000_000_000) {
            #err(#InvalidInput("Amount exceeds maximum allowed"))
        } else {
            #ok(())
        }
    };
    
    // Generate unique BTC address for subscription
    public func generateAddress(subscriptionId: Nat): async Result.Result<Text, Text> {
        // Validate input
        switch (validateSubscriptionId(subscriptionId)) {
            case (#err(error)) { 
                return #err(switch (error) {
                    case (#InvalidInput(msg)) { "Invalid input: " # msg };
                    case (#InsufficientBalance(msg)) { "Insufficient balance: " # msg };
                    case (#NotFound(msg)) { "Not found: " # msg };
                    case (#SystemError(msg)) { "System error: " # msg };
                })
            };
            case (#ok()) { };
        };
        
        // Check if address already exists for this subscription
        switch (subscriptionAddresses.get(subscriptionId)) {
            case (?existing) { #ok(existing) };
            case null {
                let addressId = nextAddressId;
                nextAddressId += 1;
                
                // Generate mock BTC address (in production, use proper BTC address generation)
                let btcAddress = "bc1q" # generateRandomString(addressId) # "bitsub" # Nat.toText(subscriptionId);
                
                let addressRecord: BTCAddress = {
                    address = btcAddress;
                    subscriptionId = subscriptionId;
                    isUsed = false;
                };
                
                addresses.put(addressId, addressRecord);
                subscriptionAddresses.put(subscriptionId, btcAddress);
                
                #ok(btcAddress)
            };
        }
    };
    
    // Get address for subscription
    public query func getSubscriptionAddress(subscriptionId: Nat): async ?Text {
        subscriptionAddresses.get(subscriptionId)
    };
    
    // Mark address as used (when payment is received)
    public func markAddressUsed(subscriptionId: Nat): async Bool {
        switch (subscriptionAddresses.get(subscriptionId)) {
            case null { false };
            case (?_) {
                // Find and update the address record
                for ((id, record) in addresses.entries()) {
                    if (record.subscriptionId == subscriptionId) {
                        let updatedRecord = {
                            record with isUsed = true
                        };
                        addresses.put(id, updatedRecord);
                        return true;
                    };
                };
                false
            };
        }
    };
    
    // Get all addresses (for monitoring)
    public query func getAllAddresses(): async [(Nat, BTCAddress)] {
        Iter.toArray(addresses.entries())
    };
    
    // Wallet Balance Functions
    public query func getBalance(user: Principal): async Nat64 {
        switch (userBalances.get(user)) {
            case (?balance) { balance };
            case null { 0 : Nat64 };
        }
    };
    
    public func deposit(user: Principal, amount: Nat64): async Bool {
        // Validate amount
        switch (validateAmount(amount)) {
            case (#err(_)) { return false };
            case (#ok()) { };
        };
        
        let currentBalance = switch (userBalances.get(user)) {
            case (?balance) { balance };
            case null { 0 : Nat64 };
        };
        
        // Check for overflow
        if (currentBalance > (18_446_744_073_709_551_615 : Nat64) - amount) {
            return false; // Overflow protection
        };
        
        userBalances.put(user, currentBalance + amount);
        true
    };
    
    public func withdraw(user: Principal, amount: Nat64): async Bool {
        // Validate amount
        switch (validateAmount(amount)) {
            case (#err(_)) { return false };
            case (#ok()) { };
        };
        
        let currentBalance = switch (userBalances.get(user)) {
            case (?balance) { balance };
            case null { 0 : Nat64 };
        };
        
        if (currentBalance >= amount) {
            userBalances.put(user, currentBalance - amount);
            true
        } else {
            false
        }
    };
    
    // Helper function to generate random string
    private func generateRandomString(seed: Nat): Text {
        let seedText = Nat.toText(seed);
        seedText # "x" # Nat.toText(seed * 7 % 1000)
    };
}