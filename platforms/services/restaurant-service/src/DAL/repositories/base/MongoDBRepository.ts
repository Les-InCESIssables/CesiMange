import mongoose, { Document, Model, FilterQuery, PipelineStage, UpdateQuery } from 'mongoose';
import { IRepositoryConfig } from "../../interfaces/IRepositoryConfig";
import { AbstractDbRepository } from "./AbstractDbRepository";

/**
 * Impl�mentation du repository pour Mongoose
 */
export class MongoDBRepository<T, U> extends AbstractDbRepository<T, U>
{
    private _model: Model<any> | undefined;

    constructor (pConfig: IRepositoryConfig)
    {
        super(pConfig);
    }

    /**
     * Initialise la connexion Mongoose
     */
    public async initialize(): Promise<void>
    {
        try
        {
            if (mongoose.connection.readyState !== 1)
            {
                await mongoose.connect(this._config.ConnectionString);
                console.log("Connexion Mongoose �tablie");
            }

            // R�cup�ration du mod�le (doit �tre pr�alablement d�fini)
            this._model = mongoose.model(this._config.CollectionName);

            if (!this._model)
            {
                throw new Error(`Mod�le Mongoose '${this._config.CollectionName}' non trouv�`);
            }

            console.log(`Mod�le '${this._config.CollectionName}' pr�t � l'emploi`);
        } catch (error)
        {
            console.error("Erreur lors de l'initialisation de Mongoose:", error);
            throw error;
        }
    }

    /**
     * S'assure que la connexion est �tablie
     */
    private async ensureConnection(): Promise<void>
    {
        if (!this._model)
        {
            await this.initialize();
        }
    }

    /**
     * Obtient tous les �l�ments selon des crit�res
     */
    async getItems(criteres: U): Promise<T[]>
    {
        try
        {
            await this.ensureConnection();

            const filter = this.buildFilter(criteres);
            const options = this.buildOptions(criteres);

            let query = this._model!.find(filter);

            // Application des options
            if (options.sort)
            {
                query = query.sort(options.sort);
            }
            if (options.skip)
            {
                query = query.skip(options.skip);
            }
            if (options.limit)
            {
                query = query.limit(options.limit);
            }
            if (options.populate)
            {
                options.populate.forEach(field =>
                {
                    query = query.populate(field);
                });
            }

            const results = await query.exec();
            return this.formatResults(results);
        } catch (error)
        {
            console.error("Erreur lors de la r�cup�ration des items:", error);
            throw error;
        }
    }

    /**
     * Obtient un �l�ment par crit�res
     */
    async getItem(criteres: U): Promise<T>
    {
        try
        {
            await this.ensureConnection();

            const filter = this.buildFilter(criteres);
            const options = this.buildOptions(criteres);

            if (Object.keys(filter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour obtenir un �l�ment");
            }

            let query = this._model!.findOne(filter);

            // Application des populate si n�cessaire
            if (options.populate)
            {
                options.populate.forEach(field =>
                {
                    query = query.populate(field);
                });
            }

            const result = await query.exec();

            if (!result)
            {
                throw new Error("�l�ment non trouv�");
            }

            return this.formatResults([result])[0];
        } catch (error)
        {
            console.error("Erreur lors de la r�cup�ration de l'item:", error);
            throw error;
        }
    }

    /**
     * Cr�e un nouvel �l�ment
     */
    async createItem(data: T): Promise<T>
    {
        try
        {
            await this.ensureConnection();

            const newDocument = new this._model!(data);
            const result = await newDocument.save();

            return this.formatResults([result])[0];
        } catch (error)
        {
            console.error("Erreur lors de la cr�ation de l'item:", error);
            throw error;
        }
    }

    /**
     * Met � jour un �l�ment existant
     */
    async updateItem(data: T, criteres: U): Promise<T>
    {
        try
        {
            await this.ensureConnection();

            const filter = this.buildFilter(criteres);

            if (Object.keys(filter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour la mise � jour");
            }

            // Pr�paration des donn�es � mettre � jour
            const updateData = { ...data } as any;
            if (updateData.id)
            {
                delete updateData.id;
            }

            // Options pour retourner le document mis � jour
            const options = { new: true, runValidators: true };

            const result = await this._model!.findOneAndUpdate(
                filter,
                updateData as UpdateQuery<any>,
                options
            ).exec();

            if (!result)
            {
                throw new Error("L'�l�ment � mettre � jour n'existe pas");
            }

            return this.formatResults([result])[0];
        } catch (error)
        {
            console.error("Erreur lors de la mise � jour de l'item:", error);
            throw error;
        }
    }

    /**
     * Supprime un �l�ment
     */
    async deleteItem(criteres: U): Promise<boolean>
    {
        try
        {
            await this.ensureConnection();

            const filter = this.buildFilter(criteres);

            if (Object.keys(filter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour la suppression");
            }

            const result = await this._model!.deleteOne(filter).exec();

            return result.deletedCount > 0;
        } catch (error)
        {
            console.error("Erreur lors de la suppression de l'item:", error);
            throw error;
        }
    }

    /**
     * V�rifie si un �l�ment existe selon des crit�res
     */
    async itemExists(criteres: U): Promise<boolean>
    {
        try
        {
            await this.ensureConnection();

            const filter = this.buildFilter(criteres);

            if (Object.keys(filter).length === 0)
            {
                throw new Error("Au moins un crit�re est requis pour v�rifier l'existence");
            }

            const count = await this._model!.countDocuments(filter).limit(1).exec();

            return count > 0;
        } catch (error)
        {
            console.error("Erreur lors de la v�rification de l'existence:", error);
            throw error;
        }
    }

    /**
     * Compte le nombre d'�l�ments selon des crit�res
     */
    async countItems(criteres: U): Promise<number>
    {
        try
        {
            await this.ensureConnection();

            const filter = this.buildFilter(criteres);
            const count = await this._model!.countDocuments(filter).exec();

            return count;
        } catch (error)
        {
            console.error("Erreur lors du comptage des items:", error);
            throw error;
        }
    }

    /**
     * Ex�cute une agr�gation MongoDB
     */
    async aggregate(pipeline: PipelineStage[]): Promise<any[]>
    {
        try
        {
            await this.ensureConnection();

            const results = await this._model!.aggregate(pipeline).exec();
            return results;
        } catch (error)
        {
            console.error("Erreur lors de l'agr�gation:", error);
            throw error;
        }
    }

    /**
     * Construit les options de requ�te Mongoose
     */
    private buildOptions(criteres: U):
        {
            sort?: Record<string, 1 | -1>;
            skip?: number;
            limit?: number;
            populate?: string[];
        }
    {
        const options: {
            sort?: Record<string, 1 | -1>;
            skip?: number;
            limit?: number;
            populate?: string[];
        } = {};

        const criteresObj = criteres as any;

        // Pagination
        if (criteresObj.limit !== undefined)
        {
            options.limit = Number(criteresObj.limit);
        }

        if (criteresObj.page !== undefined && criteresObj.limit !== undefined)
        {
            options.skip = (Number(criteresObj.page) - 1) * Number(criteresObj.limit);
        } else if (criteresObj.skip !== undefined)
        {
            options.skip = Number(criteresObj.skip);
        }

        // Tri
        if (criteresObj.sort)
        {
            const direction = criteresObj.order === 'desc' ? -1 : 1;
            options.sort = { [criteresObj.sort]: direction };
        }

        // Populate
        if (criteresObj.populate)
        {
            options.populate = Array.isArray(criteresObj.populate)
                ? criteresObj.populate
                : [criteresObj.populate];
        }

        return options;
    }

    /**
     * Construit le filtre pour Mongoose
     */
    buildFilter(criteres: U): FilterQuery<any>
    {
        const filter: FilterQuery<any> = {};
        const criteresObj = criteres as any;
        const skipFields = ['page', 'limit', 'skip', 'sort', 'order', 'populate'];

        for (const [key, value] of Object.entries(criteresObj))
        {
            // Ignorer les champs pour la pagination et le tri
            if (skipFields.includes(key))
            {
                continue;
            }

            // Ignorer les valeurs vides
            if (value === undefined || value === null || value === '')
            {
                continue;
            }

            // Cas sp�cial pour l'identifiant
            if (key.toLowerCase() === 'id')
            {
                filter._id = value;
                continue;
            }

            // Recherche par texte (contient)
            if (key.endsWith('Like') && typeof value === 'string')
            {
                const fieldName = key.replace(/Like$/, '');
                filter[fieldName] = { $regex: value, $options: 'i' };
                continue;
            }

            // Recherche dans un tableau
            if (Array.isArray(value))
            {
                filter[key] = { $in: value };
                continue;
            }

            // Cas g�n�ral
            filter[key] = value;
        }

        return filter;
    }

    /**
     * Formate les r�sultats de Mongoose en DTOs
     */
    formatResults(results: Document[]): T[]
    {
        return results.map(doc =>
        {
            const obj = doc.toObject ? doc.toObject() : doc;
            const formatted: any = { ...obj, id: obj._id.toString() };
            delete formatted._id;
            delete formatted.__v;
            return formatted as T;
        });
    }

    /**
     * Ferme la connexion � la base de donn�es
     */
    async disconnect(): Promise<void>
    {
        if (mongoose.connection.readyState === 1)
        {
            await mongoose.disconnect();
            this._model = undefined;
            console.log("Connexion Mongoose ferm�e");
        }
    }
}