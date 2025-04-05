 // request-resolver-service/src/gateway.config.ts

import { IGatewayConfig } from "./interfaces/IGatewayConfig";

export function loadGatewayConfig(): IGatewayConfig
{
    const defaultConfig: IGatewayConfig = {
        port: Number(process.env.GATEWAY_PORT) || 3000,
        services: [
            {
                apiName: 'auth',
                BaseUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:4001/auth',
                enabled: true,
                publicRoutes: [
                    {
                        path: '/login',
                        methods: ['POST']
                    },
                    {
                        path: '/register',
                        methods: ['POST']
                    },
                    {
                        path: '/refresh-token',
                        methods: ['POST']
                    }
                ],
                protectedRoutes: [
                    {
                        path: '/:id',
                        methods: ['DELETE'],
                        ownershipCheck: {
                            paramName: 'id',
                            matchField: 'sub'
                        }
                    },
                    {
                        path: '/admin',
                        methods: ['GET'],
                        allowedRoles: ['admin']
                    }
                ]
            },
            {
                apiName: 'restaurants',
                BaseUrl: process.env.restaurant_SERVICE_URL || 'http://localhost:4003/restaurants',
                enabled: true,
                publicRoutes: [
                    {
                        path: '/',
                        methods: ['GET']
                    },
                    {
                        path: '/:id',
                        methods: ['GET']
                    }
                ],
                protectedRoutes: [
                    {
                        path: '/:id',
                        methods: ['DELETE'],
                        ownershipCheck: {
                            paramName: 'id',
                            matchField: 'sub'
                        }
                    },
                    {
                        path: '/admin',
                        methods: ['GET'],
                        allowedRoles: ['admin']
                    }
                ]
            }
        ]
    };

    return defaultConfig;
}