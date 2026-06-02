#!/bin/bash
set -e  # Stop on any error

echo "=== Starting APK Bot Setup ==="

# Update and install Java, wget, unzip
apt-get update
apt-get install -y openjdk-17-jdk-headless wget unzip

# Download Android build-tools
echo "Downloading build-tools..."
wget -q https://dl.google.com/android/repository/build-tools_r34-linux.zip -O /tmp/build-tools.zip
unzip -q /tmp/build-tools.zip -d /tmp/build-tools
cp /tmp/build-tools/build-tools/34.0.0/zipalign /usr/local/bin/
cp /tmp/build-tools/build-tools/34.0.0/apksigner /usr/local/bin/
chmod +x /usr/local/bin/zipalign /usr/local/bin/apksigner
rm -rf /tmp/build-tools*

# Download Apktool
echo "Downloading Apktool..."
wget -q https://raw.githubusercontent.com/iBotPeaches/Apktool/master/scripts/linux/apktool -O /usr/local/bin/apktool
wget -q https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool.jar -O /usr/local/bin/apktool.jar
chmod +x /usr/local/bin/apktool /usr/local/bin/apktool.jar

# Verify installations
echo "Verifying tools:"
which java
java -version
which zipalign && zipalign -v || echo "zipalign missing"
which apksigner && apksigner version || echo "apksigner missing"
which apktool && apktool --version || echo "apktool missing"

# Set PATH explicitly (though should be fine)
export PATH=$PATH:/usr/local/bin

# Start bot
echo "Starting bot..."
node apk_protector_bot.js
