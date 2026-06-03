import { Connection, Keypair } from "@solana/web3.js";
import { MPPConfig, RequestOptions } from "./types";

export class MPPSession {
  private wallet: Keypair;
  private deposit: number;
  private connection: Connection;

  constructor(config: MPPConfig) {
    this.wallet = config.wallet;
    this.deposit = config.deposit || 0;
    
    // Default to mainnet if not provided
    this.connection = config.connection || new Connection("https://api.mainnet-beta.solana.com");
  }

  /**
   * Automatically intercepts HTTP 402 and performs off-chain signatures or on-chain payments
   */
  public async request<T = any>(options: RequestOptions): Promise<T> {
    // 1. Perform initial request
    const response = await fetch(options.url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Wallet": this.wallet.publicKey.toBase58(),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (response.status === 402) {
      return this.handlePaymentChallenge(response, options);
    }

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    return response.json();
  }

  private async handlePaymentChallenge(failedResponse: Response, originalOptions: RequestOptions) {
    console.log("⚠️ [MPP SDK] Intercepted HTTP 402 Payment Required.");
    
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

    console.log(`💸 [MPP SDK] Executing autonomous payment of ${amount} lamports to ${recipient}...`);

    try {
      // 1. Build Solana Transaction
      const { PublicKey, SystemProgram, Transaction } = await import("@solana/web3.js");
      const toPublicKey = new PublicKey(recipient);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey,
          toPubkey: toPublicKey,
          lamports: Number(amount),
        })
      );

      // 2. Fetch blockhash and sign
      const { blockhash } = await this.connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      transaction.sign(this.wallet);

      // 3. Send and confirm transaction
      const signature = await this.connection.sendRawTransaction(transaction.serialize());
      console.log(`✅ [MPP SDK] Payment sent! Signature: ${signature}`);
      
      // Await confirmation (optional but recommended for strong consistency)
      await this.connection.confirmTransaction(signature, "confirmed");

      console.log("🔄 [MPP SDK] Retrying original request with payment proof...");

      // 4. Retry request with payment proof
      const retryResponse = await fetch(originalOptions.url, {
        method: originalOptions.method || "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet": this.wallet.publicKey.toBase58(),
          "X-Payment-Proof": signature,
          ...originalOptions.headers,
        },
        body: originalOptions.body ? JSON.stringify(originalOptions.body) : undefined,
      });

      if (!retryResponse.ok) {
        throw new Error(`Payment proof rejected. Status: ${retryResponse.status}`);
      }

      return retryResponse.json();
    } catch (error) {
      console.error("❌ [MPP SDK] Autonomous payment failed:", error);
      throw error;
    }
  }
}
