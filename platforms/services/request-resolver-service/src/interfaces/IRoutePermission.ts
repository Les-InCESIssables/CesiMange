// request-resolver-service/src/gateway.config.ts
export interface IRoutePermission
{
    path: string;
    methods: string[];
    requiredPermissions?: string[];
    allowedRoles?: string[];
    ownershipCheck?: {
        paramName?: string;
        matchField?: string;
        bodyField?: string;
    };
}
