import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyInboundIntent, isBusinessRegistrationPhrase, normalizeParsedShoppingQuery } from './aiService.ts';

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
    'Where can I find a black shoe in Enugu?',
    'I need a black hill shoe for my graduation',
    'dior',
    'small habdbag',
    'lontor',
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

test('brand-only and typo-normalized commerce requests use the local buyer-search path', async () => {
  for (const phrase of ['dior', 'small habdbag', 'lontor']) {
    const result = await classifyInboundIntent(phrase);
    assert.equal(result.intent, 'BUYER_SEARCH', `${phrase} should be routed locally to commerce search`);
  }
});

test('greetings still stay on greeting intent', async () => {
  const result = await classifyInboundIntent('Hi Floate');
  assert.equal(result.intent, 'GREETING');
});

test('cleans greeting and buyer location noise from footwear search queries', () => {
  const parsed = normalizeParsedShoppingQuery(
    'Hello Floate I want to buy footwear, I am in Enugu',
    {
      searchKeywords: 'Hello Floate footwear I am',
      category: 'Fashion',
      inferredCategories: ['Gowns', 'Handbags'],
      buyerLocation: null,
      targetSellerLocation: null,
      itemType: 'product',
    },
  );

  assert.equal(parsed.searchKeywords, 'footwear');
  assert.equal(parsed.buyerLocation, 'Enugu');
  assert.equal(parsed.targetSellerLocation, null);
  assert.equal(parsed.category, 'Footwear');
  assert.deepEqual(parsed.inferredCategories, ['Footwear', 'Shoes', 'Slippers', 'Sandals']);
});

test('extracts product keywords and requested seller location from a natural-language question', () => {
  const parsed = normalizeParsedShoppingQuery(
    'Where can I find a black bag in Enugu?',
    {
      searchKeywords: 'Where can I find black bag in Enugu',
      category: 'Fashion',
      inferredCategories: ['Clothing'],
      buyerLocation: null,
      targetSellerLocation: null,
      itemType: 'product',
    },
  );

  assert.equal(parsed.searchKeywords, 'black bag');
  assert.equal(parsed.targetSellerLocation, 'Enugu');
  assert.equal(parsed.category, 'Bags & Accessories');
  assert.deepEqual(parsed.inferredCategories, ['Bags & Accessories']);
});

test('normalizes a likely footwear typo and removes a use-case phrase', () => {
  const parsed = normalizeParsedShoppingQuery(
    'I need a black hill shoe for my graduation',
    {
      searchKeywords: 'black hill shoe graduation',
      category: 'Clothing',
      inferredCategories: ['Clothing'],
      itemType: 'product',
    },
  );

  assert.equal(parsed.searchKeywords, 'black heel shoe');
  assert.equal(parsed.category, 'Footwear');
});

test('preserves separately parsed products in a multi-item commerce query', () => {
  const parsed = normalizeParsedShoppingQuery(
    'I want buy blue jeans and white polo plus leather palm',
    {
      searchKeywords: 'blue jeans and white polo plus leather palm',
      category: null,
      inferredCategories: [],
      itemType: 'product',
    },
  );

  assert.equal(parsed.items?.length, 3);
  assert.deepEqual(parsed.items?.map((item) => item.category), [
    'Fashion & Apparel',
    'Fashion & Apparel',
    'Footwear',
  ]);
  assert.equal(parsed.items?.[0]?.color, 'blue');
  assert.equal(parsed.items?.[1]?.color, 'white');
  assert.equal(parsed.items?.[2]?.material, 'leather');
});

test('merchant hub access opens the portal without starting registration', async () => {
  const phrase = 'My merchant hub';
  assert.equal(isBusinessRegistrationPhrase(phrase), false);
  assert.equal(isBusinessRegistrationPhrase('I want to register my business'), true);

  const result = await classifyInboundIntent(phrase);
  assert.equal(result.intent, 'MERCHANT_PORTAL');
});
