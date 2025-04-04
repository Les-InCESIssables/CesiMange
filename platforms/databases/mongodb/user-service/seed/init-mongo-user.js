// init-mongo-user.js

// Utilise la base "user-service". Si elle n'existe pas, elle sera créée.
var dbName = 'user-service';
db = db.getSiblingDB(dbName);
print('Using database: ' + dbName);

// Supprime la collection user_profiles si elle existe déjà (pour éviter les conflits)
db.user_profiles.drop();
print("Dropped collection 'user_profiles' (if it existed).");

// Définir le schéma de validation pour la collection user_profiles
var userProfileSchema = {
    bsonType: 'object',
    required: ['user_id', 'email', 'profile_type', 'first_name', 'last_name'],
    properties: {
        user_id: {
            bsonType: 'int',
            description: 'must be an integer and is required',
        },
        email: {
            bsonType: 'string',
            pattern: '^[^@]+@[^@]+\\.[^@]+$',
            description: 'must be a valid email address and is required',
        },
        profile_type: {
            enum: ['customer', 'delivery_person'],
            description: "must be either 'customer' or 'delivery_person'",
        },
        first_name: {
            bsonType: 'string',
            description: 'must be a string and is required',
        },
        last_name: {
            bsonType: 'string',
            description: 'must be a string and is required',
        },
        addresses: {
            bsonType: ['array'],
            description: 'optional array of addresses',
            items: {
                bsonType: 'object',
                required: ['name', 'street', 'city', 'postal_code', 'country', 'is_default'],
                properties: {
                    name: { bsonType: 'string' },
                    street: { bsonType: 'string' },
                    city: { bsonType: 'string' },
                    postal_code: { bsonType: 'string' },
                    country: { bsonType: 'string' },
                    is_default: { bsonType: 'bool' },
                    coordinates: {
                        bsonType: 'array',
                        minItems: 2,
                        maxItems: 2,
                        items: { bsonType: 'double' },
                    },
                },
            },
        },
        payment_methods: {
            bsonType: ['array'],
            description: 'optional array of payment methods',
            items: {
                bsonType: 'object',
                required: ['provider', 'last_four', 'is_default'],
                properties: {
                    provider: { bsonType: 'string' },
                    last_four: { bsonType: 'string' },
                    is_default: { bsonType: 'bool' },
                },
            },
        },
        // Champs optionnels pour un delivery person
        vehicle_info: {
            bsonType: 'object',
            description: 'Information sur le véhicule, requis pour les delivery person',
            properties: {
                type: { bsonType: 'string' },
                make: { bsonType: 'string' },
                model: { bsonType: 'string' },
                year: { bsonType: 'int' },
            },
        },
        license_number: {
            bsonType: 'string',
            description: 'Numéro de permis pour un delivery person',
        },
        rating: {
            bsonType: 'double',
            description: 'Rating du profil (delivery person)',
        },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' },
    },
};

// Créer la collection user_profiles avec le schéma de validation
db.createCollection('user_profiles', {
    validator: { $jsonSchema: userProfileSchema },
    validationLevel: 'strict',
    validationAction: 'error',
});
print("Created collection 'user_profiles' with validation schema.");

// Obtenir la date actuelle
var now = new Date();

// Insertion d'un profil client
db.user_profiles.insertOne({
    user_id: 101,
    profile_type: 'customer',
    first_name: 'Alicesss',
    last_name: 'Smith',
    email: 'alice@example.com',
    addresses: [
        {
            name: 'Home',
            street: '123 Main St',
            city: 'Paris',
            postal_code: '75000',
            country: 'France',
            is_default: true,
            coordinates: [2.3522, 48.8566],
        },
    ],
    payment_methods: [
        {
            provider: 'Visa',
            last_four: '4242',
            is_default: true,
        },
    ],
    created_at: now,
    updated_at: now,
});
print('Inserted customer profile.');

// Insertion d'un profil de delivery person
db.user_profiles.insertOne({
    user_id: 102,
    profile_type: 'delivery_person',
    first_name: 'Bob',
    last_name: 'Johnson',
    email: 'bob@example.com',
    vehicle_info: {
        type: 'scooter',
        make: 'Vespa',
        model: 'Primavera',
        year: 2022,
    },
    license_number: 'B123456789',
    rating: 4.8,
    created_at: now,
    updated_at: now,
});
print('Inserted delivery person profile.');

// Création d'index pour améliorer la performance et garantir l'unicité
db.user_profiles.createIndex({ user_id: 1 }, { unique: true });
db.user_profiles.createIndex({ email: 1 }, { unique: true });
print("Indexes created on 'user_id' and 'email'.");

print("🎉 Initialization complete for database '" + dbName + "'.");
