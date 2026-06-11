-- AssistIQ Vector RAG setup for Supabase PostgreSQL + pgvector
-- Run this in Supabase SQL Editor.

create extension if not exists vector;

create or replace function match_document_chunks(
  query_embedding vector,
  match_count int default 5
)
returns table (
  id uuid,
  document_id text,
  section text,
  content text,
  similarity double precision
)
language sql
stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.section,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where dc.embedding is not null
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

-- Optional index for larger datasets. If this fails, skip it for the demo.
create index if not exists document_chunks_embedding_ivfflat_idx
on document_chunks
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
