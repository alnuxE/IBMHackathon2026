# Dockerfile del frontend (Next.js) — NeoWallet
FROM node:20-alpine

WORKDIR /app

# Las variables NEXT_PUBLIC_ se inyectan EN BUILD TIME (van al bundle del navegador)
ARG NEXT_PUBLIC_ACCOUNTS_URL=http://localhost:3000
ARG NEXT_PUBLIC_PROCESSOR_URL=http://localhost:3001
ENV NEXT_PUBLIC_ACCOUNTS_URL=$NEXT_PUBLIC_ACCOUNTS_URL
ENV NEXT_PUBLIC_PROCESSOR_URL=$NEXT_PUBLIC_PROCESSOR_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
