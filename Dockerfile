FROM node:18-slim

# Install Java and utilities
RUN apt-get update && apt-get install -y openjdk-17-jdk-headless wget unzip && \
    apt-get clean

# Install Android build-tools (zipalign & apksigner) from GitHub mirror
RUN wget https://github.com/rendiix/termux-android/releases/download/build-tools/build-tools_r34.zip -O /tmp/build-tools.zip && \
    unzip /tmp/build-tools.zip -d /tmp/build-tools && \
    cp /tmp/build-tools/zipalign /usr/local/bin/ && \
    cp /tmp/build-tools/apksigner /usr/local/bin/ && \
    chmod +x /usr/local/bin/zipalign /usr/local/bin/apksigner && \
    rm -rf /tmp/build-tools*

# Install apktool.jar only (no wrapper script)
RUN wget https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool.jar -O /usr/local/bin/apktool.jar && \
    chmod +x /usr/local/bin/apktool.jar

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY apk_protector_bot.js .

ENV TG_BOT_TOKEN=""
CMD ["node", "apk_protector_bot.js"]
