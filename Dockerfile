# build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc -p tsconfig.json

# final image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production \
    PORT=80

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --production

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 80

# entry point
CMD ["node", "dist/main.js"]
