# Etapa 1: Construcción
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: Producción
FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
# Copiamos la carpeta dist generada por TypeScript
COPY --from=builder /app/dist ./dist

# ✅ ELIMINAMOS ESTA LÍNEA:
# COPY --from=builder /app/.env .env

EXPOSE 3000

# Usamos el script start de tu package.json
CMD ["npm", "start"]