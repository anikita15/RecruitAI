package com.resumescreen.service;

import com.resumescreen.dto.AiAnalysisResponseDTO;
import com.resumescreen.dto.ScreeningResultDTO;
import com.resumescreen.entity.Candidate;
import com.resumescreen.entity.JobDescription;
import com.resumescreen.entity.Resume;
import com.resumescreen.entity.ScreeningResult;
import com.resumescreen.repository.ResumeRepository;
import com.resumescreen.repository.ScreeningResultRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScreeningServiceTest {

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private ScreeningResultRepository screeningResultRepository;

    @Mock
    private JobDescriptionService jobDescriptionService;

    @Mock
    private AiClientService aiClientService;

    @InjectMocks
    private ScreeningService screeningService;

    @Test
    @SuppressWarnings("unchecked")
    void analyzeResumes_Success() {
        // Arrange
        Long jobId = 1L;
        JobDescription jd = JobDescription.builder().id(jobId).title("Developer").description("Java skills").build();
        when(jobDescriptionService.getEntityById(jobId)).thenReturn(jd);

        Resume resume = Resume.builder()
                .id(10L)
                .extractedText("Java expert")
                .candidate(Candidate.builder().name("Alice").build())
                .build();
        when(resumeRepository.findAll()).thenReturn(List.of(resume));
        when(screeningResultRepository.findByJobDescriptionIdOrderByScoreDesc(jobId)).thenReturn(Collections.emptyList());

        AiAnalysisResponseDTO aiResponse = new AiAnalysisResponseDTO();
        aiResponse.setScore(85.0);
        aiResponse.setMatched_skills(List.of("Java"));
        aiResponse.setSummary("Great candidate");
        when(aiClientService.analyzeResume(anyString(), anyString(), anyString())).thenReturn(aiResponse);

        when(screeningResultRepository.saveAll(anyList())).thenAnswer(i -> i.getArguments()[0]);

        // Act
        List<ScreeningResultDTO> results = screeningService.analyzeResumes(jobId, null);

        // Assert
        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        assertEquals(85.0, results.get(0).getScore());
        assertEquals(1, results.get(0).getRankPosition());
        
        verify(aiClientService).analyzeResume(eq("Java expert"), eq("Java skills"), anyString());
        verify(screeningResultRepository).saveAll(anyList());
    }

    @Test
    void getAllResults_Success() {
        // Arrange
        ScreeningResult sr = ScreeningResult.builder()
                .id(50L)
                .score(90.0)
                .candidateName("Alice")
                .build();
        when(screeningResultRepository.findAllOrderByScoreDesc()).thenReturn(List.of(sr));

        // Act
        List<ScreeningResultDTO> results = screeningService.getAllResults();

        // Assert
        assertEquals(1, results.size());
        assertEquals(90.0, results.get(0).getScore());
        verify(screeningResultRepository).findAllOrderByScoreDesc();
    }
}
