import test from 'node:test';
import assert from 'node:assert/strict';
import { detectMediaType, uploadTypeMatches } from './media.js';

const samples = [
  ['image/jpeg', 'ffd8ffe000'],
  ['image/png', '89504e470d0a1a0a'],
  ['image/webp', '524946460000000057454250'],
  ['image/gif', Buffer.from('GIF89a').toString('hex')],
  ['video/mp4', '000000186674797069736f6d'],
  ['video/webm', '1a45dfa3']
];

test('recognizes supported media by file signature', () => {
  for (const [type, hex] of samples) assert.equal(detectMediaType(Buffer.from(hex, 'hex')), type);
});

test('rejects unsupported data and mismatched browser MIME claims', () => {
  assert.equal(detectMediaType(Buffer.from('<html>fake image</html>')), null);
  assert.equal(uploadTypeMatches(Buffer.from(samples[0][1], 'hex'), 'image/png'), false);
  assert.equal(uploadTypeMatches(Buffer.from(samples[2][1], 'hex'), 'image/webp'), true);
});
