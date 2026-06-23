# Dockerfile del frontend (Next.js)
FROM node:20-alpine

WORKDIR /app

# Las variables NEXT_PUBLIC_ se inyectan EN BUILD TIME (se incrustan en el bundle del navegador)
ARG NEXT_PUBLIC_AUTH_URL=http://localhost:4000
ARG NEXT_PUBLIC_CATALOG_URL=http://localhost:4001
ARG NEXT_PUBLIC_BOOKING_URL=http://localhost:4002
ENV NEXT_PUBLIC_AUTH_URL=$NEXT_PUBLIC_AUTH_URL
ENV NEXT_PUBLIC_CATALOG_URL=$NEXT_PUBLIC_CATALOG_URL
ENV NEXT_PUBLIC_BOOKING_URL=$NEXT_PUBLIC_BOOKING_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
