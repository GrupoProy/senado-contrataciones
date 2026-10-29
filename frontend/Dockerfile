# Etapa 1: Construcción
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Compilamos la app de React
RUN npm run build

# Etapa 2: Servidor Web (Nginx)
FROM nginx:alpine
# Copiamos la carpeta dist generada por Vite
COPY --from=builder /app/dist /usr/share/nginx/html
# Copiamos nuestra configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
# ✅ Le decimos a Nginx que se mantenga encendido (no usa npm start)
CMD ["nginx", "-g", "daemon off;"]