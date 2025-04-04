import { Entity, Column, PrimaryColumn, ObjectLiteral, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entit� TypeORM pour la table SQL Server T_TRANSACTIONS
 * @author Entity Generator - 2025-04-03T17:32:20.333Z - Creation
 */
@Entity("T_TRANSACTIONS")
export class Transactions implements ObjectLiteral
{
    /**
     * id
     */
    @PrimaryGeneratedColumn()
    id?: number;

    /**
     * order_id
     * @maxLength 50
     */
    @Column({ length: 50, nullable: false })
    order_id?: string;

    /**
     * payment_intent_id
     * @maxLength 100
     */
    @Column({ length: 100 })
    payment_intent_id?: string;

    /**
     * amount
     */
    @Column({ nullable: false })
    amount?: number;

    /**
     * currency
     * @maxLength 3
     */
    @Column({ length: 3, nullable: false })
    currency?: string;

    /**
     * status
     * @maxLength 20
     */
    @Column({ length: 20, nullable: false })
    status?: string;

    /**
     * payment_method
     * @maxLength 30
     */
    @Column({ length: 30, nullable: false })
    payment_method?: string;

    /**
     * payment_provider
     * @maxLength 30
     */
    @Column({ length: 30, nullable: false })
    payment_provider?: string;

    /**
     * created_at
     */
    @Column({ nullable: false })
    created_at?: Date;

    /**
     * updated_at
     */
    @Column({ nullable: false })
    updated_at?: Date;

}
