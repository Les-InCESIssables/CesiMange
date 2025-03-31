import { IComponent } from '../../models/interfaces/IComponent';

import { BaseMetier } from '../../../../../services/base-classes/src';

/**
 * M�tier pour l'entit� Component
 * @Author ModelGenerator - 2025-03-23T18:01:31.098Z - Cr�ation
 */
export class ComponentMetier extends BaseMetier<IComponent, Partial<IComponent>> {
    constructor() {
        super('component');
    }
}
