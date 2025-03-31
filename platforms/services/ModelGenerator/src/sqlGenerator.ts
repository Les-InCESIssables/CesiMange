import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
require('dotenv').config();

/**
 * Script de g�n�ration automatique de DTOs et CritereDTOs � partir de SQL Server
 * @author Mahmoud Charif - CESIMANGE-118 - 31/03/2025 - Creation
 */

// Configuration des services et des tables associ�es
const serviceConfigs = [
    {
        serviceName: 'user-service',
        tables: ['Users', 'Developers'],
        outputDir: '../user-service/src/models/',
        metierDir: '../user-service/src/metier/',
        controllerDir: '../user-service/src/controllers/'
    },
    {
        serviceName: 'restaurant-service',
        tables: ['Restaurants', 'Components'],
        outputDir: '../restaurant-service/src/models/',
        metierDir: '../restaurant-service/src/metier/',
        controllerDir: '../restaurant-service/src/controllers/'
    }
];

// Configuration g�n�rale
const config = {
    excludedFields: ['CreatedAt', 'UpdatedAt', 'DeletedAt'],  // Champs � exclure des DTOs
    excludedTables: ['__EFMigrationsHistory', 'sysdiagrams'], // Tables � exclure
    sqlConnectionString: process.env.SQL_CONNECTION_STRING || 'Server=localhost;Database=CesiMange;User Id=sa;Password=YourPassword;Encrypt=false',
    cleanOutputDir: true,                                    // Nettoyer le r�pertoire de sortie avant g�n�ration
    protectedFolders: ['base']                               // Dossiers � ne pas supprimer lors du nettoyage
};

// Structure des dossiers pour les mod�les
const folders = {
    dto: 'dto',
    critereDto: 'critereDto'
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
    foreignKeys: { column: string, refTable: string, refColumn: string }[];
}

// Fonction pour s'assurer qu'un r�pertoire existe
function ensureDirectoryExists(dirPath: string): void
{
    if (!fs.existsSync(dirPath))
    {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Fonction pour nettoyer un r�pertoire tout en pr�servant certains dossiers
function cleanDirectory(dirPath: string, preserveFolders: string[] = []): void
{
    if (fs.existsSync(dirPath))
    {
        fs.readdirSync(dirPath).forEach(file =>
        {
            const currentPath = path.join(dirPath, file);

            // Si c'est un dossier � pr�server, on le garde
            if (fs.lstatSync(currentPath).isDirectory() && preserveFolders.includes(file))
            {
                console.log(`  Dossier pr�serv�: ${file}`);
                return;
            }

            if (fs.lstatSync(currentPath).isDirectory())
            {
                cleanDirectory(currentPath, preserveFolders);
                try
                {
                    fs.rmdirSync(currentPath);
                } catch (err)
                {
                    console.warn(`  Impossible de supprimer le dossier ${currentPath}: ${err}`);
                }
            } else
            {
                fs.unlinkSync(currentPath);
            }
        });
    }
}

// Fonction pour convertir le nom d'une table en nom de classe (PascalCase)
function tableNameToClassName(name: string): string
{
    // Enlever le "s" final pour les pluriels
    const singularName = name.endsWith('s') ? name.slice(0, -1) : name;

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
        'smallmoney': 'number',
        'float': 'number',
        'real': 'number',
        'datetime': 'Date',
        'datetime2': 'Date',
        'smalldatetime': 'Date',
        'date': 'Date',
        'time': 'string',
        'datetimeoffset': 'Date',
        'char': 'string',
        'varchar': 'string',
        'text': 'string',
        'nchar': 'string',
        'nvarchar': 'string',
        'ntext': 'string',
        'binary': 'Buffer',
        'varbinary': 'Buffer',
        'image': 'Buffer',
        'uniqueidentifier': 'string',
        'xml': 'string',
        'geography': 'any',
        'geometry': 'any',
        'json': 'any'
    };

    const tsType = typeMap[sqlType.toLowerCase()] || 'any';
    return isNullable ? `${tsType} | null` : tsType;
}

// Fonction pour analyser la structure d'une table
async function analyzeTable(tableName: string, dataSource: DataSource): Promise<TableSchema>
{
    try
    {
        // R�cup�rer les colonnes de la table
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
            return { columns: [], primaryKeys: [], foreignKeys: [] };
        }

        // R�cup�rer les cl�s �trang�res
        const foreignKeys = await dataSource.query(`
            SELECT 
                fk.COLUMN_NAME as column,
                pk.TABLE_NAME as refTable,
                pk.COLUMN_NAME as refColumn
            FROM 
                INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
            JOIN 
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE fk ON rc.CONSTRAINT_NAME = fk.CONSTRAINT_NAME
            JOIN 
                INFORMATION_SCHEMA.KEY_COLUMN_USAGE pk ON rc.UNIQUE_CONSTRAINT_NAME = pk.CONSTRAINT_NAME
            WHERE 
                fk.TABLE_NAME = '${tableName}'
        `);

        const primaryKeys = columns
            .filter((col: ColumnInfo) => col.isPrimaryKey)
            .map((col: ColumnInfo) => col.name);

        return {
            columns,
            primaryKeys,
            foreignKeys: foreignKeys || []
        };
    } catch (error)
    {
        console.error(`Erreur lors de l'analyse de la table ${tableName}:`, error);
        throw error;
    }
}

// Fonction pour g�n�rer le contenu du fichier DTO
function generateDTOContent(className: string, schema: TableSchema): string
{
    let content = `import { BaseDTO } from "../base/BaseDTO";\n\n`;
    content += `/**\n`;
    content += ` * DTO pour l'entit� ${className}\n`;
    content += ` * @author DTO Generator - ${new Date().toISOString()} - Creation\n`;
    content += ` */\n`;
    content += `export class ${className}DTO extends BaseDTO {\n`;

    // Ajouter les propri�t�s
    schema.columns.forEach(column =>
    {
        if (!config.excludedFields.includes(column.name))
        {
            const propertyName = columnNameToCamelCase(column.name);
            const tsType = sqlTypeToTypeScript(column.dataType, column.isNullable);

            content += `    /**\n`;
            content += `     * ${column.name}\n`;
            if (column.isPrimaryKey) content += `     * @primary\n`;
            if (column.isNullable) content += `     * @nullable\n`;
            if (column.maxLength) content += `     * @maxLength ${column.maxLength}\n`;
            content += `     */\n`;
            content += `    ${propertyName}${column.isNullable ? '?' : ''}: ${tsType};\n\n`;
        }
    });

    content += `}\n`;

    return content;
}

// Fonction pour g�n�rer le contenu du fichier CritereDTO
function generateCritereDTOContent(className: string, schema: TableSchema): string
{
    let content = `import { BaseCritereDTO } from "../base/BaseCritereDTO";\n\n`;
    content += `/**\n`;
    content += ` * CritereDTO pour la recherche d'entit�s ${className}\n`;
    content += ` * @author DTO Generator - ${new Date().toISOString()} - Creation\n`;
    content += ` */\n`;
    content += `export class ${className}CritereDTO extends BaseCritereDTO {\n`;

    // Ajouter les propri�t�s pour la recherche
    schema.columns.forEach(column =>
    {
        if (!config.excludedFields.includes(column.name))
        {
            const propertyName = columnNameToCamelCase(column.name);
            const tsType = sqlTypeToTypeScript(column.dataType, true); // Toujours nullable pour un crit�re

            content += `    /**\n`;
            content += `     * Crit�re de recherche pour ${column.name}\n`;
            content += `     */\n`;
            content += `    ${propertyName}?: ${tsType};\n\n`;

            // Pour les cha�nes, ajouter une recherche par Like
            if (column.dataType.toLowerCase().includes('char') || column.dataType.toLowerCase() === 'text')
            {
                content += `    /**\n`;
                content += `     * Recherche avec LIKE pour ${column.name}\n`;
                content += `     */\n`;
                content += `    ${propertyName}Like?: string;\n\n`;
            }

            // Pour les nombres et dates, ajouter des plages
            if (['int', 'bigint', 'smallint', 'tinyint', 'decimal', 'numeric', 'money', 'float', 'real'].includes(column.dataType.toLowerCase()) ||
                column.dataType.toLowerCase().includes('date'))
            {

                content += `    /**\n`;
                content += `     * Valeur minimale pour ${column.name}\n`;
                content += `     */\n`;
                content += `    ${propertyName}Min?: ${tsType};\n\n`;

                content += `    /**\n`;
                content += `     * Valeur maximale pour ${column.name}\n`;
                content += `     */\n`;
                content += `    ${propertyName}Max?: ${tsType};\n\n`;
            }
        }
    });

    content += `}\n`;

    return content;
}

// Fonction pour initialiser les dossiers d'un service
function initializeServiceFolders(serviceConfig: typeof serviceConfigs[0]): void
{
    const { outputDir } = serviceConfig;

    // Initialiser le dossier des mod�les
    if (config.cleanOutputDir && fs.existsSync(outputDir))
    {
        cleanDirectory(outputDir, config.protectedFolders);
        console.log(`R�pertoire nettoy�: ${outputDir}`);
    }
    ensureDirectoryExists(outputDir);

    // Cr�er les sous-r�pertoires pour les DTOs
    for (const folder of Object.values(folders))
    {
        ensureDirectoryExists(path.join(outputDir, folder));
    }

    console.log(`Dossiers initialis�s pour ${serviceConfig.serviceName}`);
}

// Fonction principale pour g�n�rer les DTOs
async function generateDTOs(): Promise<void>
{
    let dataSource: DataSource | null = null;

    try
    {
        console.log('D�marrage de la g�n�ration des DTOs et CritereDTOs...');

        // Connexion � SQL Server avec TypeORM
        dataSource = new DataSource({
            type: "mssql",
            url: config.sqlConnectionString,
            synchronize: false,
            logging: false
        });

        await dataSource.initialize();
        console.log('Connect� � SQL Server avec TypeORM');

        // R�cup�rer toutes les tables disponibles
        const tables = await dataSource.query(`
            SELECT TABLE_NAME as name
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE'
        `);

        const allTables = tables
            .map((t: { name: string }) => t.name)
            .filter((name: string) => !config.excludedTables.includes(name));

        console.log(`${allTables.length} tables trouv�es apr�s filtrage initial.`);

        // Pour chaque service configur�
        for (const serviceConfig of serviceConfigs)
        {
            console.log(`\nTraitement du service: ${serviceConfig.serviceName}`);

            // Initialiser les dossiers pour ce service
            initializeServiceFolders(serviceConfig);

            // Filtrer les tables pour ce service
            const serviceTables = allTables.filter((name: string) =>
                serviceConfig.tables.includes(name)
            );

            console.log(`${serviceTables.length} tables associ�es � ce service.`);

            // Traiter chaque table pour ce service
            for (const tableName of serviceTables)
            {
                console.log(`Analyse de la table: ${tableName}`);

                const schema = await analyzeTable(tableName, dataSource);

                if (schema.columns.length > 0)
                {
                    const className = tableNameToClassName(tableName);

                    // G�n�rer le fichier DTO
                    const dtoContent = generateDTOContent(className, schema);
                    const dtoFilePath = path.join(serviceConfig.outputDir, folders.dto, `${className}DTO.ts`);
                    fs.writeFileSync(dtoFilePath, dtoContent);
                    console.log(`  DTO g�n�r�: ${dtoFilePath}`);

                    // G�n�rer le fichier CritereDTO
                    const critereDtoContent = generateCritereDTOContent(className, schema);
                    const critereDtoFilePath = path.join(serviceConfig.outputDir, folders.critereDto, `${className}CritereDTO.ts`);
                    fs.writeFileSync(critereDtoFilePath, critereDtoContent);
                    console.log(`  CritereDTO g�n�r�: ${critereDtoFilePath}`);
                } else
                {
                    console.log(`  Aucun DTO g�n�r� pour ${tableName} (table vide ou structure non d�tect�e).`);
                }
            }
        }

        console.log('\nG�n�ration des DTOs et CritereDTOs termin�e avec succ�s pour tous les services!');

    } catch (error)
    {
        console.error('Erreur lors de la g�n�ration des DTOs et CritereDTOs:', error);
    } finally
    {
        // Fermer la connexion DataSource
        if (dataSource && dataSource.isInitialized)
        {
            await dataSource.destroy();
            console.log('D�connect� de SQL Server');
        }
    }
}

// Ex�cuter la g�n�ration
generateDTOs();