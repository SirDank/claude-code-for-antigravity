#!/usr/bin/env node

/**
 * Lightweight zero-dependency bridge proxy connecting Anthropic Claude Code
 * to NVIDIA Build NIM (OpenAI Chat Completions) with full reasoning support.
 */

import http from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = parseInt(process.env.NVIDIA_PROXY_PORT || '4000', 10);
const NVIDIA_BASE = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';

export function createProxyServer(apiKeyOverride = null) {
  const server = http.createServer(async (req, res) => {
    // 1. Health check endpoint called by Claude Code / Bun runtime
    if (req.method === 'HEAD' || req.url === '/api/hello' || req.url === '/hello') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.method !== 'POST' || (!req.url.includes('/messages') && !req.url.includes('/chat/completions'))) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Not found' } }));
      return;
    }

    let rawBody = '';
    req.on('data', chunk => { rawBody += chunk; });
    req.on('end', async () => {
      try {
        const anthropicReq = JSON.parse(rawBody);
        const apiKey = apiKeyOverride || req.headers['x-api-key'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '') || process.env.NVIDIA_API_KEY;

        if (!apiKey) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: 'Missing NVIDIA API key' } }));
          return;
        }

        // Convert Anthropic messages to OpenAI format
        const openaiMessages = [];
        if (anthropicReq.system) {
          const sysContent = typeof anthropicReq.system === 'string'
            ? anthropicReq.system
            : (Array.isArray(anthropicReq.system) ? anthropicReq.system.map(s => s.text || '').join('\n') : String(anthropicReq.system));
          openaiMessages.push({ role: 'system', content: sysContent });
        }

        if (Array.isArray(anthropicReq.messages)) {
          for (const msg of anthropicReq.messages) {
            if (typeof msg.content === 'string') {
              openaiMessages.push({ role: msg.role, content: msg.content });
            } else if (Array.isArray(msg.content)) {
              let textContent = '';
              const toolCalls = [];

              for (const part of msg.content) {
                if (part.type === 'text') {
                  textContent += part.text;
                } else if (part.type === 'tool_use') {
                  toolCalls.push({
                    id: part.id || randomUUID(),
                    type: 'function',
                    function: {
                      name: part.name,
                      arguments: JSON.stringify(part.input || {})
                    }
                  });
                } else if (part.type === 'tool_result') {
                  let toolContent = '';
                  if (typeof part.content === 'string') {
                    toolContent = part.content;
                  } else if (Array.isArray(part.content)) {
                    toolContent = part.content.map(c => (typeof c === 'string' ? c : (c.text || JSON.stringify(c)))).join('\n');
                  } else {
                    toolContent = JSON.stringify(part.content ?? '');
                  }
                  openaiMessages.push({
                    role: 'tool',
                    tool_call_id: part.tool_use_id,
                    content: toolContent
                  });
                }
              }

              if (textContent || toolCalls.length > 0) {
                const openaiMsg = { role: msg.role };
                if (textContent) openaiMsg.content = textContent;
                if (toolCalls.length > 0) openaiMsg.tool_calls = toolCalls;
                openaiMessages.push(openaiMsg);
              }
            }
          }
        }

        // Build OpenAI payload (strip [1m] context suffix and :free so NVIDIA NIM receives standard slug)
        const requestedModel = anthropicReq.model || 'nvidia/nemotron-3-ultra-550b-a55b';
        let upstreamModel = requestedModel.replace(/\[\d+m\]$/i, '').replace(/:free$/i, '');
        if (upstreamModel.startsWith('claude-') || upstreamModel === 'default' || upstreamModel === 'best') {
          upstreamModel = 'nvidia/nemotron-3-ultra-550b-a55b';
        }

        const openaiPayload = {
          model: upstreamModel,
          messages: openaiMessages,
          max_tokens: anthropicReq.max_tokens || 8192,
          temperature: anthropicReq.temperature ?? 1,
          stream: anthropicReq.stream !== false,
          chat_template_kwargs: {
            enable_thinking: true
          }
        };

        if (Array.isArray(anthropicReq.tools) && anthropicReq.tools.length > 0) {
          openaiPayload.tools = anthropicReq.tools.map(t => ({
            type: 'function',
            function: {
              name: t.name,
              description: t.description || '',
              parameters: t.input_schema || {}
            }
          }));
        }

        const upstreamRes = await fetch(`${NVIDIA_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(openaiPayload)
        });

        if (!upstreamRes.ok) {
          const errText = await upstreamRes.text();
          res.writeHead(upstreamRes.status, { 'Content-Type': 'application/json' });
          res.end(errText);
          return;
        }

        const msgId = `msg_${randomUUID()}`;

        if (!anthropicReq.stream) {
          const completion = await upstreamRes.json();
          const choice = completion.choices?.[0]?.message;
          const contentBlocks = [];

          if (choice?.reasoning_content) {
            contentBlocks.push({ type: 'thinking', thinking: choice.reasoning_content });
          }
          if (choice?.content) {
            contentBlocks.push({ type: 'text', text: choice.content });
          }
          if (choice?.tool_calls) {
            for (const tc of choice.tool_calls) {
              contentBlocks.push({
                type: 'tool_use',
                id: tc.id,
                name: tc.function.name,
                input: JSON.parse(tc.function.arguments || '{}')
              });
            }
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            id: msgId,
            type: 'message',
            role: 'assistant',
            model: openaiPayload.model,
            content: contentBlocks,
            stop_reason: choice?.tool_calls?.length ? 'tool_use' : 'end_turn',
            usage: {
              input_tokens: completion.usage?.prompt_tokens || 0,
              output_tokens: completion.usage?.completion_tokens || 0
            }
          }));
          return;
        }

        // Handle SSE streaming
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        });

        // Send message_start
        res.write(`event: message_start\ndata: ${JSON.stringify({
          type: 'message_start',
          message: {
            id: msgId,
            type: 'message',
            role: 'assistant',
            model: openaiPayload.model,
            content: [],
            stop_reason: null,
            usage: { input_tokens: 0, output_tokens: 0 }
          }
        })}\n\n`);

        let blockIndex = 0;
        let isThinking = false;
        let isContent = false;
        let stopReason = 'end_turn';
        const activeToolCalls = new Map(); // tcIdx -> { blockIndex, id, name, closed }
        const reader = upstreamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            if (trimmed === 'data: [DONE]') continue;

            if (trimmed.startsWith('data: ')) {
              try {
                const chunk = JSON.parse(trimmed.slice(6));
                const choice = chunk.choices?.[0];
                const delta = choice?.delta;

                if (choice?.finish_reason) {
                  if (choice.finish_reason === 'tool_calls') {
                    stopReason = 'tool_use';
                  } else if (choice.finish_reason === 'stop') {
                    stopReason = 'end_turn';
                  } else {
                    stopReason = choice.finish_reason;
                  }
                }

                if (!delta) continue;

                // 1. Thinking / reasoning delta
                if (delta.reasoning_content) {
                  if (isContent) {
                    res.write(`event: content_block_stop\ndata: ${JSON.stringify({
                      type: 'content_block_stop',
                      index: blockIndex
                    })}\n\n`);
                    isContent = false;
                    blockIndex++;
                  }
                  if (!isThinking) {
                    isThinking = true;
                    res.write(`event: content_block_start\ndata: ${JSON.stringify({
                      type: 'content_block_start',
                      index: blockIndex,
                      content_block: { type: 'thinking', thinking: '' }
                    })}\n\n`);
                  }
                  res.write(`event: content_block_delta\ndata: ${JSON.stringify({
                    type: 'content_block_delta',
                    index: blockIndex,
                    delta: { type: 'thinking_delta', thinking: delta.reasoning_content }
                  })}\n\n`);
                }

                // 2. Normal text content delta
                if (delta.content) {
                  if (isThinking) {
                    res.write(`event: content_block_stop\ndata: ${JSON.stringify({
                      type: 'content_block_stop',
                      index: blockIndex
                    })}\n\n`);
                    isThinking = false;
                    blockIndex++;
                  }

                  if (!isContent) {
                    isContent = true;
                    res.write(`event: content_block_start\ndata: ${JSON.stringify({
                      type: 'content_block_start',
                      index: blockIndex,
                      content_block: { type: 'text', text: '' }
                    })}\n\n`);
                  }

                  res.write(`event: content_block_delta\ndata: ${JSON.stringify({
                    type: 'content_block_delta',
                    index: blockIndex,
                    delta: { type: 'text_delta', text: delta.content }
                  })}\n\n`);
                }

                // 3. Tool calls delta
                if (Array.isArray(delta.tool_calls) && delta.tool_calls.length > 0) {
                  if (isThinking) {
                    res.write(`event: content_block_stop\ndata: ${JSON.stringify({
                      type: 'content_block_stop',
                      index: blockIndex
                    })}\n\n`);
                    isThinking = false;
                    blockIndex++;
                  }
                  if (isContent) {
                    res.write(`event: content_block_stop\ndata: ${JSON.stringify({
                      type: 'content_block_stop',
                      index: blockIndex
                    })}\n\n`);
                    isContent = false;
                    blockIndex++;
                  }

                  for (const tc of delta.tool_calls) {
                    const tcIdx = tc.index ?? 0;
                    let call = activeToolCalls.get(tcIdx);
                    if (!call) {
                      const callBlockIndex = blockIndex++;
                      call = {
                        blockIndex: callBlockIndex,
                        id: tc.id || `call_${randomUUID().slice(0, 8)}`,
                        name: tc.function?.name || 'tool',
                        closed: false
                      };
                      activeToolCalls.set(tcIdx, call);

                      res.write(`event: content_block_start\ndata: ${JSON.stringify({
                        type: 'content_block_start',
                        index: call.blockIndex,
                        content_block: {
                          type: 'tool_use',
                          id: call.id,
                          name: call.name,
                          input: {}
                        }
                      })}\n\n`);
                    }

                    if (tc.function?.arguments) {
                      res.write(`event: content_block_delta\ndata: ${JSON.stringify({
                        type: 'content_block_delta',
                        index: call.blockIndex,
                        delta: {
                          type: 'input_json_delta',
                          partial_json: tc.function.arguments
                        }
                      })}\n\n`);
                    }
                  }
                }
              } catch {}
            }
          }
        }

        // Close active content block if any
        if (isThinking || isContent) {
          res.write(`event: content_block_stop\ndata: ${JSON.stringify({
            type: 'content_block_stop',
            index: blockIndex
          })}\n\n`);
        }

        for (const call of activeToolCalls.values()) {
          if (!call.closed) {
            call.closed = true;
            res.write(`event: content_block_stop\ndata: ${JSON.stringify({
              type: 'content_block_stop',
              index: call.blockIndex
            })}\n\n`);
          }
        }

        if (activeToolCalls.size > 0) {
          stopReason = 'tool_use';
        }

        // Send message_delta & message_stop
        res.write(`event: message_delta\ndata: ${JSON.stringify({
          type: 'message_delta',
          delta: { stop_reason: stopReason },
          usage: { output_tokens: 0 }
        })}\n\n`);

        res.write(`event: message_stop\ndata: ${JSON.stringify({ type: 'message_stop' })}\n\n`);
        res.end();
      } catch (err) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { message: err.message } }));
        }
      }
    });
  });

  return server;
}

if (process.argv[1] && process.argv[1].endsWith('nvidia-proxy.mjs')) {
  const server = createProxyServer();
  server.listen(PORT, '127.0.0.1', () => {
    console.log(`[NVIDIA Proxy] Running at http://127.0.0.1:${PORT}`);
    console.log(`[NVIDIA Proxy] Forwarding to: ${NVIDIA_BASE}`);
  });
}
