"""RAG (Retrieval-Augmented Generation) service."""

import logging
from typing import List, Optional
from openai import OpenAI

from ..config import settings
from ..models import ChatRequest, ChatResponse, SourceCitation
from .embeddings import EmbeddingsService
from .vector_store import get_vector_store

logger = logging.getLogger(__name__)


class RAGService:
    """RAG service for context-aware chat."""
    
    def __init__(self):
        self.openai_client = OpenAI(api_key=settings.openai_api_key)
        self.embeddings_service = EmbeddingsService()
        self.vector_store = get_vector_store()
        self.model = settings.openai_model
    
    async def initialize(self):
        """Initialize vector store."""
        await self.vector_store.initialize()
    
    async def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Process chat request with RAG.
        
        Args:
            request: Chat request
            
        Returns:
            Chat response with sources
        """
        sources = []
        context = ""
        
        # Retrieve relevant documents if RAG is enabled
        if request.use_rag:
            try:
                # Generate embedding for query
                query_embedding = self.embeddings_service.generate_embedding(request.message)
                
                # Search vector store
                search_results = await self.vector_store.search(
                    query_embedding=query_embedding,
                    top_k=request.top_k
                )
                
                # Build context from results
                context_parts = []
                for i, result in enumerate(search_results, 1):
                    context_parts.append(
                        f"[مصدر {i}] {result.document_title} (صفحة {result.page_number}):\n{result.content}\n"
                    )
                    
                    # Add to sources
                    sources.append(SourceCitation(
                        document_id=result.document_id,
                        document_title=result.document_title,
                        page_number=result.page_number,
                        excerpt=result.content[:200],
                        relevance_score=result.relevance_score
                    ))
                
                context = "\n".join(context_parts)
                logger.info(f"Retrieved {len(search_results)} relevant documents")
                
            except Exception as e:
                logger.error(f"Failed to retrieve context: {e}")
                # Continue without RAG
        
        # Build prompt
        system_prompt = self._build_system_prompt(request.language, context)
        
        # Call OpenAI
        try:
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.message}
                ],
                max_tokens=1500,
                temperature=0.7
            )
            
            answer = response.choices[0].message.content
            
            return ChatResponse(
                message=answer,
                sources=sources,
                conversation_id=request.conversation_id or "new",
                language=request.language
            )
            
        except Exception as e:
            logger.error(f"Failed to generate response: {e}")
            raise
    
    def _build_system_prompt(self, language: str, context: str) -> str:
        """Build system prompt with context."""
        if language == "ar":
            base_prompt = """أنت مساعد ذكي متخصص في الأنظمة واللوائح المصرفية والمالية.
دورك هو الإجابة على الأسئلة المتعلقة بأنظمة ولوائح مؤسسة النقد العربي السعودي (ساما) والجهات التنظيمية الأخرى.

المبادئ التوجيهية:
1. استخدم المعلومات الواردة في المصادر المرفقة للإجابة على الأسئلة
2. اذكر مصدر المعلومات (رقم المستند ورقم الصفحة) عند الاستشهاد
3. إذا لم تكن المعلومات متوفرة في المصادر، أخبر المستخدم بذلك صراحة
4. كن دقيقاً ومهنياً في إجاباتك
5. إذا كان السؤال غامضاً، اطلب التوضيح
"""
        else:  # English
            base_prompt = """You are an intelligent assistant specialized in banking and financial regulations.
Your role is to answer questions related to Saudi Central Bank (SAMA) regulations and other regulatory authorities.

Guidelines:
1. Use the information provided in the attached sources to answer questions
2. Cite the source (document number and page number) when referencing information
3. If information is not available in the sources, clearly tell the user
4. Be precise and professional in your answers
5. If the question is ambiguous, ask for clarification
"""
        
        if context:
            if language == "ar":
                return f"{base_prompt}\n\nالمصادر المتاحة:\n{context}"
            else:
                return f"{base_prompt}\n\nAvailable Sources:\n{context}"
        
        return base_prompt
