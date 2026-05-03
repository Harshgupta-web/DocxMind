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

    console.log('📦 Connecting to ChromaDB...');
    const chromaUrl = process.env.CHROMA_URL || 'http://127.0.0.1:8000';
    const client = new ChromaClient({
      path: chromaUrl,
    });

    const collection = await client.getCollection({
      name: docId,
      embeddingFunction: {
        generate: async () => [],
      },
    });

    console.log('🔍 Running similarity search...');
    const queryResult = await collection.query({
      queryEmbeddings: [queryVector],
      nResults: 10,
    });

    if (!queryResult || !queryResult.documents?.[0]?.length) {
      throw new Error('No data found for this document.');
    }

    const topChunks = queryResult.documents[0].map((doc, index) => ({
      pageContent: doc,
      metadata: queryResult.metadatas?.[0]?.[index] || {},
    }));

    console.log('🎯 Reranking with Cohere...');
    const cohereKey = process.env.COHERE_API_KEY || process.env.CO_API_KEY;
    if (!cohereKey) throw new Error('COHERE_API_KEY is missing.');

    const cohere = new CohereClient({
      token: cohereKey,
    });

    const reranked = await cohere.rerank({
      model: 'rerank-english-v3.0',
      query: question,
      documents: topChunks.map((chunk) => chunk.pageContent),
      topN: 4,
    });

    const bestChunks = reranked.results.map((result) => topChunks[result.index]);
    const context = bestChunks.map((chunk) => chunk.pageContent).join('\n\n---\n\n');

    const sources = bestChunks.map((chunk) => ({
      chunkIndex: chunk.metadata.chunkIndex,
      page: chunk.metadata.page,
      fileName: chunk.metadata.fileName,
      preview: chunk.pageContent.slice(0, 150) + '...',
    }));

    const prompt = buildPrompt(context, question);

    console.log('🤖 Streaming Gemini response...');
    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const streamResult = await model.generateContentStream(prompt);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.write(`data: ${JSON.stringify(sources)}\n\n`);

    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify(text)}\n\n`);
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('❌ RETRIEVAL ERROR:', error.message);

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify('Error: ' + error.message)}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    }
  }
}