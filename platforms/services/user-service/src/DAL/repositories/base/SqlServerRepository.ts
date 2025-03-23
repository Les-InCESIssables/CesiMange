import { BaseCritereDTO } from "../../../models/base/BaseCritereDTO";
import { BaseDTO } from "../../../models/base/BaseDTO";
import { AbstractDbRepository } from "./AbstractDbRepository";
import { IRepositoryConfig } from "../../interfaces/IRepositoryConfig";
import * as sql from 'mssql';

/**
 * Repository de base g�n�rique pour SQL Server
 * @template DTO - Type de donn�es retourn�/manipul� qui �tend BaseDTO
 * @template CritereDTO - Type des crit�res de recherche qui �tend BaseCritereDTO
 * @author Mahmoud Charif - CESIMANGE-118 - 20/03/2025 - Impl�mentation pour SQL Server
 */
export class SqlServerRepository<DTO extends BaseDTO, CritereDTO extends BaseCritereDTO> extends AbstractDbRepository<DTO, CritereDTO>
{
    //#region Attributes
    protected _sqlPool: sql.ConnectionPool | undefined;
    protected _tableName: string;
    //#endregion

    //#region CTOR
    constructor (pConfig: IRepositoryConfig)
    {
        super(pConfig);
        this._tableName = pConfig.CollectionName;
    }
    //#endregion

    //#region Methods
    /**
     * M�thode d'initialisation de la connexion SQL Server
     */
    public async initialize(): Promise<void>
    {
        try
        {
            // V�rifier si la connexion existe d�j�
            if (!this._sqlPool)
            {
                //// Configurer la connexion SQL Server
                //const sqlConfig: sql.config = {
                //    user: this._config.User,
                //    password: this._config.Password,
                //    database: this._config.DbName,
                //    server: this._config.Server || 'localhost',
                //    pool: {
                //        max: 10,
                //        min: 0,
                //        idleTimeoutMillis: 30000
                //    },
                //    options: {
                //        encrypt: true, // Pour Azure
                //        trustServerCertificate: true // � utiliser pour le d�veloppement local
                //    }
                //};

                //// Cr�er le pool de connexion
                //this._sqlPool = await new sql.ConnectionPool(sqlConfig).connect();
                console.log("Connexion SQL Server �tablie");
            }

            console.log(`Table '${this._tableName}' pr�te � l'emploi`);
        } catch (error)
        {
            console.error("Erreur lors de l'initialisation de SQL Server:", error);
            throw error;
        }
    }

    /**
     * S'assure que la connexion est �tablie avant d'ex�cuter une op�ration
     */
    protected async ensureConnection(): Promise<void>
    {
        if (!this._sqlPool)
        {
            await this.initialize();
        }
    }

    //#region CRUD
    /**
     * Obtenir tous les �l�ments selon des crit�res
     * @param pCritereDTO - Crit�res de recherche
     */
    async getItems(pCritereDTO: CritereDTO): Promise<DTO[]>
    {
        try
        {
            await this.ensureConnection();

            const { query, parameters } = this.buildSqlQuery(pCritereDTO);

            const request = this._sqlPool!.request();

            // Ajout des param�tres � la requ�te
            for (const [key, value] of Object.entries(parameters))
            {
                request.input(key, value);
            }

            const result = await request.query(query);
            return this.formatResults(result.recordset);
        } catch (error)
        {
            console.error("Erreur lors de la r�cup�ration des items:", error);
            throw error;
        }
    }

    /**
     * Obtenir un �l�ment par crit�res
     * @param pCritereDTO - Crit�res identifiant l'�l�ment
     */
    async getItem(pCritereDTO: CritereDTO): Promise<DTO>
    {
        try
        {
            await this.ensureConnection();

            const { query, parameters } = this.buildSqlQuery(pCritereDTO, true);

            const request = this._sqlPool!.request();

            // Ajout des param�tres � la requ�te
            for (const [key, value] of Object.entries(parameters))
            {
                request.input(key, value);
            }

            const result = await request.query(query);

            if (!result.recordset || result.recordset.length === 0)
            {
                throw new Error("�l�ment non trouv�");
            }

            return this.formatResults([result.recordset[0]])[0];
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
            await this.ensureConnection();

            // Pr�parer les donn�es pour l'insertion
            const lData = { ...pDTO } as any;

            // Ajouter les timestamps si n�cessaire
            if (!lData.createdAt)
            {
                lData.createdAt = new Date();
            }
            if (!lData.updatedAt)
            {
                lData.updatedAt = new Date();
            }

            // Construire la requ�te d'insertion
            const columns = Object.keys(lData).filter(key => key !== 'id' || lData.id !== undefined);
            const valueParams = columns.map(col => `@${col}`);

            const query = `
                INSERT INTO ${this._tableName} (${columns.join(', ')})
                OUTPUT INSERTED.* 
                VALUES (${valueParams.join(', ')})
            `;

            const request = this._sqlPool!.request();

            // Ajouter les param�tres
            for (const column of columns)
            {
                request.input(column, lData[column]);
            }

            // Ex�cuter la requ�te
            const result = await request.query(query);

            if (!result.recordset || result.recordset.length === 0)
            {
                throw new Error("�chec de l'insertion");
            }

            return this.formatResults([result.recordset[0]])[0];
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
            await this.ensureConnection();

            // V�rifier les crit�res
            const whereClause = this.buildSqlWhereClause(pCritereDTO);
            if (!whereClause.conditions)
            {
                throw new Error("Au moins un crit�re est requis pour la mise � jour");
            }

            // Pr�parer les donn�es pour la mise � jour
            const lData = { ...pDTO } as any;
            delete lData.id; // Ne pas inclure l'id dans les champs � mettre � jour
            lData.updatedAt = new Date();

            // Construire les colonnes � mettre � jour
            const updateColumns = Object.keys(lData).map(col => `${col} = @${col}`);

            // Construire la requ�te de mise � jour
            const query = `
                UPDATE ${this._tableName}
                SET ${updateColumns.join(', ')}
                OUTPUT INSERTED.*
                WHERE ${whereClause.conditions}
            `;

            const request = this._sqlPool!.request();

            // Ajouter les param�tres pour les valeurs � mettre � jour
            for (const [col, value] of Object.entries(lData))
            {
                request.input(col, value);
            }

            // Ajouter les param�tres pour les conditions WHERE
            for (const [key, value] of Object.entries(whereClause.parameters))
            {
                request.input(key, value);
            }

            // Ex�cuter la requ�te
            const result = await request.query(query);

            if (!result.recordset || result.recordset.length === 0)
            {
                throw new Error("L'�l�ment � mettre � jour n'existe pas");
            }

            return this.formatResults([result.recordset[0]])[0];
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
            await this.ensureConnection();

            // V�rifier les crit�res
            const whereClause = this.buildSqlWhereClause(pCritereDTO);
            if (!whereClause.conditions)
            {
                throw new Error("Au moins un crit�re est requis pour la suppression");
            }

            // Construire la requ�te de suppression
            const query = `
                DELETE FROM ${this._tableName}
                OUTPUT DELETED.id
                WHERE ${whereClause.conditions}
            `;

            const request = this._sqlPool!.request();

            // Ajouter les param�tres pour les conditions WHERE
            for (const [key, value] of Object.entries(whereClause.parameters))
            {
                request.input(key, value);
            }

            // Ex�cuter la requ�te
            const result = await request.query(query);

            return result.recordset && result.recordset.length > 0;
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
            await this.ensureConnection();

            // V�rifier les crit�res
            const whereClause = this.buildSqlWhereClause(pCritereDTO);
            if (!whereClause.conditions)
            {
                throw new Error("Au moins un crit�re est requis pour v�rifier l'existence");
            }

            // Construire la requ�te d'existence
            const query = `
                SELECT TOP 1 1 AS exists_flag
                FROM ${this._tableName}
                WHERE ${whereClause.conditions}
            `;

            const request = this._sqlPool!.request();

            // Ajouter les param�tres pour les conditions WHERE
            for (const [key, value] of Object.entries(whereClause.parameters))
            {
                request.input(key, value);
            }

            // Ex�cuter la requ�te
            const result = await request.query(query);

            return result.recordset && result.recordset.length > 0;
        } catch (error)
        {
            console.error("Erreur lors de la v�rification de l'existence:", error);
            throw error;
        }
    }
    //#endregion

    //#region Build
    /**
     * Construit un filtre MongoDB � partir des crit�res
     * Impl�mentation requise par la classe abstraite
     */
    buildFilter(pCritereDTO: CritereDTO): any
    {
        // Cette m�thode est destin�e � MongoDB, donc on renvoie un objet vide
        // pour SQL Server, nous utilisons buildSqlWhereClause � la place
        return {};
    }

    /**
     * Construit la clause WHERE pour SQL Server
     */
    protected buildSqlWhereClause(pCritereDTO: CritereDTO): { conditions: string, parameters: any }
    {
        const conditions: string[] = [];
        const parameters: any = {};
        const lKeyWords: string[] = ['Skip', 'SortDirection', 'Sort', 'Limit'];

        for (const [key, value] of Object.entries(pCritereDTO))
        {
            if (value !== undefined && value !== null && value !== '' && !lKeyWords.includes(key))
            {
                const paramName = `where_${key}`;

                // Gestion sp�ciale de l'ID
                if (key.toLowerCase() === 'id')
                {
                    conditions.push(`id = @${paramName}`);
                    parameters[paramName] = value;
                }
                // Gestion des champs "Like"
                else if (key.endsWith('Like') && typeof value === 'string')
                {
                    const fieldName = key.replace(/Like$/, '');
                    conditions.push(`${fieldName} LIKE @${paramName}`);
                    parameters[paramName] = `%${value}%`;
                }
                // Gestion des tableaux (IN)
                else if (Array.isArray(value) && value.length > 0)
                {
                    const placeholders = value.map((_, idx) => `@${paramName}_${idx}`).join(', ');
                    conditions.push(`${key} IN (${placeholders})`);

                    value.forEach((val, idx) =>
                    {
                        parameters[`${paramName}_${idx}`] = val;
                    });
                }
                // Gestion des dates
                else if (this.isDate(value))
                {
                    conditions.push(`${key} >= @${paramName}`);
                    parameters[paramName] = new Date(value);
                }
                // Gestion des autres types
                else
                {
                    conditions.push(`${key} = @${paramName}`);
                    parameters[paramName] = value;
                }
            }
        }

        // Ajouter les conditions suppl�mentaires sp�cifiques aux classes d�riv�es
        const additionalConditions = this.getAdditionalConditions(pCritereDTO);
        for (const [key, value] of Object.entries(additionalConditions))
        {
            if (value !== undefined && value !== null)
            {
                const paramName = `additional_${key}`;
                conditions.push(key);
                parameters[paramName] = value;
            }
        }

        return {
            conditions: conditions.join(' AND '),
            parameters
        };
    }

    /**
     * Construit la requ�te SQL compl�te
     */
    protected buildSqlQuery(pCritereDTO: CritereDTO, singleItem: boolean = false): { query: string, parameters: any }
    {
        const whereClause = this.buildSqlWhereClause(pCritereDTO);
        let query = `SELECT * FROM ${this._tableName}`;

        // Ajouter la clause WHERE si n�cessaire
        if (whereClause.conditions)
        {
            query += ` WHERE ${whereClause.conditions}`;
        }

        // Ajouter le tri
        if (pCritereDTO.sort)
        {
            const direction = pCritereDTO.sortDirection ? 'DESC' : 'ASC';
            query += ` ORDER BY ${pCritereDTO.sort} ${direction}`;
        }

        // Ajouter la pagination pour les requ�tes qui ne demandent pas un seul �l�ment
        if (!singleItem)
        {
            if (pCritereDTO.skip && pCritereDTO.limit)
            {
                query += ` OFFSET ${pCritereDTO.skip} ROWS FETCH NEXT ${pCritereDTO.limit} ROWS ONLY`;
            } else if (pCritereDTO.limit)
            {
                query += ` OFFSET 0 ROWS FETCH NEXT ${pCritereDTO.limit} ROWS ONLY`;
            }
        } else
        {
            // Pour un seul �l�ment, limiter � 1
            query += ' OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY';
        }

        return {
            query,
            parameters: whereClause.parameters
        };
    }
    //#endregion

    //#region Utils
    /**
     * Formate les r�sultats de SQL Server en DTOs
     */
    formatResults(pResults: any[]): DTO[]
    {
        return pResults.map(record =>
        {
            // Conversion des dates et autres formats si n�cessaire
            const formattedRecord: any = {};

            for (const [key, value] of Object.entries(record))
            {
                // Conversion des dates SQL Server en objets Date JavaScript
                if (value instanceof Date)
                {
                    formattedRecord[key] = new Date(value);
                } else
                {
                    formattedRecord[key] = value;
                }
            }

            return formattedRecord as DTO;
        });
    }
    //#endregion

    /**
     * Ferme la connexion � la base de donn�es
     */
    async disconnect(): Promise<void>
    {
        if (this._sqlPool)
        {
            await this._sqlPool.close();
            this._sqlPool = undefined;
            console.log("Connexion SQL Server ferm�e");
        }
    }

    /**
     * � surcharger dans les classes d�riv�es pour ajouter des conditions sp�cifiques
     */
    protected getAdditionalConditions(pCritereDTO: CritereDTO): any
    {
        return {};
    }

    /**
     * Ex�cute une proc�dure stock�e SQL Server
     * @param procedureName - Nom de la proc�dure stock�e
     * @param parameters - Param�tres � passer � la proc�dure
     */
    protected async executeStoredProcedure<T>(procedureName: string, parameters: any = {}): Promise<T[]>
    {
        try
        {
            await this.ensureConnection();

            const request = this._sqlPool!.request();

            // Ajouter les param�tres � la requ�te
            for (const [key, value] of Object.entries(parameters))
            {
                request.input(key, value);
            }

            const result = await request.execute(procedureName);

            return result.recordset as T[];
        } catch (error)
        {
            console.error(`Erreur lors de l'ex�cution de la proc�dure stock�e ${procedureName}:`, error);
            throw error;
        }
    }

    /**
     * Ex�cute une requ�te SQL personnalis�e
     * @param query - Requ�te SQL � ex�cuter
     * @param parameters - Param�tres � passer � la requ�te
     */
    protected async executeRawQuery<T>(query: string, parameters: any = {}): Promise<T[]>
    {
        try
        {
            await this.ensureConnection();

            const request = this._sqlPool!.request();

            // Ajouter les param�tres � la requ�te
            for (const [key, value] of Object.entries(parameters))
            {
                request.input(key, value);
            }

            const result = await request.query(query);

            return result.recordset as T[];
        } catch (error)
        {
            console.error("Erreur lors de l'ex�cution de la requ�te SQL personnalis�e:", error);
            throw error;
        }
    }

    /**
     * D�marre une transaction SQL Server
     */
    protected async beginTransaction(): Promise<sql.Transaction>
    {
        try
        {
            await this.ensureConnection();

            const transaction = new sql.Transaction(this._sqlPool!);
            await transaction.begin();

            return transaction;
        } catch (error)
        {
            console.error("Erreur lors du d�marrage de la transaction:", error);
            throw error;
        }
    }

    /**
     * Ex�cute une requ�te dans une transaction SQL Server
     * @param transaction - Transaction SQL Server
     * @param query - Requ�te SQL � ex�cuter
     * @param parameters - Param�tres � passer � la requ�te
     */
    protected async executeTransactionQuery<T>(
        transaction: sql.Transaction,
        query: string,
        parameters: any = {}
    ): Promise<T[]>
    {
        try
        {
            const request = new sql.Request(transaction);

            // Ajouter les param�tres � la requ�te
            for (const [key, value] of Object.entries(parameters))
            {
                request.input(key, value);
            }

            const result = await request.query(query);

            return result.recordset as T[];
        } catch (error)
        {
            console.error("Erreur lors de l'ex�cution de la requ�te dans la transaction:", error);
            throw error;
        }
    }

    /**
     * Ex�cute une insertion en masse dans SQL Server
     * @param items - �l�ments � ins�rer
     */
    async bulkInsert(items: DTO[]): Promise<void>
    {
        try
        {
            await this.ensureConnection();

            if (items.length === 0)
            {
                return;
            }

            // Cr�er une table temporaire pour l'insertion en masse
            const table = new sql.Table(this._tableName);

            // D�terminer les colonnes � partir du premier �l�ment
            const firstItem = items[0] as any;
            const columns = Object.keys(firstItem).filter(key => key !== 'id' || firstItem.id !== undefined);

            // D�finir les colonnes de la table
            for (const column of columns)
            {
                let type: any;

                // D�terminer le type SQL � partir du type JavaScript
                const value = firstItem[column];
                if (typeof value === 'number')
                {
                    if (Number.isInteger(value))
                    {
                        type = sql.Int;
                    } else
                    {
                        type = sql.Float;
                    }
                } else if (typeof value === 'string')
                {
                    type = sql.NVarChar;
                } else if (typeof value === 'boolean')
                {
                    type = sql.Bit;
                } else if (value instanceof Date)
                {
                    type = sql.DateTime;
                } else
                {
                    // Pour les objets complexes, les stocker en JSON
                    type = sql.NVarChar;
                }

                table.columns.add(column, type, { nullable: column !== 'id' });
            }

            // Ajouter les donn�es � la table
            for (const item of items)
            {
                const row: any[] = [];
                const itemObj = item as any;

                for (const column of columns)
                {
                    let value = itemObj[column];

                    // Convertir les objets complexes en cha�nes JSON
                    if (value !== null && typeof value === 'object' && !(value instanceof Date))
                    {
                        value = JSON.stringify(value);
                    }

                    row.push(value);
                }

                table.rows.add(...row);
            }

            // Ex�cuter l'insertion en masse
            const request = this._sqlPool!.request();
            await request.bulk(table);

        } catch (error)
        {
            console.error("Erreur lors de l'insertion en masse:", error);
            throw error;
        }
    }

    /**
     * Execute une requ�te de mise � jour en masse
     * @param criteria - Crit�res pour identifier les �l�ments � mettre � jour
     * @param updateData - Donn�es � mettre � jour
     */
    async bulkUpdate(criteria: CritereDTO, updateData: Partial<DTO>): Promise<number>
    {
        try
        {
            await this.ensureConnection();

            // Construire la clause WHERE
            const whereClause = this.buildSqlWhereClause(criteria);
            if (!whereClause.conditions)
            {
                throw new Error("Au moins un crit�re est requis pour la mise � jour en masse");
            }

            // Pr�parer les donn�es pour la mise � jour
            const updateValues = { ...updateData } as any;
            updateValues.updatedAt = new Date();

            // Construire les colonnes � mettre � jour
            const updateColumns = Object.keys(updateValues).map(col => `${col} = @update_${col}`);

            // Construire la requ�te de mise � jour
            const query = `
                UPDATE ${this._tableName}
                SET ${updateColumns.join(', ')}
                OUTPUT @@ROWCOUNT AS affected_rows
                WHERE ${whereClause.conditions}
            `;

            const request = this._sqlPool!.request();

            // Ajouter les param�tres pour les valeurs � mettre � jour
            for (const [col, value] of Object.entries(updateValues))
            {
                request.input(`update_${col}`, value);
            }

            // Ajouter les param�tres pour les conditions WHERE
            for (const [key, value] of Object.entries(whereClause.parameters))
            {
                request.input(key, value);
            }

            // Ex�cuter la requ�te
            const result = await request.query(query);

            return result.recordset[0].affected_rows || 0;
        } catch (error)
        {
            console.error("Erreur lors de la mise � jour en masse:", error);
            throw error;
        }
    }

    /**
     * Ex�cute une requ�te de suppression en masse
     * @param criteria - Crit�res pour identifier les �l�ments � supprimer
     */
    async bulkDelete(criteria: CritereDTO): Promise<number>
    {
        try
        {
            await this.ensureConnection();

            // Construire la clause WHERE
            const whereClause = this.buildSqlWhereClause(criteria);
            if (!whereClause.conditions)
            {
                throw new Error("Au moins un crit�re est requis pour la suppression en masse");
            }

            // Construire la requ�te de suppression
            const query = `
                DELETE FROM ${this._tableName}
                OUTPUT @@ROWCOUNT AS affected_rows
                WHERE ${whereClause.conditions}
            `;

            const request = this._sqlPool!.request();

            // Ajouter les param�tres pour les conditions WHERE
            for (const [key, value] of Object.entries(whereClause.parameters))
            {
                request.input(key, value);
            }

            // Ex�cuter la requ�te
            const result = await request.query(query);

            return result.recordset[0].affected_rows || 0;
        } catch (error)
        {
            console.error("Erreur lors de la suppression en masse:", error);
            throw error;
        }
    }

    /**
     * Obtient le nombre total d'�l�ments correspondant aux crit�res
     * @param criteria - Crit�res de recherche
     */
    async getCount(criteria: CritereDTO): Promise<number>
    {
        try
        {
            await this.ensureConnection();

            const whereClause = this.buildSqlWhereClause(criteria);
            let query = `SELECT COUNT(*) AS total FROM ${this._tableName}`;

            if (whereClause.conditions)
            {
                query += ` WHERE ${whereClause.conditions}`;
            }

            const request = this._sqlPool!.request();

            // Ajouter les param�tres pour les conditions WHERE
            for (const [key, value] of Object.entries(whereClause.parameters))
            {
                request.input(key, value);
            }

            const result = await request.query(query);
            return result.recordset[0].total;
        } catch (error)
        {
            console.error("Erreur lors du comptage des �l�ments:", error);
            throw error;
        }
    }

    /**
     * Cr�e ou met � jour un �l�ment
     * @param dto - Donn�es pour la cr�ation ou mise � jour
     * @param idField - Nom du champ d'identifiant (par d�faut 'id')
     */
    async upsertItem(dto: DTO, idField: string = 'id'): Promise<DTO>
    {
        try
        {
            await this.ensureConnection();

            const id = (dto as any)[idField];

            // V�rifier si l'�l�ment existe d�j�
            if (id)
            {
                const critereDTO = {} as CritereDTO;
                (critereDTO as any)[idField] = id;

                const exists = await this.itemExists(critereDTO);

                if (exists)
                {
                    // Mettre � jour l'�l�ment existant
                    return await this.updateItem(dto, critereDTO);
                }
            }

            // Cr�er un nouvel �l�ment
            return await this.createItem(dto);
        } catch (error)
        {
            console.error("Erreur lors de l'upsert:", error);
            throw error;
        }
    }
    //#endregion
}