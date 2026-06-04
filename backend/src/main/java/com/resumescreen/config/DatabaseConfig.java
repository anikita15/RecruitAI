package com.resumescreen.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

/**
 * Dynamic Database Configuration.
 * Detects if DATABASE_URL is set (Render/Production) and parses it
 * to construct a JDBC connection for PostgreSQL.
 * Otherwise, falls back to local MySQL config from application.properties.
 */
@Configuration
public class DatabaseConfig {

    @Value("${spring.datasource.url}")
    private String defaultUrl;

    @Value("${spring.datasource.username}")
    private String defaultUsername;

    @Value("${spring.datasource.password:}")
    private String defaultPassword;

    @Value("${spring.datasource.driver-class-name}")
    private String defaultDriverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        
        if (databaseUrl != null && !databaseUrl.isEmpty() && 
            (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(databaseUrl);
                String userInfo = uri.getUserInfo();
                String username = "";
                String password = "";
                if (userInfo != null && userInfo.contains(":")) {
                    String[] parts = userInfo.split(":", 2);
                    username = parts[0];
                    password = parts[1];
                }
                
                int port = uri.getPort();
                String hostAndPort = uri.getHost() + (port == -1 ? "" : ":" + port);
                String dbUrl = "jdbc:postgresql://" + hostAndPort + uri.getPath();
                
                return DataSourceBuilder.create()
                        .url(dbUrl)
                        .username(username)
                        .password(password)
                        .driverClassName("org.postgresql.Driver")
                        .build();
            } catch (Exception e) {
                System.err.println("Error parsing DATABASE_URL, falling back to properties: " + e.getMessage());
            }
        }
        
        // Fallback to application.properties values
        return DataSourceBuilder.create()
                .url(defaultUrl)
                .username(defaultUsername)
                .password(defaultPassword)
                .driverClassName(defaultDriverClassName)
                .build();
    }
}
