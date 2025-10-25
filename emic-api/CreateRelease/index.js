const { CosmosClient } = require('@azure/cosmos');

// --- Cosmos DB Setup ---
// These environment variables must be set in your Azure SWA Configuration
const endpoint = process.env.COSMOS_DB_ENDPOINT; 
const key = process.env.COSMOS_DB_KEY;
const client = new CosmosClient({ endpoint, key }); 

const databaseId = 'emicTrackerDB'; 
const releasesContainerId = 'releases';
const adminsContainerId = 'admins'; 

// Expected fields for validation
const requiredFields = ['title', 'director', 'genre', 'studio', 'releaseDate'];

// Main Function Handler
module.exports = async function (context, req) {
    
    // 1. Get Authentication Credentials from Headers
    const username = req.headers['x-admin-username'];
    const password = req.headers['x-admin-password'];
    
    if (!username || !password) {
        context.res = { status: 401, body: "Unauthorized: Admin credentials are required in headers." };
        return;
    }
    
    // --- 2. AUTHENTICATION CHECK ---
    try {
        const adminsContainer = client.database(databaseId).container(adminsContainerId);
        
        const { resources: users } = await adminsContainer.items
            .query({
                query: "SELECT c.id FROM c WHERE c.username = @username AND c.password = @password",
                parameters: [
                    { name: "@username", value: username },
                    { name: "@password", value: password }
                ]
            })
            .fetchAll();
            
        if (!users || users.length === 0) {
            context.res = {
                status: 401,
                body: "Unauthorized: Invalid username or password."
            };
            return;
        }
        
    } catch (authError) {
        context.log.error('Authentication check failed:', authError);
        context.res = {
            status: 500,
            body: `Server Error during authentication: ${authError.message}`
        };
        return;
    }

    // --- 3. DATA VALIDATION AND PREP ---
    
    // Expecting an array of release objects from the frontend
    const newReleases = req.body; 

    if (!Array.isArray(newReleases) || newReleases.length === 0) {
        context.res = { status: 400, body: "Bad Request: Expected a non-empty array of release entries." };
        return;
    }

    // Prepare operations for bulk execution
    const operations = [];
    const invalidItems = [];

    newReleases.forEach((item, index) => {
        // Validation check for required fields
        const missingFields = requiredFields.filter(field => !item[field]);

        if (missingFields.length > 0) {
            invalidItems.push({ index, reason: `Missing fields: ${missingFields.join(', ')}` });
            return;
        }

        // Add a server-side timestamp and define the operation for the bulk API
        operations.push({
            operationType: 'Create',
            resourceBody: {
                ...item,
                createdDate: new Date().toISOString()
            }
        });
    });

    if (operations.length === 0) {
        context.res = { status: 400, body: `No valid items found for submission. Invalid items: ${JSON.stringify(invalidItems)}` };
        return;
    }

    // --- 4. BULK INSERT INTO COSMOS DB ---
    try {
        const releasesContainer = client.database(databaseId).container(releasesContainerId);
        
        // Execute the bulk operation
        const response = await releasesContainer.items.bulk(operations);
        
        // Count successful operations
        const successfulCreations = response.filter(r => r.statusCode >= 200 && r.statusCode < 300).length;

        context.res = {
            status: 201, 
            body: {
                message: `Successfully created ${successfulCreations} releases.`,
                totalSubmitted: newReleases.length,
                successful: successfulCreations,
                failed: newReleases.length - successfulCreations,
                invalidItems: invalidItems
            },
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        context.log.error('Cosmos DB Bulk Insert Error:', error);
        context.res = {
            status: 500,
            body: `Server Error during bulk insert: ${error.message}`
        };
    }
};