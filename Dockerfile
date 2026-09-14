FROM node:22-alpine

WORKDIR /app

# Node 22 y no 20: las versiones recientes de @supabase/supabase-js exigen
# WebSocket nativo, y en Node 20 el servidor se cae al arrancar ("Node.js 20 detected without
# native WebSocket support"). Pasó el 14/09/2026 al reconstruir la imagen.
COPY package*.json ./

# npm ci instala exactamente lo que dice package-lock.json. Con npm install y
# sin lockfile, cada construcción traía la última versión de cada librería, y
# así fue como una reconstrucción rompió el panel sin tocar el código.
RUN npm ci --omit=dev --no-audit --no-fund

COPY . .

# Crear carpeta de uploads si no existe
RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "server.js"]
