import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createServer } from 'http';
import { WebSocket } from 'ws';
import type { RawData } from 'ws';
import type { AddressInfo } from 'net';

process.env.WS_V2_AUTH = 'true';
process.env.WS_AUTH_TIMEOUT_MS = '5000';
process.env.WS_MAX_CONNECTIONS_PER_USER = '5';
process.env.WS_MAX_CONNECTIONS_PER_IP = '20';
process.env.WS_MESSAGE_RATE_LIMIT = '100';
process.env.WS_MESSAGE_RATE_WINDOW_MS = '60000';

vi.mock('../src/middleware/auth.js', () => ({
  verifyAccessToken: vi.fn(),
}));

vi.mock('../src/modules/messages/repository.js', () => ({
  messageRepository: {
    isParticipant: vi.fn(),
  },
}));

vi.mock('../src/modules/sessions/repository.js', () => ({
  sessionRepository: {
    isParticipant: vi.fn(),
  },
}));

let address = '';
let server: ReturnType<typeof createServer>;
let wss: { close: (cb?: () => void) => void };

let verifyAccessTokenMock: ReturnType<typeof vi.fn>;
let isConversationParticipantMock: ReturnType<typeof vi.fn>;
let isSessionParticipantMock: ReturnType<typeof vi.fn>;
let broadcastToConversation: typeof import('../src/modules/websocket/server.js').broadcastToConversation;
let initializeWebSocket: typeof import('../src/modules/websocket/server.js').initializeWebSocket;

function waitForType(ws: WebSocket, type: string, timeoutMs = 2000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      ws.off('message', onMessage);
      reject(new Error(`Timed out waiting for ${type}`));
    }, timeoutMs);

    const onMessage = (data: RawData) => {
      try {
        const message = JSON.parse(data.toString());
        if (message?.type === type) {
          clearTimeout(timeout);
          ws.off('message', onMessage);
          resolve(message);
        }
      } catch (error) {
        clearTimeout(timeout);
        ws.off('message', onMessage);
        reject(error);
      }
    };

    ws.on('message', onMessage);
  });
}

async function connectClient(): Promise<WebSocket> {
  const ws = new WebSocket(address);
  await new Promise<void>((resolve, reject) => {
    ws.on('open', () => resolve());
    ws.on('error', (error) => reject(error));
  });
  return ws;
}

beforeAll(async () => {
  vi.resetModules();

  const authModule = await import('../src/middleware/auth.js');
  verifyAccessTokenMock = vi.mocked(authModule.verifyAccessToken);

  const messageRepoModule = await import('../src/modules/messages/repository.js');
  isConversationParticipantMock = vi.mocked(messageRepoModule.messageRepository.isParticipant);

  const sessionRepoModule = await import('../src/modules/sessions/repository.js');
  isSessionParticipantMock = vi.mocked(sessionRepoModule.sessionRepository.isParticipant);

  const wsModule = await import('../src/modules/websocket/server.js');
  initializeWebSocket = wsModule.initializeWebSocket;
  broadcastToConversation = wsModule.broadcastToConversation;

  server = createServer();
  wss = initializeWebSocket(server);

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const { port } = server.address() as AddressInfo;
  address = `ws://127.0.0.1:${port}/ws`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    wss.close(() => resolve());
  });

  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });
});

beforeEach(() => {
  verifyAccessTokenMock.mockReset();
  isConversationParticipantMock.mockReset();
  isSessionParticipantMock.mockReset();
});

describe('WebSocket security (WS_V2_AUTH)', () => {
  it('requires auth before subscribe', async () => {
    const ws = await connectClient();

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        payload: { conversationId: 'conv-1' },
      })
    );

    const response = await waitForType(ws, 'error');
    expect(response.payload.code).toBe('NOT_AUTHENTICATED');

    ws.close();
  });

  it('rejects unauthorized conversation subscribe', async () => {
    verifyAccessTokenMock.mockResolvedValue({
      userId: 'user-1',
      role: 'user',
      isGuest: false,
    });
    isConversationParticipantMock.mockResolvedValue(false);

    const ws = await connectClient();

    ws.send(
      JSON.stringify({
        type: 'authenticate',
        payload: { token: 'valid-token' },
      })
    );

    await waitForType(ws, 'authenticated');

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        payload: { conversationId: 'conv-1' },
      })
    );

    const response = await waitForType(ws, 'error');
    expect(response.payload.code).toBe('FORBIDDEN');

    ws.close();
  });

  it('accepts authorized conversation subscribe', async () => {
    verifyAccessTokenMock.mockResolvedValue({
      userId: 'user-1',
      role: 'user',
      isGuest: false,
    });
    isConversationParticipantMock.mockResolvedValue(true);

    const ws = await connectClient();

    ws.send(
      JSON.stringify({
        type: 'authenticate',
        payload: { token: 'valid-token' },
      })
    );

    await waitForType(ws, 'authenticated');

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        payload: { conversationId: 'conv-1' },
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    broadcastToConversation('conv-1', {
      type: 'new_message',
      payload: {
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-2',
        content: 'hello',
        type: 'text',
        createdAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

    const response = await waitForType(ws, 'new_message');
    expect(response.payload.conversationId).toBe('conv-1');

    ws.close();
  });

  it('rejects unauthorized session subscribe', async () => {
    verifyAccessTokenMock.mockResolvedValue({
      userId: 'user-1',
      role: 'user',
      isGuest: false,
    });
    isSessionParticipantMock.mockResolvedValue(false);

    const ws = await connectClient();

    ws.send(
      JSON.stringify({
        type: 'authenticate',
        payload: { token: 'valid-token' },
      })
    );

    await waitForType(ws, 'authenticated');

    ws.send(
      JSON.stringify({
        type: 'subscribe',
        payload: { sessionId: 'session-1' },
      })
    );

    const response = await waitForType(ws, 'error');
    expect(response.payload.code).toBe('FORBIDDEN');

    ws.close();
  });
});
