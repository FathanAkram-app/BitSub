import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Result "mo:base/Result";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import BitcoinIntegration "canister:bitcoin_integration";

persistent actor WalletManager {

    public type SubscriptionLedger = {
        subscriber: Principal;
        address: Text;
        lastSyncedBalance: Nat64;
        consumedBalance: Nat64;
        lastSyncedAt: Int;
    };

    private let MAX_BALANCE_NAT: Nat = 18_446_744_073_709_551_615;

    private stable var subscriptionLedgersEntries: [(Nat, SubscriptionLedger)] = [];

    private transient var subscriptionLedgers = HashMap.HashMap<Nat, SubscriptionLedger>(
        10,
        func(a: Nat, b: Nat): Bool { a == b },
        Nat32.fromNat
    );

    system func preupgrade() {
        subscriptionLedgersEntries := Iter.toArray(subscriptionLedgers.entries());
    };

    system func postupgrade() {
        subscriptionLedgers := HashMap.fromIter<Nat, SubscriptionLedger>(
            subscriptionLedgersEntries.vals(),
            subscriptionLedgersEntries.size(),
            func(a: Nat, b: Nat): Bool { a == b },
            Nat32.fromNat
        );

        subscriptionLedgersEntries := [];
    };

    private func safeAddNat64(a: Nat64, b: Nat64): Nat64 {
        let totalNat = Nat64.toNat(a) + Nat64.toNat(b);
        if (totalNat >= MAX_BALANCE_NAT) {
            Nat64.fromNat(MAX_BALANCE_NAT)
        } else {
            Nat64.fromNat(totalNat)
        }
    };

    private func availableBalance(ledger: SubscriptionLedger): Nat64 {
        if (ledger.lastSyncedBalance <= ledger.consumedBalance) {
            0
        } else {
            ledger.lastSyncedBalance - ledger.consumedBalance
        }
    };

    public func generateAddress(subscriptionId: Nat, subscriber: Principal): async Result.Result<Text, Text> {
        if (subscriptionId == 0) {
            return #err("Subscription ID must be greater than 0");
        };

        switch (subscriptionLedgers.get(subscriptionId)) {
            case (?ledger) {
                if (ledger.subscriber != subscriber) {
                    #err("Subscription already associated with a different subscriber")
                } else {
                    #ok(ledger.address)
                }
            };
            case null {
                try {
                    let address = await BitcoinIntegration.generateAddress(subscriptionId);
                    let ledger: SubscriptionLedger = {
                        subscriber = subscriber;
                        address = address;
                        lastSyncedBalance = 0;
                        consumedBalance = 0;
                        lastSyncedAt = Time.now();
                    };
                    subscriptionLedgers.put(subscriptionId, ledger);
                    #ok(address)
                } catch (_) {
                    #err("Failed to derive Bitcoin address")
                }
            };
        }
    };

    public query func getSubscriptionAddress(subscriptionId: Nat): async ?Text {
        switch (subscriptionLedgers.get(subscriptionId)) {
            case (?ledger) { ?ledger.address };
            case null { null };
        }
    };

    public func syncSubscriptionBalance(subscriptionId: Nat): async Result.Result<Nat64, Text> {
        switch (subscriptionLedgers.get(subscriptionId)) {
            case (?ledger) {
                try {
                    let balance = await BitcoinIntegration.getBalance(ledger.address);
                    let updatedLedger: SubscriptionLedger = {
                        ledger with
                        lastSyncedBalance = balance;
                        lastSyncedAt = Time.now();
                    };
                    subscriptionLedgers.put(subscriptionId, updatedLedger);
                    #ok(balance)
                } catch (_) {
                    #err("Unable to fetch Bitcoin balance")
                }
            };
            case null { #err("Subscription not registered") };
        }
    };

    public query func getAvailableBalance(subscriptionId: Nat): async ?Nat64 {
        switch (subscriptionLedgers.get(subscriptionId)) {
            case (?ledger) { ?availableBalance(ledger) };
            case null { null };
        }
    };

    public func consumeBalance(subscriptionId: Nat, amount: Nat64): async Result.Result<(), Text> {
        if (amount == 0) {
            return #ok(());
        };

        switch (subscriptionLedgers.get(subscriptionId)) {
            case (?ledger) {
                let available = availableBalance(ledger);
                if (available < amount) {
                    #err("Insufficient balance")
                } else {
                    let updatedLedger: SubscriptionLedger = {
                        ledger with
                        consumedBalance = ledger.consumedBalance + amount;
                    };
                    subscriptionLedgers.put(subscriptionId, updatedLedger);
                    #ok(())
                }
            };
            case null { #err("Subscription not registered") };
        }
    };

    public func refreshUserBalance(user: Principal): async Nat64 {
        var total: Nat64 = 0;

        for ((subscriptionId, ledger) in subscriptionLedgers.entries()) {
            if (ledger.subscriber == user) {
                try {
                    let balance = await BitcoinIntegration.getBalance(ledger.address);
                    let updatedLedger: SubscriptionLedger = {
                        ledger with
                        lastSyncedBalance = balance;
                        lastSyncedAt = Time.now();
                    };
                    subscriptionLedgers.put(subscriptionId, updatedLedger);
                    total := safeAddNat64(total, availableBalance(updatedLedger));
                } catch (_) {
                    // Ignore sync errors for individual subscriptions
                };
            };
        };

        total
    };

    public query func getBalance(user: Principal): async Nat64 {
        var total: Nat64 = 0;

        for ((_, ledger) in subscriptionLedgers.entries()) {
            if (ledger.subscriber == user) {
                total := safeAddNat64(total, availableBalance(ledger));
            };
        };

        total
    };
}
