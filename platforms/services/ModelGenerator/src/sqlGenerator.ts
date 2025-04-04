import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
require('dotenv').config();

/**
 * Script de génération automatique de DTOs et Entités à partir de SQL Server
 * @author Mahmoud Charif - CESIMANGE-118 - 31/03/2025 - Création
 * @author Modifié pour ajouter la génération d'entités, métiers et contrôleurs
 * @author Modifié pour préserver les fichiers modifiés manuellement
 */

// Configuration des services et des tables associées
const serviceConfigs = [
    {
        serviceName: 'auth-service',
        tables: ['T_AUTH_USERS', 'T_TRANSACTIONS'],
        outputDir: '../../microservices/auth-service/src/models/',
        metierDir: '../../microservices/auth-service/src/metier/',
        controllerDir: '../../microservices/auth-service/src/controllers/'
    }
];

// Configuration générale
const config = {
    excludedFields: ['CreatedAt', 'UpdatedAt', 'DeletedAt'],
    excludedTables: ['__EFMigrationsHistory', 'sysdiagrams'],
    cleanOutputDir: false,
    protectedFolders: ['base'],
    generatorSignature: '\\* @author (Entity|DTO|Metier|Controller) Generator',
    overwriteExistingFiles: false
};

// Types et interfaces pour l'analyse
interface ColumnInfo
{
    name: string;
    dataType: string;
    isNullable: boolean;
    maxLength: number | null;
    defaultValue: string | null;
    isPrimaryKey: boolean;
}

interface TableSchema
{
    columns: ColumnInfo[];
    primaryKeys: string[];
}

// Fonction pour s'assurer qu'un répertoire existe
function ensureDirectoryExists(dirPath: string): void
{
    if (!fs.existsSync(dirPath))
    {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Fonction pour nettoyer un répertoire tout en préservant certains dossiers
function cleanDirectory(dirPath: string, protectedFolders: string[] = []): void
{
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    for (const item of items)
    {
        const itemPath = path.join(dirPath, item);
        const isDirectory = fs.statSync(itemPath).isDirectory();

        if (isDirectory)
        {
            if (!protectedFolders.includes(item))
            {
                fs.rmSync(itemPath, { recursive: true, force: true });
            }
        } else
        {
            fs.unlinkSync(itemPath);
        }
    }
}

// Fonction pour vérifier si un fichier a été modifié manuellement
function isFileModifiedManually(filePath: string): boolean
{
    if (!fs.existsSync(filePath)) return false;

    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Vérifier si le contenu contient la signature du générateur
    const generatorRegex = /\* @author (Entity|DTO|Metier|Controller) Generator/;
    const hasGeneratorSignature = generatorRegex.test(fileContent);

    // Si le fichier contient notre signature mais a été modifié après sa génération initiale
    if (hasGeneratorSignature)
    {
        const creationDateMatch = fileContent.match(/@author (?:Entity|DTO|Metier|Controller) Generator - ([0-9TZ:.+-]+) - Creation/);
        if (creationDateMatch && creationDateMatch[1])
        {
            const creationDate = new Date(creationDateMatch[1]);
            const modificationDate = fs.statSync(filePath).mtime;

            // Si le fichier a été modifié après sa génération initiale d'au moins 5 minutes
            // (pour éviter les faux positifs liés au délai entre génération et écriture sur disque)
            const fiveMinutes = 5 * 60 * 1000;
            return modificationDate.getTime() > creationDate.getTime() + fiveMinutes;
        }
    }

    // Si pas de signature ou format inattendu, considérer comme modifié manuellement
    return true;
}

// Fonction pour écrire un fichier en vérifiant s'il a été modifié manuellement
function writeFileIfNotModified(filePath: string, content: string): boolean
{
    if (!config.overwriteExistingFiles && fs.existsSync(filePath))
    {
        if (isFileModifiedManually(filePath))
        {
            console.log(`  Fichier préservé (modifié manuellement): ${filePath}`);
            return false;
        }
    }

    fs.writeFileSync(filePath, content);
    return true;
}

// Fonction pour convertir le nom d'une table en nom de classe (PascalCase)
function tableNameToClassName(name: string): string
{
    // Enlever le préfixe T_ si présent
    const nameWithoutPrefix = name.startsWith('T_') ? name.substring(2) : name;

    // Enlever le "s" final pour les pluriels si applicable
    const singularName = nameWithoutPrefix.endsWith('s') ? nameWithoutPrefix.slice(0, -1) : nameWithoutPrefix;

    // Convertir en PascalCase
    return singularName
        .split(/[-_]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
}

// Fonction pour convertir un nom de colonne en camelCase
function columnNameToCamelCase(name: string): string
{
    return name.charAt(0).toLowerCase() + name.slice(1);
}

// Fonction pour convertir un type SQL en type TypeScript
function sqlTypeToTypeScript(sqlType: string, isNullable: boolean): string
{
    const typeMap: Record<string, string> = {
        'int': 'number',
        'bigint': 'number',
        'smallint': 'number',
        'tinyint': 'number',
        'bit': 'boolean',
        'decimal': 'number',
        'numeric': 'number',
        'money': 'number',
        'float': 'number',
        'datetime': 'Date',
        'date': 'Date',
        'char': 'string',
        'varchar': 'string',
        'text': 'string',
        'nchar': 'string',
        'nvarchar': 'string',
        'uniqueidentifier': 'string'
    };

    const tsType = typeMap[sqlType.toLowerCase()] || 'any';
    return tsType;
}

// Fonction pour analyser la structure d'une table
async function analyzeTable(tableName: string, dataSource: DataSource): Promise<TableSchema>
{
    try
    {
        // Récupérer les colonnes de la table
        const columns = await dataSource.query(`
            SELECT 
                c.COLUMN_NAME as name,
                c.DATA_TYPE as dataType,
                CASE WHEN c.IS_NULLABLE = 'YES' THEN 1 ELSE 0 END as isNullable,
                c.CHARACTER_MAXIMUM_LENGTH as maxLength,
                c.COLUMN_DEFAULT as defaultValue,
                CASE WHEN pk.COLUMN_NAME IS NOT NULL THEN 1 ELSE 0 END as isPrimaryKey
            FROM 
                INFORMATION_SCHEMA.COLUMNS c
            LEFT JOIN 
                (
                    SELECT ku.COLUMN_NAME
                    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                    JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                    ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME
                    WHERE tc.TABLE_NAME = '${tableName}' AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
                ) pk
            ON c.COLUMN_NAME = pk.COLUMN_NAME
            WHERE 
                c.TABLE_NAME = '${tableName}'
            ORDER BY 
                c.ORDINAL_POSITION
        `);

        if (!columns || columns.length === 0)
        {
            console.log(`  La table ${tableName} n'existe pas ou est vide.`);
            return { columns: [], primaryKeys: [] };
        }

        const primaryKeys = columns
            .filter((col: ColumnInfo) => col.isPrimaryKey)
            .map((col: ColumnInfo) => col.name);

        return {
            columns,
            primaryKeys
        };
    } catch (error)
    {
        console.error(`Erreur lors de l'analyse de la table ${tableName}:`, error);
        throw error;
    }
}

// Fonction pour générer une entité TypeORM
function generateEntityContent(className: string, tableName: string, schema: TableSchema): string
{
    let content = `import { Entity, Column, PrimaryColumn, ObjectLiteral, PrimaryGeneratedColumn } from "typeorm";\n\n`;
    content += `/**\n`;
    content += ` * Entité TypeORM pour la table SQL Server ${tableName}\n`;
    content += ` * @author Entity Generator - ${new Date().toISOString()} - Creation\n`;
    content += ` */\n`;
    content += `@Entity("${tableName}")\n`;
    content += `export class ${className} implements ObjectLiteral\n{\n`;

    // Ajouter les propriétés avec décorateurs TypeORM
    schema.columns.forEach(column =>
    {
        if (!config.excludedFields.includes(column.name))
        {
            const camelCaseName = columnNameToCamelCase(column.name);

            content += `    /**\n`;
            content += `     * ${camelCaseName}\n`;
            if (column.maxLength) content += `     * @maxLength ${column.maxLength}\n`;
            content += `     */\n`;

            // Générer le décorateur TypeORM approprié
            if (column.isPrimaryKey)
            {
                if (column.name.toLowerCase().includes('id') && column.dataType.toLowerCase().includes('int'))
                {
                    content += `    @PrimaryGeneratedColumn()\n`;
                } else
                {
                    content += `    @PrimaryColumn()\n`;
                }
            } else
            {
                content += `    @Column(`;

                // Options pour le décorateur Column
                const options = [];
                if (column.dataType.toLowerCase().includes('char') && column.maxLength)
                {
                    options.push(`length: ${column.maxLength}`);
                }
                if (!column.isNullable)
                {
                    options.push(`nullable: false`);
                }

                if (options.length > 0)
                {
                    content += `{ ${options.join(', ')} }`;
                }

                content += `)\n`;
            }

            // Générer la propriété avec | undefined
            content += `    ${camelCaseName}?: ${sqlTypeToTypeScript(column.dataType, column.isNullable)};\n\n`;
        }
    });

    content += `}\n`;
    return content;
}

// Fonction pour générer le contenu du fichier CritereDTO
function generateCritereDTOContent(className: string, schema: TableSchema): string
{
    let content = `import { ObjectLiteral } from "typeorm";\n`;
    content += `import { BaseCritereDTO } from "../../../../../../services/data-access-layer/src/models/base/BaseCritereDTO";\n\n`
    content += `/**\n`;
    content += ` * CritereDTO pour la recherche d'entités SQL Server ${className}\n`;
    content += ` * @author DTO Generator - ${new Date().toISOString()} - Creation\n`;
    content += ` */\n`;
    content += `export class ${className}CritereDTO extends BaseCritereDTO implements ObjectLiteral\n{\n`;

    // Ajouter les propriétés pour la recherche
    schema.columns.forEach(column =>
    {
        if (!config.excludedFields.includes(column.name))
        {
            const tsType = sqlTypeToTypeScript(column.dataType, true);
            const camelCaseName = columnNameToCamelCase(column.name);

            content += `    /**\n`;
            content += `     * Critère de recherche pour ${camelCaseName}\n`;
            content += `     */\n`;
            content += `    ${camelCaseName}?: ${tsType} | undefined;\n\n`;

            // Pour les chaînes, ajouter une recherche par Like
            if (column.dataType.toLowerCase().includes('char') || column.dataType.toLowerCase() === 'text')
            {
                content += `    /**\n`;
                content += `     * Recherche avec LIKE pour ${camelCaseName}\n`;
                content += `     */\n`;
                content += `    ${camelCaseName}Like?: string | undefined;\n\n`;
            }

            // Pour les nombres et dates, ajouter des plages
            if ((['int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'money', 'float', 'real'].includes(column.dataType.toLowerCase()) ||
                column.dataType.toLowerCase().includes('date')) &&
                !column.name.toLowerCase().includes('id'))
            {
                content += `    /**\n`;
                content += `     * Valeur minimale pour ${camelCaseName}\n`;
                content += `     */\n`;
                content += `    ${camelCaseName}Min?: ${tsType} | undefined;\n\n`;

                content += `    /**\n`;
                content += `     * Valeur maximale pour ${camelCaseName}\n`;
                content += `     */\n`;
                content += `    ${camelCaseName}Max?: ${tsType} | undefined;\n\n`;
            }
        }
    });

    content += `}\n`;
    return content;
}

// Fonction pour générer le contenu du fichier métier
function generateMetierContent(className: string, schema: TableSchema): string
{
    let content = `import { ${className} } from "../../models/entities/${className.toLowerCase()}/${className}";\n`;
    content += `import { ${className}CritereDTO } from "../../models/entities/${className.toLowerCase()}/${className}CritereDTO";\n`;
    content += `import { BaseMetier } from "../../../../../services/base-classes/src/metier/base/BaseMetier";\n\n`;
    content += `/**\n`;
    content += ` * Métier pour l'entité ${className}\n`;
    content += ` * @author Metier Generator - ${new Date().toISOString()} - Creation\n`;
    content += ` */\n`;
    content += `export class ${className}Metier extends BaseMetier<${className}, ${className}CritereDTO> {\n`;
    content += `    constructor() {\n`;
    content += `        super('${className}', ${className});\n`;
    content += `    }\n`;
    content += `}\n`;
    return content;
}

// Fonction pour générer le contenu du fichier contrôleur
function generateControllerContent(className: string, schema: TableSchema): string
{
    let content = `import { ${className} } from "../../models/entities/${className.toLowerCase()}/${className}";\n`;
    content += `import { ${className}CritereDTO } from "../../models/entities/${className.toLowerCase()}/${className}CritereDTO";\n`;
    content += `import { BaseController } from "../../../../../services/base-classes/src/controllers/base/BaseController";\n\n`;
    content += `/**\n`;
    content += ` * Contrôleur pour l'entité ${className}\n`;
    content += ` * @author Controller Generator - ${new Date().toISOString()} - Creation\n`;
    content += ` */\n`;
    content += `export class ${className}Controller extends BaseController<${className}, ${className}CritereDTO> {\n\n`;
    content += `    override initializeRoutes(): void {\n`;
    content += `        this.Router.get('/', );\n`;
    content += `    }\n\n`;
    content += `}\n`;
    return content;
}

// Fonction principale pour générer les DTOs, entités, métiers et contrôleurs
async function generateDTOs(): Promise<void>
{
    let dataSource: DataSource | null = null;

    try
    {
        console.log('Démarrage de la génération des DTOs, Entités, Métiers et Contrôleurs pour SQL Server...');

        // Connexion à SQL Server avec TypeORM
        dataSource = new DataSource({
            type: "mssql",
            host: process.env.DB_SERVER,
            port: parseInt(process.env.DB_PORT || "1433"),
            database: process.env.DB_NAME,
            username: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            options: {
                encrypt: process.env.DB_ENCRYPT === 'true'
            },
            extra: {
                trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
                connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || "30000")
            }
        });

        await dataSource.initialize();
        console.log("Connexion SQL Server établie");

        // Récupérer toutes les tables disponibles
        const tables = await dataSource.query(`
            SELECT TABLE_NAME as name
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);

        const allTables = tables
            .map((t: { name: string }) => t.name)
            .filter((name: string) => !config.excludedTables.includes(name));

        console.log(`${allTables.length} tables trouvées après filtrage initial.`);

        // Pour chaque service configuré
        for (const serviceConfig of serviceConfigs)
        {
            if (serviceConfig.tables.length === 0)
            {
                console.log(`\nAucune table configurée pour le service: ${serviceConfig.serviceName}, ignoré.`);
                continue;
            }

            console.log(`\nTraitement du service: ${serviceConfig.serviceName}`);

            // Nettoyer les dossiers si nécessaire et créer la structure
            const { outputDir, metierDir, controllerDir } = serviceConfig;

            if (config.cleanOutputDir)
            {
                if (fs.existsSync(outputDir))
                {
                    cleanDirectory(outputDir, config.protectedFolders);
                }
                if (fs.existsSync(metierDir))
                {
                    cleanDirectory(metierDir, config.protectedFolders);
                }
                if (fs.existsSync(controllerDir))
                {
                    cleanDirectory(controllerDir, config.protectedFolders);
                }
            }

            // Créer les répertoires principaux
            ensureDirectoryExists(outputDir);
            ensureDirectoryExists(metierDir);
            ensureDirectoryExists(controllerDir);

            // Créer un dossier entities pour les DTOs et critères
            const entitiesDir = path.join(outputDir, 'entities');
            ensureDirectoryExists(entitiesDir);

            // Créer les dossiers base pour les classes de base
            ensureDirectoryExists(path.join(metierDir, 'base'));
            ensureDirectoryExists(path.join(controllerDir, 'base'));

            // Filtrer les tables pour ce service
            const serviceTables = allTables.filter((name: string) =>
                serviceConfig.tables.includes(name)
            );

            console.log(`${serviceTables.length} tables associées à ce service.`);

            // Traiter chaque table pour ce service
            for (const tableName of serviceTables)
            {
                console.log(`Analyse de la table: ${tableName}`);

                const schema = await analyzeTable(tableName, dataSource);

                if (schema.columns.length > 0)
                {
                    const className = tableNameToClassName(tableName);

                    // === 1. Création des fichiers Entity et CritereDTO ===
                    // Créer un sous-dossier pour chaque modèle dans entities
                    const modelDir = path.join(entitiesDir, className.toLowerCase());
                    ensureDirectoryExists(modelDir);

                    // Générer le fichier Entity
                    const entityContent = generateEntityContent(className, tableName, schema);
                    const entityFilePath = path.join(modelDir, `${className}.ts`);
                    if (writeFileIfNotModified(entityFilePath, entityContent))
                    {
                        console.log(`  Entity généré: ${entityFilePath}`);
                    }

                    // Générer le fichier CritereDTO
                    const critereDtoContent = generateCritereDTOContent(className, schema);
                    const critereDtoFilePath = path.join(modelDir, `${className}CritereDTO.ts`);
                    if (writeFileIfNotModified(critereDtoFilePath, critereDtoContent))
                    {
                        console.log(`  CritereDTO généré: ${critereDtoFilePath}`);
                    }

                    // === 2. Création des fichiers Metier ===
                    const metierClassDir = path.join(metierDir, className.toLowerCase());
                    ensureDirectoryExists(metierClassDir);

                    const metierContent = generateMetierContent(className, schema);
                    const metierFilePath = path.join(metierClassDir, `${className}Metier.ts`);
                    if (writeFileIfNotModified(metierFilePath, metierContent))
                    {
                        console.log(`  Metier généré: ${metierFilePath}`);
                    }

                    // === 3. Création des fichiers Controller ===
                    const controllerClassDir = path.join(controllerDir, className.toLowerCase());
                    ensureDirectoryExists(controllerClassDir);

                    const controllerContent = generateControllerContent(className, schema);
                    const controllerFilePath = path.join(controllerClassDir, `${className}Controller.ts`);
                    if (writeFileIfNotModified(controllerFilePath, controllerContent))
                    {
                        console.log(`  Controller généré: ${controllerFilePath}`);
                    }

                } else
                {
                    console.log(`  Aucun fichier généré pour ${tableName} (table vide ou structure non détectée).`);
                }
            }
        }

        console.log('\nGénération des DTOs, Entités, Métiers et Contrôleurs terminée avec succès pour tous les services!');

    } catch (error)
    {
        console.error('Erreur lors de la génération des fichiers:', error);
    } finally
    {
        // Fermer la connexion DataSource
        if (dataSource && dataSource.isInitialized)
        {
            await dataSource.destroy();
            console.log('Déconnecté de SQL Server');
        }
    }
}

// Exécuter la génération
generateDTOs();