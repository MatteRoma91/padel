FROM node:18-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Installa dipendenze
RUN npm install --only=production

# Copia codice sorgente
COPY . .

# Crea directory uploads
RUN mkdir -p uploads

# Esponi porta
EXPOSE 3000

# Avvia server
CMD ["node", "src/server.js"]
