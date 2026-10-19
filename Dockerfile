# Production Dockerfile for instOS
FROM node:20-alpine

WORKDIR /app

# Copy configuration and source files
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma/ ./prisma/
COPY packages/ ./packages/
COPY apps/ ./apps/

# Install ALL dependencies including dev tools (vite, typescript) needed for building
RUN npm install --include=dev

# Generate Prisma client and build frontend assets
RUN npx prisma generate
RUN npm run build:web
RUN npm run build:widget

# Set production runtime environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Start command launches the server directly
CMD ["npm", "start"]
