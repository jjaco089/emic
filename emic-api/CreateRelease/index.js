const { CosmosClient } = require('@azure/cosmos');

// --- Cosmos DB Setup ---
// The client will automatically pick up the connection string from local.settings.json
const client = new CosmosClient(process.env.CosmosDbConnectionString);
const databaseId = 'emicTrackerDB';
const containerId = 'releases';

const requiredFields = ['title', 'director', 'genre', 'studio', 'releaseDate'];

module.exports = async function (context, req) {
    context.log('HTTP trigger function processed a request to create a new release.');

    // 1. Method Check (POST is required)
    if (req.method !== 'POST') {
        context.res = { status: 405, body: "Only POST requests are allowed." };
        return;
    }

    const movieEntry = req.body;

    // 2. Data Validation Check
    const missingFields = requiredFields.filter(field => !movieEntry[field]);

    if (missingFields.length > 0) {
        context.res = { 
            status: 400, 
            body: `Missing required fields: ${missingFields.join(', ')}` 
        };
        return;
    }

    try {
        // 3. Connect to DB and Container
        const database = client.database(databaseId);
        const container = database.container(containerId);

        // 4. Create the new item (Cosmos DB automatically assigns an 'id')
        const { resource: createdItem } = await container.items.create(movieEntry);

        // 5. Success Response
        context.res = {
            status: 201, // 201 Created
            body: createdItem,
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        context.log.error('Cosmos DB Create Error:', error);
        context.res = {
            status: 500,
            body: `Failed to save release: ${error.message}`
        };
    }
};