"""PDF processing service."""

import logging
from pathlib import Path
from typing import List, Tuple
import PyPDF2
import fitz  # PyMuPDF

from ..config import settings

logger = logging.getLogger(__name__)


class PDFProcessor:
    """Process PDF documents and extract text."""
    
    def __init__(self):
        self.chunk_size = settings.chunk_size
        self.chunk_overlap = settings.chunk_overlap
        self.max_chunks = settings.max_chunks_per_doc
    
    def extract_text_from_pdf(self, file_path: Path) -> List[Tuple[str, int]]:
        """
        Extract text from PDF file.
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            List of tuples (text_content, page_number)
        """
        pages_content = []
        
        try:
            # Try PyMuPDF first (better for Arabic)
            doc = fitz.open(str(file_path))
            for page_num in range(len(doc)):
                page = doc[page_num]
                text = page.get_text()
                if text.strip():
                    pages_content.append((text, page_num + 1))
            doc.close()
            
            logger.info(f"Extracted {len(pages_content)} pages from {file_path.name}")
            return pages_content
            
        except Exception as e:
            logger.warning(f"PyMuPDF failed: {e}, trying PyPDF2")
            
            # Fallback to PyPDF2
            try:
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page_num in range(len(pdf_reader.pages)):
                        page = pdf_reader.pages[page_num]
                        text = page.extract_text()
                        if text.strip():
                            pages_content.append((text, page_num + 1))
                
                logger.info(f"Extracted {len(pages_content)} pages from {file_path.name}")
                return pages_content
                
            except Exception as e2:
                logger.error(f"Failed to extract text from PDF: {e2}")
                raise
    
    def chunk_text(self, text: str, page_number: int) -> List[dict]:
        """
        Split text into overlapping chunks.
        
        Args:
            text: Text to chunk
            page_number: Page number for metadata
            
        Returns:
            List of chunk dictionaries
        """
        chunks = []
        
        # Simple character-based chunking
        words = text.split()
        current_chunk = []
        current_length = 0
        
        for word in words:
            word_length = len(word) + 1  # +1 for space
            
            if current_length + word_length > self.chunk_size and current_chunk:
                # Save current chunk
                chunk_text = ' '.join(current_chunk)
                chunks.append({
                    'content': chunk_text,
                    'page_number': page_number,
                    'length': current_length
                })
                
                # Start new chunk with overlap
                overlap_words = current_chunk[-self.chunk_overlap:] if self.chunk_overlap > 0 else []
                current_chunk = overlap_words + [word]
                current_length = sum(len(w) + 1 for w in current_chunk)
            else:
                current_chunk.append(word)
                current_length += word_length
        
        # Add remaining chunk
        if current_chunk:
            chunk_text = ' '.join(current_chunk)
            chunks.append({
                'content': chunk_text,
                'page_number': page_number,
                'length': current_length
            })
        
        return chunks
    
    def process_pdf(self, file_path: Path) -> List[dict]:
        """
        Process PDF and return chunks with metadata.
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            List of chunks with metadata
        """
        pages_content = self.extract_text_from_pdf(file_path)
        
        all_chunks = []
        chunk_index = 0
        
        for page_text, page_num in pages_content:
            page_chunks = self.chunk_text(page_text, page_num)
            
            for chunk in page_chunks:
                if chunk_index >= self.max_chunks:
                    logger.warning(f"Reached maximum chunks limit: {self.max_chunks}")
                    break
                
                all_chunks.append({
                    'content': chunk['content'],
                    'page_number': chunk['page_number'],
                    'chunk_index': chunk_index,
                    'length': chunk['length']
                })
                chunk_index += 1
        
        logger.info(f"Created {len(all_chunks)} chunks from {file_path.name}")
        return all_chunks
