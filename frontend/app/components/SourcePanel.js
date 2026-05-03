'use client';
import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import styles from './SourcePanel.module.css';

export default function SourcePanel({ sources = [] }) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <button
        className={styles.collapsedToggle}
        onClick={() => setCollapsed(false)}
        title="Show sources"
      >
        <span className={styles.collapsedIcon}>
          <FontAwesomeIcon icon={faPaperclip} />
        </span>
      </button>
    );
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <FontAwesomeIcon icon={faPaperclip} />
          </div>
          <div>
            <h3 className={styles.title}>Sources</h3>
            <p className={styles.subtitle}>
              {sources.length > 0
                ? `${sources.length} source${sources.length > 1 ? 's' : ''} used`
                : 'Context will appear here'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setCollapsed(true)}
          className={styles.closeBtn}
          title="Hide sources"
        >
          ✕
        </button>
      </div>

      <div className={styles.body}>
        {sources.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h4>No sources yet</h4>
            <p>
              Ask a question and the retrieved chunks used to generate the answer
              will appear here.
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {sources.map((src, i) => (
              <div key={i} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.sourceTag}>Source {i + 1}</span>
                  <span className={styles.pageTag}>Page {src.page ?? '-'}</span>
                </div>

                <p className={styles.preview}>
                  {src.preview || 'No preview available.'}
                </p>

                <div className={styles.meta}>
                  <span className={styles.fileName} title={src.fileName}>
                    {src.fileName || 'Unknown file'}
                  </span>
                  <span className={styles.chunkTag}>
                    Chunk #{src.chunkIndex ?? '-'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}