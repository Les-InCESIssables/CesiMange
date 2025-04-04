﻿import { AbstractDbRepository } from './AbstractDbRepository';
import { IRepositoryConfig } from '../../interfaces/IRepositoryConfig';
import { BaseCritereDTO } from '../../models/base/BaseCritereDTO';
import {
    DataSource,
    Repository,
    ObjectLiteral,
    FindOptionsWhere,
    EntityTarget,
    Like,
    ILike,
    MoreThanOrEqual,
    LessThanOrEqual,
    In,
    EntitySchema,
} from 'typeorm';

/**
 * Repository pour la gestion des entités via TypeORM et SQL Server
 * @template DTO - Type de données retourné/manipulé qui étend ObjectLiteral
 * @template CritereDTO - Type des critères de recherche qui étend BaseCritereDTO
 */
export class SqlServerRepository<DTO extends ObjectLiteral, CritereDTO extends BaseCritereDTO> extends AbstractDbRepository<DTO, CritereDTO> {
    //#region Attributes
    protected _dataSource: DataSource | undefined;
    protected _repository: Repository<DTO> | undefined;
    protected _DTOType: any;
    protected _isConnected: boolean = false;
    //#endregion

    //#region CTOR
    /**
     * Constructeur du repository SQL Server
     * @param pConfig Configuration du repository
     * @param pModel Modèle d'entité
     */
    constructor(pConfig: IRepositoryConfig, pModel: any) {
        super(pConfig);
        this._DTOType = pModel; // Use pModel directly instead of CollectionName
    }
    //#endregion

    //#region Connection Methods
    /**
     * Initialise la connexion à la base de données
     */
    public async initialize(): Promise<void> {
        try {
            if (!this._isConnected) {
                // Créer et initialiser la connexion si nécessaire
                if (!this._dataSource) {
                    this._dataSource = new DataSource({
                        type: 'mssql',
                        host: process.env.DB_SERVER,
                        port: parseInt(process.env.DB_PORT || '1433'),
                        database: process.env.DB_NAME,
                        username: process.env.DB_USER,
                        password: process.env.DB_PASSWORD,
                        options: {
                            encrypt: process.env.DB_ENCRYPT === 'true',
                        },
                        extra: {
                            trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
                            connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '30000'),
                        },
                        entities: [this._DTOType],
                        synchronize: false,
                        logging: process.env.NODE_ENV === 'development',
                    });
                }

                if (!this._dataSource.isInitialized) {
                    await this._dataSource.initialize();
                    console.log('Connexion TypeORM établie');
                }

                // Obtenir le repository
                this._repository = this._dataSource.getRepository<DTO>(this._DTOType);
                this._isConnected = true;
                console.log(`Repository pour '${this._config.CollectionName}' initialisé`);
            }
        } catch (error) {
            console.error("Erreur lors de l'initialisation de la connexion:", error);
            throw error;
        }
    }

    /**
     * S'assure que la connexion est établie avant d'exécuter une opération
     */
    protected async ensureConnection(): Promise<Repository<DTO>> {
        if (!this._isConnected || !this._repository) {
            await this.initialize();
        }
        return this._repository!;
    }

    /**
     * Déconnecte le repository de la base de données
     */
    async disconnect(): Promise<void> {
        try {
            if (this._dataSource && this._dataSource.isInitialized) {
                await this._dataSource.destroy();
                this._isConnected = false;
                console.log(`Repository pour '${this._config.CollectionName}' déconnecté`);
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
            throw error;
        }
    }
    //#endregion

    //#region CRUD Operations
    /**
     * Récupère plusieurs éléments selon les critères
     * @param pCritereDTO - Critères de recherche
     * @returns Liste d'éléments correspondant aux critères
     */
    async getItems(pCritereDTO: CritereDTO): Promise<DTO[]> {
        try {
            const repository = await this.ensureConnection();
            const filter = this.buildFilter(pCritereDTO);

            // Options de recherche
            const findOptions: any = {
                where: filter,
            };

            // Gérer la pagination
            if (pCritereDTO.skip !== undefined) {
                findOptions.skip = pCritereDTO.skip;
            } else if (pCritereDTO.page !== undefined && pCritereDTO.pageSize !== undefined) {
                findOptions.skip = (pCritereDTO.page - 1) * pCritereDTO.pageSize;
                findOptions.take = pCritereDTO.pageSize;
            } else if (pCritereDTO.limit !== undefined) {
                findOptions.take = pCritereDTO.limit;
            }

            // Gérer le tri
            if (pCritereDTO.sort) {
                findOptions.order = {
                    [pCritereDTO.sort]: pCritereDTO.sortDirection || 'asc',
                };
            }

            // Gérer les relations (populate)
            if (pCritereDTO.populate && pCritereDTO.populate.length > 0) {
                findOptions.relations = pCritereDTO.populate;
            }

            // Exécuter la requête
            const results = await repository.find(findOptions);
            return this.formatResults(results);
        } catch (error) {
            console.error('Erreur lors de la récupération des éléments:', error);
            throw error;
        }
    }

    /**
     * Récupère un élément spécifique selon les critères
     * @param pCritereDTO - Critères de recherche
     * @returns Élément correspondant aux critères
     */
    async getItem(pCritereDTO: CritereDTO): Promise<DTO> {
        try {
            const repository = await this.ensureConnection();
            const filter = this.buildFilter(pCritereDTO);

            const findOptions: any = {
                where: filter,
            };

            // Gérer les relations (populate)
            if (pCritereDTO.populate && pCritereDTO.populate.length > 0) {
                findOptions.relations = pCritereDTO.populate;
            }

            const result: DTO | null = await repository.findOne(findOptions);
            // cm - Renvoie vide sir
            return result && result.email ? result : ({} as DTO);
        } catch (error) {
            console.error("Erreur lors de la récupération de l'élément:", error);
            throw error;
        }
    }

    /**
     * Crée un nouvel élément
     * @param pDTO - Données pour la création
     * @returns Élément créé
     */
    async createItem(pDTO: DTO): Promise<DTO> {
        try {
            const repository = await this.ensureConnection();
            const entity = repository.create(pDTO);

            const result = await repository.save(entity);
            return result;
        } catch (error) {
            console.error("Erreur lors de la création de l'élément:", error);
            throw error;
        }
    }

    /**
     * Met à jour un élément selon les critères
     * @param pDTO - Données pour la mise à jour
     * @param pCritereDTO - Critères pour identifier l'élément à mettre à jour
     * @returns Élément mis à jour
     */
    async updateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO> {
        try {
            const repository = await this.ensureConnection();
            const filter = this.buildFilter(pCritereDTO);

            // Trouver l'élément à mettre à jour
            const itemToUpdate = await repository.findOne({
                where: filter,
            });

            if (!itemToUpdate) {
                throw new Error(`Aucun élément trouvé pour les critères donnés dans ${this._config.CollectionName}`);
            }

            // Fusionner les données
            const updatedItem = repository.merge(itemToUpdate, pDTO);

            // Sauvegarder les modifications
            const result = await repository.save(updatedItem);
            return result;
        } catch (error) {
            console.error("Erreur lors de la mise à jour de l'élément:", error);
            throw error;
        }
    }

    /**
     * Supprime un élément selon les critères
     * @param pCritereDTO - Critères pour identifier l'élément à supprimer
     * @returns True si supprimé avec succès, false sinon
     */
    async deleteItem(pCritereDTO: CritereDTO): Promise<boolean> {
        try {
            const repository = await this.ensureConnection();
            const filter = this.buildFilter(pCritereDTO);

            const result = await repository.delete(filter);
            return result.affected ? result.affected > 0 : false;
        } catch (error) {
            console.error("Erreur lors de la suppression de l'élément:", error);
            throw error;
        }
    }

    /**
     * Vérifie si un élément existe selon les critères
     * @param pCritereDTO - Critères de recherche
     * @returns True si l'élément existe, false sinon
     */
    async itemExists(pCritereDTO: CritereDTO): Promise<boolean> {
        try {
            const repository = await this.ensureConnection();
            const filter = this.buildFilter(pCritereDTO);

            const count = await repository.count({
                where: filter,
            });

            return count > 0;
        } catch (error) {
            console.error("Erreur lors de la vérification de l'existence de l'élément:", error);
            throw error;
        }
    }
    //#endregion

    //#region Helper Methods
    /**
     * Construit un filtre TypeORM à partir des critères
     * @param pCritereDTO - Critères de recherche
     * @returns Filtre formaté pour TypeORM
     */
    buildFilter(pCritereDTO: CritereDTO): any {
        const filter: any = {};

        // Traiter les champs spécifiques de BaseCritereDTO
        if (pCritereDTO.id) {
            filter.id = pCritereDTO.id;
        }

        if (pCritereDTO.ids && pCritereDTO.ids.length > 0) {
            filter.id = In(pCritereDTO.ids);
        }

        if (pCritereDTO.search) {
            // La recherche textuelle est spécifique à chaque entité
            // Pour une implémentation générique, vous pourriez vouloir chercher dans tous les champs de type string
            // Mais comme cela dépend de l'entité spécifique, ici nous laissons cette partie à personnaliser
            // Exemple d'implémentation possible (à personnaliser selon vos besoins) :
            // const searchableFields = ['name', 'description', 'email']; // À adapter selon l'entité
            // filter = [
            //    ...searchableFields.map(field => ({ [field]: ILike(`%${pCritereDTO.search}%`) }))
            // ];
        }

        // Ne pas inclure les éléments supprimés sauf si demandé
        if (pCritereDTO.includeDeleted !== true && 'deletedAt' in filter) {
            filter.deletedAt = null;
        }

        // Parcourir les autres critères (spécifiques à l'entité)
        for (const [key, value] of Object.entries(pCritereDTO)) {
            // Ignorer les clés déjà traitées ou les clés spéciales
            if (['id', 'ids', 'search', 'page', 'pageSize', 'sort', 'sortDirection', 'includeDeleted', 'limit', 'skip', 'populate'].includes(key)) {
                continue;
            }

            // Ignorer les valeurs null/undefined
            if (value === null || value === undefined) {
                continue;
            }

            // Traitement spécifique selon le type de valeur
            if (typeof value === 'string') {
                // Recherche insensible à la casse avec % pour les chaînes
                if (value.includes('%')) {
                    filter[key] = ILike(value);
                } else {
                    filter[key] = value;
                }
            } else if (this.isDate(value)) {
                // Pour les dates
                filter[key] = value;
            } else if (typeof value === 'object') {
                // Pour les objets complexes (ex: ranges de dates)
                if ('start' in value && value.start) {
                    filter[key] = MoreThanOrEqual(value.start);
                }
                if ('end' in value && value.end) {
                    filter[key] = LessThanOrEqual(value.end);
                }
            } else {
                // Pour les autres types (nombres, booléens, etc.)
                filter[key] = value;
            }
        }

        return filter;
    }

    /**
     * Formate les résultats bruts en DTOs
     * @param pResults - Résultats bruts de la base de données
     * @returns Liste de DTOs formatés
     */
    formatResults(pResults: any[] | any): DTO[] {
        // Si c'est un tableau, formater chaque élément
        if (Array.isArray(pResults)) {
            return pResults.map((item) => this.formatSingleResult(item));
        }

        // Si c'est un seul élément, le formater et retourner dans un tableau
        return [this.formatSingleResult(pResults)];
    }

    /**
     * Formate un résultat individuel en DTO
     * @param pResult - Résultat brut
     * @returns DTO formaté
     */
    private formatSingleResult(pResult: any): DTO {
        // TypeORM récupère généralement déjà des objets bien formatés
        // Mais on peut ajouter des transformations spécifiques si nécessaire
        return pResult as DTO;
    }
    //#endregion
}
