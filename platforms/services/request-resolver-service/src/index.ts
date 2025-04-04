import express from "express";
import dotenv from "dotenv";
import { loadGatewayConfig } from "./resolver.config";
import { setupProxies } from "./proxySetup";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import { securityMiddleware } from "./middlewares/security.middleware";
import { requestLogger } from "./middlewares/requestLogger.middleware";

dotenv.config();

const config = loadGatewayConfig();
const app = express();
app.use(bodyParser.json({ limit: '10mb' })); // Augmente la limite si nécessaire
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// Middlewares de sécurité et parsing
app.use(helmet());
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));

// Middleware personnalisé pour afficher la provenance
app.use(requestLogger);

// Middlewares de sécurité (Helmet, CORS, etc.)
app.use(...securityMiddleware());

// Configuration des proxys
setupProxies(app, config);

// Gestion des erreurs
app.use((req, res) =>
{
    res.status(404).json({
        code: 404,
        status: "Error",
        message: "Route not found.",
        data: null,
    });
});

app.listen(config.port, () =>
{
    console.log(`API Gateway listening on port ${config.port}`);
});