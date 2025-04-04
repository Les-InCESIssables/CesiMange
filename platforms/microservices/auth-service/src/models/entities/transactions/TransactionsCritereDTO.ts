import { ObjectLiteral } from "typeorm";
import { BaseCritereDTO } from "../../../../../../services/data-access-layer/src/models/base/BaseCritereDTO";

/**
 * CritereDTO pour la recherche d'entit�s SQL Server Transactions
 * @author DTO Generator - 2025-04-03T17:32:20.333Z - Creation
 */
export class TransactionsCritereDTO extends BaseCritereDTO implements ObjectLiteral
{
    /**
     * Crit�re de recherche pour id
     */
    id?: number | undefined;

    /**
     * Crit�re de recherche pour order_id
     */
    order_id?: string | undefined;

    /**
     * Recherche avec LIKE pour order_id
     */
    order_idLike?: string | undefined;

    /**
     * Crit�re de recherche pour payment_intent_id
     */
    payment_intent_id?: string | undefined;

    /**
     * Recherche avec LIKE pour payment_intent_id
     */
    payment_intent_idLike?: string | undefined;

    /**
     * Crit�re de recherche pour amount
     */
    amount?: number | undefined;

    /**
     * Valeur minimale pour amount
     */
    amountMin?: number | undefined;

    /**
     * Valeur maximale pour amount
     */
    amountMax?: number | undefined;

    /**
     * Crit�re de recherche pour currency
     */
    currency?: string | undefined;

    /**
     * Recherche avec LIKE pour currency
     */
    currencyLike?: string | undefined;

    /**
     * Crit�re de recherche pour status
     */
    status?: string | undefined;

    /**
     * Recherche avec LIKE pour status
     */
    statusLike?: string | undefined;

    /**
     * Crit�re de recherche pour payment_method
     */
    payment_method?: string | undefined;

    /**
     * Recherche avec LIKE pour payment_method
     */
    payment_methodLike?: string | undefined;

    /**
     * Crit�re de recherche pour payment_provider
     */
    payment_provider?: string | undefined;

    /**
     * Recherche avec LIKE pour payment_provider
     */
    payment_providerLike?: string | undefined;

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

}
