FROM openjdk:17-jdk-slim

# Install Node.js, wget, unzip
RUN apt-get update && \
    apt-get install -y curl wget unzip && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean

# Install Android build-tools (zipalign, apksigner)
RUN wget https://github.com/rendiix/termux-android/releases/download/build-tools/build-tools_r34.zip -O /tmp/bt.zip && \
    unzip /tmp/bt.zip -d /tmp/bt && \
    cp /tmp/bt/zipalign /tmp/bt/apksigner /usr/local/bin/ && \
    chmod +x /usr/local/bin/zipalign /usr/local/bin/apksigner && \
    rm -rf /tmp/bt*

# Install apktool.jar
RUN wget https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool.jar -O /usr/local/bin/apktool.jar

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY apk_protector_bot.js .

ENV TG_BOT_TOKEN=""
CMD ["node", "apk_protector_bot.js"]
