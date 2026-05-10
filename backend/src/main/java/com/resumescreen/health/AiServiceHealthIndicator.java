package com.resumescreen.health;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Custom HealthIndicator to monitor the status of the Python AI Microservice.
 * Integrated with Spring Boot Actuator.
 */
@Component
public class AiServiceHealthIndicator implements HealthIndicator {

    @Value("${app.ai.service.url}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate;

    public AiServiceHealthIndicator(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public Health health() {
        try {
            // Call the /health endpoint of the AI service
            String url = aiServiceUrl + "/health";
            Map<?, ?> response = restTemplate.getForObject(url, Map.class);

            if (response != null && "ok".equals(response.get("status"))) {
                return Health.up()
                        .withDetail("url", aiServiceUrl)
                        .withDetail("service", response.get("service"))
                        .build();
            } else {
                return Health.down()
                        .withDetail("url", aiServiceUrl)
                        .withDetail("message", "Unexpected response from AI service")
                        .build();
            }
        } catch (Exception e) {
            return Health.down()
                    .withDetail("url", aiServiceUrl)
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
