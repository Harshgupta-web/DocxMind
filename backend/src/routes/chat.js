import express from 'express';
import { queryDocument } from '../services/retrieval.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { docId, question } = req.body;

  if (!docId || !question) {
    return res.status(400).json({ error: 'docId and question are required' });
  }

  try {
    await queryDocument(docId, question, res);
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default router;