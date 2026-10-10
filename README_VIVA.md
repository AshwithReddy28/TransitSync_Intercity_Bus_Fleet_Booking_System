# TransitSync: Viva Voce & Technical Defense Preparation

This document prepares 3rd-year engineering students for the technical viva voce on Full Stack Java development, Spring Boot, JPA, React, MySQL, and Distributed Architecture.

---

### Q1: What is the high-level architecture of TransitSync?
**Answer**: TransitSync follows a modern decoupled 3-tier architecture:
- **Presentation Tier**: React (Vite) Single Page Application styled with responsive CSS modules and Axios client communicating over REST.
- **Application Tier**: Spring Boot 3.x with layered architecture (Controller $\rightarrow$ Service $\rightarrow$ Repository $\rightarrow$ Entities $\rightarrow$ DTOs) and Spring Security with Stateless JWT.
- **Data Tier**: Relational MySQL 8.0 schema managed with Flyway migrations.

### Q2: How does TransitSync enforce strict separation between Customer and Admin portals?
**Answer**: Separation is enforced at both the API and database levels. Customers self-register and authenticate via `/api/v1/auth/customer/login`, while Administrators authenticate via `/api/v1/auth/admin/login`. Non-admins calling admin endpoints are rejected with `403 Forbidden` via `@PreAuthorize("hasAuthority('ROLE_ADMIN')")`. Customers attempting admin logins are rejected immediately.

### Q3: How is double-booking prevented in a concurrent environment?
**Answer**: Double booking is rendered impossible through a two-layer defense:
1. **Database Constraint**: A composite unique constraint `uq_active_trip_seat` on `(trip_id, seat_number, status)`.
2. **Transaction Isolation**: Booking creation runs within `@Transactional(isolation = Isolation.REPEATABLE_READ)`, pre-checking existing active seats before writing. If two concurrent requests attempt to reserve the same seat, one commits and the second receives a `DataIntegrityViolationException`, mapped to `409 Conflict`.

### Q4: Why are DTOs used instead of exposing JPA entities directly?
**Answer**:
1. **Security**: Entities contain sensitive attributes like password hashes and failed login counters that must never leak to clients.
2. **Decoupling**: Decouples API contracts from underlying table structures.
3. **Serialization Loops**: Avoids infinite recursion caused by bidirectional JPA relationships (`@OneToMany` and `@ManyToOne`).

### Q5: How is rate limiting / account lockout implemented?
**Answer**: In `User.java`, failed login attempts are tracked (`failedLoginAttempts`). Upon 5 consecutive failed attempts, `lockoutUntil` is set 15 minutes into the future. Further attempts before expiration return `403 Forbidden` without querying password hashes.

### Q6: How does Flyway migration work?
**Answer**: Flyway maintains a `flyway_schema_history` table in MySQL. On application startup, it detects new versioned SQL scripts (e.g. `V1__init_schema.sql`) and applies them sequentially, guaranteeing repeatable environments across development, staging, and production.

### Q7: Why are BigDecimal types used for currency instead of double or float?
**Answer**: `double` and `float` use binary IEEE 754 floating-point arithmetic which causes imprecise representation (e.g., $0.1 + 0.2 \ne 0.3$). `BigDecimal` provides exact decimal representation essential for financial and fare calculations.

### Q8: What does JWT contain, and how is it validated?
**Answer**: A JSON Web Token contains three parts: Header, Payload (claims: `userId`, `role`, `fullName`, `exp`), and a cryptographic Signature (`HMAC-SHA256`). On each request, `JwtAuthenticationFilter` validates the signature using the private secret key without needing database roundtrips.

### Q9: How are overlapping trips prevented for buses and drivers?
**Answer**: During trip creation, `TripRepository.findConflictingTripsForBus` and `findConflictingTripsForDriver` execute JPQL queries checking if any non-cancelled trip overlaps the proposed departure-to-arrival time window: `(departure <= :newArrival AND arrival >= :newDeparture)`.

### Q10: How does the dynamic refund engine calculate cancellation refunds?
**Answer**: It calculates the difference between current time and scheduled trip departure. If $\ge 24$ hours remain, 90% is refunded; if between 12 and 24 hours, 50% is refunded; under 12 hours, 0% is refunded. Percentages are dynamically fetched from the `system_settings` table.

### Q11: What is idempotency, and how is it used in bookings?
**Answer**: Idempotency ensures that making the same request multiple times produces the same result without duplicate side-effects. The client generates a unique `idempotencyKey`; if a network timeout causes a retry, the backend detects the existing key and returns the original booking instead of creating a second charge.

### Q12: How is the Last-Admin protection implemented?
**Answer**: In `AdminManagementService.toggleUserStatus`, before deactivating an admin account, the system queries `countByRoleNameAndStatus("ROLE_ADMIN", "ACTIVE")`. If the count is $\le 1$, the request is rejected to prevent locking out the administrative console.

### Q13: What is Spring Data JPA?
**Answer**: A framework that significantly reduces boilerplate data access code by providing interface-based repositories (`JpaRepository`) with built-in CRUD operations, paging, sorting, and dynamic query derivation from method names.

### Q14: What is the purpose of Spring WebMvc `@RestControllerAdvice`?
**Answer**: It intercepts exceptions thrown across all `@RestController` classes globally, transforming errors into standardized JSON responses (`ErrorResponse`) with appropriate HTTP status codes (400, 401, 403, 404, 409, 500).

### Q15: How are seat numbers displayed and styled on the interactive seat map?
**Answer**: Each seat layout entry specifies deck (`LOWER`/`UPPER`), row, column, and unique seat number (e.g. `1A`, `L1`). The frontend maps this into a CSS Grid resembling a bus interior, displaying the seat number directly on each seat tile with real-time status color coding.

### Q16: What happens when an active bus is marked for maintenance?
**Answer**: `FleetService.updateBus` checks if there are upcoming scheduled trips assigned to that bus. If future trips exist, the system blocks the status change or warns the admin to reassign those trips before maintenance begins.

### Q17: Why is Spring Security configured as STATELESS?
**Answer**: `SessionCreationPolicy.STATELESS` ensures Spring Security does not store HTTP sessions in memory. This enables horizontal scaling across multiple application instances behind a load balancer because any server can validate the request using the self-contained JWT.

### Q18: What is CORS and how is it configured in this project?
**Answer**: Cross-Origin Resource Sharing (CORS) is a browser security mechanism that restricts HTTP requests from other origins. In `SecurityConfig`, explicit origins (`http://localhost:5173`, etc.) and HTTP methods (`GET`, `POST`, `PUT`, `DELETE`) are allowed via `CorsConfigurationSource`.

### Q19: How is soft deletion / archiving handled for buses?
**Answer**: Instead of hard-deleting records that have historical foreign key associations in `trips` and `bookings`, the bus status is updated to `RETIRED`, keeping referential integrity intact.

### Q20: What is Bean Validation in Spring Boot?
**Answer**: Standardized validation using annotations (`@NotBlank`, `@Email`, `@Size`, `@Min`) evaluated before controller execution via `@Valid`. If constraints fail, a `MethodArgumentNotValidException` is caught and returned with field-specific messages.

### Q21: What is the purpose of the `@CreationTimestamp` and `@UpdateTimestamp` annotations?
**Answer**: Hibernate automatically populates the `createdAt` and `updatedAt` audit timestamps upon entity insertion and update without manual timestamp assignment.

### Q22: What role does Lucide React play in the frontend?
**Answer**: Lucide React provides modern, lightweight, tree-shakeable SVG icons representing vehicles, steering wheels, badges, seats, and navigation tools.

### Q23: How does React Router protect customer and admin routes?
**Answer**: Through wrapper components `CustomerRoute` and `AdminRoute`. They inspect the user and role from `AuthContext`. If unauthenticated or possessing the wrong role, they redirect the user via `<Navigate to="..." replace />`.

### Q24: What is the purpose of Spring Boot Actuator?
**Answer**: Provides production-ready monitoring endpoints (`/actuator/health`, `/actuator/info`) to check system readiness, database connectivity, and uptime metrics.

### Q25: How does the Admin Dashboard ensure real live data without fake numbers?
**Answer**: The backend queries `PaymentRepository.sumRevenueBetween`, counts active scheduled trips, calculates actual seat fill ratios per bus, and queries pending vehicle maintenance logs. If the database is empty, the dashboard cleanly displays zeros and friendly empty states.
