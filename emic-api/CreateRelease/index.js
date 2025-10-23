const { CosmosClient } = require('@azure/cosmos');

// --- Cosmos DB Setup ---
// Use environment variables (COSMOS_DB_ENDPOINT and COSMOS_DB_KEY) from your SWA config
const endpoint = process.env.COSMOS_DB_ENDPOINT; 
const key = process.env.COSMOS_DB_KEY;
const client = new CosmosClient({ endpoint, key }); // Update client creation for SWA config
const databaseId = 'emicTrackerDB'; 
const releasesContainerId = 'releases';
const adminsContainerId = 'admins'; // <-- NEW: Container for admin credentials

const requiredFields = ['title', 'director', 'genre', 'studio', 'releaseDate'];

module.exports = async function (context, req) {
    context.log('HTTP trigger function processed a request to create a new release.');

    // 1. Method Check (POST is required)
    if (req.method !== 'POST') {
        context.res = { status: 405, body: "Only POST requests are allowed." };
        return;
    }

    // --- START: Authentication Logic ---

    // Get credentials from custom Request Headers (sent by frontend app.js)
    const username = req.headers['x-admin-username'];
    const password = req.headers['x-admin-password'];
    
    if (!username || !password) {
        context.res = { status: 401, body: "Unauthorized: Admin credentials are required in headers." };
        return;
    }

    try {
        const database = client.database(databaseId);
        const adminsContainer = database.container(adminsContainerId);
        
        // Query the Admins Container to verify the credentials
        const { resources: users } = await adminsContainer.items
            .query({
                query: "SELECT c.id FROM c WHERE c.username = @username AND c.password = @password",
                parameters: [
                    { name: "@username", value: username },
                    { name: "@password", value: password }
                ]
            })
            .fetchAll();
            
        // If no user is found, authentication fails
        if (!users || users.length === 0) {
            context.res = {
                status: 401,
                body: "Unauthorized: Invalid username or password."
            };
            return;
        }
        
        context.log(`Authentication successful for user: ${username}`);

    } catch (authError) {
        context.log.error('Authentication check failed:', authError);
        // Fail securely on any database error
        context.res = {
            status: 500,
            body: `Server Error during authentication: ${authError.message}`
        };
        return;
    }

    // --- END: Authentication Logic ---
    
    const movieEntry = req.body;

    // 2. Data Validation Check (This remains the same)
    const missingFields = requiredFields.filter(field => !movieEntry[field]);

    if (missingFields.length > 0) {
        context.res = { 
            status: 400, 
            body: `Missing required fields: ${missingFields.join(', ')}` 
        };
        return;
    }

    try {
        // 3. Connect to Releases Container
        const database = client.database(databaseId);
        const releasesContainer = database.container(releasesContainerId);
        
        // Add a timestamp before saving
        const itemToCreate = { ...movieEntry, createdDate: new Date().toISOString() };

        // 4. Create the new item in the 'releases' container
        const { resource: createdItem } = await releasesContainer.items.create(itemToCreate);

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