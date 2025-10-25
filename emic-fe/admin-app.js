// Global variable to store authenticated credentials for the session
let adminCredentials = null; 
const API_URL = 'https://lemon-smoke-07dda520f.3.azurestaticapps.net/api/CreateRelease';
const REQUIRED_HEADERS = ['title', 'director', 'genre', 'studio', 'releaseDate'];

// --- 1. Authentication Logic ---

async function handleAuthentication() {
    // Prompt loop for credentials
    let username, password;
    
    // Check if credentials are already stored (after a successful login)
    if (adminCredentials) {
        // If already authenticated, just proceed to show the form
        showDataEntryForm();
        return;
    }

    // Loop until credentials are provided or user cancels
    while (true) {
        username = prompt("Admin: Enter Username:");
        if (username === null) return; // User cancelled
        
        password = prompt("Admin: Enter Password:");
        if (password === null) return; // User cancelled

        // Quick check to see if we can perform a dummy authenticated call.
        // NOTE: In this design, the first attempt to show the form is enough.
        // We will store the credentials and rely on the *backend* to validate them 
        // on the final form submission.
        
        // Temporarily store credentials
        adminCredentials = { username, password };
        break; 
    }
    
    // Update the UI after getting the credentials
    showDataEntryForm();
}

function showDataEntryForm() {
    const authStatusDiv = document.getElementById('authStatus');
    const dataEntryDiv = document.getElementById('dataEntryContainer');
    const statusMessage = document.getElementById('authStatus').querySelector('p');
    
    authStatusDiv.style.display = 'none';
    dataEntryDiv.style.display = 'block';

    if (adminCredentials) {
        statusMessage.textContent = `Authenticated as ${adminCredentials.username}. Enter data below.`;
    }
}


// --- 2. CSV Parsing and Submission Logic ---

function parseCsvData(csvText) {
    const lines = csvText.trim().split('\n').filter(line => line.trim() !== '');
    const releasesArray = [];

    lines.forEach((line, index) => {
        // Use semicolon as separator
        const values = line.split(';').map(v => v.trim()); 
        
        // Basic check for number of fields (5 required)
        if (values.length !== REQUIRED_HEADERS.length) {
            console.warn(`Line ${index + 1} skipped: Incorrect number of fields (${values.length}).`);
            return;
        }

        // Create the JSON object using the required headers
        const release = {};
        REQUIRED_HEADERS.forEach((header, i) => {
            release[header] = values[i];
        });

        releasesArray.push(release);
    });

    return releasesArray;
}

async function handleBulkSubmit(event) {
    event.preventDefault(); 
    
    const messageArea = document.getElementById('messageArea');
    const submitButton = document.getElementById('submitButton');
    
    if (!adminCredentials) {
        messageArea.textContent = 'Error: Credentials lost. Please refresh and try again.';
        messageArea.style.color = 'red';
        return;
    }

    const csvText = document.getElementById('csvInput').value;
    const releaseDataArray = parseCsvData(csvText);

    if (releaseDataArray.length === 0) {
        messageArea.textContent = 'Please enter valid data in the format: Title;Director;...';
        messageArea.style.color = 'orange';
        return;
    }

    messageArea.textContent = `Attempting to submit ${releaseDataArray.length} entries...`;
    messageArea.style.color = 'black';
    submitButton.disabled = true;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Attach stored credentials to the API call
                'X-Admin-Username': adminCredentials.username, 
                'X-Admin-Password': adminCredentials.password  
            },
            body: JSON.stringify(releaseDataArray) // Send the array of JSON objects
        });

        const result = await response.json();

        if (response.ok && response.status === 201) {
            // SUCCESS
            messageArea.textContent = `✅ Success: Submitted ${result.successful} of ${result.totalSubmitted} entries.`;
            messageArea.style.color = 'green';
            
            if (result.failed > 0) {
                 messageArea.textContent += `\n❌ Failed: ${result.failed} due to validation errors.`;
            }
            // Clear the input on success
            document.getElementById('csvInput').value = ''; 
            
        } else if (response.status === 401) {
             // 401 UNAUTHORIZED from the API
            messageArea.textContent = `❌ Authentication Failed: Invalid credentials or session expired.`;
            messageArea.style.color = 'red';
            // Clear credentials to force re-login on refresh
            adminCredentials = null; 
        } 
        else {
            // Other failures (400, 500)
            messageArea.textContent = `❌ Submission Error: ${result.body || response.statusText}`;
            messageArea.style.color = 'red';
        }

    } catch (error) {
        messageArea.textContent = '❌ Network Error during submission.';
        messageArea.style.color = 'red';
        console.error('Submission error:', error);
    } finally {
        submitButton.disabled = false;
    }
}


// --- 3. Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    // Add listener to the initial "Start Entry" button
    document.getElementById('startButton').addEventListener('click', handleAuthentication);

    // Add listener to the form submission
    document.getElementById('bulkEntryForm').addEventListener('submit', handleBulkSubmit);
});