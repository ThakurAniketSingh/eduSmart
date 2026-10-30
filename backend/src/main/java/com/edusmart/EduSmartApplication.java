package com.edusmart;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EduSmartApplication {

    public static void main(String[] args) {
        SpringApplication.run(EduSmartApplication.class, args);
    }
}
