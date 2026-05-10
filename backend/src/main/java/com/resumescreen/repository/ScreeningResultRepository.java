package com.resumescreen.repository;

import com.resumescreen.entity.ScreeningResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repository for ScreeningResult entity.
 * Provides ranked query results by job description.
 */
@Repository
public interface ScreeningResultRepository extends JpaRepository<ScreeningResult, Long> {

    /**
     * Returns all screening results for a given job description, ordered by score descending.
     */
    @Query("SELECT sr FROM ScreeningResult sr WHERE sr.jobDescription.id = :jobId ORDER BY sr.score DESC")
    List<ScreeningResult> findByJobDescriptionIdOrderByScoreDesc(@Param("jobId") Long jobId);

    /**
     * Returns the latest screening results across all job descriptions, ordered by score.
     */
    @Query("SELECT sr FROM ScreeningResult sr ORDER BY sr.score DESC")
    List<ScreeningResult> findAllOrderByScoreDesc();

    void deleteByResumeId(Long resumeId);
}
