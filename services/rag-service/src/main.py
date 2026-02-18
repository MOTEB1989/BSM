"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .models import HealthResponse
from .api.routes import router, rag_service, document_service, vector_store
from .services import get_vector_store

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    # Startup
    logger.info(f"Starting {settings.service_name} v{settings.service_version}")
    
    try:
        # Initialize services
        await rag_service.initialize()
        await document_service.initialize()
        logger.info("Services initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down gracefully")


# Create FastAPI app
app = FastAPI(
    title="Banking Knowledge Base RAG Service",
    description="RAG-powered knowledge base for banking regulations and documents",
    version=settings.service_version,
    lifespan=lifespan
)

# CORS middleware
origins = settings.allowed_origins.split(',')
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    try:
        # Check vector store health
        vector_db_status = await vector_store.health_check()
        
        return HealthResponse(
            status="healthy" if vector_db_status else "degraded",
            service=settings.service_name,
            version=settings.service_version,
            timestamp=datetime.now(),
            vector_db=settings.vector_db_type,
            vector_db_status="connected" if vector_db_status else "disconnected"
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "service": settings.service_name,
                "error": str(e)
            }
        )


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "docs": "/docs",
        "health": "/health"
    }


# Include API routes
app.include_router(router, prefix="/api/v1", tags=["RAG API"])


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level=settings.log_level
    )
