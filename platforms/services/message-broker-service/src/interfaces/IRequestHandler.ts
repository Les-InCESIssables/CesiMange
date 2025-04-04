/**
 * Interface pour les handlers de requ�tes
 */
export interface IRequestHandler
{
    (data: any, headers: Record<string, string>): Promise<any>;
}