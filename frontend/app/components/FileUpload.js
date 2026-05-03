'use client';
import { useRef, useState } from 'react';
import axios from 'axios';
import styles from './FileUpload.module.css';

export default function FileUpload({ onUploadSuccess }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const inputRef = useRef(null);

  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ];

  const handleFile = async (file) => {
    if (!file) return;

    if (!allowed.includes(file.type)) {
      setError('Only PDF, DOCX, and TXT files are supported.');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);
    setStage('Uploading document...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (event) => {
            if (!event.total) return;
            const percent = Math.round((event.loaded * 100) / event.total);
            setProgress(percent);

            if (percent < 100) {
              setStage(`Uploading document... ${percent}%`);
            } else {
              setStage('Processing document...');
            }
          },
        }
      );

      const data = res.data;

      setProgress(100);
      setStage('Finishing setup...');

      if (data.success) {
        setTimeout(() => {
          onUploadSuccess(data.docId, data.fileName);
        }, 500);
      } else {
        setError(data.error || 'Upload failed.');
        setUploading(false);
        setStage('');
        setProgress(0);
      }
    } catch (err) {
      setError('Server error. Make sure the backend is running.');
      setUploading(false);
      setStage('');
      setProgress(0);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <section className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Chat with your documents</h1>
          <p className={styles.subtitle}>
            Upload a PDF, DOCX, or TXT file and ask questions with grounded answers and source citations.
          </p>
        </div>

        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className={styles.hiddenInput}
            onChange={(e) => handleFile(e.target.files?.[0])}
            disabled={uploading}
          />

          {!uploading ? (
            <>
              <div className={styles.fileIcon}>📄</div>
              <h2 className={styles.dropTitle}>Drop your file here</h2>
              <p className={styles.dropText}>Or click to browse from your device</p>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    inputRef.current?.click();
                  }}
                >
                  Choose File
                </button>
                <span className={styles.fileTypes}>PDF, DOCX, TXT</span>
              </div>
            </>
          ) : (
            <>
              <div className={styles.loaderWrap}>
                <div className={styles.loader}></div>
              </div>

              <h2 className={styles.dropTitle}>Processing your document</h2>
              <p className={styles.dropText}>{stage}</p>

              <div className={styles.progressBar}>
                <div
                  className={`${styles.progressFill} ${progress >= 100 ? styles.progressDone : ''}`}
                  style={{ width: `${Math.max(progress, 8)}%` }}
                ></div>
              </div>

              <p className={styles.progressPercent}>{progress}%</p>
            </>
          )}
        </div>

        <div className={styles.features}>
          <div className={styles.featureCard}>
            <h3>Private by design</h3>
            <p>Your document is processed for retrieval and question answering.</p>
          </div>

          <div className={styles.featureCard}>
            <h3>Answers with sources</h3>
            <p>Each response is grounded in relevant chunks from your document.</p>
          </div>

          <div className={styles.featureCard}>
            <h3>Multi-document ready</h3>
            <p>Upload multiple files and keep separate chats for each one.</p>
          </div>
        </div>

        <div className={styles.tags}>
          {['Private document chat', 'Source citations', 'Fast retrieval', 'Responsive UI'].map((item) => (
            <span key={item} className={styles.tag}>
              {item}
            </span>
          ))}
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}
      </div>
    </section>
  );
}