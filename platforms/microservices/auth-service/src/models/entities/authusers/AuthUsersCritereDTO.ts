import { ObjectLiteral } from "typeorm";
import { BaseCritereDTO } from "../../../../../../services/data-access-layer/src/models/base/BaseCritereDTO";

/**
 * CritereDTO pour la recherche d'entit�s SQL Server AuthUsers
 * @author DTO Generator - 2025-04-03T17:32:20.318Z - Creation
 */
export class AuthUsersCritereDTO extends BaseCritereDTO implements ObjectLiteral
{
    /**
     * Crit�re de recherche pour id
     */
    id?: number | undefined;

    /**
     * Crit�re de recherche pour email
     */
    email?: string | undefined;

    /**
     * Recherche avec LIKE pour email
     */
    emailLike?: string | undefined;

    /**
     * Crit�re de recherche pour phone_number
     */
    phone_number?: string | undefined;

    /**
     * Recherche avec LIKE pour phone_number
     */
    phone_numberLike?: string | undefined;

    /**
     * Crit�re de recherche pour password_hash
     */
    password_hash?: string | undefined;

    /**
     * Recherche avec LIKE pour password_hash
     */
    password_hashLike?: string | undefined;

    /**
     * Crit�re de recherche pour role
     */
    role?: string | undefined;

    /**
     * Recherche avec LIKE pour role
     */
    roleLike?: string | undefined;

    /**
     * Crit�re de recherche pour email_verified
     */
    email_verified?: boolean | undefined;

    /**
     * Crit�re de recherche pour phone_verified
     */
    phone_verified?: boolean | undefined;

    /**
     * Crit�re de recherche pour last_login
     */
    last_login?: Date | undefined;

    /**
     * Valeur minimale pour last_login
     */
    last_loginMin?: Date | undefined;

    /**
     * Valeur maximale pour last_login
     */
    last_loginMax?: Date | undefined;

    /**
     * Crit�re de recherche pour refresh_token
     */
    refresh_token?: string | undefined;

    /**
     * Recherche avec LIKE pour refresh_token
     */
    refresh_tokenLike?: string | undefined;

    /**
     * Crit�re de recherche pour active
     */
    active?: boolean | undefined;

    /**
     * Crit�re de recherche pour created_at
     */
    created_at?: Date | undefined;

    /**
     * Valeur minimale pour created_at
     */
    created_atMin?: Date | undefined;

    /**
     * Valeur maximale pour created_at
     */
    created_atMax?: Date | undefined;

    /**
     * Crit�re de recherche pour updated_at
     */
    updated_at?: Date | undefined;

    /**
     * Valeur minimale pour updated_at
     */
    updated_atMin?: Date | undefined;

    /**
     * Valeur maximale pour updated_at
     */
    updated_atMax?: Date | undefined;

    /**
     * Crit�re de recherche pour username
     */
    username?: string | undefined;

    /**
     * Recherche avec LIKE pour username
     */
    usernameLike?: string | undefined;

}
