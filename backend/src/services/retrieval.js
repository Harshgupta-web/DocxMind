import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { CohereClient } from 'cohere-ai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ChromaClient } from 'chromadb';
import { buildPrompt } from '../utils/promptTemplate.js';

export async function queryDocument(docId, question, res) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error('GEMINI_API_KEY is missing.');

    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: geminiKey,
      model: 'gemini-embedding-001',
    });

    console.log('🔢 Generating query embedding for the query...');
    const queryVector = await embeddings.embedQuery(question);

    console.log('📦 Connecting to ChromaDB (v2)...');
    const client = new ChromaClient({ 
      host: '127.0.0.1', 
      port: 8000 
    });

    // Provide an empty/dummy embeddingFunction to prevent default embedding checks
    const collection = await client.getCollection({ 
      name: docId,
      embeddingFunction: { generate: (texts) => Promise.resolve([]) } 
    });

    console.log('🔍 Running similarity search...');
    const queryResult = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: 10,
    });

    if (!queryResult || !queryResult.documents[0] || !queryResult.documents[0].length) {
      throw new Error("No data found for this document.");
    }

    const topChunks = queryResult.documents[0].map((doc, index) => ({
      pageContent: doc,
      metadata: queryResult.metadatas[0][index],
    }));

    console.log('🎯 Reranking with Cohere...');
    const cohere = new CohereClient({
      token: process.env.COHERE_API_KEY || process.env.CO_API_KEY,
    });

    const reranked = await cohere.rerank({
      model: 'rerank-english-v3.0',
      query: question,
      documents: topChunks.map((c) => c.pageContent),
      topN: 4,
    });

    const bestChunks = reranked.results.map((r) => topChunks[r.index]);
    const context = bestChunks.map((c) => c.pageContent).join('\n\n---\n\n');

    const sources = bestChunks.map((c) => ({
      chunkIndex: c.metadata.chunkIndex,
      page: c.metadata.page,
      fileName: c.metadata.fileName,
      preview: c.pageContent.slice(0, 150) + '...',
    }));

    const prompt = buildPrompt(context, question);

    console.log('🤖 Streaming Gemini response...');
    const genAI = new GoogleGenerativeAI(geminiKey);
    
    // Updated: Using 'gemini-2.5-flash' for stable and standard text generation
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const streamResult = await model.generateContentStream(prompt);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`event: sources\ndata: ${JSON.stringify(sources)}\n\n`);

    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`event: token\ndata: ${JSON.stringify(text)}\n\n`);
      }
    }

    res.write(`event: done\ndata: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('❌ RETRIEVAL ERROR:', error.message);
    if (!res.writableEnded) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: error.message })}\n\n`);
      res.end();
    }
  }
}