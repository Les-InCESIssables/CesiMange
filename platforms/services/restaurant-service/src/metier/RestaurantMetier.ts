import { RestaurantDTO } from "../../models/restaurant/RestaurantDTO";
import { RestaurantCritereDTO } from "../../models/restaurant/RestaurantCritereDTO";
import { BaseMetier } from "../base/BaseMetier";

/**
 * M�tier pour l'entit� Restaurant
 * @Author ModelGenerator - 2025-03-23T13:08:52.369Z - Cr�ation
 */
export class RestaurantMetier extends BaseMetier<RestaurantDTO, RestaurantCritereDTO> {
    constructor() {
        super('restaurant');
    }
}
