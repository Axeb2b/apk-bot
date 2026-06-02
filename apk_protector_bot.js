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

function execShell(cmd, cwd = process.cwd()) {
    return new Promise((resolve, reject) => {
        shell.exec(cmd, { cwd, silent: false, async: true }, (code, stdout, stderr) => {
            if (code !== 0) reject(new Error(`Command failed: ${cmd}\n${stderr}`));
            else resolve(stdout);
        });
    });
}

function randomString(length = 16) {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
}

async function generateRandomKeystore(keystorePath, password) {
    const alias = randomString(8);
    const cmd = `keytool -genkey -v -keystore "${keystorePath}" -alias ${alias} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${password} -keypass ${password} -dname "CN=Unknown, OU=Unknown, O=Unknown, L=Unknown, ST=Unknown, C=XX"`;
    await execShell(cmd);
}

async function encryptFile(inputPath, outputPath) {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    return new Promise((resolve, reject) => {
        input.pipe(cipher).pipe(output);
        output.on('finish', () => resolve({ key: key.toString('base64'), iv: iv.toString('base64') }));
        output.on('error', reject);
    });
}

function generateSmaliLoader(encryptedFileName, originalApplicationClass, keyBase64, ivBase64) {
    const randomClassName = `ProtectLoader${randomString(8)}`;
    const fileName = `${randomClassName}.smali`;
    const smaliCode = `
.class public L${randomClassName};
.super Landroid/app/Application;

.field private static final ENC_KEY:Ljava/lang/String; = "${keyBase64}"
.field private static final ENC_IV:Ljava/lang/String; = "${ivBase64}"

.method public constructor <init>()V
    .locals 0
    invoke-direct {p0}, Landroid/app/Application;-><init>()V
    return-void
.end method

.method public onCreate()V
    .locals 12
    .annotation system Ldalvik/annotation/Throws;
        value = {
            Ljava/lang/Exception;
        }
    .end annotation

    .prologue
    const/4 v11, 0x0

    invoke-virtual {p0}, L${randomClassName};->getAssets()Landroid/content/res/AssetManager;
    move-result-object v0
    const-string v1, "${encryptedFileName}"
    invoke-virtual {v0, v1}, Landroid/content/res/AssetManager;->open(Ljava/lang/String;)Ljava/io/InputStream;
    move-result-object v0

    invoke-virtual {v0}, Ljava/io/InputStream;->available()I
    move-result v1
    new-array v2, v1, [B
    invoke-virtual {v0, v2, v11, v1}, Ljava/io/InputStream;->read([BII)I
    invoke-virtual {v0}, Ljava/io/InputStream;->close()V

    new-instance v3, Ljavax/crypto/spec/SecretKeySpec;
    sget-object v4, L${randomClassName};->ENC_KEY:Ljava/lang/String;
    invoke-static {v4, v11}, Landroid/util/Base64;->decode(Ljava/lang/String;I)[B
    move-result-object v4
    const-string v5, "AES"
    invoke-direct {v3, v4, v5}, Ljavax/crypto/spec/SecretKeySpec;-><init>([BLjava/lang/String;)V

    new-instance v4, Ljavax/crypto/spec/IvParameterSpec;
    sget-object v5, L${randomClassName};->ENC_IV:Ljava/lang/String;
    invoke-static {v5, v11}, Landroid/util/Base64;->decode(Ljava/lang/String;I)[B
    move-result-object v5
    invoke-direct {v4, v5}, Ljavax/crypto/spec/IvParameterSpec;-><init>([B)V

    const-string v5, "AES/CBC/PKCS5Padding"
    invoke-static {v5}, Ljavax/crypto/Cipher;->getInstance(Ljava/lang/String;)Ljavax/crypto/Cipher;
    move-result-object v5
    const/4 v6, 0x2
    invoke-virtual {v5, v6, v3, v4}, Ljavax/crypto/Cipher;->init(ILjava/security/Key;Ljava/security/spec/AlgorithmParameterSpec;)V

    invoke-virtual {v5, v2}, Ljavax/crypto/Cipher;->doFinal([B)[B
    move-result-object v2

    invoke-virtual {p0}, L${randomClassName};->getCacheDir()Ljava/io/File;
    move-result-object v3
    new-instance v4, Ljava/io/File;
    const-string v5, "classes_decrypted.dex"
    invoke-direct {v4, v3, v5}, Ljava/io/File;-><init>(Ljava/io/File;Ljava/lang/String;)V
    invoke-virtual {v4}, Ljava/io/File;->getAbsolutePath()Ljava/lang/String;
    move-result-object v5

    new-instance v6, Ljava/io/FileOutputStream;
    invoke-direct {v6, v4}, Ljava/io/FileOutputStream;-><init>(Ljava/io/File;)V
    invoke-virtual {v6, v2}, Ljava/io/FileOutputStream;->write([B)V
    invoke-virtual {v6}, Ljava/io/FileOutputStream;->close()V

    invoke-virtual {p0}, L${randomClassName};->getApplicationInfo()Landroid/content/pm/ApplicationInfo;
    move-result-object v2
    iget-object v2, v2, Landroid/content/pm/ApplicationInfo;->nativeLibraryDir:Ljava/lang/String;
    new-instance v6, Ldalvik/system/DexClassLoader;
    invoke-virtual {p0}, L${randomClassName};->getClassLoader()Ljava/lang/ClassLoader;
    move-result-object v7
    invoke-direct {v6, v5, v3, v2, v7}, Ldalvik/system/DexClassLoader;-><init>(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/ClassLoader;)V

    const-string v2, "${originalApplicationClass}"
    invoke-virtual {v2}, Ljava/lang/String;->isEmpty()Z
    move-result v7
    if-nez v7, :cond_0
    :try_start_0
    const-string v7, "${originalApplicationClass}"
    const/4 v8, 0x1
    invoke-virtual {v6, v7, v8}, Ldalvik/system/DexClassLoader;->loadClass(Ljava/lang/String;Z)Ljava/lang/Class;
    move-result-object v7
    const/4 v8, 0x0
    new-array v8, v8, [Ljava/lang/Class;
    invoke-virtual {v7, v8}, Ljava/lang/Class;->getDeclaredConstructor([Ljava/lang/Class;)Ljava/lang/reflect/Constructor;
    move-result-object v8
    const/4 v9, 0x0
    new-array v9, v9, [Ljava/lang/Object;
    invoke-virtual {v8, v9}, Ljava/lang/reflect/Constructor;->newInstance([Ljava/lang/Object;)Ljava/lang/Object;
    move-result-object v8
    check-cast v8, Landroid/app/Application;
    invoke-virtual {v8, p0}, Landroid/app/Application;->attach(Landroid/content/Context;)V
    invoke-virtual {v8}, Landroid/app/Application;->onCreate()V
    :try_end_0
    .catch Ljava/lang/Exception; {:try_start_0 .. :try_end_0} :catch_0
    .catchall {:try_start_0 .. :try_end_0} :catchall_0

    :catch_0
    move-exception v8

    :cond_0
    return-void
    :catchall_0
    move-exception v8
    throw v8
.end method
`.trim();
    return { className: randomClassName, smaliCode, fileName };
}

async function protectApk(apkFilePath, sessionId) {
    const tempWorkDir = path.join(TEMP_DIR, sessionId);
    await fs.ensureDir(tempWorkDir);

    try {
        const decompileDir = path.join(tempWorkDir, 'decompiled');
        await execShell(`apktool d "${apkFilePath}" -o "${decompileDir}" -f`);

        const classesDexPath = path.join(decompileDir, 'classes.dex');
        if (!fs.existsSync(classesDexPath)) throw new Error('classes.dex not found');

        const encryptedDexFileName = `encrypted_${randomString(8)}.bin`;
        const encryptedDexPath = path.join(tempWorkDir, encryptedDexFileName);
        const { key, iv } = await encryptFile(classesDexPath, encryptedDexPath);

        const assetsDir = path.join(decompileDir, 'assets');
        await fs.ensureDir(assetsDir);
        await fs.move(encryptedDexPath, path.join(assetsDir, encryptedDexFileName), { overwrite: true });

        const manifestPath = path.join(decompileDir, 'AndroidManifest.xml');
        let originalApplicationClass = '';
        const manifestContent = await fs.readFile(manifestPath, 'utf8');
        const appNameMatch = manifestContent.match(/<application[^>]*android:name="([^"]+)"/);
        if (appNameMatch && appNameMatch[1]) {
            originalApplicationClass = appNameMatch[1];
            let newManifest = manifestContent.replace(/android:name="[^"]+"/, '');
            newManifest = newManifest.replace(/<application\s+>/, '<application>');
            await fs.writeFile(manifestPath, newManifest, 'utf8');
        }

        const { className, smaliCode, fileName } = generateSmaliLoader(encryptedDexFileName, originalApplicationClass, key, iv);
        const smaliDir = path.join(decompileDir, 'smali');
        await fs.ensureDir(smaliDir);
        await fs.writeFile(path.join(smaliDir, fileName), smaliCode, 'utf8');

        let finalManifest = await fs.readFile(manifestPath, 'utf8');
        const applicationTagRegex = /<application([^>]*)>/;
        const match = finalManifest.match(applicationTagRegex);
        if (match) {
            const newAttributes = `${match[1]} android:name="${className}"`;
            finalManifest = finalManifest.replace(applicationTagRegex, `<application${newAttributes}>`);
            await fs.writeFile(manifestPath, finalManifest, 'utf8');
        } else throw new Error('No <application> tag');

        await fs.remove(classesDexPath);

        const rebuiltApkPath = path.join(tempWorkDir, 'unsigned.apk');
        await execShell(`apktool b "${decompileDir}" -o "${rebuiltApkPath}"`);

        const keystorePath = path.join(tempWorkDir, 'keystore.jks');
        const keystorePass = randomString(16);
        await generateRandomKeystore(keystorePath, keystorePass);
        const alignedApkPath = path.join(tempWorkDir, 'aligned.apk');
        await execShell(`zipalign -v -p 4 "${rebuiltApkPath}" "${alignedApkPath}"`);
        const signedApkPath = path.join(DOWNLOADS_DIR, `protected_${sessionId}.apk`);
        await execShell(`apksigner sign --ks "${keystorePath}" --ks-pass pass:${keystorePass} --out "${signedApkPath}" "${alignedApkPath}"`);

        await fs.remove(tempWorkDir);
        return signedApkPath;
    } catch (err) {
        await fs.remove(tempWorkDir).catch(() => {});
        throw err;
    }
}

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
    if (!document.mime_type || !document.mime_type.includes('application/vnd.android.package-archive')) {
        return ctx.reply('❌ Please send an APK file (extension .apk).');
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
