import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseLocalCommerceRequest,
  resolveSearchPath,
  SEARCH_BRANDS,
} from './searchLexicon.ts';

const realWorldPhrases = [
  { phrase: 'I want buy blue jeans and white polo plus leather palm', categories: ['Fashion & Apparel', 'Fashion & Apparel', 'Footwear'] },
  { phrase: 'show me clean tokunbo gen and rechargeable fan', categories: ['Electricals, Appliances & Power', 'Electricals, Appliances & Power'] },
  { phrase: 'who get original kicks and senator material', categories: ['Footwear', 'Fashion & Apparel'] },
  { phrase: 'small habdbag', categories: ['Bags & Accessories'] },
  { phrase: 'pwerbank 20000mah', categories: ['Electronics & Gadgets'] },
  { phrase: 'hermes shuse size 43', categories: ['Footwear'] },
  { phrase: 'dior', categories: ['Fashion & Apparel'] },
  { phrase: 'oraimo', categories: ['Electronics & Gadgets'] },
  { phrase: 'lontor', categories: ['Electricals, Appliances & Power'] },
  { phrase: 'iphone 11 under 200k for onitsha', categories: ['Electronics & Gadgets'] },
  { phrase: 'senator native up and down', categories: ['Fashion & Apparel'] },
  { phrase: 'ankara material for wedding', categories: ['Fashion & Apparel'] },
  { phrase: 'white lace fabric', categories: ['Fashion & Apparel'] },
  { phrase: 'black jeans size 34', categories: ['Fashion & Apparel'] },
  { phrase: 'white polo shirt', categories: ['Fashion & Apparel'] },
  { phrase: 'vintage hoodie', categories: ['Fashion & Apparel'] },
  { phrase: 'palm slippers', categories: ['Footwear'] },
  { phrase: 'Nike crocs', categories: ['Footwear'] },
  { phrase: 'black crossbody handbag', categories: ['Bags & Accessories'] },
  { phrase: 'travelling bag and wallet', categories: ['Bags & Accessories', 'Bags & Accessories'] },
  { phrase: 'gold chain and wrist watch', categories: ['Bags & Accessories', 'Bags & Accessories'] },
  { phrase: 'sunglasses and baseball cap', categories: ['Bags & Accessories', 'Bags & Accessories'] },
  { phrase: 'Tecno Camon 30 brand new', categories: ['Electronics & Gadgets'] },
  { phrase: 'HP laptop UK used', categories: ['Electronics & Gadgets'] },
  { phrase: 'Apple iPad tablet', categories: ['Electronics & Gadgets'] },
  { phrase: 'Airpods and Oraimo charger', categories: ['Electronics & Gadgets', 'Electronics & Gadgets'] },
  { phrase: 'SanDisk memory card 128gb', categories: ['Electronics & Gadgets'] },
  { phrase: 'Tiger gen', categories: ['Electricals, Appliances & Power'] },
  { phrase: 'invetor and solar panels', categories: ['Electricals, Appliances & Power', 'Electricals, Appliances & Power'] },
  { phrase: 'chargeable standing fan', categories: ['Electricals, Appliances & Power'] },
  { phrase: 'Hisense television', categories: ['Electricals, Appliances & Power'] },
  { phrase: 'Haier Thermocool fridge and blender', categories: ['Electricals, Appliances & Power', 'Electricals, Appliances & Power'] },
  { phrase: 'human hair wig and body spray', categories: ['Beauty, Personal Care & Hair', 'Beauty, Personal Care & Hair'] },
  { phrase: 'oil perfume and skincare cream', categories: ['Beauty, Personal Care & Hair', 'Beauty, Personal Care & Hair'] },
  { phrase: 'curtains and duvet', categories: ['Home, Kitchen & Living', 'Home, Kitchen & Living'] },
  { phrase: 'cooking pots and storage containers', categories: ['Home, Kitchen & Living', 'Home, Kitchen & Living'] },
  { phrase: 'Toyota car spares', categories: ['Automotive & Spare Parts'] },
  { phrase: 'Tokunbo tyres and engine oil', categories: ['Automotive & Spare Parts', 'Automotive & Spare Parts'] },
  { phrase: 'rice and palm oil wholesale', categories: ['Provisions, Foodstuff & Grocery', 'Provisions, Foodstuff & Grocery'] },
  { phrase: 'bulk drinks and snacks', categories: ['Provisions, Foodstuff & Grocery', 'Provisions, Foodstuff & Grocery'] },
  { phrase: 'cement and plumbing hardware', categories: ['General & Market Goods', 'General & Market Goods'] },
  { phrase: 'stationery plus packaging cartons', categories: ['General & Market Goods', 'General & Market Goods'] },
  { phrase: 'Adidas sneakers size 44 under 80 thousand in Lagos', categories: ['Footwear'] },
  { phrase: '15 naira budget for black sandals in Aba', categories: ['Footwear'] },
];

const fixtureProducts = new Set(['iphone 11', 'powerbank', 'pwerbank']);

test('local commerce lexicon covers Nigerian product requests and emits the execution table', () => {
  assert.ok(realWorldPhrases.length >= 35);
  assert.ok(SEARCH_BRANDS.length >= 100, `Expected at least 100 brands, found ${SEARCH_BRANDS.length}`);
  const rows: Array<Record<string, string>> = [];

  for (const sample of realWorldPhrases) {
    const parsed = parseLocalCommerceRequest(sample.phrase);
    assert.equal(
      parsed.items.length,
      sample.categories.length,
      `${sample.phrase}: expected ${sample.categories.length} parsed item(s), got ${parsed.items.length}`,
    );
    assert.deepEqual(
      parsed.items.map((item) => item.category),
      sample.categories,
      `${sample.phrase}: category mapping mismatch`,
    );

    rows.push({
      'Input Phrase': sample.phrase,
      'Parsed Items': parsed.items.map((item) => item.productType).join(' + '),
      Category: [...new Set(parsed.items.map((item) => item.category).filter(Boolean))].join(', '),
      'Resolution Path': parsed.items.map((item) =>
        resolveSearchPath(item, fixtureProducts.has(item.productType.toLowerCase()), Boolean(item.category))
      ).join(' / '),
      'Gemini Used (Y/N)': parsed.usedLocalLexicon ? 'N' : 'Y',
    });
  }

  console.table(rows);
});

test('extracts item attributes, normalized budget, and Nigerian market location', () => {
  const parsed = parseLocalCommerceRequest('iphone 11 UK used under 200k for Onitsha');
  const item = parsed.items[0];
  assert.equal(parsed.budget, 200_000);
  assert.equal(parsed.location, 'Onitsha');
  assert.equal(item?.brand, 'Apple');
  assert.equal(item?.condition, 'UK Used');
  assert.equal(item?.category, 'Electronics & Gadgets');

  const informalBudget = parseLocalCommerceRequest('15 naira budget for black sandals in Aba');
  assert.equal(informalBudget.budget, 15_000);
  assert.equal(informalBudget.location, 'Aba');
  assert.equal(informalBudget.items[0]?.productType, 'sandals');

  const brandedProduct = parseLocalCommerceRequest('Nike crocs');
  assert.equal(brandedProduct.items[0]?.brand, 'Nike');
  assert.equal(brandedProduct.items[0]?.productType, 'crocs');
});

test('splits multi-item Pidgin requests without dropping item attributes', () => {
  const parsed = parseLocalCommerceRequest('I want buy blue jeans and white polo plus leather palm');
  assert.equal(parsed.items.length, 3);
  assert.equal(parsed.items[0]?.color, 'blue');
  assert.equal(parsed.items[1]?.color, 'white');
  assert.equal(parsed.items[2]?.material, 'leather');
  assert.equal(parsed.items[2]?.productType, 'palm slippers');
});
