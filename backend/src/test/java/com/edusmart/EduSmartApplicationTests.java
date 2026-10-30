package com.edusmart;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class EduSmartApplicationTests {

    @Test
    void contextLoads() {
        // If the Spring context fails to wire up (bad bean, bad config, etc.) this test fails.
    }
}
