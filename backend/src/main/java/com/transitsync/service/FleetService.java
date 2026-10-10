package com.transitsync.service;

import com.transitsync.dto.BusDto;
import com.transitsync.dto.CoachTypeDto;
import com.transitsync.dto.SeatLayoutDto;
import com.transitsync.entity.Bus;
import com.transitsync.entity.CoachType;
import com.transitsync.entity.SeatLayout;
import com.transitsync.exception.BadRequestException;
import com.transitsync.exception.ConflictException;
import com.transitsync.exception.ResourceNotFoundException;
import com.transitsync.repository.BusRepository;
import com.transitsync.repository.CoachTypeRepository;
import com.transitsync.repository.SeatLayoutRepository;
import com.transitsync.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FleetService {

    private final BusRepository busRepository;
    private final CoachTypeRepository coachTypeRepository;
    private final SeatLayoutRepository seatLayoutRepository;
    private final TripRepository tripRepository;

    // --- Coach Types ---
    public List<CoachTypeDto> getAllCoachTypes() {
        return coachTypeRepository.findAll().stream().map(this::mapCoachTypeToDto).collect(Collectors.toList());
    }

    @Transactional
    public CoachTypeDto createCoachType(CoachTypeDto dto) {
        if (coachTypeRepository.existsByCode(dto.getCode().trim().toUpperCase())) {
            throw new ConflictException("Coach type code already exists: " + dto.getCode());
        }
        CoachType coachType = CoachType.builder()
                .name(dto.getName().trim())
                .code(dto.getCode().trim().toUpperCase())
                .description(dto.getDescription())
                .decks(dto.getDecks() > 0 ? dto.getDecks() : 1)
                .hasAc(dto.isHasAc())
                .build();
        return mapCoachTypeToDto(coachTypeRepository.save(coachType));
    }

    // --- Buses ---
    public Page<BusDto> getAllBuses(Pageable pageable) {
        return busRepository.findByStatusNot("RETIRED", pageable).map(this::mapBusToDto);
    }

    public BusDto getBusById(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + id));
        return mapBusToDto(bus);
    }

    @Transactional
    public BusDto createBus(BusDto dto) {
        String reg = dto.getRegistrationNumber().trim().toUpperCase();
        if (busRepository.existsByRegistrationNumber(reg)) {
            throw new ConflictException("Bus registration number already exists: " + reg);
        }

        CoachType coachType = coachTypeRepository.findById(dto.getCoachTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Coach type not found with id: " + dto.getCoachTypeId()));

        Bus bus = Bus.builder()
                .registrationNumber(reg)
                .coachType(coachType)
                .modelName(dto.getModelName())
                .totalCapacity(dto.getTotalCapacity())
                .amenities(dto.getAmenities())
                .status("ACTIVE")
                .build();

        Bus savedBus = busRepository.save(bus);

        // Auto-generate default layout if none provided
        generateDefaultSeatLayout(savedBus, coachType);

        return mapBusToDto(busRepository.findById(savedBus.getId()).orElse(savedBus));
    }

    @Transactional
    public BusDto updateBus(Long id, BusDto dto) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + id));

        CoachType coachType = coachTypeRepository.findById(dto.getCoachTypeId())
                .orElseThrow(() -> new ResourceNotFoundException("Coach type not found with id: " + dto.getCoachTypeId()));

        if ("IN_MAINTENANCE".equalsIgnoreCase(dto.getStatus())) {
            // Check if future trips exist
            var futureTrips = tripRepository.findByBusIdAndDepartureTimeAfterAndStatusNot(bus.getId(), LocalDateTime.now(), "CANCELLED");
            if (!futureTrips.isEmpty()) {
                throw new BadRequestException("Warning: Bus has " + futureTrips.size() + " scheduled upcoming trip(s). Reassign trips before marking maintenance.");
            }
        }

        bus.setCoachType(coachType);
        bus.setModelName(dto.getModelName());
        bus.setAmenities(dto.getAmenities());
        bus.setStatus(dto.getStatus());

        return mapBusToDto(busRepository.save(bus));
    }

    @Transactional
    public void archiveBus(Long id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bus not found with id: " + id));

        var futureTrips = tripRepository.findByBusIdAndDepartureTimeAfterAndStatusNot(bus.getId(), LocalDateTime.now(), "CANCELLED");
        if (!futureTrips.isEmpty()) {
            throw new BadRequestException("Cannot archive bus with upcoming scheduled trips.");
        }

        bus.setStatus("RETIRED");
        busRepository.save(bus);
    }

    private void generateDefaultSeatLayout(Bus bus, CoachType coachType) {
        List<SeatLayout> layouts = new ArrayList<>();
        int capacity = bus.getTotalCapacity();
        boolean isSleeper = coachType.getCode().contains("SLEEPER") || coachType.getName().toLowerCase().contains("sleeper");

        if (isSleeper && coachType.getDecks() == 2) {
            // 2 decks sleeper
            int perDeck = capacity / 2;
            int rows = (int) Math.ceil((double) perDeck / 3);
            int count = 1;
            for (int r = 1; r <= rows && count <= perDeck; r++) {
                for (int c = 1; c <= 3 && count <= perDeck; c++) {
                    layouts.add(SeatLayout.builder()
                            .bus(bus)
                            .deck("LOWER")
                            .rowNum(r)
                            .colNum(c)
                            .seatNumber("L" + count)
                            .seatType("SLEEPER")
                            .isAccessible(true)
                            .build());
                    count++;
                }
            }
            int uCount = 1;
            for (int r = 1; r <= rows && uCount <= (capacity - perDeck); r++) {
                for (int c = 1; c <= 3 && uCount <= (capacity - perDeck); c++) {
                    layouts.add(SeatLayout.builder()
                            .bus(bus)
                            .deck("UPPER")
                            .rowNum(r)
                            .colNum(c)
                            .seatNumber("U" + uCount)
                            .seatType("SLEEPER")
                            .isAccessible(true)
                            .build());
                    uCount++;
                }
            }
        } else {
            // Standard 2x2 Seater grid
            char[] colLetters = {'A', 'B', 'C', 'D'};
            int rows = (int) Math.ceil((double) capacity / 4);
            int seatIdx = 0;
            for (int r = 1; r <= rows && seatIdx < capacity; r++) {
                for (int c = 0; c < 4 && seatIdx < capacity; c++) {
                    layouts.add(SeatLayout.builder()
                            .bus(bus)
                            .deck("LOWER")
                            .rowNum(r)
                            .colNum(c + 1)
                            .seatNumber(r + "" + colLetters[c])
                            .seatType("SEATER")
                            .isAccessible(true)
                            .build());
                    seatIdx++;
                }
            }
        }
        seatLayoutRepository.saveAll(layouts);
    }

    private CoachTypeDto mapCoachTypeToDto(CoachType c) {
        CoachTypeDto dto = new CoachTypeDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setCode(c.getCode());
        dto.setDescription(c.getDescription());
        dto.setDecks(c.getDecks());
        dto.setHasAc(c.isHasAc());
        return dto;
    }

    private BusDto mapBusToDto(Bus b) {
        BusDto dto = new BusDto();
        dto.setId(b.getId());
        dto.setRegistrationNumber(b.getRegistrationNumber());
        dto.setCoachTypeId(b.getCoachType().getId());
        dto.setCoachTypeName(b.getCoachType().getName());
        dto.setCoachTypeCode(b.getCoachType().getCode());
        dto.setDecks(b.getCoachType().getDecks());
        dto.setModelName(b.getModelName());
        dto.setTotalCapacity(b.getTotalCapacity());
        dto.setAmenities(b.getAmenities());
        dto.setStatus(b.getStatus());

        List<SeatLayout> layouts = seatLayoutRepository.findByBusIdOrderByDeckAscRowNumAscColNumAsc(b.getId());
        dto.setSeatLayouts(layouts.stream().map(l -> SeatLayoutDto.builder()
                .id(l.getId())
                .deck(l.getDeck())
                .rowNum(l.getRowNum())
                .colNum(l.getColNum())
                .seatNumber(l.getSeatNumber())
                .seatType(l.getSeatType())
                .isAccessible(l.isAccessible())
                .build()).collect(Collectors.toList()));
        return dto;
    }
}
