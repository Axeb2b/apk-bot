FROM node:18-slim

# Install Java, Android build-tools, apktool
RUN apt-get update && apt-get install -y openjdk-17-jdk-headless wget unzip zip && \
    wget https://dl.google.com/android/repository/build-tools_r34-linux.zip && \
    unzip build-tools_r34-linux.zip -d /android-sdk && \
    mv /android-sdk/build-tools/34.0.0/zipalign /usr/local/bin/ && \
    mv /android-sdk/build-tools/34.0.0/apksigner /usr/local/bin/ && \
    chmod +x /usr/local/bin/zipalign /usr/local/bin/apksigner && \
    wget https://raw.githubusercontent.com/iBotPeaches/Apktool/master/scripts/linux/apktool -O /usr/local/bin/apktool && \
    chmod +x /usr/local/bin/apktool && \
    apt-get clean

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV TG_BOT_TOKEN="your_token_here"
CMD ["node", "apk_protector_bot.js"]
