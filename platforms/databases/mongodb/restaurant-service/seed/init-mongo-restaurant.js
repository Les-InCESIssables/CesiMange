// init-mongo-restaurant.js
// Initialisation de la base MongoDB pour le Restaurant Service

var dbName = 'restaurant-service';
db = db.getSiblingDB(dbName);
print('Using database: ' + dbName);

// Supprimer les collections qui doivent être gérées par ce service
db.restaurants.drop();
db.menus.drop();
db.reviews.drop();
db.promotions.drop();
print("Dropped collections 'restaurants', 'menus', 'reviews', 'promotions' if existed.");

// Création des collections
db.createCollection('restaurants');
db.createCollection('menus');
db.createCollection('reviews');
db.createCollection('promotions');
print('Created collections: restaurants, menus, reviews, promotions.');

// Date actuelle
var now = new Date();

// Insertion de restaurants d'exemple
var restaurants = [
    {
        name: 'Le Bistrot Parisien',
        description: 'Cuisine française traditionnelle dans un cadre élégant',
        location: {
            address: '15 rue de la Paix',
            city: 'Paris',
            postal_code: '75002',
            country: 'France',
            coordinates: [2.3364, 48.8666],
        },
        cuisine_types: ['française', 'gastronomique', 'traditionnelle'],
        phone: '+33123456789',
        website: 'https://bistrotparisien.fr',
        hours: {
            monday: ['11:30-14:30', '19:00-22:30'],
            tuesday: ['11:30-14:30', '19:00-22:30'],
            wednesday: ['11:30-14:30', '19:00-22:30'],
            thursday: ['11:30-14:30', '19:00-22:30'],
            friday: ['11:30-14:30', '19:00-23:00'],
            saturday: ['11:30-15:00', '19:00-23:00'],
            sunday: ['12:00-15:00'],
        },
        owner_id: 101,
        status: 'active',
        rating: 4.7,
        delivery_options: { delivery_fee: 3.99, min_order_amount: 15.0, estimated_delivery_time: 30 },
        created_at: now,
        updated_at: now,
    },
    {
        name: 'Sushi Master',
        description: 'Les meilleurs sushis préparés par des chefs japonais expérimentés',
        location: {
            address: '8 Avenue Montaigne',
            city: 'Paris',
            postal_code: '75008',
            country: 'France',
            coordinates: [2.3099, 48.8674],
        },
        cuisine_types: ['japonaise', 'sushi', 'asiatique'],
        phone: '+33198765432',
        website: 'https://sushimaster.fr',
        hours: {
            monday: ['11:30-14:30', '18:30-22:00'],
            tuesday: ['11:30-14:30', '18:30-22:00'],
            wednesday: ['11:30-14:30', '18:30-22:00'],
            thursday: ['11:30-14:30', '18:30-22:00'],
            friday: ['11:30-14:30', '18:30-23:00'],
            saturday: ['12:00-15:00', '18:30-23:00'],
            sunday: ['18:30-22:00'],
        },
        owner_id: 102,
        status: 'active',
        rating: 4.8,
        delivery_options: { delivery_fee: 4.5, min_order_amount: 20.0, estimated_delivery_time: 25 },
        created_at: now,
        updated_at: now,
    },
    {
        name: 'Pizza Napoli',
        description: 'Pizzas authentiques cuites au feu de bois',
        location: {
            address: '42 Rue des Lombards',
            city: 'Paris',
            postal_code: '75004',
            country: 'France',
            coordinates: [2.3481, 48.8599],
        },
        cuisine_types: ['italienne', 'pizza', 'méditerranéenne'],
        phone: '+33187654321',
        website: 'https://pizzanapoli.fr',
        hours: {
            monday: ['11:30-14:30', '18:30-22:30'],
            tuesday: ['11:30-14:30', '18:30-22:30'],
            wednesday: ['11:30-14:30', '18:30-22:30'],
            thursday: ['11:30-14:30', '18:30-22:30'],
            friday: ['11:30-14:30', '18:30-23:30'],
            saturday: ['11:30-15:00', '18:30-23:30'],
            sunday: ['11:30-15:00', '18:30-22:30'],
        },
        owner_id: 103,
        status: 'active',
        rating: 4.5,
        delivery_options: { delivery_fee: 2.99, min_order_amount: 15.0, estimated_delivery_time: 20 },
        created_at: now,
        updated_at: now,
    },
];

var restaurantIds = [];
restaurants.forEach(function (restaurant) {
    var res = db.restaurants.insertOne(restaurant);
    restaurantIds.push(res.insertedId);
});
print('Inserted ' + restaurantIds.length + ' restaurants.');

// Insertion de menus (exemple simplifié)
var menus = [
    {
        restaurant_id: restaurantIds[0],
        name: 'Menu du Bistrot',
        description: 'Sélection des meilleurs plats traditionnels français',
        active: true,
        availability: { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], start_time: '11:30', end_time: '22:30' },
        items: [
            { name: 'Escargots de Bourgogne', price: 12.5, available: true },
            { name: 'Bœuf Bourguignon', price: 18.9, available: true },
            { name: 'Crème Brûlée', price: 7.5, available: true },
        ],
        created_at: now,
        updated_at: now,
    },
    {
        restaurant_id: restaurantIds[1],
        name: 'Menu Dégustation',
        description: 'Sélection premium de sushis',
        active: true,
        availability: { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], start_time: '11:30', end_time: '22:00' },
        items: [
            { name: 'Edamame', price: 4.9, available: true },
            { name: 'Plateau Tokyo', price: 24.9, available: true },
            { name: 'Mochi Glacé', price: 6.5, available: true },
        ],
        created_at: now,
        updated_at: now,
    },
    {
        restaurant_id: restaurantIds[2],
        name: 'Menu Pizzeria',
        description: 'Pizzas traditionnelles italiennes',
        active: true,
        availability: { days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'], start_time: '11:30', end_time: '23:30' },
        items: [
            { name: 'Bruschetta', price: 6.9, available: true },
            { name: 'Pizza Margherita', price: 10.9, available: true },
            { name: 'Tiramisu', price: 6.5, available: true },
        ],
        created_at: now,
        updated_at: now,
    },
];

var menuIds = [];
menus.forEach(function (menu) {
    var res = db.menus.insertOne(menu);
    menuIds.push(res.insertedId);
});
print('Inserted ' + menuIds.length + ' menus.');

// Création des index pour restaurants et menus
db.restaurants.createIndex({ 'location.coordinates': '2dsphere' });
db.restaurants.createIndex({ name: 1 });
db.restaurants.createIndex({ cuisine_types: 1 });
db.menus.createIndex({ restaurant_id: 1 });
print('Indexes created for restaurants and menus.');

print('🎉 Restaurant Service initialization complete.');
