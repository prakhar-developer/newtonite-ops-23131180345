# Production Dockerfile for instOS
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

# Install dependencies
COPY package*.json ./
COPY tsconfig*.json ./
COPY prisma/ ./prisma/
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN npm install

# Generate Prisma Client & compile static web bundles
RUN npx prisma generate
RUN npm run build:web
RUN npm run build:widget

EXPOSE 4000

CMD ["npm", "start"]
