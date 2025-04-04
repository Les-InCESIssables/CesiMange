import { ICustomerProfile } from '../../models/interfaces/ICustomerProfile';
import { BaseMetier } from '../../../../../services/base-classes/src/metier/base/BaseMetier';

/**
 * M�tier pour l'entit� CustomerProfile
 * @Author ModelGenerator - 2025-04-03T17:32:16.714Z - Cr�ation
 */
export class CustomerProfileMetier extends BaseMetier<ICustomerProfile, Partial<ICustomerProfile>> {
    constructor() {
        super('user_profiles');
    }
}
