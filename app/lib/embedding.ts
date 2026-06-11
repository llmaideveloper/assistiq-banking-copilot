// Free-tier deterministic embedding helper.
// This avoids requiring a paid embedding provider while still enabling pgvector-based retrieval.
// For production, replace with a model embedding provider such as OpenAI, Cohere, Bedrock, or Gemini embeddings.

export function createDeterministicEmbedding(input: string, dimensions = 1536): number[] {
  const vector = new Array(dimensions).fill(0);
  const tokens = input
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  for (const token of tokens) {
    const hash = hashToken(token);
    const index = Math.abs(hash) % dimensions;
    const sign = hash % 2 === 0 ? 1 : -1;
    vector[index] += sign * tokenWeight(token);
  }

  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => Number((value / norm).toFixed(8)));
}

function hashToken(token: string): number {
  let hash = 2166136261;

  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash | 0;
}

function tokenWeight(token: string): number {
  if (token.length >= 12) return 1.35;
  if (token.length >= 8) return 1.2;
  if (token.length <= 3) return 0.65;
  return 1;
}
