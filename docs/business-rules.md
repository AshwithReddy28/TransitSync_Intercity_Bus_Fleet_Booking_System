# TransitSync: Business Logic & Rules Engine

## 1. Fare Calculation Formula

All monetary calculations are performed strictly on the backend to prevent client-side price tampering.

$$\text{Base Total} = N_{\text{seats}} \times \text{Base Fare}$$

$$\text{Tax Amount} = \frac{\text{Base Total} \times \text{Tax Rate \%}}{100}$$

$$\text{Grand Total} = \text{Base Total} + \text{Tax Amount} + \text{Fixed Service Fee}$$

### Example:
- Selected: 2 Seats (L1, L2)
- Base Fare: ₹950.00
- Tax Rate: 5% (configured in `system_settings`)
- Service Fee: ₹25.00 (configured in `system_settings`)
- $\text{Base Total} = 2 \times 950 = \text{₹}1900.00$
- $\text{Tax Amount} = \frac{1900 \times 5}{100} = \text{₹}95.00$
- $\text{Grand Total} = 1900.00 + 95.00 + 25.00 = \text{₹}2020.00$

---

## 2. Dynamic Refund Policy

When a customer or administrator cancels a booking, the refund percentage is dynamically calculated based on the hours remaining until departure:

| Hours Remaining ($H$) | Refund Percentage | Formula Applied |
| :--- | :--- | :--- |
| $H \ge 24$ hours | **90%** of total amount | $\text{Refund} = \text{Total} \times 0.90$ |
| $12 \le H < 24$ hours | **50%** of total amount | $\text{Refund} = \text{Total} \times 0.50$ |
| $H < 12$ hours | **0%** (Non-refundable) | $\text{Refund} = \text{₹}0.00$ |

All tiers and percentages are loaded dynamically from the `system_settings` table and can be tuned by administrators in the settings panel without redeployment.

---

## 3. Double-Booking Prevention Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Customer A
    actor Customer B
    participant Controller as PublicAndCustomerController
    participant Service as BookingService
    participant DB as MySQL Database

    Note over Customer A,Customer B: Both select Seat 1A simultaneously
    Customer A->>Controller: POST /api/v1/bookings (Seat 1A)
    Customer B->>Controller: POST /api/v1/bookings (Seat 1A)
    Controller->>Service: createBooking(@Transactional Isolation.REPEATABLE_READ)
    Service->>DB: Check conflicting active seats
    Note over DB: Customer A transaction commits first
    DB-->>Service: Inserts BookingSeat (Trip 1, Seat 1A, Status ACTIVE)
    Service-->>Customer A: 201 Created (PNR Generated)
    Note over DB: Customer B transaction attempts insert
    DB-->>Service: Constraint uq_active_trip_seat VIOLATION
    Service-->>Controller: ConflictException ("Seat 1A is already booked")
    Controller-->>Customer B: 409 Conflict + Error Message
```
