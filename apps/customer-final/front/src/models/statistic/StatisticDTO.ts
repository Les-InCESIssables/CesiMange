import { BaseDTO } from "../base/BaseDTO";

/**
 * DTO pour l'entit� Statistic
 * @Author ModelGenerator - 2025-03-19T20:54:38.012Z - Cr�ation
 */
export class StatisticDTO extends BaseDTO {
  metric?: string;
  value?: number;
  timestamp?: Date;
}
