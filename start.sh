#!/bin/bash

# Install required system packages
apt-get update
apt-get install -y openjdk-17-jdk-headless wget unzip

# Install Android build-tools
wget https://dl.google.com/android/repository/build-tools_r34-linux.zip
unzip build-tools_r34-linux.zip
cp build-tools/34.0.0/zipalign /usr/local/bin/
cp build-tools/34.0.0/apksigner /usr/local/bin/
chmod +x /usr/local/bin/zipalign /usr/local/bin/apksigner

# Install Apktool
wget https://raw.githubusercontent.com/iBotPeaches/Apktool/master/scripts/linux/apktool -O /usr/local/bin/apktool
wget https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool.jar -O /usr/local/bin/apktool.jar
chmod +x /usr/local/bin/apktool /usr/local/bin/apktool.jar

# Start bot
node apk_protector_bot.js
