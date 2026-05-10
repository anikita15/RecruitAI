package com.resumescreen.service;

import com.resumescreen.dto.JobDescriptionDTO;
import com.resumescreen.entity.JobDescription;
import com.resumescreen.exception.ResourceNotFoundException;
import com.resumescreen.repository.JobDescriptionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for creating and retrieving job descriptions.
 */
@Service
@Transactional
public class JobDescriptionService {

    private static final Logger log = LoggerFactory.getLogger(JobDescriptionService.class);

    private final JobDescriptionRepository jobDescriptionRepository;

    public JobDescriptionService(JobDescriptionRepository jobDescriptionRepository) {
        this.jobDescriptionRepository = jobDescriptionRepository;
    }

    /**
     * Persists a new job description from the DTO.
     */
    public JobDescriptionDTO createJobDescription(JobDescriptionDTO dto) {
        JobDescription jd = JobDescription.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .requiredSkills(dto.getRequiredSkills())
                .experienceRequired(dto.getExperienceRequired())
                .educationRequired(dto.getEducationRequired())
                .build();

        JobDescription saved = jobDescriptionRepository.save(jd);
        log.info("Job description saved with ID: {}", saved.getId());
        return toDTO(saved);
    }

    /**
     * Returns all job descriptions.
     */
    @Transactional(readOnly = true)
    public List<JobDescriptionDTO> getAllJobDescriptions() {
        return jobDescriptionRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Returns a job description by ID.
     */
    @Transactional(readOnly = true)
    public JobDescriptionDTO getJobDescriptionById(Long id) {
        JobDescription jd = jobDescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job description not found with ID: " + id));
        return toDTO(jd);
    }

    /**
     * Returns the raw entity (for internal use by analysis service).
     */
    @Transactional(readOnly = true)
    public JobDescription getEntityById(Long id) {
        return jobDescriptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job description not found with ID: " + id));
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Mapper
    // ──────────────────────────────────────────────────────────────────────────

    private JobDescriptionDTO toDTO(JobDescription jd) {
        return JobDescriptionDTO.builder()
                .id(jd.getId())
                .title(jd.getTitle())
                .description(jd.getDescription())
                .requiredSkills(jd.getRequiredSkills())
                .experienceRequired(jd.getExperienceRequired())
                .educationRequired(jd.getEducationRequired())
                .build();
    }
}
