//#region Imports
import 'reflect-metadata';
import express from 'express';
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

require('dotenv').config();

import * as path from 'path';

//import { OrderController } from './src/controllers/order/OrderController';
//import { RestaurantController } from './src/controllers/restaurant/RestaurantController';
//import { RestaurantMetier } from './src/metier/restaurant/RestaurantMetier';
//import { OrderMetier } from './src/metier/order/OrderMetier';

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { AuthUsersController } from './controllers/authusers/AuthUsersController';
import { AuthUsersMetier } from './metier/authusers/AuthUsersMetier';

import * as dotenv from 'dotenv';

const isDocker = process.env.DOCKER_ENV === 'true';

if (process.env.NODE_ENV === 'development' && isDocker === true) {
    dotenv.config({ path: '.env.development' });
} else if (process.env.NODE_ENV === 'development' && isDocker === false) {
    dotenv.config({ path: '.env.localhost' });
} else if (process.env.NODE_ENV === 'staging') {
    dotenv.config({ path: '.env.staging' });
} else if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production' });
}

//#endregion

// Cr�ation de l'application Express
const app = express();

/* app should use bodyParser. For this example we'll use json. bodyParser allows you to
access the body of your request.
*/
app.use(bodyParser.json({ extended: true }));
// cm - Utilisation du cookieParser
app.use(cookieParser());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(helmet());
app.use(
    cors({
        origin: '*', // ou liste d'origines autorisées, ex: ['http://localhost:3000']
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }),
);

/**
 * Logging HTTP standard avec morgan
 * Format 'dev' ou 'combined' selon vos besoins
 */
app.use(morgan('dev'));

const userController = new AuthUsersController(new AuthUsersMetier());
//const restaurantController = new RestaurantController(new RestaurantMetier());
//const orderMetier = new OrderController(new OrderMetier());
app.use('/auth', userController.getRouter());

//app.use('/api/resto', restaurantController.getRouter());
//app.use('/api/order', orderMetier.getRouter());

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

// We assign the port number 8080.
const port = 4001;

// We can see that the app is listening on which port.
app.listen(port, () => {
    console.log(`App is listening on port ${port}`);
});

