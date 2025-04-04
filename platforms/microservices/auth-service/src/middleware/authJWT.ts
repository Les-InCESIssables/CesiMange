import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Secret, SignOptions, JwtPayload as JwtPayloadType, VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';

// Étendre l'interface Request d'Express pour inclure l'utilisateur avec le format exact
declare global
{
    namespace Express
    {
        interface Request
        {
            user?: JwtPayload & {
                id: number;
                username: string;
                roles: string | string[];
                xsrfToken: string;
            };
        }
    }
}

/**
 * Classe utilitaire pour l'authentification JWT + CSRF
 * @author Mahmoud Charif - 01/04/2025 - CESIMANGE-70 - Creation
 * @modified - 02/04/2025 - Implémentation de la sécurité JWT+CSRF
 */
export class AuthJWT
{
    private static readonly JWT_SECRET: string = process.env.JWT_SECRET || "default_secret_key";

    /**
     * Génère un token JWT pour l'utilisateur
     * @param payload Les données à encoder dans le token
     * @param options Options de signature JWT
     * @returns Le token JWT généré
     */
    public static generateToken(payload: object, options?: SignOptions): string
    {
        let lSignOptions: SignOptions = {
            expiresIn: '8h',
            ...options
        }

        return jwt.sign(
            payload,
            this.JWT_SECRET,
            lSignOptions
        );
    }

    /**
     * Vérifie un token JWT
     * @param token Le token à vérifier
     * @returns Le payload décodé ou null si le token est invalide
     */
    public static verifyToken(token: string): JwtPayload | null
    {
        try
        {
            return jwt.verify(token, this.JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
        } catch (error)
        {
            console.error('Erreur de vérification JWT:', error);
            return null;
        }
    }

    /**
     * Génère un token CSRF cryptographiquement sécurisé
     */
    public static generateCSRFToken(): string
    {
        return crypto.randomBytes(64).toString('hex');
    }

    /**
     * Génère un refresh token cryptographiquement sécurisé
     */
    public static generateRefreshToken(): string
    {
        return crypto.randomBytes(128).toString('base64');
    }

    /**
     * Middleware pour authentifier les requêtes avec JWT et CSRF token
     * Le JWT est récupéré depuis le cookie HttpOnly et le CSRF token depuis l'en-tête
     */
    public static authenticateJWT = (req: Request, res: Response, next: NextFunction) =>
    {
        try
        {
            // cm - Récupérer le JWT depuis le cookie
            const lJwtToken = req.cookies.access_token;

            if (!lJwtToken)
            {
                return res.status(401).json({ message: 'JWT manquant dans les cookies' });
            }

            // 2. Vérifier et décoder le JWT
            const lSession = this.verifyToken(lJwtToken);

            if (!lSession)
            {
                return res.status(403).json({ message: 'JWT invalide ou expiré' });
            }

            // 3. Récupérer le token CSRF de l'en-tête
            const csrfToken = req.headers['x-xsrf-token'] as string;

            if (!csrfToken)
            {
                return res.status(403).json({ message: 'Token CSRF manquant dans les en-têtes' });
            }

            // 4. Vérifier que le token CSRF de l'en-tête correspond à celui stocké dans le JWT
            if (lSession.xsrfToken !== csrfToken)
            {
                return res.status(403).json({ message: 'Token CSRF invalide' });
            }

            // 5. Tout est valide, ajouter les informations utilisateur à la requête
            req.user = lSession as Express.Request['user'];
            next();
        } catch (error)
        {
            console.error('Erreur d\'authentification:', error);
            return res.status(500).json({ message: 'Erreur interne d\'authentification' });
        }
    };

    /**
     * Middleware pour authentifier les requêtes avec JWT et CSRF token
     * Le JWT est récupéré depuis le cookie HttpOnly et le CSRF token depuis l'en-tête
     */
    public static checkId = (req: Request, res: Response) =>
    {
        try
        {
            // cm - Récupérer le JWT depuis le cookie
            const lJwtToken = req.cookies.access_token;

            if (!lJwtToken)
            {
                return res.status(401).json({ message: 'JWT manquant dans les cookies' });
            }

            // 2. Vérifier et décoder le JWT
            const lSession = this.verifyToken(lJwtToken);

            if (!lSession)
            {
                return res.status(403).json({ message: 'JWT invalide ou expiré' });
            }

            if (req.body.id != lSession.id)
            {
                return res.status(403).json({ message: 'Accès refusée' });
            }

        } catch (error)
        {
            console.error('Erreur d\'authentification:', error);
            return res.status(500).json({ message: 'Erreur interne d\'authentification' });
        }
    };



    /**
     * Middleware pour vérifier si l'utilisateur a un rôle spécifique
     * @param roles Rôle(s) requis pour accéder à la ressource
     * @returns Middleware Express
     */
    public static hasRole = (roles: string | string[]): ((req: Request, res: Response, next: NextFunction) => void) =>
    {
        const requiredRoles = Array.isArray(roles) ? roles : [roles];

        return (req: Request, res: Response, next: NextFunction) =>
        {
            if (!req.user)
            {
                return res.status(401).json({ message: 'Authentification requise' });
            }

            // Adapter pour gérer à la fois 'roles' (utilisé dans le JWT) et 'role' (utilisé dans le contrôleur)
            const userRoles = req.user.roles || req.user.role;
            const userRoleArray = Array.isArray(userRoles) ? userRoles : [userRoles];

            const hasRequiredRole = requiredRoles.some(role => userRoleArray.includes(role));

            if (!hasRequiredRole)
            {
                return res.status(403).json({ message: 'Accès refusé: rôle requis' });
            }

            next();
        };
    };

    /**
     * Route pour rafraîchir le token JWT lorsque le token actuel est sur le point d'expirer
     * Utilise le refresh token stocké dans un cookie HttpOnly pour générer un nouveau JWT
     */
    public static refreshTokenRoute = async (req: Request, res: Response): Promise<void> =>
    {
        try
        {
            const refreshToken = req.cookies.refresh_token;

            if (!refreshToken)
            {
                res.status(401).json({ message: 'Refresh token manquant' });
                return;
            }

            // Rechercher l'utilisateur par refresh token
            // (Cette partie doit être implémentée selon votre modèle de données)
            const user = await this.findUserByRefreshToken(refreshToken);

            if (!user)
            {
                res.status(403).json({ message: 'Refresh token invalide' });
                return;
            }

            // Générer un nouveau CSRF token
            const newXsrfToken = this.generateCSRFToken();

            // Créer un nouveau JWT
            const newAccessToken = this.generateToken({
                id: user.id,
                username: user.username,
                roles: user.role,
                xsrfToken: newXsrfToken
            });

            // Créer un nouveau refresh token
            const newRefreshToken = this.generateRefreshToken();

            // Mettre à jour le refresh token en base de données
            user.refresh_token = newRefreshToken;
            await this.updateUserRefreshToken(user);

            // Définir les cookies
            res.cookie('access_token', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: parseInt(process.env.TOKEN_EXPIRATION_MS || '28800000') // 8h par défaut
            });

            res.cookie('refresh_token', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/refresh-token',
                maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRATION_MS || '2592000000') // 30 jours par défaut
            });

            // Envoyer la réponse
            res.status(200).json({
                message: 'Token rafraîchi avec succès',
                xsrfToken: newXsrfToken,
                TOKEN_EXPIRATION_MS: parseInt(process.env.TOKEN_EXPIRATION_MS || '28800000'),
                REFRESH_TOKEN_EXPIRATION_MS: parseInt(process.env.REFRESH_TOKEN_EXPIRATION_MS || '2592000000')
            });

        } catch (error)
        {
            console.error('Erreur lors du rafraîchissement du token:', error);
            res.status(500).json({ message: 'Erreur lors du rafraîchissement du token' });
        }
    };

    /**
     * Recherche un utilisateur par son refresh token
     * @param refreshToken Le refresh token à rechercher
     * @returns L'utilisateur trouvé ou null
     */
    private static async findUserByRefreshToken(refreshToken: string): Promise<any>
    {
        // Cette méthode doit être implémentée selon votre modèle de données et ORM
        // Exemple avec une méthode fictive: 
        // return await UserRepository.findByRefreshToken(refreshToken);
        console.warn("La méthode findUserByRefreshToken n'est pas implémentée");
        return null;
    }

    /**
     * Met à jour le refresh token d'un utilisateur
     * @param user L'utilisateur à mettre à jour
     */
    private static async updateUserRefreshToken(user: any): Promise<void>
    {
        // Cette méthode doit être implémentée selon votre modèle de données et ORM
        // Exemple avec une méthode fictive:
        // await UserRepository.update(user);
        console.warn("La méthode updateUserRefreshToken n'est pas implémentée");
    }
}