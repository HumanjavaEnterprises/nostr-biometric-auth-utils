import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebAuthnClient } from '../../client/webauthn';

// Bytes chosen so standard base64 would contain '+', '/', and '=' padding,
// proving the serializer emits base64url ('-', '_', unpadded) instead.
const TRICKY_BYTES = new Uint8Array([0xfb, 0xff, 0xbf, 0xfb, 0xff]);
// Standard base64 of TRICKY_BYTES is "+/+/+/8=" -> base64url "-_-_-_8"
const TRICKY_BASE64URL = '-_-_-_8';

const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer;
}

describe('WebAuthnClient credential serialization', () => {
  const createMock = vi.fn();
  const getMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('window', {
      btoa: (s: string) => Buffer.from(s, 'binary').toString('base64'),
      atob: (s: string) => Buffer.from(s, 'base64').toString('binary'),
      PublicKeyCredential: function PublicKeyCredential() {}
    });
    vi.stubGlobal('navigator', {
      credentials: { create: createMock, get: getMock }
    });
    createMock.mockReset();
    getMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function makeClient(): WebAuthnClient {
    return new WebAuthnClient({
      rpId: 'example.com',
      rpName: 'Example',
      timeout: 1000,
      userVerification: 'required'
    } as any);
  }

  it('register() serializes the REGISTRATION (attestation) shape with a base64url attestationObject', async () => {
    createMock.mockResolvedValue({
      id: 'cred-id',
      type: 'public-key',
      rawId: toArrayBuffer(TRICKY_BYTES),
      response: {
        attestationObject: toArrayBuffer(TRICKY_BYTES),
        clientDataJSON: toArrayBuffer(new Uint8Array([1, 2, 3])),
        getTransports: () => ['internal', 'hybrid']
      }
    });

    const result = await makeClient().register('Y2hhbGxlbmdl', 'user-id', 'user-name');

    // Top-level registration shape
    expect(result.id).toBe('cred-id');
    expect(result.type).toBe('public-key');
    expect(result.rawId).toBe(TRICKY_BASE64URL);

    // Attestation response shape — attestationObject MUST be present and base64url
    expect(result.response.attestationObject).toBe(TRICKY_BASE64URL);
    expect(result.response.attestationObject).toMatch(BASE64URL_RE);
    expect(result.response.attestationObject).not.toMatch(/[+/=]/);
    expect(result.response.clientDataJSON).toMatch(BASE64URL_RE);
    expect(result.response.transports).toEqual(['internal', 'hybrid']);

    // Must NOT be the assertion shape
    expect(result.response).not.toHaveProperty('signature');
    expect(result.response).not.toHaveProperty('authenticatorData');
    expect(result.response).not.toHaveProperty('userHandle');
  });

  it('register() tolerates authenticators without getTransports()', async () => {
    createMock.mockResolvedValue({
      id: 'cred-id',
      type: 'public-key',
      rawId: toArrayBuffer(new Uint8Array([9])),
      response: {
        attestationObject: toArrayBuffer(new Uint8Array([4, 5, 6])),
        clientDataJSON: toArrayBuffer(new Uint8Array([1, 2, 3]))
      }
    });

    const result = await makeClient().register('Y2hhbGxlbmdl', 'user-id', 'user-name');

    expect(result.response.attestationObject).toMatch(BASE64URL_RE);
    expect(result.response.transports).toEqual([]);
  });

  it('authenticate() serializes the ASSERTION shape with base64url fields', async () => {
    getMock.mockResolvedValue({
      id: 'cred-id',
      type: 'public-key',
      rawId: toArrayBuffer(TRICKY_BYTES),
      response: {
        authenticatorData: toArrayBuffer(TRICKY_BYTES),
        clientDataJSON: toArrayBuffer(new Uint8Array([1, 2, 3])),
        signature: toArrayBuffer(TRICKY_BYTES),
        userHandle: toArrayBuffer(new Uint8Array([7, 8]))
      }
    });

    const result = await makeClient().authenticate('Y2hhbGxlbmdl');

    expect(result.response.authenticatorData).toBe(TRICKY_BASE64URL);
    expect(result.response.signature).toBe(TRICKY_BASE64URL);
    expect(result.response.signature).not.toMatch(/[+/=]/);
    expect(result.response.clientDataJSON).toMatch(BASE64URL_RE);
    expect(result.response.userHandle).toMatch(BASE64URL_RE);
    expect(result.response).not.toHaveProperty('attestationObject');
  });
});
