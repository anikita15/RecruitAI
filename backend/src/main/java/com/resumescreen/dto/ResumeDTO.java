package com.resumescreen.dto;

import lombok.*;
import java.time.LocalDateTime;

/**
 * DTO for Resume data returned to the frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeDTO {
    private Long id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private Long candidateId;
    private String candidateName;
    private LocalDateTime uploadedAt;
}
