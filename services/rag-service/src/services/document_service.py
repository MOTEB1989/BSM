"""Document management service."""

import logging
import uuid
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
import shutil

from ..config import settings
from ..models import (
    DocumentMetadata, DocumentStatus, DocumentChunk,
    DocumentVersionInfo, UserRole
)
from .pdf_processor import PDFProcessor
from .embeddings import EmbeddingsService
from .vector_store import get_vector_store

logger = logging.getLogger(__name__)


class DocumentService:
    """Document management and processing service."""
    
    def __init__(self):
        self.upload_dir = Path(settings.upload_dir)
        self.processed_dir = Path(settings.processed_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
        self.pdf_processor = PDFProcessor()
        self.embeddings_service = EmbeddingsService()
        self.vector_store = get_vector_store()
        
        # In-memory storage for metadata (should be replaced with real DB)
        self.documents_db: Dict[str, Dict[str, Any]] = {}
        self.versions_db: Dict[str, List[DocumentVersionInfo]] = {}
        self.access_control: Dict[str, List[UserRole]] = {}
    
    async def initialize(self):
        """Initialize document service."""
        await self.vector_store.initialize()
        logger.info("Document service initialized")
    
    async def upload_document(
        self,
        file_path: Path,
        metadata: DocumentMetadata,
        user_role: UserRole = UserRole.ADMIN
    ) -> tuple[str, DocumentStatus]:
        """
        Upload and process a document.
        
        Args:
            file_path: Path to uploaded file
            metadata: Document metadata
            user_role: Role of user uploading document
            
        Returns:
            Tuple of (document_id, status)
        """
        # Check role permissions
        if user_role not in [UserRole.ADMIN]:
            raise PermissionError("Only admins can upload documents")
        
        document_id = str(uuid.uuid4())
        
        try:
            # Move file to storage
            storage_path = self.upload_dir / f"{document_id}.pdf"
            shutil.copy(file_path, storage_path)
            
            # Extract and process PDF
            logger.info(f"Processing document {document_id}")
            chunks_data = self.pdf_processor.process_pdf(storage_path)
            
            # Generate embeddings
            logger.info(f"Generating embeddings for {len(chunks_data)} chunks")
            texts = [chunk['content'] for chunk in chunks_data]
            embeddings = self.embeddings_service.generate_embeddings_batch(texts)
            
            # Create document chunks
            chunks = []
            for i, (chunk_data, embedding) in enumerate(zip(chunks_data, embeddings)):
                chunk = DocumentChunk(
                    chunk_id=f"{document_id}_{i}",
                    document_id=document_id,
                    content=chunk_data['content'],
                    page_number=chunk_data['page_number'],
                    chunk_index=chunk_data['chunk_index'],
                    embedding=embedding,
                    metadata={
                        'document_title': metadata.title,
                        'document_type': metadata.document_type,
                        'jurisdiction': metadata.jurisdiction,
                        'language': metadata.language
                    }
                )
                chunks.append(chunk)
            
            # Store in vector database
            logger.info(f"Storing {len(chunks)} chunks in vector database")
            success = await self.vector_store.add_documents(chunks)
            
            if not success:
                raise Exception("Failed to store chunks in vector database")
            
            # Store metadata
            self.documents_db[document_id] = {
                'id': document_id,
                'metadata': metadata.model_dump(),
                'status': DocumentStatus.COMPLETED,
                'created_at': datetime.now().isoformat(),
                'chunk_count': len(chunks),
                'file_path': str(storage_path)
            }
            
            # Initialize version tracking
            self.versions_db[document_id] = [
                DocumentVersionInfo(
                    document_id=document_id,
                    version=metadata.version,
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                    updated_by="system",
                    is_current=True
                )
            ]
            
            # Set access control
            self.access_control[document_id] = [UserRole.ADMIN, UserRole.USER, UserRole.AUDITOR]
            
            logger.info(f"Document {document_id} processed successfully")
            return document_id, DocumentStatus.COMPLETED
            
        except Exception as e:
            logger.error(f"Failed to process document: {e}")
            # Cleanup
            if document_id in self.documents_db:
                del self.documents_db[document_id]
            return document_id, DocumentStatus.FAILED
    
    async def get_document(self, document_id: str, user_role: UserRole) -> Optional[Dict[str, Any]]:
        """Get document metadata."""
        # Check permissions
        if document_id not in self.access_control:
            return None
        
        if user_role not in self.access_control[document_id]:
            raise PermissionError("Access denied")
        
        return self.documents_db.get(document_id)
    
    async def list_documents(
        self,
        user_role: UserRole,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[Dict[str, Any]], int]:
        """List documents with pagination."""
        # Filter by access control
        accessible_docs = [
            doc for doc_id, doc in self.documents_db.items()
            if user_role in self.access_control.get(doc_id, [])
        ]
        
        # Paginate
        start = (page - 1) * page_size
        end = start + page_size
        
        return accessible_docs[start:end], len(accessible_docs)
    
    async def update_document(
        self,
        document_id: str,
        file_path: Path,
        metadata: DocumentMetadata,
        user_role: UserRole,
        change_description: Optional[str] = None
    ) -> bool:
        """
        Update an existing document (creates new version).
        
        Args:
            document_id: ID of document to update
            file_path: Path to new file
            metadata: Updated metadata
            user_role: Role of user updating
            change_description: Description of changes
            
        Returns:
            True if successful
        """
        # Check permissions
        if user_role != UserRole.ADMIN:
            raise PermissionError("Only admins can update documents")
        
        if document_id not in self.documents_db:
            return False
        
        try:
            # Delete old vectors
            await self.vector_store.delete_document(document_id)
            
            # Process new version
            new_id, status = await self.upload_document(file_path, metadata, user_role)
            
            if status == DocumentStatus.COMPLETED:
                # Update version history
                old_versions = self.versions_db.get(document_id, [])
                for v in old_versions:
                    v.is_current = False
                
                new_version = DocumentVersionInfo(
                    document_id=document_id,
                    version=metadata.version,
                    created_at=datetime.now(),
                    updated_at=datetime.now(),
                    updated_by="system",
                    change_description=change_description,
                    is_current=True
                )
                
                old_versions.append(new_version)
                self.versions_db[document_id] = old_versions
                
                logger.info(f"Document {document_id} updated to version {metadata.version}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to update document: {e}")
            return False
    
    async def delete_document(self, document_id: str, user_role: UserRole) -> bool:
        """Delete a document."""
        if user_role != UserRole.ADMIN:
            raise PermissionError("Only admins can delete documents")
        
        if document_id not in self.documents_db:
            return False
        
        try:
            # Delete from vector store
            await self.vector_store.delete_document(document_id)
            
            # Delete file
            doc_info = self.documents_db[document_id]
            file_path = Path(doc_info['file_path'])
            if file_path.exists():
                file_path.unlink()
            
            # Remove metadata
            del self.documents_db[document_id]
            if document_id in self.versions_db:
                del self.versions_db[document_id]
            if document_id in self.access_control:
                del self.access_control[document_id]
            
            logger.info(f"Document {document_id} deleted")
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete document: {e}")
            return False
    
    async def get_document_versions(self, document_id: str) -> List[DocumentVersionInfo]:
        """Get version history for a document."""
        return self.versions_db.get(document_id, [])
