-- Migration Script: Vector Index and Performance Optimization for RAG Knowledge Base

-- 1. Create HNSW Index (pgvector) on the embedding column
-- This enables lightning-fast approximate nearest neighbor (ANN) search using cosine distance
-- Parameters: 
--  m: Max number of connections per layer (16 is a good balance for 768-dim embeddings)
--  ef_construction: Size of the dynamic candidate list for index construction (64 provides good recall tradeoff)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding_hnsw 
ON knowledge_base_documents 
USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- 2. Create B-Tree Index for Distinct Querying
-- This standard index dramatically accelerates the 'SELECT DISTINCT document_name' query used in the UI
CREATE INDEX IF NOT EXISTS idx_knowledge_base_document_name 
ON knowledge_base_documents (document_name);
