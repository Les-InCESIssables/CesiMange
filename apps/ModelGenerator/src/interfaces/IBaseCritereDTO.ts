/**
 * Interface de base pour les crit�res de recherche
 * @author Mahmoud Charif - CESIMANGE-118 - 17/03/2025 - Adaptation aux normes
 */
export interface IBaseCritereDTO
{
    //#region Properties

    /**
     * Identifiant unique de l'�l�ment recherch�
     */
    Id?: string;

    /**
     * Liste d'identifiants pour recherche multiple
     */
    Ids?: string[];

    /**
     * Terme de recherche textuelle
     */
    Search?: string;

    /**
     * Num�ro de la page courante (pour pagination)
     */
    Page?: number;

    /**
     * Nombre d'�l�ments par page (pour pagination)
     */
    PageSize?: number;

    /**
     * Champ utilis� pour le tri
     */
    Sort?: string;

    /**
     * Direction du tri (ascendant ou descendant)
     */
    SortDirection?: 'asc' | 'desc';

    /**
     * Indique si les �l�ments supprim�s doivent �tre inclus
     */
    IncludeDeleted?: boolean;

    /**
     * Nombre maximum d'�l�ments � retourner
     */
    Limit: number;

    /**
     * Nombre d'�l�ments � sauter (pour pagination)
     */
    Skip?: number; 

    //#endregion
}