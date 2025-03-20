import { BaseCritereDTO } from "../../models/base/BaseCritereDTO";
import { BaseDTO } from "../../models/base/BaseDTO";
import { IBaseRepository } from "./IBaseRepository";

/**
 * Interface pour les impl�mentations sp�cifiques de repository
 */
export interface IDbRepository<DTO extends BaseDTO, CritereDTO extends BaseCritereDTO> extends IBaseRepository<DTO, CritereDTO>
{
    /**
     * Construit le filtre pour la requ�te
     */
    buildFilter(pCritereDTO: CritereDTO): any;

    /**
     * Formate les r�sultats de la base de donn�es
     */
    formatResults(pResults: any[]): DTO[];
}