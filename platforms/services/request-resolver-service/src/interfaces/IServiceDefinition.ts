import { IRoutePermission } from "./IRoutePermission";

export interface IServiceDefinition
{
    apiName: string;
    url: string;
    enabled: boolean;
    publicRoutes?: IRoutePermission[];
    protectedRoutes?: IRoutePermission[];
}