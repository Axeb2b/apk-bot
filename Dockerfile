FROM node:18-slim

# Install Java, wget, unzip
RUN apt-get update && apt-get install -y openjdk-17-jdk-headless wget unzip && \
    apt-get clean

# Install Android build-tools (zipalign & apksigner)
RUN wget https://dl.google.com/android/repository/build-tools_r34-linux.zip && \
    unzip build-tools_r34-linux.zip -d /android-build-tools && \
    cp /android-build-tools/zipalign /usr/local/bin/ && \
    cp /android-build-tools/apksigner /usr/local/bin/ && \
    chmod +x /usr/local/bin/zipalign /usr/local/bin/apksigner && \
    rm build-tools_r34-linux.zip

# Install Apktool (script + JAR)
RUN wget https://raw.githubusercontent.com/iBotPeaches/Apktool/master/scripts/linux/apktool -O /usr/local/bin/apktool && \
    wget https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool.jar -O /usr/local/bin/apktool.jar && \
    chmod +x /usr/local/bin/apktool && \
    chmod +x /usr/local/bin/apktool.jar

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy bot code
COPY apk_protector_bot.js .

# Environment variable will be set at runtime by Render
ENV TG_BOT_TOKEN=""

# Run the bot
CMD ["node", "apk_protector_bot.js"]
