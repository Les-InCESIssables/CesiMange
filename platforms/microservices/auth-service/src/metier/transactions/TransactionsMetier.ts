import { Transactions } from "../../models/entities/transactions/Transactions";
import { TransactionsCritereDTO } from "../../models/entities/transactions/TransactionsCritereDTO";
import { BaseMetier } from "../../../../../services/base-classes/src/metier/base/BaseMetier";

/**
 * M�tier pour l'entit� Transactions
 * @author Metier Generator - 2025-04-01T22:33:48.963Z - Creation
 */
export class TransactionsMetier extends BaseMetier<Transactions, TransactionsCritereDTO> {
    constructor() {
        super('Transactions',Transactions);
    }
}
