import { IBaseCritereDTO } from '@base-classes';

/**
 * Crit�res de base dont h�ritent tous les CritereDTOs
 * @author Mahmoud Charif - CESIMANGE-118 - 17/03/2025 - Creation
 */
export abstract class BaseCritereDTO implements IBaseCritereDTO {
    //#region Properties
    id?: string;
    ids?: string[];
    search?: string;
    page?: number;
    pageSize?: number;
    sort?: string;
    sortDirection?: 'asc' | 'desc';
    includeDeleted?: boolean;
    limit?: number;
    skip?: number;
    populate?: string[];
    //#endregion
}
