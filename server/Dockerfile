FROM node:20-bookworm-slim

# Install python3, ffmpeg, curl, and ca-certificates
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      python3-pip \
      ffmpeg \
      curl \
      ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install yt-dlp binary globally
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application files
COPY . .

# Expose port (Render sets $PORT dynamically)
ENV PORT=5050
EXPOSE 5050

CMD ["node", "index.js"]
