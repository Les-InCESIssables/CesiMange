import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Router } from 'express';
import { IGatewayConfig } from './interfaces/IGatewayConfig';
import { IServiceDefinition } from './interfaces/IServiceDefinition';

interface ProxyOptions extends Options
{
    pathRewrite: {
        [key: string]: string;
    };
}

export function setupProxies(router: Router, config: IGatewayConfig): void
{
    if (!config?.services)
    {
        throw new Error('Configuration des services invalide');
    }

    config.services.forEach((service: IServiceDefinition) =>
    {
        if (!service.enabled || !service.url) return;

        const proxyOptions: ProxyOptions = {
            target: service.url,
            changeOrigin: true,
            pathRewrite: {
                [`^/${service.apiName}`]: '/' // Réécriture spécifique au service
            },
            timeout: 10000
        };

        // Configuration spécifique pour chaque service
        router.use(`/${service.apiName}`, createProxyMiddleware(proxyOptions));

        console.log(`Proxy configuré: /${service.apiName}/* -> ${service.url}`);
    });

    // Middleware pour les routes non trouvées
    router.use((req, res) =>
    {
        console.warn(`Route non trouvée: ${req.method} ${req.url}`);
        res.status(404).json({ error: 'Service non trouvé' });
    });
}