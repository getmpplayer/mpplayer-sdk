<div align="center">
  <img src="public/mpp_logo.jpeg" alt="MPP Layer Logo" width="120" />
  <h1>@getmpplayer/sdk</h1>
  <p><strong>The First Autonomous Payment SDK for AI Agents (Machine Payments Protocol)</strong></p>
  
  [![npm version](https://img.shields.io/npm/v/@getmpplayer/sdk.svg?style=flat-square)](https://www.npmjs.com/package/@getmpplayer/sdk)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
  [![Solana Supported](https://img.shields.io/badge/Chain-Solana-14F195.svg?style=flat-square&logo=solana&logoColor=white)](https://solana.com/)
</div>

<br />

The **Machine Payments Protocol (MPP)** SDK gives your AI agents a "wallet that thinks". It intercepts standard `HTTP 402 Payment Required` API challenges and automatically settles micro-transactions on the Solana blockchain in milliseconds—with **zero human-in-the-loop**.

Build truly autonomous AI fleets that pay precisely for what they consume, exactly when they consume it.

---

## ✨ Features

- **🤖 Agent-Native Payments**: Automate API payments for AI bots without credit cards or Stripe subscriptions.
- **⚡ Sub-Second Settlement**: Built on Solana. Payments settle in ~400ms, making paid API calls feel like cache hits.
- **🔒 Secure Escrow**: Pre-load your agent's session with a deposit to prevent constant signing delays and protect main wallet funds.
- **🌐 HTTP 402 Interceptor**: Drop-in replacement for `fetch`. It automatically catches `402` errors, executes the Solana transaction, and retries the request with cryptographic proof.
- **🛠️ Zero Configuration**: Works instantly out of the box with standard Node.js environments and edge workers.

---

## 📦 Installation

```bash
npm install @getmpplayer/sdk
# or
yarn add @getmpplayer/sdk
# or
pnpm add @getmpplayer/sdk
```

---

## 🚀 Quick Start

To use the SDK, you only need to provide your AI Agent's Solana Keypair. The SDK handles the rest of the cryptography and network retries under the hood.

```typescript
import { MPP } from "@getmpplayer/sdk";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

// 1. Load your Agent's secure Private Key
const agentKeypair = Keypair.fromSecretKey(
  bs58.decode(process.env.AGENT_PRIVATE_KEY)
);

async function runAgent() {
  // 2. Initialize an Autonomous Session
  // The 'deposit' represents pre-authorized funds in lamports/USDC equivalent
  const session = await MPP.createSession({
    wallet: agentKeypair,
    deposit: 10_000_000 // Escrow limit to prevent overspending
  });

  console.log("Agent session started with wallet:", agentKeypair.publicKey.toBase58());

  // 3. Make Requests Normally
  // If the endpoint requires payment, the SDK automatically signs & pays off-chain!
  const intel = await session.request({
    url: "https://api.mpplayer.com/v1/intelligence/rug-risk",
    method: "POST",
    body: { token: "DezX...AcJ" }
  });

  // 4. Use the Data
  console.log("Rug Risk Score:", intel.rugRisk.score);
  
  if (intel.rugRisk.score > 3) {
    return { action: "SKIP" };
  }
  
  return { action: "BUY", confidence: "HIGH" };
}

runAgent();
```

---

## 🧠 How it Works Under the Hood

1. **Request**: The SDK makes a standard HTTP request to a provider's endpoint.
2. **Challenge**: If the API is paid, the server responds with an `HTTP 402 Payment Required` and a challenge (cost + recipient address).
3. **Execute**: The SDK intercepts the `402`, checks the agent's escrow/deposit, and instantly signs a Solana transaction.
4. **Retry & Deliver**: The SDK retries the original request, attaching `X-Payment-Proof: <signature>`. The server validates it, and the data is returned to your application seamlessly.

---

## 📘 API Reference

### `MPP.createSession(config)`
Initializes a new payment session.
- **`wallet`** *(Keypair)* - The Solana keypair of the agent.
- **`deposit`** *(number, optional)* - Max amount allowed to be spent in this session (escrow).
- **`connection`** *(Connection, optional)* - Custom Solana RPC connection.

### `session.request(options)`
An enhanced fetch wrapper that intercepts 402s.
- **`url`** *(string)* - The API endpoint to call.
- **`method`** *(string, optional)* - `GET`, `POST`, etc.
- **`headers`** *(Record<string, string>, optional)* - Custom HTTP headers.
- **`body`** *(any, optional)* - JSON payload.

---

## 🛡️ Security Best Practices

- **Never expose your main wallet.** Always generate a fresh Keypair dedicated solely to a specific AI agent.
- **Use the `deposit` limit.** Set a strict deposit limit to ensure a runaway agent loop doesn't drain funds.
- Keep your `.env` files completely hidden and out of source control.

---

## 📄 License

This SDK is open-source and available under the [MIT License](LICENSE).

<div align="center">
  <b>Built for the future of AI economies by the MPP Layer team.</b>
</div>
