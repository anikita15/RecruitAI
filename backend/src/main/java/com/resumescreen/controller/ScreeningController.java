package com.resumescreen.controller;

import com.resumescreen.dto.ApiResponse;
import com.resumescreen.dto.AnalysisTaskDTO;
import com.resumescreen.dto.ScreeningResultDTO;
import com.resumescreen.service.ScreeningService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for AI screening and result retrieval.
 * Base path: /api/screening
 */
@RestController
@RequestMapping("/api/screening")
public class ScreeningController {

    private static final Logger log = LoggerFactory.getLogger(ScreeningController.class);

    private final ScreeningService screeningService;

    public ScreeningController(ScreeningService screeningService) {
        this.screeningService = screeningService;
    }

    /**
     * POST /api/screening/analyze
     * Triggers AI analysis for all (or specified) resumes against a job description.
     * Returns an AnalysisTask ID for tracking.
     */
    @PostMapping("/analyze")
    public ResponseEntity<ApiResponse<AnalysisTaskDTO>> analyze(
            @RequestBody Map<String, Object> body) {

        Long jobDescriptionId = Long.valueOf(body.get("jobDescriptionId").toString());

        @SuppressWarnings("unchecked")
        List<Integer> rawIds = (List<Integer>) body.getOrDefault("resumeIds", List.of());
        List<Long> resumeIds = rawIds.stream().map(Long::valueOf).toList();
        
        String mode = (String) body.getOrDefault("mode", "semantic");

        log.info("Analyze request — jobId: {}, resumeIds: {}, mode: {}", jobDescriptionId, resumeIds, mode);

        AnalysisTaskDTO task = screeningService.initiateAnalysis(jobDescriptionId, resumeIds, mode);
        return ResponseEntity.ok(ApiResponse.success(task, "Analysis started."));
    }

    /**
     * GET /api/screening/task/{taskId}
     * Returns the status of an asynchronous analysis task.
     */
    @GetMapping("/task/{taskId}")
    public ResponseEntity<ApiResponse<AnalysisTaskDTO>> getTaskStatus(
            @PathVariable String taskId) {
        AnalysisTaskDTO task = screeningService.getTaskStatus(taskId);
        return ResponseEntity.ok(ApiResponse.success(task, "Task status fetched."));
    }

    /**
     * GET /api/screening/results
     * Returns all screening results across all job descriptions.
     */
    @GetMapping("/results")
    public ResponseEntity<ApiResponse<List<ScreeningResultDTO>>> getAllResults() {
        List<ScreeningResultDTO> results = screeningService.getAllResults();
        return ResponseEntity.ok(ApiResponse.success(results, "Results fetched successfully"));
    }

    /**
     * GET /api/screening/results/job/{jobId}
     * Returns ranked screening results for a specific job description.
     */
    @GetMapping("/results/job/{jobId}")
    public ResponseEntity<ApiResponse<List<ScreeningResultDTO>>> getResultsByJob(
            @PathVariable Long jobId) {
        List<ScreeningResultDTO> results = screeningService.getResultsByJobDescription(jobId);
        return ResponseEntity.ok(ApiResponse.success(results, "Results for job fetched successfully"));
    }

    /**
     * GET /api/screening/results/{id}
     * Returns a single screening result by its ID.
     */
    @GetMapping("/results/{id}")
    public ResponseEntity<ApiResponse<ScreeningResultDTO>> getResultById(@PathVariable Long id) {
        ScreeningResultDTO result = screeningService.getResultById(id);
        return ResponseEntity.ok(ApiResponse.success(result, "Result fetched successfully"));
    }
}
