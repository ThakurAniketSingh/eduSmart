package com.edusmart.util;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RoomCodeGeneratorTest {

    @Test
    void generatesSixCharacterCodeWithEduPrefix() {
        String code = RoomCodeGenerator.generate();
        assertEquals(6, code.length());
        assertTrue(code.startsWith("EDU"));
    }

    @Test
    void generatesDifferentCodesAcrossManyCalls() {
        Set<String> codes = new HashSet<>();
        for (int i = 0; i < 200; i++) {
            codes.add(RoomCodeGenerator.generate());
        }
        // Not a strict uniqueness guarantee (it's random), but with a large enough
        // alphabet/length space, 200 draws should produce a very high number of distinct codes.
        assertTrue(codes.size() > 150);
    }
}
