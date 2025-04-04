"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
require('dotenv').config();
/**
 * Script principal pour g�n�rer les DTOs depuis MongoDB et SQL Server
 * @author Mahmoud Charif - CESIMANGE-118 - 31/03/2025 - Creation
 */
// Chemin vers les scripts de g�n�ration
const MONGO_GENERATOR_PATH = path.join(__dirname, 'src', 'mongoGenerator.ts');
const SQL_GENERATOR_PATH = path.join(__dirname, 'src', 'sqlGenerator.ts');
// V�rifier que les scripts existent
if (!fs.existsSync(MONGO_GENERATOR_PATH)) {
    console.error(`Le script MongoDB n'existe pas au chemin: ${MONGO_GENERATOR_PATH}`);
    process.exit(1);
}
if (!fs.existsSync(SQL_GENERATOR_PATH)) {
    console.error(`Le script SQL Server n'existe pas au chemin: ${SQL_GENERATOR_PATH}`);
    process.exit(1);
}
console.log('D�marrage de la g�n�ration des DTOs...');
try {
    //// Ex�cuter le script MongoDB
    console.log('G�n�ration depuis MongoDB...');
    (0, child_process_1.execSync)(`npx ts-node ${MONGO_GENERATOR_PATH}`, { stdio: 'inherit' });
    // Ex�cuter le script SQL Server
    console.log('G�n�ration depuis SQL Server...');
    (0, child_process_1.execSync)(`npx ts-node ${SQL_GENERATOR_PATH}`, { stdio: 'inherit' });
    console.log('G�n�ration des DTOs termin�e avec succ�s!');
}
catch (error) {
    console.error('Erreur lors de la g�n�ration des DTOs:', error);
    process.exit(1);
}
//# sourceMappingURL=app.js.map