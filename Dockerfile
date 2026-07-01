FROM node:20-slim

# Install Chrome for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    libgbm1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# Copy server files
COPY server/ ./

# Create data directories
RUN mkdir -p scans scans/processed downloads data

# Expose port
EXPOSE 3000

CMD ["node", "server.js"]
