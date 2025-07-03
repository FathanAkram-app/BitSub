import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import Iter "mo:base/Iter";

actor WalletManager {
    
    // Data Types
    public type BTCAddress = {
        address: Text;
        subscriptionId: Nat;
        isUsed: Bool;
    };
    
    // Storage
    private stable var nextAddressId: Nat = 0;
    private var addresses = HashMap.HashMap<Nat, BTCAddress>(10, func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
    private var subscriptionAddresses = HashMap.HashMap<Nat, Text>(10, func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
    private var userBalances = HashMap.HashMap<Principal, Nat64>(10, Principal.equal, Principal.hash);
    
    // Generate unique BTC address for subscription
    public func generateAddress(subscriptionId: Nat): async Result.Result<Text, Text> {
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
            case (?address) {
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
        let currentBalance = switch (userBalances.get(user)) {
            case (?balance) { balance };
            case null { 0 : Nat64 };
        };
        
        userBalances.put(user, currentBalance + amount);
        true
    };
    
    public func withdraw(user: Principal, amount: Nat64): async Bool {
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
        let chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        let seedText = Nat.toText(seed);
        seedText # "x" # Nat.toText(seed * 7 % 1000)
    };
}