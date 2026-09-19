-- Migration Script: Create match_knowledge_chunks RPC
-- Created on: 2026-07-08
-- Purpose: Performs cosine similarity vector search on document_chunks table, 
-- joining with knowledge_documents to strictly filter active documents (is_active = true)

CREATE OR REPLACE FUNCTION match_knowledge_chunks (
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN knowledge_documents kd ON dc.document_id = kd.id
  WHERE kd.is_active = true
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
