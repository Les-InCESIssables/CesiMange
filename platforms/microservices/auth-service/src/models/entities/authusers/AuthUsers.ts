import { Entity, Column, PrimaryColumn, ObjectLiteral, PrimaryGeneratedColumn } from "typeorm";

/**
 * Entit� TypeORM pour la table SQL Server T_AUTH_USERS
 * @author Entity Generator - 2025-04-03T17:32:20.317Z - Creation
 */
@Entity("T_AUTH_USERS")
export class AuthUsers implements ObjectLiteral
{
    /**
     * id
     */
    @PrimaryGeneratedColumn()
    id?: number;

    /**
     * email
     * @maxLength 255
     */
    @Column({ length: 255, nullable: false })
    email?: string;

    /**
     * phone_number
     * @maxLength 20
     */
    @Column({ length: 20 })
    phone_number?: string;

    /**
     * password_hash
     * @maxLength 255
     */
    @Column({ length: 255, nullable: false })
    password_hash?: string;

    /**
     * role
     * @maxLength 20
     */
    @Column({ length: 20, nullable: false })
    role?: string;

    /**
     * email_verified
     */
    @Column()
    email_verified?: boolean;

    /**
     * phone_verified
     */
    @Column()
    phone_verified?: boolean;

    /**
     * last_login
     */
    @Column()
    last_login?: Date;

    /**
     * refresh_token
     * @maxLength 255
     */
    @Column({ length: 255 })
    refresh_token?: string;

    /**
     * active
     */
    @Column()
    active?: boolean;

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

    /**
     * username
     * @maxLength 50
     */
    @Column({ length: 50 })
    username?: string;

}
