import { describe, it, expect } from 'vitest';
import { validatePublicConfig } from '../backend/public-config';
describe('external public configuration', () => {
  it('rejects missing target configuration', () => expect(() => validatePublicConfig(undefined, undefined)).toThrow());
  it('rejects secret keys in the browser', () => expect(() => validatePublicConfig('https://example.com', 'sb_secret_unsafe')).toThrow('clave privada'));
  it('rejects legacy service role keys', () => expect(() => validatePublicConfig('https://example.com', `e30.${btoa(JSON.stringify({role:'service_role'}))}.signature`)).toThrow('clave privada'));
  it('requires HTTPS', () => expect(() => validatePublicConfig('http://example.com', 'sb_publishable_test')).toThrow('HTTPS'));
  it('accepts a public target key', () => expect(validatePublicConfig('https://example.com', 'sb_publishable_test')).toEqual({url:'https://example.com',key:'sb_publishable_test'}));
});
