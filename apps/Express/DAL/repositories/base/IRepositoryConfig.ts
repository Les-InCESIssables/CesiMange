/**
 * Configuration du repository MongoDB
 */
export interface IRepositoryConfig
{
    /**
     * Cha�ne de connexion MongoDB
     * Ex: mongodb://localhost:27017
     */
    connectionString: string;

    /**
     * Nom de la base de donn�es
     */
    dbName: string;

    /**
     * Nom de la collection
     */
    collectionName: string;
}