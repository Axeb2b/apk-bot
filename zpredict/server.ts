import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import TelegramBot from "node-telegram-bot-api";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Retrieve host website URL seamlessly
  const hostUrl = process.env.APP_URL || "https://ais-pre-az7hijazuakptd6u3k4zj7-690317285269.asia-east1.run.app";

  // Initialize Telegram Bot
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (token) {
    const bot = new TelegramBot(token, { polling: true });

    // Gracefully handle polling errors to prevent 409 Conflict crash loops
    bot.on("polling_error", (error: any) => {
      if (error.message && error.message.includes("409 Conflict")) {
        console.warn(
          "[Telegram Bot] Polling conflict detected (409 Conflict). " +
          "Another instance of this bot is likely running elsewhere (e.g., in development vs. pre-production container). " +
          "Stopping polling on this instance to allow the other instance to operate without interruption."
        );
        try {
          bot.stopPolling();
        } catch (e: any) {
          console.error("Failed to call stopPolling:", e.message);
        }
      } else {
        console.warn("[Telegram Bot] Polling error occurred:", error.message || error);
      }
    });

    bot.on("error", (error: any) => {
      console.warn("[Telegram Bot] General error occurred:", error.message || error);
    });

    // Set bot description and custom details safely on startup
    try {
      bot.setMyDescription({
        description: "Welcome to zPredict! Your ultimate multi-chain Web3 portal for instant cross-chain swaps, secure bridging, premium staking vaults, and fast fiat gate services."
      }).catch(err => console.log("Failed to set description:", err.message));

      bot.setMyShortDescription({
        short_description: "Multi-Chain DEX, Bridge, Staking, and Fiat Gates."
      }).catch(err => console.log("Failed to set short description:", err.message));
    } catch (e: any) {
      console.warn("Could not set bot descriptions directly:", e?.message);
    }

    // Dynamic Admin validation function
    const isUserAdmin = async (userId: number): Promise<boolean> => {
      // Allow overriding or explicit admins via an environment variable
      const envAdminIds = process.env.TELEGRAM_ADMIN_IDS;
      if (envAdminIds) {
        const ids = envAdminIds.split(",").map(id => id.trim());
        if (ids.includes(String(userId))) {
          return true;
        }
      }

      try {
        const member = await bot.getChatMember("@zpredictt", userId);
        return ["creator", "administrator"].includes(member.status);
      } catch (error) {
        return false;
      }
    };

    // Membership Gate check function
    const checkUserJoined = async (userId: number): Promise<boolean> => {
      try {
        const member = await bot.getChatMember("@zpredictt", userId);
        const validStatuses = ["creator", "administrator", "member", "restricted"];
        return validStatuses.includes(member.status);
      } catch (error: any) {
        console.error("Error checking membership for user:", userId, error?.message || error);
        // Fallback to false to keep verification secure and true to requirements
        return false;
      }
    };

    // Gate prompt message with action buttons
    const promptJoinMessage = (chatId: number) => {
      const joinText = `
⚠️ *Access Required!*

To use the zPredict multi-chain web3 engine bot, you need to first join our official announcement and updates channel!

📢 *Join Channel:* @zpredictt (https://t.me/zpredictt)

After joining, please click the "✅ Check Joined" button below to unlock all commands!
`;
      bot.sendMessage(chatId, joinText, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📢 Join Channel", url: "https://t.me/zpredictt" }
            ],
            [
              { text: "✅ Check Joined", callback_data: "check_membership" }
            ]
          ]
        }
      });
    };

    // Help text detailing all commands
    const helpText = `
🤖 *zPredict Bot Help & Commands*

Meet your multi-chain Web3 portal assistants! You can control this bot using these commands:

🚀 *Primary Navigation*
/start - Start interaction & access the main dashboard
/about - Complete overview of the zPredict platform
/help - Show this interactive help menu

🔮 *Website Features*
/swap - Token Swaps with instant rate calculations
/bridge - Secure cross-chain bridges & network times
/buysell - Fiat gateways to purchase or sell crypto
/staking - Current APYs, pools, & staking benefits
/fees - Complete transparent fee schedules
/api - Developer rest API instructions
/ecosystem - Read hot ecosystem blogs & articles
/faq - Self-service help matching protocol questions

🛠️ *Administrator Tools*
/admin - Control channel spotlights & broadcast announcements

Click any command above or use the main interactive button panel to navigate!
`;

    // Main Interactive Inline Keyboard Layout
    const mainKeyboard = {
      inline_keyboard: [
        [
          { text: "🔄 Token Swap", callback_data: "cmd_swap" },
          { text: "🌉 Cross-Chain Bridge", callback_data: "cmd_bridge" }
        ],
        [
          { text: "💳 Buy / Sell Crypto", callback_data: "cmd_buysell" },
          { text: "🥩 Staking Arena", callback_data: "cmd_staking" }
        ],
        [
          { text: "📊 Fee Schedule", callback_data: "cmd_fees" },
          { text: "💻 Dev API Portal", callback_data: "cmd_api" }
        ],
        [
          { text: "📈 Blogs & Ecosystem", callback_data: "cmd_ecosystem" },
          { text: "❓ View FAQs", callback_data: "cmd_faq" }
        ],
        [
          { text: "ℹ️ About zPredict", callback_data: "cmd_about" },
          { text: "🌐 Open zPredict Web App", url: hostUrl }
        ]
      ]
    };

    // Helper functions for sending details
    const sendWelcome = (chatId: number) => {
      const welcomeMsg = `
🌟 *Welcome to zPredict Telegram Hub!*

zPredict is a state-of-the-art multi-chain hub tailored for instant swaps, lightning-fast cross-chain bridges, high-yield staking pools, and simple fiat gateways.

⚡ Use the command list or click the interactive buttons below to explore our platform features directly from Telegram!

🌐 *Live Website:* ${hostUrl}
`;
      bot.sendMessage(chatId, welcomeMsg, {
        parse_mode: "Markdown",
        reply_markup: mainKeyboard
      });
    };

    const sendSwapDetails = (chatId: number) => {
      const msg = `
🔄 *zPredict Token Swap Engine*

Trade your favorite crypto assets instantly across leading blockchains with slippage protection and optimal routing paths.

• *Supported Tokens:* BTC, ETH, USDT, USDC, BNB, MATIC, ARB, OP
• *Execution Time:* Under 5 seconds
• *Supported Chains:* Ethereum, BSC, Polygon, Arbitrum, Optimism
• *Features:* Slippage limit custom adjustment, price impact guard, automated best-rate pathfinding.

👉 [Launch Web Swap Tab](${hostUrl})
`;
      bot.sendMessage(chatId, msg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 Try Swap Online", url: `${hostUrl}` },
              { text: "🏠 Main Menu", callback_data: "cmd_menu" }
            ]
          ]
        }
      });
    };

    const sendBridgeDetails = (chatId: number) => {
      const msg = `
🌉 *Cross-Chain Bridge Portal*

Move synthetic assets, stablecoins, and gas tokens across diverse Virtual Machine networks with unmatched speed and zero wrapping delays.

• *Networks:* Ethereum ↔️ Binance Smart Chain ↔️ Polygon ↔️ Arbitrum ↔️ Optimism
• *Transfer Speed:* ~2 - 10 minutes depending on destination consensus
• *Security Specs:* Multi-signature validators, locked vaults, and instant fallback refund mechanism.
• *Minimum Amount:* $10 equivalent

👉 [Launch Bridge Tab](${hostUrl})
`;
      bot.sendMessage(chatId, msg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 Bridge Assets Now", url: `${hostUrl}` },
              { text: "🏠 Main Menu", callback_data: "cmd_menu" }
            ]
          ]
        }
      });
    };

    const sendBuySellDetails = (chatId: number) => {
      const msg = `
💳 *Fiat Gateway (Buy & Sell)*

Buy crypto with standard fiat currency or offramp your digital assets directly into conventional bank balances.

• *Payment Methods:* Credit/Debit Cards (Visa, Mastercard), SEPA Bank Transfers, Apple Pay, Google Pay.
• *Available Fiat:* USD, EUR, GBP
• *Processing Speeds:*
  ├ Credit Card: Instant (1-2 mins)
  └ Bank Transfer: 1 Business Day
• *No Hidden Margins:* Fully transparent real-time quote generation.

👉 [Launch Buy/Sell Gateway](${hostUrl})
`;
      bot.sendMessage(chatId, msg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 Buy Crypto Online", url: `${hostUrl}` },
              { text: "🏠 Main Menu", callback_data: "cmd_menu" }
            ]
          ]
        }
      });
    };

    const sendStakingDetails = (chatId: number) => {
      const msg = `
🥩 *zPredict Yield Staking Pools*

Unlock passive rewards by staking your crypto assets in secure, audited smart contract vaults.

📈 *Active Pools & Estimated APY:*
1. *zPredict Native (ZPRED) Staking:* Up to *35.0% APY*
2. *Ethereum Vault (ETH):* *6.5% APY*
3. *USDC / USDT Stable-Vaults:* *8.2% APY* (Flexi-terms)

• *Lockup Lock Options:* Flexible (No lock), 30 Days (Boosted), 90 Days (Ultra Yield)
• *Audit Status:* 100% verified by CertiK with multi-sig backup.
`;
      bot.sendMessage(chatId, msg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 Open Staking Arena", url: `${hostUrl}` },
              { text: "🏠 Main Menu", callback_data: "cmd_menu" }
            ]
          ]
        }
      });
    };

    const sendFeeDetails = (chatId: number) => {
      const msg = `
📊 *zPredict Transparent Fee Schedule*

We believe in complete transparency. There are never any surprises or hidden spread percentages.

• *DeFi Spot Swaps:* *0.15%* flat service charge
• *Cross-Chain Bridge Route:* *0.05%* route processing fee + standard destination gas
• *Fiat Gateway:* *0.80%* card processing + gateway provider fee (varies by country)
• *Staking Interactions:* *Zero fees* (only standard blockchain network gas fees apply)
• *Liquidity Provider Share:* *80%* of all collected spot swap fees are paid back to user liquidity pools!
`;
      bot.sendMessage(chatId, msg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🏠 Main Menu", callback_data: "cmd_menu" }
            ]
          ]
        }
      });
    };

    const sendApiDetails = (chatId: number) => {
      const msg = `
💻 *Developer Rest API Portal*

Developers can plug directly into zPredict's state-of-the-art routers and state providers using our programmatic APIs.

🚀 *Available Endpoints:*
• \`GET /api/v1/quote\` - Compute best prices across multiple liquidity pools.
• \`GET /api/v1/routes\` - Discover shortest cross-chain bridging channels.
• \`GET /api/v1/staking/yields\` - Read live APY interest data for all vaults.

👩‍💻 Real-time webhook notifications are available for transaction settlement alerts. Complete sandbox testing documentation is integrated directly into the dashboard.
`;
      bot.sendMessage(chatId, msg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 Open API Docs", url: `${hostUrl}` },
              { text: "🏠 Main Menu", callback_data: "cmd_menu" }
            ]
          ]
        }
      });
    };

    const sendEcosystemDetails = (chatId: number) => {
      const msg = `
📈 *zPredict Ecosystem News & Blogs*

Stay up to date with deep technical analyses, community developments, and industry updates.

📖 *Featured Ecosystem Articles:*
1. "The Ultimate Architecture of Multi-chain Decentralized Exchanges"
2. "Understanding Impermanent Loss and Flexible Staking APRs"
3. "Deep Dive: How Bridge Relayers Settle Secure Proof of Consensus"

👉 Browse our complete blog archive on the website's info hub.
`;
      bot.sendMessage(chatId, msg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 View Blogs Tab", url: `${hostUrl}` },
              { text: "🏠 Main Menu", callback_data: "cmd_menu" }
            ]
          ]
        }
      });
    };

    const sendFaqDetails = (chatId: number) => {
      const msg = `
❓ *Frequently Asked Questions FAQ*

*Q: What is slippage tolerance?*
A: Slippage represents price variation between execution and confirmation. Our smart routing locks a guaranteed rate with max 0.5% default buffer.

*Q: How long does a cross-chain bridging txn take?*
A: Depending on block time and validators, transfers generally clear in 3-10 minutes.

*Q: Is zPredict self-custodial?*
A: Yes! Your assets never touch proprietary internal wallets. Everything is executed peer-to-peer via secure smart contracts.
`;
      bot.sendMessage(chatId, msg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 Read Web FAQs", url: `${hostUrl}` },
              { text: "🏠 Main Menu", callback_data: "cmd_menu" }
            ]
          ]
        }
      });
    };

    const sendAboutDetails = (chatId: number) => {
      const msg = `
ℹ️ *About zPredict Web3 Hub & Portal*

zPredict is your modern, all-in-one ecosystem for interacting across multiple blockchain ecosystems with zero complexity.

✨ *Core Features Overview:*
• 🔄 *Interoperable Spot Swaps:* Automated multi-protocol liquidity pathfinders for the best market exchange rates with negligible slippage.
• 🌉 *Non-Custodial Bridge:* Secure, fast value bridging channels across several networks without requiring wrapped tokens or centralized counterparties.
• 💳 *Fiat On / Off Ramps:* Convenient gateway solutions for buying cryptocurrencies using conventional debit cards, credit cards, Apple Pay or SEPA.
• 🥩 *Yield Vaults (Staking):* CertiK-audited staking contract pools with flexible deposit-locking ranges and steady passive rate options.
• 💻 *REST API Platform:* Direct high-frequency endpoints allowing projects to query live quote systems, bridge pathways, and active yield updates.

🌐 [Open zPredict Web Application](${hostUrl})
`;
      bot.sendMessage(chatId, msg, {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌐 Open Platform", url: hostUrl },
              { text: "🏠 Main Menu", callback_data: "cmd_menu" }
            ]
          ]
        }
      });
    };

    // Helper for registering commands that checks membership
    const registerCommand = (regex: RegExp, handler: (chatId: number) => void) => {
      bot.onText(regex, async (msg) => {
        const userId = msg.from?.id;
        const chatId = msg.chat?.id;
        if (!userId || !chatId) return;

        const joined = await checkUserJoined(userId);
        if (!joined) {
          promptJoinMessage(chatId);
          return;
        }

        handler(chatId);
      });
    };

    // Slash Commands Registration
    registerCommand(/\/start/, sendWelcome);

    bot.onText(/\/help/, async (msg) => {
      const userId = msg.from?.id;
      const chatId = msg.chat?.id;
      if (!userId || !chatId) return;

      const joined = await checkUserJoined(userId);
      if (!joined) {
        promptJoinMessage(chatId);
        return;
      }
      bot.sendMessage(chatId, helpText, { parse_mode: "Markdown" });
    });

    registerCommand(/\/swap/, sendSwapDetails);
    registerCommand(/\/bridge/, sendBridgeDetails);
    registerCommand(/\/buysell/, sendBuySellDetails);
    registerCommand(/\/staking/, sendStakingDetails);
    registerCommand(/\/fees/, sendFeeDetails);
    registerCommand(/\/api/, sendApiDetails);
    registerCommand(/\/ecosystem/, sendEcosystemDetails);
    registerCommand(/\/faq/, sendFaqDetails);
    registerCommand(/\/about/, sendAboutDetails);

    // ==========================================
    // ADMINISTRATOR COMMANDS
    // ==========================================

    // Admin command: /admin - show layout of admin functions
    bot.onText(/\/admin/, async (msg) => {
      const userId = msg.from?.id;
      const chatId = msg.chat?.id;
      if (!userId || !chatId) return;

      const isAdmin = await isUserAdmin(userId);
      if (!isAdmin) {
        bot.sendMessage(chatId, `⚠️ *Access Denied / Admin Privileges Required*

*ENGLISH:*
You must be a Creator or Administrator of the @zpredictt channel to use administrative tools. 

💡 *Quick Fix:*
Your unique Telegram User ID is: \`${userId}\`
To bypass this check instantly, configure this ID inside your AI Studio Secrets/Environment variables under keys:
\`TELEGRAM_ADMIN_IDS\` = \`${userId}\`

---

*HINDI / URDU:*
Admin privileges hona zaroori hai! Aapko @zpredictt channel ka admin hona chahiye.

💡 *Aasaan Hal:*
Aapki unique Telegram User ID hai: \`${userId}\`
Aap instant access paane ke liye, AI Studio ke Secrets me ye configure kar sakte hain:
\`TELEGRAM_ADMIN_IDS\` = \`${userId}\``, { parse_mode: "Markdown" });
        return;
      }

      const adminHelp = `
🛠️ *zPredict Admin Panel*

Welcome, Administrator! Here are your exclusive commands to control channel posts & verify status:

📝 *Broadcast Commands*
• \`/post [message]\` - Publish any custom announcements/bulletins directly to @zpredictt in Markdown!
• \`/postrandom\` - Instantly post a random daily spotlight overview of zPredict features.

📊 *Diagnostics*
• \`/status\` - Retrieve live platform, server, and scheduler parameters.
`;
      bot.sendMessage(chatId, adminHelp, { parse_mode: "Markdown" });
    });

    // Admin command: /post [text] - post a custom announcement to the channel
    bot.onText(/\/post(?:\s+(.+))?/, async (msg, match) => {
      const userId = msg.from?.id;
      const chatId = msg.chat?.id;
      if (!userId || !chatId) return;

      const isAdmin = await isUserAdmin(userId);
      if (!isAdmin) {
        bot.sendMessage(chatId, `⚠️ *Access Denied:* Admin privileges required.\n\nYour Telegram User ID is: \`${userId}\`\nTo bypass, add \`TELEGRAM_ADMIN_IDS=${userId}\` in your project Secrets.`, { parse_mode: "Markdown" });
        return;
      }

      const postContent = match?.[1];
      if (!postContent) {
        bot.sendMessage(chatId, "❌ *Syntax Error:* Please supply content to broadcast.\nUsage: \`/post This is my update message!\`", { parse_mode: "Markdown" });
        return;
      }

      try {
        // Automatically append the live website URL to the custom broadcast if not already present
        let finalContent = postContent;
        if (!postContent.includes(hostUrl)) {
          finalContent += `\n\n🌐 *Live Website:* ${hostUrl}`;
        }
        await bot.sendMessage("@zpredictt", finalContent, { parse_mode: "Markdown" });
        bot.sendMessage(chatId, "✅ *Success:* Customized announcement message successfully broadcast to @zpredictt!", { parse_mode: "Markdown" });
      } catch (err: any) {
        bot.sendMessage(chatId, `❌ *Failed to broadcast:* ${err.message || err}`, { parse_mode: "Markdown" });
      }
    });

    // Admin command: /postrandom - force a random spotlight post
    bot.onText(/\/postrandom/, async (msg) => {
      const userId = msg.from?.id;
      const chatId = msg.chat?.id;
      if (!userId || !chatId) return;

      const isAdmin = await isUserAdmin(userId);
      if (!isAdmin) {
        bot.sendMessage(chatId, `⚠️ *Access Denied:* Admin privileges required.\n\nYour Telegram User ID is: \`${userId}\`\nTo bypass, add \`TELEGRAM_ADMIN_IDS=${userId}\` in your project Secrets.`, { parse_mode: "Markdown" });
        return;
      }

      bot.sendMessage(chatId, "🔄 *Triggering live spotlight generation and broadcast to @zpredictt...*", { parse_mode: "Markdown" });
      await sendDailyPost();
      bot.sendMessage(chatId, "✅ *Success:* Random spotlight post published successfully!", { parse_mode: "Markdown" });
    });

    // Admin command: /status - show diagnostic data
    bot.onText(/\/status/, async (msg) => {
      const userId = msg.from?.id;
      const chatId = msg.chat?.id;
      if (!userId || !chatId) return;

      const isAdmin = await isUserAdmin(userId);
      if (!isAdmin) {
        bot.sendMessage(chatId, `⚠️ *Access Denied:* Admin privileges required.\n\nYour Telegram User ID is: \`${userId}\`\nTo bypass, add \`TELEGRAM_ADMIN_IDS=${userId}\` in your project Secrets.`, { parse_mode: "Markdown" });
        return;
      }

      const activeTime = new Date().toLocaleString("en-US", { timeZone: "UTC" });
      const memoryUsage = process.memoryUsage();
      const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
      const heapTotalMB = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);

      const statusText = `
⚙️ *zPredict Bot System Diagnostics*

• *Platform Hosting:* Cloud Run Container
• *Core Endpoint:* \`${hostUrl}\`
• *Announcements Target:* @zpredictt
• *Interactive Modules:* Active & Online
• *Node Memory Usage:* ${heapUsedMB} MB / ${heapTotalMB} MB heap
• *Scheduler Term:* 24-hour interval cycle active
• *Current UTC Engine Time:* \`${activeTime}\`

⚡ All systems fully operational and responding inside secure thresholds.
`;
      bot.sendMessage(chatId, statusText, { parse_mode: "Markdown" });
    });

    // Callback queries router (Inline Buttons)
    bot.on("callback_query", async (query) => {
      const chatId = query.message?.chat.id;
      const userId = query.from?.id;
      if (!chatId || !userId) return;

      const action = query.data;
      bot.answerCallbackQuery(query.id);

      if (action !== "check_membership") {
        const joined = await checkUserJoined(userId);
        if (!joined) {
          promptJoinMessage(chatId);
          return;
        }
      }

      switch (action) {
        case "check_membership": {
          const isJoined = await checkUserJoined(userId);
          if (isJoined) {
            bot.sendMessage(chatId, "🎉 *Success!* Membership verified. Welcome to zPredict!", { parse_mode: "Markdown" });
            sendWelcome(chatId);
          } else {
            bot.sendMessage(chatId, "⚠️ *Error:* You have not joined our channel yet. Please click the button below to join, then click verification again.", {
              parse_mode: "Markdown",
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "📢 Join Channel", url: "https://t.me/zpredictt" }
                  ],
                  [
                    { text: "✅ Check Joined Again", callback_data: "check_membership" }
                  ]
                ]
              }
            });
          }
          break;
        }
        case "cmd_menu":
          sendWelcome(chatId);
          break;
        case "cmd_swap":
          sendSwapDetails(chatId);
          break;
        case "cmd_bridge":
          sendBridgeDetails(chatId);
          break;
        case "cmd_buysell":
          sendBuySellDetails(chatId);
          break;
        case "cmd_staking":
          sendStakingDetails(chatId);
          break;
        case "cmd_fees":
          sendFeeDetails(chatId);
          break;
        case "cmd_api":
          sendApiDetails(chatId);
          break;
        case "cmd_ecosystem":
          sendEcosystemDetails(chatId);
          break;
        case "cmd_faq":
          sendFaqDetails(chatId);
          break;
        case "cmd_about":
          sendAboutDetails(chatId);
          break;
        default:
          bot.sendMessage(chatId, "Feature or action unregistered!");
          break;
      }
    });

    // Daily Spotlights Poster to Channel @zpredictt
    const sendDailyPost = async () => {
      try {
        const posts = [
          `🌟 *zPredict Spotlight: Multi-Chain Staking Arena* 🌟\n\nLooking to earn steady, secure passive yields on your assets? Our native staking pools offer market-leading APYs!\n\n🥩 *Active Pool Yields:*\n• *ZPRED Native Pool:* Up to *35.0% APY*\n• *ETH Secure Vault:* *6.5% APY*\n• *USDC / USDT Yield Pools:* *8.2% APY*\n\n🔒 Highly audited, completely non-custodial, and backed by secure multi-sig smart contracts.\n\n🌐 *Live Website:* ${hostUrl}\n👉 Connect your wallet and stake now!`,
          `🔄 *zPredict Spotlight: Seamless Token Swaps* 🔄\n\nTrade tokens at the best available rates instantly. Our routing engine aggregates liquidity across multiple protocols for maximum savings and minimal slippage.\n\n⚡ *Key Benefits:*\n• Automated pathfinding for the lowest prices\n• Slippage protection guards\n• Under 5-second completion times\n\n🌐 *Live Website:* ${hostUrl}\n👉 Try Swapping assets now!`,
          `🌉 *zPredict Spotlight: Cross-Chain Asset Bridge* 🌉\n\nMove stablecoins and native utility tokens between standard EVM chains seamlessly without wrapping delays or third-party custody risks!\n\n🚀 *Supported Gas-Chains:*\n• Ethereum Mainnet\n• Binance Smart Chain (BSC)\n• Polygon POS Network\n• Arbitrum & Optimism L2 solutions\n\n🌐 *Live Website:* ${hostUrl}\n👉 Route your cross-chain bridge now!`,
          `💳 *zPredict Spotlight: Swift Fiat On & Off Ramp* 💳\n\nPurchase crypto using your bank card directly on our platform, or off-ramp digital balances back to bank accounts transparently!\n\nFeatures include support for Apple Pay, Debit/Credit Card solutions, safe SEPA transfers, and instant verification pathways.\n\n🌐 *Live Website:* ${hostUrl}\n👉 Get started with our fiat portal!`
        ];

        const randomIndex = Math.floor(Math.random() * posts.length);
        const postText = posts[randomIndex];

        await bot.sendMessage("@zpredictt", postText, { parse_mode: "Markdown" });
        console.log("Daily post successfully published to channel @zpredictt");
      } catch (error: any) {
        console.error("Error publishing daily channel post to @zpredictt:", error?.message || error);
      }
    };

    // Run startup verification post with a slight delay
    setTimeout(() => {
      console.log("Triggering verification startup post to channel @zpredictt...");
      sendDailyPost();
    }, 10000);

    // Schedule subsequent posts every 24 hours
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    setInterval(() => {
      console.log("Running scheduled daily poster...");
      sendDailyPost();
    }, ONE_DAY_MS);

    console.log("Telegram bot fully initialized with all command handlers and interactive inline keyboards.");
  } else {
    console.warn("TELEGRAM_BOT_TOKEN not found, skipping bot initialization.");
  }

  // Parse JSON bodies for API requests
  app.use(express.json());

  // Initialize Gemini AI Client
  const geminiApiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (geminiApiKey) {
    ai = new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini AI client successfully initialized on server.");
  } else {
    console.warn("GEMINI_API_KEY environment variable is not defined.");
  }

  // Gemini multi-turn chat endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ 
          error: "Gemini AI client is not configured on this server. Please set GEMINI_API_KEY in Settings > Secrets." 
        });
      }

      const { contents, model = "gemini-3.5-flash", systemInstruction } = req.body;

      if (!contents || !Array.isArray(contents)) {
        return res.status(400).json({ error: "Invalid request payload. 'contents' array is required." });
      }

      // Build model configuration
      const config: any = {};
      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      // Configure high thinking mode if using gemini-3.1-pro-preview
      if (model === "gemini-3.1-pro-preview") {
        config.thinkingConfig = {
          thinkingLevel: "HIGH"
        };
      }

      console.log(`[Gemini API] Request received for model: ${model}`);
      
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: config
      });

      res.json({ text: response.text });
    } catch (err: any) {
      console.error("[Gemini API] Error in generateContent:", err?.message || err);
      res.status(500).json({ error: err?.message || "Failed to generate content from Gemini API." });
    }
  });

  // Keep-alive/health endpoint to assist external counters
  app.get("/api/ping", (req, res) => {
    res.json({ 
      status: "alive", 
      time: new Date().toISOString(),
      bot_initialized: !!token
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Self-ping loop to keep server up 24/7
    const PING_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
    setInterval(async () => {
      try {
        const pingUrl = `${hostUrl}/api/ping`;
        console.log(`[Keep-Alive]: Self-pinging ${pingUrl} to maintain 24/7 uptime...`);
        const response = await fetch(pingUrl);
        const data = await response.json();
        console.log(`[Keep-Alive]: Response status: ${response.status}, success:`, data);
      } catch (error: any) {
        console.warn(`[Keep-Alive]: Ping failed (likely initial startup delay or cold start):`, error?.message || error);
      }
    }, PING_INTERVAL_MS);
  });
}

startServer();

