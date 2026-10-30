package com.edusmart.websocket;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.Map;

/**
 * Every message sent over the room WebSocket (in either direction) uses this
 * simple envelope: a "type" telling everyone how to interpret "payload".
 *
 * Supported types (see docs/WEBSOCKET.md for full details):
 *   JOIN, LEAVE, PRESENCE, CHAT, CODE_UPDATE, WHITEBOARD_DRAW, WHITEBOARD_CLEAR
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class WsMessage {

    private String type;
    private String sender;
    private Map<String, Object> payload;

    public WsMessage() {
    }

    public WsMessage(String type, String sender, Map<String, Object> payload) {
        this.type = type;
        this.sender = sender;
        this.payload = payload;
    }

    // --- Getters ---

    public String getType() { return type; }
    public String getSender() { return sender; }
    public Map<String, Object> getPayload() { return payload; }

    // --- Setters ---

    public void setType(String type) { this.type = type; }
    public void setSender(String sender) { this.sender = sender; }
    public void setPayload(Map<String, Object> payload) { this.payload = payload; }

    // --- Builder ---

    public static WsMessageBuilder builder() { return new WsMessageBuilder(); }

    public static class WsMessageBuilder {
        private String type;
        private String sender;
        private Map<String, Object> payload;

        public WsMessageBuilder type(String type) { this.type = type; return this; }
        public WsMessageBuilder sender(String sender) { this.sender = sender; return this; }
        public WsMessageBuilder payload(Map<String, Object> payload) { this.payload = payload; return this; }

        public WsMessage build() {
            return new WsMessage(type, sender, payload);
        }
    }
}
