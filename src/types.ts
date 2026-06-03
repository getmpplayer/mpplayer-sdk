import { Keypair, Connection } from "@solana/web3.js";

export interface MPPConfig {
  wallet: Keypair;
  deposit?: number;
  connection?: Connection;
}

export interface RequestOptions {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: any;
}
