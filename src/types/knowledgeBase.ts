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
  chunk_count?: number;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  embedding: number[]; // Vector embedding
  page_number?: number | null;
  created_at: string;
}

export interface RagStats {
  totalDocuments: number;
  activeDocuments: number;
  totalChunks: number;
  embeddingModel: string;
  isVectorSearchActive: boolean;
  categoriesCount: Record<DocumentCategory, number>;
}

export interface GroundingChunkMatch {
  documentId: string;
  documentTitle: string;
  category: string;
  sourceAgency?: string;
  publicationYear?: number;
  content: string;
  similarity: number;
  pageNumber?: number | null;
}

export interface GroundingTestResult {
  query: string;
  answer: string;
  sources: string[];
  matchedChunks: GroundingChunkMatch[];
  searchDurationMs: number;
  totalDurationMs: number;
  embeddingUsed: string;
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
