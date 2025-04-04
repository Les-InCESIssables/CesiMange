import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';

import { IKafkaMessage } from './interfaces/IKafkaMessage';
import { IConsumerConfig } from './interfaces/IConsumerConfig';

/**
 * Fonction de traitement des messages
 */
export type MessageHandler<T = any> = (
    message: IKafkaMessage<T>,
    topic: string,
    partition: number
) => Promise<void>;

export class KafkaConsumer
{
    private consumer: Consumer;
    private connected: boolean = false;
    private running: boolean = false;
    private handlers: Map<string, MessageHandler> = new Map();

    constructor (
        private readonly kafka: Kafka,
        private readonly groupId: string,
        private readonly config: IConsumerConfig = {
            groupId: '',
            autoCommit: true,
            sessionTimeout: 30000
        }
    )
    {
        this.consumer = this.kafka.consumer({
            groupId,
            sessionTimeout: config.sessionTimeout
        });
    }

    /**
     * Connexion au broker Kafka
     */
    async connect(): Promise<void>
    {
        if (!this.connected)
        {
            await this.consumer.connect();
            this.connected = true;
            console.log(`Consommateur Kafka connecté (groupe: ${this.groupId})`);
        }
    }

    /**
     * Déconnexion du broker Kafka
     */
    async disconnect(): Promise<void>
    {
        if (this.connected)
        {
            await this.consumer.disconnect();
            this.connected = false;
            this.running = false;
            console.log(`Consommateur Kafka déconnecté (groupe: ${this.groupId})`);
        }
    }

    /**
     * Abonnement à un topic avec un handler
     */
    async subscribe<T>(topic: string, handler: MessageHandler<T>): Promise<void>
    {
        if (!this.connected)
        {
            await this.connect();
        }

        // Stockage du handler
        this.handlers.set(topic, handler as MessageHandler);

        // Abonnement au topic
        await this.consumer.subscribe({
            topic,
            fromBeginning: false
        });

        console.log(`Abonné au topic: ${topic} (groupe: ${this.groupId})`);

        // Démarrage de la consommation si ce n'est pas déjà fait
        if (!this.running)
        {
            await this.startConsuming();
        }
    }

    /**
     * Démarrage de la consommation des messages
     */
    private async startConsuming(): Promise<void>
    {
        if (this.running) return;

        this.running = true;

        await this.consumer.run({
            eachMessage: async (payload: EachMessagePayload) =>
            {
                const { topic, partition, message } = payload;
                const handler = this.handlers.get(topic);

                if (!handler)
                {
                    console.warn(`Pas de handler pour le topic: ${topic}`);
                    return;
                }

                try
                {
                    // Parse de la valeur
                    let value;
                    if (message.value)
                    {
                        try
                        {
                            value = JSON.parse(message.value.toString());
                        } catch (e)
                        {
                            value = message.value.toString();
                        }
                    }

                    // Parse des headers
                    const headers: Record<string, string> = {};
                    if (message.headers)
                    {
                        for (const [key, val] of Object.entries(message.headers))
                        {
                            if (val) headers[key] = val.toString();
                        }
                    }

                    // Création du message Kafka
                    const kafkaMessage: IKafkaMessage = {
                        key: message.key?.toString(),
                        value,
                        headers
                    };

                    // Appel du handler
                    await handler(kafkaMessage, topic, partition);
                } catch (error)
                {
                    console.error(`Erreur lors du traitement du message du topic ${topic}:`, error);
                }
            }
        });

        console.log(`Consommation démarrée (groupe: ${this.groupId})`);
    }
}