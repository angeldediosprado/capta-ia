import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestMap } from '../prospecting/map-transport.server';
afterEach(() => vi.unstubAllGlobals());
describe('bounded public map availability', () => {
  it('uses one fixed alternate on unavailability and records the actual endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('', { status: 406 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ elements: [{ id: 1 }] })));
    vi.stubGlobal('fetch', fetchMock);
    const result = await requestMap('query');
    expect(result.url).toBe('https://overpass.kumi.systems/api/interpreter');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
  });
  it('does not evade public rate limits through another instance', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 429 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(requestMap('query')).rejects.toThrow('límite');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('rejects incomplete output without retrying or presenting it as success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ elements: [{ id: 1 }], remark: 'timeout' })));
    vi.stubGlobal('fetch', fetchMock);
    await expect(requestMap('query')).rejects.toThrow('parciales');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('fails after two unavailable responses with no fabricated records', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(requestMap('query')).rejects.toThrow('guardadas siguen intactas');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});