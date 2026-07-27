import assert from 'node:assert/strict';
import test from 'node:test';
import { hashEditorToken } from '../src/lib/editor-token.ts';

test('hashes editor tokens deterministically without retaining the raw token', () => {
  const token = 'aib_ed_example-token-with-enough-entropy';
  const hash = hashEditorToken(token);

  assert.equal(hash.length, 64);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.equal(hash, hashEditorToken(token));
  assert.notEqual(hash, token);
});

test('different editor tokens produce different hashes', () => {
  assert.notEqual(
    hashEditorToken('aib_ed_first-example-token-with-entropy'),
    hashEditorToken('aib_ed_second-example-token-with-entropy')
  );
});
