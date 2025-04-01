import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
require('dotenv').config();

// Configuration des services et des collections associ�es
const serviceConfigs = [
    {
        serviceName: 'user-service',
        collections: ['user', 'developer'],
        outputDir: '../../microservices/user-service/src/models/',
        metierDir: '../../microservices/user-service/src/metier/',
        controllerDir: '../../microservices/user-service/src/controllers/'
    },
    {
        serviceName: 'restaurant-service',
        collections: ['restaurant', 'component'],
        outputDir: '../../microservices/restaurant-service/src/models/',
        metierDir: '../../microservices/restaurant-service/src/metier/',
        controllerDir: '../../microservices/restaurant-service/src/controllers/'
    }
    //{
    //    serviceName: 'order-service',
    //    collections: ['order', 'commercial'],
    //    outputDir: '../order-service/src/models/',
    //    metierDir: '../order-service/src/metier/'
    //},
    //{
    //    serviceName: 'delivery-service',
    //    collections: ['deliverie'],
    //    outputDir: '../delivery-service/src/models/',
    //    metierDir: '../delivery-service/src/metier/'
    //},
    //{
    //    serviceName: 'notification-service',
    //    collections: ['notification'],
    //    outputDir: '../notification-service/src/models/',
    //    metierDir: '../notification-service/src/metier/'
    //},
    //{
    //    serviceName: 'technical-service',
    //    collections: ['technical'],
    //    outputDir: '../technical-service/src/models/',
    //    metierDir: '../technical-service/src/metier/'
    //}
];

// Configuration g�n�rale
const config = {
    excludedFields: ['__v'],         // Champs � exclure des mod�les
    excludedCollections: ['buildenvironment', 'buildinfo', 'cmdline', 'net', 'openssl', 'startup_log', 'systemlog'],
    mongoUri: process.env.CONNECTION_STRING || 'mongodb://localhost:27017/CesiMange',
    sampleSize: 10,                  // Nombre de documents � analyser par collection
    cleanOutputDir: true,            // Nettoyer le r�pertoire de sortie avant de g�n�rer les nouveaux fichiers
    protectedFolders: ['base']       // Dossiers � ne pas supprimer lors du nettoyage
};

// Structure des dossiers pour les mod�les
const folders = {
    interfaces: 'interfaces',
    schemas: 'schemas',
    models: 'models',
};

// Types et interfaces pour l'analyse
interface FieldInfo
{
    type: string;
    mongooseType: string;
    isRequired: boolean;
    isArray: boolean;
    ref?: string;
}

interface CollectionSchema
{
    [fieldName: string]: FieldInfo;
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

// Fonction pour convertir le nom d'une collection en nom de classe (PascalCase)
function collectionNameToClassName(name: string): string
{
    // Enlever le "s" final pour les pluriels
    const singularName = name.endsWith('s') ? name.slice(0, -1) : name;

    // Convertir en PascalCase
    return singularName
        .split(/[-_]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
}

// Fonction pour d�terminer le type Mongoose � partir d'une valeur
function getMongooseType(value: any): { type: string; mongooseType: string; isArray: boolean; ref?: string }
{
    if (value === null || value === undefined)
    {
        return { type: 'any', mongooseType: 'Schema.Types.Mixed', isArray: false };
    }

    if (Array.isArray(value))
    {
        if (value.length === 0)
        {
            return { type: 'any[]', mongooseType: '[Schema.Types.Mixed]', isArray: true };
        }
        const elemType = getMongooseType(value[0]);
        return {
            type: `${elemType.type}[]`,
            mongooseType: `[${elemType.mongooseType}]`,
            isArray: true,
            ref: elemType.ref
        };
    }

    if (value instanceof Date)
    {
        return { type: 'Date', mongooseType: 'Date', isArray: false };
    }

    if (mongoose.Types.ObjectId.isValid(value) && typeof value !== 'number')
    {
        return {
            type: 'string',
            mongooseType: 'Schema.Types.ObjectId',
            isArray: false,
            ref: 'needs_manual_definition' // R�f�rence � d�finir manuellement
        };
    }

    switch (typeof value)
    {
        case 'string':
            return { type: 'string', mongooseType: 'String', isArray: false };
        case 'number':
            if (Number.isInteger(value))
            {
                return { type: 'number', mongooseType: 'Number', isArray: false };
            }
            return { type: 'number', mongooseType: 'Number', isArray: false };
        case 'boolean':
            return { type: 'boolean', mongooseType: 'Boolean', isArray: false };
        case 'object':
            return { type: 'Record<string, any>', mongooseType: 'Schema.Types.Mixed', isArray: false };
        default:
            return { type: 'any', mongooseType: 'Schema.Types.Mixed', isArray: false };
    }
}

// Fonction pour analyser la structure d'une collection
async function analyzeCollection(collectionName: string): Promise<CollectionSchema>
{
    // S'assurer que db est d�fini
    const connection = mongoose.connection;
    if (!connection.db)
    {
        throw new Error('La connexion � la base de donn�es n\'est pas �tablie');
    }

    const db = connection.db;
    const collection = db.collection(collectionName);

    // R�cup�rer un �chantillon de documents
    const sampleDocs = await collection.find({}).limit(config.sampleSize).toArray();

    if (sampleDocs.length === 0)
    {
        console.log(`  La collection ${collectionName} est vide.`);
        return {};
    }

    const schema: CollectionSchema = {};
    const requiredFields = new Set<string>();

    // Premi�re passe: identifier tous les champs possibles
    sampleDocs.forEach(doc =>
    {
        Object.keys(doc).forEach(field =>
        {
            if (!config.excludedFields.includes(field))
            {
                if (!schema[field])
                {
                    const typeInfo = getMongooseType(doc[field]);
                    schema[field] = {
                        ...typeInfo,
                        isRequired: true // Supposer d'abord que tous les champs sont requis
                    };
                    requiredFields.add(field);
                }
            }
        });
    });

    // Deuxi�me passe: v�rifier quels champs sont r�ellement requis
    sampleDocs.forEach(doc =>
    {
        const docFields = new Set(Object.keys(doc));

        requiredFields.forEach(field =>
        {
            if (!docFields.has(field))
            {
                requiredFields.delete(field);
            }
        });
    });

    // Mettre � jour l'information de requis
    Object.keys(schema).forEach(field =>
    {
        schema[field].isRequired = requiredFields.has(field);
    });

    return schema;
}

// Fonction pour g�n�rer le contenu du fichier d'interface
function generateInterfaceContent(className: string, schema: CollectionSchema): string
{
    const interfaceName = `I${className}`;

    let content = `import { Document } from 'mongoose';\n\n`;
    content += `export interface ${interfaceName} extends Document {\n`;

    Object.keys(schema).forEach(field =>
    {
        if (field !== '_id')
        {
            const { type, isRequired } = schema[field];
            content += `  ${field}${isRequired ? '' : '?'}: ${type};\n`;
        }
    });

    content += `}\n`;

    return content;
}

// Fonction pour initialiser les dossiers d'un service
function initializeServiceFolders(serviceConfig: typeof serviceConfigs[0]): void
{
    const { outputDir, metierDir } = serviceConfig;

    // Initialiser le dossier des mod�les
    if (config.cleanOutputDir && fs.existsSync(outputDir))
    {
        cleanDirectory(outputDir, config.protectedFolders);
        console.log(`R�pertoire nettoy�: ${outputDir}`);
    }
    ensureDirectoryExists(outputDir);

    // Cr�er les sous-r�pertoires pour les mod�les
    for (const folder of Object.values(folders))
    {
        ensureDirectoryExists(path.join(outputDir, folder));
    }

    // Initialiser le dossier m�tier
    if (fs.existsSync(metierDir))
    {
        // Nettoyer en pr�servant le dossier base
        cleanDirectory(metierDir, config.protectedFolders);
        console.log(`R�pertoire m�tier nettoy�: ${metierDir} (en pr�servant ${config.protectedFolders.join(', ')})`);
    }
    ensureDirectoryExists(metierDir);

    console.log(`Dossiers initialis�s pour ${serviceConfig.serviceName}`);
}

// Fonction pour g�n�rer le contenu du fichier contr�leur
function generateControllerContent(className: string, collectionName: string): string
{
    const interfaceName = `I${className}`;

    let content = `import { ${interfaceName} } from "../../models/interfaces/${interfaceName}";\n`;
    content += `import { BaseController } from "../../../../base-classes/controllers/base/BaseController";\n\n\n`;
    content += `/**\n`;
    content += ` * Contr�leur pour l'entit� ${className}\n`;
    content += ` * @Author ModelGenerator - ${new Date().toISOString()} - Cr�ation\n`;
    content += ` */\n`;
    content += `export class ${className}Controller extends BaseController<${interfaceName}, Partial<${interfaceName}>> {\n`;
    content += `}\n`;

    return content;
}

// Fonction pour g�n�rer le contenu du fichier m�tier mis � jour
function generateMetierContent(className: string, collectionName: string): string
{
    const interfaceName = `I${className}`;

    let content = `import { ${interfaceName} } from "../../models/interfaces/${interfaceName}";\n`;
    content += `import { BaseMetier } from "../../../../base-classes/metier/base/BaseMetier";\n\n\n`;
    content += `/**\n`;
    content += ` * M�tier pour l'entit� ${className}\n`;
    content += ` * @Author ModelGenerator - ${new Date().toISOString()} - Cr�ation\n`;
    content += ` */\n`;
    content += `export class ${className}Metier extends BaseMetier<${interfaceName}, Partial<${interfaceName}>> {\n`;
    content += `    constructor() {\n`;
    content += `        super('${collectionName}');\n`;
    content += `    }\n`;
    content += `}\n`;

    return content;
}

// Fonction pour initialiser le dossier des contr�leurs d'un service
function initializeControllerFolder(controllerDir: string): void
{
    // Initialiser le dossier des contr�leurs
    if (fs.existsSync(controllerDir))
    {
        // Nettoyer en pr�servant le dossier base
        cleanDirectory(controllerDir, config.protectedFolders);
        console.log(`R�pertoire des contr�leurs nettoy�: ${controllerDir} (en pr�servant ${config.protectedFolders.join(', ')})`);
    }
    ensureDirectoryExists(controllerDir);

    // S'assurer que le dossier "base" existe
    const baseDir = path.join(controllerDir, 'base');
    ensureDirectoryExists(baseDir);
}

// Fonction pour initialiser les dossiers m�tier d'un service
function initializeMetierFolder(metierDir: string): void
{
    // Initialiser le dossier m�tier
    if (fs.existsSync(metierDir))
    {
        // Nettoyer en pr�servant le dossier base
        cleanDirectory(metierDir, config.protectedFolders);
        console.log(`R�pertoire m�tier nettoy�: ${metierDir} (en pr�servant ${config.protectedFolders.join(', ')})`);
    }
    ensureDirectoryExists(metierDir);

    // S'assurer que le dossier "base" existe
    const baseDir = path.join(metierDir, 'base');
    ensureDirectoryExists(baseDir);
}

// Modifier la fonction principale pour inclure la g�n�ration des contr�leurs

// Modifier la fonction principale pour inclure la g�n�ration des contr�leurs
async function generateModels(): Promise<void>
{
    try
    {
        console.log('D�marrage de la g�n�ration des mod�les, m�tiers et contr�leurs...');

        // Connexion � MongoDB avec Mongoose
        await mongoose.connect(config.mongoUri);
        console.log('Connect� � MongoDB avec Mongoose');

        // V�rifier que la connexion est �tablie
        if (!mongoose.connection.db)
        {
            throw new Error('La connexion � la base de donn�es n\'est pas �tablie');
        }

        // R�cup�rer toutes les collections et les filtrer
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        const allCollections = collections
            .map(c => c.name)
            .filter(name => !config.excludedCollections.includes(name));

        console.log(`${allCollections.length} collections trouv�es apr�s filtrage initial.`);

        // Pour chaque service configur�
        for (const serviceConfig of serviceConfigs)
        {
            console.log(`\nTraitement du service: ${serviceConfig.serviceName}`);

            // Initialiser les dossiers pour ce service
            initializeServiceFolders(serviceConfig);

            // Initialiser le dossier des contr�leurs si sp�cifi�
            if (serviceConfig.controllerDir)
            {
                initializeControllerFolder(serviceConfig.controllerDir);
            }

            // Initialiser le dossier des m�tiers
            initializeMetierFolder(serviceConfig.metierDir);

            // Filtrer les collections pour ce service
            const serviceCollections = allCollections.filter(name =>
                serviceConfig.collections.includes(name)
            );

            console.log(`${serviceCollections.length} collections associ�es � ce service.`);

            // Traiter chaque collection pour ce service
            for (const collectionName of serviceCollections)
            {
                console.log(`Analyse de la collection: ${collectionName}`);

                const schema = await analyzeCollection(collectionName);

                if (Object.keys(schema).length > 0)
                {
                    const className = collectionNameToClassName(collectionName);
                    const interfaceName = `I${className}`;

                    // G�n�rer le fichier d'interface
                    const interfaceContent = generateInterfaceContent(className, schema);
                    const interfaceFilePath = path.join(serviceConfig.outputDir, folders.interfaces, `${interfaceName}.ts`);
                    fs.writeFileSync(interfaceFilePath, interfaceContent);
                    console.log(`  Interface g�n�r�e: ${interfaceFilePath}`);

                    // Cr�er le dossier m�tier pour cette entit�
                    const metierEntityDir = path.join(serviceConfig.metierDir, collectionName);
                    ensureDirectoryExists(metierEntityDir);

                    // G�n�rer le fichier m�tier
                    const metierContent = generateMetierContent(className, collectionName);
                    const metierFilePath = path.join(metierEntityDir, `${className}Metier.ts`);
                    fs.writeFileSync(metierFilePath, metierContent);
                    console.log(`  M�tier g�n�r�: ${metierFilePath}`);

                    // G�n�rer le fichier contr�leur si le dossier est sp�cifi�
                    if (serviceConfig.controllerDir)
                    {
                        // Cr�er le dossier contr�leur pour cette entit�
                        const controllerEntityDir = path.join(serviceConfig.controllerDir, collectionName);
                        ensureDirectoryExists(controllerEntityDir);

                        const controllerContent = generateControllerContent(className, collectionName);
                        const controllerFilePath = path.join(controllerEntityDir, `${className}Controller.ts`);
                        fs.writeFileSync(controllerFilePath, controllerContent);
                        console.log(`  Contr�leur g�n�r�: ${controllerFilePath}`);
                    }
                } else
                {
                    console.log(`  Aucun mod�le g�n�r� pour ${collectionName} (collection vide ou structure non d�tect�e).`);
                }
            }
        }

        console.log('\nG�n�ration des mod�les, m�tiers et contr�leurs termin�e avec succ�s pour tous les services!');

    } catch (error)
    {
        console.error('Erreur lors de la g�n�ration des mod�les, m�tiers et contr�leurs:', error);
    } finally
    {
        // Fermer la connexion Mongoose
        await mongoose.disconnect();
        console.log('D�connect� de MongoDB');
    }
}

// Ex�cuter la g�n�ration
generateModels();