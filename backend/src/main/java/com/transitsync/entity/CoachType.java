package com.transitsync.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "coach_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CoachType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    private String description;

    @Column(nullable = false)
    @Builder.Default
    private int decks = 1;

    @Column(name = "has_ac", nullable = false)
    @Builder.Default
    private boolean hasAc = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
