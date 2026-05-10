package com.resumescreen.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * DTO for creating or submitting a Job Description.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobDescriptionDTO {

    private Long id;

    @NotBlank(message = "Job title is required")
    private String title;

    @NotBlank(message = "Job description is required")
    private String description;

    private String requiredSkills;
    private String experienceRequired;
    private String educationRequired;
}
