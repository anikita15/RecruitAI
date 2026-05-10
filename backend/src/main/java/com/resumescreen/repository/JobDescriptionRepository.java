package com.resumescreen.repository;

import com.resumescreen.entity.JobDescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for JobDescription entity.
 */
@Repository
public interface JobDescriptionRepository extends JpaRepository<JobDescription, Long> {
}
