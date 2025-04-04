//#region Imports
import express from 'express';
const bodyParser = require('body-parser');
require('dotenv').config();

import * as path from 'path';

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { RestaurantController } from './controllers/restaurants/RestaurantController';
import { RestaurantMetier } from './metier/restaurants/RestaurantMetier';

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

console.log('Connecting to', process.env.CONNECTION_STRING);
console.log('DB name is', process.env.MONGO_DB_NAME);
console.log('Docker use : ', isDocker);

const restaurantController = new RestaurantController(new RestaurantMetier());

app.use('/api/restaurants', restaurantController.getRouter());

// We assign the port number 8080.
const port = 4003;

// We can see that the app is listening on which port.
app.listen(port, () => {
    console.log(`App is listening on port ${port}`);
});
