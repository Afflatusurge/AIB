import assert from 'node:assert/strict';
import test from 'node:test';
import type { NewsSourceDefinition } from '../src/config/news-sources.ts';
import { classifyRelease } from '../src/lib/news/release-classifier.ts';

const source: NewsSourceDefinition = {
  slug: 'test-vendor',
  name: 'Test Vendor',
  entity: 'Test Vendor',
  products: ['Grok', 'Seedance', 'DeepSeek'],
  domains: ['example.test'],
  adapter: 'html_links',
  pageUrl: 'https://example.test/news',
  reliability: 'A',
  kind: 'official_release',
  independent: false,
  allowDiscovery: true,
  allowAutoPublish: true,
  requiresCorroboration: false,
  mustWatch: true,
  watchPriority: 'P0',
  excludeTerms: ['partnership'],
};

test('classifies a named version launch as a P0 major version', () => {
  const result = classifyRelease(
    'Introducing Grok 4.5',
    'The model is now available through the API.',
    source
  );
  assert.equal(result.isRelease, true);
  assert.equal(result.eventType, 'major_version');
  assert.equal(result.priority, 'P0');
  assert.equal(result.matchedProduct, 'Grok');
});

test('accepts an official product version title without generic release wording', () => {
  const result = classifyRelease(
    'Seedance 2.0',
    'New video generation capabilities for creators.',
    source
  );
  assert.equal(result.isRelease, true);
  assert.equal(result.eventType, 'major_version');
  assert.equal(result.priority, 'P0');
});

test('classifies pricing and deprecation changes as P0', () => {
  const pricing = classifyRelease(
    'DeepSeek API pricing update',
    'Token prices change on August 1.',
    source
  );
  const deprecation = classifyRelease(
    'DeepSeek retires legacy API models',
    'End of support is scheduled for September.',
    source
  );
  assert.equal(pricing.eventType, 'pricing');
  assert.equal(pricing.priority, 'P0');
  assert.equal(deprecation.eventType, 'deprecation');
  assert.equal(deprecation.priority, 'P0');
});

test('exclusion rules and ordinary company news do not become releases', () => {
  const excluded = classifyRelease(
    'Test Vendor announces a partnership',
    'The companies will work together.',
    source
  );
  const ordinary = classifyRelease(
    'Test Vendor opens a new office',
    'The office will house fifty employees.',
    source
  );
  assert.equal(excluded.isRelease, false);
  assert.match(excluded.reasons[0], /excluded term/);
  assert.equal(ordinary.isRelease, false);
});
