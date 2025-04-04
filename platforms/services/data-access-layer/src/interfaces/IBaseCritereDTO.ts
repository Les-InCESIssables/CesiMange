/**
 * Interface de base pour les critères de recherche
 * @author Mahmoud Charif - CESIMANGE-118 - 17/03/2025 - Adaptation aux normes
 */
export interface IBaseCritereDTO
{
    //#region Properties

    /**
     * Identifiant unique de l'élément recherché
     */
    id?: number;

    /**
     * Liste d'identifiants pour recherche multiple
     */
    ids?: string[];

    /**
     * Terme de recherche textuelle
     */
    search?: string;

    /**
     * Numéro de la page courante (pour pagination)
     */
    page?: number;

    /**
     * Nombre d'éléments par page (pour pagination)
     */
    pageSize?: number;

    /**
     * Champ utilisé pour le tri
     */
    sort?: string;

    /**
     * Direction du tri (ascendant ou descendant)
     */
    sortDirection?: 'asc' | 'desc';

    /**
     * Indique si les éléments supprimés doivent être inclus
     */
    includeDeleted?: boolean;

    /**
     * Nombre maximum d'éléments à retourner
     */
    limit?: number;

    /**
     * Nombre d'éléments à sauter (pour pagination)
     */
    skip?: number; 

    populate?: string[];

    //#endregion
}