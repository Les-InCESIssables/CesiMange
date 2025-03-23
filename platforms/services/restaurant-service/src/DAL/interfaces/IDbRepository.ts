import { IBaseRepository } from "./IBaseRepository";

/**
 * Interface pour les impl�mentations sp�cifiques de repository
 */
export interface IDbRepository<DTO, CritereDTO> extends IBaseRepository<DTO, CritereDTO>
{
    /**
     * Construit le filtre pour la requ�te
     * @param pCritereDTO Critere de recherche
     */
    buildFilter(pCritereDTO: CritereDTO): any;

    /**
     * Formate les r�sultats de la base de donn�es
     * @param pResults Resultat de la base de donn�es
     */
    formatResults(pResults: any[]): DTO[];
}