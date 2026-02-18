"""Data models for RAG service."""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DocumentStatus(str, Enum):
    """Document processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UserRole(str, Enum):
    """User roles for access control."""
    ADMIN = "admin"
    USER = "user"
    AUDITOR = "auditor"


class DocumentMetadata(BaseModel):
    """Metadata for a document."""
    title: str
    author: Optional[str] = None
    source: Optional[str] = None
    document_type: str = "regulation"  # regulation, law, guideline, memo
    jurisdiction: str = "SAMA"  # SAMA, CMA, other
    effective_date: Optional[datetime] = None
    version: str = "1.0"
    language: str = "ar"  # ar, en, both
    page_count: int = 0
    file_size_bytes: int = 0


class DocumentUploadRequest(BaseModel):
    """Request model for document upload."""
    metadata: DocumentMetadata
    

class DocumentUploadResponse(BaseModel):
    """Response model for document upload."""
    document_id: str
    status: DocumentStatus
    message: str
    metadata: DocumentMetadata


class DocumentChunk(BaseModel):
    """A chunk of a document with embeddings."""
    chunk_id: str
    document_id: str
    content: str
    page_number: int
    chunk_index: int
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SearchQuery(BaseModel):
    """Search query request."""
    query: str = Field(..., min_length=1, max_length=1000)
    language: str = Field(default="ar", pattern="^(ar|en)$")
    top_k: int = Field(default=5, ge=1, le=20)
    filters: Optional[Dict[str, Any]] = None
    include_sources: bool = True


class SearchResult(BaseModel):
    """Single search result."""
    document_id: str
    document_title: str
    content: str
    page_number: int
    relevance_score: float
    metadata: Dict[str, Any]


class SearchResponse(BaseModel):
    """Search results response."""
    query: str
    results: List[SearchResult]
    total_results: int
    language: str


class ChatRequest(BaseModel):
    """Chat request with RAG."""
    message: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(default="ar", pattern="^(ar|en)$")
    conversation_id: Optional[str] = None
    use_rag: bool = True
    top_k: int = Field(default=3, ge=1, le=10)


class SourceCitation(BaseModel):
    """Source citation with page number."""
    document_id: str
    document_title: str
    page_number: int
    excerpt: str
    relevance_score: float


class ChatResponse(BaseModel):
    """Chat response with sources."""
    message: str
    sources: List[SourceCitation]
    conversation_id: str
    language: str


class DocumentVersionInfo(BaseModel):
    """Document version information."""
    document_id: str
    version: str
    created_at: datetime
    updated_at: datetime
    updated_by: str
    change_description: Optional[str] = None
    is_current: bool


class DocumentListResponse(BaseModel):
    """List of documents."""
    documents: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    version: str
    timestamp: datetime
    vector_db: str
    vector_db_status: str
