"""API routes for RAG service."""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Header
from typing import Optional, List
from pathlib import Path
import logging
import tempfile
import shutil

from ..models import (
    DocumentUploadRequest, DocumentUploadResponse,
    SearchQuery, SearchResponse,
    ChatRequest, ChatResponse,
    DocumentListResponse, UserRole, DocumentStatus
)
from ..services import RAGService, DocumentService, EmbeddingsService, get_vector_store
from ..config import settings

logger = logging.getLogger(__name__)
router = APIRouter()

# Service instances
rag_service = RAGService()
document_service = DocumentService()
embeddings_service = EmbeddingsService()
vector_store = get_vector_store()


async def verify_admin_token(x_admin_token: Optional[str] = Header(None)):
    """Verify admin token."""
    if not x_admin_token or x_admin_token != settings.admin_token:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    return UserRole.ADMIN


async def get_user_role(x_admin_token: Optional[str] = Header(None)) -> UserRole:
    """Get user role from token."""
    if x_admin_token == settings.admin_token:
        return UserRole.ADMIN
    # In production, implement proper JWT/OAuth token validation
    return UserRole.USER


@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: str = None,
    author: str = None,
    document_type: str = "regulation",
    jurisdiction: str = "SAMA",
    language: str = "ar",
    version: str = "1.0",
    user_role: UserRole = Depends(verify_admin_token)
):
    """
    Upload and process a PDF document.
    
    - **file**: PDF file to upload
    - **title**: Document title
    - **author**: Document author
    - **document_type**: Type (regulation, law, guideline, memo)
    - **jurisdiction**: Jurisdiction (SAMA, CMA, other)
    - **language**: Language (ar, en, both)
    - **version**: Document version
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Check file size
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > settings.max_file_size_mb * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum of {settings.max_file_size_mb}MB"
        )
    
    # Save to temp file
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(content)
            tmp_path = Path(tmp_file.name)
        
        # Create metadata
        from ..models import DocumentMetadata
        metadata = DocumentMetadata(
            title=title or file.filename,
            author=author,
            document_type=document_type,
            jurisdiction=jurisdiction,
            language=language,
            version=version,
            page_count=0,  # Will be updated during processing
            file_size_bytes=file_size
        )
        
        # Process document
        document_id, status = await document_service.upload_document(
            file_path=tmp_path,
            metadata=metadata,
            user_role=user_role
        )
        
        # Cleanup temp file
        tmp_path.unlink()
        
        return DocumentUploadResponse(
            document_id=document_id,
            status=status,
            message="Document uploaded and processed successfully" if status == DocumentStatus.COMPLETED
                    else "Document processing failed",
            metadata=metadata
        )
        
    except Exception as e:
        logger.error(f"Failed to upload document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents", response_model=DocumentListResponse)
async def list_documents(
    page: int = 1,
    page_size: int = 20,
    user_role: UserRole = Depends(get_user_role)
):
    """List all documents with pagination."""
    try:
        documents, total = await document_service.list_documents(
            user_role=user_role,
            page=page,
            page_size=page_size
        )
        
        return DocumentListResponse(
            documents=documents,
            total=total,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        logger.error(f"Failed to list documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{document_id}")
async def get_document(
    document_id: str,
    user_role: UserRole = Depends(get_user_role)
):
    """Get document details."""
    try:
        document = await document_service.get_document(document_id, user_role)
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return document
        
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")
    except Exception as e:
        logger.error(f"Failed to get document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    user_role: UserRole = Depends(verify_admin_token)
):
    """Delete a document (admin only)."""
    try:
        success = await document_service.delete_document(document_id, user_role)
        
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document deleted successfully"}
        
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied")
    except Exception as e:
        logger.error(f"Failed to delete document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/search", response_model=SearchResponse)
async def search_documents(
    query: SearchQuery,
    user_role: UserRole = Depends(get_user_role)
):
    """
    Search documents using semantic search.
    
    - **query**: Search query text
    - **language**: Language (ar or en)
    - **top_k**: Number of results to return
    - **include_sources**: Include source citations
    """
    try:
        # Generate query embedding
        query_embedding = embeddings_service.generate_embedding(query.query)
        
        # Search vector store
        results = await vector_store.search(
            query_embedding=query_embedding,
            top_k=query.top_k,
            filters=query.filters
        )
        
        return SearchResponse(
            query=query.query,
            results=results,
            total_results=len(results),
            language=query.language
        )
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user_role: UserRole = Depends(get_user_role)
):
    """
    Chat with RAG-powered assistant.
    
    - **message**: User message
    - **language**: Language (ar or en)
    - **use_rag**: Enable RAG (retrieve relevant documents)
    - **top_k**: Number of documents to retrieve for context
    """
    try:
        response = await rag_service.chat(request)
        return response
        
    except Exception as e:
        logger.error(f"Chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/documents/{document_id}/versions")
async def get_document_versions(
    document_id: str,
    user_role: UserRole = Depends(get_user_role)
):
    """Get version history for a document."""
    try:
        versions = await document_service.get_document_versions(document_id)
        return {"document_id": document_id, "versions": versions}
        
    except Exception as e:
        logger.error(f"Failed to get versions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
