# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copia package files
COPY package*.json ./
RUN npm install

# Copia sorgenti
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copia build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia configurazione nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
