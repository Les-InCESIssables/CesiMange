// request-resolver-service/src/auth.middleware.ts
import axios from 'axios';
import { Request, Response, NextFunction } from 'express';

export function createAuthMiddleware(authServiceUrl: string)
{
    return async (req: Request, res: Response, next: NextFunction) =>
    {
        // 1. Get token
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Missing token' });

        try
        {
            // 2. Verify token
            const { data: user } = await axios.get(`${authServiceUrl}/validate-token`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 2000
            });

            // 3. Simple ownership check
            if (req.params.id && req.params.id !== user.id && !user.isAdmin)
            {
                return res.status(403).json({ error: 'Resource access denied' });
            }

            // 4. Attach user to request
            req.user = user;
            next();
        } catch (error)
        {
            handleAuthError(error, res);
        }
    };
}

function handleAuthError(error: unknown, res: Response)
{
    if (axios.isAxiosError(error))
    {
        const status = error.response?.status || 401;
        const message = error.response?.data?.error || 'Authentication failed';
        return res.status(status).json({ error: message });
    }
    res.status(500).json({ error: 'Internal server error' });
}

// Extension for Express Request
declare global
{
    namespace Express
    {
        interface Request
        {
            user?: {
                id: string;
                isAdmin: boolean;
            };
        }
    }
}