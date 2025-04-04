import { AuthUsers } from "../../models/entities/authusers/AuthUsers";
import { AuthUsersCritereDTO } from "../../models/entities/authusers/AuthUsersCritereDTO";
import { BaseController } from "../../../../../services/base-classes/src/controllers/base/BaseController";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";

import { AuthJWT } from "../../middleware/authJWT";
import { AuthUsersMetier } from "../../metier/authusers/AuthUsersMetier";

/**
 * Contrôleur pour l'entité AuthUsers
 * @author Controller Generator - 2025-04-01T19:17:50.592Z - Creation
 * @modified - 02/04/2025 - Implémentation de la sécurité JWT+CSRF avec AuthJWT
 */
export class AuthUsersController extends BaseController<AuthUsers, AuthUsersCritereDTO>
{
    //#region Attributes
    private readonly TOKEN_EXPIRATION = "8h";
    private readonly TOKEN_EXPIRATION_MS = 8 * 60 * 60 * 1000; // 8 heures en millisecondes
    private readonly REFRESH_TOKEN_EXPIRATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 jours en millisecondes

    //#endregion

    //#region CTOR
    constructor (pMetier: AuthUsersMetier)
    {
        super(pMetier);
    }

    //#endregion

    //#region Methods


    override initializeRoutes(): void
    {
        // Routes publiques
        this.Router.post('/login', this.getItem);
        this.Router.post('/register', this.createItem);
        this.Router.post('/refresh-token', this.refreshToken);
        this.Router.post('/verify-token', this.refreshToken);

        // Routes protégées pour admin uniquement
        this.Router.get('/admin',
            AuthJWT.authenticateJWT,

            AuthJWT.hasRole('admin'),
            this.adminEndpoint);

        // Routes protégées pour admin uniquement
        this.Router.get('/user',
            AuthJWT.authenticateJWT,
            this.adminEndpoint);

        // Routes protégées par propriété de ressource
        this.Router.get('/:id',
            AuthJWT.authenticateJWT,
            this.getItem);

        this.Router.put('/:id',
            AuthJWT.authenticateJWT,
            this.updateItem);

        this.Router.delete('/:id',
            AuthJWT.authenticateJWT,
            AuthJWT.checkId,
            this.deleteItem);

        // Route pour la déconnexion
        this.Router.post('/logout', this.logout);
    }

    /**
     * Endpoint réservé aux administrateurs
     */
    private adminEndpoint(req: Request, res: Response): void
    {
        res.status(200).json({ message: 'Accès admin accordé', user: req.user });
    }

    /**
     * Déconnexion utilisateur - efface les cookies
     */
    private logout(req: Request, res: Response): void
    {
        // Effacer les cookies en les définissant avec une date d'expiration dans le passé
        res.cookie('access_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(0)
        });

        res.cookie('refresh_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(0),
            path: '/refresh-token'
        });

        res.status(200).json({ message: 'Déconnexion réussie' });
    }

    /**
     * Méthode commune pour générer des tokens et configurer les cookies
     * Utilisée à la fois par le login (afterGetItem) et le rafraîchissement de token
     * 
     * @param pUser L'utilisateur pour lequel générer les tokens
     * @param res L'objet Response pour configurer les cookies
     * @param message Message à inclure dans la réponse (optionnel)
     * @returns Un objet contenant les informations à renvoyer au client
     */
    private async generateTokensAndSetCookies(pUser: AuthUsers, res: Response, message?: string): Promise<any>
    {
        // 1. Générer un nouveau CSRF token
        const lXsrfToken = AuthJWT.generateCSRFToken();

        // 2. Créer le payload pour le JWT
        const lPayload = {
            id: pUser.id,
            username: pUser.email,
            roles: pUser.role,
            xsrfToken: lXsrfToken
        };

        // 3. Générer un nouveau JWT
        const lAccessToken = AuthJWT.generateToken(lPayload, { expiresIn: this.TOKEN_EXPIRATION });

        // 4. Générer un nouveau refresh token
        const lRefreshToken = AuthJWT.generateRefreshToken();

        pUser.refresh_token = lRefreshToken;

        const lUpdateCriteria = new AuthUsersCritereDTO();
        lUpdateCriteria.id = pUser.id;

        await this.Metier.updateItem(pUser, lUpdateCriteria);

        // 6. Configurer les cookies
        res.cookie('access_token', lAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: this.TOKEN_EXPIRATION_MS
        });

        res.cookie('refresh_token', lRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: this.REFRESH_TOKEN_EXPIRATION_MS,
            path: '/refresh-token'
        });

        // cm - Delete les colonne sensible
        delete pUser.refresh_token;
        delete pUser.password_hash;

        return {
            ...(message ? { message } : {}),
            ...pUser,
            xsrfToken: lXsrfToken,
            TOKEN_EXPIRATION_MS: this.TOKEN_EXPIRATION_MS,
            REFRESH_TOKEN_EXPIRATION_MS: this.REFRESH_TOKEN_EXPIRATION_MS
        };
    }

    /**
     * Rafraîchit le token JWT en utilisant le refresh token
     */
    private async refreshToken(req: Request, res: Response): Promise<void>
    {
        try
        {
            // 1. Récupérer le refresh token depuis le cookie
            const refreshToken = req.cookies.refresh_token;

            if (!refreshToken)
            {
                res.status(401).json({ message: 'Refresh token manquant' });
                return;
            }

            // 2. Chercher l'utilisateur associé au refresh token
            const userCriteria = new AuthUsersCritereDTO();
            userCriteria.refresh_token = refreshToken;

            const user = await this.Metier.getItem(userCriteria);

            if (!user || !user.id)
            {
                res.status(403).json({ message: 'Refresh token invalide ou expiré' });
                return;
            }

            // 3. Générer les nouveaux tokens et configurer les cookies
            const result = await this.generateTokensAndSetCookies(user, res, 'Token rafraîchi avec succès');

            // 4. Envoyer la réponse
            res.status(200).json(result);

        } catch (error)
        {
            console.error('Erreur lors du rafraîchissement du token:', error);
            res.status(500).json({ message: 'Erreur lors du rafraîchissement du token' });
        }
    };
    //#endregion

    //#region CreateItem
    /**
     * Surchage de la validation du register/CreateItem
     * @param pAuthUsers
     */
    public override async validateCreateItem(pAuthUsers: AuthUsers): Promise<void>
    {
        // Validation des champs
        if (!pAuthUsers.email || !pAuthUsers.password_hash || !pAuthUsers.username)
        {
            throw new Error('Tous les champs sont requis');
        }

        // Crée un critere de recherche par email
        let lAuthUser: AuthUsers = new AuthUsers();
        lAuthUser.email = pAuthUsers.email;

        // Verifie si l'utilisateur/email existe déjà
        const lExistingUser = await this.Metier.getItem(lAuthUser);
        if (lExistingUser && lExistingUser.email)
        {
            throw new Error('Cet utilisateur existe déjà');
        }
    }

    /**
     * Surchage de le beforeCreateItem du register/CreateItem
     * @param pAuthUsers
     */
    public override async beforeCreateItem(pAuthUsers: AuthUsers): Promise<AuthUsers>
    {
        let lNewUser: AuthUsers;
        if (pAuthUsers.password_hash)
        {
            // Hashe le mot de passe
            const lHashedPassword = await bcrypt.hash(pAuthUsers.password_hash, 10);

            // Cree un nouvel utilisateur
            lNewUser = new AuthUsers();
            lNewUser.username = pAuthUsers.username;
            lNewUser.password_hash = lHashedPassword;
            lNewUser.email = pAuthUsers.email;
            lNewUser.role = 'user';
        }
        else
        {
            throw new Error("No Password");
        }

        return lNewUser;
    }
    //#endregion

    //#region GetItem
    /**
     * Surchage de la validation du login/GetItem
     * @param pAuthUsers
     */
    public override async validateGetItem(pAuthUsers: AuthUsers): Promise<void>
    {
        // Validation des champs
        if (!pAuthUsers.email || !pAuthUsers.password_hash)
        {
            throw new Error('Email et mot de passe requis');
        }

        let lAuthUsers: AuthUsers = new AuthUsers();
        lAuthUsers.email = pAuthUsers.email;

        // Rechercher l'utilisateur dans la base de données
        const lUser: AuthUsers = await this.Metier.getItem(lAuthUsers);

        if (!lUser || !lUser.password_hash)
        {
            throw new Error('Identifiants invalides');
        }

        // Vérifier le mot de passe
        const lIsPasswordValid = await bcrypt.compare(pAuthUsers.password_hash, lUser.password_hash);

        if (!lIsPasswordValid)
        {
            throw new Error('Identifiants invalides');
        }
    }

    /**
     * Surchage de le beforeGetItem du login/GetItem
     * @param pAuthUsers
     */
    public override beforeGetItem(pAuthUsers: AuthUsersCritereDTO): AuthUsersCritereDTO
    {
        // Préparation du critère de recherche
        let lCritere: AuthUsersCritereDTO = new AuthUsersCritereDTO();
        lCritere.email = pAuthUsers.email;

        return lCritere;
    }

    public override async afterGetItem(pAuthUsers: AuthUsers, pRes: Response): Promise<AuthUsers>
    {
        return await this.generateTokensAndSetCookies(pAuthUsers, pRes);
    }

    public override async beforeDeleteItem(pCritere: AuthUsers) : Promise<AuthUsers>
    {
        const lCritere = new AuthUsersCritereDTO();
        lCritere.id = pCritere.id;

        return lCritere;
    }

    //#endregion
}