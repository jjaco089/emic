// The base URL for your locally running Azure Functions API
const API_BASE_URL = '/api/';

// --- Configuration ---
const CURRENT_YEAR_CONTEXT = 2025; // Define the current year for project context

// --- Filtering & State Variables ---
let selectedYear = CURRENT_YEAR_CONTEXT;

const views = {
    // Only the list view remains
    'list': document.getElementById('listView'),
};

// --- A. Navigation & View Logic (Simplified) ---

/**
 * Ensures the list view is always visible and refreshed.
 * NOTE: Since there is only one view, this mostly acts as a refresh trigger.
 * @param {string} viewName - 'list' (always defaults to list)
 */
function navigateTo(viewName) {
    // Hide all (in case we add more later) and show the list view
    for (const key in views) {
        views[key].style.display = 'none';
    }

    const targetView = views['list'];
    if (targetView) {
        targetView.style.display = 'block';
    }

    // Always refresh data
    fetchAndDisplayReleases(selectedYear);
}


// --- B. Year Selector and Filtering Logic ---

/** Populates the year dropdown selector. */
function populateYearSelector() {
    const selector = document.getElementById('year-selector');
    const startYear = 2025; 
    const endYear = CURRENT_YEAR_CONTEXT + 1; 

    for (let year = endYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        selector.appendChild(option);
    }
    
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
    
    const endpoint = `${API_BASE_URL}getreleases?year=${year}`; // Use updated endpoint without leading slash

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


// --- D. Form Submission Function (REMOVED) ---
// The handleFormSubmit function has been removed entirely.


// --- E. Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Set up initial data and view state
    populateYearSelector();
    
    // 2. Add event listeners (form submit listener removed)
    document.getElementById('year-selector').addEventListener('change', handleYearChange);

    // 3. Determine initial view (always navigate to list to load data)
    navigateTo('list'); 
});