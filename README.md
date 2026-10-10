# TransitSync: Intercity Bus Fleet & Ticket Management System

TransitSync is an enterprise-grade full-stack bus fleet management and passenger reservation system built using **Spring Boot 3.3.4 (Java 21)**, **React 18 + Vite**, and **MySQL 8.0**.

---

## Key Features

### 1. Dual Independent Portals
- **Customer Experience (`/` & `/login`)**:
  - Live bus trip search by origin, destination, and travel date
  - Interactive 2D Seat Map with real seat numbers (e.g., `1A`, `L1`, `U1`), lower/upper deck views, driver position, and live status legend
  - Real-time price breakdown (base fare, dynamic taxes, fixed service fee)
  - Instant PNR generation and print-ready electronic ticket
  - Customer booking history and self-service cancellation with automatic refund policy calculation
- **Admin Console (`/admin/login` & `/admin/dashboard`)**:
  - Dedicated operations interface with dark sidebar theme
  - Real-time operational metrics (total fleet, buses in maintenance, upcoming trips, 30-day revenue, trip occupancy rates)
  - Fleet CRUD (coach types, buses, amenities, auto-layout generator, soft archiving)
  - Routes and certified driver management
  - Trip scheduling with strict overlap collision detection for buses and drivers
  - Complete booking oversight with on-behalf cancellation and refund management
  - Vehicle maintenance scheduling and cost tracking
  - Customer and administrator user management with last-admin protection
  - Dynamic system policy configuration (tax percentages, fees, refund tiers)
  - CSV report export of passenger bookings

### 2. High-Integrity Architecture & Security
- **Impossibility of Double-Booking**: Composite unique constraints (`trip_id`, `seat_number`, `status`) and `@Transactional(isolation = Isolation.REPEATABLE_READ)`.
- **Stateless JWT Security**: BCrypt password hashing, role-based authorization (`ROLE_CUSTOMER`, `ROLE_ADMIN`), rate limiting / account lockout after repeated failures.
- **Strict Data Ownership**: Customer APIs enforce data isolation; customers cannot access or guess another customer's booking IDs.
- **Flyway Database Versioning**: Automated schema migrations on MySQL 8.0.

---

## Project Structure

```
TransitSync/
├── backend/                  # Spring Boot 3.3.4 Application
│   ├── src/main/java/        # Layered architecture (controller, service, repository, entity, dto)
│   ├── src/main/resources/   # application.yml and db/migration/V1__init_schema.sql
│   ├── src/test/             # Automated test suite (H2 isolated tests)
│   ├── Dockerfile            # Multi-stage production container build
│   └── pom.xml               # Maven configuration
├── frontend/                 # React 18 + Vite SPA
│   ├── src/components/       # CustomerNavbar, AdminLayout, ProtectedRoutes
│   ├── src/context/          # AuthContext with session management
│   ├── src/pages/customer/   # Search, Seat Map, Booking, Ticket, History
│   ├── src/pages/admin/      # Dashboard, Fleet, Routes, Trips, Bookings, Settings
│   └── src/services/api.js   # Axios client with JWT interceptors
├── docs/                     # Architecture & database documentation
│   ├── database-schema.md    # Mermaid ER Diagram & data dictionary
│   └── business-rules.md     # Fare, refund formulas & sequence diagrams
├── README.md                 # Project overview and instructions
├── README_DEPLOYMENT.md      # Cloud deployment guidelines (Render, Vercel, Aiven)
├── README_VIVA.md            # Technical viva voce defense Q&A (25 questions)
├── .env.example              # Environment variables template
└── .gitignore                # Clean exclusions for secrets and artifacts
```

---

## Prerequisites
- Java Development Kit (JDK) 17 or 21
- Apache Maven 3.8+
- Node.js 18+ and npm
- MySQL Server 8.0

---

## Getting Started Locally

### 1. Database Setup
Ensure MySQL is running on port 3306 and create the database:
```sql
CREATE DATABASE IF NOT EXISTS transitsync_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend Setup
1. Open terminal in `backend/`:
   ```bash
   cd backend
   ```
2. Run backend tests:
   ```bash
   mvn test
   ```
3. Run the Spring Boot application:
   ```bash
   mvn spring-boot:run
   ```
   *(Or run the packaged JAR: `java -jar target/transitsync-backend-1.0.0.jar`)*
4. Backend will start at `http://localhost:8080`.
   - Health check: `http://localhost:8080/actuator/health`
   - Swagger OpenAPI: `http://localhost:8080/swagger-ui.html`
   - Default bootstrap admin: `admin@transitsync.com` / `Admin@Transit2026!`

### 3. Frontend Setup
1. Open a new terminal in `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Access the application in your browser:
   - **Customer Portal**: `http://localhost:5173`
   - **Admin Portal**: `http://localhost:5173/admin/login`

---

## Verification & End-to-End Workflow
1. Navigate to `http://localhost:5173/admin/login` and log in with the administrator credentials.
2. In Fleet Management, register a new bus (seat layout generates automatically).
3. In Routes & Drivers, define an origin/destination pair and register a driver.
4. In Trips & Schedules, dispatch a trip for your route.
5. Log out, go to `http://localhost:5173/`, search for your route and date.
6. Click **Select Seats**, view the bus layout with seat numbers, pick your seat, enter passenger details, and confirm the booking.
7. View and print the confirmed ticket with unique PNR.
