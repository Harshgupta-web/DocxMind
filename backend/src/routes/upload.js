import express from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import { ingestDocument } from '../services/ingestion.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${uuid()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF, DOCX, and TXT files are allowed'));
  },
});

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    console.log(`📁 Received file: ${req.file.originalname}`);
    const docId = uuid();
    const result = await ingestDocument(req.file.path, req.file.originalname, docId);
    res.json({ success: true, docId, fileName: req.file.originalname, ...result });

  } catch (error) {
    console.error('❌ Upload route error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;