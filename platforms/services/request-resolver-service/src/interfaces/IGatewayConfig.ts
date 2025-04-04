import { IRoutePermission } from "./IRoutePermission";
import { IServiceDefinition } from "./IServiceDefinition";

export interface IGatewayConfig
{
    port: number;
    services: IServiceDefinition[];
    defaultPermissions?: IRoutePermission[];
}