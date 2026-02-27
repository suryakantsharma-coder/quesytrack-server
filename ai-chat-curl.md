# AI Chat API – cURL Examples

**Base URL:** `http://localhost:4000` (or your `PORT`)

**Endpoint:** `POST /api/ai-chat`  
**Response:** Server-Sent Events (SSE) stream. Each chunk: `data: {"content":"..."}`. Stream ends with `data: [DONE]`.

---

## 1. Single user message (streaming)

```bash
curl -N -X POST http://localhost:4000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "List my projects" }
    ]
  }'
```

---

## 2. Multi-turn conversation (last 5 messages used by API)

```bash
curl -N -X POST http://localhost:4000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "What calibrations do we have?" },
      { "role": "assistant", "content": "Here are the calibrations..." },
      { "role": "user", "content": "Which ones are overdue?" }
    ]
  }'
```

---

## 3. Intent-specific queries (context from DB)

**Projects:**
```bash
curl -N -X POST http://localhost:4000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Tell me about our projects"}]}'
```

**Calibrations:**
```bash
curl -N -X POST http://localhost:4000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Show calibrations"}]}'
```

**Gauges:**
```bash
curl -N -X POST http://localhost:4000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"List all gauges"}]}'
```

**Reports:**
```bash
curl -N -X POST http://localhost:4000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"What reports exist?"}]}'
```

**Help / FAQ:**
```bash
curl -N -X POST http://localhost:4000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"help"}]}'
```

---

## 4. Validation – empty messages (expect 400)

```bash
curl -s -X POST http://localhost:4000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[]}'
```

**Expected:** `400` with error like `messages must be a non-empty array of { role: "user"|"assistant", content: string }`.

---

## 5. Validation – missing/invalid shape (expect 400)

```bash
curl -s -X POST http://localhost:4000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user"}]}'
```

```bash
curl -s -X POST http://localhost:4000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"invalid","content":"hi"}]}'
```

---

## 6. Save stream to file

```bash
curl -N -X POST http://localhost:4000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Summarize projects"}]}' \
  -o ai-chat-stream.txt
```

---

## 7. Custom port

If the server runs on port 5000:

```bash
curl -N -X POST http://localhost:5000/api/ai-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

---

## Environment

- `OPENAI_API_KEY` must be set for AI responses.
- `MONGODB_URI` must be set for DB-backed context.
- Optional: `PORT`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`.

Rate limit applies to `/api/*` (e.g. 30 requests per minute per IP by default).
