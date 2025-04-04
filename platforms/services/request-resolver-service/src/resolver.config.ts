// request-resolver-service/src/gateway.config.ts

import { IGatewayConfig } from "./interfaces/IGatewayConfig";

export function loadGatewayConfig(): IGatewayConfig
{
    const defaultConfig: IGatewayConfig = {
        port: Number(process.env.GATEWAY_PORT) || 3000,
        services: [
            {
                apiName: 'auth',
                url: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
                enabled: true,
                publicRoutes: [
                    {
                        path: '/auth/login',
                        methods: ['POST']
                    },
                    {
                        path: 'auth/register',
                        methods: ['POST']
                    },
                    {
                        path: '/auth/refresh-token',
                        methods: ['POST']
                    }
                ],
                protectedRoutes: [
                    {
                        path: '/auth/users/:userId',
                        methods: ['DELETE', 'PATCH'],
                        requiredPermissions: ['user:write'],
                        ownershipCheck: {
                            paramName: 'userId',
                            matchField: 'sub'
                        }
                    },
                    {
                        path: '/auth/admin',
                        methods: ['GET'],
                        allowedRoles: ['admin']
                    }
                ]
            },
            {
                apiName: 'restaurant',
                url: process.env.restaurant_SERVICE_URL || 'http://localhost:4002/restaurant',
                enabled: true
            }
        ]
    };

    return defaultConfig;
}