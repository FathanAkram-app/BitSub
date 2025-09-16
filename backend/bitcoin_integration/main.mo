import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat64 "mo:base/Nat64";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Bitcoin "./Bitcoin";

// Simple Bitcoin integration canister that connects to the
// Internet Computer's Bitcoin API on mainnet. This canister
// exposes helpers for creating addresses, checking balances and
// broadcasting transactions.

actor BitcoinIntegration {
    // Types for interacting with the management canister's
    // Bitcoin interface
    public type Network = { #mainnet; #testnet };
    public type GetBalanceRequest = {
        network : Network;
        address : Text;
    };
    public type GetBalanceResponse = Nat64;

    public type SendTransactionRequest = {
        network : Network;
        transaction : Blob;
    };

    public type EcdsaKeyId = {
        curve : { #secp256k1 };
        name : Text;
    };

    public type EcdsaPublicKeyArgument = {
        canister_id : ?Principal;
        derivation_path : [Blob];
        key_id : EcdsaKeyId;
    };

    public type EcdsaPublicKeyResponse = {
        public_key : Blob;
        chain_code : Blob;
    };

    // Interface for the management canister
    let ic : actor {
        bitcoin_get_balance : GetBalanceRequest -> async GetBalanceResponse;
        bitcoin_send_transaction : SendTransactionRequest -> async ();
        ecdsa_public_key : EcdsaPublicKeyArgument -> async EcdsaPublicKeyResponse;
    } = actor("aaaaa-aa");

    // Name of the ECDSA key to use. On a local replica this key is
    // automatically provisioned. On mainnet the key must be requested
    // via an NNS proposal.
    let KEY_NAME : Text = "dfx_test_key";

    // Derive a new Bitcoin mainnet address for the given numeric id.
    // The id can represent a subscription or user and is used as the
    // derivation path component so each call yields a unique address.
    public func generateAddress(id : Nat) : async Text {
        let path : [Blob] = [Blob.fromArray(Array.reverse(Array.tabulate<Nat8>(8, func(i) {
            Nat8.fromNat((id >> (i * 8)) & 0xff)
        })))];

        let key = await ic.ecdsa_public_key({
            canister_id = null;
            derivation_path = path;
            key_id = { name = KEY_NAME; curve = #secp256k1 };
        });

        // Convert the public key to a P2WPKH address. The Bitcoin
        // Motoko library is available in dfx starting from version
        // 0.15.0. We use it to compute a bech32 address.
        let address = Bitcoin.Address.p2wpkh(#mainnet, key.public_key);
        address;
    };

    // Return the balance for the given Bitcoin address on mainnet.
    public func getBalance(address : Text) : async Nat64 {
        await ic.bitcoin_get_balance({
            network = #mainnet;
            address = address;
        })
    };

    // Broadcast a raw transaction (as bytes) to the Bitcoin mainnet.
    public func sendTransaction(rawTx : Blob) : async Result.Result<(), Text> {
        try {
            await ic.bitcoin_send_transaction({
                network = #mainnet;
                transaction = rawTx;
            });
            #ok(())
        } catch (e) {
            #err("Failed to send transaction")
        }
    };
}
