package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/rs/zerolog/log"
)

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
	Service   string    `json:"service"`
	Version   string    `json:"version"`
}

// ParseRequest represents a document parse request
type ParseRequest struct {
	FileURL string `json:"file_url"`
	Format  string `json:"format"`
}

// ParseResponse represents a document parse response
type ParseResponse struct {
	Text     string                 `json:"text"`
	Pages    int                    `json:"pages"`
	Metadata map[string]interface{} `json:"metadata"`
}

// MetadataResponse represents a document metadata response
type MetadataResponse struct {
	ID       string                 `json:"id"`
	Title    string                 `json:"title"`
	Author   string                 `json:"author"`
	Format   string                 `json:"format"`
	Pages    int                    `json:"pages"`
	Created  string                 `json:"created"`
	Modified string                 `json:"modified"`
	Size     int64                  `json:"size"`
	Extra    map[string]interface{} `json:"extra,omitempty"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code,omitempty"`
	ReqID   string `json:"request_id,omitempty"`
}

// HealthHandler handles health check requests
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	response := HealthResponse{
		Status:    "healthy",
		Timestamp: time.Now(),
		Service:   "document-processor",
		Version:   "1.0.0",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// ParseDocumentHandler handles document parsing requests
func ParseDocumentHandler(w http.ResponseWriter, r *http.Request) {
	var req ParseRequest

	// Decode request
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Error().Err(err).Msg("Failed to decode request")
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate request
	if req.FileURL == "" {
		respondError(w, "file_url is required", http.StatusBadRequest)
		return
	}

	if req.Format == "" {
		req.Format = "pdf" // Default to PDF
	}

	log.Info().
		Str("file_url", req.FileURL).
		Str("format", req.Format).
		Msg("Processing document parse request")

	// TODO: Implement actual document processing
	// For now, return a mock response
	response := ParseResponse{
		Text:  "Sample extracted text content from the document...",
		Pages: 10,
		Metadata: map[string]interface{}{
			"title":   "Sample Document",
			"author":  "Unknown",
			"created": time.Now().Format(time.RFC3339),
			"format":  req.Format,
		},
	}

	// Record metrics
	DocumentsProcessed.Inc()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// GetMetadataHandler handles metadata retrieval requests
func GetMetadataHandler(w http.ResponseWriter, r *http.Request) {
	docID := chi.URLParam(r, "id")
	if docID == "" {
		respondError(w, "document id is required", http.StatusBadRequest)
		return
	}

	log.Info().
		Str("document_id", docID).
		Msg("Processing metadata retrieval request")

	// Mock metadata response (will be replaced with real storage lookup)
	now := time.Now()
	response := MetadataResponse{
		ID:       docID,
		Title:    "Sample Document",
		Author:   "Unknown",
		Format:   "pdf",
		Pages:    10,
		Created:  now.Add(-24 * time.Hour).Format(time.RFC3339),
		Modified: now.Format(time.RFC3339),
		Size:     204800,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// respondError sends an error response
func respondError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{
		Error: message,
	})
}
