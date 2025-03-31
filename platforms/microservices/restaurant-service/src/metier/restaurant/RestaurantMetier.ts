import { IRestaurant } from '../../models/interfaces/IRestaurant';

import { BaseMetier } from '../../../../../services/base-classes/src';

/**
 * M�tier pour l'entit� Restaurant
 * @Author ModelGenerator - 2025-03-23T18:01:31.113Z - Cr�ation
 */
export class RestaurantMetier extends BaseMetier<IRestaurant, Partial<IRestaurant>> {
    constructor() {
        super('restaurant');
    }
}
