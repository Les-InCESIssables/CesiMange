/**
 * Interface de base pour les crit�res de recherche
 */
export interface IBaseCriteriaDTO
{
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
}