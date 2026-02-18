"""Vector database abstraction layer."""

import logging
from typing import List, Dict, Any, Optional
from abc import ABC, abstractmethod
import uuid

from ..config import settings
from ..models import DocumentChunk, SearchResult

logger = logging.getLogger(__name__)


class VectorStore(ABC):
    """Abstract base class for vector storage."""
    
    @abstractmethod
    async def initialize(self):
        """Initialize vector store."""
        pass
    
    @abstractmethod
    async def add_documents(self, chunks: List[DocumentChunk]) -> bool:
        """Add document chunks to vector store."""
        pass
    
    @abstractmethod
    async def search(self, query_embedding: List[float], top_k: int = 5, filters: Optional[Dict] = None) -> List[SearchResult]:
        """Search for similar documents."""
        pass
    
    @abstractmethod
    async def delete_document(self, document_id: str) -> bool:
        """Delete all chunks for a document."""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if vector store is healthy."""
        pass


class PineconeStore(VectorStore):
    """Pinecone vector storage implementation."""
    
    def __init__(self):
        self.index = None
        self.initialized = False
    
    async def initialize(self):
        """Initialize Pinecone index."""
        try:
            import pinecone
            
            pinecone.init(
                api_key=settings.pinecone_api_key,
                environment=settings.pinecone_environment
            )
            
            # Check if index exists, create if not
            if settings.pinecone_index_name not in pinecone.list_indexes():
                pinecone.create_index(
                    name=settings.pinecone_index_name,
                    dimension=settings.embedding_dimensions,
                    metric="cosine"
                )
                logger.info(f"Created Pinecone index: {settings.pinecone_index_name}")
            
            self.index = pinecone.Index(settings.pinecone_index_name)
            self.initialized = True
            logger.info("Pinecone initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {e}")
            raise
    
    async def add_documents(self, chunks: List[DocumentChunk]) -> bool:
        """Add document chunks to Pinecone."""
        if not self.initialized:
            await self.initialize()
        
        try:
            vectors = []
            for chunk in chunks:
                vectors.append({
                    'id': chunk.chunk_id,
                    'values': chunk.embedding,
                    'metadata': {
                        'document_id': chunk.document_id,
                        'content': chunk.content[:1000],  # Pinecone metadata limit
                        'page_number': chunk.page_number,
                        'chunk_index': chunk.chunk_index,
                        **chunk.metadata
                    }
                })
            
            # Upsert in batches of 100
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                self.index.upsert(vectors=batch)
            
            logger.info(f"Added {len(chunks)} chunks to Pinecone")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add documents to Pinecone: {e}")
            return False
    
    async def search(self, query_embedding: List[float], top_k: int = 5, filters: Optional[Dict] = None) -> List[SearchResult]:
        """Search Pinecone for similar documents."""
        if not self.initialized:
            await self.initialize()
        
        try:
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter=filters
            )
            
            search_results = []
            for match in results.matches:
                metadata = match.metadata
                search_results.append(SearchResult(
                    document_id=metadata.get('document_id', ''),
                    document_title=metadata.get('document_title', ''),
                    content=metadata.get('content', ''),
                    page_number=metadata.get('page_number', 0),
                    relevance_score=match.score,
                    metadata=metadata
                ))
            
            return search_results
            
        except Exception as e:
            logger.error(f"Failed to search Pinecone: {e}")
            return []
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete document from Pinecone."""
        if not self.initialized:
            await self.initialize()
        
        try:
            self.index.delete(filter={'document_id': document_id})
            logger.info(f"Deleted document {document_id} from Pinecone")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            return False
    
    async def health_check(self) -> bool:
        """Check Pinecone health."""
        try:
            if not self.initialized:
                await self.initialize()
            stats = self.index.describe_index_stats()
            return True
        except:
            return False


class PgVectorStore(VectorStore):
    """PostgreSQL + pgvector storage implementation."""
    
    def __init__(self):
        self.conn = None
        self.initialized = False
    
    async def initialize(self):
        """Initialize PostgreSQL connection and pgvector extension."""
        try:
            import psycopg2
            from psycopg2.extras import execute_values
            
            self.conn = psycopg2.connect(
                host=settings.postgres_host,
                port=settings.postgres_port,
                dbname=settings.postgres_db,
                user=settings.postgres_user,
                password=settings.postgres_password
            )
            
            cursor = self.conn.cursor()
            
            # Enable pgvector extension
            cursor.execute("CREATE EXTENSION IF NOT EXISTS vector")
            
            # Create tables
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS documents (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            cursor.execute(f"""
                CREATE TABLE IF NOT EXISTS document_chunks (
                    id TEXT PRIMARY KEY,
                    document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
                    content TEXT,
                    page_number INTEGER,
                    chunk_index INTEGER,
                    embedding vector({settings.embedding_dimensions}),
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create index for similarity search
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_embedding 
                ON document_chunks USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100)
            """)
            
            self.conn.commit()
            cursor.close()
            
            self.initialized = True
            logger.info("PostgreSQL + pgvector initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize pgvector: {e}")
            raise
    
    async def add_documents(self, chunks: List[DocumentChunk]) -> bool:
        """Add document chunks to PostgreSQL."""
        if not self.initialized:
            await self.initialize()
        
        try:
            cursor = self.conn.cursor()
            
            # Insert chunks
            for chunk in chunks:
                cursor.execute("""
                    INSERT INTO document_chunks 
                    (id, document_id, content, page_number, chunk_index, embedding, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE SET
                        content = EXCLUDED.content,
                        embedding = EXCLUDED.embedding,
                        metadata = EXCLUDED.metadata
                """, (
                    chunk.chunk_id,
                    chunk.document_id,
                    chunk.content,
                    chunk.page_number,
                    chunk.chunk_index,
                    chunk.embedding,
                    chunk.metadata
                ))
            
            self.conn.commit()
            cursor.close()
            
            logger.info(f"Added {len(chunks)} chunks to PostgreSQL")
            return True
            
        except Exception as e:
            logger.error(f"Failed to add documents to PostgreSQL: {e}")
            self.conn.rollback()
            return False
    
    async def search(self, query_embedding: List[float], top_k: int = 5, filters: Optional[Dict] = None) -> List[SearchResult]:
        """Search PostgreSQL for similar documents."""
        if not self.initialized:
            await self.initialize()
        
        try:
            cursor = self.conn.cursor()
            
            # Cosine similarity search
            cursor.execute(f"""
                SELECT 
                    document_id,
                    content,
                    page_number,
                    metadata,
                    1 - (embedding <=> %s::vector) as similarity
                FROM document_chunks
                ORDER BY embedding <=> %s::vector
                LIMIT %s
            """, (query_embedding, query_embedding, top_k))
            
            results = cursor.fetchall()
            cursor.close()
            
            search_results = []
            for row in results:
                document_id, content, page_number, metadata, similarity = row
                search_results.append(SearchResult(
                    document_id=document_id,
                    document_title=metadata.get('document_title', ''),
                    content=content,
                    page_number=page_number,
                    relevance_score=similarity,
                    metadata=metadata
                ))
            
            return search_results
            
        except Exception as e:
            logger.error(f"Failed to search PostgreSQL: {e}")
            return []
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete document from PostgreSQL."""
        if not self.initialized:
            await self.initialize()
        
        try:
            cursor = self.conn.cursor()
            cursor.execute("DELETE FROM documents WHERE id = %s", (document_id,))
            self.conn.commit()
            cursor.close()
            
            logger.info(f"Deleted document {document_id} from PostgreSQL")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            self.conn.rollback()
            return False
    
    async def health_check(self) -> bool:
        """Check PostgreSQL health."""
        try:
            if not self.initialized:
                await self.initialize()
            cursor = self.conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            return True
        except:
            return False


def get_vector_store() -> VectorStore:
    """Get configured vector store instance."""
    if settings.vector_db_type == "pinecone":
        return PineconeStore()
    elif settings.vector_db_type == "pgvector":
        return PgVectorStore()
    else:
        raise ValueError(f"Unsupported vector database type: {settings.vector_db_type}")
