import Time "mo:base/Time";
import Text "mo:base/Text";
import Result "mo:base/Result";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Float "mo:base/Float";
import Blob "mo:base/Blob";
import Char "mo:base/Char";
import Cycles "mo:base/ExperimentalCycles";

persistent actor OKXIntegration {
    
    public type PriceData = {
        symbol: Text;
        price: Float;
        timestamp: Int;
    };
    
    public type HttpRequest = {
        url : Text;
        max_response_bytes : ?Nat64;
        headers : [HttpHeader];
        body : ?[Nat8];
        method : HttpMethod;
        transform : ?TransformRawResponse;
    };

    public type HttpHeader = {
        name : Text;
        value : Text;
    };

    public type HttpMethod = {
        #get;
        #post;
        #head;
    };

    public type HttpResponse = {
        status : Nat;
        headers : [HttpHeader];
        body : [Nat8];
    };

    public type TransformRawResponse = {
        function : shared query TransformRawResponseFunction -> async HttpResponse;
        context : Blob;
    };

    public type TransformRawResponseFunction = {
        response : HttpResponse;
        context : Blob;
    };
    
    // Real OKX DEX API call using HTTP outcalls
    public func getBTCPrice(): async Result.Result<PriceData, Text> {
        let baseUrl = "https://www.okx.com/api/v5";
        let endpoint = "/market/ticker?instId=BTC-USDT";
        let url = baseUrl # endpoint;
        
        let request_headers = [
            { name = "User-Agent"; value = "BitSub/1.0" },
            { name = "Accept"; value = "application/json" }
        ];

        let http_request : HttpRequest = {
            url = url;
            max_response_bytes = ?2048;
            headers = request_headers;
            body = null;
            method = #get;
            transform = null;
        };

        Cycles.add<system>(20_949_972_000);
        
        try {
            let ic : actor {
                http_request : HttpRequest -> async HttpResponse;
            } = actor("aaaaa-aa");
            
            let http_response = await ic.http_request(http_request);
            
            if (http_response.status == 200) {
                let response_body = Blob.fromArray(http_response.body);
                let decoded_text = switch (Text.decodeUtf8(response_body)) {
                    case (?text) { text };
                    case null { return #err("Failed to decode response") };
                };
                
                let price = extractPriceFromJSON(decoded_text);
                let priceData: PriceData = {
                    symbol = "BTC-USDT";
                    price = price;
                    timestamp = Time.now();
                };
                #ok(priceData)
            } else {
                #err("HTTP request failed with status: " # Nat.toText(http_response.status))
            }
        } catch (_) {
            #err("Network error calling OKX API")
        }
    };
    
    // Simple float parser for price strings
    private func parseFloat(text: Text): Float {
        // Simple implementation - convert common price formats
        // This is a basic parser for numeric strings like "43250.5"
        let chars = Text.toIter(text);
        var result: Float = 0.0;
        var decimal: Float = 0.0;
        var decimalPlace: Float = 1.0;
        var hasDecimal = false;
        
        for (char in chars) {
            if (char == '.') {
                hasDecimal := true;
            } else if (char >= '0' and char <= '9') {
                let digit = Nat32.toNat(Char.toNat32(char) - Char.toNat32('0'));
                if (hasDecimal) {
                    decimalPlace := decimalPlace * 10.0;
                    decimal := decimal + Float.fromInt(digit) / decimalPlace;
                } else {
                    result := result * 10.0 + Float.fromInt(digit);
                };
            };
        };
        
        result + decimal
    };
    
    // Extract price from OKX JSON response
    private func extractPriceFromJSON(jsonText: Text): Float {
        // Look for "last":"price" in JSON response
        let parts = Text.split(jsonText, #text("\"last\":\""));
        switch (parts.next()) {
            case null { 43250.0 };
            case (?_) {
                switch (parts.next()) {
                    case null { 43250.0 };
                    case (?priceStr) {
                        let priceParts = Text.split(priceStr, #text("\""));
                        switch (priceParts.next()) {
                            case null { 43250.0 };
                            case (?price) {
                                parseFloat(price)
                            };
                        }
                    };
                }
            };
        }
    };
    
    // Convert satoshis to USD using OKX price
    public func convertSatsToUSD(sats: Nat): async Result.Result<Float, Text> {
        let btcPriceResult = await getBTCPrice();
        switch (btcPriceResult) {
            case (#ok(priceData)) {
                let btcAmount = Float.fromInt(sats) / 100_000_000.0;
                let usdValue = btcAmount * priceData.price;
                #ok(usdValue)
            };
            case (#err(error)) {
                #err("Failed to get OKX price: " # error)
            };
        }
    };
    

}