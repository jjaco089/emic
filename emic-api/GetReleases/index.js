const { CosmosClient } = require('@azure/cosmos');

// --- Cosmos DB Setup ---
const client = new CosmosClient(process.env.CosmosDbConnectionString);
const databaseId = 'emicTrackerDB';
const containerId = 'releases';

module.exports = async function (context, req) {
    context.log('HTTP trigger function processed a request to get releases.');

    // 1. Get the year from the query string (e.g., ?year=2025)
    const year = req.query.year;

    if (!year) {
         context.res = { status: 400, body: 'The "year" query parameter is required.' };
         return;
    }

    // 2. Build the SQL Query
    // Queries data filtering by the year prefix of the releaseDate
    const querySpec = {
    // We are filtering by year and ordering by releaseDate in DESCENDING order (latest first)
    query: "SELECT * FROM c WHERE STARTSWITH(c.releaseDate, @year) ORDER BY c.releaseDate DESC",
    parameters: [{
        name: "@year",
        value: year
    }]
    };

    try {
        // 3. Connect to DB and Container
        const database = client.database(databaseId);
        const container = database.container(containerId);

        // 4. Execute the query
        const { resources } = await container.items
            .query(querySpec)
            .fetchAll(); // Fetches all results from the query

        // 5. Success Response
        context.res = {
            status: 200, 
            body: resources, // This now returns data from Cosmos DB
            headers: { 'Content-Type': 'application/json' }
        };

    } catch (error) {
        context.log.error('Cosmos DB Read Error:', error);
        context.res = {
            status: 500,
            body: `Failed to retrieve releases: ${error.message}`
        };
    }
};