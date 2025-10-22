// The base URL for your locally running Azure Functions API
const API_BASE_URL = '/api/';

// --- Configuration ---
const ADMIN_SECRET = 'emicadmin2025'; // Secret key for form access
const CURRENT_YEAR_CONTEXT = 2025; // Define the current year for project context

// --- Filtering & State Variables ---
let selectedYear = CURRENT_YEAR_CONTEXT;

const views = {
    'list': document.getElementById('listView'),
    'form': document.getElementById('formView')
};

// --- A. Navigation & Security Logic ---

/**
 * Manages the single-page view visibility.
 * Checks for the secret key if navigating to the 'form' view.
 * @param {string} viewName - 'list' or 'form'
 */
function navigateTo(viewName) {
    const urlParams = new URLSearchParams(window.location.search);
    let targetViewName = viewName;
    
    // Security Check: Only allow 'form' access if secret is in the URL
    if (viewName === 'form' && urlParams.get('admin') !== ADMIN_SECRET) {
        alert('Access Denied: You must use the secret URL to access the data entry form.');
        targetViewName = 'list'; // Fallback to list view
        // Clean the URL if the secret key was invalid
        if (window.location.search) {
             window.history.pushState({}, '', window.location.pathname);
        }
    }

    // Hide all views and show the target view
    for (const key in views) {
        views[key].style.display = 'none';
    }

    const targetView = views[targetViewName];
    if (targetView) {
        targetView.style.display = 'block';
    }

    // Refresh data only when navigating to the list
    if (targetViewName === 'list') {
        fetchAndDisplayReleases(selectedYear);
    }
}


// --- B. Year Selector and Filtering Logic ---

/** Populates the year dropdown selector. */
function populateYearSelector() {
    const selector = document.getElementById('year-selector');
    const startYear = 2025; // As requested, start year is 2025
    const endYear = CURRENT_YEAR_CONTEXT + 1; 

    for (let year = endYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        selector.appendChild(option);
    }
    
    // Set the default selection to the CURRENT_YEAR_CONTEXT
    selector.value = CURRENT_YEAR_CONTEXT; 
    document.getElementById('currentYearDisplay').textContent = CURRENT_YEAR_CONTEXT;
}

/** Handles the change event from the year selector. */
function handleYearChange(event) {
    selectedYear = event.target.value;
    document.getElementById('currentYearDisplay').textContent = selectedYear;
    fetchAndDisplayReleases(selectedYear);
}


// --- C. Function to Display Releases (GET /api/getreleases?year=...) ---

/**
 * Fetches data from the API and renders the list items.
 * @param {string} year - The year to filter releases by.
 */
async function fetchAndDisplayReleases(year) {
    const listContainer = document.getElementById('releasesList');
    listContainer.innerHTML = `<li style="text-align: center; color: gray;">Fetching data for ${year}...</li>`;
    
    const endpoint = `${API_BASE_URL}/getreleases?year=${year}`;

    try {
        const response = await fetch(endpoint);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const releases = await response.json();
        listContainer.innerHTML = '';
        
        // Mock data filtering: Check if the release date is in the selected year
        const filteredReleases = releases.filter(movie => 
            movie.releaseDate && movie.releaseDate.substring(0, 4) === String(year)
        );

        if (filteredReleases.length === 0) {
             listContainer.innerHTML = `<li style="text-align: center; color: gray;">No releases found for ${year}.</li>`;
             return;
        }

        filteredReleases.forEach(movie => {
            const li = document.createElement('li');
            li.classList.add('release-item');
            li.innerHTML = `
                <strong>${movie.title}</strong>
                <p>Director: ${movie.director}</p>
                <p>Genre: ${movie.genre} | Studio: ${movie.studio}</p>
                <p>Release Date: ${movie.releaseDate}</p>
            `;
            listContainer.appendChild(li);
        });

    } catch (error) {
        listContainer.innerHTML = `<li style="color:red; text-align: center;">Error: ${error.message}. Is the Azure Function Host running?</li>`;
        console.error('Fetch error:', error);
    }
}


// --- D. Function to Handle Form Submission (POST /api/createrelease) ---

async function handleFormSubmit(event) {
    event.preventDefault(); 
    
    // Gather data from the form fields
    const newRelease = {
        title: document.getElementById('titleInput').value,
        director: document.getElementById('directorInput').value,
        genre: document.getElementById('genreInput').value,
        studio: document.getElementById('studioInput').value,
        releaseDate: document.getElementById('releaseDateInput').value, 
    };
    
    const messageArea = document.getElementById('messageArea');
    messageArea.textContent = 'Submitting...';
    messageArea.style.color = 'black';

    try {
        const response = await fetch(`${API_BASE_URL}/createrelease`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRelease)
        });

        const result = await response.json();

        if (response.ok) {
            // SUCCESS
            messageArea.textContent = `SUCCESS! Release "${result.title}" added.`;
            messageArea.style.color = 'green';
            event.target.reset(); // Clear the form
            
            // Switch to the list view for the year the movie was submitted for
            const submittedYear = newRelease.releaseDate.substring(0, 4);
            document.getElementById('year-selector').value = submittedYear;
            selectedYear = submittedYear;
            navigateTo('list'); 
        } else {
            // FAILURE
            messageArea.textContent = `ERROR: ${result.body || response.statusText}`;
            messageArea.style.color = 'red';
        }

    } catch (error) {
        messageArea.textContent = 'Network Error during submission.';
        messageArea.style.color = 'red';
        console.error('Submission error:', error);
    }
}


// --- E. Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Set up initial data and view state
    populateYearSelector();
    
    // 2. Add event listeners to elements (instead of inline in HTML)
    document.getElementById('year-selector').addEventListener('change', handleYearChange);
    document.getElementById('releaseForm').addEventListener('submit', handleFormSubmit);

    // 3. Determine initial view based on URL search parameters
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('admin') === ADMIN_SECRET) {
        // If the secret key is present, navigate to the form
        navigateTo('form'); 
    } else {
        // Otherwise, default to the main list view
        navigateTo('list');
    }
});