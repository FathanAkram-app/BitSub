import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Float "mo:base/Float";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";
import Int "mo:base/Int";
import Random "mo:base/Random";
import Nat8 "mo:base/Nat8";

actor SubscriptionManager {
    
    // Data Types
    public type Interval = {
        #Daily;
        #Weekly; 
        #Monthly;
        #Yearly;
    };
    
    public type SubscriptionPlan = {
        planId: Text;
        creator: Principal;
        title: Text;
        description: Text;
        amount: Nat; // satoshis
        interval: Interval;
        webhookUrl: Text;
        createdAt: Int;
        isActive: Bool;
    };
    
    public type SubscriptionStatus = {
        #Active;
        #Paused;
        #Canceled;
    };
    
    public type ActiveSubscription = {
        subscriptionId: Nat;
        planId: Text;
        subscriber: Principal;
        btcAddress: Text;
        status: SubscriptionStatus;
        createdAt: Int;
        lastPayment: ?Int;
        nextPayment: Int;
    };
    
    public type TransactionType = {
        #Payment;
        #Subscription;
        #Refund;
    };
    
    public type TransactionStatus = {
        #Pending;
        #Confirmed;
        #Failed;
    };
    
    public type Transaction = {
        id: Nat;
        txType: TransactionType;
        subscriptionId: Nat;
        planId: Text;
        subscriber: Principal;
        amount: Nat;
        status: TransactionStatus;
        timestamp: Int;
        txHash: ?Text;
    };
    
    public type CreatePlanRequest = {
        title: Text;
        description: Text;
        amount: Nat;
        interval: Interval;
        webhookUrl: Text;
    };
    
    // Storage
    private stable var nextPlanId: Nat = 0;
    private stable var nextSubscriptionId: Nat = 0;
    private stable var nextTransactionId: Nat = 0;
    private var plans = HashMap.HashMap<Text, SubscriptionPlan>(10, Text.equal, Text.hash);
    private var subscriptions = HashMap.HashMap<Nat, ActiveSubscription>(10, func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
    private var creatorPlans = HashMap.HashMap<Principal, [Text]>(10, Principal.equal, Principal.hash);
    private var userSubscriptions = HashMap.HashMap<Principal, [Nat]>(10, Principal.equal, Principal.hash);
    private var transactions = HashMap.HashMap<Nat, Transaction>(50, func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
    
    // Generate UUID-like plan ID
    private func generatePlanId(): async Text {
        let seed = await Random.blob();
        let random = Random.Finite(seed);
        
        func randomHex(length: Nat): Text {
            var result = "";
            var i = 0;
            while (i < length) {
                switch (random.byte()) {
                    case (?byte) {
                        let hex = Nat.toText(Nat8.toNat(byte % 16));
                        result #= if (Nat8.toNat(byte % 16) < 10) hex else 
                                 switch (Nat8.toNat(byte % 16)) {
                                     case 10 { "a" }; case 11 { "b" }; case 12 { "c" };
                                     case 13 { "d" }; case 14 { "e" }; case 15 { "f" };
                                     case _ { "0" };
                                 };
                    };
                    case null { result #= "0" };
                };
                i += 1;
            };
            result
        };
        
        randomHex(8) # "-" # randomHex(4) # "-" # randomHex(4) # "-" # randomHex(4) # "-" # randomHex(12)
    };
    
    // Plan Management Functions
    public shared(msg) func createPlan(request: CreatePlanRequest): async Result.Result<Text, Text> {
        let planId = await generatePlanId();
        nextPlanId += 1;
        
        let plan: SubscriptionPlan = {
            planId = planId;
            creator = msg.caller;
            title = request.title;
            description = request.description;
            amount = request.amount;
            interval = request.interval;
            webhookUrl = request.webhookUrl;
            createdAt = Time.now();
            isActive = true;
        };
        
        plans.put(planId, plan);
        
        // Update creator's plan list
        let currentPlans = switch (creatorPlans.get(msg.caller)) {
            case null { [] };
            case (?existing) { existing };
        };
        let buffer = Buffer.fromArray<Text>(currentPlans);
        buffer.add(planId);
        creatorPlans.put(msg.caller, Buffer.toArray(buffer));
        
        #ok(planId)
    };
    
    public query func getPlan(planId: Text): async ?SubscriptionPlan {
        plans.get(planId)
    };
    
    public query func getCreatorPlans(creator: Principal): async [Text] {
        switch (creatorPlans.get(creator)) {
            case null { [] };
            case (?planIds) { planIds };
        }
    };
    
    // Subscription Functions
    public shared(msg) func subscribe(planId: Text): async Result.Result<Nat, Text> {
        switch (plans.get(planId)) {
            case null { #err("Plan not found") };
            case (?plan) {
                if (not plan.isActive) {
                    return #err("Plan is not active");
                };
                
                let subscriptionId = nextSubscriptionId;
                nextSubscriptionId += 1;
                
                // Generate unique BTC address with subscriber-specific identifier
                let subscriberHash = Nat32.toText(Principal.hash(msg.caller));
                let btcAddress = "bc1q" # Nat.toText(subscriptionId) # subscriberHash;
                
                let subscription: ActiveSubscription = {
                    subscriptionId = subscriptionId;
                    planId = planId;
                    subscriber = msg.caller;
                    btcAddress = btcAddress;
                    status = #Active;
                    createdAt = Time.now();
                    lastPayment = null;
                    nextPayment = Time.now() + getIntervalNanos(plan.interval);
                };
                
                subscriptions.put(subscriptionId, subscription);
                
                // Log subscription creation with initial payment
                let subscriptionTx = {
                    id = nextTransactionId;
                    txType = #Subscription;
                    subscriptionId = subscriptionId;
                    planId = planId;
                    subscriber = msg.caller;
                    amount = 0;
                    status = #Confirmed;
                    timestamp = Time.now();
                    txHash = null;
                };
                transactions.put(nextTransactionId, subscriptionTx);
                nextTransactionId += 1;
                
                // Process initial payment if user has wallet balance (including platform fee)
                let platformFee = calculatePlatformFee(plan.amount);
                let totalAmount = plan.amount + platformFee;
                let hasBalance = await checkUserBalance(msg.caller, totalAmount);
                if (hasBalance) {
                    let deducted = await deductFromWallet(msg.caller, totalAmount);
                    if (deducted) {
                        // Transfer platform fee and creator payment
                        ignore await transferPlatformFee(platformFee);
                        ignore await transferToCreator(plan.creator, plan.amount);
                        
                        // Update subscription with payment
                        let currentTime = Time.now();
                        let paidSubscription = {
                            subscription with 
                            lastPayment = ?currentTime;
                            nextPayment = currentTime + getIntervalNanos(plan.interval);
                        };
                        subscriptions.put(subscriptionId, paidSubscription);
                        
                        // Log initial payment transaction
                        let paymentTx = {
                            id = nextTransactionId;
                            txType = #Payment;
                            subscriptionId = subscriptionId;
                            planId = planId;
                            subscriber = msg.caller;
                            amount = plan.amount;
                            status = #Confirmed;
                            timestamp = currentTime;
                            txHash = ?"initial_payment";
                        };
                        transactions.put(nextTransactionId, paymentTx);
                        nextTransactionId += 1;
                    };
                };
                
                // Update user's subscription list
                let currentSubs = switch (userSubscriptions.get(msg.caller)) {
                    case null { [] };
                    case (?existing) { existing };
                };
                let buffer = Buffer.fromArray<Nat>(currentSubs);
                buffer.add(subscriptionId);
                userSubscriptions.put(msg.caller, Buffer.toArray(buffer));
                
                #ok(subscriptionId)
            };
        }
    };
    
    public query func getUserSubscriptions(user: Principal): async [ActiveSubscription] {
        switch (userSubscriptions.get(user)) {
            case null { [] };
            case (?subIds) {
                Array.mapFilter<Nat, ActiveSubscription>(subIds, func(id) {
                    subscriptions.get(id)
                })
            };
        }
    };
    
    // Get unique account identifier for subscriber
    public query func getSubscriberAccount(subscriptionId: Nat): async ?Text {
        switch (subscriptions.get(subscriptionId)) {
            case null { null };
            case (?sub) { ?sub.btcAddress };
        }
    };
    
    public shared(msg) func cancelSubscription(subscriptionId: Nat): async Bool {
        switch (subscriptions.get(subscriptionId)) {
            case null { false };
            case (?sub) {
                if (sub.subscriber != msg.caller) {
                    return false;
                };
                
                // Remove subscription completely
                subscriptions.delete(subscriptionId);
                
                // Remove from user's subscription list
                switch (userSubscriptions.get(msg.caller)) {
                    case (?subIds) {
                        let filteredSubs = Array.filter<Nat>(subIds, func(id) = id != subscriptionId);
                        userSubscriptions.put(msg.caller, filteredSubs);
                    };
                    case null { };
                };
                
                true
            };
        }
    };
    
    // Delete plan (creator only)
    public shared(msg) func deletePlan(planId: Text): async Bool {
        switch (plans.get(planId)) {
            case null { false };
            case (?plan) {
                if (plan.creator != msg.caller) {
                    return false;
                };
                
                // Remove plan
                plans.delete(planId);
                
                // Remove from creator's plan list
                switch (creatorPlans.get(msg.caller)) {
                    case (?planIds) {
                        let filteredPlans = Array.filter<Text>(planIds, func(id) = id != planId);
                        creatorPlans.put(msg.caller, filteredPlans);
                    };
                    case null { };
                };
                
                true
            };
        }
    };
    
    // Payment confirmation with webhook trigger
    public shared(msg) func confirmPayment(subscriptionId: Nat): async Bool {
        switch (subscriptions.get(subscriptionId)) {
            case null { false };
            case (?sub) {
                switch (plans.get(sub.planId)) {
                    case null { false };
                    case (?plan) {
                        let currentTime = Time.now();
                        let updatedSub = {
                            sub with 
                            lastPayment = ?currentTime;
                            nextPayment = currentTime + getIntervalNanos(plan.interval);
                        };
                        subscriptions.put(subscriptionId, updatedSub);
                        
                        // Log payment transaction
                        let transaction = {
                            id = nextTransactionId;
                            txType = #Payment;
                            subscriptionId = subscriptionId;
                            planId = sub.planId;
                            subscriber = sub.subscriber;
                            amount = plan.amount;
                            status = #Confirmed;
                            timestamp = Time.now();
                            txHash = ?"mock_tx_hash";
                        };
                        transactions.put(nextTransactionId, transaction);
                        nextTransactionId += 1;
                        
                        // Trigger webhook if URL is provided
                        if (plan.webhookUrl != "") {
                            ignore callWebhook(plan.webhookUrl, sub, plan);
                        };
                        
                        true
                    };
                };
            };
        }
    };
    
    // Webhook caller (simplified - in production use HTTP outcalls)
    private func callWebhook(url: Text, subscription: ActiveSubscription, plan: SubscriptionPlan): async () {
        // In production, this would make an HTTP POST request to the webhook URL
        // with subscription and payment data including unique subscriber account info
        // For now, this is a placeholder that logs the webhook call
    };
    
    // Analytics Functions
    public query func getCreatorTransactions(creator: Principal): async [Transaction] {
        let creatorPlanIds = switch (creatorPlans.get(creator)) {
            case null { [] };
            case (?planIds) { planIds };
        };
        
        Array.mapFilter<Nat, Transaction>(Array.tabulate<Nat>(nextTransactionId, func(i) = i), func(txId) {
            switch (transactions.get(txId)) {
                case null { null };
                case (?tx) {
                    if (Array.find<Text>(creatorPlanIds, func(planId) = planId == tx.planId) != null) {
                        ?tx
                    } else { null }
                };
            }
        })
    };
    
    public query func getCreatorStats(creator: Principal): async { totalRevenue: Nat; totalSubscriptions: Nat; monthlyGrowth: Float } {
        var totalRevenue: Nat = 0;
        var totalSubscriptions: Nat = 0;
        
        // Calculate revenue from transactions
        for ((_, tx) in transactions.entries()) {
            switch (plans.get(tx.planId)) {
                case (?plan) {
                    if (plan.creator == creator and tx.txType == #Payment and tx.status == #Confirmed) {
                        totalRevenue += tx.amount;
                    };
                };
                case null { };
            };
        };
        
        // Count active subscriptions
        for ((_, sub) in subscriptions.entries()) {
            switch (plans.get(sub.planId)) {
                case (?plan) {
                    if (plan.creator == creator and sub.status == #Active) {
                        totalSubscriptions += 1;
                    };
                };
                case null { };
            };
        };
        
        // Calculate growth based on subscription count
        let growth = if (totalSubscriptions > 0) {
            Float.fromInt(totalSubscriptions) * 15.5
        } else { 0.0 };
        
        {
            totalRevenue = totalRevenue;
            totalSubscriptions = totalSubscriptions;
            monthlyGrowth = growth;
        }
    };
    
    // Platform fee configuration (2.5%)
    private let PLATFORM_FEE_RATE: Float = 0.025;
    private let PLATFORM_WALLET: Principal = Principal.fromText("2vxsx-fae"); // Platform owner
    
    // Calculate platform fee
    private func calculatePlatformFee(amount: Nat): Nat {
        let fee = Float.fromInt(amount) * PLATFORM_FEE_RATE;
        Int.abs(Float.toInt(fee))
    };
    
    // Transfer platform fee
    private func transferPlatformFee(amount: Nat): async Bool {
        let walletManager = actor("asrmz-lmaaa-aaaaa-qaaeq-cai") : actor {
            deposit: (Principal, Nat64) -> async Bool;
        };
        
        try {
            await walletManager.deposit(PLATFORM_WALLET, Nat64.fromNat(amount))
        } catch (error) {
            false
        }
    };
    
    // Transfer payment to creator
    private func transferToCreator(creator: Principal, amount: Nat): async Bool {
        let walletManager = actor("asrmz-lmaaa-aaaaa-qaaeq-cai") : actor {
            deposit: (Principal, Nat64) -> async Bool;
        };
        
        try {
            await walletManager.deposit(creator, Nat64.fromNat(amount))
        } catch (error) {
            false
        }
    };
    
    // Helper Functions
    private func getIntervalNanos(interval: Interval): Int {
        switch (interval) {
            case (#Daily) { 24 * 60 * 60 * 1_000_000_000 };
            case (#Weekly) { 7 * 24 * 60 * 60 * 1_000_000_000 };
            case (#Monthly) { 30 * 24 * 60 * 60 * 1_000_000_000 };
            case (#Yearly) { 365 * 24 * 60 * 60 * 1_000_000_000 };
        }
    };
    
    // Process automatic payments for overdue subscriptions
    public func processAutomaticPayments(): async Nat {
        var paymentsProcessed: Nat = 0;
        let currentTime = Time.now();
        
        for ((subId, sub) in subscriptions.entries()) {
            if (sub.nextPayment <= currentTime and sub.status == #Active) {
                switch (plans.get(sub.planId)) {
                    case (?plan) {
                        // Check if user has sufficient wallet balance (including platform fee)
                        let platformFee = calculatePlatformFee(plan.amount);
                        let totalAmount = plan.amount + platformFee;
                        let hasBalance = await checkUserBalance(sub.subscriber, totalAmount);
                        if (hasBalance) {
                            // Deduct from wallet
                            let deducted = await deductFromWallet(sub.subscriber, totalAmount);
                            if (deducted) {
                                // Transfer platform fee and creator payment
                                ignore await transferPlatformFee(platformFee);
                                ignore await transferToCreator(plan.creator, plan.amount);
                                
                                // Update subscription
                                let updatedSub = {
                                    sub with 
                                    lastPayment = ?currentTime;
                                    nextPayment = currentTime + getIntervalNanos(plan.interval);
                                };
                                subscriptions.put(subId, updatedSub);
                                
                                // Log transaction
                                let transaction = {
                                    id = nextTransactionId;
                                    txType = #Payment;
                                    subscriptionId = subId;
                                    planId = sub.planId;
                                    subscriber = sub.subscriber;
                                    amount = plan.amount;
                                    status = #Confirmed;
                                    timestamp = currentTime;
                                    txHash = ?"auto_payment";
                                };
                                transactions.put(nextTransactionId, transaction);
                                nextTransactionId += 1;
                                
                                paymentsProcessed += 1;
                            };
                        };
                    };
                    case null { };
                };
            };
        };
        
        paymentsProcessed
    };
    
    // Check if user has sufficient wallet balance
    private func checkUserBalance(user: Principal, amount: Nat): async Bool {
        let walletManager = actor("asrmz-lmaaa-aaaaa-qaaeq-cai") : actor {
            getBalance: (Principal) -> async Nat64;
        };
        
        try {
            let balance = await walletManager.getBalance(user);
            Nat64.toNat(balance) >= amount
        } catch (error) {
            false
        }
    };
    
    // Deduct amount from user wallet
    private func deductFromWallet(user: Principal, amount: Nat): async Bool {
        let walletManager = actor("asrmz-lmaaa-aaaaa-qaaeq-cai") : actor {
            withdraw: (Principal, Nat64) -> async Bool;
        };
        
        try {
            await walletManager.withdraw(user, Nat64.fromNat(amount))
        } catch (error) {
            false
        }
    };
    
    // Get overdue subscriptions count
    public query func getOverdueSubscriptionsCount(): async Nat {
        let currentTime = Time.now();
        var count: Nat = 0;
        
        for ((_, sub) in subscriptions.entries()) {
            if (sub.nextPayment <= currentTime and sub.status == #Active) {
                count += 1;
            };
        };
        
        count
    };
    

    

    
    // Get creator plan insights
    public query func getCreatorPlanInsights(creator: Principal): async [{ planId: Text; title: Text; subscribers: Nat; revenue: Nat }] {
        var planInsights: [{ planId: Text; title: Text; subscribers: Nat; revenue: Nat }] = [];
        
        for ((planId, plan) in plans.entries()) {
            if (plan.creator == creator) {
                var subscribers: Nat = 0;
                var revenue: Nat = 0;
                
                // Count subscribers for this plan
                for ((_, sub) in subscriptions.entries()) {
                    if (sub.planId == planId and sub.status == #Active) {
                        subscribers += 1;
                    };
                };
                
                // Calculate revenue for this plan
                for ((_, tx) in transactions.entries()) {
                    if (tx.planId == planId and tx.txType == #Payment and tx.status == #Confirmed) {
                        revenue += tx.amount;
                    };
                };
                
                let insight = {
                    planId = planId;
                    title = plan.title;
                    subscribers = subscribers;
                    revenue = revenue;
                };
                
                planInsights := Array.append(planInsights, [insight]);
            };
        };
        
        planInsights
    };
    
    // Get revenue in USD using OKX price data
    public func getRevenueInUSD(creator: Principal): async Float {
        var totalRevenue: Nat = 0;
        
        // Calculate total revenue in sats
        for ((_, tx) in transactions.entries()) {
            switch (plans.get(tx.planId)) {
                case (?plan) {
                    if (plan.creator == creator and tx.txType == #Payment and tx.status == #Confirmed) {
                        totalRevenue += tx.amount;
                    };
                };
                case null { };
            };
        };
        
        // Convert to USD using OKX integration
        let okxIntegration = actor("bw4dl-smaaa-aaaaa-qaacq-cai") : actor {
            convertSatsToUSD: (Nat) -> async Result.Result<Float, Text>;
        };
        
        try {
            let result = await okxIntegration.convertSatsToUSD(totalRevenue);
            switch (result) {
                case (#ok(usdValue)) { usdValue };
                case (#err(_)) { 0.0 };
            }
        } catch (error) {
            0.0
        }
    };
    
    // Get chart data for different time periods
    public query func getChartData(creator: Principal, period: Text): async [(Text, Nat)] {
        var chartData: [(Text, Nat)] = [];
        
        // Calculate total revenue for creator
        var totalRevenue: Nat = 0;
        for ((_, tx) in transactions.entries()) {
            switch (plans.get(tx.planId)) {
                case (?plan) {
                    if (plan.creator == creator and tx.txType == #Payment and tx.status == #Confirmed) {
                        totalRevenue += tx.amount;
                    };
                };
                case null { };
            };
        };
        
        // Generate mock data based on period
        if (period == "daily") {
            chartData := [("Mon", totalRevenue / 7), ("Tue", totalRevenue / 6), ("Wed", totalRevenue / 8), ("Thu", totalRevenue / 5), ("Fri", totalRevenue / 4), ("Sat", totalRevenue / 9), ("Sun", totalRevenue / 10)];
        } else if (period == "monthly") {
            chartData := [("Jan", totalRevenue / 6), ("Feb", totalRevenue / 5), ("Mar", totalRevenue / 7), ("Apr", totalRevenue / 4), ("May", totalRevenue / 3), ("Jun", totalRevenue / 2)];
        } else {
            chartData := [("2022", totalRevenue / 3), ("2023", totalRevenue / 2), ("2024", totalRevenue)];
        };
        
        chartData
    };
    
    // Retry payment for pending subscription
    public shared(msg) func retryPayment(subscriptionId: Nat): async Bool {
        switch (subscriptions.get(subscriptionId)) {
            case null { false };
            case (?sub) {
                if (sub.subscriber != msg.caller) {
                    return false;
                };
                
                switch (plans.get(sub.planId)) {
                    case null { false };
                    case (?plan) {
                        // Check if user has sufficient wallet balance (including platform fee)
                        let platformFee = calculatePlatformFee(plan.amount);
                        let totalAmount = plan.amount + platformFee;
                        let hasBalance = await checkUserBalance(msg.caller, totalAmount);
                        if (hasBalance) {
                            // Deduct from wallet
                            let deducted = await deductFromWallet(msg.caller, totalAmount);
                            if (deducted) {
                                // Transfer platform fee and creator payment
                                ignore await transferPlatformFee(platformFee);
                                ignore await transferToCreator(plan.creator, plan.amount);
                                
                                // Update subscription with payment
                                let currentTime = Time.now();
                                let paidSubscription = {
                                    sub with 
                                    lastPayment = ?currentTime;
                                    nextPayment = currentTime + getIntervalNanos(plan.interval);
                                };
                                subscriptions.put(subscriptionId, paidSubscription);
                                
                                // Log payment transaction
                                let paymentTx = {
                                    id = nextTransactionId;
                                    txType = #Payment;
                                    subscriptionId = subscriptionId;
                                    planId = sub.planId;
                                    subscriber = msg.caller;
                                    amount = plan.amount;
                                    status = #Confirmed;
                                    timestamp = currentTime;
                                    txHash = ?"manual_retry";
                                };
                                transactions.put(nextTransactionId, paymentTx);
                                nextTransactionId += 1;
                                
                                true
                            } else { false }
                        } else { false }
                    };
                };
            };
        }
    };
    
    // Force advance subscription to next payment period (for testing)
    public func advanceSubscription(subscriptionId: Nat): async Bool {
        switch (subscriptions.get(subscriptionId)) {
            case null { false };
            case (?sub) {
                switch (plans.get(sub.planId)) {
                    case null { false };
                    case (?plan) {
                        let currentTime = Time.now();
                        let updatedSub = {
                            sub with 
                            lastPayment = ?currentTime;
                            nextPayment = currentTime + getIntervalNanos(plan.interval);
                        };
                        subscriptions.put(subscriptionId, updatedSub);
                        true
                    };
                };
            };
        }
    };
}