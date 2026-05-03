// import { Chroma } from '@langchain/community/vectorstores/chroma';
// import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

// export function getEmbeddings() {
//   return new GoogleGenerativeAIEmbeddings({
//     apiKey: process.env.GEMINI_API_KEY,
//     model: 'text-embedding-001', 
//   });
// }

// export async function loadIndex(docId) {
//   try {
//     return await Chroma.fromExistingCollection(getEmbeddings(), {
//       collectionName: docId,
//       url: 'http://localhost:8000',
//     });
//   } catch (error) {
//     console.error(`❌ Error loading collection ${docId} from ChromaDB:`, error.message);
//     throw error;
//   }
// }

// export async function saveIndex(vectorStore, docId) {
//   // ChromaDB auto-persists, nothing needed here
//   console.log(`✅ Collection ${docId} already persisted in ChromaDB`);
// }

// export function indexExists(docId) {
//   // ChromaDB handles indexes internally
//   return true;
// }




import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChromaClient } from 'chromadb';

// Reusable embeddings instance
export function getEmbeddings() {
  return new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-embedding-001', // Updated to currently supported model
  });
}

// Get a single ChromaDB client instance
export function getChromaClient() {
  // Fixed instantiation for Chroma v2
  return new ChromaClient({ path: 'http://127.0.0.1:8000' });
}

// Get an existing collection by docId
export async function getCollection(docId) {
  try {
    const client = getChromaClient();
    const collection = await client.getCollection({
      name: docId,
    });
    console.log(`✅ Loaded collection: ${docId}`);
    return collection;
  } catch (error) {
    console.error(`❌ Collection not found for docId: ${docId}`);
    throw new Error(`Collection ${docId} does not exist in ChromaDB.`);
  }
}

// Check if a collection already exists (used to avoid re-ingesting)
export async function collectionExists(docId) {
  try {
    const client = getChromaClient();
    const collections = await client.listCollections();
    return collections.some((c) => c.name === docId);
  } catch {
    return false;
  }
}

// Delete a collection by docId (useful for re-upload of same doc)
export async function deleteCollection(docId) {
  try {
    const client = getChromaClient();
    await client.deleteCollection({ name: docId });
    console.log(`🗑️ Deleted collection: ${docId}`);
  } catch (error) {
    console.error(`❌ Failed to delete collection ${docId}:`, error.message);
    throw error;
  }
}

// ChromaDB auto-persists — no manual save needed
export async function saveIndex(docId) {
  console.log(`✅ Collection ${docId} already persisted in ChromaDB automatically`);
}