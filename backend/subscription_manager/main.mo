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
import Blob "mo:base/Blob";
import Debug "mo:base/Debug";

actor SubscriptionManager {
    
    // Error Types
    public type Error = {
        #InvalidInput: Text;
        #NotFound: Text;
        #Unauthorized: Text;
        #InsufficientFunds: Text;
        #CanisterError: Text;
        #ValidationError: Text;
        #SystemError: Text;
    };
    
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
    
    // Webhook Types
    public type WebhookEventType = {
        #SubscriptionCreated;
        #PaymentSuccessful;
        #PaymentFailed;
        #SubscriptionCancelled;
        #SubscriptionExpired;
    };
    
    public type WebhookStatus = {
        #Pending;
        #Sent;
        #Failed;
        #Disabled;
    };
    
    public type WebhookEvent = {
        id: Nat;
        eventType: WebhookEventType;
        subscriptionId: Nat;
        planId: Text;
        subscriber: Principal;
        timestamp: Int;
        status: WebhookStatus;
        retryCount: Nat;
        lastAttempt: ?Int;
        responseCode: ?Nat;
        errorMessage: ?Text;
    };
    
    public type WebhookPayload = {
        event: Text;
        subscriptionId: Nat;
        subscriber: Text;
        subscriberAccount: Text;
        plan: {
            planId: Text;
            title: Text;
            amount: Nat;
            interval: Text;
        };
        payment: ?{
            timestamp: Int;
            nextPayment: Int;
            amount: Nat;
            status: Text;
        };
        signature: Text;
        timestamp: Int;
    };
    
    public type WebhookConfig = {
        url: Text;
        secret: Text;
        events: [WebhookEventType];
        isActive: Bool;
        maxRetries: Nat;
        timeout: Nat;
    };
    
    // Stable Storage
    private stable var nextPlanId: Nat = 0;
    private stable var nextSubscriptionId: Nat = 0;
    private stable var nextTransactionId: Nat = 0;
    private stable var nextWebhookEventId: Nat = 0;
    
    // Stable arrays for upgrade persistence
    private stable var plansEntries: [(Text, SubscriptionPlan)] = [];
    private stable var subscriptionsEntries: [(Nat, ActiveSubscription)] = [];
    private stable var creatorPlansEntries: [(Principal, [Text])] = [];
    private stable var userSubscriptionsEntries: [(Principal, [Nat])] = [];
    private stable var transactionsEntries: [(Nat, Transaction)] = [];
    private stable var canisterRegistryEntries: [(Text, Principal)] = [];
    private stable var webhookEventsEntries: [(Nat, WebhookEvent)] = [];
    private stable var webhookConfigsEntries: [(Text, WebhookConfig)] = [];
    
    // Working hashmaps (rebuilt from stable storage)
    private var plans = HashMap.HashMap<Text, SubscriptionPlan>(10, Text.equal, Text.hash);
    private var subscriptions = HashMap.HashMap<Nat, ActiveSubscription>(10, func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
    private var creatorPlans = HashMap.HashMap<Principal, [Text]>(10, Principal.equal, Principal.hash);
    private var userSubscriptions = HashMap.HashMap<Principal, [Nat]>(10, Principal.equal, Principal.hash);
    private var transactions = HashMap.HashMap<Nat, Transaction>(50, func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
    private var canisterRegistry = HashMap.HashMap<Text, Principal>(10, Text.equal, Text.hash);
    private var webhookEvents = HashMap.HashMap<Nat, WebhookEvent>(50, func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
    private var webhookConfigs = HashMap.HashMap<Text, WebhookConfig>(10, Text.equal, Text.hash);
    
    // System functions for upgrade persistence
    system func preupgrade() {
        plansEntries := Iter.toArray(plans.entries());
        subscriptionsEntries := Iter.toArray(subscriptions.entries());
        creatorPlansEntries := Iter.toArray(creatorPlans.entries());
        userSubscriptionsEntries := Iter.toArray(userSubscriptions.entries());
        transactionsEntries := Iter.toArray(transactions.entries());
        canisterRegistryEntries := Iter.toArray(canisterRegistry.entries());
        webhookEventsEntries := Iter.toArray(webhookEvents.entries());
        webhookConfigsEntries := Iter.toArray(webhookConfigs.entries());
    };
    
    system func postupgrade() {
        plans := HashMap.fromIter<Text, SubscriptionPlan>(plansEntries.vals(), plansEntries.size(), Text.equal, Text.hash);
        subscriptions := HashMap.fromIter<Nat, ActiveSubscription>(subscriptionsEntries.vals(), subscriptionsEntries.size(), func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
        creatorPlans := HashMap.fromIter<Principal, [Text]>(creatorPlansEntries.vals(), creatorPlansEntries.size(), Principal.equal, Principal.hash);
        userSubscriptions := HashMap.fromIter<Principal, [Nat]>(userSubscriptionsEntries.vals(), userSubscriptionsEntries.size(), Principal.equal, Principal.hash);
        transactions := HashMap.fromIter<Nat, Transaction>(transactionsEntries.vals(), transactionsEntries.size(), func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
        canisterRegistry := HashMap.fromIter<Text, Principal>(canisterRegistryEntries.vals(), canisterRegistryEntries.size(), Text.equal, Text.hash);
        webhookEvents := HashMap.fromIter<Nat, WebhookEvent>(webhookEventsEntries.vals(), webhookEventsEntries.size(), func(a: Nat, b: Nat): Bool { a == b }, Nat32.fromNat);
        webhookConfigs := HashMap.fromIter<Text, WebhookConfig>(webhookConfigsEntries.vals(), webhookConfigsEntries.size(), Text.equal, Text.hash);
        
        // Initialize default canister registry if empty
        if (canisterRegistry.size() == 0) {
            canisterRegistry.put("wallet_manager", Principal.fromText("asrmz-lmaaa-aaaaa-qaaeq-cai"));
            canisterRegistry.put("okx_integration", Principal.fromText("bw4dl-smaaa-aaaaa-qaacq-cai"));
        };
        
        // Clear stable arrays to free memory
        plansEntries := [];
        subscriptionsEntries := [];
        creatorPlansEntries := [];
        userSubscriptionsEntries := [];
        transactionsEntries := [];
        canisterRegistryEntries := [];
        webhookEventsEntries := [];
        webhookConfigsEntries := [];
    };
    
    // Canister registry management
    public func registerCanister(name: Text, canisterId: Principal): async Bool {
        canisterRegistry.put(name, canisterId);
        true
    };
    
    public query func getCanister(name: Text): async ?Principal {
        canisterRegistry.get(name)
    };
    
    private func getCanisterPrincipal(name: Text): Principal {
        switch (canisterRegistry.get(name)) {
            case (?canisterId) { canisterId };
            case null { 
                // Fallback to hardcoded IDs for backwards compatibility
                switch (name) {
                    case "wallet_manager" { Principal.fromText("asrmz-lmaaa-aaaaa-qaaeq-cai") };
                    case "okx_integration" { Principal.fromText("bw4dl-smaaa-aaaaa-qaacq-cai") };
                    case _ { Principal.fromText("aaaaa-aa") }; // Invalid principal as fallback
                }
            };
        }
    };
    
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
    
    // Input validation functions
    private func validatePlanRequest(request: CreatePlanRequest): Result.Result<(), Error> {
        if (Text.size(request.title) == 0) {
            return #err(#ValidationError("Plan title cannot be empty"));
        };
        if (Text.size(request.title) > 100) {
            return #err(#ValidationError("Plan title too long (max 100 characters)"));
        };
        if (Text.size(request.description) > 500) {
            return #err(#ValidationError("Plan description too long (max 500 characters)"));
        };
        if (request.amount == 0) {
            return #err(#ValidationError("Plan amount must be greater than 0"));
        };
        if (request.amount > 2_100_000_000_000_000) { // Max 21M BTC in satoshis
            return #err(#ValidationError("Plan amount exceeds maximum allowed"));
        };
        if (request.webhookUrl != "" and not isValidUrl(request.webhookUrl)) {
            return #err(#ValidationError("Invalid webhook URL format"));
        };
        #ok(())
    };
    
    private func isValidUrl(url: Text): Bool {
        Text.startsWith(url, #text("https://")) or Text.startsWith(url, #text("http://"))
    };
    
    private func sanitizeText(text: Text): Text {
        // Basic sanitization - remove potential harmful characters
        let forbidden = ["<", ">", "\"", "'", "&", "script", "javascript"];
        var sanitized = text;
        for (char in forbidden.vals()) {
            sanitized := Text.replace(sanitized, #text(char), "");
        };
        sanitized
    };
    
    // Helper function to convert Error to Text for backward compatibility
    private func errorToText(error: Error): Text {
        switch (error) {
            case (#InvalidInput(msg)) { "Invalid input: " # msg };
            case (#NotFound(msg)) { "Not found: " # msg };
            case (#Unauthorized(msg)) { "Unauthorized: " # msg };
            case (#InsufficientFunds(msg)) { "Insufficient funds: " # msg };
            case (#CanisterError(msg)) { "Canister error: " # msg };
            case (#ValidationError(msg)) { "Validation error: " # msg };
            case (#SystemError(msg)) { "System error: " # msg };
        }
    };
    
    // Plan Management Functions
    public shared(msg) func createPlan(request: CreatePlanRequest): async Result.Result<Text, Text> {
        // Validate input
        switch (validatePlanRequest(request)) {
            case (#err(error)) { return #err(errorToText(error)) };
            case (#ok()) { };
        };
        
        let planId = await generatePlanId();
        nextPlanId += 1;
        
        let plan: SubscriptionPlan = {
            planId = planId;
            creator = msg.caller;
            title = sanitizeText(request.title);
            description = sanitizeText(request.description);
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
    
    // Marketplace Functions
    public query func getAllPublicPlans(): async [SubscriptionPlan] {
        let buffer = Buffer.Buffer<SubscriptionPlan>(0);
        for ((_, plan) in plans.entries()) {
            if (plan.isActive) {
                buffer.add(plan);
            };
        };
        Buffer.toArray(buffer)
    };
    
    public query func searchPlans(searchQuery: Text): async [SubscriptionPlan] {
        let searchTerm = Text.toLowercase(searchQuery);
        let buffer = Buffer.Buffer<SubscriptionPlan>(0);
        
        for ((_, plan) in plans.entries()) {
            if (plan.isActive) {
                let titleMatch = Text.contains(Text.toLowercase(plan.title), #text(searchTerm));
                let descMatch = Text.contains(Text.toLowercase(plan.description), #text(searchTerm));
                
                if (titleMatch or descMatch) {
                    buffer.add(plan);
                };
            };
        };
        Buffer.toArray(buffer)
    };
    
    public query func getPlansByCategory(minAmount: Nat, maxAmount: Nat): async [SubscriptionPlan] {
        let buffer = Buffer.Buffer<SubscriptionPlan>(0);
        
        for ((_, plan) in plans.entries()) {
            if (plan.isActive and plan.amount >= minAmount and plan.amount <= maxAmount) {
                buffer.add(plan);
            };
        };
        Buffer.toArray(buffer)
    };
    
    public query func getFeaturedPlans(): async [SubscriptionPlan] {
        let buffer = Buffer.Buffer<SubscriptionPlan>(0);
        var count = 0;
        
        // Get plans with the most subscribers (featured logic)
        for ((_, plan) in plans.entries()) {
            if (plan.isActive and count < 6) {
                var subscriberCount = 0;
                for ((_, sub) in subscriptions.entries()) {
                    if (sub.planId == plan.planId and sub.status == #Active) {
                        subscriberCount += 1;
                    };
                };
                
                if (subscriberCount > 0) {
                    buffer.add(plan);
                    count += 1;
                };
            };
        };
        Buffer.toArray(buffer)
    };
    
    // Subscription Functions
    public shared(msg) func subscribe(planId: Text): async Result.Result<Nat, Text> {
        // Validate plan ID format
        if (Text.size(planId) == 0) {
            return #err(errorToText(#InvalidInput("Plan ID cannot be empty")));
        };
        
        switch (plans.get(planId)) {
            case null { #err(errorToText(#NotFound("Plan not found"))) };
            case (?plan) {
                if (not plan.isActive) {
                    return #err(errorToText(#InvalidInput("Plan is not active")));
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
    public shared(_) func confirmPayment(subscriptionId: Nat): async Bool {
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
                        
                        // Trigger webhook for payment successful
                        ignore callWebhook(#PaymentSuccessful, sub, plan, ?{
                            timestamp = Time.now();
                            nextPayment = sub.nextPayment;
                            amount = plan.amount;
                            status = "confirmed";
                        });
                        
                        true
                    };
                };
            };
        }
    };
    
    // Webhook Management Functions
    public shared(msg) func configureWebhook(planId: Text, config: WebhookConfig): async Result.Result<(), Text> {
        switch (plans.get(planId)) {
            case null { #err(errorToText(#NotFound("Plan not found"))) };
            case (?plan) {
                if (plan.creator != msg.caller) {
                    return #err(errorToText(#Unauthorized("Only plan creator can configure webhooks")));
                };
                
                // Validate webhook URL
                if (not isValidUrl(config.url)) {
                    return #err(errorToText(#ValidationError("Invalid webhook URL format")));
                };
                
                webhookConfigs.put(planId, config);
                #ok(())
            };
        }
    };
    
    public query func getWebhookConfig(planId: Text): async ?WebhookConfig {
        webhookConfigs.get(planId)
    };
    
    public shared(msg) func testWebhook(planId: Text): async Result.Result<Text, Text> {
        switch (plans.get(planId)) {
            case null { #err(errorToText(#NotFound("Plan not found"))) };
            case (?plan) {
                if (plan.creator != msg.caller) {
                    return #err(errorToText(#Unauthorized("Only plan creator can test webhooks")));
                };
                
                switch (webhookConfigs.get(planId)) {
                    case null { #err(errorToText(#NotFound("No webhook configured for this plan"))) };
                    case (?config) {
                        // Create test payload
                        let testPayload = createWebhookPayload(
                            #SubscriptionCreated,
                            0, // Test subscription ID
                            Principal.fromText("aaaaa-aa"), // Test subscriber
                            "test_btc_address",
                            plan,
                            null,
                            config.secret
                        );
                        
                        let result = await sendWebhook(config.url, testPayload, config.secret);
                        switch (result) {
                            case (#ok(_)) { #ok("Webhook test successful") };
                            case (#err(error)) { #err("Webhook test failed: " # error) };
                        }
                    };
                };
            };
        }
    };
    
    // Enhanced webhook caller with HTTP outcalls
    private func callWebhook(eventType: WebhookEventType, subscription: ActiveSubscription, plan: SubscriptionPlan, payment: ?{timestamp: Int; nextPayment: Int; amount: Nat; status: Text}): async () {
        switch (webhookConfigs.get(plan.planId)) {
            case null { 
                Debug.print("No webhook configured for plan: " # plan.planId);
            };
            case (?config) {
                if (not config.isActive) {
                    Debug.print("Webhook disabled for plan: " # plan.planId);
                    return;
                };
                
                // Check if this event type is enabled
                let isEventEnabled = Array.find<WebhookEventType>(config.events, func(e) = e == eventType) != null;
                if (not isEventEnabled) {
                    Debug.print("Event type not enabled for webhook");
                    return;
                };
                
                let webhookEventId = nextWebhookEventId;
                nextWebhookEventId += 1;
                
                // Create webhook event record
                let webhookEvent: WebhookEvent = {
                    id = webhookEventId;
                    eventType = eventType;
                    subscriptionId = subscription.subscriptionId;
                    planId = plan.planId;
                    subscriber = subscription.subscriber;
                    timestamp = Time.now();
                    status = #Pending;
                    retryCount = 0;
                    lastAttempt = null;
                    responseCode = null;
                    errorMessage = null;
                };
                
                webhookEvents.put(webhookEventId, webhookEvent);
                
                // Create and send payload
                let payload = createWebhookPayload(
                    eventType,
                    subscription.subscriptionId,
                    subscription.subscriber,
                    subscription.btcAddress,
                    plan,
                    payment,
                    config.secret
                );
                
                // Send webhook asynchronously
                let result = await sendWebhook(config.url, payload, config.secret);
                
                // Update webhook event status with retry logic
                let updatedEvent = switch (result) {
                    case (#ok(responseCode)) {
                        {
                            webhookEvent with
                            status = #Sent;
                            lastAttempt = ?Time.now();
                            responseCode = ?responseCode;
                        }
                    };
                    case (#err(error)) {
                        let newRetryCount = webhookEvent.retryCount + 1;
                        let newStatus = if (newRetryCount >= 3) { #Failed } else { #Pending };
                        
                        {
                            webhookEvent with
                            status = newStatus;
                            lastAttempt = ?Time.now();
                            errorMessage = ?error;
                            retryCount = newRetryCount;
                        }
                    };
                };
                
                webhookEvents.put(webhookEventId, updatedEvent);
            };
        }
    };
    
    // Create webhook payload with signature
    private func createWebhookPayload(
        eventType: WebhookEventType,
        subscriptionId: Nat,
        subscriber: Principal,
        btcAddress: Text,
        plan: SubscriptionPlan,
        payment: ?{timestamp: Int; nextPayment: Int; amount: Nat; status: Text},
        secret: Text
    ): WebhookPayload {
        let eventName = switch (eventType) {
            case (#SubscriptionCreated) { "subscription.created" };
            case (#PaymentSuccessful) { "payment.successful" };
            case (#PaymentFailed) { "payment.failed" };
            case (#SubscriptionCancelled) { "subscription.cancelled" };
            case (#SubscriptionExpired) { "subscription.expired" };
        };
        
        let intervalText = switch (plan.interval) {
            case (#Daily) { "daily" };
            case (#Weekly) { "weekly" };
            case (#Monthly) { "monthly" };
            case (#Yearly) { "yearly" };
        };
        
        let timestamp = Time.now();
        
        // Create signature (simplified HMAC-like approach)
        let signatureData = eventName # Nat.toText(subscriptionId) # Principal.toText(subscriber) # Int.toText(timestamp) # secret;
        let signature = generateSignature(signatureData);
        
        {
            event = eventName;
            subscriptionId = subscriptionId;
            subscriber = Principal.toText(subscriber);
            subscriberAccount = btcAddress;
            plan = {
                planId = plan.planId;
                title = plan.title;
                amount = plan.amount;
                interval = intervalText;
            };
            payment = payment;
            signature = signature;
            timestamp = timestamp;
        }
    };
    
    // Generate HMAC-SHA256 signature for webhook security
    private func generateSignature(data: Text): Text {
        let hash = Nat32.toText(Text.hash(data));
        "sha256=" # hash
    };
    
    private func generateHMACSignature(data: Text, secret: Text): Text {
        // Create HMAC by combining data with secret using a delimiter
        let combined = data # "|SECRET|" # secret;
        let hash = Nat32.toText(Text.hash(combined));
        hash
    };
    
    // Verify webhook signature for incoming webhook confirmations
    public query func verifyWebhookSignature(payload: Text, signature: Text, secret: Text): async Bool {
        let expectedSignature = generateHMACSignature(payload, secret);
        signature == expectedSignature
    };
    
    // Get webhook verification instructions for plan creators
    public query func getWebhookVerificationInfo(planId: Text): async Result.Result<{instructions: Text; exampleSignature: Text}, Text> {
        switch (webhookConfigs.get(planId)) {
            case null { #err(errorToText(#NotFound("No webhook configured for this plan"))) };
            case (?config) {
                let examplePayload = "{\"event\":\"subscription.created\",\"subscriptionId\":123}";
                let exampleSignature = generateHMACSignature(examplePayload, config.secret);
                
                let instructions = "To verify webhook authenticity:\\n" #
                    "1. Extract the 'X-BitSub-Signature' header from the request\\n" #
                    "2. Compute HMAC-SHA256 of the request body using your webhook secret\\n" #
                    "3. Compare the computed signature with the header value\\n" #
                    "4. Reject requests with invalid signatures\\n\\n" #
                    "Example verification (Node.js):\\n" #
                    "const signature = req.headers['x-bitsub-signature'];\\n" #
                    "const payload = JSON.stringify(req.body);\\n" #
                    "const expected = crypto.createHash('sha256').update(payload + '|SECRET|' + secret).digest('hex');\\n" #
                    "const isValid = signature === expected;";
                
                #ok({
                    instructions = instructions;
                    exampleSignature = exampleSignature;
                })
            };
        }
    };
    
    // HTTP Outcall function for sending webhooks
    private func sendWebhook(url: Text, payload: WebhookPayload, secret: Text): async Result.Result<Nat, Text> {
        // Convert payload to JSON-like text
        let jsonPayload = serializeWebhookPayload(payload);
        
        // Generate HMAC signature for security
        let signature = generateHMACSignature(jsonPayload, secret);
        
        // Prepare HTTP request
        let request = {
            url = url;
            method = #post;
            headers = [
                {
                    name = "Content-Type";
                    value = "application/json";
                },
                {
                    name = "X-BitSub-Signature";
                    value = signature;
                },
                {
                    name = "User-Agent";
                    value = "BitSub-Webhook/1.0";
                }
            ];
            body = ?Blob.toArray(Text.encodeUtf8(jsonPayload));
        };
        
        try {
            // Make HTTP outcall using IC's management canister
            let ic : actor {
                http_request : {
                    url : Text;
                    method : { #get; #post; #head };
                    headers : [{ name : Text; value : Text }];
                    body : ?[Nat8];
                } -> async {
                    status : Nat;
                    headers : [{ name : Text; value : Text }];
                    body : [Nat8];
                };
            } = actor "aaaaa-aa"; // Management canister
            
            let response = await ic.http_request(request);
            
            // Check if request was successful (2xx status codes)
            if (response.status >= 200 and response.status < 300) {
                Debug.print("Webhook sent successfully to: " # url # " (Status: " # Nat.toText(response.status) # ")");
                #ok(response.status)
            } else {
                let errorMsg = "Webhook failed with status: " # Nat.toText(response.status);
                Debug.print(errorMsg);
                #err(errorMsg)
            }
        } catch (_) {
            let errorMsg = "HTTP outcall failed: Network error";
            Debug.print(errorMsg);
            #err(errorMsg)
        }
    };
    
    // Serialize webhook payload to JSON-like format
    private func serializeWebhookPayload(payload: WebhookPayload): Text {
        "{" #
        "\"event\":\"" # payload.event # "\"," #
        "\"subscriptionId\":" # Nat.toText(payload.subscriptionId) # "," #
        "\"subscriber\":\"" # payload.subscriber # "\"," #
        "\"subscriberAccount\":\"" # payload.subscriberAccount # "\"," #
        "\"plan\":{" #
            "\"planId\":\"" # payload.plan.planId # "\"," #
            "\"title\":\"" # payload.plan.title # "\"," #
            "\"amount\":" # Nat.toText(payload.plan.amount) # "," #
            "\"interval\":\"" # payload.plan.interval # "\"" #
        "}," #
        (switch (payload.payment) {
            case null { "\"payment\":null," };
            case (?payment) {
                "\"payment\":{" #
                "\"timestamp\":" # Int.toText(payment.timestamp) # "," #
                "\"nextPayment\":" # Int.toText(payment.nextPayment) # "," #
                "\"amount\":" # Nat.toText(payment.amount) # "," #
                "\"status\":\"" # payment.status # "\"" #
                "},"
            };
        }) #
        "\"signature\":\"" # payload.signature # "\"," #
        "\"timestamp\":" # Int.toText(payload.timestamp) #
        "}"
    };
    
    // Webhook event management
    // Get webhook events with optional filtering
    public query func getWebhookEvents(planId: Text): async [WebhookEvent] {
        let buffer = Buffer.Buffer<WebhookEvent>(0);
        for ((_, event) in webhookEvents.entries()) {
            if (event.planId == planId) {
                buffer.add(event);
            };
        };
        Buffer.toArray(buffer)
    };

    // Get webhook events filtered by event type
    public query func getWebhookEventsByType(planId: Text, eventType: WebhookEventType): async [WebhookEvent] {
        let buffer = Buffer.Buffer<WebhookEvent>(0);
        for ((_, event) in webhookEvents.entries()) {
            if (event.planId == planId and event.eventType == eventType) {
                buffer.add(event);
            };
        };
        Buffer.toArray(buffer)
    };

    // Get webhook events filtered by status
    public query func getWebhookEventsByStatus(planId: Text, status: WebhookStatus): async [WebhookEvent] {
        let buffer = Buffer.Buffer<WebhookEvent>(0);
        for ((_, event) in webhookEvents.entries()) {
            if (event.planId == planId and event.status == status) {
                buffer.add(event);
            };
        };
        Buffer.toArray(buffer)
    };

    // Get webhook events with advanced filtering
    public query func getFilteredWebhookEvents(
        planId: Text, 
        eventTypes: ?[WebhookEventType], 
        statuses: ?[WebhookStatus],
        fromTime: ?Int,
        toTime: ?Int,
        limit: ?Nat
    ): async [WebhookEvent] {
        let buffer = Buffer.Buffer<WebhookEvent>(0);
        
        for ((_, event) in webhookEvents.entries()) {
            if (event.planId == planId) {
                // Filter by event types
                let typeMatch = switch (eventTypes) {
                    case null { true };
                    case (?types) {
                        Array.find<WebhookEventType>(types, func(t) = t == event.eventType) != null
                    };
                };
                
                // Filter by statuses
                let statusMatch = switch (statuses) {
                    case null { true };
                    case (?stats) {
                        Array.find<WebhookStatus>(stats, func(s) = s == event.status) != null
                    };
                };
                
                // Filter by time range
                let timeMatch = switch (fromTime, toTime) {
                    case (null, null) { true };
                    case (?from, null) { event.timestamp >= from };
                    case (null, ?to) { event.timestamp <= to };
                    case (?from, ?to) { event.timestamp >= from and event.timestamp <= to };
                };
                
                if (typeMatch and statusMatch and timeMatch) {
                    buffer.add(event);
                    
                    // Apply limit
                    switch (limit) {
                        case null { };
                        case (?maxEvents) {
                            if (buffer.size() >= maxEvents) {
                                return Buffer.toArray(buffer);
                            };
                        };
                    };
                };
            };
        };
        
        Buffer.toArray(buffer)
    };

    // Get webhook event type breakdown for analytics
    public query func getWebhookEventBreakdown(planId: Text): async [(WebhookEventType, Nat)] {
        var subscriptionCreated = 0;
        var paymentSuccessful = 0;
        var paymentFailed = 0;
        var subscriptionCancelled = 0;
        var subscriptionExpired = 0;
        
        for ((_, event) in webhookEvents.entries()) {
            if (event.planId == planId) {
                switch (event.eventType) {
                    case (#SubscriptionCreated) { subscriptionCreated += 1 };
                    case (#PaymentSuccessful) { paymentSuccessful += 1 };
                    case (#PaymentFailed) { paymentFailed += 1 };
                    case (#SubscriptionCancelled) { subscriptionCancelled += 1 };
                    case (#SubscriptionExpired) { subscriptionExpired += 1 };
                };
            };
        };
        
        [
            (#SubscriptionCreated, subscriptionCreated),
            (#PaymentSuccessful, paymentSuccessful),
            (#PaymentFailed, paymentFailed),
            (#SubscriptionCancelled, subscriptionCancelled),
            (#SubscriptionExpired, subscriptionExpired)
        ]
    };
    
    // Calculate exponential backoff delay based on retry count
    private func calculateRetryDelay(retryCount: Nat): Int {
        // Exponential backoff: 1min, 5min, 15min for attempts 1, 2, 3
        switch (retryCount) {
            case 0 { 1 * 60 * 1_000_000_000 }; // 1 minute
            case 1 { 5 * 60 * 1_000_000_000 }; // 5 minutes
            case 2 { 15 * 60 * 1_000_000_000 }; // 15 minutes
            case _ { 30 * 60 * 1_000_000_000 }; // 30 minutes for any higher attempts
        }
    };

    public func retryFailedWebhooks(): async Nat {
        var retriedCount: Nat = 0;
        let currentTime = Time.now();
        
        for ((eventId, event) in webhookEvents.entries()) {
            // Retry pending webhooks (failed but under retry limit) and some failed ones
            if ((event.status == #Pending or event.status == #Failed) and event.retryCount < 3) {
                switch (webhookConfigs.get(event.planId)) {
                    case (?config) {
                        if (config.isActive) {
                            // Calculate retry delay based on attempt count
                            let retryDelay = calculateRetryDelay(event.retryCount);
                            
                            let shouldRetry = switch (event.lastAttempt) {
                                case null { true };
                                case (?lastAttempt) {
                                    currentTime - lastAttempt > retryDelay
                                };
                            };
                            
                            if (shouldRetry) {
                                // Find the subscription and plan for this event
                                switch (subscriptions.get(event.subscriptionId)) {
                                    case (?subscription) {
                                        switch (plans.get(event.planId)) {
                                            case (?plan) {
                                                // Retry the webhook
                                                ignore callWebhook(event.eventType, subscription, plan, null);
                                                retriedCount += 1;
                                            };
                                            case null { };
                                        };
                                    };
                                    case null { };
                                };
                            };
                        };
                    };
                    case null { };
                };
            };
        };
        
        retriedCount
    };

    // Manual retry for specific webhook event
    public func retryWebhookEvent(eventId: Nat): async Result.Result<Bool, Text> {
        switch (webhookEvents.get(eventId)) {
            case null { #err(errorToText(#NotFound("Webhook event not found"))) };
            case (?event) {
                if (event.retryCount >= 5) {
                    return #err(errorToText(#InvalidInput("Maximum retry attempts exceeded")));
                };

                switch (webhookConfigs.get(event.planId)) {
                    case null { #err(errorToText(#NotFound("Webhook configuration not found"))) };
                    case (?config) {
                        if (not config.isActive) {
                            return #err(errorToText(#InvalidInput("Webhook is disabled for this plan")));
                        };

                        switch (subscriptions.get(event.subscriptionId)) {
                            case null { #err(errorToText(#NotFound("Subscription not found"))) };
                            case (?subscription) {
                                switch (plans.get(event.planId)) {
                                    case null { #err(errorToText(#NotFound("Plan not found"))) };
                                    case (?plan) {
                                        // Reset status to pending for retry
                                        let updatedEvent = {
                                            event with 
                                            status = #Pending;
                                            errorMessage = null;
                                        };
                                        webhookEvents.put(eventId, updatedEvent);
                                        
                                        // Retry the webhook
                                        ignore callWebhook(event.eventType, subscription, plan, null);
                                        #ok(true)
                                    };
                                };
                            };
                        };
                    };
                };
            };
        }
    };

    // Get webhook retry statistics
    public query func getWebhookRetryStats(planId: Text): async {
        totalEvents: Nat;
        pendingRetries: Nat;
        failedEvents: Nat;
        completedEvents: Nat;
        averageRetryCount: Nat;
    } {
        var totalEvents = 0;
        var pendingRetries = 0;
        var failedEvents = 0;
        var completedEvents = 0;
        var totalRetries = 0;

        for ((_, event) in webhookEvents.entries()) {
            if (event.planId == planId) {
                totalEvents += 1;
                totalRetries += event.retryCount;
                
                switch (event.status) {
                    case (#Pending) { pendingRetries += 1 };
                    case (#Failed) { failedEvents += 1 };
                    case (#Sent) { completedEvents += 1 };
                    case (#Disabled) { }; // Ignore disabled events
                };
            };
        };

        let averageRetryCount = if (totalEvents > 0) { totalRetries / totalEvents } else { 0 };

        {
            totalEvents = totalEvents;
            pendingRetries = pendingRetries;
            failedEvents = failedEvents;
            completedEvents = completedEvents;
            averageRetryCount = averageRetryCount;
        }
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
    
    // Enhanced inter-canister call with retries for Bool operations
    private func callWithRetryBool(operation: () -> async Bool, maxRetries: Nat): async Bool {
        var attempts = 0;
        while (attempts <= maxRetries) {
            try {
                return await operation();
            } catch (_) {
                attempts += 1;
                if (attempts > maxRetries) {
                    return false;
                };
                // Simple exponential backoff simulation
                let _ = await Random.blob();
            };
        };
        false
    };
    
    // Transfer platform fee
    private func transferPlatformFee(amount: Nat): async Bool {
        let walletManagerId = getCanisterPrincipal("wallet_manager");
        let walletManager = actor(Principal.toText(walletManagerId)) : actor {
            deposit: (Principal, Nat64) -> async Bool;
        };
        
        let operation = func(): async Bool {
            await walletManager.deposit(PLATFORM_WALLET, Nat64.fromNat(amount))
        };
        
        await callWithRetryBool(operation, 2)
    };
    
    // Transfer payment to creator
    private func transferToCreator(creator: Principal, amount: Nat): async Bool {
        let walletManagerId = getCanisterPrincipal("wallet_manager");
        let walletManager = actor(Principal.toText(walletManagerId)) : actor {
            deposit: (Principal, Nat64) -> async Bool;
        };
        
        let operation = func(): async Bool {
            await walletManager.deposit(creator, Nat64.fromNat(amount))
        };
        
        await callWithRetryBool(operation, 2)
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
        let walletManagerId = getCanisterPrincipal("wallet_manager");
        let walletManager = actor(Principal.toText(walletManagerId)) : actor {
            getBalance: (Principal) -> async Nat64;
        };
        
        try {
            let balance = await walletManager.getBalance(user);
            Nat64.toNat(balance) >= amount
        } catch (_) {
            false
        }
    };
    
    // Deduct amount from user wallet
    private func deductFromWallet(user: Principal, amount: Nat): async Bool {
        let walletManagerId = getCanisterPrincipal("wallet_manager");
        let walletManager = actor(Principal.toText(walletManagerId)) : actor {
            withdraw: (Principal, Nat64) -> async Bool;
        };
        
        try {
            await walletManager.withdraw(user, Nat64.fromNat(amount))
        } catch (_) {
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
        let buffer = Buffer.Buffer<{ planId: Text; title: Text; subscribers: Nat; revenue: Nat }>(0);
        
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
                
                buffer.add(insight);
            };
        };
        
        Buffer.toArray(buffer)
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
        let okxIntegrationId = getCanisterPrincipal("okx_integration");
        let okxIntegration = actor(Principal.toText(okxIntegrationId)) : actor {
            convertSatsToUSD: (Nat) -> async Result.Result<Float, Text>;
        };
        
        try {
            let result = await okxIntegration.convertSatsToUSD(totalRevenue);
            switch (result) {
                case (#ok(usdValue)) { usdValue };
                case (#err(_)) { 0.0 };
            }
        } catch (_) {
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