FROM eclipse-temurin:17-jre-alpine

# Install required packages (wget, unzip, bash)
RUN apk add --no-cache wget unzip bash

# Install Android build-tools (zipalign & apksigner)
RUN wget https://github.com/rendiix/termux-android/releases/download/build-tools/build-tools_r34.zip -O /tmp/build-tools.zip && \
    unzip /tmp/build-tools.zip -d /tmp/build-tools && \
    cp /tmp/build-tools/zipalign /usr/local/bin/ && \
    cp /tmp/build-tools/apksigner /usr/local/bin/ && \
    chmod +x /usr/local/bin/zipalign /usr/local/bin/apksigner && \
    rm -rf /tmp/build-tools*

# Install apktool.jar
RUN wget https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool.jar -O /usr/local/bin/apktool.jar && \
    chmod +x /usr/local/bin/apktool.jar

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy bot code
COPY apk_protector_bot.js .

# Environment variable
ENV TG_BOT_TOKEN=""

# Run bot
CMD ["node", "apk_protector_bot.js"]
