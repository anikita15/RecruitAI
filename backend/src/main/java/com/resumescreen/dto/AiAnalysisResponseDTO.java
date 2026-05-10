package com.resumescreen.dto;

import lombok.*;
import java.util.List;

/**
 * DTO representing the JSON response from the Python AI microservice.
 * Maps to the FastAPI response schema.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisResponseDTO {

    /** AI match score from 0 to 100 */
    private Double score;

    /** Skills found in both the resume and job description */
    private List<String> matched_skills;

    /** Skills required by the job but absent from the resume */
    private List<String> missing_skills;

    /** AI-generated natural language explanation */
    private String summary;

    /** Extracted candidate name (if available) */
    private String candidate_name;
}
