import { IRepositoryConfig } from "../../DAL/repositories/base/IRepositoryConfig";
import { Repository } from "../../DAL/repositories/base/Repository";
import { UserCritereDTO } from "../../models/user/UserCritereDTO";
import { UserDTO } from "../../models/user/UserDTO";
import { BaseMetier } from "./BaseMetier";


/**
 * Contr�leur de base g�n�rique
 * @template DTO - Type de donn�es retourn�/manipul�
 * @template CritereDTO - Type des crit�res de recherche
 */
export class UserMetier extends BaseMetier<UserDTO, UserCritereDTO>
{
    constructor ()
    {
        let lConfig: IRepositoryConfig = {
            collectionName: 'users',
            connectionString: 'mongodb://localhost:27017/projet',
            dbName: 'projet'
        }
        let repo = new Repository<UserDTO, UserCritereDTO>(lConfig);
        super(repo);
    }
}