# TransitSync: Relational Database Schema & Data Dictionary

## 1. Entity-Relationship Overview

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned to"
    USERS ||--o{ BOOKINGS : "places"
    COACH_TYPES ||--o{ BUSES : "categorizes"
    BUSES ||--o{ SEAT_LAYOUTS : "has"
    BUSES ||--o{ TRIPS : "assigned to"
    BUSES ||--o{ MAINTENANCE_RECORDS : "undergoes"
    DRIVERS ||--o{ TRIPS : "operates"
    ROUTES ||--o{ TRIPS : "defines path"
    TRIPS ||--o{ BOOKINGS : "booked under"
    TRIPS ||--o{ BOOKING_SEATS : "reserves"
    BOOKINGS ||--o{ BOOKING_SEATS : "contains"
    BOOKINGS ||--o{ PAYMENTS : "paid via"
    BOOKINGS ||--o{ REFUNDS : "refunded via"

    USERS {
        bigint id PK
        string email UK
        string password_hash
        string full_name
        string phone
        string status
        datetime lockout_until
    }

    BUSES {
        bigint id PK
        string registration_number UK
        bigint coach_type_id FK
        string model_name
        int total_capacity
        string status
    }

    SEAT_LAYOUTS {
        bigint id PK
        bigint bus_id FK
        string deck
        int row_num
        int col_num
        string seat_number
        string seat_type
    }

    TRIPS {
        bigint id PK
        bigint route_id FK
        bigint bus_id FK
        bigint driver_id FK
        datetime departure_time
        datetime arrival_time
        decimal base_fare
        string status
    }

    BOOKINGS {
        bigint id PK
        string pnr UK
        bigint user_id FK
        bigint trip_id FK
        decimal total_amount
        string status
    }

    BOOKING_SEATS {
        bigint id PK
        bigint booking_id FK
        bigint trip_id FK
        string seat_number
        decimal fare
        string status
    }
```

## 2. Table Specifications & Constraints

### `roles`
- `id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `name`: VARCHAR(50) NOT NULL UNIQUE (`ROLE_CUSTOMER`, `ROLE_ADMIN`)

### `users`
- `id`: BIGINT AUTO_INCREMENT PRIMARY KEY
- `email`: VARCHAR(120) NOT NULL UNIQUE
- `password_hash`: VARCHAR(255) NOT NULL (BCrypt hashed)
- `full_name`: VARCHAR(100) NOT NULL
- `phone`: VARCHAR(20)
- `role_id`: BIGINT NOT NULL (FK -> `roles.id`)
- `status`: VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' (`ACTIVE`, `INACTIVE`)
- `failed_login_attempts`: INT NOT NULL DEFAULT 0
- `lockout_until`: DATETIME NULL (Rate-limiting lockout)

### `buses` & `seat_layouts`
- `buses.registration_number`: Unique registration license plate
- `buses.status`: `ACTIVE`, `IN_MAINTENANCE`, `RETIRED`
- `seat_layouts`: Unique composite constraint `(bus_id, seat_number)` ensures no duplicates on a bus.

### `booking_seats` (Double-Booking Prevention)
- `trip_id`: BIGINT NOT NULL (FK -> `trips.id`)
- `seat_number`: VARCHAR(10) NOT NULL (e.g. 1A, L1, U1)
- `status`: VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' (`ACTIVE`, `CANCELLED`)
- **Unique Constraint**: `uq_active_trip_seat` on `(trip_id, seat_number, status)`. Ensures two active bookings cannot share the same physical seat for a given trip.
