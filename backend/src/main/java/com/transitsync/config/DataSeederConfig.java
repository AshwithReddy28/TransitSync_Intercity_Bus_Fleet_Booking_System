package com.transitsync.config;

import com.transitsync.dto.*;
import com.transitsync.service.DriverAndRouteService;
import com.transitsync.service.FleetService;
import com.transitsync.service.TripService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Component
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class DataSeederConfig implements CommandLineRunner {

    private final FleetService fleetService;
    private final DriverAndRouteService driverAndRouteService;
    private final TripService tripService;

    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    @Override
    public void run(String... args) {
        if (!seedEnabled) return;

        try {
            // 1. Seed Coach Types (Standard RedBus categories)
            CoachTypeDto sleeperAc = ensureCoachType("AC Sleeper (2+1)", "AC_SLEEPER_2_1", 2, true, "Premium Air Suspended AC Sleeper with reading lamps and charging");
            CoachTypeDto semiSleeperAc = ensureCoachType("Volvo Multi-Axle AC Semi-Sleeper", "VOLVO_SEMI_SLEEPER", 1, true, "Volvo B11R Luxury Multi-Axle Semi-Sleeper (2+2)");
            CoachTypeDto nonAcSeater = ensureCoachType("Non-AC Seater (2+2)", "NON_AC_SEATER", 1, false, "Economical Intercity Express Seater");
            CoachTypeDto scaniaAc = ensureCoachType("Scania AC Multi-Axle Sleeper", "SCANIA_AC_SLEEPER", 2, true, "Ultra Luxury Scania Metrolink Multi-Axle");

            // 2. Seed Buses with Real RedBus-style Operators and Models
            BusDto bus1 = ensureBus("TS-09-UB-1001", sleeperAc.getId(), "IntrCity SmartBus - BharatBenz Luxury Sleeper", 30, "WiFi, Blanket, Water Bottle, USB Charging, Emergency Button");
            BusDto bus2 = ensureBus("KA-01-EQ-2002", semiSleeperAc.getId(), "FlixBus - Volvo B11R Multi-Axle", 40, "Live Tracking, Charging Ports, Pushback Seats, Fire Extinguisher");
            BusDto bus3 = ensureBus("AP-28-TX-3003", nonAcSeater.getId(), "Orange Travels - Ashok Leyland Seater", 36, "Reading Lamp, First Aid Kit, Audio System");
            BusDto bus4 = ensureBus("MH-12-RN-4004", scaniaAc.getId(), "Zingbus Plus - Scania Metrolink HD", 30, "WiFi, Reclining Berth, Charging, Mineral Water");
            BusDto bus5 = ensureBus("TS-07-ZZ-5005", semiSleeperAc.getId(), "VRL Travels - Mercedes-Benz Multi-Axle", 42, "High Speed AC, Legrest, Entertainment Screen");
            BusDto bus6 = ensureBus("TS-02-AB-6006", sleeperAc.getId(), "FreshBus - Electric AC Sleeper", 30, "Eco Friendly, 4K Screen, USB-C, Clean Air");
            BusDto bus7 = ensureBus("TS-01-KN-7007", semiSleeperAc.getId(), "TSRTC Super Luxury - Volvo", 40, "Pushback Seats, Air Suspension, Emergency Exit");
            BusDto bus8 = ensureBus("DL-01-DL-8008", sleeperAc.getId(), "Pramukh Travels - Volvo 9600 Multi-Axle", 30, "Business Class, Individual LCD, Snacks");

            // 3. Seed Drivers
            DriverDto d1 = ensureDriver("Ramesh Rao", "DL-TS-2018-00123", "+91 9848011223");
            DriverDto d2 = ensureDriver("Suresh Gowda", "DL-KA-2017-00456", "+91 9900112244");
            DriverDto d3 = ensureDriver("Anand Deshmukh", "DL-MH-2019-00789", "+91 9822334455");
            DriverDto d4 = ensureDriver("Venkat Reddy", "DL-AP-2016-00999", "+91 9701122334");
            DriverDto d5 = ensureDriver("Satyanarayana G", "DL-TS-2015-00441", "+91 9440112233");

            // 4. Seed Popular Intercity Routes (including Karimnagar, Adilabad, Delhi, Bus Stops)
            RouteDto rHydBlr = ensureRoute("Hyderabad", "Bengaluru", new BigDecimal("570.00"), 540);
            RouteDto rBlrHyd = ensureRoute("Bengaluru", "Hyderabad", new BigDecimal("570.00"), 540);
            RouteDto rHydChn = ensureRoute("Hyderabad", "Chennai", new BigDecimal("630.00"), 600);
            RouteDto rBlrChn = ensureRoute("Bengaluru", "Chennai", new BigDecimal("345.00"), 360);
            RouteDto rMumPun = ensureRoute("Mumbai", "Pune", new BigDecimal("150.00"), 180);
            RouteDto rHydVja = ensureRoute("Hyderabad", "Vijayawada", new BigDecimal("275.00"), 300);
            RouteDto rBlrGoa = ensureRoute("Bengaluru", "Goa", new BigDecimal("560.00"), 660);
            RouteDto rHydKn = ensureRoute("Hyderabad", "Karimnagar", new BigDecimal("164.00"), 180);
            RouteDto rKnHyd = ensureRoute("Karimnagar", "Hyderabad", new BigDecimal("164.00"), 180);
            RouteDto rHydAdil = ensureRoute("Hyderabad", "Adilabad", new BigDecimal("305.00"), 360);
            RouteDto rDelHyd = ensureRoute("Delhi", "Hyderabad", new BigDecimal("1550.00"), 1320);

            // 5. Seed Real Schedule Trips (Today, Tomorrow, and Next 3 days)
            LocalDate today = LocalDate.now();
            for (int dayOffset = 0; dayOffset <= 4; dayOffset++) {
                LocalDate tripDate = today.plusDays(dayOffset);
                
                // Hyd -> Blr Night Sleeper (IntrCity SmartBus)
                ensureTrip(rHydBlr.getId(), bus1.getId(), d1.getId(), 
                        tripDate.atTime(21, 30), tripDate.plusDays(1).atTime(6, 30), new BigDecimal("1250.00"));

                // Hyd -> Blr Evening Semi-Sleeper (FlixBus)
                ensureTrip(rHydBlr.getId(), bus2.getId(), d2.getId(), 
                        tripDate.atTime(18, 00), tripDate.plusDays(1).atTime(3, 00), new BigDecimal("850.00"));

                // Hyd -> Blr Morning Non-AC Express (Orange Travels)
                ensureTrip(rHydBlr.getId(), bus3.getId(), d3.getId(), 
                        tripDate.atTime(7, 00), tripDate.atTime(16, 00), new BigDecimal("550.00"));

                // Hyd -> Blr Luxury Scania (Zingbus Plus)
                ensureTrip(rHydBlr.getId(), bus4.getId(), d4.getId(), 
                        tripDate.atTime(22, 45), tripDate.plusDays(1).atTime(7, 45), new BigDecimal("1450.00"));

                // Blr -> Hyd Night Sleeper (VRL Travels)
                ensureTrip(rBlrHyd.getId(), bus5.getId(), d1.getId(), 
                        tripDate.atTime(22, 00), tripDate.plusDays(1).atTime(7, 00), new BigDecimal("1150.00"));

                // Hyd -> Karimnagar Express (FreshBus)
                ensureTrip(rHydKn.getId(), bus6.getId(), d5.getId(),
                        tripDate.atTime(8, 30), tripDate.atTime(11, 30), new BigDecimal("320.00"));
                ensureTrip(rHydKn.getId(), bus7.getId(), d2.getId(),
                        tripDate.atTime(17, 30), tripDate.atTime(20, 30), new BigDecimal("280.00"));

                // Karimnagar -> Hyd Express
                ensureTrip(rKnHyd.getId(), bus7.getId(), d2.getId(),
                        tripDate.atTime(6, 00), tripDate.atTime(9, 00), new BigDecimal("280.00"));

                // Hyd -> Adilabad (TSRTC Super Luxury)
                ensureTrip(rHydAdil.getId(), bus7.getId(), d5.getId(),
                        tripDate.atTime(13, 00), tripDate.atTime(19, 00), new BigDecimal("480.00"));

                // Delhi -> Hyd (Pramukh Travels)
                ensureTrip(rDelHyd.getId(), bus8.getId(), d4.getId(),
                        tripDate.atTime(16, 00), tripDate.plusDays(1).atTime(14, 00), new BigDecimal("2499.00"));

                // Blr -> Chn Express
                ensureTrip(rBlrChn.getId(), bus2.getId(), d3.getId(), 
                        tripDate.atTime(14, 00), tripDate.atTime(20, 00), new BigDecimal("650.00"));
            }

            log.info("TransitSync initial bus fleet and routes initialized successfully!");
        } catch (Exception e) {
            log.warn("Seeding completed or items already exist: {}", e.getMessage());
        }
    }

    private CoachTypeDto ensureCoachType(String name, String code, int decks, boolean hasAc, String desc) {
        var existing = fleetService.getAllCoachTypes().stream().filter(c -> c.getCode().equalsIgnoreCase(code)).findFirst();
        if (existing.isPresent()) return existing.get();
        CoachTypeDto dto = new CoachTypeDto();
        dto.setName(name);
        dto.setCode(code);
        dto.setDecks(decks);
        dto.setHasAc(hasAc);
        dto.setDescription(desc);
        return fleetService.createCoachType(dto);
    }

    private BusDto ensureBus(String reg, Long coachTypeId, String model, int capacity, String amenities) {
        var existing = fleetService.getAllBuses(org.springframework.data.domain.PageRequest.of(0, 100))
                .getContent().stream().filter(b -> b.getRegistrationNumber().equalsIgnoreCase(reg)).findFirst();
        if (existing.isPresent()) return existing.get();
        BusDto dto = new BusDto();
        dto.setRegistrationNumber(reg);
        dto.setCoachTypeId(coachTypeId);
        dto.setModelName(model);
        dto.setTotalCapacity(capacity);
        dto.setAmenities(amenities);
        dto.setStatus("ACTIVE");
        return fleetService.createBus(dto);
    }

    private DriverDto ensureDriver(String name, String license, String phone) {
        var existing = driverAndRouteService.getAllDrivers(org.springframework.data.domain.PageRequest.of(0, 100))
                .getContent().stream().filter(d -> d.getLicenseNumber().equalsIgnoreCase(license)).findFirst();
        if (existing.isPresent()) return existing.get();
        DriverDto dto = new DriverDto();
        dto.setName(name);
        dto.setLicenseNumber(license);
        dto.setPhone(phone);
        dto.setStatus("ACTIVE");
        return driverAndRouteService.createDriver(dto);
    }

    private RouteDto ensureRoute(String origin, String dest, BigDecimal km, int duration) {
        var existing = driverAndRouteService.getActiveRoutes().stream()
                .filter(r -> r.getOrigin().equalsIgnoreCase(origin) && r.getDestination().equalsIgnoreCase(dest))
                .findFirst();
        if (existing.isPresent()) return existing.get();
        RouteDto dto = new RouteDto();
        dto.setOrigin(origin);
        dto.setDestination(dest);
        dto.setDistanceKm(km);
        dto.setEstimatedDurationMinutes(duration);
        dto.setStatus("ACTIVE");
        return driverAndRouteService.createRoute(dto);
    }

    private void ensureTrip(Long routeId, Long busId, Long driverId, LocalDateTime dep, LocalDateTime arr, BigDecimal fare) {
        try {
            TripDto dto = new TripDto();
            dto.setRouteId(routeId);
            dto.setBusId(busId);
            dto.setDriverId(driverId);
            dto.setDepartureTime(dep);
            dto.setArrivalTime(arr);
            dto.setBaseFare(fare);
            tripService.createTrip(dto);
        } catch (Exception ignored) {
            // Overlapping trip or already seeded
        }
    }
}
