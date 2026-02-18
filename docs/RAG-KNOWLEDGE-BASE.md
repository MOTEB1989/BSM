# Banking Knowledge Base RAG System

## نظرة عامة (Overview)

نظام قاعدة المعرفة المصرفية مع قدرات RAG (Retrieval-Augmented Generation) لإدارة والبحث في الأنظمة واللوائح المصرفية السعودية.

A comprehensive Banking Knowledge Base system with RAG capabilities for managing and searching Saudi banking regulations and documents.

## الميزات الرئيسية (Key Features)

### 1. معالجة المستندات (Document Processing)
- ✅ تحميل ومعالجة ملفات PDF
- ✅ استخراج النصوص من المستندات العربية والإنجليزية
- ✅ تقسيم المستندات إلى أجزاء (Chunking)
- ✅ دعم أنظمة ساما واللوائح المصرفية

### 2. البحث الدلالي (Semantic Search)
- ✅ بحث باستخدام المعاني وليس الكلمات فقط
- ✅ نتائج بحث مع رقم الصفحة ودرجة الارتباط
- ✅ دعم الفلاتر والخيارات المتقدمة
- ✅ دعم اللغتين العربية والإنجليزية

### 3. المحادثة الذكية (AI Chat)
- ✅ إجابات سياقية باستخدام RAG
- ✅ الاستشهاد بالمصادر مع أرقام الصفحات
- ✅ دعم المحادثات بالعربية والإنجليزية
- ✅ تكامل مع واجهة الدردشة الموجودة

### 4. إدارة الإصدارات (Version Management)
- ✅ تتبع إصدارات المستندات
- ✅ سجل التحديثات والتغييرات
- ✅ إمكانية الرجوع للإصدارات السابقة
- ✅ توثيق أسباب التغيير

### 5. التحكم في الوصول (Access Control)
- ✅ ثلاثة أدوار: مدير، مستخدم، مدقق
- ✅ صلاحيات متدرجة حسب الدور
- ✅ سجل الوصول والعمليات
- ✅ تكامل مع نظام الصلاحيات الموجود

### 6. قواعد البيانات المتجهة (Vector Databases)
- ✅ دعم Pinecone (سحابي)
- ✅ دعم PostgreSQL pgvector (محلي)
- ✅ تبديل سهل بين الخيارين
- ✅ أداء عالي وقابلية للتوسع

## البنية المعمارية (Architecture)

```
┌─────────────────────────────────────────────────────────┐
│                   Node.js Express Backend                │
│  Port: 3000                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Routes                                      │   │
│  │  /api/rag/chat       - RAG-powered chat         │   │
│  │  /api/rag/search     - Semantic search          │   │
│  │  /api/rag/documents  - Document management      │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  RAG Client (src/services/ragClient.js)         │   │
│  │  - HTTP client for Python RAG service           │   │
│  │  - Request/response mapping                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Python FastAPI RAG Service                 │
│  Port: 8000                                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Endpoints                                   │   │
│  │  POST /api/v1/documents/upload                   │   │
│  │  POST /api/v1/search                             │   │
│  │  POST /api/v1/chat                               │   │
│  │  GET  /api/v1/documents                          │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Services                                        │   │
│  │  - PDF Processor (PyMuPDF, PyPDF2)               │   │
│  │  - Embeddings Service (OpenAI)                   │   │
│  │  - RAG Service (Context retrieval + GPT)         │   │
│  │  - Document Service (CRUD operations)            │   │
│  │  - Vector Store (Pinecone/pgvector abstraction) │   │
│  └──────────────────────────────────────────────────┘   │
└─────────┬──────────────────────┬────────────────────────┘
          │                      │
          ▼                      ▼
┌──────────────────┐   ┌──────────────────────┐
│ Vector Database  │   │    PostgreSQL        │
│ (Pinecone or     │   │    (Metadata DB)     │
│  pgvector)       │   │                      │
│                  │   │    Redis             │
│ - Embeddings     │   │    (Cache)           │
│ - Similarity     │   │                      │
│   Search         │   │                      │
└──────────────────┘   └──────────────────────┘
```

## التثبيت والإعداد (Installation & Setup)

### المتطلبات (Prerequisites)

- Node.js 22+
- Python 3.11+
- Docker & Docker Compose (optional)
- OpenAI API Key
- Pinecone API Key (or PostgreSQL for pgvector)

### خطوات التثبيت (Installation Steps)

#### 1. إعداد خدمة RAG (Setup RAG Service)

```bash
cd services/rag-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your API keys
nano .env
```

#### 2. تشغيل الخدمات (Start Services)

**Option A: Using Docker Compose (Recommended)**

```bash
cd services/rag-service
docker-compose up -d
```

**Option B: Manual Setup**

```bash
# Terminal 1: Start RAG service
cd services/rag-service
source venv/bin/activate
python -m uvicorn src.main:app --reload --port 8000

# Terminal 2: Start Node.js backend
cd ../..
npm run dev
```

### التحقق من التثبيت (Verify Installation)

```bash
# Check RAG service
curl http://localhost:8000/health

# Check Node.js integration
curl http://localhost:3000/api/rag/health
```

## الاستخدام (Usage)

### 1. رفع المستندات (Upload Documents)

```bash
# Upload SAMA regulation PDF
curl -X POST http://localhost:8000/api/v1/documents/upload \
  -H "x-admin-token: your-admin-token" \
  -F "file=@sama-banking-control-law.pdf" \
  -F "title=نظام مراقبة البنوك" \
  -F "document_type=regulation" \
  -F "jurisdiction=SAMA" \
  -F "language=ar"
```

**من خلال Node.js (Through Node.js):**

```javascript
// Direct to RAG service
POST http://localhost:8000/api/v1/documents/upload

// Or through Node.js proxy (future implementation)
POST http://localhost:3000/api/rag/documents/upload
```

### 2. البحث الدلالي (Semantic Search)

```bash
# Search in Arabic
curl -X POST http://localhost:3000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "ما هي متطلبات رأس المال للبنوك؟",
    "language": "ar",
    "top_k": 5
  }'

# Search in English
curl -X POST http://localhost:3000/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the capital requirements for banks?",
    "language": "en",
    "top_k": 5
  }'
```

**النتيجة (Response):**

```json
{
  "query": "ما هي متطلبات رأس المال للبنوك؟",
  "results": [
    {
      "document_id": "uuid-123",
      "document_title": "نظام مراقبة البنوك",
      "content": "يجب على البنوك المحافظة على نسبة كفاية رأس المال...",
      "page_number": 15,
      "relevance_score": 0.92,
      "metadata": {
        "document_type": "regulation",
        "jurisdiction": "SAMA",
        "language": "ar"
      }
    }
  ],
  "total_results": 5,
  "language": "ar"
}
```

### 3. المحادثة الذكية (RAG Chat)

```bash
curl -X POST http://localhost:3000/api/rag/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "اشرح لي متطلبات سياسة مكافحة غسيل الأموال للبنوك",
    "language": "ar",
    "use_rag": true,
    "top_k": 3
  }'
```

**النتيجة (Response):**

```json
{
  "message": "بناءً على لوائح ساما، تتطلب سياسة مكافحة غسيل الأموال من البنوك:\n\n1. التحقق من هوية العملاء (KYC)...\n2. رصد المعاملات المشبوهة...\n3. الإبلاغ عن العمليات المشكوك فيها...",
  "sources": [
    {
      "document_id": "uuid-456",
      "document_title": "ضوابط مكافحة غسل الأموال",
      "page_number": 8,
      "excerpt": "يجب على البنوك التحقق من هوية العملاء...",
      "relevance_score": 0.95
    }
  ],
  "conversation_id": "conv-789",
  "language": "ar"
}
```

### 4. إدارة المستندات (Document Management)

```bash
# List documents
curl http://localhost:3000/api/rag/documents?page=1&page_size=20

# Get document details
curl http://localhost:3000/api/rag/documents/{document_id}

# Delete document (admin only)
curl -X DELETE http://localhost:3000/api/rag/documents/{document_id} \
  -H "x-admin-token: your-admin-token"
```

## التكامل مع الواجهة الأمامية (Frontend Integration)

### استخدام من JavaScript

```javascript
// Search documents
async function searchDocuments(query) {
  const response = await fetch('http://localhost:3000/api/rag/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: query,
      language: 'ar',
      top_k: 5
    })
  });
  
  return await response.json();
}

// RAG-powered chat
async function ragChat(message) {
  const response = await fetch('http://localhost:3000/api/rag/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      language: 'ar',
      use_rag: true,
      top_k: 3
    })
  });
  
  return await response.json();
}
```

### تحديث واجهة الدردشة الموجودة

يمكن تعديل `src/chat/app.js` لإضافة خيار RAG:

```javascript
// Add RAG option to chat interface
const useRAG = ref(true);

async function sendMessage() {
  // ... existing code ...
  
  if (useRAG.value) {
    // Use RAG endpoint
    url = `${API_BASE}/api/rag/chat`;
    body = {
      message: text,
      language: lang.value,
      use_rag: true,
      top_k: 3
    };
  } else {
    // Use regular GPT
    url = `${API_BASE}/api/chat/direct`;
    // ... existing code ...
  }
}
```

## الأدوار والصلاحيات (Roles & Permissions)

### مدير النظام (Admin)
- ✅ رفع المستندات
- ✅ تحديث المستندات
- ✅ حذف المستندات
- ✅ إدارة الإصدارات
- ✅ الوصول الكامل

### مستخدم (User)
- ✅ البحث في المستندات
- ✅ استخدام المحادثة
- ✅ عرض المستندات
- ❌ لا يمكن رفع/حذف

### مدقق (Auditor)
- ✅ عرض المستندات
- ✅ عرض سجلات الوصول
- ✅ عرض سجل الإصدارات
- ❌ للقراءة فقط

## الأداء والتوسع (Performance & Scalability)

### معايير الأداء (Performance Metrics)

- **معالجة PDF**: ~1-2 ثانية لكل 10 صفحات
- **توليد Embeddings**: ~100 جزء لكل دفعة
- **البحث**: <100ms لـ 10,000 مستند
- **الطلبات المتزامنة**: 100+ طلب في وقت واحد

### التوسع (Scaling)

```yaml
# docker-compose.yml - Scale RAG service
services:
  rag-service:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## المراقبة والصيانة (Monitoring & Maintenance)

### فحص الصحة (Health Checks)

```bash
# RAG service health
curl http://localhost:8000/health

# Node.js integration health
curl http://localhost:3000/api/rag/health
```

### السجلات (Logs)

```bash
# RAG service logs
docker-compose logs -f rag-service

# Node.js logs
npm run dev  # Shows real-time logs
```

### النسخ الاحتياطي (Backup)

```bash
# Backup vector database (pgvector)
docker exec bsm-postgres pg_dump banking_kb > backup.sql

# Backup uploaded files
tar -czf uploads-backup.tar.gz services/rag-service/uploads
```

## الأمان (Security)

### أفضل الممارسات (Best Practices)

1. ✅ استخدم HTTPS في الإنتاج
2. ✅ قم بتدوير مفاتيح API بانتظام
3. ✅ فعل rate limiting
4. ✅ راجع سجلات الوصول
5. ✅ احتفظ بنسخ احتياطية

### متطلبات الإنتاج (Production Requirements)

```bash
# .env for production
ADMIN_TOKEN=<strong-token-32-chars>
OPENAI_API_KEY=<production-key>
ALLOWED_ORIGINS=https://yourdomain.com
VECTOR_DB_TYPE=pgvector  # or pinecone
```

## استكشاف الأخطاء (Troubleshooting)

### مشاكل شائعة (Common Issues)

**1. RAG service not responding**
```bash
# Check if service is running
docker ps | grep rag-service

# Check logs
docker-compose logs rag-service

# Restart service
docker-compose restart rag-service
```

**2. OpenAI API errors**
```bash
# Verify API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

**3. Vector database connection issues**
```bash
# Check PostgreSQL
docker exec bsm-postgres pg_isready

# Check Pinecone
curl https://api.pinecone.io/indexes \
  -H "Api-Key: $PINECONE_API_KEY"
```

## التطوير المستقبلي (Future Enhancements)

### قيد التطوير (In Progress)
- [ ] واجهة رسومية لرفع المستندات
- [ ] دعم صيغ إضافية (DOCX, PPTX)
- [ ] معالجة الصور والجداول في PDF
- [ ] نماذج embeddings محلية

### مخطط (Planned)
- [ ] دعم المحادثات متعددة الجلسات
- [ ] تحليلات وإحصائيات الاستخدام
- [ ] إشعارات تحديث المستندات
- [ ] API webhooks للتكامل الخارجي

## الدعم (Support)

للمساعدة والدعم:
- راجع التوثيق: `/services/rag-service/README.md`
- افتح issue على GitHub
- اتصل بفريق التطوير

## الترخيص (License)

يخضع هذا المشروع لترخيص المستودع الرئيسي.
