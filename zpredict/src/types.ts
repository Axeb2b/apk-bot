export enum TransactionType {
  SWAP = "swap",
  BRIDGE = "bridge",
  BUY = "buy",
  SELL = "sell",
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  walletAddress: string | null;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
}

export interface CryptoTransaction {
  transactionId: string;
  userId: string;
  type: TransactionType;
  fromToken: string;
  fromAmount: number;
  toToken: string;
  toAmount: number;
  network: string;
  status: TransactionStatus;
  txHash: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number; // Percentage change (e.g., +2.4 or -1.1)
  volume24h: string;
  marketCap: string;
  icon: string; // Lucide icon name or generic SVG
}

export interface NetworkInfo {
  id: string;
  name: string;
  rpcUrl?: string;
  blockExplorer?: string;
  gasPriceGwei: number;
  color: string;
}

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  author: string;
  category: string;
  readTime: string;
  publishedAt: string;
  image: string;
}

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  requestBody?: string;
  responseBody: string;
}

export interface PriceAlert {
  alertId: string;
  userId: string;
  tokenSymbol: string;
  tokenName: string;
  targetPrice: number;
  condition: "above" | "below";
  status: "active" | "triggered" | "paused";
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

