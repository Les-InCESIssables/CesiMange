import { IBaseRepository } from "../../DAL/repositories/base/IBaseRepository";
import { BaseCritereDTO } from "../../models/base/BaseCritereDTO";
import { BaseDTO } from "../../models/base/BaseDTO";
import { IBaseController } from "./IBaseController";

/**
 * Contr�leur de base g�n�rique
 * @template DTO - Type de donn�es retourn�/manipul�
 * @template CritereDTO - Type des crit�res de recherche
 */
export abstract class BaseController<DTO extends BaseDTO, CritereDTO extends BaseCritereDTO> implements IBaseController<DTO, CritereDTO>
{
    protected repository: IBaseRepository<DTO, CritereDTO>;

    constructor (repository: IBaseRepository<DTO, CritereDTO>)
    {
        this.repository = repository;
    }

    /**
     * Obtenir tous les �l�ments selon des crit�res
     */
    async getItems(pCritereDTO: CritereDTO): Promise<DTO[]>
    {
        try
        {
            // Validation des crit�res si n�cessaire
            this.validateCritereDTO(pCritereDTO);

            // Appliquer des r�gles m�tier avant la r�cup�ration
            this.beforeGetItems(pCritereDTO);

            // D�l�guer la r�cup�ration au repository
            const items = await this.repository.getItems(pCritereDTO);

            // Appliquer des transformations ou r�gles apr�s la r�cup�ration
            return this.afterGetItems(items, pCritereDTO);
        } catch (error)
        {
            this.handleError(error, 'getItems');
            throw error;
        }
    }

    /**
     * Obtenir un �l�ment par crit�res
     */
    async getItem(pCritereDTO: CritereDTO): Promise<DTO>
    {
        try
        {
            // Validation des crit�res
            this.validateCritereDTO(pCritereDTO);

            // Appliquer des r�gles m�tier avant la r�cup�ration
            this.beforeGetItem(pCritereDTO);

            // D�l�guer la r�cup�ration au repository
            const item = await this.repository.getItem(pCritereDTO);

            // Appliquer des transformations ou r�gles apr�s la r�cup�ration
            return this.afterGetItem(item, pCritereDTO);
        } catch (error)
        {
            this.handleError(error, 'getItem');
            throw error;
        }
    }

    /**
     * Cr�er un nouvel �l�ment
     */
    async createItem(pDTO: DTO): Promise<DTO>
    {
        try
        {
            // Validation des donn�es
            this.validateDTO(pDTO);

            // Appliquer des r�gles m�tier avant la cr�ation
            const preparedDTO = await this.beforeCreateItem(pDTO);

            // D�l�guer la cr�ation au repository
            const item = await this.repository.createItem(preparedDTO);

            // Appliquer des actions apr�s la cr�ation
            return this.afterCreateItem(item);
        } catch (error)
        {
            this.handleError(error, 'createItem');
            throw error;
        }
    }

    /**
     * Mettre � jour un �l�ment existant
     */
    async updateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO>
    {
        try
        {
            // Validation des donn�es et crit�res
            this.validateDTO(pDTO);
            this.validateCritereDTO(pCritereDTO);

            // Appliquer des r�gles m�tier avant la mise � jour
            const preparedDTO = await this.beforeUpdateItem(pDTO, pCritereDTO);

            // D�l�guer la mise � jour au repository
            const item = await this.repository.updateItem(preparedDTO, pCritereDTO);

            // Appliquer des actions apr�s la mise � jour
            return this.afterUpdateItem(item, pDTO, pCritereDTO);
        } catch (error)
        {
            this.handleError(error, 'updateItem');
            throw error;
        }
    }

    /**
     * Supprimer un �l�ment
     */
    async deleteItem(pCritereDTO: CritereDTO): Promise<boolean>
    {
        try
        {
            // Validation des crit�res
            this.validateCritereDTO(pCritereDTO);

            // Appliquer des r�gles m�tier avant la suppression
            await this.beforeDeleteItem(pCritereDTO);

            // D�l�guer la suppression au repository
            const result = await this.repository.deleteItem(pCritereDTO);

            // Appliquer des actions apr�s la suppression
            await this.afterDeleteItem(result, pCritereDTO);

            return result;
        } catch (error)
        {
            this.handleError(error, 'deleteItem');
            throw error;
        }
    }

    /**
     * V�rifier si un �l�ment existe selon des crit�res
     */
    async itemExists(pCritereDTO: CritereDTO): Promise<boolean>
    {
        try
        {
            // Validation des crit�res
            this.validateCritereDTO(pCritereDTO);

            // D�l�guer la v�rification au repository
            return await this.repository.itemExists(pCritereDTO);
        } catch (error)
        {
            this.handleError(error, 'itemExists');
            throw error;
        }
    }

    //#region Validation Errors

    /**
   * Valider les donn�es avant cr�ation/mise � jour
   * � surcharger pour des validations sp�cifiques
   */
    protected validateDTO(pDTO: DTO): void
    {
        // Validation de base
        if (!pDTO)
        {
            throw new Error("Les donn�es sont requises");
        }
    }

    /**
     * Valider les crit�res de recherche
     * � surcharger pour des validations sp�cifiques
     */
    protected validateCritereDTO(pCritereDTO: CritereDTO): void
    {
        // Validation de base
        if (!pCritereDTO)
        {
            throw new Error("Les crit�res sont requis");
        }
    }

    /**
     * Actions avant de r�cup�rer plusieurs �l�ments
     */
    protected beforeGetItems(pCritereDTO: CritereDTO): void
    {
        // Par d�faut ne fait rien, � surcharger si n�cessaire
    }

    /**
     * Actions apr�s avoir r�cup�r� plusieurs �l�ments
     */
    protected afterGetItems(items: DTO[], pCritereDTO: CritereDTO): DTO[]
    {
        // Par d�faut retourne les �l�ments tels quels, � surcharger si n�cessaire
        return items;
    }

    /**
     * Actions avant de r�cup�rer un �l�ment
     */
    protected beforeGetItem(pCritereDTO: CritereDTO): void
    {
        // Par d�faut ne fait rien, � surcharger si n�cessaire
    }

    /**
     * Actions apr�s avoir r�cup�r� un �l�ment
     */
    protected afterGetItem(item: DTO, pCritereDTO: CritereDTO): DTO
    {
        // Par d�faut retourne l'�l�ment tel quel, � surcharger si n�cessaire
        return item;
    }

    /**
     * Actions avant de cr�er un �l�ment
     */
    protected async beforeCreateItem(pDTO: DTO): Promise<DTO>
    {
        // Par d�faut retourne les donn�es telles quelles, � surcharger si n�cessaire
        return pDTO;
    }

    /**
     * Actions apr�s avoir cr�� un �l�ment
     */
    protected afterCreateItem(item: DTO): DTO
    {
        // Par d�faut retourne l'�l�ment tel quel, � surcharger si n�cessaire
        return item;
    }

    /**
     * Actions avant de mettre � jour un �l�ment
     */
    protected async beforeUpdateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO>
    {
        // Par d�faut retourne les donn�es telles quelles, � surcharger si n�cessaire
        return pDTO;
    }

    /**
     * Actions apr�s avoir mis � jour un �l�ment
     */
    protected afterUpdateItem(item: DTO, originalDTO: DTO, pCritereDTO: CritereDTO): DTO
    {
        // Par d�faut retourne l'�l�ment tel quel, � surcharger si n�cessaire
        return item;
    }

    /**
     * Actions avant de supprimer un �l�ment
     */
    protected async beforeDeleteItem(pCritereDTO: CritereDTO): Promise<void>
    {
        // Par d�faut ne fait rien, � surcharger si n�cessaire
    }

    /**
     * Actions apr�s avoir supprim� un �l�ment
     */
    protected async afterDeleteItem(result: boolean, pCritereDTO: CritereDTO): Promise<void>
    {
        // Par d�faut ne fait rien, � surcharger si n�cessaire
    }

    /**
     * Gestion des erreurs
     */
    protected handleError(error: any, methodName: string): void
    {
        console.error(`Erreur dans ${methodName}:`, error);
        // Logique sp�cifique de gestion des erreurs
    } 
    //#endregion
}