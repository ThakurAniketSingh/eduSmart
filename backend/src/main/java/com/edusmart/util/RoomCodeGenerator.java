package com.edusmart.util;

import java.security.SecureRandom;

/**
 * Generates short, human-friendly room codes such as "EDU482".
 * Ambiguous characters (0/O, 1/I) are excluded so codes are easy to read aloud
 * and type into the Join Classroom form.
 */
public final class RoomCodeGenerator {

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final String PREFIX = "EDU";
    private static final int RANDOM_LENGTH = 3;
    private static final SecureRandom RANDOM = new SecureRandom();

    private RoomCodeGenerator() {
    }

    public static String generate() {
        StringBuilder sb = new StringBuilder(PREFIX.length() + RANDOM_LENGTH);
        // Keep the "EDU" prefix purely for branding/readability in the demo;
        // uniqueness comes from the random suffix + a DB uniqueness check by the caller.
        sb.append(PREFIX);
        for (int i = 0; i < RANDOM_LENGTH; i++) {
            sb.append(randomChar());
        }
        return sb.toString();
    }

    private static char randomChar() {
        return ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length()));
    }
}
