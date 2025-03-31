import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';
require('dotenv').config();

/**
 * Script de g�n�ration automatique de DTOs et Entit�s � partir de SQL Server
 * @author Mahmoud Charif - CESIMANGE-118 - 31/03/2025 - Cr�ation
 * @author Modifi� pour ajouter la g�n�ration d'entit�s
 */

// Configuration des services et des tables associ�es
const serviceConfigs = [
    {
        serviceName: 'user-service',
        tables: ['UserRoles', 'UserToRoles', 'Orders', 'Payments', 'Reviews', 'Users'],
        outputDir: '../user-service/src/models/'
    },
    {
        serviceName: 'restaurant-service',
        tables: [],
        outputDir: '../restaurant-service/src/models/'
    }
];

// Configuration g�n�rale
const config = {
    excludedFields: ['CreatedAt', 'UpdatedAt', 'DeletedAt'],
    excludedTables: ['__EFMigrationsHistory', 'sysdiagrams']
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

// Fonction pour s'assurer qu'un r�pertoire existe
function ensureDirectoryExists(dirPath: string): void
{
    if (!fs.existsSync(dirPath))
    {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Fonction pour convertir le nom d'une table en nom de classe (PascalCase)
function tableNameToClassName(name: string): string
{
    // Enlever le pr�fixe T_ si pr�sent
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

// Fonction pour convertir un type SQL en d�corateur TypeORM
function sqlTypeToTypeOrmDecorator(column: ColumnInfo): string 
{
    const { dataType, isNullable, maxLength, name, isPrimaryKey } = column;

    let decorator = isPrimaryKey ? '@PrimaryColumn()' : '@Column(';

    if (!isPrimaryKey)
    {
        const options = [];

        if (dataType.toLowerCase().includes('char') && maxLength)
        {
            options.push(`length: ${maxLength}`);
        }

        if (!isNullable)
        {
            options.push('nullable: false');
        }

        if (options.length > 0)
        {
            decorator += `{ ${options.join(', ')} }`;
        }

        decorator += ')';
    }

    return decorator;
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

// NOUVELLE FONCTION : G�n�rer une entit� TypeORM
// NOUVELLE FONCTION : G�n�rer une entit� TypeORM
function generateEntityContent(className: string, tableName: string, schema: TableSchema): string
{
    let content = `import { Entity, Column, PrimaryColumn, ObjectLiteral, PrimaryGeneratedColumn } from "typeorm";\n\n`;
    content += `/**\n`;
    content += ` * Entit� TypeORM pour la table SQL Server ${tableName}\n`;
    content += ` * @author Entity Generator - ${new Date().toISOString()} - Creation\n`;
    content += ` */\n`;
    content += `@Entity("${tableName}")\n`;
    content += `export class ${className} implements ObjectLiteral\n{\n`;

    // Ajouter les propri�t�s avec d�corateurs TypeORM
    schema.columns.forEach(column =>
    {
        if (!config.excludedFields.includes(column.name))
        {
            const camelCaseName = columnNameToCamelCase(column.name);

            content += `    /**\n`;
            content += `     * ${camelCaseName}\n`;
            if (column.maxLength) content += `     * @maxLength ${column.maxLength}\n`;
            content += `     */\n`;

            // G�n�rer le d�corateur TypeORM appropri�
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

                // Options pour le d�corateur Column
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

            // G�n�rer la propri�t� avec | undefined
            content += `    ${camelCaseName}!: ${sqlTypeToTypeScript(column.dataType, column.isNullable)};\n\n`;
        }
    });

    content += `}\n`;
    return content;
}

// Fonction pour g�n�rer le contenu du fichier CritereDTO
function generateCritereDTOContent(className: string, schema: TableSchema): string
{
    let content = `import { ObjectLiteral } from "typeorm";\n`;
    content += `/**\n`;
    content += ` * CritereDTO pour la recherche d'entit�s SQL Server ${className}\n`;
    content += ` * @author DTO Generator - ${new Date().toISOString()} - Creation\n`;
    content += ` */\n`;
    content += `export class ${className}CritereDTO implements ObjectLiteral\n{\n`;

    // Ajouter les propri�t�s pour la recherche
    schema.columns.forEach(column =>
    {
        if (!config.excludedFields.includes(column.name))
        {
            const tsType = sqlTypeToTypeScript(column.dataType, true);
            const camelCaseName = columnNameToCamelCase(column.name);

            content += `    /**\n`;
            content += `     * Crit�re de recherche pour ${camelCaseName}\n`;
            content += `     */\n`;
            content += `    ${camelCaseName}?: ${tsType} | undefined;\n\n`;

            // Pour les cha�nes, ajouter une recherche par Like
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

// Fonction principale pour g�n�rer les DTOs
async function generateDTOs(): Promise<void>
{
    let dataSource: DataSource | null = null;

    try
    {
        console.log('D�marrage de la g�n�ration des DTOs et Entit�s pour SQL Server...');

        // Connexion � SQL Server avec TypeORM
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
        console.log("Connexion SQL Server �tablie");

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
            if (serviceConfig.tables.length === 0)
            {
                console.log(`\nAucune table configur�e pour le service: ${serviceConfig.serviceName}, ignor�.`);
                continue;
            }

            console.log(`\nTraitement du service: ${serviceConfig.serviceName}`);

            // Cr�er le dossier models s'il n'existe pas
            const outputDir = serviceConfig.outputDir;
            ensureDirectoryExists(outputDir);

            // Cr�er un dossier entities pour les entit�s TypeORM
            const entitiesDir = path.join(outputDir, 'entities');
            ensureDirectoryExists(entitiesDir);

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

                    // G�n�rer le fichier DTO directement dans le dossier models
                    const entityContent = generateEntityContent(className, tableName, schema);
                    const dtoFilePath = path.join(outputDir, `${className}.ts`);
                    fs.writeFileSync(dtoFilePath, entityContent);
                    console.log(`  DTO g�n�r�: ${dtoFilePath}`);

                    // G�n�rer le fichier CritereDTO directement dans le dossier models
                    const critereDtoContent = generateCritereDTOContent(className, schema);
                    const critereDtoFilePath = path.join(outputDir, `${className}CritereDTO.ts`);
                    fs.writeFileSync(critereDtoFilePath, critereDtoContent);
                    console.log(`  CritereDTO g�n�r�: ${critereDtoFilePath}`);
                } else
                {
                    console.log(`  Aucun fichier g�n�r� pour ${tableName} (table vide ou structure non d�tect�e).`);
                }
            }
        }

        console.log('\nG�n�ration des DTOs et Entit�s termin�e avec succ�s pour tous les services!');

    } catch (error)
    {
        console.error('Erreur lors de la g�n�ration des fichiers:', error);
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