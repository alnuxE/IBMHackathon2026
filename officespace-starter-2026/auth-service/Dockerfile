# Dockerfile del auth-service
FROM node:20-alpine

WORKDIR /app

# Instala dependencias primero (mejor cache)
COPY package*.json ./
RUN npm install --omit=dev

# Copia el código
COPY . .

EXPOSE 4000

CMD ["node", "server.js"]
