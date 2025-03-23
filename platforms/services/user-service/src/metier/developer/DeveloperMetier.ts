import { IDeveloper } from "../../models/interfaces/IDeveloper";
import { BaseMetier } from "../../../../base-classes/metier/base/BaseMetier";


/**
 * M�tier pour l'entit� Developer
 * @Author ModelGenerator - 2025-03-23T18:01:31.071Z - Cr�ation
 */
export class DeveloperMetier extends BaseMetier<IDeveloper, Partial<IDeveloper>> {
    constructor() {
        super('developer');
    }
}
