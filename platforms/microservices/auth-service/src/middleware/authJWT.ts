import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Secret, SignOptions, JwtPayload as JwtPayloadType, VerifyOptions } from 'jsonwebtoken';

// �tendre l'interface Request d'Express
declare global
{
    namespace Express
    {
        interface Request
        {
            user?: JwtPayload;
        }
    }
}

/**
 * Classe utilitaire pour l'authentification JWT
 * @author Mahmoud Charif - 01/04/2025 - CESIMANGE-70 - Creation
 */
export class AuthJWT
{
    /**
     * G�n�re un token JWT pour l'utilisateur
     * @param payload Les donn�es � encoder dans le token
     * @returns Le token JWT g�n�r�
     */
    public static generateToken(payload: string): string
    {
        return jwt.sign(payload, process.env.JWT_SECRET || "");
    }

    /**
     * V�rifie un token JWT
     * @param token Le token � v�rifier
     * @returns Le payload d�cod� ou null si le token est invalide
     */
    public static verifyToken(token: string): JwtPayload | null
    {
        try
        {
            return jwt.verify(token, process.env.JWT_SECRET || "") as JwtPayload;
        } catch (error)
        {
            return null;
        }
    }

    /**
     * Middleware pour authentifier les requ�tes avec JWT
     * @param req Requ�te Express
     * @param res R�ponse Express
     * @param next Fonction next
     */
    public static authenticateJWT = (req: Request, res: Response, next: NextFunction) =>
    {
        // cm - Recupere le Bearer Token
        const lAuthHeader = req.headers.authorization;

        if (!lAuthHeader)
        {
            return res.status(401).json({ message: 'Token d\'authentification manquant' });
        }

        const lToken = lAuthHeader.split(' ')[1]; // Format: "Bearer TOKEN"

        const lDecoded = this.verifyToken(lToken);
        if (!lDecoded)
        {
            return res.status(403).json({ message: 'Token invalide ou expir�' });
        }

        // Ajouter l'utilisateur d�cod� � l'objet de requ�te
        req.user = lDecoded;
        next();
    };

    /**
     * Middleware pour v�rifier si l'utilisateur a un r�le sp�cifique
     * @param roles R�le(s) requis pour acc�der � la ressource
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

            const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
            const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

            if (!hasRequiredRole)
            {
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
    ): ((req: Request, res: Response, next: NextFunction) => void) =>
    {
        return (req: Request, res: Response, next: NextFunction) =>
        {
            if (!req.user)
            {
                return res.status(401).json({ message: 'Authentification requise' });
            }

            const resourceId = idExtractor(req);
            const userId = req.user.id;

            const userRoles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.roles];
            const isAdmin = userRoles.includes('admin');

            // Autoriser si l'utilisateur est propri�taire de la ressource ou s'il est admin
            if (userId === resourceId || isAdmin)
            {
                return next();
            }

            return res.status(403).json({ message: 'Acc�s non autoris� � cette ressource' });
        };
    };
}