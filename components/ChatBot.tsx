'use client';

import { useState } from 'react';
import { SITE_NAME } from "@/lib/site";

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="chatbot-container">
      <button
        className={`chat-toggle ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open chat"
        aria-expanded={isOpen}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2.5" />
        </svg>
      </button>

      <div className={`chat-window ${isOpen ? "open" : ""}`} role="dialog" aria-label={`${SITE_NAME} chat`}>
        <div className="chat-header">
          <h3>{SITE_NAME} Assistant</h3>
          <button onClick={() => setIsOpen(false)} aria-label="Close chat" className="chat-close-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="chat-messages" role="log" aria-live="polite" aria-label="Chat messages">
          <div className="bot-message">
            Hello! I am your {SITE_NAME} assistant. How can I help you plan your trip?
          </div>
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your question..."
            aria-label="Type your message"
          />
          <button aria-label="Send message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
