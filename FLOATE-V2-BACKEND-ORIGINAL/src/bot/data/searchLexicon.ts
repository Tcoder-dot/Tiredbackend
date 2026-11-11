export interface SearchSubcategory {
  name: string;
  aliases: string[];
}

export interface SearchCategory {
  name: string;
  subcategories: SearchSubcategory[];
}

export interface SearchBrand {
  name: string;
  category: string;
  subcategory: string;
  aliases?: string[];
}

export interface ParsedCommerceItem {
  originalText: string;
  productType: string;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  color: string | null;
  size: string | null;
  condition: string | null;
  material: string | null;
  budget: number | null;
  location: string | null;
  confidence: number;
}

export interface ParsedCommerceRequest {
  normalizedText: string;
  items: ParsedCommerceItem[];
  budget: number | null;
  location: string | null;
  usedLocalLexicon: boolean;
}

export type SearchResolutionPath =
  | 'DIRECT_PRODUCT_MATCH'
  | 'CATEGORY_MERCHANTS_FALLBACK'
  | 'CLARIFYING_QUESTION'
  | 'EMPTY_CATEGORY';

export const SEARCH_CATEGORIES: SearchCategory[] = [
  { name: 'Fashion & Apparel', subcategories: [
    { name: 'Native & Senator Wear', aliases: ['native', 'senator', 'up and down', 'up nd down', 'agbada', 'kaftan'] },
    { name: 'Fabrics', aliases: ['ankara', 'lace', 'material', 'fabric', 'aso oke'] },
    { name: 'Jeans & Trousers', aliases: ['jeans', 'jean', 'denim', 'trousers', 'pants'] },
    { name: 'Polos & Tops', aliases: ['polo', 'polos', 'top', 'tops', 'shirt', 'shirts', 'blouse'] },
    { name: 'Suits & Formal Wear', aliases: ['suit', 'suits', 'corporate wear', 'formal wear'] },
    { name: 'Activewear', aliases: ['activewear', 'sportswear', 'gym wear', 'leggings'] },
    { name: 'Undergarments', aliases: ['underwear', 'boxers', 'bra', 'lingerie'] },
    { name: 'Hoodies & Vintage', aliases: ['hoodie', 'hoodies', 'vintage', 'thrift', 'okrika', 'bend down select'] },
    { name: 'Dresses & Gowns', aliases: ['dress', 'gown', 'gowns', 'jumpsuit'] },
  ] },
  { name: 'Footwear', subcategories: [
    { name: 'Palm Slippers & Slides', aliases: ['palm', 'palms', 'palm slippers', 'slippers', 'slides', 'slide', 'slippa', 'palms slippers'] },
    { name: 'Sneakers & Canvas', aliases: ['sneaker', 'sneakers', 'kicks', 'creps', 'crepes', 'canvas', 'trainers'] },
    { name: 'Leather & Formal Shoes', aliases: ['leather shoe', 'leather shoes', 'formal shoe', 'corporate shoe', 'oxford', 'loafers'] },
    { name: 'Heels & Flats', aliases: ['heel', 'heels', 'high heels', 'flat shoe', 'flats', 'ballet flats'] },
    { name: 'Sandals & Crocs', aliases: ['sandal', 'sandals', 'crocs', 'croc'] },
    { name: 'Boots', aliases: ['boot', 'boots', 'ankle boots'] },
    { name: 'Footwear', aliases: ['footwear', 'shoes', 'shoe', 'shuse', 'shuse'] },
  ] },
  { name: 'Bags & Accessories', subcategories: [
    { name: 'Handbags & Purses', aliases: ['handbag', 'handbags', 'habdbag', 'purse', 'crossbody', 'tote', 'clutch'] },
    { name: 'Backpacks & Travel Bags', aliases: ['backpack', 'rucksack', 'travelling bag', 'travel bag', 'travel box', 'suitcase', 'luggage'] },
    { name: 'Wallets & Belts', aliases: ['wallet', 'wallets', 'belt', 'belts'] },
    { name: 'Jewelry & Watches', aliases: ['jewelry', 'jewellery', 'chain', 'chains', 'necklace', 'watch', 'watches', 'bracelet', 'ring'] },
    { name: 'Caps & Sunglasses', aliases: ['cap', 'caps', 'hat', 'hats', 'sunglasses', 'shades'] },
    { name: 'Bags & Accessories', aliases: ['bag', 'bags', 'accessories'] },
  ] },
  { name: 'Electronics & Gadgets', subcategories: [
    { name: 'Phones & Tablets', aliases: ['phone', 'phones', 'iphone', 'smartphone', 'android', 'tablet', 'ipad', 'uk used phone'] },
    { name: 'Laptops & Computers', aliases: ['laptop', 'laptops', 'computer', 'pc', 'macbook', 'notebook'] },
    { name: 'Audio & Wearables', aliases: ['smartwatch', 'smart watch', 'airpod', 'airpods', 'earbud', 'earbuds', 'headphone', 'headphones'] },
    { name: 'Charging & Storage', aliases: ['charger', 'chargers', 'powerbank', 'pwerbank', 'power bank', 'memory card', 'cable', 'cables', 'usb'] },
    { name: 'Electronics & Gadgets', aliases: ['electronics', 'gadget', 'gadgets'] },
  ] },
  { name: 'Electricals, Appliances & Power', subcategories: [
    { name: 'Generators & Inverters', aliases: ['generator', 'gen', 'tiger gen', 'inverter', 'invetor', 'i pass my neighbor', 'ipmn'] },
    { name: 'Solar & Batteries', aliases: ['solar', 'solar panel', 'solar panels', 'battery', 'batteries', 'car battery'] },
    { name: 'Fans & Cooling', aliases: ['fan', 'fans', 'chargeable fan', 'rechargeable fan', 'rechargeble fan', 'standing fan', 'lontor fan', 'ac', 'air conditioner'] },
    { name: 'Home Appliances', aliases: ['tv', 'television', 'fridge', 'freezer', 'cooker', 'blender', 'stabilizer', 'extension box'] },
    { name: 'Electricals & Power', aliases: ['electricals', 'power', 'appliance', 'appliances'] },
  ] },
  { name: 'Beauty, Personal Care & Hair', subcategories: [
    { name: 'Wigs & Hair', aliases: ['wig', 'wigs', 'weave', 'weaves', 'hair extension', 'hair extensions', 'frontal', 'braids'] },
    { name: 'Skincare & Cosmetics', aliases: ['skincare', 'skin care', 'cream', 'creams', 'makeup', 'make up', 'cosmetics', 'soap', 'soaps'] },
    { name: 'Perfumes & Body Care', aliases: ['perfume', 'perfumes', 'oil perfume', 'body spray', 'body sprays', 'deodorant'] },
    { name: 'Grooming', aliases: ['clipper', 'clippers', 'barber', 'shaving machine'] },
    { name: 'Beauty & Personal Care', aliases: ['beauty', 'personal care', 'hair'] },
  ] },
  { name: 'Home, Kitchen & Living', subcategories: [
    { name: 'Bedding & Curtains', aliases: ['curtain', 'curtains', 'bedsheet', 'bedsheets', 'duvet', 'duvets', 'blanket'] },
    { name: 'Furniture & Decor', aliases: ['furniture', 'chair', 'table', 'sofa', 'bed', 'rug', 'rugs', 'carpet', 'carpets'] },
    { name: 'Kitchenware & Cookware', aliases: ['kitchenware', 'cookware', 'pot', 'pots', 'pan', 'plates', 'cutlery', 'kettle'] },
    { name: 'Plastics & Storage', aliases: ['plastic', 'plastics', 'container', 'containers', 'storage container', 'bucket'] },
    { name: 'Home & Living', aliases: ['home', 'living', 'household'] },
  ] },
  { name: 'Automotive & Spare Parts', subcategories: [
    { name: 'Car Spares & Accessories', aliases: ['car spare', 'car spares', 'spare parts', 'car accessories', 'accessories for car'] },
    { name: 'Tyres & Batteries', aliases: ['tyre', 'tyres', 'tire', 'tires', 'car battery', 'car batteries'] },
    { name: 'Engine Oils', aliases: ['engine oil', 'motor oil', 'lubricant'] },
    { name: 'Automotive', aliases: ['automotive', 'auto parts'] },
  ] },
  { name: 'Provisions, Foodstuff & Grocery', subcategories: [
    { name: 'Staple Food & Grains', aliases: ['rice', 'beans', 'garri', 'yam', 'flour', 'foodstuff', 'food stuffs'] },
    { name: 'Oil & Spices', aliases: ['oil', 'palm oil', 'vegetable oil', 'spice', 'spices', 'pepper'] },
    { name: 'Drinks & Snacks', aliases: ['drink', 'drinks', 'snack', 'snacks', 'biscuits', 'beverages'] },
    { name: 'Provisions & Wholesale Grocery', aliases: ['provision', 'provisions', 'groceries', 'grocery', 'wholesale grocery', 'bulk snacks'] },
  ] },
  { name: 'General & Market Goods', subcategories: [
    { name: 'Hardware & Building Materials', aliases: ['hardware', 'cement', 'building material', 'building materials', 'nails', 'plumbing'] },
    { name: 'Stationery & Packaging', aliases: ['stationery', 'notebook', 'packaging', 'carton', 'nylon', 'envelope'] },
    { name: 'General Goods', aliases: ['general goods', 'market goods'] },
  ] },
];

const brandGroups: Array<{ category: string; subcategory: string; names: string }> = [
  { category: 'Electronics & Gadgets', subcategory: 'Phones & Tablets', names: 'Apple|Samsung|Tecno|Infinix|Xiaomi|Redmi|Oppo|Vivo|Huawei|Nokia|Itel|Google Pixel|OnePlus|Realme|Motorola|Sony Xperia|Honor|Asus ROG|ZTE|Lenovo' },
  { category: 'Electronics & Gadgets', subcategory: 'Charging & Storage', names: 'Oraimo|Anker|Baseus|Ugreen|Aukey|Belkin|Sandisk|Kingston|Transcend|Lexar|JBL|Beats|Soundcore|Skullcandy|Havit|Logitech|Razer|TP-Link|D-Link|Tenda' },
  { category: 'Electronics & Gadgets', subcategory: 'Laptops & Computers', names: 'HP|Dell|Lenovo|Apple MacBook|Acer|Asus|Microsoft Surface|MSI|Toshiba|Fujitsu|Gigabyte|Alienware|Compaq' },
  { category: 'Electricals, Appliances & Power', subcategory: 'Home Appliances', names: 'LG|Hisense|Haier Thermocool|Panasonic|Midea|Samsung TV|TCL|Sharp|Scanfrost|Nexus|Bruhm|Maxi|Binatone|Century|Ox|Qasa|Polystar|Saisho|Skyrun|Hisense' },
  { category: 'Electricals, Appliances & Power', subcategory: 'Fans & Cooling', names: 'Lontor|Century|Ox|Binatone|Qasa|Mouka|Gree|Haier Thermocool|Midea|Panasonic|Daikin|Hisense' },
  { category: 'Electricals, Appliances & Power', subcategory: 'Generators & Inverters', names: 'Tiger|Firman|Sumec Firman|Elepaq|Mikano|Honda|Yamaha|Sukam|Mercury|Luminous|Victron|Deye|Felicity Solar|Genus|Blue Gate' },
  { category: 'Footwear', subcategory: 'Sneakers & Canvas', names: 'Nike|Adidas|Puma|New Balance|Converse|Vans|Reebok|Jordan|Air Jordan|Under Armour|Skechers|Fila|Asics|Timberland|Crocs' },
  { category: 'Fashion & Apparel', subcategory: 'Dresses & Gowns', names: 'Gucci|Dior|Hermes|Hermès|Louis Vuitton|Chanel|Prada|Versace|Zara|H&M|Shein|Uniqlo|Burberry|Fendi|Balenciaga|Givenchy|Valentino|Dolce Gabbana|Armani|Tommy Hilfiger|Ralph Lauren|Calvin Klein|Levi Strauss|Levis|Gap|Nike Apparel|Adidas Originals' },
  { category: 'Bags & Accessories', subcategory: 'Handbags & Purses', names: 'Coach|Michael Kors|Kate Spade|Tory Burch|Longchamp|Celine|Bottega Veneta|Polene|Telfar|Guess|Aldo|Charles and Keith' },
  { category: 'Beauty, Personal Care & Hair', subcategory: 'Skincare & Cosmetics', names: 'Maybelline|MAC Cosmetics|Fenty Beauty|Nivea|Dove|CeraVe|The Ordinary|Neutrogena|L’Oreal|Loreal|Revlon|NYX|Huda Beauty|Clinique|Olay|Vaseline|Fair and White|Carotone|Oriflame|Avon|Mary Kay|Estée Lauder|Estee Lauder' },
  { category: 'Beauty, Personal Care & Hair', subcategory: 'Perfumes & Body Care', names: 'Zara Perfumes|Lattafa|Armaf|Dior Sauvage|Chanel No 5|Davidoff|Calvin Klein Fragrance|Afnan|Rasasi|Ajmal' },
  { category: 'Home, Kitchen & Living', subcategory: 'Furniture & Decor', names: 'IKEA|Ashley Furniture|Mouka|Vitafoam|Doyin|Kuka|Royal Furniture|Scanfrost Home' },
  { category: 'Automotive & Spare Parts', subcategory: 'Car Spares & Accessories', names: 'Toyota|Honda|Mercedes-Benz|BMW|Volkswagen|Lexus|Ford|Hyundai|Kia|Nissan|Peugeot|Mitsubishi|Mazda|Subaru|Land Rover|Range Rover|Volvo|Chevrolet|Audi|Jeep' },
  { category: 'Provisions, Foodstuff & Grocery', subcategory: 'Drinks & Snacks', names: 'Coca-Cola|Pepsi|Nestle|Dangote|Indomie|Golden Penny|Peak Milk|Dano|Milo|Bournvita|Fanta|Sprite|La Casera|Chi|Cadbury|Nescafe|Knorr|Maggi|Onga|Honeywell' },
];

export const SEARCH_BRANDS: SearchBrand[] = brandGroups.flatMap(({ category, subcategory, names }) =>
  [...new Set(names.split('|'))].map((name) => ({ name, category, subcategory }))
);

const BRAND_ALIASES: Record<string, string[]> = {
  apple: ['iphone', 'ipad', 'macbook', 'airpods'],
  samsung: ['galaxy', 'galaxy s', 'galaxy note'],
  nike: ['air max', 'air force'],
  adidas: ['yeezy'],
};

export function getBrandSearchAliases(brandName: string): string[] {
  const registeredBrand = SEARCH_BRANDS.find((brand) => brand.name.toLowerCase() === brandName.toLowerCase());
  return [
    brandName,
    ...(registeredBrand?.aliases || []),
    ...(BRAND_ALIASES[brandName.toLowerCase()] || []),
  ];
}

const TYPO_MAP: Record<string, string> = {
  habdbag: 'handbag',
  shuse: 'shoe',
  pwerbank: 'powerbank',
  snakers: 'sneakers',
  rechargeble: 'rechargeable',
  invetor: 'inverter',
  iphne: 'iphone',
  creps: 'sneakers',
  crepes: 'sneakers',
  slippa: 'slippers',
  gen: 'generator',
  tokumbo: 'tokunbo',
  brandnew: 'brand new',
  'i pass my neighbour': 'i pass my neighbor',
};

const COLORS = ['black', 'blue', 'brown', 'green', 'grey', 'gray', 'orange', 'pink', 'purple', 'red', 'white', 'yellow', 'gold', 'silver', 'cream', 'beige', 'navy'];
const CONDITIONS = [
  { canonical: 'UK Used', aliases: ['uk used', 'tokunbo', 'tokumbo', 'direct foreign', 'clean', 'foreign used'] },
  { canonical: 'Brand New', aliases: ['brand new', 'new'] },
  { canonical: 'Used', aliases: ['used', 'second hand', 'fairly used'] },
  { canonical: 'Refurbished', aliases: ['refurbished', 'renewed'] },
];
const MATERIALS = ['leather', 'ankara', 'lace', 'cotton', 'silk', 'denim', 'wool', 'suede', 'canvas', 'plastic', 'stainless steel', 'gold'];
export const SEARCH_LOCATIONS = [
  'Onitsha', 'Enugu', 'Lagos', 'Abuja', 'Aba', 'Owerri', 'Port Harcourt', 'Ibadan',
  'Kano', 'Asaba', 'Awka', 'Benin City', 'Warri', 'Calabar', 'Uyo', 'Abakaliki',
  'Nnewi', 'Nsukka', 'Kaduna', 'Jos', 'Ilorin', 'Ariaria', 'Balogun', 'Alaba',
  'Computer Village', 'Trade Fair', 'Ikeja', 'Lekki', 'Yaba', 'Oshodi',
];

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'want', 'wan', 'buy', 'need', 'show', 'find', 'where', 'can',
  'get', 'who', 'dey', 'have', 'has', 'have', 'original', 'please', 'for', 'in',
  'at', 'from', 'to', 'and', 'plus', 'with', 'join', 'am', 'follow', 'along',
  'small', 'big', 'large', 'size', 'budget', 'under', 'below', 'naira', 'ngn',
  'k', 'thousand', 'clean',
]);

function normalizeText(input: string): string {
  let value = input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  for (const [typo, correction] of Object.entries(TYPO_MAP)) {
    value = value.replace(new RegExp(`\\b${typo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), correction);
  }
  return value
    .replace(/\b(15|20|25|30|40|50|100)\s+naira\b/g, (_, amount: string) => `${Number(amount) * 1000} naira`)
    .replace(/\b(?:uk\s*used|tokunbo|direct foreign|foreign used|clean)\b/g, 'uk used')
    .replace(/\b(?:i pass my neighbour|ipmn|tiger gen)\b/g, 'generator')
    .replace(/\b(?:chargeable|rechargeble)\s+fan\b/g, 'rechargeable fan')
    .replace(/\bblack hill(?=\s+(?:shoe|shoes|slipper|slippers|sneaker|sneakers|heels?|flats?))\b/g, 'black heel')
    .replace(/\bmake[\s-]+up\b/g, 'makeup')
    .replace(/[^a-z0-9₦.,\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCommerceText(input: string): string {
  return normalizeText(input);
}

function levenshtein(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j++) {
      const previous = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + Number(left[i - 1] !== right[j - 1]));
      diagonal = previous;
    }
  }
  return row[right.length];
}

function aliases(): Array<{ category: string; subcategory: string; alias: string }> {
  return SEARCH_CATEGORIES.flatMap((category) =>
    category.subcategories.flatMap((subcategory) =>
      [subcategory.name, ...subcategory.aliases].map((alias) => ({
        category: category.name,
        subcategory: subcategory.name,
        alias: alias.toLowerCase(),
      }))
    )
  );
}

const CATEGORY_ALIASES = aliases();

function findCategory(text: string): { category: string; subcategory: string; alias: string; confidence: number } | null {
  const terms = text.split(' ');
  const candidates = CATEGORY_ALIASES
    .map((item) => ({ ...item, normalizedAlias: normalizeText(item.alias) }))
    .sort((a, b) => b.normalizedAlias.length - a.normalizedAlias.length);
  for (const candidate of candidates) {
    if (new RegExp(`\\b${candidate.normalizedAlias.replace(/\s+/g, '\\s+')}\\b`, 'i').test(text)) {
      return { ...candidate, confidence: 1 };
    }
  }
  for (const term of terms) {
    if (term.length < 5) continue;
    for (const candidate of candidates) {
      const words = candidate.normalizedAlias.split(' ');
      const near = words.find((word) => word.length >= 5 && levenshtein(term, word) <= 2);
      if (near) return { ...candidate, alias: near, confidence: 0.78 };
    }
  }
  return null;
}

function findBrand(text: string, categoryAlias?: string): SearchBrand | null {
  const normalized = normalizeText(text);
  const brands = [...SEARCH_BRANDS].sort((a, b) => b.name.length - a.name.length);
  const matches = brands.filter((brand) => {
    const names = getBrandSearchAliases(brand.name);
    return names.some((candidate) => {
      const name = normalizeText(candidate);
      return new RegExp(`\\b${name.replace(/\s+/g, '\\s+')}\\b`, 'i').test(normalized);
    });
  });
  if (matches.length > 1 && categoryAlias) {
    const alias = normalizeText(categoryAlias);
    return matches.find((brand) => normalizeText(brand.name) !== alias) || matches[0];
  }
  return matches[0] || null;
}

function parseBudget(text: string): number | null {
  const patterns = [
    /(?:under|below|budget(?:\s+of)?|around|about|up to)?\s*(?:₦|ngn)?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|m|thousand|million)\b/i,
    /(?:₦|ngn)\s*(\d[\d,]*(?:\.\d+)?)/i,
    /\b(\d[\d,]*)\s+naira\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const amount = Number(match[1].replace(/,/g, ''));
    const unit = (match[2] || '').toLowerCase();
    const multiplier = unit === 'k' || unit === 'thousand' ? 1000 :
      unit === 'm' || unit === 'million' ? 1_000_000 :
      /\b\d+\s+naira\b/i.test(match[0]) && amount < 1000 ? 1000 : 1;
    return amount * multiplier;
  }
  return null;
}

function parseLocation(text: string): string | null {
  const normalized = normalizeText(text);
  const match = [...SEARCH_LOCATIONS]
    .sort((a, b) => b.length - a.length)
    .find((location) => new RegExp(`\\b${normalizeText(location).replace(/\s+/g, '\\s+')}\\b`, 'i').test(normalized));
  return match || null;
}

function splitItems(text: string): string[] {
  return text
    .replace(/\bup and down\b/gi, 'up__and__down')
    .split(/\s+(?:along\s+with|follow\s+am|and|plus|with|join|&)\s+|[,;]/i)
    .map((item) => item.replace(/up__and__down/gi, 'up and down').trim())
    .filter(Boolean);
}

function parseItem(segment: string, budget: number | null, location: string | null): ParsedCommerceItem {
  const originalText = segment.trim();
  const itemBudget = parseBudget(normalizeText(originalText)) ?? budget;
  let text = normalizeText(originalText)
    .replace(/^(?:(?:i|we)\s+)?(?:where\s+can\s+i\s+(?:find|buy|get)|where\s+do\s+i\s+find|looking\s+for|want(?:\s+to)?(?:\s+buy)?|wan(?:\s+to)?(?:\s+buy)?|need(?:\s+to)?(?:\s+buy)?|buy|show\s+me|find\s+me|who\s+get|who\s+dey\s+sell|abeg\s+show\s+me)\s+/i, '')
    .replace(/\b(?:under|below|budget(?:\s+of)?|around|about|up to)\s*(?:₦|ngn)?\s*\d[\d,]*(?:\.\d+)?\s*(?:k|m|thousand|million)?\b/gi, ' ')
    .replace(/\b(?:₦|ngn)?\s*\d[\d,]*(?:\.\d+)?\s*(?:k|m|thousand|million|naira|mah|gb|tb)\b/gi, ' ')
    .replace(/\b(?:in|at|around|near|for)\s+(?:my\s+)?(?:onitsha|enugu|lagos|abuja|aba|owerri|port harcourt|ibadan|kano|asaba|awka|benin city|warri|calabar|uyo|abakaliki|nnewi|nsukka|kaduna|jos|ilorin|ariaria|balogun|alaba|computer village|trade fair|ikeja|lekki|yaba|oshodi)\b/gi, ' ')
    .replace(/\bfor\s+(?:my\s+)?(?:graduation|wedding|birthday|party|christmas|easter|valentine(?:'s)?|anniversary|prom)\b.*$/i, ' ')
    .replace(/\b(?:where can i|can i|please|original|genuine|authentic|who get|who dey sell|available|for)\b/gi, ' ')
    .replace(/\bbudget\b/gi, ' ')
    .replace(/\b(?:a|an|the)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const categoryMatch = findCategory(text);
  const brand = findBrand(text, categoryMatch?.alias);
  const explicitCategory = categoryMatch?.confidence === 1;
  const category = explicitCategory
    ? categoryMatch.category
    : brand?.category || categoryMatch?.category || null;
  const subcategory = explicitCategory
    ? categoryMatch.subcategory
    : brand?.subcategory || categoryMatch?.subcategory || null;
  const color = COLORS.find((candidate) => new RegExp(`\\b${candidate}\\b`, 'i').test(text)) || null;
  const condition = /\boriginal\b/i.test(text)
    ? 'Original'
    : CONDITIONS.find((candidate) => candidate.aliases.some((alias) => text.includes(alias)))?.canonical || null;
  const material = MATERIALS.find((candidate) => new RegExp(`\\b${candidate}\\b`, 'i').test(text)) || null;
  const explicitSize = text.match(/\b(?:size\s*)?(?:xxs|xs|s|m|l|xl|xxl|xxxl|small|medium|large)\b|\bsize\s*\d{1,2}\b/i);
  const footwearSize = category === 'Footwear' ? text.match(/\b(?:size\s*)?([3-5]\d)\b/i) : null;
  const size = explicitSize?.[0].replace(/^size\s*/i, '') || footwearSize?.[1] || null;
  let productType = text
    .replace(/\b(?:uk used|brand new|used|refurbished|tokunbo|clean|new|original)\b/gi, ' ')
    .replace(new RegExp(`\\b(?:${COLORS.join('|')})\\b`, 'gi'), ' ')
    .replace(/\b(?:xxs|xs|s|m|l|xl|xxl|xxxl|small|medium|large|size\s*\d{1,2})\b/gi, ' ')
    .replace(/\b(?:leather|ankara|lace|cotton|silk|denim|wool|suede|canvas|plastic|stainless steel|gold|material|fabric|cloth|chargeable)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (brand && new RegExp(`\\b${normalizeText(brand.name).replace(/\s+/g, '\\s+')}\\b`, 'i').test(text)) {
    productType = productType.replace(new RegExp(`\\b${normalizeText(brand.name).replace(/\s+/g, '\\s+')}\\b`, 'i'), ' ').trim();
    if (!productType) productType = brand.name;
  }
  if (/\b(?:palm|palms)\b/i.test(text) && category === 'Footwear') productType = 'palm slippers';
  if (!productType) productType = subcategory || brand?.name || '';

  return {
    originalText,
    productType: productType.replace(/\s+/g, ' ').trim(),
    category,
    subcategory,
    brand: brand?.name || null,
    color,
    size,
    condition,
    material,
    budget: itemBudget,
    location,
    confidence: category ? (categoryMatch?.confidence ?? 0.86) : 0,
  };
}

export function parseLocalCommerceRequest(input: string): ParsedCommerceRequest {
  const normalizedText = normalizeText(input);
  const budget = parseBudget(normalizedText);
  const location = parseLocation(normalizedText);
  const segments = splitItems(normalizedText);
  const items = segments
    .map((segment) => parseItem(segment, budget, location))
    .filter((item) => item.productType || item.category);
  return {
    normalizedText,
    items,
    budget,
    location,
    usedLocalLexicon: items.length > 0 && items.every((item) => item.confidence >= 0.75),
  };
}

export function addSearchCategory(category: SearchCategory): void {
  const normalized = category.name.toLowerCase();
  if (SEARCH_CATEGORIES.some((existing) => existing.name.toLowerCase() === normalized)) {
    throw new Error(`Search category already exists: ${category.name}`);
  }
  SEARCH_CATEGORIES.push(category);
  CATEGORY_ALIASES.push(...category.subcategories.flatMap((subcategory) =>
    [subcategory.name, ...subcategory.aliases].map((alias) => ({
      category: category.name,
      subcategory: subcategory.name,
      alias: alias.toLowerCase(),
    }))
  ));
}

export function resolveSearchPath(
  item: ParsedCommerceItem,
  hasDirectProduct: boolean,
  hasCategoryMerchants: boolean,
): SearchResolutionPath {
  if (!item.category) return 'CLARIFYING_QUESTION';
  if (hasDirectProduct) return 'DIRECT_PRODUCT_MATCH';
  if (hasCategoryMerchants) return 'CATEGORY_MERCHANTS_FALLBACK';
  return 'EMPTY_CATEGORY';
}
