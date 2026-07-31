/**
 * TypeScript definitions for the Regency RAG Knowledge Base System.
 * Matches the Supabase Postgres schema in /supabase/migrations/20260708_init_knowledge_base.sql
 */

export type DocumentCategory = 'demografi' | 'ekonomi' | 'tata_ruang' | 'lingkungan' | 'regulasi';
export type DocumentStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  source_agency: string;
  publication_year: number;
  status: DocumentStatus;
  file_path?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  embedding: number[]; // Array of 1536 floating-point numbers for pgvector
  page_number?: number | null;
  created_at: string;
}

/**
 * Input payloads for creating or updating records
 */
export type CreateKnowledgeDocumentInput = Omit<KnowledgeDocument, 'id' | 'created_at'>;
export type UpdateKnowledgeDocumentInput = Partial<CreateKnowledgeDocumentInput>;

export type CreateDocumentChunkInput = Omit<DocumentChunk, 'id' | 'created_at'>;
export type UpdateDocumentChunkInput = Partial<CreateDocumentChunkInput>;

/**
 * Filter query params when retrieving knowledge documents
 */
export interface KnowledgeDocumentFilters {
  category?: DocumentCategory;
  source_agency?: string;
  publication_year?: number;
  is_active?: boolean;
}
