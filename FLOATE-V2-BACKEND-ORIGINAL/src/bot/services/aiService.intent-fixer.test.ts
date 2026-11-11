import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyInboundIntent } from './aiService.ts';

test('direct product queries classify as buyer search immediately', async () => {
  const samples = [
    'I want footwears for Christmas in Onitsha',
    'I need a Samsung phone under 200k',
    'Search for leather slippers in Lagos',
    'I want a professional website',
    'I need a black t-shirt',
    'I want a make up kit',
    'I need an HP laptop',
    'I want to hire a graphic designer',
    'I need a video editor',
    'I want a handbag seller',
    'I need black jeans',
    'I want a custom 3D printed sculpture',
    'Graphic designers',
    'Handbag sellers',
    'Jean sellers',
  ];

  for (const sample of samples) {
    const result = await classifyInboundIntent(sample);
    assert.equal(result.intent, 'BUYER_SEARCH', `${sample} should be treated as a buyer search`);
  }
});

test('generic help requests are not mistaken for catalog searches', async () => {
  const result = await classifyInboundIntent('I need help');
  assert.notEqual(result.intent, 'BUYER_SEARCH');
});

test('greetings still stay on greeting intent', async () => {
  const result = await classifyInboundIntent('Hi Floate');
  assert.equal(result.intent, 'GREETING');
});
