'use client';
import { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandSparkles, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import SourcePanel from './SourcePanel';
import styles from './ChatWindow.module.css';

export default function ChatWindow({
  docId,
  docName,
  initialMessages,
  initialSources,
  onChatUpdate,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [sources, setSources] = useState(initialSources);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    onChatUpdate(messages, sources);
  }, [messages, sources]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = '0px';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
  }, [input]);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;

    const question = input.trim();
    setInput('');

    const newMessages = [
      ...messages,
      { role: 'user', text: question },
      { role: 'ai', text: '' },
    ];

    setMessages(newMessages);
    setStreaming(true);
    setSources([]);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, question }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.replace('data: ', '').trim();

          if (raw === '[DONE]') {
            setStreaming(false);
            continue;
          }

          try {
            const parsed = JSON.parse(raw);

            if (Array.isArray(parsed)) {
              setSources(parsed);
            } else {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  text: updated[updated.length - 1].text + parsed,
                };
                return updated;
              });
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].text = 'Error: Could not reach the server.';
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const cleanDocName = (name = '') => name.replace(/\.[^/.]+$/, '');

  return (
    <div className={styles.shell}>
      <div className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.docIcon}>
              {docName?.endsWith('.pdf') ? '📄' : docName?.endsWith('.docx') ? '📝' : '📃'}
            </div>

            <div className={styles.headerMeta}>
              <h2 className={styles.docTitle}>{cleanDocName(docName || 'Untitled')}</h2>
              <p className={styles.docSubtext}>Ask anything about this document</p>
            </div>
          </div>
        </div>

        <div className={styles.messagesArea}>
          {messages.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>Start chatting with your document</h3>
              <p>
                Ask questions, request summaries, extract key points, or find exact
                information with sources.
              </p>

              <div className={styles.suggestions}>
                {[
                  'Summarize this document',
                  'What are the key points?',
                  'Extract important skills',
                  'What is the main topic?',
                ].map((q) => (
                  <button
                    key={q}
                    className={styles.suggestionBtn}
                    onClick={() => setInput(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.messagesList}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`${styles.messageRow} ${
                    msg.role === 'user' ? styles.userRow : styles.aiRow
                  }`}
                >
                  {msg.role === 'ai' && (
  <div className={styles.avatar}>
    <FontAwesomeIcon icon={faWandSparkles} />
  </div>
)}

                  <div
                    className={`${styles.messageBubble} ${
                      msg.role === 'user' ? styles.userBubble : styles.aiBubble
                    }`}
                  >
                    {msg.text}
                    {streaming && i === messages.length - 1 && msg.role === 'ai' && (
                      <span className={styles.cursor}></span>
                    )}
                  </div>

                  {msg.role === 'user' && <div className={styles.userAvatar}>You</div>}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className={styles.inputWrap}>
          <div className={styles.inputBox}>
            <textarea
              ref={textareaRef}
              rows={1}
              className={styles.textarea}
              placeholder="Ask your document..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={streaming}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />

            <button
              onClick={sendMessage}
              disabled={streaming || !input.trim()}
              className={styles.sendButton}
            >
              {streaming ? '...' : <FontAwesomeIcon icon={faPaperPlane} />}
            </button>
          </div>

          <p className={styles.footerNote}>
            Answers are grounded in your document with source-aware retrieval.
          </p>
        </div>
      </div>

      <SourcePanel sources={sources} />
    </div>
  );
}