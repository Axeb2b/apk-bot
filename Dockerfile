FROM node:18-slim

# Install dependencies, Java, and unzip
RUN apt-get update && apt-get install -y openjdk-17-jdk-headless wget unzip curl && \
    apt-get clean

# Download and extract Android build-tools (with correct path)
RUN wget https://dl.google.com/android/repository/build-tools_r34-linux.zip && \
    unzip build-tools_r34-linux.zip -d /android-build-tools && \
    # binary files are inside a nested directory structure
    cp /android-build-tools/build-tools/34.0.0/zipalign /usr/local/bin/ && \
    cp /android-build-tools/build-tools/34.0.0/apksigner /usr/local/bin/ && \
    chmod +x /usr/local/bin/zipalign /usr/local/bin/apksigner && \
    rm build-tools_r34-linux.zip

# Install Apktool (script + jar)
RUN wget https://raw.githubusercontent.com/iBotPeaches/Apktool/master/scripts/linux/apktool -O /usr/local/bin/apktool && \
    wget https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool.jar -O /usr/local/bin/apktool.jar && \
    chmod +x /usr/local/bin/apktool && \
    chmod +x /usr/local/bin/apktool.jar

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY apk_protector_bot.js .

ENV TG_BOT_TOKEN=""
CMD ["node", "apk_protector_bot.js"]
