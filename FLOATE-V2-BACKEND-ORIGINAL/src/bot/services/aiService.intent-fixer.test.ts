import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyInboundIntent } from './aiService.ts';

test('direct product queries classify as buyer search immediately', async () => {
  const samples = [
    'I want footwears for Christmas in Onitsha',
    'I need a Samsung phone under 200k',
    'Search for leather slippers in Lagos',
  ];

  for (const sample of samples) {
    const result = await classifyInboundIntent(sample);
    assert.equal(result.intent, 'BUYER_SEARCH', `${sample} should be treated as a buyer search`);
  }
});

test('greetings still stay on greeting intent', async () => {
  const result = await classifyInboundIntent('Hi Floate');
  assert.equal(result.intent, 'GREETING');
});
