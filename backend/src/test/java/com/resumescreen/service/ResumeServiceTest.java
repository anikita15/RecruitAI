package com.resumescreen.service;

import com.resumescreen.dto.ResumeDTO;
import com.resumescreen.entity.Candidate;
import com.resumescreen.entity.Resume;
import com.resumescreen.exception.InvalidFileException;
import com.resumescreen.repository.CandidateRepository;
import com.resumescreen.repository.ResumeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResumeServiceTest {

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private CandidateRepository candidateRepository;

    @Mock
    private AiClientService aiClientService;

    @InjectMocks
    private ResumeService resumeService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(resumeService, "uploadDir", tempDir.toString());
    }

    @Test
    void uploadResume_Success() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "dummy content".getBytes());
        String candidateName = "John Doe";
        
        Candidate candidate = Candidate.builder().id(1L).name(candidateName).build();
        when(candidateRepository.save(any(Candidate.class))).thenReturn(candidate);
        when(aiClientService.extractTextFromFile(anyString(), anyString())).thenReturn("Extracted text");
        
        Resume savedResume = Resume.builder()
                .id(100L)
                .fileName("test.pdf")
                .candidate(candidate)
                .build();
        when(resumeRepository.save(any(Resume.class))).thenReturn(savedResume);

        // Act
        ResumeDTO result = resumeService.uploadResume(file, candidateName, null);

        // Assert
        assertNotNull(result);
        assertEquals(100L, result.getId());
        assertEquals("test.pdf", result.getFileName());
        assertEquals("John Doe", result.getCandidateName());
        
        verify(candidateRepository).save(any(Candidate.class));
        verify(resumeRepository).save(any(Resume.class));
        verify(aiClientService).extractTextFromFile(anyString(), eq("test.pdf"));
    }

    @Test
    void uploadResume_InvalidFileType_ThrowsException() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", "text/plain", "dummy content".getBytes());

        // Act & Assert
        assertThrows(InvalidFileException.class, () -> 
                resumeService.uploadResume(file, "John Doe", null));
        
        verifyNoInteractions(resumeRepository, aiClientService);
    }
}
