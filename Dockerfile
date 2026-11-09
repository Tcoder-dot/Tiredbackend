FROM node:20-alpine AS builder

WORKDIR /app
COPY FLOATE-V2-BACKEND-ORIGINAL/package*.json ./
RUN npm install
COPY FLOATE-V2-BACKEND-ORIGINAL/ ./
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache fontconfig ttf-dejavu ttf-liberation ttf-freefont font-noto

COPY FLOATE-V2-BACKEND-ORIGINAL/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json* ./

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
