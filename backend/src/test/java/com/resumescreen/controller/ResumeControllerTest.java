package com.resumescreen.controller;

import com.resumescreen.dto.ResumeDTO;
import com.resumescreen.service.ResumeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ResumeController.class)
class ResumeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ResumeService resumeService;

    @Test
    void getAllResumes_Success() throws Exception {
        // Arrange
        ResumeDTO dto = ResumeDTO.builder().id(1L).candidateName("John Doe").fileName("resume.pdf").build();
        when(resumeService.getAllResumes()).thenReturn(List.of(dto));

        // Act & Assert
        mockMvc.perform(get("/api/resumes")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].candidateName").value("John Doe"));
    }

    @Test
    void uploadResume_Success() throws Exception {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
                "file", "resume.pdf", "application/pdf", "content".getBytes());
        
        ResumeDTO dto = ResumeDTO.builder().id(1L).candidateName("John Doe").build();
        when(resumeService.uploadResume(any(), anyString(), any())).thenReturn(dto);

        // Act & Assert
        mockMvc.perform(multipart("/api/resumes/upload")
                .file(file)
                .param("candidateName", "John Doe"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.candidateName").value("John Doe"));
    }
}
