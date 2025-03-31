import { IUser } from '../../models/interfaces/IUser';

import { BaseMetier } from '../../../../../services/base-classes/src';

/**
 * M�tier pour l'entit� User
 * @Author ModelGenerator - 2025-03-23T18:01:31.057Z - Cr�ation
 */
export class UserMetier extends BaseMetier<IUser, Partial<IUser>> {
    constructor() {
        super('user');
    }
}
