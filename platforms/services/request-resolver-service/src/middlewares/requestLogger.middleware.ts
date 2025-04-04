// api-gateway/src/middlewares/requestLogger.middleware.ts

import { Request, Response, NextFunction } from "express";

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const appName = req.headers["x-application-name"] || "unknown";
  console.log(
    `[Request Logger] Application: ${appName}, Method: ${req.method}, URL: ${req.originalUrl}`
  );
  next();
}
