var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/session.ts
var session_exports = {};
__export(session_exports, {
  MPPSession: () => MPPSession
});
import { Connection } from "@solana/web3.js";
var MPPSession;
var init_session = __esm({
  "src/session.ts"() {
    "use strict";
    MPPSession = class {
      wallet;
      deposit;
      connection;
      constructor(config) {
        this.wallet = config.wallet;
        this.deposit = config.deposit || 0;
        this.connection = config.connection || new Connection("https://api.mainnet-beta.solana.com");
      }
      /**
       * Automatically intercepts HTTP 402 and performs off-chain signatures or on-chain payments
       */
      async request(options) {
        const response = await fetch(options.url, {
          method: options.method || "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Wallet": this.wallet.publicKey.toBase58(),
            ...options.headers
          },
          body: options.body ? JSON.stringify(options.body) : void 0
        });
        if (response.status === 402) {
          return this.handlePaymentChallenge(response, options);
        }
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        return response.json();
      }
      async handlePaymentChallenge(failedResponse, originalOptions) {
        console.log("\u26A0\uFE0F [MPP SDK] Intercepted HTTP 402 Payment Required.");
        let challenge;
        try {
          challenge = await failedResponse.json();
        } catch (e) {
          throw new Error("Invalid 402 response format. Expected JSON challenge.");
        }
        const { amount, recipient } = challenge;
        if (!amount || !recipient) {
          throw new Error("Invalid 402 challenge: missing 'amount' or 'recipient'.");
        }
        console.log(`\u{1F4B8} [MPP SDK] Executing autonomous payment of ${amount} lamports to ${recipient}...`);
        try {
          const { PublicKey, SystemProgram, Transaction } = await import("@solana/web3.js");
          const toPublicKey = new PublicKey(recipient);
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: this.wallet.publicKey,
              toPubkey: toPublicKey,
              lamports: Number(amount)
            })
          );
          const { blockhash } = await this.connection.getLatestBlockhash("confirmed");
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = this.wallet.publicKey;
          transaction.sign(this.wallet);
          const signature = await this.connection.sendRawTransaction(transaction.serialize());
          console.log(`\u2705 [MPP SDK] Payment sent! Signature: ${signature}`);
          await this.connection.confirmTransaction(signature, "confirmed");
          console.log("\u{1F504} [MPP SDK] Retrying original request with payment proof...");
          const retryResponse = await fetch(originalOptions.url, {
            method: originalOptions.method || "GET",
            headers: {
              "Content-Type": "application/json",
              "X-Wallet": this.wallet.publicKey.toBase58(),
              "X-Payment-Proof": signature,
              ...originalOptions.headers
            },
            body: originalOptions.body ? JSON.stringify(originalOptions.body) : void 0
          });
          if (!retryResponse.ok) {
            throw new Error(`Payment proof rejected. Status: ${retryResponse.status}`);
          }
          return retryResponse.json();
        } catch (error) {
          console.error("\u274C [MPP SDK] Autonomous payment failed:", error);
          throw error;
        }
      }
    };
  }
});

// src/index.ts
init_session();
var MPP = {
  createSession: async (config) => {
    const { MPPSession: MPPSession2 } = await Promise.resolve().then(() => (init_session(), session_exports));
    return new MPPSession2(config);
  }
};
export {
  MPP,
  MPPSession
};
//# sourceMappingURL=index.mjs.map