package com.resumescreen.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO representing the AI analysis result for a candidate's resume.
 * Includes score, matched/missing skills, and AI summary.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScreeningResultDTO {

    private Long id;
    private Long resumeId;
    private String fileName;
    private Long jobDescriptionId;
    private String jobTitle;

    // Candidate info
    private Long candidateId;
    private String candidateName;
    private String candidateEmail;

    // AI Analysis Results
    private Double score;
    private Integer rankPosition;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private String summary;

    private LocalDateTime analyzedAt;
}
