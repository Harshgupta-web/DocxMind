'use client';

import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faBars, faXmark, faFileLines, faFileWord, faFile } from '@fortawesome/free-solid-svg-icons';
import styles from './Sidebar.module.css';

export default function Sidebar({ docs, activeDocId, onSelect, onUpload }) {
  const docList = Object.entries(docs || {});
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getFileIcon = (name = '') => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.pdf')) return faFileLines;
    if (lower.endsWith('.docx')) return faFileWord;
    return faFile;
  };

  const cleanName = (name = '') => name.replace(/\.[^/.]+$/, '');

  const handleSelect = (docId) => {
    onSelect(docId);
    setMobileOpen(false);
  };

  return (
    <>
      <button
  onClick={() => setMobileOpen(true)}
  className={`${styles.mobileMenuButton} ${mobileOpen ? styles.mobileMenuButtonHidden : ''}`}
  aria-label="Open sidebar"
>
        <FontAwesomeIcon icon={faBars} className={styles.menuIcon} />
      </button>

      {mobileOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandText}>
              <h1>DocuMind</h1>
              <p>Private AI Chatbot</p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(false)}
            className={styles.mobileCloseButton}
            aria-label="Close sidebar"
          >
            <FontAwesomeIcon icon={faXmark} className={styles.menuIcon} />
          </button>
        </div>

        <div className={styles.topAction}>
          <button
            onClick={() => {
              onUpload();
              setMobileOpen(false);
            }}
            className={styles.newButton}
          >
            <span className={styles.plusIcon}>
              <FontAwesomeIcon icon={faPlus} />
            </span>
            <span>New Document</span>
          </button>
        </div>

        <div className={styles.sectionLabel}>Recent</div>

        <div className={styles.docList}>
          {docList.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              <p className={styles.emptyTitle}>No documents uploaded yet</p>
              <p className={styles.emptyText}>Upload a file to start chatting</p>
            </div>
          ) : (
            docList.map(([docId, doc]) => {
              const active = activeDocId === docId;
              const messageCount = doc?.messages?.length || 0;

              return (
                <button
                  key={docId}
                  onClick={() => handleSelect(docId)}
                  className={`${styles.docItem} ${active ? styles.docItemActive : ''}`}
                >
                  <div className={styles.docIcon}>
                    <FontAwesomeIcon icon={getFileIcon(doc?.name)} />
                  </div>

                  <div className={styles.docMeta}>
                    <div className={styles.docTitleRow}>
                      <p className={styles.docName}>{cleanName(doc?.name || 'Untitled')}</p>
                      {active && <span className={styles.activeDot}></span>}
                    </div>

                    <p className={styles.docCount}>
                      {messageCount === 0
                        ? 'No messages yet'
                        : `${messageCount} message${messageCount > 1 ? 's' : ''}`}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <p>Answers grounded in your documents</p>
        </div>
      </aside>
    </>
  );
}