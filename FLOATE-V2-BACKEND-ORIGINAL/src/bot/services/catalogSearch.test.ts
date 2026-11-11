import assert from 'node:assert/strict';
import test from 'node:test';
import { matchCatalogProducts } from './catalogSearch.ts';

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

  assert.deepEqual(results.map((product) => product.id), ['category-service']);
});
