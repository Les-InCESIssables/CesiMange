// request-resolver-service/src/middlewares/security.middleware.ts

import helmet from "helmet";
import cors from "cors";
import express, { Request, Response, NextFunction } from "express";

/**
 * Middleware de sécurité regroupant Helmet, CORS, et autres headers.
 */
export function securityMiddleware(): express.RequestHandler[] {
  return [
    helmet(), // Définit des headers de sécurité
    cors(), // Active CORS pour contrôler les accès cross-origin
    // Vous pouvez ajouter d'autres middlewares de sécurité ici
    (req: Request, res: Response, next: NextFunction) => {
      // Par exemple, masquer l'information sur le serveur
      res.removeHeader("X-Powered-By");
      next();
    },
  ];
}
