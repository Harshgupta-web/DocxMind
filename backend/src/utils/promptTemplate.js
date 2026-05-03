export function buildPrompt(context, question) {
  return `You are a document assistant. Answer ONLY using the context provided below.
If the answer is not present in the context, respond with exactly: "This information is not in the document."
Do not make up any information. Do not use any outside knowledge.

Context:
${context}

Question: ${question}

Answer:`;
}