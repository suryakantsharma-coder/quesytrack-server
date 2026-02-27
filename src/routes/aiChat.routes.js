import express from 'express';
import { streamChatResponse } from '../services/openaiService.js';

const router = express.Router();

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return false;
  return messages.every(
    (m) =>
      m &&
      typeof m === 'object' &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string'
  );
}

/**
 * POST /api/ai-chat
 * Body: { messages: Array<{ role: 'user'|'assistant', content: string }> }
 * Response: SSE stream. Each chunk: data: {"content":"..."}\n\n. End: data: [DONE]\n\n
 */
async function handleAiChat(req, res, next) {
  const { messages } = req.body ?? {};
  if (!validateMessages(messages)) {
    return res.status(400).json({
      success: false,
      error: 'messages must be a non-empty array of { role: "user"|"assistant", content: string }',
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    await streamChatResponse(messages, res);
  } catch (err) {
    console.error('ai-chat stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Stream failed' });
    } else {
      res.write(`data: ${JSON.stringify({ content: '\n[Error during stream.]' })}\n\n`);
    }
  } finally {
    res.end();
  }
}

router.post('/ai-chat', handleAiChat);

export default router;
