package com.resumescreen;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Main entry point for the Resume Screening System.
 * Bootstraps the Spring Boot application context.
 */
@SpringBootApplication
@EnableAsync
public class ResumeScreenApplication {

    private static final Logger log = LoggerFactory.getLogger(ResumeScreenApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(ResumeScreenApplication.class, args);
        log.info("==============================================");
        log.info("  Resume Screening System started successfully");
        log.info("  API available at: http://localhost:8080/api");
        log.info("==============================================");
    }
}
