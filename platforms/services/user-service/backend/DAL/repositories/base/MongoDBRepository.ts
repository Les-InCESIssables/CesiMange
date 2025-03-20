import { Collection, Db, FindOptions, MongoClient, ObjectId } from "mongodb";
import { BaseCritereDTO } from "../../../models/base/BaseCritereDTO";
import { BaseDTO } from "../../../models/base/BaseDTO";
import { IRepositoryConfig } from "../../interfaces/IRepositoryConfig";
import { AbstractDbRepository } from "./AbstractDbRepository";

/**
 * Impl�mentation du repository pour MongoDB
 */
export class MongoDBRepository<DTO extends BaseDTO, CritereDTO extends BaseCritereDTO> extends AbstractDbRepository<DTO, CritereDTO>
{
    private _client: MongoClient | undefined;
    private _db: Db | undefined;
    private _collection: Collection | undefined;

    constructor (pConfig: IRepositoryConfig)
    {
        super(pConfig);
    }

    /**
     * Initialise la connexion MongoDB
     */
    public async initialize(): Promise<void>
    {
        try
        {
            if (!this._client)
            {
                this._client = new MongoClient(this._config.ConnectionString);
                await this._client.connect();
                console.log("Connexion MongoDB �tablie");
            }

            this._db = this._client.db(this._config.DbName);
            this._collection = this._db.collection(this._config.CollectionName);

            console.log(`Collection '${this._config.CollectionName}' pr�te � l'emploi`);
        } catch (error)
        {
            console.error("Erreur lors de l'initialisation de MongoDB:", error);
            throw error;
        }
    }

    /**
     * S'assure que la connexion est �tablie
     */
    private async ensureConnection(): Promise<void>
    {
        if (!this._collection)
        {
            await this.initialize();
        }
    }

    /**
     * Obtient tous les �l�ments selon des crit�res
     */
    async getItems(pCritereDTO: CritereDTO): Promise<DTO[]>
    {
        try
        {
            await this.ensureConnection();

            const lFilter = this.buildFilter(pCritereDTO);
            const lOptions = this.buildOptions(pCritereDTO);

            const lCursor = this._collection!.find(lFilter, lOptions);
            const lResults = await lCursor.toArray();

            return this.formatResults(lResults);
        } catch (error)
        {
            console.error("Erreur lors de la r�cup�ration des items:", error);
            throw error;
        }
    }

    /**
     * Obtient un �l�ment par crit�res
     */
    async getItem(pCritereDTO: CritereDTO): Promise<DTO>
    {
        try
        {
            await this.ensureConnection();

            const lFilter = this.buildFilter(pCritereDTO);

            if (Object.keys(lFilter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour obtenir un �l�ment");
            }

            const lResult = await this._collection!.findOne(lFilter);

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
     * Cr�e un nouvel �l�ment
     */
    async createItem(pDTO: DTO): Promise<DTO>
    {
        try
        {
            await this.ensureConnection();

            const lDoc = { ...pDTO } as any;

            if (lDoc.id || lDoc.id === undefined)
            {
                try
                {
                    lDoc._id = new ObjectId(lDoc.id);
                } catch (error)
                {
                    console.warn("ID non valide pour MongoDB, un nouvel ID sera g�n�r�");
                }
            }
            delete lDoc.id;

            lDoc.createdAt = new Date();
            lDoc.updatedAt = new Date();

            const lResult = await this._collection!.insertOne(lDoc);

            if (!lResult.acknowledged)
            {
                throw new Error("�chec de l'insertion du document");
            }

            const lCritereDTO = {} as CritereDTO;
            lCritereDTO.Id = lResult.insertedId.toString();

            return await this.getItem(lCritereDTO);
        } catch (error)
        {
            console.error("Erreur lors de la cr�ation de l'item:", error);
            throw error;
        }
    }

    /**
     * Met � jour un �l�ment existant
     */
    async updateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO>
    {
        try
        {
            await this.ensureConnection();

            const lFilter = this.buildFilter(pCritereDTO);

            if (Object.keys(lFilter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour la mise � jour");
            }

            const lUpdateData = { ...pDTO } as any;
            delete lUpdateData.id;
            lUpdateData.updatedAt = new Date();

            const lResult = await this._collection!.findOneAndUpdate(
                lFilter,
                { $set: lUpdateData },
                { returnDocument: 'after' }
            );

            if (!lResult)
            {
                throw new Error("L'�l�ment � mettre � jour n'existe pas");
            }

            return this.formatResults([lResult])[0];
        } catch (error)
        {
            console.error("Erreur lors de la mise � jour de l'item:", error);
            throw error;
        }
    }

    /**
     * Supprime un �l�ment
     */
    async deleteItem(pCritereDTO: CritereDTO): Promise<boolean>
    {
        try
        {
            await this.ensureConnection();

            const lFilter = this.buildFilter(pCritereDTO);

            if (Object.keys(lFilter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour la suppression");
            }

            const lResult = await this._collection!.deleteOne(lFilter);

            return lResult.deletedCount > 0;
        } catch (error)
        {
            console.error("Erreur lors de la suppression de l'item:", error);
            throw error;
        }
    }

    /**
     * V�rifie si un �l�ment existe selon des crit�res
     */
    async itemExists(pCritereDTO: CritereDTO): Promise<boolean>
    {
        try
        {
            await this.ensureConnection();

            const lFilter = this.buildFilter(pCritereDTO);

            if (Object.keys(lFilter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour v�rifier l'existence");
            }

            const lCount = await this._collection!.countDocuments(lFilter, { limit: 1 });

            return lCount > 0;
        } catch (error)
        {
            console.error("Erreur lors de la v�rification de l'existence:", error);
            throw error;
        }
    }

    /**
     * Construit les options de requ�te MongoDB
     */
    private buildOptions(pCritereDTO: CritereDTO): FindOptions
    {
        const lOptions: FindOptions = {};

        if (pCritereDTO.Limit)
        {
            lOptions.limit = pCritereDTO.Limit;
        }

        if (pCritereDTO.Skip)
        {
            lOptions.skip = pCritereDTO.Skip;
        }

        if (pCritereDTO.Sort)
        {
            const sortDirection = pCritereDTO.SortDirection || 1;
            lOptions.sort = { [pCritereDTO.Sort]: sortDirection };
        }

        return lOptions;
    }

    /**
     * Construit le filtre pour MongoDB
     */
    buildFilter(pCritereDTO: CritereDTO): any
    {
        const lFilter: any = {};
        const lKeyWords: string[] = ['Skip', 'SortDirection', 'Sort', 'Limit'];

        const processFilter = (key: string, value: any, filter: any) =>
        {
            if (value !== undefined && value !== null && value !== '' && !lKeyWords.includes(key))
            {
                if (key.toLowerCase() === 'id' || key === '_id')
                {
                    try
                    {
                        filter._id = new ObjectId(value as string);
                    } catch (error)
                    {
                        console.warn("ID non valide pour MongoDB:", value);
                    }
                } else if (key.endsWith('Like') && typeof value === 'string')
                {
                    const fieldName = key.replace(/Like$/, '');
                    const escapedValue = this.escapeRegex(value);
                    filter[fieldName] = { $regex: escapedValue, $options: 'i' };
                } else if (typeof value === 'object' && !Array.isArray(value))
                {
                    const fieldName = key.replace(/Like$/, '');
                    filter[fieldName] = { "$elemMatch": this.buildFilter(value) };
                } else if (Array.isArray(value))
                {
                    filter[key] = { $in: value };
                } else if (this.isDate(value))
                {
                    filter[key] = { $gte: value };
                } else
                {
                    filter[key] = value;
                }
            }
        };

        for (const [key, value] of Object.entries(pCritereDTO))
        {
            processFilter(key, value, lFilter);
        }

        return Object.keys(lFilter).length > 0 ? lFilter : {};
    }

    /**
     * Formate les r�sultats de MongoDB en DTOs
     */
    formatResults(pResults: any[]): DTO[]
    {
        return pResults.map(lDoc =>
        {
            const lFormatted: any = { ...lDoc, id: lDoc._id.toString() };
            delete lFormatted._id;
            return lFormatted as DTO;
        });
    }

    /**
     * Ferme la connexion � la base de donn�es
     */
    async disconnect(): Promise<void>
    {
        if (this._client)
        {
            await this._client.close();
            this._client = undefined;
            this._db = undefined;
            this._collection = undefined;
            console.log("Connexion MongoDB ferm�e");
        }
    }
}