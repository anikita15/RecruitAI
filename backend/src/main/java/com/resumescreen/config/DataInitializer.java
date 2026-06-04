package com.resumescreen.config;

import com.resumescreen.entity.ERole;
import com.resumescreen.entity.Role;
import com.resumescreen.repository.RoleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds initial data (such as Security Roles) required for application signup
 * and authentication flows.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private RoleRepository roleRepository;

    @Override
    public void run(String... args) throws Exception {
        for (ERole eRole : ERole.values()) {
            if (roleRepository.findByName(eRole).isEmpty()) {
                Role role = Role.builder()
                        .name(eRole)
                        .build();
                roleRepository.save(role);
                System.out.println("Seeded database role: " + eRole.name());
            }
        }
    }
}
