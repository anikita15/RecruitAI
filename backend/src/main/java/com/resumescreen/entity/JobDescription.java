package com.resumescreen.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a job description entered by a recruiter.
 * Used as the basis for ranking and comparing candidates.
 */
@Entity
@Table(name = "job_descriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobDescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String description;

    @Column(name = "required_skills", columnDefinition = "TEXT")
    private String requiredSkills; // Comma-separated key skills

    @Column(name = "experience_required")
    private String experienceRequired;

    @Column(name = "education_required")
    private String educationRequired;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // A job description can have many screening results
    @OneToMany(mappedBy = "jobDescription", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<ScreeningResult> screeningResults = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
