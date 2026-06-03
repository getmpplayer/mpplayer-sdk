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
    // Parse challenge (e.g. required amount, destination address)
    // const challenge = await failedResponse.json();

    console.log("⚠️ [MPP SDK] Intercepted HTTP 402 Payment Required. Executing payment automatically...");
    
    // Simulate payment logic:
    // 1. Check escrow balance or build Solana Transaction
    // 2. Sign transaction with this.wallet
    // 3. Send and confirm transaction -> get signature
    const mockSignature = "3xMockSignature...xyz"; 

    // Retry request with payment proof
    const retryResponse = await fetch(originalOptions.url, {
      method: originalOptions.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Wallet": this.wallet.publicKey.toBase58(),
        "X-Payment-Proof": mockSignature,
        ...originalOptions.headers,
      },
      body: originalOptions.body ? JSON.stringify(originalOptions.body) : undefined,
    });

    if (!retryResponse.ok) {
      throw new Error(`Payment failed or rejected. Status: ${retryResponse.status}`);
    }

    return retryResponse.json();
  }
}
