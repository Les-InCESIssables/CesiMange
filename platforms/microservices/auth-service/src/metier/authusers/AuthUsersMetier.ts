import { AuthUsers } from "../../models/entities/authusers/AuthUsers";
import { AuthUsersCritereDTO } from "../../models/entities/authusers/AuthUsersCritereDTO";
import { BaseMetier } from "../../../../../services/base-classes/src/metier/base/BaseMetier";
import { KafkaConfig } from "kafkajs";
import { EEventType } from "../../../../../services/message-broker-service/src/enums/EEventType";
import { ServiceBroker } from "../../../../../services/message-broker-service/src/service-broker";


/**
 * Métier pour l'entité AuthUsers
 */
export class AuthUsersMetier extends BaseMetier<AuthUsers, AuthUsersCritereDTO>
{
    private _ServiceBroker: ServiceBroker;

    constructor ()
    {
        super('AuthUsers', AuthUsers);

        // Configuration Kafka pour le ServiceBroker
        const lKafkaConfig: KafkaConfig = {
            clientId: 'auth-users-service',
            brokers: ['localhost:9092'],
        };

        this._ServiceBroker = new ServiceBroker(lKafkaConfig);
    }

    /**
     * Méthode appelée après la suppression d'un utilisateur
     * Publie un événement sur Kafka pour informer les autres services
     * @param item Utilisateur supprimé
     */
    override async afterDeleteItem(item: AuthUsers): Promise<void>
    {
        try
        {
            // Publier l'événement via le ServiceBroker
            await this._ServiceBroker.publishEvent<number | undefined>(EEventType.USER_DELETED, item.id);

            console.log(`Événement ${EEventType.USER_DELETED} publié pour userId: ${item.id}`);
        } catch (error)
        {
            console.error('Échec de la publication de l\'événement de suppression utilisateur:', error);
            // Gérez l'erreur selon votre stratégie (relancer, logger, etc.)
        }
    }
}
