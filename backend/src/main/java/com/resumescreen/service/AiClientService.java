package com.resumescreen.service;

import com.resumescreen.dto.AiAnalysisResponseDTO;
import com.resumescreen.exception.AiServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * HTTP client for communicating with the Python FastAPI AI microservice.
 * Handles text extraction and resume-to-JD analysis requests.
 */
@Service
public class AiClientService {

    private static final Logger log = LoggerFactory.getLogger(AiClientService.class);

    @Value("${app.ai.service.url}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;

    public AiClientService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Sends the saved file path to the AI service for text extraction.
     *
     * @param filePath absolute path to the saved file
     * @param fileName original file name
     * @return extracted plain text content
     */
    public String extractTextFromFile(String filePath, String fileName) {
        try {
            String url = aiServiceUrl + "/extract-text";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(filePath));

            HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Object text = response.getBody().get("text");
                return text != null ? text.toString() : "";
            }
            return "";
        } catch (ResourceAccessException e) {
            log.warn("AI service unreachable for text extraction: {}. Returning empty text.", e.getMessage());
            return ""; // Graceful degradation — allow resume upload even if AI is down
        } catch (Exception e) {
            log.error("Unexpected error calling AI extract-text: {}", e.getMessage());
            return "";
        }
    }

    /**
     * Calls the AI service to analyze a resume against a job description.
     *
     * @param resumeText    extracted text of the resume
     * @param jobDescription the full job description text
     * @return AI analysis result including score and matched/missing skills
     */
    public AiAnalysisResponseDTO analyzeResume(String resumeText, String jobDescription, String mode) {
        try {
            String url = aiServiceUrl + "/analyze";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> requestBody = Map.of(
                    "resume_text", resumeText,
                    "job_description", jobDescription,
                    "mode", mode != null ? mode : "semantic"
            );

            HttpEntity<Map<String, String>> request = new HttpEntity<>(requestBody, headers);
            ResponseEntity<AiAnalysisResponseDTO> response = restTemplate.postForEntity(
                    url, request, AiAnalysisResponseDTO.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("AI analysis complete. Score: {}", response.getBody().getScore());
                return response.getBody();
            }
            throw new AiServiceException("Empty response from AI service");

        } catch (ResourceAccessException e) {
            throw new AiServiceException("AI microservice is not reachable at " + aiServiceUrl, e);
        } catch (AiServiceException e) {
            throw e;
        } catch (Exception e) {
            throw new AiServiceException("Error calling AI analyze endpoint: " + e.getMessage(), e);
        }
    }
}
