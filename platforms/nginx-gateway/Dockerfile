FROM nginx:stable-alpine

# Supprimer la configuration par défaut
RUN rm -f /etc/nginx/conf.d/default.conf

# Argument de build pour choisir l'environnement (par défaut "dev")
ARG ENVIRONMENT=dev

# Copier le fichier de configuration correspondant dans /etc/nginx/nginx.conf
COPY platforms/nginx-gateway/nginx.dev.conf /etc/nginx/nginx.conf


EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
