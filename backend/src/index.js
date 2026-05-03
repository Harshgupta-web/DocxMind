import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload.js';
import chatRouter from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json());

app.use('/api/upload', uploadRouter);
app.use('/api/chat', chatRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`DocuMind backend running on port ${PORT}`);
});