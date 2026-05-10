package com.resumescreen.service;

import com.resumescreen.dto.AiAnalysisResponseDTO;
import com.resumescreen.dto.AnalysisTaskDTO;
import com.resumescreen.dto.ScreeningResultDTO;
import com.resumescreen.entity.JobDescription;
import com.resumescreen.entity.Resume;
import com.resumescreen.entity.ScreeningResult;
import com.resumescreen.exception.ResourceNotFoundException;
import com.resumescreen.repository.ResumeRepository;
import com.resumescreen.repository.ScreeningResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Core analysis service that orchestrates the AI screening pipeline.
 *
 * Flow:
 *   1. Load all resumes from DB
 *   2. For each resume, call Python AI microservice with resume text + JD
 *   3. Save ScreeningResult entities
 *   4. Sort by score, assign ranks, update DB
 *   5. Return ranked list of DTOs
 */
@Service
@Transactional
public class ScreeningService {

    private static final Logger log = LoggerFactory.getLogger(ScreeningService.class);

    private final ResumeRepository resumeRepository;
    private final ScreeningResultRepository screeningResultRepository;
    private final JobDescriptionService jobDescriptionService;
    private final AiClientService aiClientService;
    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${app.ai.analysis.mode}")
    private String analysisMode;

    private static final String TASK_KEY_PREFIX = "analysis_task:";

    public ScreeningService(ResumeRepository resumeRepository,
                            ScreeningResultRepository screeningResultRepository,
                            JobDescriptionService jobDescriptionService,
                            AiClientService aiClientService,
                            RedisTemplate<String, Object> redisTemplate) {
        this.resumeRepository = resumeRepository;
        this.screeningResultRepository = screeningResultRepository;
        this.jobDescriptionService = jobDescriptionService;
        this.aiClientService = aiClientService;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Initiates the AI analysis pipeline asynchronously.
     * Returns a Task ID for progress tracking.
     */
    public AnalysisTaskDTO initiateAnalysis(Long jobDescriptionId, List<Long> resumeIds, String mode) {
        JobDescription jd = jobDescriptionService.getEntityById(jobDescriptionId);
        
        List<Resume> resumes = (resumeIds != null && !resumeIds.isEmpty())
                ? resumeRepository.findAllById(resumeIds)
                : resumeRepository.findAll();

        if (resumes.isEmpty()) {
            throw new ResourceNotFoundException("No resumes found to analyze");
        }

        String taskId = UUID.randomUUID().toString();
        AnalysisTaskDTO task = AnalysisTaskDTO.builder()
                .taskId(taskId)
                .jobDescriptionId(jobDescriptionId)
                .status("PENDING")
                .totalResumes(resumes.size())
                .processedResumes(0)
                .startedAt(LocalDateTime.now())
                .message("Analysis queued (" + mode.toUpperCase() + ") for " + resumes.size() + " resumes")
                .build();

        // Store task state in Redis (expires in 1 hour)
        redisTemplate.opsForValue().set(TASK_KEY_PREFIX + taskId, task, 1, TimeUnit.HOURS);

        // Trigger async processing
        processAnalysisTask(taskId, jd, resumes, mode);

        return task;
    }

    @Async
    public void processAnalysisTask(String taskId, JobDescription jd, List<Resume> resumes, String mode) {
        log.info("Starting async analysis task {} (Mode: {}) for job: {}", taskId, mode, jd.getTitle());
        
        AnalysisTaskDTO task = (AnalysisTaskDTO) redisTemplate.opsForValue().get(TASK_KEY_PREFIX + taskId);
        if (task == null) return;

        task.setStatus("IN_PROGRESS");
        redisTemplate.opsForValue().set(TASK_KEY_PREFIX + taskId, task, 1, TimeUnit.HOURS);

        try {
            // Delete existing results
            List<ScreeningResult> existing = screeningResultRepository
                    .findByJobDescriptionIdOrderByScoreDesc(jd.getId());
            if (!existing.isEmpty()) {
                screeningResultRepository.deleteAllInBatch(existing);
            }

            // Process resumes
            List<ScreeningResult> results = new java.util.ArrayList<>();
            for (Resume resume : resumes) {
                results.add(analyzeOneResume(resume, jd, mode));
                
                // Update progress in Redis
                task.setProcessedResumes(task.getProcessedResumes() + 1);
                task.setMessage("Processed " + task.getProcessedResumes() + " / " + task.getTotalResumes());
                redisTemplate.opsForValue().set(TASK_KEY_PREFIX + taskId, task, 1, TimeUnit.HOURS);
            }

            // Sort and rank
            results.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));
            AtomicInteger rank = new AtomicInteger(1);
            results.forEach(r -> r.setRankPosition(rank.getAndIncrement()));

            // Save results
            screeningResultRepository.saveAll(results);

            // Finalize task
            task.setStatus("COMPLETED");
            task.setMessage("Analysis complete!");
            task.setCompletedAt(LocalDateTime.now());
            redisTemplate.opsForValue().set(TASK_KEY_PREFIX + taskId, task, 1, TimeUnit.HOURS);
            log.info("Async analysis task {} completed successfully", taskId);

        } catch (Exception e) {
            log.error("Async analysis task {} failed: {}", taskId, e.getMessage());
            task.setStatus("FAILED");
            task.setMessage("Error: " + e.getMessage());
            redisTemplate.opsForValue().set(TASK_KEY_PREFIX + taskId, task, 1, TimeUnit.HOURS);
        }
    }

    /**
     * Retrieves the status of an ongoing or completed analysis task.
     */
    public AnalysisTaskDTO getTaskStatus(String taskId) {
        AnalysisTaskDTO task = (AnalysisTaskDTO) redisTemplate.opsForValue().get(TASK_KEY_PREFIX + taskId);
        if (task == null) {
            throw new ResourceNotFoundException("Task not found with ID: " + taskId);
        }
        return task;
    }

    /**
     * Legacy method — keep for compatibility if needed, or remove later.
     * @deprecated Use initiateAnalysis for async processing.
     */
    @Deprecated
    public List<ScreeningResultDTO> analyzeResumes(Long jobDescriptionId, List<Long> resumeIds) {
        JobDescription jd = jobDescriptionService.getEntityById(jobDescriptionId);
        log.info("Starting analysis for job: '{}' (ID: {})", jd.getTitle(), jobDescriptionId);

        // Load resumes to analyze
        List<Resume> resumes = (resumeIds != null && !resumeIds.isEmpty())
                ? resumeRepository.findAllById(resumeIds)
                : resumeRepository.findAll();

        if (resumes.isEmpty()) {
            throw new ResourceNotFoundException("No resumes found to analyze");
        }

        log.info("Analyzing {} resumes against job description '{}'", resumes.size(), jd.getTitle());

        // Delete any existing results for this job description to allow re-analysis
        List<ScreeningResult> existing = screeningResultRepository
                .findByJobDescriptionIdOrderByScoreDesc(jobDescriptionId);
        if (!existing.isEmpty()) {
            screeningResultRepository.deleteAll(existing);
            log.info("Cleared {} previous screening results for job ID {}", existing.size(), jobDescriptionId);
        }

        // Analyze each resume and collect results
        List<ScreeningResult> results = resumes.stream()
                .map(resume -> analyzeOneResume(resume, jd, analysisMode))
                .collect(Collectors.toList());

        // Sort by score descending and assign ranks
        results.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));
        AtomicInteger rank = new AtomicInteger(1);
        results.forEach(r -> r.setRankPosition(rank.getAndIncrement()));

        // Persist all results
        List<ScreeningResult> saved = screeningResultRepository.saveAll(results);
        log.info("Saved {} screening results. Top score: {}", saved.size(), saved.get(0).getScore());

        return saved.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Returns previously computed screening results for a job description.
     */
    @Transactional(readOnly = true)
    public List<ScreeningResultDTO> getResultsByJobDescription(Long jobDescriptionId) {
        // Verify JD exists
        jobDescriptionService.getEntityById(jobDescriptionId);
        return screeningResultRepository
                .findByJobDescriptionIdOrderByScoreDesc(jobDescriptionId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Returns all screening results across all jobs, ordered by score.
     */
    @Transactional(readOnly = true)
    public List<ScreeningResultDTO> getAllResults() {
        return screeningResultRepository.findAllOrderByScoreDesc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Returns a single screening result by ID.
     */
    @Transactional(readOnly = true)
    public ScreeningResultDTO getResultById(Long id) {
        ScreeningResult result = screeningResultRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Screening result not found with ID: " + id));
        return toDTO(result);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────────

    private ScreeningResult analyzeOneResume(Resume resume, JobDescription jd, String mode) {
        log.debug("Analyzing resume: {} (ID: {}) with mode: {}", resume.getFileName(), resume.getId(), mode);

        String resumeText = resume.getExtractedText();
        if (resumeText == null || resumeText.isBlank()) {
            log.warn("Resume {} has no extracted text — assigning score 0", resume.getId());
            return buildZeroScoreResult(resume, jd);
        }

        try {
            AiAnalysisResponseDTO aiResponse = aiClientService.analyzeResume(resumeText, jd.getDescription(), mode != null ? mode : analysisMode);

            // Update candidate name if AI extracted it
            if (aiResponse.getCandidate_name() != null && !aiResponse.getCandidate_name().isBlank()) {
                resume.getCandidate().setName(aiResponse.getCandidate_name());
            }

            return ScreeningResult.builder()
                    .resume(resume)
                    .jobDescription(jd)
                    .score(aiResponse.getScore() != null ? aiResponse.getScore() : 0.0)
                    .matchedSkills(listToString(aiResponse.getMatched_skills()))
                    .missingSkills(listToString(aiResponse.getMissing_skills()))
                    .summary(aiResponse.getSummary())
                    .candidateName(resume.getCandidate().getName())
                    .build();

        } catch (Exception e) {
            log.error("AI analysis failed for resume {}: {}", resume.getId(), e.getMessage());
            return buildZeroScoreResult(resume, jd);
        }
    }

    private ScreeningResult buildZeroScoreResult(Resume resume, JobDescription jd) {
        return ScreeningResult.builder()
                .resume(resume)
                .jobDescription(jd)
                .score(0.0)
                .matchedSkills("")
                .missingSkills("")
                .summary("Analysis could not be completed for this resume.")
                .candidateName(resume.getCandidate().getName())
                .build();
    }

    private String listToString(List<String> list) {
        if (list == null || list.isEmpty()) return "";
        return String.join(",", list);
    }

    private List<String> stringToList(String csv) {
        if (csv == null || csv.isBlank()) return Collections.emptyList();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private ScreeningResultDTO toDTO(ScreeningResult sr) {
        return ScreeningResultDTO.builder()
                .id(sr.getId())
                .resumeId(sr.getResume() != null ? sr.getResume().getId() : null)
                .fileName(sr.getResume() != null ? sr.getResume().getFileName() : null)
                .jobDescriptionId(sr.getJobDescription() != null ? sr.getJobDescription().getId() : null)
                .jobTitle(sr.getJobDescription() != null ? sr.getJobDescription().getTitle() : null)
                .candidateId(sr.getResume() != null && sr.getResume().getCandidate() != null
                        ? sr.getResume().getCandidate().getId() : null)
                .candidateName(sr.getCandidateName())
                .candidateEmail(sr.getResume() != null && sr.getResume().getCandidate() != null
                        ? sr.getResume().getCandidate().getEmail() : null)
                .score(sr.getScore())
                .rankPosition(sr.getRankPosition())
                .matchedSkills(stringToList(sr.getMatchedSkills()))
                .missingSkills(stringToList(sr.getMissingSkills()))
                .summary(sr.getSummary())
                .analyzedAt(sr.getAnalyzedAt())
                .build();
    }
}
