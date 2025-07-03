import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";

actor BitcoinIntegration {
    
    public type PaymentStatus = {
        #Pending;
        #Confirmed;
        #Failed;
    };
    
    public type BitcoinPayment = {
        address: Text;
        amount: Nat64;
        subscriptionId: Nat;
        status: PaymentStatus;
        txHash: ?Text;
        confirmations: Nat;
        createdAt: Int;
    };
    
    private var payments = HashMap.HashMap<Text, BitcoinPayment>(10, Text.equal, Text.hash);
    
    public func generatePaymentAddress(subscriptionId: Nat, subscriber: Principal): async Text {
        let subscriberHash = Nat32.toText(Principal.hash(subscriber));
        let address = "bc1q" # Nat.toText(subscriptionId) # subscriberHash;
        
        let payment: BitcoinPayment = {
            address = address;
            amount = 0;
            subscriptionId = subscriptionId;
            status = #Pending;
            txHash = null;
            confirmations = 0;
            createdAt = Time.now();
        };
        
        payments.put(address, payment);
        address
    };
    
    public func checkPayment(address: Text): async ?BitcoinPayment {
        payments.get(address)
    };
    
    public func confirmPayment(address: Text, txHash: Text, amount: Nat64): async Bool {
        switch (payments.get(address)) {
            case null { false };
            case (?payment) {
                let updatedPayment = {
                    payment with 
                    status = #Confirmed;
                    txHash = ?txHash;
                    amount = amount;
                    confirmations = 6;
                };
                payments.put(address, updatedPayment);
                true
            };
        }
    };
}