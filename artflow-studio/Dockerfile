FROM node:20-alpine

WORKDIR /app

# Copy server package files
COPY server/package*.json ./server/
RUN cd server && npm ci --production

# Copy client package files and build
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copy source files
COPY server/ ./server/
COPY client/ ./client/

# Build client
RUN cd client && npm run build

# Move built client to server's public directory
RUN mv client/dist server/public

# Set working directory to server
WORKDIR /app/server

# Create uploads directory
RUN mkdir -p uploads/delivery

EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server.js"]
