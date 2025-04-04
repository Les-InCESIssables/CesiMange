import { Repository, EDatabaseType, IBaseRepository } from '../../../../data-access-layer/src';

/**
 * Contrôleur de base générique
 * @template DTO - Type de données retourné/manipulé
 * @template CritereDTO - Type des critères de recherche
 */
export abstract class BaseMetier<DTO, CritereDTO> implements IBaseRepository<DTO, CritereDTO>
{
    protected Repository: Repository<DTO, CritereDTO>;
    protected CollectionName: string;
    protected ServiceName?: string;

    //#region CTOR
    constructor (pCollectionName: string, pModel?: any)
    {
        this.CollectionName = pCollectionName;
        let lDatabaseType: EDatabaseType = EDatabaseType.MONGODB;

        if (pModel)
            lDatabaseType = EDatabaseType.SQL_SERVER;

        const lRepo = new Repository<DTO, CritereDTO>(
            pCollectionName,
            lDatabaseType,
            pModel
        );
        this.Repository = lRepo;
    }
    //#endregion

    //#region CRUD
    /**
     * Obtenir tous les éléments selon des critères
     */
    async getItems(pCritereDTO: CritereDTO): Promise<DTO[]>
    {
        try
        {
            // Validation des critères si nécessaire
            this.validateCritereDTO(pCritereDTO);
            this.validateGetItems(pCritereDTO);

            // Appliquer des règles métier avant la récupération
            this.beforeGetItems(pCritereDTO);

            // Déléguer la récupération au repository
            const items = await this.Repository.getItems(pCritereDTO);

            // Appliquer des transformations ou règles après la récupération
            return items;
        } catch (error)
        {
            this.handleError(error, 'getItems');
            throw error;
        }
    }

    /**
     * Obtenir un élément par critères
     */
    async getItem(pCritereDTO: CritereDTO): Promise<DTO>
    {
        try
        {
            // Validation des critères
            this.validateCritereDTO(pCritereDTO);
            this.validateGetItem(pCritereDTO);

            // Appliquer des règles métier avant la récupération
            this.beforeGetItem(pCritereDTO);

            // Déléguer la récupération au repository
            const item = await this.Repository.getItem(pCritereDTO);

            return item;
        } catch (error)
        {
            this.handleError(error, 'getItem');
            throw error;
        }
    }

    /**
     * Créer un nouvel élément
     */
    async createItem(pDTO: DTO): Promise<DTO>
    {
        try
        {
            // Validation des données
            this.validateDTO(pDTO);
            await this.validateCreateItem(pDTO);

            // Appliquer des règles métier avant la création
            const preparedDTO = await this.beforeCreateItem(pDTO);

            // Déléguer la création au repository
            const item = await this.Repository.createItem(preparedDTO);

            return item;
        } catch (error)
        {
            this.handleError(error, 'createItem');
            throw error;
        }
    }

    /**
     * Mettre à jour un élément existant
     */
    async updateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO>
    {
        try
        {
            // Validation des données et critères
            this.validateDTO(pDTO);
            this.validateCritereDTO(pCritereDTO);
            await this.validateUpdateItem(pDTO, pCritereDTO);

            // Appliquer des règles métier avant la mise à jour
            const preparedDTO = await this.beforeUpdateItem(pDTO, pCritereDTO);

            // Déléguer la mise à jour au repository
            const item = await this.Repository.updateItem(preparedDTO, pCritereDTO);

            return item;
        } catch (error)
        {
            this.handleError(error, 'updateItem');
            throw error;
        }
    }

    /**
     * Supprimer un élément
     */
    async deleteItem(pCritereDTO: CritereDTO): Promise<boolean>
    {
        try
        {
            // Validation des critères
            this.validateCritereDTO(pCritereDTO);
            await this.validateDeleteItem(pCritereDTO);

            // Appliquer des règles métier avant la suppression
            await this.beforeDeleteItem(pCritereDTO);

            // Déléguer la suppression au repository
            const result = await this.Repository.deleteItem(pCritereDTO);

            if (result)
                await this.afterDeleteItem(pCritereDTO);

            return result;
        } catch (error)
        {
            this.handleError(error, 'deleteItem');
            throw error;
        }
    }

    /**
     * Vérifier si un élément existe selon des critères
     */
    async itemExists(pCritereDTO: CritereDTO): Promise<boolean>
    {
        try
        {
            // Validation des critères
            this.validateCritereDTO(pCritereDTO);

            // Déléguer la vérification au repository
            return await this.Repository.itemExists(pCritereDTO);
        } catch (error)
        {
            this.handleError(error, 'itemExists');
            throw error;
        }
    }
    //#endregion

    //#region Validation Errors

    /**
     * Valider les données avant création/mise à jour
     * À surcharger pour des validations spécifiques
     */
    protected validateDTO(pDTO: DTO): void
    {
        // Validation de base
        if (!pDTO)
        {
            throw new Error('Les données sont requises');
        }
    }

    /**
     * Valider les critères de recherche
     * À surcharger pour des validations spécifiques
     */
    protected validateCritereDTO(pCritereDTO: CritereDTO): void
    {
        // Validation de base
        if (!pCritereDTO)
        {
            throw new Error('Les critères sont requis');
        }
    }

    /**
     * Gestion des erreurs
     */
    protected handleError(error: any, methodName: string): void
    {
        console.error(`Erreur dans ${methodName}:`, error);
        // Logique spécifique de gestion des erreurs
    }

    /**
     * Méthodes de validation et prétraitement à implémenter
     * dans les classes dérivées
     */
    protected validateGetItems(pCritereDTO: CritereDTO): void
    {
        // Méthode à implémenter dans les classes dérivées
    }

    protected validateGetItem(pCritereDTO: CritereDTO): void
    {
        // Méthode à implémenter dans les classes dérivées
    }

    protected async validateCreateItem(pDTO: DTO): Promise<void>
    {
        // Méthode à implémenter dans les classes dérivées
    }

    protected async validateUpdateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<void>
    {
        // Méthode à implémenter dans les classes dérivées
    }

    protected async validateDeleteItem(pCritereDTO: CritereDTO): Promise<void>
    {
        // Méthode à implémenter dans les classes dérivées
    }

    protected beforeGetItems(pCritereDTO: CritereDTO): void
    {
        // Méthode à implémenter dans les classes dérivées
    }

    protected beforeGetItem(pCritereDTO: CritereDTO): void
    {
        // Méthode à implémenter dans les classes dérivées
    }

    protected async beforeCreateItem(pDTO: DTO): Promise<DTO>
    {
        return pDTO; // Par défaut, retourne l'objet non modifié
    }

    protected async beforeUpdateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO>
    {
        return pDTO; // Par défaut, retourne l'objet non modifié
    }

    protected async beforeDeleteItem(pCritereDTO: CritereDTO): Promise<void>
    {
        // Méthode à implémenter dans les classes dérivées
    }

    protected afterGetItems(pDTOs: DTO[]): DTO[]
    {
        return pDTOs;
    }

    protected async afterGetItem(pDTO: DTO, pRes?: Response): Promise<DTO>
    {
        return pDTO;
    }

    protected async afterCreateItem(pDTO: DTO): Promise<DTO>
    {
        return pDTO; // Par défaut, retourne l'objet non modifié
    }

    protected async afterUpdateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO>
    {
        return pDTO; // Par défaut, retourne l'objet non modifié
    }

    protected async afterDeleteItem(pCritereDTO: CritereDTO): Promise<void>
    {
        // À implémenter dans les classes dérivées
    }
    //#endregion
}