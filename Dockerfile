FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Install dependencies first so this layer is cached between code changes
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY src ./src

# Do not run the app as root
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/health || exit 1

CMD ["node", "src/server.js"]
