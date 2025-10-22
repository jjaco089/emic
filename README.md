# Vibe Coding Project 1: EMIC - English Movies In Indian Cinemas

This project is the Minimum Viable Product (MVP) for the **English Movies Section** of a larger movie information website operating in India. It is built to provide a fast, reliable, and easily updated system for tracking English-language theatrical releases in India.

This is the foundational phase, focusing on a robust and scalable architecture (JAMstack on Azure) to support future growth into a 50-year archive (12,000+ entries).

## 🎯 Goal and Context

The primary goal of this MVP is to establish a working, low-cost system for two core functions:
1.  **Public Tracking:** Displaying releases filtered by year.
2.  **Private Administration:** Providing a secure, manual data entry form for administrators to add new releases.

## ✨ MVP User Stories (Features)

The following core features have been implemented in this MVP:

| User Role | User Story | Status |
| :--- | :--- | :--- |
| **Public User** | As a user, I can view a list of English movie releases in India for a given year. | ✅ Complete |
| **Public User** | As a user, I can select a year from a dropdown (2025, 2024, etc.) to filter the releases list. | ✅ Complete |
| **Admin User** | As an admin, I can access a hidden data entry form using a secret URL to maintain the integrity of the public tracker. | ✅ Complete |
| **Admin User** | As an admin, I can submit a new movie's details (Title, Director, Studio, Genre, Release Date) via the form. | ✅ Complete |
| **Admin User** | As an admin, the submitted data is **permanently saved** to a database and immediately appears in the public list. | ✅ Complete |

## 🏗️ Architecture Stack (JAMstack on Azure)

This project leverages a modern, serverless architecture for performance, scalability, and cost-efficiency.

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend (The J.A.M.)** | **HTML/CSS/Vanilla JavaScript** | Serves the UI for the public list view and the admin form. Hosted on a global CDN via Azure Static Web Apps for speed. |
| **API (The J.A.M.)** | **Azure Functions (Node.js)** | The serverless backend. Handles business logic (data validation, year filtering) and acts as the secure middleman between the frontend and the database. |
| **Database (The D.)** | **Azure Cosmos DB (NoSQL API)** | A highly available, scalable, serverless database used for persistent storage of all movie release entries. |
| **Deployment** | **Azure Static Web Apps + GitHub Actions** | Automates the entire CI/CD pipeline, building and deploying both the frontend and the API seamlessly upon every push to the `main` branch. |

## ⚙️ Local Development Setup

To run this project locally, ensure you have Node.js, the Azure Functions Core Tools, and VS Code installed.

1.  **Clone the Repository:**
    ```bash
    git clone [your-repo-url]
    cd emic
    ```
2.  **Install Dependencies:**
    ```bash
    cd emic-api
    npm install 
    # Install Cosmos DB SDK
    npm install @azure/cosmos 
    ```
3.  **Configure API Secrets:**
    * Create a file named `local.settings.json` in the `emic-api` folder.
    * Paste your **Azure Cosmos DB Primary Connection String** into the `"CosmosDbConnectionString"` field.
4.  **Run the API:**
    ```bash
    npx func start
    ```
5.  **Run the Frontend:** Open `emic-tracker-fe/index.html` using the VS Code **Live Server** extension.

---
*Created with Gemini AI*