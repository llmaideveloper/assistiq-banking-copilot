# README Update: Vector RAG Upgrade

Add or merge this section into your README.md.

## Vector RAG Upgrade

AssistIQ now supports policy retrieval using Supabase PostgreSQL with pgvector.

The `/api/assist` route performs the following workflow:

1. Receives the customer ID and review question.
2. Fetches customer, loan, and payment data from Supabase.
3. Creates a free-tier deterministic query embedding.
4. Searches `document_chunks.embedding` through the `match_document_chunks` RPC.
5. Retrieves the most relevant policy evidence.
6. Sends customer context and retrieved policy evidence to Groq LLM.
7. Returns a structured decision-support response.
8. Stores the interaction in `ai_audit_log`.

```mermaid
flowchart TD
    A[Next.js UI] --> B[/api/assist]
    B --> C[(Supabase PostgreSQL)]
    C --> D[Customer Profile]
    C --> E[Loan History]
    C --> F[Payment Records]
    B --> G[Create Query Embedding]
    G --> H[pgvector Search]
    H --> I[Top Policy Chunks]
    D --> J[AI Review Context]
    E --> J
    F --> J
    I --> J
    J --> K[Groq LLM]
    K --> L[Structured Decision Support JSON]
    L --> M[UI Recommendation]
    L --> N[(ai_audit_log)]
```

### Free-tier design

This implementation uses:

- Supabase free tier for PostgreSQL and pgvector
- Groq free tier for LLM inference
- Deterministic local embeddings to avoid a paid embedding API

For production, deterministic embeddings can be replaced with a dedicated embedding model provider.

## GitHub README Link on Frontend

The frontend footer can link to the GitHub repository README by setting:

```env
NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/YOUR_USERNAME/YOUR_REPO
```

This lets hiring managers open the source code and architecture documentation directly from the live demo UI.
