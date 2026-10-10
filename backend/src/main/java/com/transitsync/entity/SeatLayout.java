package com.transitsync.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "seat_layouts", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"bus_id", "seat_number"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatLayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String deck = "LOWER"; // LOWER, UPPER

    @Column(name = "row_num", nullable = false)
    private int rowNum;

    @Column(name = "col_num", nullable = false)
    private int colNum;

    @Column(name = "seat_number", nullable = false, length = 10)
    private String seatNumber; // e.g. "1A", "1B", "L1", "U1"

    @Column(name = "seat_type", nullable = false, length = 20)
    @Builder.Default
    private String seatType = "SEATER"; // SEATER, SLEEPER

    @Column(name = "is_accessible", nullable = false)
    @Builder.Default
    private boolean isAccessible = true;
}
