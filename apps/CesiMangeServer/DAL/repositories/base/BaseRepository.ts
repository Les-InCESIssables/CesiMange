import { IBaseRepository } from "./IBaseRepository";
import { BaseCritereDTO } from "../../../models/base/BaseCritereDTO";
import { BaseDTO } from "../../../models/base/BaseDTO";
import { IRepositoryConfig } from "./IRepositoryConfig";
import { Collection, Db, ObjectId } from "mongodb";

/**
 * Contr�leur de base g�n�rique pour MongoDB
 * @template DTO - Type de donn�es retourn�/manipul� qui �tend BaseDTO
 * @template CritereDTO - Type des crit�res de recherche qui �tend BaseCritereDTO
 * @author Mahmoud Charif - CESIMANGE-118 - 17/03/2025 - Adaptation pour MongoDB
 */
export abstract class BaseRepository<DTO extends BaseDTO, CritereDTO extends BaseCritereDTO> implements IBaseRepository<DTO, CritereDTO>
{
    //#region Attributes
    protected _config: IRepositoryConfig;
    protected _db: Db;
    protected _collection: Collection; 
    //#endregion

    //#region CTOR

    constructor (pConfig: IRepositoryConfig)
    {
        this._config = pConfig;
    }

    //#endregion

    //#region Methods
    /**
* M�thode d'initialisation � impl�menter dans les sous-classes
*/
    abstract initialize(): Promise<void>;

    /**
     * Construit le filtre MongoDB � partir des crit�res
     */
    protected buildFilter(pCritereDTO: CritereDTO): any
    {
        const lFilter: any = {};

        if (pCritereDTO.Id)
        {
            lFilter._id = new ObjectId(pCritereDTO.Id);
        }

        // Impl�mentation d'autres conditions sp�cifiques au mod�le
        const lAdditionalConditions = this.getAdditionalConditions(pCritereDTO);
        Object.assign(lFilter, lAdditionalConditions);

        return lFilter;
    }

    /**
     * Obtenir tous les �l�ments selon des crit�res
     * @param pCritereDTO - Crit�res de recherche
     */
    async getItems(pCritereDTO: CritereDTO): Promise<DTO[]>
    {
        try
        {
            const lFilter = this.buildFilter(pCritereDTO);
            const lOptions = this.buildOptions(pCritereDTO);

            const lCursor = this._collection.find(lFilter, lOptions);
            const lResults = await lCursor.toArray();

            return this.formatResults(lResults);
        } catch (error)
        {
            console.error("Erreur lors de la r�cup�ration des items:", error);
            throw error;
        }
    }

    /**
     * Construit les options de requ�te MongoDB (tri, pagination, etc.)
     */
    protected buildOptions(pCritereDTO: CritereDTO): any
    {
        const lOptions: any = {};

        // Pagination
        if (pCritereDTO.Limit)
        {
            lOptions.limit = pCritereDTO.Limit;
        }

        if (pCritereDTO.Skip)
        {
            lOptions.skip = pCritereDTO.Skip;
        }

        // Tri
        if (pCritereDTO.Sort)
        {
            lOptions.sort = pCritereDTO.Sort;
        }

        return lOptions;
    }

    /**
     * Formate les r�sultats de la base de donn�es en DTOs
     */
    protected formatResults(pResults: any[]): DTO[]
    {
        return pResults.map(lDoc =>
        {
            // Convertir _id en id pour respecter le format DTO
            const lFormatted: any = { ...lDoc, id: lDoc._id.toString() };
            delete lFormatted._id;
            return lFormatted as DTO;
        });
    }

    /**
     * Obtenir un �l�ment par crit�res
     * @param pCritereDTO - Crit�res identifiant l'�l�ment
     */
    async getItem(pCritereDTO: CritereDTO): Promise<DTO>
    {
        try
        {
            const lFilter = this.buildFilter(pCritereDTO);

            if (Object.keys(lFilter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour obtenir un �l�ment");
            }

            const lResult = await this._collection.findOne(lFilter);

            if (!lResult)
            {
                throw new Error("�l�ment non trouv�");
            }

            return this.formatResults([lResult])[0];
        } catch (error)
        {
            console.error("Erreur lors de la r�cup�ration de l'item:", error);
            throw error;
        }
    }

    /**
     * Cr�er un nouvel �l�ment
     * @param pDTO - Donn�es pour la cr�ation
     */
    async createItem(pDTO: DTO): Promise<DTO>
    {
        try
        {
            // Pr�parer le document
            const lDoc = { ...pDTO } as any;
            delete lDoc.id; // MongoDB g�re automatiquement _id

            // Ajouter les timestamps
            lDoc.createdAt = new Date();
            lDoc.updatedAt = new Date();

            const lResult = await this._collection.insertOne(lDoc);

            if (!lResult.acknowledged)
            {
                throw new Error("�chec de l'insertion du document");
            }
            let CritereDTO: CritereDTO;
            CritereDTO.Id = pDTO.id;
            return await this.getItem(CritereDTO);

        } catch (error)
        {
            console.error("Erreur lors de la cr�ation de l'item:", error);
            throw error;
        }
    }

    /**
     * Mettre � jour un �l�ment existant
     * @param pDTO - Donn�es pour la mise � jour
     * @param pCritereDTO - Crit�res identifiant l'�l�ment � mettre � jour
     */
    async updateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO>
    {
        try
        {
            const lFilter = this.buildFilter(pCritereDTO);

            if (Object.keys(lFilter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour la mise � jour");
            }

            // Pr�parer les donn�es � mettre � jour
            const lUpdateData = { ...pDTO } as any;
            delete lUpdateData.id; // Ne pas inclure l'id dans les champs � mettre � jour
            lUpdateData.updatedAt = new Date();

            const lResult = await this._collection.findOneAndUpdate(
                lFilter,
                { $set: lUpdateData },
                { returnDocument: 'after' }
            );

            if (!lResult.value)
            {
                throw new Error("L'�l�ment � mettre � jour n'existe pas");
            }

            return this.formatResults([lResult.value])[0];
        } catch (error)
        {
            console.error("Erreur lors de la mise � jour de l'item:", error);
            throw error;
        }
    }

    /**
     * Supprimer un �l�ment
     * @param pCritereDTO - Crit�res pour la suppression
     */
    async deleteItem(pCritereDTO: CritereDTO): Promise<boolean>
    {
        try
        {
            const lFilter = this.buildFilter(pCritereDTO);

            if (Object.keys(lFilter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour la suppression");
            }

            const lResult = await this._collection.deleteOne(lFilter);

            return lResult.deletedCount > 0;
        } catch (error)
        {
            console.error("Erreur lors de la suppression de l'item:", error);
            throw error;
        }
    }

    /**
     * V�rifier si un �l�ment existe selon des crit�res
     * @param pCritereDTO - Crit�res de recherche
     */
    async itemExists(pCritereDTO: CritereDTO): Promise<boolean>
    {
        try
        {
            const lFilter = this.buildFilter(pCritereDTO);

            if (Object.keys(lFilter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour v�rifier l'existence");
            }

            const lCount = await this._collection.countDocuments(lFilter, { limit: 1 });

            return lCount > 0;
        } catch (error)
        {
            console.error("Erreur lors de la v�rification de l'existence:", error);
            throw error;
        }
    }

    /**
     * � surcharger dans les classes d�riv�es pour ajouter des conditions sp�cifiques
     */
    protected getAdditionalConditions(pCritereDTO: CritereDTO): any
    {
        return {};
    } 
    //#endregion
}