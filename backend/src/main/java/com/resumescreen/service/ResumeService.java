package com.resumescreen.service;

import com.resumescreen.dto.ResumeDTO;
import com.resumescreen.entity.Candidate;
import com.resumescreen.entity.Resume;
import com.resumescreen.exception.InvalidFileException;
import com.resumescreen.exception.ResourceNotFoundException;
import com.resumescreen.repository.CandidateRepository;
import com.resumescreen.repository.ResumeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service layer for resume upload, storage, and retrieval.
 */
@Service
@Transactional
public class ResumeService {

    private static final Logger log = LoggerFactory.getLogger(ResumeService.class);
    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword"
    );

    @Value("${app.upload.dir}")
    private String uploadDir;

    private final ResumeRepository resumeRepository;
    private final CandidateRepository candidateRepository;
    private final AiClientService aiClientService;

    public ResumeService(ResumeRepository resumeRepository,
                         CandidateRepository candidateRepository,
                         AiClientService aiClientService) {
        this.resumeRepository = resumeRepository;
        this.candidateRepository = candidateRepository;
        this.aiClientService = aiClientService;
    }

    /**
     * Uploads a resume file, saves it to disk, sends it to the AI service for text extraction,
     * and persists the record to the database.
     *
     * @param file          the uploaded resume file
     * @param candidateName name of the candidate
     * @param candidateEmail email of the candidate (optional)
     * @return populated ResumeDTO
     */
    public ResumeDTO uploadResume(MultipartFile file, String candidateName, String candidateEmail) {
        validateFile(file);

        // Find or create the candidate record
        Candidate candidate = findOrCreateCandidate(candidateName, candidateEmail);

        // Save file to disk
        String savedFilePath = saveFileToDisk(file);

        // Call AI service to extract text from the file
        String extractedText = aiClientService.extractTextFromFile(savedFilePath, file.getOriginalFilename());
        log.info("Extracted {} characters from resume: {}", extractedText.length(), file.getOriginalFilename());

        // Build and persist the Resume entity
        Resume resume = Resume.builder()
                .fileName(file.getOriginalFilename())
                .filePath(savedFilePath)
                .fileType(getFileExtension(file.getOriginalFilename()))
                .fileSize(file.getSize())
                .extractedText(extractedText)
                .candidate(candidate)
                .build();

        Resume saved = resumeRepository.save(resume);
        log.info("Resume saved with ID: {}", saved.getId());

        return toDTO(saved);
    }

    /**
     * Returns all uploaded resumes as DTOs.
     */
    @Transactional(readOnly = true)
    public List<ResumeDTO> getAllResumes() {
        return resumeRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Returns a single resume by ID.
     */
    @Transactional(readOnly = true)
    public ResumeDTO getResumeById(Long id) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with ID: " + id));
        return toDTO(resume);
    }

    /**
     * Deletes a resume by ID.
     */
    public void deleteResume(Long id) {
        Resume resume = resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with ID: " + id));
        // Delete physical file
        try {
            Files.deleteIfExists(Paths.get(resume.getFilePath()));
        } catch (IOException e) {
            log.warn("Could not delete file at {}: {}", resume.getFilePath(), e.getMessage());
        }
        resumeRepository.deleteById(id);
        log.info("Resume {} deleted successfully", id);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ──────────────────────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("Uploaded file is empty or missing");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new InvalidFileException("Only PDF and DOCX files are supported. Got: " + contentType);
        }
    }

    private Candidate findOrCreateCandidate(String name, String email) {
        if (email != null && !email.isBlank()) {
            return candidateRepository.findByEmail(email)
                    .orElseGet(() -> candidateRepository.save(
                            Candidate.builder().name(name).email(email).build()));
        }
        return candidateRepository.save(Candidate.builder().name(name).build());
    }

    private String saveFileToDisk(MultipartFile file) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String uniqueName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path destination = uploadPath.resolve(uniqueName);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            return destination.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + e.getMessage(), e);
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null) return "UNKNOWN";
        int dotIdx = fileName.lastIndexOf('.');
        return dotIdx >= 0 ? fileName.substring(dotIdx + 1).toUpperCase() : "UNKNOWN";
    }

    private ResumeDTO toDTO(Resume resume) {
        return ResumeDTO.builder()
                .id(resume.getId())
                .fileName(resume.getFileName())
                .fileType(resume.getFileType())
                .fileSize(resume.getFileSize())
                .candidateId(resume.getCandidate() != null ? resume.getCandidate().getId() : null)
                .candidateName(resume.getCandidate() != null ? resume.getCandidate().getName() : null)
                .uploadedAt(resume.getUploadedAt())
                .build();
    }
}
