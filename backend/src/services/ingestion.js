// import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
// import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
// import { TextLoader } from 'langchain/document_loaders/fs/text';
// import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
// import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
// import { Chroma } from '@langchain/community/vectorstores/chroma';
// import path from 'path';

// export async function ingestDocument(filePath, originalName, docId) {
//   try {
//     console.log('📂 Step 1: Loading document...');
//     const ext = path.extname(originalName).toLowerCase();
//     let loader;

//     if (ext === '.pdf') {
//       loader = new PDFLoader(filePath);
//     } else if (ext === '.docx') {
//       loader = new DocxLoader(filePath);
//     } else {
//       loader = new TextLoader(filePath);
//     }

//     const rawDocs = await loader.load();

//     if (!rawDocs || rawDocs.length === 0) {
//       throw new Error('No content extracted from document');
//     }

//     console.log(`✅ Loaded ${rawDocs.length} pages`);

//     console.log('✂️ Step 2: Splitting into chunks...');
//     const splitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 500,
//       chunkOverlap: 50,
//     });

//     const rawChunks = await splitter.splitDocuments(rawDocs);

//     const chunks = rawChunks
//       .map((chunk) => {
//         chunk.pageContent = chunk.pageContent.replace(/\0/g, '').trim();
//         return chunk;
//       })
//       .filter((chunk) => chunk.pageContent.length > 10);

//     if (chunks.length === 0) {
//       throw new Error(
//         'After cleaning, no text was left. The PDF might be a scanned image or corrupted.'
//       );
//     }

//     console.log(`✅ Created ${chunks.length} valid chunks`);

//     chunks.forEach((chunk, i) => {
//       chunk.metadata = {
//         chunkIndex: i,
//         docId,
//         fileName: originalName,
//         page: chunk.metadata?.page ?? Math.floor(i / 5) + 1,
//       };
//     });

//     console.log('🔢 Step 3: Generating embeddings...');
//     const embeddings = new GoogleGenerativeAIEmbeddings({
//       apiKey: process.env.GEMINI_API_KEY,
//       model: 'gemini-embedding-001',
//     });

//     console.log('🧪 Testing embedding generation for chunk 0...');
//     const testVector = await embeddings.embedQuery(chunks[0].pageContent);

//     if (!testVector || testVector.length === 0) {
//       throw new Error('Test vector was empty.');
//     }

//     console.log(`✅ Gemini test successful! Vector dimension: ${testVector.length}`);

//     console.log('💾 Step 4: Storing in ChromaDB...');
//     await Chroma.fromDocuments(chunks, embeddings, {
//       collectionName: docId,
//       url: process.env.CHROMA_URL || 'http://127.0.0.1:8000',
//     });

//     console.log(`✅ Ingested ${chunks.length} chunks for docId: ${docId}`);
//     return { chunkCount: chunks.length };
//   } catch (error) {
//     console.error('❌ INGESTION ERROR:', error.message);
//     console.error('Full error:', error);
//     throw error;
//   }
// }



import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import path from 'path';

export const documentStores = new Map();

export async function ingestDocument(filePath, originalName, docId) {
  try {
    console.log('📂 Step 1: Loading document...');
    const ext = path.extname(originalName).toLowerCase();
    let loader;

    if (ext === '.pdf') {
      loader = new PDFLoader(filePath);
    } else if (ext === '.docx') {
      loader = new DocxLoader(filePath);
    } else {
      loader = new TextLoader(filePath);
    }

    const rawDocs = await loader.load();

    if (!rawDocs || rawDocs.length === 0) {
      throw new Error('No content extracted from document');
    }

    console.log(`✅ Loaded ${rawDocs.length} pages`);

    console.log('✂️ Step 2: Splitting into chunks...');
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const rawChunks = await splitter.splitDocuments(rawDocs);

    const chunks = rawChunks
      .map((chunk) => {
        chunk.pageContent = chunk.pageContent.replace(/\0/g, '').trim();
        return chunk;
      })
      .filter((chunk) => chunk.pageContent.length > 10);

    if (chunks.length === 0) {
      throw new Error(
        'After cleaning, no text was left. The PDF might be a scanned image or corrupted.'
      );
    }

    console.log(`✅ Created ${chunks.length} valid chunks`);

    chunks.forEach((chunk, i) => {
      chunk.metadata = {
        chunkIndex: i,
        docId,
        fileName: originalName,
        page: chunk.metadata?.page ?? Math.floor(i / 5) + 1,
      };
    });

    console.log('🔢 Step 3: Generating embeddings...');
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'gemini-embedding-001',
    });

    console.log('🧪 Testing embedding generation for chunk 0...');
    const testVector = await embeddings.embedQuery(chunks[0].pageContent);

    if (!testVector || testVector.length === 0) {
      throw new Error('Test vector was empty.');
    }

    console.log(`✅ Gemini test successful! Vector dimension: ${testVector.length}`);

    console.log('💾 Step 4: Storing in memory...');
    const vectorStore = await MemoryVectorStore.fromDocuments(chunks, embeddings);
    documentStores.set(docId, vectorStore);

    console.log(`✅ Ingested ${chunks.length} chunks for docId: ${docId}`);
    return { chunkCount: chunks.length };
  } catch (error) {
    console.error('❌ INGESTION ERROR:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}