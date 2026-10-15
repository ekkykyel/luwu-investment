-- Migration Script: Initialize Enterprise RAG Knowledge Base Schema
-- Created on: 2026-07-08

-- Clean up rogue tables to strictly align database schema names
DROP TABLE IF EXISTS rag_documents CASCADE;
DROP TABLE IF EXISTS knowledge_base_documents CASCADE;

-- 1. Enable Vector Extension (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Table: knowledge_documents (Metadata Header)
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('demografi', 'ekonomi', 'tata_ruang', 'lingkungan', 'regulasi')),
    source_agency TEXT NOT NULL,
    publication_year INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    file_path TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Table: document_chunks (The Brain Cells)
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(1536) NOT NULL,
    page_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Standard Indexes for Filtering and Performance
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_category ON knowledge_documents (category);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_is_active ON knowledge_documents (is_active);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks (document_id);

-- 5. Create HNSW Vector Index for Cosine Distance Similarity Searches
-- Using 1536 dimensions corresponding to standard embeddings (e.g., text-embedding-3-small or text-embedding-ada-002)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw
ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 6. Enable Row Level Security (RLS) for Secure Multi-tenant/Role Access
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies
-- Allow public read access to active documents and their chunks
CREATE POLICY "Allow public read of active knowledge documents" 
ON knowledge_documents 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Allow public read of active document chunks" 
ON document_chunks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM knowledge_documents d 
    WHERE d.id = document_chunks.document_id AND d.is_active = true
  )
);

-- Allow authenticated administrative users to perform write/modify operations
CREATE POLICY "Allow authenticated users to insert knowledge documents" 
ON knowledge_documents 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update knowledge documents" 
ON knowledge_documents 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to delete knowledge documents" 
ON knowledge_documents 
FOR DELETE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to insert document chunks" 
ON document_chunks 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update document chunks" 
ON document_chunks 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated users to delete document chunks" 
ON document_chunks 
FOR DELETE 
TO authenticated 
USING (true);
