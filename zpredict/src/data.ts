import { TokenInfo, NetworkInfo, Article, ApiEndpoint } from "./types";

export const tokensList: TokenInfo[] = [
  {
    symbol: "ZPRED",
    name: "zPredict Token",
    priceUsd: 0.184,
    change24h: 12.8,
    volume24h: "$1.44M",
    marketCap: "$18.4M",
    icon: "Zap",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    priceUsd: 3420.50,
    change24h: 3.45,
    volume24h: "$18.2B",
    marketCap: "$411.5B",
    icon: "Coins",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    priceUsd: 84500.00,
    change24h: 1.15,
    volume24h: "$34.1B",
    marketCap: "$1.66T",
    icon: "Flame",
  },
  {
    symbol: "SOL",
    name: "Solana",
    priceUsd: 148.20,
    change24h: -1.72,
    volume24h: "$4.12B",
    marketCap: "$68.9B",
    icon: "Cpu",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    priceUsd: 1.00,
    change24h: 0.01,
    volume24h: "$6.8B",
    marketCap: "$32.4B",
    icon: "ShieldAlert",
  },
  {
    symbol: "POL",
    name: "Polygon Ecosystem",
    priceUsd: 0.445,
    change24h: 5.61,
    volume24h: "$380M",
    marketCap: "$4.42B",
    icon: "Network",
  },
];

export const networksList: NetworkInfo[] = [
  {
    id: "eth",
    name: "Ethereum Mainnet",
    gasPriceGwei: 28,
    color: "#627EEA",
    blockExplorer: "https://etherscan.io",
  },
  {
    id: "sol",
    name: "Solana Network",
    gasPriceGwei: 0.05,
    color: "#14F195",
    blockExplorer: "https://solscan.io",
  },
  {
    id: "pol",
    name: "Polygon PoS",
    gasPriceGwei: 45,
    color: "#8247E5",
    blockExplorer: "https://polygonscan.com",
  },
  {
    id: "arb",
    name: "Arbitrum One",
    gasPriceGwei: 0.1,
    color: "#28A0F0",
    blockExplorer: "https://arbiscan.io",
  },
];

export const mockArticles: Article[] = [
  {
    id: "art-1",
    title: "Understanding High-Performance AI-Driven Bridges",
    summary: "As cross-chain security continues to evolve, decentralized prediction protocols predict automated route routing will drop fees by 75%.",
    content: "The trade-off between speed and security on traditional locks has resulted in high gas costs. zPredict exploits algorithmic market makers and real-time gas aggregators to route assets seamlessly between networks. Our custom multi-hop pool enables Instant Finality. By evaluating path congestion server-side and combining liquidity structures, smart contract bridges are now fully autonomous...",
    author: "Klaus Verity",
    category: "Insights",
    readTime: "4 min read",
    publishedAt: "May 23, 2026",
    image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "art-2",
    title: "How to Keep Your Assets Safe: Decentralized Auditing",
    summary: "Preventing exploit vectors through rigorous cryptographic standards and self-custodial key paradigms.",
    content: "With over $1.2B lost in various DeFi smart contract hacks last year, securing multi-signature liquidity protocols isn't just an asset, it is an absolute necessity. zPredict integrates leading cryptography layers ensuring that our local client-facing scripts are highly compartmentalized. Here, we outline the best practices for connecting external developer testnets, handling popup providers, and checking transaction traces...",
    author: "Sophia Sterling",
    category: "Security",
    readTime: "6 min read",
    publishedAt: "May 22, 2026",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=600&auto=format&fit=crop",
  },
  {
    id: "art-3",
    title: "The Launch of ZPRED Utility Token on EVM Pools",
    summary: "Introducing our core platform governance token ZPRED, built to incentivize low-slippage bridges and prediction accuracy metrics.",
    content: "ZPRED token holders receive instant discounts on native slippage charges, alongside early participation slots in automated liquidity pools. Backed by solid proof of reserves, ZPRED behaves as a utility coordinate across Ethereum, Arbitrum, Polygon, and Solana, optimizing the decentralized forecasting network's speed dynamics...",
    author: "Finance Redactor",
    category: "Tokens",
    readTime: "3 min read",
    publishedAt: "May 18, 2026",
    image: "https://images.unsplash.com/photo-1642104704074-907c0698cbd9?q=80&w=600&auto=format&fit=crop",
  },
];

export const apiEndpointsList: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/api/v1/tokens/rates",
    description: "Get real-time exchange rates, 24h percentage swings, and market capitalization stats.",
    responseBody: `{
  "success": true,
  "timestamp": 1779613524,
  "data": [
    { "symbol": "ZPRED", "priceUsd": 0.184, "change24h": 12.8 },
    { "symbol": "ETH", "priceUsd": 3420.50, "change24h": 3.45 }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/v1/swap/quote",
    description: "Calculate expected yield after deducting slippage constraints, gas approximations, and bridge fees.",
    requestBody: `{
  "fromToken": "ETH",
  "toToken": "ZPRED",
  "amount": 1.5,
  "network": "Ethereum Mainnet"
}`,
    responseBody: `{
  "success": true,
  "quote": {
    "fromToken": "ETH",
    "toToken": "ZPRED",
    "rate": 18589.67,
    "fromAmount": 1.5,
    "toAmount": 27884.50,
    "slippageUsd": 2.10,
    "estimatedGasGwei": 31
  }
}`,
  },
  {
    method: "POST",
    path: "/api/v1/transactions/create",
    description: "Log executed swap logs inside user-secured firebase credentials.",
    requestBody: `{
  "type": "swap",
  "fromToken": "SOL",
  "fromAmount": 12.0,
  "toToken": "USDC",
  "toAmount": 1778.4,
  "network": "Solana Network",
  "txHash": "0x89a0f...1bc2"
}`,
    responseBody: `{
  "success": true,
  "transactionId": "tx-1716541703211",
  "status": "pending",
  "createdAt": "2026-05-24T09:12:43Z"
}`,
  },
];
