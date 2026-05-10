package com.resumescreen.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisTaskDTO {
    private String taskId;
    private Long jobDescriptionId;
    private String status; // PENDING, IN_PROGRESS, COMPLETED, FAILED
    private int totalResumes;
    private int processedResumes;
    private String message;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    public double getProgressPercentage() {
        if (totalResumes == 0) return 0.0;
        return (double) processedResumes / totalResumes * 100.0;
    }
}
