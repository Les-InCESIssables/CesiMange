import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Secret, SignOptions, JwtPayload as JwtPayloadType, VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';

// �tendre l'interface Request d'Express pour inclure l'utilisateur avec le format exact
declare global {
    namespace Express {
        interface Request {
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
 * @modified - 02/04/2025 - Impl�mentation de la s�curit� JWT+CSRF
 */
export class AuthJWT {
    private static readonly JWT_SECRET: string = process.env.JWT_SECRET || "default_secret_key";

    /**
     * G�n�re un token JWT pour l'utilisateur
     * @param payload Les donn�es � encoder dans le token
     * @param options Options de signature JWT
     * @returns Le token JWT g�n�r�
     */
    public static generateToken(payload: object, options?: SignOptions): string {
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
     * V�rifie un token JWT
     * @param token Le token � v�rifier
     * @returns Le payload d�cod� ou null si le token est invalide
     */
    public static verifyToken(token: string): JwtPayload | null {
        try {
            return jwt.verify(token, this.JWT_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
        } catch (error) {
            console.error('Erreur de v�rification JWT:', error);
            return null;
        }
    }

    /**
     * G�n�re un token CSRF cryptographiquement s�curis�
     */
    public static generateCSRFToken(): string {
        return crypto.randomBytes(64).toString('hex');
    }

    /**
     * G�n�re un refresh token cryptographiquement s�curis�
     */
    public static generateRefreshToken(): string {
        return crypto.randomBytes(128).toString('base64');
    }

    /**
     * Middleware pour authentifier les requ�tes avec JWT et CSRF token
     * Le JWT est r�cup�r� depuis le cookie HttpOnly et le CSRF token depuis l'en-t�te
     */
    public static authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
        try {
            // cm - R�cup�rer le JWT depuis le cookie
            const lJwtToken = req.cookies.access_token;

            if (!lJwtToken) {
                return res.status(401).json({ message: 'JWT manquant dans les cookies' });
            }

            // 2. V�rifier et d�coder le JWT
            const decoded = this.verifyToken(lJwtToken);
            if (!decoded) {
                return res.status(403).json({ message: 'JWT invalide ou expir�' });
            }

            // 3. R�cup�rer le token CSRF de l'en-t�te
            const csrfToken = req.headers['x-xsrf-token'] as string;

             if (!csrfToken) {
                return res.status(403).json({ message: 'Token CSRF manquant dans les en-t�tes' });
            }

            // 4. V�rifier que le token CSRF de l'en-t�te correspond � celui stock� dans le JWT
            if (decoded.xsrfToken !== csrfToken) {
                return res.status(403).json({ message: 'Token CSRF invalide' });
            }

            // 5. Tout est valide, ajouter les informations utilisateur � la requ�te
            req.user = decoded as Express.Request['user'];
            next();
        } catch (error) {
            console.error('Erreur d\'authentification:', error);
            return res.status(500).json({ message: 'Erreur interne d\'authentification' });
        }
    };

    /**
     * Middleware pour v�rifier si l'utilisateur a un r�le sp�cifique
     * @param roles R�le(s) requis pour acc�der � la ressource
     * @returns Middleware Express
     */
    public static hasRole = (roles: string | string[]): ((req: Request, res: Response, next: NextFunction) => void) => {
        const requiredRoles = Array.isArray(roles) ? roles : [roles];

        return (req: Request, res: Response, next: NextFunction) => {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentification requise' });
            }

            // Adapter pour g�rer � la fois 'roles' (utilis� dans le JWT) et 'role' (utilis� dans le contr�leur)
            const userRoles = req.user.roles || req.user.role;
            const userRoleArray = Array.isArray(userRoles) ? userRoles : [userRoles];

            const hasRequiredRole = requiredRoles.some(role => userRoleArray.includes(role));

            if (!hasRequiredRole) {
                return res.status(403).json({ message: 'Acc�s refus�: r�le requis' });
            }

            next();
        };
    };

    /**
     * Middleware pour v�rifier si l'utilisateur est propri�taire d'une ressource ou a un r�le d'admin
     * @param idExtractor Fonction pour extraire l'ID de la ressource demand�e
     * @returns Middleware Express
     */
    public static isResourceOwnerOrAdmin = (
        idExtractor: (req: Request) => number
    ): ((req: Request, res: Response, next: NextFunction) => void) => {
        return (req: Request, res: Response, next: NextFunction) => {
            if (!req.user) {
                return res.status(401).json({ message: 'Authentification requise' });
            }

            const resourceId = idExtractor(req);
            const userId = req.user.id;

            // Adapter pour g�rer � la fois 'roles' (utilis� dans le JWT) et 'role' (utilis� dans le contr�leur)
            const userRoles = req.user.roles || req.user.role;
            const userRoleArray = Array.isArray(userRoles) ? userRoles : [userRoles];
            const isAdmin = userRoleArray.includes('admin');

            // Autoriser si l'utilisateur est propri�taire de la ressource ou s'il est admin
            if (userId === resourceId || isAdmin) {
                return next();
            }

            return res.status(403).json({ message: 'Acc�s non autoris� � cette ressource' });
        };
    };

    /**
     * Route pour rafra�chir le token JWT lorsque le token actuel est sur le point d'expirer
     * Utilise le refresh token stock� dans un cookie HttpOnly pour g�n�rer un nouveau JWT
     */
    public static refreshTokenRoute = async (req: Request, res: Response): Promise<void> => {
        try {
            const refreshToken = req.cookies.refresh_token;

            if (!refreshToken) {
                res.status(401).json({ message: 'Refresh token manquant' });
                return;
            }

            // Rechercher l'utilisateur par refresh token
            // (Cette partie doit �tre impl�ment�e selon votre mod�le de donn�es)
            const user = await this.findUserByRefreshToken(refreshToken);

            if (!user) {
                res.status(403).json({ message: 'Refresh token invalide' });
                return;
            }

            // G�n�rer un nouveau CSRF token
            const newXsrfToken = this.generateCSRFToken();

            // Cr�er un nouveau JWT
            const newAccessToken = this.generateToken({
                id: user.id,
                username: user.username,
                roles: user.role,
                xsrfToken: newXsrfToken
            });

            // Cr�er un nouveau refresh token
            const newRefreshToken = this.generateRefreshToken();

            // Mettre � jour le refresh token en base de donn�es
            user.refresh_token = newRefreshToken;
            await this.updateUserRefreshToken(user);

            // D�finir les cookies
            res.cookie('access_token', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: parseInt(process.env.TOKEN_EXPIRATION_MS || '28800000') // 8h par d�faut
            });

            res.cookie('refresh_token', newRefreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/refresh-token',
                maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRATION_MS || '2592000000') // 30 jours par d�faut
            });

            // Envoyer la r�ponse
            res.status(200).json({
                message: 'Token rafra�chi avec succ�s',
                xsrfToken: newXsrfToken,
                TOKEN_EXPIRATION_MS: parseInt(process.env.TOKEN_EXPIRATION_MS || '28800000'),
                REFRESH_TOKEN_EXPIRATION_MS: parseInt(process.env.REFRESH_TOKEN_EXPIRATION_MS || '2592000000')
            });

        } catch (error) {
            console.error('Erreur lors du rafra�chissement du token:', error);
            res.status(500).json({ message: 'Erreur lors du rafra�chissement du token' });
        }
    };

    /**
     * Recherche un utilisateur par son refresh token
     * @param refreshToken Le refresh token � rechercher
     * @returns L'utilisateur trouv� ou null
     */
    private static async findUserByRefreshToken(refreshToken: string): Promise<any> {
        // Cette m�thode doit �tre impl�ment�e selon votre mod�le de donn�es et ORM
        // Exemple avec une m�thode fictive: 
        // return await UserRepository.findByRefreshToken(refreshToken);
        console.warn("La m�thode findUserByRefreshToken n'est pas impl�ment�e");
        return null;
    }

    /**
     * Met � jour le refresh token d'un utilisateur
     * @param user L'utilisateur � mettre � jour
     */
    private static async updateUserRefreshToken(user: any): Promise<void> {
        // Cette m�thode doit �tre impl�ment�e selon votre mod�le de donn�es et ORM
        // Exemple avec une m�thode fictive:
        // await UserRepository.update(user);
        console.warn("La m�thode updateUserRefreshToken n'est pas impl�ment�e");
    }
}