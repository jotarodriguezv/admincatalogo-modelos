FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Crear carpeta de uploads si no existe
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "server.js"]
