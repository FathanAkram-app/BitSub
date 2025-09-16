import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import Char "mo:base/Char";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";

module {
    public module Address {
        public func p2wpkh(network : { #mainnet; #testnet }, publicKey : Blob) : Text {
            let hrp = switch (network) {
                case (#mainnet) { "bc" };
                case (#testnet) { "tb" };
            };

            let program = hash160(Blob.toArray(publicKey));
            let data = toWitnessData(0 : Nat8, program);
            Bech32.encode(hrp, data);
        };
    };

    func hash160(data : [Nat8]) : [Nat8] {
        let sha = Sha256.hash(data);
        Ripemd160.hash(sha);
    };

    func toWitnessData(version : Nat8, program : [Nat8]) : [Nat8] {
        let converted = convertBits(program, 8, 5, true);
        let buffer = Buffer.Buffer<Nat8>(1 + converted.size());
        buffer.add(version);
        for (value in converted.vals()) {
            buffer.add(value);
        };
        Buffer.toArray(buffer);
    };

    func convertBits(data : [Nat8], fromBits : Nat, toBits : Nat, pad : Bool) : [Nat8] {
        var acc : Nat = 0;
        var bits : Nat = 0;
        let maxv : Nat = (1 << toBits) - 1;
        let maxInput : Nat = 1 << fromBits;
        let result = Buffer.Buffer<Nat8>(data.size() * fromBits / toBits + 1);

        for (value in data.vals()) {
            let v = Nat8.toNat(value);
            assert (v < maxInput);
            acc := (acc << fromBits) | v;
            bits += fromBits;

            while (bits >= toBits) {
                bits -= toBits;
                let out = (acc >> bits) & maxv;
                result.add(Nat8.fromNat(out));
            };
        };

        if (pad) {
            if (bits > 0) {
                let out = (acc << (toBits - bits)) & maxv;
                result.add(Nat8.fromNat(out));
            };
        } else {
            assert (bits < fromBits);
            assert (((acc << (toBits - bits)) & maxv) == 0);
        };

        Buffer.toArray(result);
    };

    module Sha256 {
        let initial : [Nat32] = [
            0x6a09e667 : Nat32,
            0xbb67ae85 : Nat32,
            0x3c6ef372 : Nat32,
            0xa54ff53a : Nat32,
            0x510e527f : Nat32,
            0x9b05688c : Nat32,
            0x1f83d9ab : Nat32,
            0x5be0cd19 : Nat32,
        ];

        let k : [Nat32] = [
            0x428a2f98 : Nat32, 0x71374491 : Nat32, 0xb5c0fbcf : Nat32, 0xe9b5dba5 : Nat32,
            0x3956c25b : Nat32, 0x59f111f1 : Nat32, 0x923f82a4 : Nat32, 0xab1c5ed5 : Nat32,
            0xd807aa98 : Nat32, 0x12835b01 : Nat32, 0x243185be : Nat32, 0x550c7dc3 : Nat32,
            0x72be5d74 : Nat32, 0x80deb1fe : Nat32, 0x9bdc06a7 : Nat32, 0xc19bf174 : Nat32,
            0xe49b69c1 : Nat32, 0xefbe4786 : Nat32, 0x0fc19dc6 : Nat32, 0x240ca1cc : Nat32,
            0x2de92c6f : Nat32, 0x4a7484aa : Nat32, 0x5cb0a9dc : Nat32, 0x76f988da : Nat32,
            0x983e5152 : Nat32, 0xa831c66d : Nat32, 0xb00327c8 : Nat32, 0xbf597fc7 : Nat32,
            0xc6e00bf3 : Nat32, 0xd5a79147 : Nat32, 0x06ca6351 : Nat32, 0x14292967 : Nat32,
            0x27b70a85 : Nat32, 0x2e1b2138 : Nat32, 0x4d2c6dfc : Nat32, 0x53380d13 : Nat32,
            0x650a7354 : Nat32, 0x766a0abb : Nat32, 0x81c2c92e : Nat32, 0x92722c85 : Nat32,
            0xa2bfe8a1 : Nat32, 0xa81a664b : Nat32, 0xc24b8b70 : Nat32, 0xc76c51a3 : Nat32,
            0xd192e819 : Nat32, 0xd6990624 : Nat32, 0xf40e3585 : Nat32, 0x106aa070 : Nat32,
            0x19a4c116 : Nat32, 0x1e376c08 : Nat32, 0x2748774c : Nat32, 0x34b0bcb5 : Nat32,
            0x391c0cb3 : Nat32, 0x4ed8aa4a : Nat32, 0x5b9cca4f : Nat32, 0x682e6ff3 : Nat32,
            0x748f82ee : Nat32, 0x78a5636f : Nat32, 0x84c87814 : Nat32, 0x8cc70208 : Nat32,
            0x90befffa : Nat32, 0xa4506ceb : Nat32, 0xbef9a3f7 : Nat32, 0xc67178f2 : Nat32,
        ];

        let mask32 : Nat32 = 0xffff_ffff : Nat32;

        func pad(data : [Nat8]) : [Nat8] {
            let len = data.size();
            let bitLen = Nat64.fromNat(len) * Nat64.fromNat(8);
            let buffer = Buffer.Buffer<Nat8>(len + 64);

            for (b in data.vals()) {
                buffer.add(b);
            };

            buffer.add(0x80 : Nat8);
            while (((buffer.size() + 8) % 64) != 0) {
                buffer.add(0 : Nat8);
            };

            let mask : Nat64 = 0xff : Nat64;
            var i : Nat = 0;
            while (i < 8) {
                let shift = 8 * (7 - i);
                let byte = Nat8.fromNat(Nat64.toNat((bitLen >> shift) & mask));
                buffer.add(byte);
                i += 1;
            };

            Buffer.toArray(buffer);
        };

        func rotr(value : Nat32, shift : Nat) : Nat32 {
            let s = shift % 32;
            if (s == 0) {
                value
            } else {
                let leftAmount32 = Nat32.fromNat(32);
                let s32 = Nat32.fromNat(s);
                let rightAmount = Nat32.toNat(leftAmount32 - s32);
                (value >> s) | (value << rightAmount)
            };
        };

        func toNat32(data : [Nat8], offset : Nat) : Nat32 {
            let base = offset * 4;
            let b0 = Nat8.toNat(data[base]);
            let b1 = Nat8.toNat(data[base + 1]);
            let b2 = Nat8.toNat(data[base + 2]);
            let b3 = Nat8.toNat(data[base + 3]);
            Nat32.fromNat((b0 << 24) | (b1 << 16) | (b2 << 8) | b3);
        };

        func byteAt(value : Nat32, index : Nat) : Nat8 {
            let shift = 8 * (3 - index);
            let mask : Nat32 = 0xff : Nat32;
            let shifted = (value >> shift) & mask;
            Nat8.fromNat(Nat32.toNat(shifted));
        };

        func not32(value : Nat32) : Nat32 {
            value ^ mask32;
        };

        public func hash(data : [Nat8]) : [Nat8] {
            let padded = pad(data);
            var h = Array.tabulate<Nat32>(initial.size(), func(i : Nat) : Nat32 { initial[i] });

            var offset : Nat = 0;
            while (offset < padded.size()) {
                var w = Array.init<Nat32>(64, 0 : Nat32);
                let chunkIndex = offset / 4;
                var i : Nat = 0;
                while (i < 16) {
                    w[i] := toNat32(padded, chunkIndex + i);
                    i += 1;
                };

                i := 16;
                while (i < 64) {
                    let s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >> 3);
                    let s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >> 10);
                    w[i] := w[i - 16] + s0 + w[i - 7] + s1;
                    i += 1;
                };

                var a = h[0];
                var b = h[1];
                var c = h[2];
                var d = h[3];
                var e = h[4];
                var f = h[5];
                var g = h[6];
                var temp = h[7];

                var j : Nat = 0;
                while (j < 64) {
                    let s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
                    let ch = (e & f) ^ (not32(e) & g);
                    let t1 = temp + s1 + ch + k[j] + w[j];
                    let s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
                    let maj = (a & b) ^ (a & c) ^ (b & c);
                    let t2 = s0 + maj;

                    temp := g;
                    g := f;
                    f := e;
                    e := d + t1;
                    d := c;
                    c := b;
                    b := a;
                    a := t1 + t2;
                    j += 1;
                };

                h[0] := h[0] + a;
                h[1] := h[1] + b;
                h[2] := h[2] + c;
                h[3] := h[3] + d;
                h[4] := h[4] + e;
                h[5] := h[5] + f;
                h[6] := h[6] + g;
                h[7] := h[7] + temp;

                offset += 64;
            };

            let buffer = Buffer.Buffer<Nat8>(32);
            var idx : Nat = 0;
            while (idx < h.size()) {
                buffer.add(byteAt(h[idx], 0));
                buffer.add(byteAt(h[idx], 1));
                buffer.add(byteAt(h[idx], 2));
                buffer.add(byteAt(h[idx], 3));
                idx += 1;
            };

            Buffer.toArray(buffer);
        };
    };

    module Ripemd160 {
        let initial : [Nat32] = [
            0x67452301 : Nat32,
            0xefcdab89 : Nat32,
            0x98badcfe : Nat32,
            0x10325476 : Nat32,
            0xc3d2e1f0 : Nat32,
        ];

        let r : [Nat8] = [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
            7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8,
            3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12,
            1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2,
            4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13,
        ];

        let rr : [Nat8] = [
            5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12,
            6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2,
            15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 13, 4,
            8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14,
            12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11,
        ];

        let s : [Nat8] = [
            11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8,
            7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12,
            11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5,
            11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12,
            9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6,
        ];

        let ss : [Nat8] = [
            8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6,
            9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11,
            9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5,
            15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8,
            8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11,
        ];

        let k : [Nat32] = [
            0x00000000 : Nat32,
            0x5a827999 : Nat32,
            0x6ed9eba1 : Nat32,
            0x8f1bbcdc : Nat32,
            0xa953fd4e : Nat32,
        ];

        let kk : [Nat32] = [
            0x50a28be6 : Nat32,
            0x5c4dd124 : Nat32,
            0x6d703ef3 : Nat32,
            0x7a6d76e9 : Nat32,
            0x00000000 : Nat32,
        ];

        let mask32 : Nat32 = 0xffffffff : Nat32;

        func pad(data : [Nat8]) : [Nat8] {
            let len = data.size();
            let bitLen = Nat64.fromNat(len) * Nat64.fromNat(8);
            let buffer = Buffer.Buffer<Nat8>(len + 64);

            for (b in data.vals()) {
                buffer.add(b);
            };

            buffer.add(0x80 : Nat8);
            while ((buffer.size() % 64) != 56) {
                buffer.add(0 : Nat8);
            };

            let mask : Nat64 = 0xff : Nat64;
            var i : Nat = 0;
            while (i < 8) {
                let shift = 8 * i;
                let byte = Nat8.fromNat(Nat64.toNat((bitLen >> shift) & mask));
                buffer.add(byte);
                i += 1;
            };

            Buffer.toArray(buffer);
        };

        func rol(value : Nat32, shift : Nat) : Nat32 {
            let s = shift % 32;
            if (s == 0) {
                value
            } else {
                let s32 = Nat32.fromNat(s);
                let rightAmount = Nat32.toNat(Nat32.fromNat(32) - s32);
                (value << s) | (value >> rightAmount)
            };
        };

        func not32(value : Nat32) : Nat32 {
            value ^ mask32;
        };

        func f(j : Nat, x : Nat32, y : Nat32, z : Nat32) : Nat32 {
            if (j <= 15) {
                x ^ y ^ z
            } else if (j <= 31) {
                (x & y) | (not32(x) & z)
            } else if (j <= 47) {
                (x | not32(y)) ^ z
            } else if (j <= 63) {
                (x & z) | (y & not32(z))
            } else {
                x ^ (y | not32(z))
            };
        };

        func kValue(j : Nat) : Nat32 {
            if (j <= 15) {
                k[0]
            } else if (j <= 31) {
                k[1]
            } else if (j <= 47) {
                k[2]
            } else if (j <= 63) {
                k[3]
            } else {
                k[4]
            };
        };

        func kkValue(j : Nat) : Nat32 {
            if (j <= 15) {
                kk[0]
            } else if (j <= 31) {
                kk[1]
            } else if (j <= 47) {
                kk[2]
            } else if (j <= 63) {
                kk[3]
            } else {
                kk[4]
            };
        };

        func toNat32(data : [Nat8], offset : Nat) : Nat32 {
            let base = offset * 4;
            let b0 = Nat8.toNat(data[base]);
            let b1 = Nat8.toNat(data[base + 1]);
            let b2 = Nat8.toNat(data[base + 2]);
            let b3 = Nat8.toNat(data[base + 3]);
            Nat32.fromNat(b0 | (b1 << 8) | (b2 << 16) | (b3 << 24));
        };

        func toBytes(value : Nat32) : [Nat8] {
            let mask : Nat32 = 0xff : Nat32;
            [
                Nat8.fromNat(Nat32.toNat(value & mask)),
                Nat8.fromNat(Nat32.toNat((value >> 8) & mask)),
                Nat8.fromNat(Nat32.toNat((value >> 16) & mask)),
                Nat8.fromNat(Nat32.toNat((value >> 24) & mask)),
            ];
        };

        public func hash(data : [Nat8]) : [Nat8] {
            let padded = pad(data);
            var h = Array.tabulate<Nat32>(initial.size(), func(i : Nat) : Nat32 { initial[i] });

            var offset : Nat = 0;
            while (offset < padded.size()) {
                var w = Array.init<Nat32>(16, 0 : Nat32);
                let chunkIndex = offset / 4;
                var i : Nat = 0;
                while (i < 16) {
                    w[i] := toNat32(padded, chunkIndex + i);
                    i += 1;
                };

                var a1 = h[0];
                var b1 = h[1];
                var c1 = h[2];
                var d1 = h[3];
                var e1 = h[4];

                var a2 = h[0];
                var b2 = h[1];
                var c2 = h[2];
                var d2 = h[3];
                var e2 = h[4];

                var j : Nat = 0;
                while (j < 80) {
                    let idx = Nat8.toNat(r[j]);
                    let sVal = Nat8.toNat(s[j]);
                    let t = rol(a1 + f(j, b1, c1, d1) + w[idx] + kValue(j), sVal) + e1;
                    a1 := e1;
                    e1 := d1;
                    d1 := rol(c1, 10);
                    c1 := b1;
                    b1 := t;

                    let idx2 = Nat8.toNat(rr[j]);
                    let sVal2 = Nat8.toNat(ss[j]);
                    let t2 = rol(a2 + f(79 - j, b2, c2, d2) + w[idx2] + kkValue(j), sVal2) + e2;
                    a2 := e2;
                    e2 := d2;
                    d2 := rol(c2, 10);
                    c2 := b2;
                    b2 := t2;

                    j += 1;
                };

                let t = h[1] + c1 + d2;
                h[1] := h[2] + d1 + e2;
                h[2] := h[3] + e1 + a2;
                h[3] := h[4] + a1 + b2;
                h[4] := h[0] + b1 + c2;
                h[0] := t;

                offset += 64;
            };

            let buffer = Buffer.Buffer<Nat8>(20);
            var idx : Nat = 0;
            while (idx < h.size()) {
                let bytes = toBytes(h[idx]);
                for (b in bytes.vals()) {
                    buffer.add(b);
                };
                idx += 1;
            };

            Buffer.toArray(buffer);
        };
    };

    module Bech32 {
        let charset : [Char] = [
            'q', 'p', 'z', 'r', 'y', '9', 'x', '8',
            'g', 'f', '2', 't', 'v', 'd', 'w', '0',
            's', '3', 'j', 'n', '5', '4', 'k', 'h',
            'c', 'e', '6', 'm', 'u', 'a', '7', 'l',
        ];
        let generator : [Nat] = [
            0x3b6a57b2,
            0x26508e6d,
            0x1ea119fa,
            0x3d4233dd,
            0x2a1462b3,
        ];

        func hrpExpand(hrp : Text) : [Nat8] {
            let chars = Iter.toArray(hrp.chars());
            let buf = Buffer.Buffer<Nat8>(chars.size() * 2 + 1);
            for (c in chars.vals()) {
                let code = Nat32.toNat(Char.toNat32(c));
                buf.add(Nat8.fromNat(code >> 5));
            };
            buf.add(0 : Nat8);
            for (c in chars.vals()) {
                let code = Nat32.toNat(Char.toNat32(c));
                buf.add(Nat8.fromNat(code & 31));
            };
            Buffer.toArray(buf);
        };

        func polymod(values : [Nat8]) : Nat {
            var chk : Nat = 1;
            for (v in values.vals()) {
                let top = chk >> 25;
                chk := ((chk & 0x1ffffff) << 5) ^ Nat8.toNat(v);
                var i : Nat = 0;
                while (i < generator.size()) {
                    if (((top >> i) & 1) == 1) {
                        chk ^= generator[i];
                    };
                    i += 1;
                };
            };
            chk;
        };

        func createChecksum(hrp : Text, data : [Nat8]) : [Nat8] {
            let zeros : [Nat8] = Array.tabulate<Nat8>(6, func(_ : Nat) : Nat8 { 0 });
            let values = Array.append<Nat8>(hrpExpand(hrp), Array.append<Nat8>(data, zeros));
            let pm = polymod(values) ^ 1;
            Array.tabulate<Nat8>(6, func(i : Nat) : Nat8 {
                let shift = 5 * (5 - i);
                Nat8.fromNat((pm >> shift) & 31);
            });
        };

        public func encode(hrp : Text, data : [Nat8]) : Text {
            let checksum = createChecksum(hrp, data);
            let combined = Array.append<Nat8>(data, checksum);
            var hrpLen : Nat = 0;
            for (_ in hrp.chars()) {
                hrpLen += 1;
            };
            let capacity = combined.size() + 1 + hrpLen;
            let builder = Buffer.Buffer<Char>(capacity);
            for (c in hrp.chars()) {
                builder.add(c);
            };
            builder.add('1');
            for (value in combined.vals()) {
                builder.add(charset[Nat8.toNat(value)]);
            };
            Text.fromIter(builder.vals());
        };
    };
};
