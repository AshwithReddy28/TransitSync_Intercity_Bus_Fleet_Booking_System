package com.transitsync;

import com.transitsync.dto.*;
import com.transitsync.entity.Role;
import com.transitsync.entity.User;
import com.transitsync.exception.ConflictException;
import com.transitsync.repository.RoleRepository;
import com.transitsync.repository.UserRepository;
import com.transitsync.service.BookingService;
import com.transitsync.service.DriverAndRouteService;
import com.transitsync.service.FleetService;
import com.transitsync.service.TripService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BookingAndCollisionTests {

    @Autowired
    private FleetService fleetService;

    @Autowired
    private DriverAndRouteService driverAndRouteService;

    @Autowired
    private TripService tripService;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Test
    @DisplayName("Verify duplicate booking on same seat is strictly rejected (Double Booking Prevention)")
    void testDoubleBookingPrevention() {
        // 1. Create Coach Type & Bus
        CoachTypeDto coach = new CoachTypeDto();
        coach.setName("Multi-axle Volvo");
        coach.setCode("VOLVO_AC_TEST");
        coach.setDecks(1);
        coach.setHasAc(true);
        CoachTypeDto savedCoach = fleetService.createCoachType(coach);

        BusDto bus = new BusDto();
        bus.setRegistrationNumber("TS09-ZZ-9999");
        bus.setCoachTypeId(savedCoach.getId());
        bus.setTotalCapacity(20);
        bus.setModelName("Volvo 9600");
        BusDto savedBus = fleetService.createBus(bus);

        // 2. Create Driver & Route
        DriverDto driver = new DriverDto();
        driver.setName("Rajesh Sharma");
        driver.setLicenseNumber("DL-9999-TEST");
        driver.setPhone("+91 9123456789");
        DriverDto savedDriver = driverAndRouteService.createDriver(driver);

        RouteDto route = new RouteDto();
        route.setOrigin("TestOrigin");
        route.setDestination("TestDestination");
        route.setDistanceKm(new BigDecimal("570.0"));
        route.setEstimatedDurationMinutes(540);
        RouteDto savedRoute = driverAndRouteService.createRoute(route);

        // 3. Create Trip
        TripDto trip = new TripDto();
        trip.setRouteId(savedRoute.getId());
        trip.setBusId(savedBus.getId());
        trip.setDriverId(savedDriver.getId());
        trip.setDepartureTime(LocalDateTime.now().plusDays(2));
        trip.setArrivalTime(LocalDateTime.now().plusDays(2).plusHours(9));
        trip.setBaseFare(new BigDecimal("1200.00"));
        TripDto savedTrip = tripService.createTrip(trip);

        // 4. Create two users
        Role customerRole = roleRepository.findByName("ROLE_CUSTOMER").orElseThrow();
        User u1 = userRepository.save(User.builder().email("user1@test.com").fullName("User 1").passwordHash("x").role(customerRole).build());
        User u2 = userRepository.save(User.builder().email("user2@test.com").fullName("User 2").passwordHash("x").role(customerRole).build());

        // 5. User 1 books seat "1A"
        PassengerDetailDto p1 = new PassengerDetailDto();
        p1.setSeatNumber("1A");
        p1.setPassengerName("Passenger One");
        p1.setPassengerAge(28);
        p1.setPassengerGender("MALE");

        BookingRequest req1 = new BookingRequest();
        req1.setTripId(savedTrip.getId());
        req1.setPassengers(Collections.singletonList(p1));
        req1.setPaymentMethod("UPI");

        BookingDto b1 = bookingService.createBooking(u1.getId(), req1);
        assertNotNull(b1.getPnr());
        assertEquals("CONFIRMED", b1.getStatus());

        // 6. User 2 attempts to book the EXACT SAME seat "1A" -> Expect ConflictException
        PassengerDetailDto p2 = new PassengerDetailDto();
        p2.setSeatNumber("1A");
        p2.setPassengerName("Passenger Two");
        p2.setPassengerAge(32);
        p2.setPassengerGender("FEMALE");

        BookingRequest req2 = new BookingRequest();
        req2.setTripId(savedTrip.getId());
        req2.setPassengers(Collections.singletonList(p2));

        assertThrows(ConflictException.class, () -> bookingService.createBooking(u2.getId(), req2));
    }
}
