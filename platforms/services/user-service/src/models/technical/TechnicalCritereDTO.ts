import { BaseCritereDTO } from "../base/BaseCritereDTO";

/**
 * Crit�res de recherche pour l'entit� Technical
 * @Author ModelGenerator - 2025-03-21T10:28:38.820Z - Cr�ation
 */
export class TechnicalCritereDTO extends BaseCritereDTO {
  name?: string;
  nameLike?: string;
  email?: string;
  emailLike?: string;
  password?: string;
  passwordLike?: string;
  department?: string;
  departmentLike?: string;
}
