import { MPP } from "../src/index";
import { Keypair } from "@solana/web3.js";

async function run() {
  console.log("🤖 Starting AI Agent...");

  // 1. Generate a temporary wallet for the agent (In production, load from .env)
  const agentKeypair = Keypair.generate();
  console.log("🔑 Agent Wallet Address:", agentKeypair.publicKey.toBase58());
  console.log("⚠️ Note: This wallet has 0 SOL. The transaction will fail unless funded.");

  // 2. Initialize MPP Session
  const session = await MPP.createSession({
    wallet: agentKeypair,
    deposit: 10_000_000 // Escrow limit limit (optional)
  });

  console.log("\n📡 Making request to Intelligence Endpoint...");

  try {
    // 3. Make the API request
    // This will trigger a 402, and the SDK will automatically try to pay
    const response = await session.request({
      url: "https://api.mpplayer.com/v1/intelligence/rug-risk",
      method: "POST",
      body: { token: "DezX...AcJ" }
    });

    console.log("\n✅ Success! Received Data:");
    console.log(response);

  } catch (error: any) {
    // This catch block is expected to run during this demo because the wallet is unfunded 
    // and the endpoint 'api.mpplayer.com' is a mock URL.
    console.log("\n❌ Request failed (Expected behavior for demo without funds):");
    console.error(error.message);
  }
}

run();
