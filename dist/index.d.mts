import { Keypair, Connection } from '@solana/web3.js';

interface MPPConfig {
    wallet: Keypair;
    deposit?: number;
    connection?: Connection;
}
interface RequestOptions {
    url: string;
    method?: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    body?: any;
}

declare class MPPSession {
    private wallet;
    private deposit;
    private connection;
    constructor(config: MPPConfig);
    /**
     * Automatically intercepts HTTP 402 and performs off-chain signatures or on-chain payments
     */
    request<T = any>(options: RequestOptions): Promise<T>;
    private handlePaymentChallenge;
}

declare const MPP: {
    createSession: (config: any) => Promise<MPPSession>;
};

export { MPP, type MPPConfig, MPPSession, type RequestOptions };
