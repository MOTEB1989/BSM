"""Configuration management for RAG service."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # Service Configuration
    service_name: str = "rag-service"
    service_version: str = "1.0.0"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"
    
    # OpenAI Configuration
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 1536
    
    # Vector Database
    vector_db_type: str = "pinecone"  # pinecone or pgvector
    pinecone_api_key: Optional[str] = None
    pinecone_environment: str = "gcp-starter"
    pinecone_index_name: str = "banking-docs"
    
    # PostgreSQL + pgvector
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "banking_kb"
    postgres_user: str = "postgres"
    postgres_password: str = ""
    
    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: Optional[str] = None
    
    # Document Processing
    max_file_size_mb: int = 50
    chunk_size: int = 1000
    chunk_overlap: int = 200
    max_chunks_per_doc: int = 500
    
    # Security
    admin_token: str = "change-me"
    allowed_origins: str = "http://localhost:3000"
    
    # Storage
    upload_dir: str = "./uploads"
    processed_dir: str = "./processed"
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
