FROM node:18-slim

# Install Java (JRE) and utilities
RUN apt-get update && \
    apt-get install -y --no-install-recommends openjdk-17-jre-headless wget unzip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Verify Java
RUN java -version

# Install Android build-tools (zipalign & apksigner)
RUN wget https://github.com/rendiix/termux-android/releases/download/build-tools/build-tools_r34.zip -O /tmp/build-tools.zip && \
    unzip /tmp/build-tools.zip -d /tmp/build-tools && \
    cp /tmp/build-tools/zipalign /usr/local/bin/ && \
    cp /tmp/build-tools/apksigner /usr/local/bin/ && \
    chmod +x /usr/local/bin/zipalign /usr/local/bin/apksigner && \
    rm -rf /tmp/build-tools*

# Verify zipalign and apksigner
RUN which zipalign && zipalign -v || echo "zipalign missing"
RUN which apksigner && apksigner version || echo "apksigner missing"

# Install apktool.jar
RUN wget https://github.com/iBotPeaches/Apktool/releases/download/v2.9.3/apktool.jar -O /usr/local/bin/apktool.jar && \
    chmod +x /usr/local/bin/apktool.jar

# Verify apktool
RUN ls -la /usr/local/bin/apktool.jar

# Ensure all binaries are in PATH (though they should be)
ENV PATH="/usr/local/bin:$PATH"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY apk_protector_bot.js .

ENV TG_BOT_TOKEN=""
CMD ["node", "apk_protector_bot.js"]
