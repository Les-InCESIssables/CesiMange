import { DeveloperDTO } from "../../models/developer/DeveloperDTO";
import { DeveloperCritereDTO } from "../../models/developer/DeveloperCritereDTO";
import { BaseMetier } from "../base/BaseMetier";

/**
 * M�tier pour l'entit� Developer
 * @Author ModelGenerator - 2025-03-19T19:32:22.689Z - Cr�ation
 */
export class DeveloperMetier extends BaseMetier<DeveloperDTO, DeveloperCritereDTO> {
    constructor() {
        super('developer');
    }
}