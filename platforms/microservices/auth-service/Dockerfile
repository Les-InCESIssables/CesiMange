# ===== Stage 1 : Builder =====
FROM node:22.14-alpine AS builder
WORKDIR /app

# Copier uniquement les fichiers de dépendances
COPY platforms/services/data-access-layer/package*.json platforms/services/data-access-layer/
COPY platforms/services/base-classes/package*.json platforms/services/base-classes/
COPY platforms/microservices/auth-service/package*.json platforms/microservices/auth-service/

# Installer et compiler les modules partagés
WORKDIR /app/platforms/services/data-access-layer
RUN npm install && npm run build

WORKDIR /app/platforms/services/base-classes
RUN npm install && npm run build

# Installer et compiler le service auth-service
WORKDIR /app/platforms/microservices/auth-service
RUN npm install && npm run build

# ===== Stage 2 : Image finale pour la production =====
FROM node:22.14-alpine
WORKDIR /app

# Copier uniquement les artefacts buildés (généralement dans dist)
COPY --from=builder /app/platforms/services/data-access-layer/dist platforms/services/data-access-layer/dist
COPY --from=builder /app/platforms/services/base-classes/dist platforms/services/base-classes/dist
COPY --from=builder /app/platforms/microservices/auth-service/dist platforms/microservices/auth-service/dist
COPY --from=builder /app/platforms/microservices/auth-service/package*.json platforms/microservices/auth-service/

WORKDIR /app/platforms/microservices/auth-service
RUN npm install --production

EXPOSE 4001
CMD ["node", "dist/app.js"]
