import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Timer "mo:base/Timer";
import Debug "mo:base/Debug";
import Nat "mo:base/Nat";

actor PaymentProcessor {
    
    private var paymentTimer: ?Timer.TimerId = null;
    
    public func startPaymentProcessor(): async () {
        switch (paymentTimer) {
            case (?_) { };
            case null {
                paymentTimer := ?Timer.setTimer(#seconds(60), processPayments);
                Debug.print("Payment processor started");
            };
        }
    };
    
    public func stopPaymentProcessor(): async () {
        switch (paymentTimer) {
            case (?timerId) {
                Timer.cancelTimer(timerId);
                paymentTimer := null;
                Debug.print("Payment processor stopped");
            };
            case null { };
        }
    };
    
    private func processPayments(): async () {
        Debug.print("Processing automatic payments...");
        
        let subscriptionManager = actor("by6od-j4aaa-aaaaa-qaadq-cai") : actor {
            processAutomaticPayments: () -> async Nat;
            getOverdueSubscriptionsCount: () -> async Nat;
        };
        
        try {
            let overdueCount = await subscriptionManager.getOverdueSubscriptionsCount();
            if (overdueCount > 0) {
                let processed = await subscriptionManager.processAutomaticPayments();
                Debug.print("Processed " # Nat.toText(processed) # " automatic payments");
            };
        } catch (_) {
            Debug.print("Error processing payments");
        };
        
        paymentTimer := ?Timer.setTimer(#seconds(60), processPayments);
        Debug.print("Payment processor started");
    };
    
    public func triggerPaymentProcessing(): async Nat {
        let subscriptionManager = actor("by6od-j4aaa-aaaaa-qaadq-cai") : actor {
            processAutomaticPayments: () -> async Nat;
        };
        
        try {
            let processed = await subscriptionManager.processAutomaticPayments();
            Debug.print("Manually processed " # Nat.toText(processed) # " payments");
            processed
        } catch (_) {
            Debug.print("Error in manual processing");
            0
        }
    };
    
    public query func getProcessorStatus(): async Bool {
        switch (paymentTimer) {
            case (?_) { true };
            case null { false };
        }
    };
}