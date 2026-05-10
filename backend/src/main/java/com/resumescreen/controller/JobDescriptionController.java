package com.resumescreen.controller;

import com.resumescreen.dto.ApiResponse;
import com.resumescreen.dto.JobDescriptionDTO;
import com.resumescreen.service.JobDescriptionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for job description management.
 * Base path: /api/job-descriptions
 */
@RestController
@RequestMapping("/api/job-descriptions")
public class JobDescriptionController {

    private static final Logger log = LoggerFactory.getLogger(JobDescriptionController.class);

    private final JobDescriptionService jobDescriptionService;

    public JobDescriptionController(JobDescriptionService jobDescriptionService) {
        this.jobDescriptionService = jobDescriptionService;
    }

    /**
     * POST /api/job-descriptions
     * Creates a new job description.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<JobDescriptionDTO>> createJobDescription(
            @Valid @RequestBody JobDescriptionDTO dto) {

        log.info("Creating job description: {}", dto.getTitle());
        JobDescriptionDTO saved = jobDescriptionService.createJobDescription(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(saved, "Job description created successfully"));
    }

    /**
     * GET /api/job-descriptions
     * Returns all job descriptions.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<JobDescriptionDTO>>> getAllJobDescriptions() {
        List<JobDescriptionDTO> list = jobDescriptionService.getAllJobDescriptions();
        return ResponseEntity.ok(ApiResponse.success(list, "Job descriptions fetched successfully"));
    }

    /**
     * GET /api/job-descriptions/{id}
     * Returns a specific job description.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobDescriptionDTO>> getById(@PathVariable Long id) {
        JobDescriptionDTO dto = jobDescriptionService.getJobDescriptionById(id);
        return ResponseEntity.ok(ApiResponse.success(dto, "Job description fetched successfully"));
    }
}
