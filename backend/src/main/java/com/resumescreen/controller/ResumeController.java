package com.resumescreen.controller;

import com.resumescreen.dto.ApiResponse;
import com.resumescreen.dto.ResumeDTO;
import com.resumescreen.service.ResumeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * REST controller for resume upload and management.
 * Base path: /api/resumes
 */
@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private static final Logger log = LoggerFactory.getLogger(ResumeController.class);

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    /**
     * POST /api/resumes/upload
     * Upload a single resume file with candidate info.
     */
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<ResumeDTO>> uploadResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam("candidateName") String candidateName,
            @RequestParam(value = "candidateEmail", required = false) String candidateEmail) {

        log.info("Received upload request for candidate: {}", candidateName);
        ResumeDTO dto = resumeService.uploadResume(file, candidateName, candidateEmail);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Resume uploaded successfully"));
    }

    /**
     * POST /api/resumes/upload-batch
     * Upload multiple resumes at once. Each file maps to one candidate.
     */
    @PostMapping("/upload-batch")
    public ResponseEntity<ApiResponse<List<ResumeDTO>>> uploadMultiple(
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam("candidateNames") List<String> candidateNames) {

        if (files.size() != candidateNames.size()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Number of files and candidate names must match"));
        }

        List<ResumeDTO> results = new java.util.ArrayList<>();
        for (int i = 0; i < files.size(); i++) {
            results.add(resumeService.uploadResume(files.get(i), candidateNames.get(i), null));
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(results, files.size() + " resumes uploaded successfully"));
    }

    /**
     * GET /api/resumes
     * Returns all uploaded resumes.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ResumeDTO>>> getAllResumes() {
        List<ResumeDTO> resumes = resumeService.getAllResumes();
        return ResponseEntity.ok(ApiResponse.success(resumes, "Resumes fetched successfully"));
    }

    /**
     * GET /api/resumes/{id}
     * Returns a single resume by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ResumeDTO>> getResumeById(@PathVariable Long id) {
        ResumeDTO dto = resumeService.getResumeById(id);
        return ResponseEntity.ok(ApiResponse.success(dto, "Resume fetched successfully"));
    }

    /**
     * DELETE /api/resumes/{id}
     * Deletes a resume file and its database record.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteResume(@PathVariable Long id) {
        resumeService.deleteResume(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Resume deleted successfully"));
    }
}
