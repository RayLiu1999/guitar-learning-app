FROM node:20-alpine

WORKDIR /app

# 啟用 corepack 以使用 pnpm
RUN corepack enable

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .

# 編譯 TypeScript
RUN pnpm build

EXPOSE 5000
CMD ["node", "dist/index.js"]
