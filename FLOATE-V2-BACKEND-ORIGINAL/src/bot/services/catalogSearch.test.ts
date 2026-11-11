import assert from 'node:assert/strict';
import test from 'node:test';
import { isBroadCategoryProductQuery, matchCatalogProducts } from './catalogSearch.ts';

const catalog = [
  {
    id: 's24-under-budget',
    product: 'Samsung Galaxy S24',
    price: '₦190,000',
    category: 'Phones & Accessories',
    listingType: 'Product',
    city: 'Lagos',
  },
  {
    id: 's24-over-budget',
    product: 'Samsung Galaxy S24 Ultra',
    price: '₦250,000',
    category: 'Phones & Accessories',
    listingType: 'Product',
    city: 'Lagos',
  },
  {
    id: 'generic-phone',
    product: 'Infinix Note 40',
    price: '₦180,000',
    category: 'Phones & Accessories',
    listingType: 'Product',
    city: 'Lagos',
  },
  {
    id: 'service-match',
    product: 'Video Editing',
    price: 'Negotiable',
    category: 'Media & Production',
    listingType: 'Service',
    city: 'Enugu',
  },
  {
    id: 'wrong-type',
    product: 'Video Editing Laptop',
    price: '₦700,000',
    category: 'Computers',
    listingType: 'Product',
    city: 'Enugu',
  },
  {
    id: 'category-service',
    product: 'Creative Studio',
    price: 'Negotiable',
    category: 'Graphic Design Services',
    listingType: 'Service',
    city: 'Lagos',
  },
  {
    id: 'website-service',
    product: 'Custom Website Development',
    price: 'Negotiable',
    category: 'Tech & Digital Services',
    listingType: 'Service',
    city: 'Lagos',
  },
  {
    id: 'black-tshirt',
    product: 'Black T-Shirt',
    price: '₦12,000',
    category: 'Fashion & Clothing',
    listingType: 'Product',
    city: 'Lagos',
  },
  {
    id: 'makeup-kit',
    product: 'Makeup Kit',
    price: '₦25,000',
    category: 'Beauty & Cosmetics',
    listingType: 'Product',
    city: 'Lagos',
  },
  {
    id: 'designer-service',
    product: 'Graphic Design Services',
    price: 'Negotiable',
    category: 'Media & Graphic Design',
    listingType: 'Service',
    city: 'Lagos',
  },
  {
    id: 'video-editor-service',
    product: 'Video Editing Services',
    price: 'Negotiable',
    category: 'Media & Production',
    listingType: 'Service',
    city: 'Lagos',
  },
  {
    id: 'handbag',
    product: 'Leather Handbag',
    price: '₦35,000',
    category: 'Footwear & Leather',
    listingType: 'Product',
    city: 'Lagos',
  },
  {
    id: 'jeans',
    product: 'Black Jeans',
    price: '₦20,000',
    category: 'Fashion & Fabrics',
    listingType: 'Product',
    city: 'Lagos',
  },
  {
    id: 'black-heel-shoe',
    product: 'Black Heel Shoe',
    price: '₦45,000',
    category: 'Footwear',
    listingType: 'Product',
    city: 'Enugu',
  },
  {
    id: 'white-heel-shoe',
    product: 'White Heel Shoe',
    price: '₦45,000',
    category: 'Footwear',
    listingType: 'Product',
    city: 'Enugu',
  },
];

test('matches query keywords and enforces a stated budget', () => {
  const results = matchCatalogProducts(
    catalog,
    'Samsung S24',
    'Lagos',
    10,
    { maxPriceNaira: 200_000, itemType: 'product' },
  );

  assert.deepEqual(results.map((product) => product.id), ['s24-under-budget']);
});

test('broad product categories are routed to merchant search instead of product suggestions', () => {
  assert.equal(isBroadCategoryProductQuery('footwear'), true);
  assert.equal(isBroadCategoryProductQuery('shoes and slippers'), true);
  assert.equal(isBroadCategoryProductQuery('Nike Air Jordan shoes'), false);
});

test('matches related product vocabulary without losing specific item constraints', () => {
  const results = matchCatalogProducts(
    [{ id: 'sandals', product: 'Leather Sandals', category: 'Footwear' }],
    'slippers',
  );

  assert.equal(results[0]?.id, 'sandals');
});

test('uses parsed service intent and inferred categories without matching products', () => {
  const results = matchCatalogProducts(
    catalog,
    'Graphic Designer',
    'Lagos',
    10,
    {
      category: 'Creative Services',
      inferredCategories: ['Graphic Design', 'Graphic Designer', 'Design Services'],
      itemType: 'service',
    },
  );

  assert.deepEqual(results.map((product) => product.id), ['designer-service', 'category-service']);
});

test('matches natural website requests to website development services', () => {
  const results = matchCatalogProducts(
    catalog,
    'professional website',
    'Lagos',
    10,
    {
      category: 'Tech & Digital Services',
      inferredCategories: ['Website Development', 'Web Design', 'Web Developer', 'E-commerce Website'],
      itemType: 'service',
    },
  );

  assert.deepEqual(results.map((product) => product.id), ['website-service']);
});

test('normalizes conversational product names such as T-shirts and make-up kits', () => {
  const tShirtResults = matchCatalogProducts(
    catalog,
    'black t shirt',
    'Lagos',
    10,
    { itemType: 'product' },
  );
  const makeupResults = matchCatalogProducts(
    catalog,
    'make up kit',
    'Lagos',
    10,
    { category: 'Beauty & Cosmetics', inferredCategories: ['Makeup Kits'], itemType: 'product' },
  );

  assert.deepEqual(tShirtResults.map((product) => product.id), ['black-tshirt']);
  assert.deepEqual(makeupResults.map((product) => product.id), ['makeup-kit']);
});

test('requires requested color and specific shoe style to match listed products', () => {
  const exactMatch = matchCatalogProducts(
    catalog,
    'black heel shoe',
    'Enugu',
    10,
    { itemType: 'product' },
  );
  const missingStyleMatch = matchCatalogProducts(
    catalog,
    'black flat shoe',
    'Enugu',
    10,
    { itemType: 'product' },
  );

  assert.deepEqual(exactMatch.map((product) => product.id), ['black-heel-shoe']);
  assert.deepEqual(missingStyleMatch, []);
});

test('matches freelancer roles and category aliases in the catalog', () => {
  const graphicDesigners = matchCatalogProducts(
    catalog,
    'graphic designer',
    'Lagos',
    10,
    {
      category: 'Media & Graphic Design',
      inferredCategories: ['Graphic Design Services', 'Graphic Designer', 'Branding', 'Logo Design'],
      itemType: 'service',
    },
  );
  const videoEditors = matchCatalogProducts(
    catalog,
    'video editor',
    'Lagos',
    10,
    {
      category: 'Media & Production',
      inferredCategories: ['Video Editing Services', 'Video Editor', 'Videography', 'Media Production'],
      itemType: 'service',
    },
  );
  const handbags = matchCatalogProducts(catalog, 'handbag seller', 'Lagos', 10, { itemType: 'product' });
  const jeans = matchCatalogProducts(catalog, 'black jeans', 'Lagos', 10, { itemType: 'product' });

  assert.deepEqual(graphicDesigners.map((product) => product.id), ['designer-service', 'category-service']);
  assert.deepEqual(videoEditors.map((product) => product.id), ['video-editor-service', 'service-match']);
  assert.deepEqual(handbags.map((product) => product.id), ['handbag']);
  assert.deepEqual(jeans.map((product) => product.id), ['jeans']);
});
