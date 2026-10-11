SafeRoute AI 🌍

DEPLOYED LINK: https://saferoute-wired-in.vercel.app/

PRESENTATION VIDEO LINK: https://drive.google.com/drive/folders/1M4_MOVI5nDY9IDSMED_CVw8Lpemh3GxY?usp=sharing

Disaster-Aware Navigation and Hazard Intelligence Platform

Navigate with awareness. Respond with confidence.

SafeRoute AI is a disaster-aware navigation platform designed to help people make more informed travel decisions during hazardous conditions. It brings route planning, hazard visualization, explainable route-risk assessment, weather information, disaster alerts, and incident reporting into one unified application.

Instead of focusing only on the fastest route, SafeRoute AI aims to help users understand potential dangers along their journey and consider alternative routes when relevant hazard information is available.

«Project category: Artificial Intelligence / Full-Stack Development / Disaster Management / Geospatial Technology»

«Project status: Update this field to accurately describe your current implementation, such as Prototype, MVP, or Deployed Application.»

---

📌 Table of Contents

- "Overview" (#-overview)
- "Problem Statement" (#-problem-statement)
- "Our Solution" (#-our-solution)
- "Objectives" (#-objectives)
- "Key Features" (#-key-features)
- "How It Works" (#-how-it-works)
- "System Architecture" (#-system-architecture)
- "Technology Stack" (#-technology-stack)
- "Project Structure" (#-project-structure)
- "Installation and Setup" (#-installation-and-setup)
- "Environment Configuration" (#-environment-configuration)
- "Running the Application" (#-running-the-application)
- "API Documentation" (#-api-documentation)
- "Risk Assessment Approach" (#-risk-assessment-approach)
- "Data Sources" (#-data-sources)
- "Screenshots and Demo" (#-screenshots-and-demo)
- "Testing" (#-testing)
- "Security Considerations" (#-security-considerations)
- "Limitations" (#-limitations)
- "Future Enhancements" (#-future-enhancements)
- "Use Cases" (#-use-cases)
- "Team" (#-team)
- "Contributing" (#-contributing)
- "License" (#-license)
- "Contact" (#-contact)

---

🌐 Overview

Natural disasters and extreme weather conditions can make ordinary journeys dangerous. Flooded roads, severe rainfall, road closures, and other hazards can change the conditions along a route within a short period.

Conventional navigation applications primarily help users find routes between locations. However, during hazardous conditions, users may also need information about nearby hazards, potential route risks, available alerts, and reported incidents.

SafeRoute AI explores how these capabilities can be combined in a single application.

The platform is designed to provide:

- Route planning and map visualization.
- Visual identification of potential hazard areas.
- Explainable route-risk information.
- Available weather information and disaster alerts.
- Incident reporting and tracking.
- A modular full-stack architecture for future development.

SafeRoute AI is intended to support human decision-making, not replace official emergency instructions or guarantee a safe journey.

🚨 Problem Statement

During floods and other emergencies, a route that appears convenient may pass through a dangerous area.

Several challenges can affect travel safety:

1. Limited hazard visibility: Users may not know about potential hazards along a planned route.
2. Fast-changing conditions: Weather and road conditions can change rapidly.
3. Insufficient risk context: A route may be displayed without explaining the hazards that could affect it.
4. Fragmented information: Navigation, weather updates, disaster alerts, and incident reports may be available through separate services.
5. Incident visibility: Information about a newly encountered road hazard may not be organized or accessible to other users.

These challenges motivate the development of a navigation platform that considers hazard awareness alongside route planning.

💡 Our Solution

SafeRoute AI brings navigation and disaster-related information together in a unified interface.

The platform is designed to help users:

- Enter a starting point and destination.
- View routes on an interactive map.
- Identify potential hazard zones.
- Review the factors contributing to a route-risk assessment.
- Examine available weather information and disaster alerts.
- Submit reports about hazardous conditions.
- Track incident status where supported by the implementation.

The central idea is simple:

A useful navigation system should help users understand potential risks, not merely show them a route.

🎯 Objectives

The main objectives of SafeRoute AI are:

- Improve awareness of potential hazards during travel.
- Support more informed route-selection decisions.
- Make route-risk factors understandable.
- Bring relevant weather and alert information into the navigation workflow.
- Provide a structured process for reporting potential road hazards.
- Maintain transparency about the source, freshness, and reliability of information.
- Build a modular platform that can be extended and evaluated over time.

✨ Key Features

The following describes the intended feature set. Retain a feature as completed only if it is implemented and working in your current version.

1. 🗺️ Interactive Route Planning

Allows users to select a starting location and destination and view available route information on a map.

Purpose:

- Visualize journeys.
- Examine route options.
- Provide a foundation for hazard-aware navigation.

2. 🌊 Hazard Visualization

Displays potential hazard areas on the map when suitable hazard data is available.

Examples may include:

- Flood-prone or reported flooded areas.
- Hazard-related road incidents.
- Other configured disaster-risk zones.

Hazard markers should be interpreted according to their source and update status. A marker alone does not establish that a road is currently unsafe.

3. ⚠️ Explainable Route-Risk Assessment

Presents relevant factors that may affect a route's risk level.

Depending on the implemented logic and available data, factors may include:

- Proximity to a known or reported hazard.
- Reported road conditions.
- Relevant weather information.
- Available disaster alerts.
- The location of hazards relative to route segments.

The goal is to help users understand the reasoning behind an assessment rather than relying only on an unexplained label.

4. 🌦️ Weather Information

Displays available weather information when a compatible data source is configured.

Weather information can help users consider environmental conditions that may affect travel.

The displayed values, source, and update time should be made clear whenever possible.

5. 📢 Disaster Alerts

Provides a place to review available disaster-related alerts from configured sources.

Where supported, alerts should include relevant information such as:

- Alert description.
- Affected area.
- Severity or category.
- Source.
- Publication or update time.

Only verified source information should be described as an official alert.

6. 🆘 Incident Reporting

Allows users to submit details about a potential hazard.

A report may contain:

- Incident category.
- Location.
- Description.
- Supporting image, if supported.

The application should communicate whether a report was successfully saved and whether it has been reviewed.

7. 📍 Incident Status Tracking

Where implemented, incident records can be associated with status updates, for example:

"Reported → Acknowledged → Resolved"

These statuses should reflect actual persisted application records and genuine workflow transitions, not merely an animation or sample display.

8. 🔎 Data Transparency

SafeRoute AI recognizes that disaster-related information can be incomplete or delayed.

The application should distinguish between:

- Live data: Retrieved from a working source with a known update process.
- Cached data: Previously retrieved information that may be outdated.
- Simulated data: Demonstration or test information.
- Unavailable data: Information that could not be retrieved.

This distinction is essential when presenting a disaster-safety application.

⚙️ How It Works

A typical user workflow is:

1. The user opens SafeRoute AI.
2. The user enters a starting point and destination.
3. The application displays available route information.
4. Relevant hazard information is shown on the map when available.
5. The route-risk module evaluates configured risk factors, if implemented.
6. The user reviews the available risk explanations and alternative routes.
7. The user checks relevant weather information or alerts.
8. If a hazard is encountered, the user can submit an incident report where supported.
9. The application displays a confirmation or incident status based on the actual backend response.

The exact workflow depends on the functionality enabled in the submitted version.

🏗️ System Architecture

The intended architecture separates the user interface, backend services, risk-assessment logic, and persistent data storage.

                 ┌────────────────────────┐
                 │          User          │
                 └────────────┬───────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │   React + TypeScript   │
                 │       Frontend         │
                 └────────────┬───────────┘
                              │
                         HTTP / API
                              │
                              ▼
                 ┌────────────────────────┐
                 │      FastAPI API       │
                 │    Request Handling    │
                 └────────────┬───────────┘
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
       ┌──────────────────┐     ┌──────────────────┐
       │ Route and Hazard │     │ Incident Report  │
       │ Risk Assessment  │     │ Workflow         │
       └─────────┬────────┘     └─────────┬────────┘
                 │                        │
                 └────────────┬───────────┘
                              ▼
                 ┌────────────────────────┐
                 │ PostgreSQL + PostGIS   │
                 │ Persistent Geospatial  │
                 │ Data, if configured    │
                 └────────────────────────┘

External services, such as mapping, weather, or alert providers, may connect to the application where implemented and configured.

Note: This diagram represents the intended architecture. Modify it to match the actual services and connections in your repository.

🛠️ Technology Stack

The project design uses the following technologies. Keep only those present in your implementation.

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Leaflet

Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy

Database and Geospatial Processing

- PostgreSQL
- PostGIS

Development Tools

- Git
- GitHub
- Visual Studio Code
- Browser developer tools

External Integrations

List only the mapping, weather, alert, routing, or geocoding services that are actually connected to your application.

📁 Project Structure

A possible structure for a full-stack version is shown below. Replace this example with your actual repository tree.

saferoute-ai/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── index.html
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   └── requirements.txt
│
├── docs/
│   └── screenshots/
│
├── .env.example
├── .gitignore
├── README.md
└── LICENSE

Do not create empty folders solely to match this diagram. Document the actual files in your repository.

💻 Installation and Setup

Follow the instructions below after adapting the paths and commands to your project.

Prerequisites

Depending on the components you use, you may need:

- Git.
- Node.js and npm.
- A compatible Python installation.
- PostgreSQL with PostGIS, if required by your backend.
- API credentials for any external service that requires them.

Step 1: Clone the repository

Replace "YOUR-USERNAME" with your GitHub username.

git clone https://github.com/YOUR-USERNAME/saferoute-ai.git
cd saferoute-ai

Step 2: Install frontend dependencies

If the frontend is inside the "frontend" directory:

cd frontend
npm install

Step 3: Start the frontend development server

npm run dev

Open the local URL printed in the terminal.

For a typical Vite application, the URL is often "http://localhost:5173", but use the address shown by your own terminal.

Step 4: Set up the backend

Open another terminal at the repository root.

Create a virtual environment:

Windows PowerShell

py -m venv .venv
.\.venv\Scripts\Activate.ps1

macOS / Linux

python3 -m venv .venv
source .venv/bin/activate

Install backend dependencies:

pip install -r backend/requirements.txt

If your requirements file is in another location, update the command accordingly.

Step 5: Start the backend

If the FastAPI application entry point is "backend.app.main:app", run:

uvicorn backend.app.main:app --reload

This is an example command. The import path must match the actual location of your FastAPI "app" object.

If your application uses a different entry point, follow the instructions in your code or deployment configuration.

🔐 Environment Configuration

Some deployments require environment variables for database connections, API keys, and service configuration.

Create a local ".env" file using the variable names expected by your code.

For example:

DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/saferoute
WEATHER_API_KEY=replace_with_your_own_key

These are illustrative placeholders, not guaranteed variable names for your application.

Security rules

- Never commit actual API keys or database passwords.
- Add ".env" to ".gitignore".
- Commit an ".env.example" with safe placeholder values.
- Do not publish private user information or production credentials.
- If a credential was accidentally committed, revoke or rotate it and remove it from the repository history where necessary.

▶️ Running the Application

The frontend and backend may need to run separately during local development.

Typical workflow:

1. Start the required database, if applicable.
2. Start the backend API.
3. Start the frontend development server.
4. Configure the frontend to use the correct backend URL.
5. Open the frontend in a browser.
6. Test route planning, hazard visualization, and other implemented features.

If the application uses a deployed backend or a different development workflow, document that process instead.

📡 API Documentation

If your project uses FastAPI, its interactive API documentation is commonly available at:

http://localhost:8000/docs

The alternative documentation interface may be available at:

http://localhost:8000/redoc

These endpoints are available only when the backend is running with the corresponding documentation enabled.

Document your actual API endpoints here, for example:

Method| Example endpoint| Purpose
GET| "/health"| Health check, if implemented
POST| "/routes"| Route planning, if implemented
GET| "/hazards"| Retrieve hazards, if implemented
POST| "/incidents"| Submit an incident, if implemented
GET| "/incidents/{id}"| Retrieve an incident, if implemented
PATCH| "/incidents/{id}"| Update incident status, if implemented

Important: The table contains example endpoint names only. Replace them with the real endpoints exposed by your backend. Do not document routes that do not exist.

🧮 Route-Risk Assessment Approach

SafeRoute AI is designed to make route-risk information more understandable.

A route assessment may consider factors such as:

- The proximity of route segments to known hazards.
- Reported road conditions.
- Available weather information.
- Relevant disaster alerts.
- The quality and freshness of the underlying data.

The implementation should explain which factors it actually uses and how they influence the result.

If a deterministic scoring system is used, document its rules and thresholds. If a trained machine-learning model is used, document its training data, evaluation methodology, limitations, and measured performance.

Do not describe a rule-based scoring system as a trained AI model unless a genuine trained model is implemented.

A risk assessment is an estimate based on available information. It is not a guarantee that a route is safe.

🌦️ Data Sources

Document every external or internal data source used by your actual application.

Data category| What to document
Map data| Provider, attribution, and usage requirements
Route data| Routing provider or implemented route-generation method
Weather| Provider, update frequency, and API requirements
Disaster alerts| Official source, geographic coverage, and update frequency
Hazard reports| User-submitted, official, imported, or demonstration data
Geospatial database| Database configuration and update process

Where relevant, record when the information was retrieved and whether it is live, cached, simulated, or unavailable.

Never label simulated data as a real-time government warning or a verified road condition.

🖼️ Screenshots and Demo

Screenshots make the repository easier for hackathon judges, developers, and recruiters to review.

Suggested screenshots:

1. Main dashboard.
2. Route-planning interface.
3. Hazard map.
4. Route-risk explanation.
5. Weather and alerts panel.
6. Incident-reporting interface.
7. Technical architecture.

Store the image files in your repository, for example:

docs/screenshots/dashboard.png
docs/screenshots/route-planning.png
docs/screenshots/hazard-map.png

Embed a screenshot in this README using:

![SafeRoute AI dashboard](docs/screenshots/dashboard.png)

Replace the example path with the real image path.

Live application: Add your deployed website URL here.

Project demonstration video: Add your public video URL here.

Presentation slides: Add a link if the slides are publicly accessible.

🧪 Testing

Testing should verify the behavior of the actual implementation.

Suggested checks include:

- Frontend builds successfully.
- Backend starts without errors.
- API validation handles invalid inputs.
- Route requests handle missing or invalid locations.
- Hazard information is displayed correctly.
- Risk assessments behave as expected for test cases.
- Incident reports are saved and retrieved if persistence is implemented.
- Status changes are persisted if incident tracking is implemented.
- Missing or unavailable external data is handled gracefully.
- Sensitive configuration values are not exposed to the frontend or repository.

Add the commands used by your actual test setup, such as:

npm run build

For a Python test suite using pytest:

pytest

These commands work only if the corresponding scripts and dependencies are configured. Do not claim tests passed unless you have run them and verified the results.

🔒 Security Considerations

SafeRoute AI may handle location information and incident reports, so responsible handling of data is important.

Recommended practices include:

- Keep secrets in environment variables.
- Validate and sanitize incoming API requests.
- Apply appropriate access controls to protected operations.
- Avoid collecting unnecessary personal information.
- Avoid exposing sensitive incident details publicly.
- Use HTTPS in production deployments.
- Apply rate limiting and abuse protection where appropriate.
- Handle API failures without leaking internal errors or credentials.
- Follow the privacy and usage requirements of external data providers.

These are recommendations; list only protections that have actually been implemented as completed security features.
