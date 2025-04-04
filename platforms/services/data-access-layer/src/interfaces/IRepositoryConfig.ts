import { EDatabaseType } from '../enums/EDatabaseType';

/**
 * Configuration du repository MongoDB
 */
export interface IRepositoryConfig {

    /**
     * Cha�ne de connexion MongoDB
     * Ex: mongodb://localhost:27017
     */
    ConnectionString: string;

    /**
     * Nom de la base de donn�es
     */
    DbName: string;

    /**
     * Nom de la collection
     */
    CollectionName: string;

    /*
     *
     */
    TypeBDD: EDatabaseType;

    // kafka
    clientId?: string;
    brokers: string[];
    topics: string[];
    groupId: string;
    ssl?: boolean;
    sasl?: {
        mechanism: string;
        username: string;
        password: string;
    };
    fromBeginning?: boolean;
}
