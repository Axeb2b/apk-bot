const { Telegraf } = require('telegraf');
const shell = require('shelljs');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const BOT_TOKEN = process.env.TG_BOT_TOKEN;
if (!BOT_TOKEN) {
    console.error('Please set TG_BOT_TOKEN environment variable');
    process.exit(1);
}

const TEMP_DIR = path.join(process.cwd(), 'temp_tg');
const DOWNLOADS_DIR = path.join(process.cwd(), 'downloads_tg');
fs.ensureDirSync(TEMP_DIR);
fs.ensureDirSync(DOWNLOADS_DIR);

const bot = new Telegraf(BOT_TOKEN);

// ... (rest of functions: execShell, randomString, generateRandomKeystore, encryptFile, generateSmaliLoader, protectApk - same as before)

// Paste all those functions here (they are unchanged)

// Then the bot handlers:

bot.start((ctx) => {
    ctx.reply(
        `🔒 *APK Protector Bot* 🔒\n\n` +
        `Send me an APK file and I will protect it by:\n` +
        `• Encrypting classes.dex with AES-256-CBC\n` +
        `• Injecting a runtime decryption loader (smali)\n` +
        `• Modifying AndroidManifest\n` +
        `• Rebuilding and signing with a random keystore\n\n` +
        `The protected APK will be sent back to you.`,
        { parse_mode: 'Markdown' }
    );
});

bot.on('document', async (ctx) => {
    const document = ctx.message.document;
    const fileName = document.file_name || '';
    const isApk = fileName.toLowerCase().endsWith('.apk');
    
    if (!isApk) {
        return ctx.reply('❌ Please send an APK file with .apk extension.');
    }

    const sessionId = uuidv4();
    const tempApkPath = path.join(TEMP_DIR, `${sessionId}_original.apk`);

    const statusMsg = await ctx.reply('⏳ Downloading APK...');

    try {
        const fileLink = await ctx.telegram.getFileLink(document.file_id);
        const response = await axios({ method: 'GET', url: fileLink.href, responseType: 'stream' });
        const writer = fs.createWriteStream(tempApkPath);
        response.data.pipe(writer);
        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        await ctx.telegram.editMessageText(ctx.chat.id, statusMsg.message_id, null, '🔐 Protecting APK (may take 1-2 minutes)...');

        const protectedApkPath = await protectApk(tempApkPath, sessionId);

        await ctx.replyWithDocument(
            { source: protectedApkPath, filename: `protected_${document.file_name || 'app.apk'}` },
            { caption: '✅ Protection complete! Your APK is ready.\n\nThe dex is encrypted and will be decrypted at runtime.' }
        );

        await fs.unlink(tempApkPath).catch(() => {});
        await fs.unlink(protectedApkPath).catch(() => {});
        await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
    } catch (error) {
        console.error(`Error protecting APK for ${sessionId}:`, error);
        await ctx.reply(`❌ Failed to protect APK: ${error.message}`);
        await fs.unlink(tempApkPath).catch(() => {});
    }
});

bot.launch().then(() => console.log('Bot is running...'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = { protectApk };
