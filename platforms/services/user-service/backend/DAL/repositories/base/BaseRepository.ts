﻿import { BaseCritereDTO } from "../../../models/base/BaseCritereDTO";
import { BaseDTO } from "../../../models/base/BaseDTO";
import { EDatabaseType } from "../../enums/EDatabaseType";
import { IBaseRepository } from "../../interfaces/IBaseRepository";
import { IRepositoryConfig } from "../../interfaces/IRepositoryConfig";
import { AbstractDbRepository } from "./AbstractDbRepository";
import { MongoDBRepository } from "./MongoDBRepository";
import { SqlServerRepository } from "./SqlServerRepository";

/**
 * Repository de base générique qui sert de factory pour les implémentations spécifiques
 * @template DTO - Type de données retourné/manipulé qui étend BaseDTO
 * @template CritereDTO - Type des critères de recherche qui étend BaseCritereDTO
 */
export abstract class BaseRepository<DTO extends BaseDTO, CritereDTO extends BaseCritereDTO> implements IBaseRepository<DTO, CritereDTO>
{
    //#region Attributes
    protected _config: IRepositoryConfig;
    private _repository: AbstractDbRepository<DTO, CritereDTO>;
    //#endregion

    //#region CTOR
    constructor (pConfig: IRepositoryConfig)
    {
        this._config = pConfig;

        // Fabrique le repository approprié selon le type de base de données
        if (this._config.TypeBDD === EDatabaseType.MONGODB)
        {
            this._repository = new MongoDBRepository<DTO, CritereDTO>(pConfig);
        } else if (this._config.TypeBDD === EDatabaseType.SQL_SERVER)
        {
            this._repository = new SqlServerRepository<DTO, CritereDTO>(pConfig);
        } else
        {
            throw new Error(`Type de base de données non supporté: ${this._config.TypeBDD}`);
        }
    }

    //#endregion

    //#region Methods
    /**
     * Méthode d'initialisation de la connexion
     */
    async initialize(): Promise<void>
    {
        await this._repository.initialize();
    }

    /**
     * Obtenir tous les éléments selon des critères
     * @param pCritereDTO - Critères de recherche
     */
    async getItems(pCritereDTO: CritereDTO): Promise<DTO[]>
    {
        return await this._repository.getItems(pCritereDTO);
    }

    /**
     * Obtenir un élément par critères
     * @param pCritereDTO - Critères identifiant l'élément
     */
    async getItem(pCritereDTO: CritereDTO): Promise<DTO>
    {
        return await this._repository.getItem(pCritereDTO);
    }

    /**
     * Créer un nouvel élément
     * @param pDTO - Données pour la création
     */
    async createItem(pDTO: DTO): Promise<DTO>
    {
        return await this._repository.createItem(pDTO);
    }

    /**
     * Mettre à jour un élément existant
     * @param pDTO - Données pour la mise à jour
     * @param pCritereDTO - Critères identifiant l'élément à mettre à jour
     */
    async updateItem(pDTO: DTO, pCritereDTO: CritereDTO): Promise<DTO>
    {
        return await this._repository.updateItem(pDTO, pCritereDTO);
    }

    /**
     * Supprimer un élément
     * @param pCritereDTO - Critères pour la suppression
     */
    async deleteItem(pCritereDTO: CritereDTO): Promise<boolean>
    {
        return await this._repository.deleteItem(pCritereDTO);
    }

    /**
     * Vérifier si un élément existe selon des critères
     * @param pCritereDTO - Critères de recherche
     */
    async itemExists(pCritereDTO: CritereDTO): Promise<boolean>
    {
        return await this._repository.itemExists(pCritereDTO);
    }

    /**
     * Ferme la connexion à la base de données
     */
    async disconnect(): Promise<void>
    {
        await this._repository.disconnect();
    }
    //#endregion
}