import { AuthUsers } from "../../models/entities/authusers/AuthUsers";
import { AuthUsersCritereDTO } from "../../models/entities/authusers/AuthUsersCritereDTO";
import { BaseMetier } from "../../../../../services/base-classes/src/metier/base/BaseMetier";

/**
 * M�tier pour l'entit� AuthUsers
 * @author Metier Generator - 2025-04-01T19:17:50.592Z - Creation
 */
export class AuthUsersMetier extends BaseMetier<AuthUsers, AuthUsersCritereDTO> {
    constructor() {
        super('AuthUsers');
    }
}
