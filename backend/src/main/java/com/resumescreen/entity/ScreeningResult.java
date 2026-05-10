package com.resumescreen.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Stores the AI analysis result for a given resume against a job description.
 * Includes match score, matched/missing skills, and AI-generated summary.
 */
@Entity
@Table(name = "screening_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScreeningResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The resume being analyzed
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    // The job description being matched against
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_description_id", nullable = false)
    private JobDescription jobDescription;

    // AI-computed match score (0.0 - 100.0)
    @Column(nullable = false)
    private Double score;

    // Ranking position (1 = best match)
    @Column(name = "rank_position")
    private Integer rankPosition;

    // Comma-separated list of matched skills
    @Column(name = "matched_skills", columnDefinition = "TEXT")
    private String matchedSkills;

    // Comma-separated list of missing skills
    @Column(name = "missing_skills", columnDefinition = "TEXT")
    private String missingSkills;

    // AI-generated explanation of the match
    @Column(columnDefinition = "TEXT")
    private String summary;

    // Candidate name extracted from resume
    @Column(name = "candidate_name")
    private String candidateName;

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt;

    @PrePersist
    protected void onCreate() {
        this.analyzedAt = LocalDateTime.now();
    }
}
