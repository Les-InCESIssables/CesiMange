import { IBaseMetier } from './IBaseMetier';
import { Repository, EDatabaseType } from '../../../../data-access-layer/src';

/**
 * Contr�leur de base g�n�rique
 * @template DTO - Type de donn�es retourn�/manipul�
 * @template CritereDTO - Type des crit�res de recherche
 */
export abstract class BaseMetier<DTO, CritereDTO> implements IBaseMetier<DTO, CritereDTO> {
    protected Repository: Repository<DTO, CritereDTO>;

    //#region CTOR
    constructor(pCollectionName: string) {
        const lRepo = new Repository<DTO, CritereDTO>(pCollectionName, EDatabaseType.MONGODB);
        this.Repository = lRepo;
    }

    //#endregion

    //#region CRUD
    /**
     * Obtenir tous les �l�ments selon des crit�res
     */
    async getItems(pCritereDTO: CritereDTO): Promise<DTO[]> {
        try {
            // Validation des crit�res si n�cessaire
            this.validateCritereDTO(pCritereDTO);

            // Appliquer des r�gles m�tier avant la r�cup�ration
            this.beforeGetItems(pCritereDTO);

            // D�l�guer la r�cup�ration au repository
            const items = await this.Repository.getItems(pCritereDTO);

            // Appliquer des transformations ou r�gles apr�s la r�cup�ration
            return items;
        } catch (error) {
            this.handleError(error, 'getItems');
            throw error;
        }
    }

    /**
     * Obtenir un �l�ment par crit�res
     */
    async getItem(pCritereDTO: CritereDTO): Promise<DTO> {
        try {
            // Validation des crit�res
            this.validateCritereDTO(pCritereDTO);

            // Appliquer des r�gles m�tier avant la r�cup�ration
            this.beforeGetItem(pCritereDTO);

            // D�l�guer la r�cup�ration au repository
            const item = await this.Repository.getItem(pCritereDTO);

            return item;
        } catch (error) {
            this.handleError(error, 'getItem');
            throw error;
        }
    }

    /**
     * Cr�er un nouvel �l�ment
     */
    async createItem(pDTO: DTO): Promise<DTO> {
        try {
            // Validation des donn�es
            this.validateDTO(pDTO);

            // Appliquer des r�gles m�tier avant la cr�ation
            const preparedDTO = await this.beforeCreateItem(pDTO);

            // D�l�guer la cr�ation au repository
            const item = await this.Repository.createItem(preparedDTO);

            return item;
        } catch (error) {
            this.handleError(error, 'createItem');
            throw error;
        }
    }

    /**
     * Mettre � jour un �l�ment existant
     */
    async updateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO> {
        try {
            // Validation des donn�es et crit�res
            this.validateDTO(pDTO);
            this.validateCritereDTO(pCritereDTO);

            // Appliquer des r�gles m�tier avant la mise � jour
            const preparedDTO = await this.beforeUpdateItem(pDTO, pCritereDTO);

            // D�l�guer la mise � jour au repository
            const item = await this.Repository.updateItem(preparedDTO, pCritereDTO);

            return item;
        } catch (error) {
            this.handleError(error, 'updateItem');
            throw error;
        }
    }

    /**
     * Supprimer un �l�ment
     */
    async deleteItem(pCritereDTO: CritereDTO): Promise<boolean> {
        try {
            // Validation des crit�res
            this.validateCritereDTO(pCritereDTO);

            // Appliquer des r�gles m�tier avant la suppression
            await this.beforeDeleteItem(pCritereDTO);

            // D�l�guer la suppression au repository
            const result = await this.Repository.deleteItem(pCritereDTO);

            return result;
        } catch (error) {
            this.handleError(error, 'deleteItem');
            throw error;
        }
    }

    /**
     * V�rifier si un �l�ment existe selon des crit�res
     */
    async itemExists(pCritereDTO: CritereDTO): Promise<boolean> {
        try {
            // Validation des crit�res
            this.validateCritereDTO(pCritereDTO);

            // D�l�guer la v�rification au repository
            return await this.Repository.itemExists(pCritereDTO);
        } catch (error) {
            this.handleError(error, 'itemExists');
            throw error;
        }
    }
    //#endregion

    //#region Validation Errors

    /**
     * Valider les donn�es avant cr�ation/mise � jour
     * � surcharger pour des validations sp�cifiques
     */
    protected validateDTO(pDTO: DTO): void {
        // Validation de base
        if (!pDTO) {
            throw new Error('Les donn�es sont requises');
        }
    }

    /**
     * Valider les crit�res de recherche
     * � surcharger pour des validations sp�cifiques
     */
    protected validateCritereDTO(pCritereDTO: CritereDTO): void {
        // Validation de base
        if (!pCritereDTO) {
            throw new Error('Les crit�res sont requis');
        }
    }

    /**
     * Actions avant de r�cup�rer plusieurs �l�ments
     */
    protected beforeGetItems(pCritereDTO: CritereDTO): void {
        // Par d�faut ne fait rien, � surcharger si n�cessaire
    }

    /**
     * Actions avant de r�cup�rer un �l�ment
     */
    protected beforeGetItem(pCritereDTO: CritereDTO): void {
        // Par d�faut ne fait rien, � surcharger si n�cessaire
    }

    /**
     * Actions avant de cr�er un �l�ment
     */
    protected async beforeCreateItem(pDTO: DTO): Promise<DTO> {
        // Par d�faut retourne les donn�es telles quelles, � surcharger si n�cessaire
        return pDTO;
    }

    /**
     * Actions avant de mettre � jour un �l�ment
     */
    protected async beforeUpdateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO> {
        // Par d�faut retourne les donn�es telles quelles, � surcharger si n�cessaire
        return pDTO;
    }

    /**
     * Actions avant de supprimer un �l�ment
     */
    protected async beforeDeleteItem(pCritereDTO: CritereDTO): Promise<void> {
        // Par d�faut ne fait rien, � surcharger si n�cessaire
    }

    /**
     * Gestion des erreurs
     */
    protected handleError(error: any, methodName: string): void {
        console.error(`Erreur dans ${methodName}:`, error);
        // Logique sp�cifique de gestion des erreurs
    }
    //#endregion
}
