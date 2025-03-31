import { AbstractDbRepository } from "./AbstractDbRepository";
import { IRepositoryConfig } from "../../interfaces/IRepositoryConfig";
import { BaseCritereDTO } from "../../models/base/BaseCritereDTO";
import
    {
        DataSource,
        Repository,
        ObjectLiteral,
        FindOptionsWhere,
        EntityTarget,
        Like,
        ILike,
        MoreThanOrEqual,
        LessThanOrEqual,
        In
    } from "typeorm";

/**
 * Repository pour la gestion des entit�s via TypeORM et SQL Server
 * @template DTO - Type de donn�es retourn�/manipul� qui �tend ObjectLiteral
 * @template CritereDTO - Type des crit�res de recherche qui �tend BaseCritereDTO
 */
export class SqlServerRepository<DTO extends ObjectLiteral, CritereDTO extends BaseCritereDTO> extends AbstractDbRepository<DTO, CritereDTO>
{
    //#region Attributes
    protected _dataSource: DataSource | undefined;
    protected _repository: Repository<DTO> | undefined;
    protected _DTOType: EntityTarget<DTO>;
    protected _isConnected: boolean = false;
    //#endregion

    //#region CTOR
    /**
     * Constructeur du repository SQL Server
     * @param pConfig Configuration du repository
     */
    constructor (pConfig: IRepositoryConfig)
    {
        super(pConfig);
        // Utiliser le nom de la collection comme cible d'entit�
        this._DTOType = pConfig.CollectionName;
    }
    //#endregion

    //#region Connection Methods
    /**
     * Initialise la connexion � la base de donn�es
     */
    public async initialize(): Promise<void>
    {
        try
        {
            if (!this._isConnected)
            {
                // Cr�er et initialiser la connexion si n�cessaire
                if (!this._dataSource)
                {
                    this._dataSource = new DataSource({
                        type: "mssql",
                        url: process.env.SQL_CONNECTION_STRING,
                        entities: ["src/entities/**/*.ts"],
                        synchronize: false,
                        logging: process.env.NODE_ENV === 'development'
                    });
                }

                if (!this._dataSource.isInitialized)
                {
                    await this._dataSource.initialize();
                    console.log("Connexion TypeORM �tablie");
                }

                // Obtenir le repository
                this._repository = this._dataSource.getRepository(this._DTOType);
                this._isConnected = true;
                console.log(`Repository pour '${this._config.CollectionName}' initialis�`);
            }
        } catch (error)
        {
            console.error("Erreur lors de l'initialisation de la connexion:", error);
            throw error;
        }
    }

    /**
     * S'assure que la connexion est �tablie avant d'ex�cuter une op�ration
     */
    protected async ensureConnection(): Promise<Repository<DTO>>
    {
        if (!this._isConnected || !this._repository)
        {
            await this.initialize();
        }
        return this._repository!;
    }

    /**
     * D�connecte le repository de la base de donn�es
     */
    async disconnect(): Promise<void>
    {
        try
        {
            if (this._dataSource && this._dataSource.isInitialized)
            {
                await this._dataSource.destroy();
                this._isConnected = false;
                console.log(`Repository pour '${this._config.CollectionName}' d�connect�`);
            }
        } catch (error)
        {
            console.error("Erreur lors de la d�connexion:", error);
            throw error;
        }
    }
    //#endregion

    //#region CRUD Operations
    /**
     * R�cup�re plusieurs �l�ments selon les crit�res
     * @param pCritereDTO - Crit�res de recherche
     * @returns Liste d'�l�ments correspondant aux crit�res
     */
    async getItems(pCritereDTO: CritereDTO): Promise<DTO[]>
    {
        try
        {
            const repository = await this.ensureConnection();
            const filter = this.buildFilter(pCritereDTO);

            // Options de recherche
            const findOptions: any = {
                where: filter,
            };

            // G�rer la pagination
            if (pCritereDTO.skip !== undefined)
            {
                findOptions.skip = pCritereDTO.skip;
            } else if (pCritereDTO.page !== undefined && pCritereDTO.pageSize !== undefined)
            {
                findOptions.skip = (pCritereDTO.page - 1) * pCritereDTO.pageSize;
                findOptions.take = pCritereDTO.pageSize;
            } else if (pCritereDTO.limit !== undefined)
            {
                findOptions.take = pCritereDTO.limit;
            }

            // G�rer le tri
            if (pCritereDTO.sort)
            {
                findOptions.order = {
                    [pCritereDTO.sort]: pCritereDTO.sortDirection || 'asc'
                };
            }

            // G�rer les relations (populate)
            if (pCritereDTO.populate && pCritereDTO.populate.length > 0)
            {
                findOptions.relations = pCritereDTO.populate;
            }

            // Ex�cuter la requ�te
            const results = await repository.find(findOptions);
            return this.formatResults(results);
        } catch (error)
        {
            console.error("Erreur lors de la r�cup�ration des �l�ments:", error);
            throw error;
        }
    }

    /**
     * R�cup�re un �l�ment sp�cifique selon les crit�res
     * @param pCritereDTO - Crit�res de recherche
     * @returns �l�ment correspondant aux crit�res
     */
    async getItem(pCritereDTO: CritereDTO): Promise<DTO>
    {
        try
        {
            const repository = await this.ensureConnection();
            const filter = this.buildFilter(pCritereDTO);

            const findOptions: any = {
                where: filter
            };

            // G�rer les relations (populate)
            if (pCritereDTO.populate && pCritereDTO.populate.length > 0)
            {
                findOptions.relations = pCritereDTO.populate;
            }

            const result = await repository.findOne(findOptions);

            if (!result)
            {
                throw new Error(`Aucun �l�ment trouv� pour les crit�res donn�s dans ${this._config.CollectionName}`);
            }

            return result;
        } catch (error)
        {
            console.error("Erreur lors de la r�cup�ration de l'�l�ment:", error);
            throw error;
        }
    }

    /**
     * Cr�e un nouvel �l�ment
     * @param pDTO - Donn�es pour la cr�ation
     * @returns �l�ment cr��
     */
    async createItem(pDTO: DTO): Promise<DTO>
    {
        try
        {
            const repository = await this.ensureConnection();
            const entity = repository.create(pDTO);

            const result = await repository.save(entity);
            return result;
        } catch (error)
        {
            console.error("Erreur lors de la cr�ation de l'�l�ment:", error);
            throw error;
        }
    }

    /**
     * Met � jour un �l�ment selon les crit�res
     * @param pDTO - Donn�es pour la mise � jour
     * @param pCritereDTO - Crit�res pour identifier l'�l�ment � mettre � jour
     * @returns �l�ment mis � jour
     */
    async updateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO>
    {
        try
        {
            const repository = await this.ensureConnection();
            const filter = this.buildFilter(pCritereDTO);

            // Trouver l'�l�ment � mettre � jour
            const itemToUpdate = await repository.findOne({
                where: filter
            });

            if (!itemToUpdate)
            {
                throw new Error(`Aucun �l�ment trouv� pour les crit�res donn�s dans ${this._config.CollectionName}`);
            }

            // Fusionner les donn�es
            const updatedItem = repository.merge(itemToUpdate, pDTO);

            // Sauvegarder les modifications
            const result = await repository.save(updatedItem);
            return result;
        } catch (error)
        {
            console.error("Erreur lors de la mise � jour de l'�l�ment:", error);
            throw error;
        }
    }

    /**
     * Supprime un �l�ment selon les crit�res
     * @param pCritereDTO - Crit�res pour identifier l'�l�ment � supprimer
     * @returns True si supprim� avec succ�s, false sinon
     */
    async deleteItem(pCritereDTO: CritereDTO): Promise<boolean>
    {
        try
        {
            const repository = await this.ensureConnection();
            const filter = this.buildFilter(pCritereDTO);

            const result = await repository.delete(filter);
            return result.affected ? result.affected > 0 : false;
        } catch (error)
        {
            console.error("Erreur lors de la suppression de l'�l�ment:", error);
            throw error;
        }
    }

    /**
     * V�rifie si un �l�ment existe selon les crit�res
     * @param pCritereDTO - Crit�res de recherche
     * @returns True si l'�l�ment existe, false sinon
     */
    async itemExists(pCritereDTO: CritereDTO): Promise<boolean>
    {
        try
        {
            const repository = await this.ensureConnection();
            const filter = this.buildFilter(pCritereDTO);

            const count = await repository.count({
                where: filter
            });

            return count > 0;
        } catch (error)
        {
            console.error("Erreur lors de la v�rification de l'existence de l'�l�ment:", error);
            throw error;
        }
    }
    //#endregion

    //#region Helper Methods
    /**
     * Construit un filtre TypeORM � partir des crit�res
     * @param pCritereDTO - Crit�res de recherche
     * @returns Filtre format� pour TypeORM
     */
    buildFilter(pCritereDTO: CritereDTO): any
    {
        const filter: any = {};

        // Traiter les champs sp�cifiques de BaseCritereDTO
        if (pCritereDTO.id)
        {
            filter.id = pCritereDTO.id;
        }

        if (pCritereDTO.ids && pCritereDTO.ids.length > 0)
        {
            filter.id = In(pCritereDTO.ids);
        }

        if (pCritereDTO.search)
        {
            // La recherche textuelle est sp�cifique � chaque entit�
            // Pour une impl�mentation g�n�rique, vous pourriez vouloir chercher dans tous les champs de type string
            // Mais comme cela d�pend de l'entit� sp�cifique, ici nous laissons cette partie � personnaliser
            // Exemple d'impl�mentation possible (� personnaliser selon vos besoins) :
            // const searchableFields = ['name', 'description', 'email']; // � adapter selon l'entit�
            // filter = [
            //    ...searchableFields.map(field => ({ [field]: ILike(`%${pCritereDTO.search}%`) }))
            // ];
        }

        // Ne pas inclure les �l�ments supprim�s sauf si demand�
        if (pCritereDTO.includeDeleted !== true && 'deletedAt' in filter)
        {
            filter.deletedAt = null;
        }

        // Parcourir les autres crit�res (sp�cifiques � l'entit�)
        for (const [key, value] of Object.entries(pCritereDTO))
        {
            // Ignorer les cl�s d�j� trait�es ou les cl�s sp�ciales
            if (['id', 'ids', 'search', 'page', 'pageSize', 'sort', 'sortDirection',
                'includeDeleted', 'limit', 'skip', 'populate'].includes(key))
            {
                continue;
            }

            // Ignorer les valeurs null/undefined
            if (value === null || value === undefined)
            {
                continue;
            }

            // Traitement sp�cifique selon le type de valeur
            if (typeof value === 'string')
            {
                // Recherche insensible � la casse avec % pour les cha�nes
                if (value.includes('%'))
                {
                    filter[key] = ILike(value);
                } else
                {
                    filter[key] = value;
                }
            } else if (this.isDate(value))
            {
                // Pour les dates
                filter[key] = value;
            } else if (typeof value === 'object')
            {
                // Pour les objets complexes (ex: ranges de dates)
                if ('start' in value && value.start)
                {
                    filter[key] = MoreThanOrEqual(value.start);
                }
                if ('end' in value && value.end)
                {
                    filter[key] = LessThanOrEqual(value.end);
                }
            } else
            {
                // Pour les autres types (nombres, bool�ens, etc.)
                filter[key] = value;
            }
        }

        return filter;
    }

    /**
     * Formate les r�sultats bruts en DTOs
     * @param pResults - R�sultats bruts de la base de donn�es
     * @returns Liste de DTOs format�s
     */
    formatResults(pResults: any[] | any): DTO[]
    {
        // Si c'est un tableau, formater chaque �l�ment
        if (Array.isArray(pResults))
        {
            return pResults.map(item => this.formatSingleResult(item));
        }

        // Si c'est un seul �l�ment, le formater et retourner dans un tableau
        return [this.formatSingleResult(pResults)];
    }

    /**
     * Formate un r�sultat individuel en DTO
     * @param pResult - R�sultat brut
     * @returns DTO format�
     */
    private formatSingleResult(pResult: any): DTO
    {
        // TypeORM r�cup�re g�n�ralement d�j� des objets bien format�s
        // Mais on peut ajouter des transformations sp�cifiques si n�cessaire
        return pResult as DTO;
    }
    //#endregion
}