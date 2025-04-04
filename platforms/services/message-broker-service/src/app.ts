// simple-uber-eat-fixed.ts
import { Kafka, Producer, Consumer, Admin, Message, KafkaMessage, Partitioners } from 'kafkajs';

// Définition des interfaces pour nos objets
interface Plat
{
    nom: string;
    quantite: number;
    prix: number;
}

interface Commande
{
    id: string;
    clientId: string;
    restaurant: string;
    plats: Plat[];
    statut: 'reçue' | 'prête' | 'en_livraison' | 'livrée';
    horodatage: string;
}

// Configuration Kafka simple
const kafka = new Kafka({
    clientId: 'uber-eat-app',
    brokers: ['localhost:9092']
});

// Fonction d'attente
const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// 1. Créer les topics nécessaires
async function setupTopics(): Promise<void>
{
    console.log('Création des topics Kafka...');

    const admin: Admin = kafka.admin();
    await admin.connect();

    // Seulement 3 topics pour notre exemple simplifié
    const topics: string[] = [
        'commandes',
        'preparation',
        'livraison'
    ];

    try
    {
        await admin.createTopics({
            topics: topics.map(topic => ({
                topic,
                numPartitions: 1,
                replicationFactor: 1
            }))
        });
        console.log('Topics créés avec succès');
    } catch (error: any)
    {
        if (error.message && error.message.includes('TOPIC_ALREADY_EXISTS'))
        {
            console.log('Topics déjà existants');
        } else
        {
            throw error;
        }
    } finally
    {
        await admin.disconnect();
    }

    // Attendre que Kafka enregistre les topics
    await wait(2000);
}

// 2. Service de commande
async function startCommandeService(): Promise<{
    passerCommande: (clientId: string, restaurant: string, plats: Plat[]) => Promise<string>;
    close: () => Promise<void>;
}>
{
    const producer: Producer = kafka.producer({
        // Utiliser l'ancien partitionner pour maintenir la compatibilité
        createPartitioner: Partitioners.LegacyPartitioner
    });
    await producer.connect();

    console.log('Service de commande démarré');

    // Simuler une nouvelle commande
    async function passerCommande(clientId: string, restaurant: string, plats: Plat[]): Promise<string>
    {
        const commande: Commande = {
            id: `cmd-${Date.now()}`,
            clientId,
            restaurant,
            plats,
            statut: 'reçue',
            horodatage: new Date().toISOString()
        };

        console.log(`📱 COMMANDE: Nouvelle commande ${commande.id} reçue de ${clientId}`);

        await producer.send({
            topic: 'commandes',
            messages: [{
                key: commande.id,
                value: JSON.stringify(commande)
            }]
        });

        return commande.id;
    }

    return {
        passerCommande,
        close: async () => await producer.disconnect()
    };
}

// 3. Service de préparation restaurant
async function startRestaurantService(): Promise<{ close: () => Promise<void> }>
{
    const consumer: Consumer = kafka.consumer({ groupId: 'restaurant-group' });
    const producer: Producer = kafka.producer({
        createPartitioner: Partitioners.LegacyPartitioner
    });

    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({ topic: 'commandes', fromBeginning: false });

    // Réagir aux nouvelles commandes
    await consumer.run({
        eachMessage: async ({ topic, partition, message }: {
            topic: string,
            partition: number,
            message: KafkaMessage
        }) =>
        {
            // Vérifier que message.value existe
            if (!message.value)
            {
                console.error('Message reçu sans valeur');
                return;
            }

            const commande: Commande = JSON.parse(message.value.toString());
            console.log(`🍳 RESTAURANT: Commande ${commande.id} reçue, préparation en cours...`);

            // Simuler la préparation
            await wait(3000);

            // Mettre à jour le statut
            commande.statut = 'prête';

            // Notifier que la commande est prête
            await producer.send({
                topic: 'preparation',
                messages: [{
                    key: commande.id,
                    value: JSON.stringify(commande)
                }]
            });

            console.log(`🍔 RESTAURANT: Commande ${commande.id} prête pour livraison`);
        },
    });

    return {
        close: async () =>
        {
            await consumer.disconnect();
            await producer.disconnect();
        }
    };
}

// 4. Service de livraison
async function startLivraisonService(): Promise<{ close: () => Promise<void> }>
{
    const consumer: Consumer = kafka.consumer({ groupId: 'livraison-group' });
    const producer: Producer = kafka.producer({
        createPartitioner: Partitioners.LegacyPartitioner
    });

    await consumer.connect();
    await producer.connect();
    await consumer.subscribe({ topic: 'preparation', fromBeginning: false });

    // Réagir aux commandes prêtes à être livrées
    await consumer.run({
        eachMessage: async ({ topic, partition, message }: {
            topic: string,
            partition: number,
            message: KafkaMessage
        }) =>
        {
            // Vérifier que message.value existe
            if (!message.value)
            {
                console.error('Message reçu sans valeur');
                return;
            }

            const commande: Commande = JSON.parse(message.value.toString());
            console.log(`🛵 LIVRAISON: Prise en charge de la commande ${commande.id} pour livraison`);

            // Simuler le temps de livraison
            await wait(5000);

            // Mettre à jour le statut
            commande.statut = 'livrée';

            // Notifier que la commande est livrée
            await producer.send({
                topic: 'livraison',
                messages: [{
                    key: commande.id,
                    value: JSON.stringify(commande)
                }]
            });

            console.log(`🏠 LIVRAISON: Commande ${commande.id} livrée avec succès au client ${commande.clientId}`);
        },
    });

    return {
        close: async () =>
        {
            await consumer.disconnect();
            await producer.disconnect();
        }
    };
}

// 5. Notifications client (abonnement au topic livraison)
async function startNotificationService(): Promise<{ close: () => Promise<void> }>
{
    const consumer: Consumer = kafka.consumer({ groupId: 'notification-group' });

    await consumer.connect();
    await consumer.subscribe({ topic: 'livraison', fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, partition, message }: {
            topic: string,
            partition: number,
            message: KafkaMessage
        }) =>
        {
            // Vérifier que message.value existe
            if (!message.value)
            {
                console.error('Message reçu sans valeur');
                return;
            }

            const commande: Commande = JSON.parse(message.value.toString());
            console.log(`📲 NOTIFICATION: Envoi d'une notification au client ${commande.clientId}: `);
            console.log(`   Votre commande ${commande.id} a été livrée! Bon appétit! 🎉`);
        },
    });

    return {
        close: async () => await consumer.disconnect()
    };
}

// 6. Scénario complet
async function runUberEatDemo(): Promise<void>
{
    try
    {
        // Préparer les topics
        await setupTopics();

        // Démarrer tous les services
        console.log('\n🚀 Démarrage des services UberEat...\n');
        const commandeService = await startCommandeService();
        const restaurantService = await startRestaurantService();
        const livraisonService = await startLivraisonService();
        const notificationService = await startNotificationService();

        // Attendre que tout soit démarré
        await wait(1000);

        // Simuler plusieurs commandes
        console.log('\n===== SIMULATION DE COMMANDES =====\n');

        await commandeService.passerCommande('alice', 'Burger King', [
            { nom: 'Whopper', quantite: 1, prix: 7.5 },
            { nom: 'Frites', quantite: 1, prix: 3.5 },
            { nom: 'Coca', quantite: 1, prix: 2.5 }
        ]);

        await wait(2000);

        await commandeService.passerCommande('bob', 'Sushi Shop', [
            { nom: 'California Roll', quantite: 2, prix: 12 },
            { nom: 'Miso Soup', quantite: 1, prix: 4 }
        ]);

        // Laisser le temps aux messages de circuler
        console.log('\nTraitement des commandes en cours...\n');
        await wait(15000);

        // Fermer tous les services
        console.log('\n===== FIN DE LA DÉMONSTRATION =====\n');
        await commandeService.close();
        await restaurantService.close();
        await livraisonService.close();
        await notificationService.close();

        console.log('Tous les services arrêtés proprement');

    } catch (error: any)
    {
        console.error('Erreur:', error);
    }
}

// Exécuter la démo
runUberEatDemo().catch((error: Error) =>
{
    console.error('Erreur non gérée:', error);
    process.exit(1);
});