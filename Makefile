ENV ?= development
NO_CACHE ?= false
SERVICE ?=

up:
ifeq ($(ENV),development)
	docker-compose -f docker-compose.dev.yml up -d
else ifeq ($(ENV),staging)
	docker-compose -f docker-compose.staging.yml up -d
else ifeq ($(ENV),production)
	docker-compose -f docker-compose.prod.yml up -d
else
	@echo "Environnement inconnu : $(ENV). Utilisez development, staging ou production."
endif

down:
ifeq ($(ENV),development)
	docker-compose -f docker-compose.dev.yml stop
	docker-compose -f docker-compose.dev.yml down -v --remove-orphans
else ifeq ($(ENV),staging)
	docker-compose -f docker-compose.staging.yml stop
	docker-compose -f docker-compose.staging.yml down -v --remove-orphans
else ifeq ($(ENV),production)
	docker-compose -f docker-compose.prod.yml stop
	docker-compose -f docker-compose.prod.yml down -v --remove-orphans
else
	@echo "Environnement inconnu : $(ENV). Utilisez development, staging ou production."
endif

stop:
ifeq ($(ENV),development)
	docker-compose -f docker-compose.dev.yml stop
else ifeq ($(ENV),staging)
	docker-compose -f docker-compose.staging.yml stop
else ifeq ($(ENV),production)
	docker-compose -f docker-compose.prod.yml stop
else
	@echo "Environnement inconnu : $(ENV). Utilisez development, staging ou production."
endif

start:
ifeq ($(ENV),development)
	docker-compose -f docker-compose.dev.yml start
else ifeq ($(ENV),staging)
	docker-compose -f docker-compose.staging.yml start
else ifeq ($(ENV),production)
	docker-compose -f docker-compose.prod.yml start
else
	@echo "Environnement inconnu : $(ENV). Utilisez development, staging ou production."
endif

build:
ifeq ($(ENV),development)
ifneq ($(NO_CACHE),false)
	docker-compose -f docker-compose.dev.yml build --no-cache
else
	docker-compose -f docker-compose.dev.yml build
endif
else ifeq ($(ENV),staging)
ifneq ($(NO_CACHE),false)
	docker-compose -f docker-compose.staging.yml build --no-cache
else
	docker-compose -f docker-compose.staging.yml build
endif
else ifeq ($(ENV),production)
ifneq ($(NO_CACHE),false)
	docker-compose -f docker-compose.prod.yml build --no-cache
else
	docker-compose -f docker-compose.prod.yml build
endif
else
	@echo "Environnement inconnu : $(ENV). Utilisez development, staging ou production."
endif

build-service:
ifeq ($(SERVICE),)
	@echo "Veuillez préciser le nom du service avec SERVICE=<service_name>"
else
ifneq ($(NO_CACHE),false)
	docker-compose -f docker-compose.dev.yml build --no-cache $(SERVICE)
else
	docker-compose -f docker-compose.dev.yml build $(SERVICE)
endif
endif

restart-service:
ifeq ($(SERVICE),)
	@echo "Veuillez préciser le nom du service avec SERVICE=<service_name>"
else
	docker-compose -f docker-compose.dev.yml stop $(SERVICE)
	docker-compose -f docker-compose.dev.yml rm -f $(SERVICE)
ifneq ($(NO_CACHE),false)
	docker-compose -f docker-compose.dev.yml build --no-cache $(SERVICE)
else
	docker-compose -f docker-compose.dev.yml build $(SERVICE)
endif
	docker-compose -f docker-compose.dev.yml up -d $(SERVICE)
endif

logs:
ifeq ($(ENV),development)
	docker-compose -f docker-compose.dev.yml logs -f
else ifeq ($(ENV),staging)
	docker-compose -f docker-compose.staging.yml logs -f
else ifeq ($(ENV),production)
	docker-compose -f docker-compose.prod.yml logs -f
else
	@echo "Environnement inconnu : $(ENV). Utilisez development, staging ou production."
endif

rebuild-db-service:
ifeq ($(SERVICE),)
	@echo "Veuillez préciser le nom du service de base de données avec SERVICE=<db_service_name> (ex: mongodb-user)"
else
	@echo "Rebuild du service $(SERVICE) et suppression de ses volumes..."
	docker-compose -f docker-compose.dev.yml stop $(SERVICE)
	docker-compose -f docker-compose.dev.yml rm -f -v $(SERVICE)
	docker-compose -f docker-compose.dev.yml up -d $(SERVICE)
endif


help:
	@echo "Usage du Makefile:"
	@echo "  make up ENV=<environment>                        -> Créer et lancer les containers"
	@echo "  make down ENV=<environment>                      -> Supprimer les containers"
	@echo "  make start ENV=<environment>                     -> Démarrer des containers déjà créés"
	@echo "  make stop ENV=<environment>                      -> Stopper les containers sans les supprimer"
	@echo "  make restart ENV=<environment>                   -> Redémarrer les containers"
	@echo "  make logs ENV=<environment>                      -> Afficher les logs"
	@echo "  make build ENV=<environment> [NO_CACHE=true]     -> Rebuild complet"
	@echo "  make build-service SERVICE=<service_name> [NO_CACHE=true] -> Rebuild un service spécifique"
	@echo "  make restart-service SERVICE=<service_name> [NO_CACHE=true] -> Restart propre d'un service spécifique"
	@echo "  make help                                        -> Afficher ce message d'aide"
