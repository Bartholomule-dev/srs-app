// src/lib/generators/tinystore-data.ts
// Canonical TinyStore datasets and lexicon for narrative generators.

export type TinyStoreTier = 'bronze' | 'silver' | 'gold';
export type TinyStoreOrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'canceled';

export interface TinyStoreCustomer {
  customer_id: number;
  name: string;
  email: string;
  tier: TinyStoreTier;
  is_active: boolean;
}

export interface TinyStoreProduct {
  product_id: number;
  name: string;
  category: string;
  price: number;
  in_stock: number;
}

export interface TinyStoreLineItem {
  product_id: number;
  qty: number;
  unit_price: number;
}

export interface TinyStoreOrder {
  order_id: number;
  customer_id: number;
  items: TinyStoreLineItem[];
  total: number;
  status: TinyStoreOrderStatus;
}

export interface TinyStoreInventoryRecord {
  product_id: number;
  on_hand: number;
  reorder_level: number;
}

export interface TinyStoreReview {
  product_id: number;
  rating: number;
  comment: string;
}

export interface TinyStoreEvent {
  event_id: string;
  kind: string;
  ts: string;
}

export interface TinyStoreDataset {
  customers: TinyStoreCustomer[];
  products: TinyStoreProduct[];
  orders: TinyStoreOrder[];
  inventory: TinyStoreInventoryRecord[];
  reviews: TinyStoreReview[];
  events: TinyStoreEvent[];
  logLines: string[];
}

const CUSTOMER_NAMES = [
  'Ava',
  'Noah',
  'Maya',
  'Leo',
  'Iris',
  'Eli',
  'Zoe',
  'Liam',
  'Mia',
  'Owen',
  'Nina',
  'Aria',
];

const PRODUCT_NAMES = [
  'mug',
  'notebook',
  'lamp',
  'keyboard',
  'mouse',
  'cable',
  'charger',
  'bottle',
  'backpack',
  'planner',
  'sticker',
  'timer',
];

const PRODUCT_CATEGORIES = ['kitchen', 'office', 'tech', 'home', 'travel', 'outdoor'];
const PRICE_POINTS = [8.5, 12, 15.5, 19, 25, 32, 40];
const WAREHOUSE_CITIES = ['Austin', 'Denver', 'Phoenix', 'Seattle', 'Chicago', 'Atlanta'];
const TIERS: TinyStoreTier[] = ['bronze', 'silver', 'gold'];
const ORDER_STATUSES: TinyStoreOrderStatus[] = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'canceled',
];
const LOG_LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG'] as const;
const EVENT_KINDS = ['checkout', 'refund', 'restock', 'signup', 'support'];
const FILE_NAMES = [
  'orders.csv',
  'inventory.json',
  'events.log',
  'customers.txt',
  'reviews.csv',
  'coupons.json',
];
const REVIEW_COMMENTS = [
  'fast shipping',
  'good quality',
  'works well',
  'nice packaging',
  'would buy again',
  'pricey but solid',
];

const PATH_DIRS = [
  'data',
  'logs',
  'exports',
  'reports',
  'backups',
  'configs',
  'scripts',
  'imports',
  'tmp',
  'archive',
];

const PATH_SUBDIRS = [
  'daily',
  'weekly',
  'monthly',
  'raw',
  'clean',
  'orders',
  'inventory',
  'customers',
  'events',
  'reviews',
];

const WORD_POOL = [
  '  mug  ',
  'NOTEBOOK',
  'TinyStore',
  '  order log  ',
  'CHECKOUT',
  'restock',
  'promo code',
  'shipping label',
  'CUSTOMER NOTE',
];

const SLICE_WORDS = PRODUCT_NAMES;

const SAMPLE_LINES = [
  'order_id=501 status=paid',
  'product_id=12 in_stock=9',
  'customer_id=104 tier=silver',
  'event checkout order_id=501',
  'restock product_id=12 qty=5',
  'coupon SAVE10 active=True',
];

function buildTimestamp(index: number): string {
  const day = 11 + Math.floor(index / 24);
  const hour = (10 + index) % 24;
  const minute = (index * 7) % 60;
  return `2026-01-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`;
}

function buildCustomers(count: number): TinyStoreCustomer[] {
  const customers: TinyStoreCustomer[] = [];
  for (let i = 0; i < count; i += 1) {
    const name = CUSTOMER_NAMES[i % CUSTOMER_NAMES.length];
    const customer_id = 100 + i;
    customers.push({
      customer_id,
      name,
      email: `${name.toLowerCase()}${customer_id}@tinystore.test`,
      tier: TIERS[i % TIERS.length],
      is_active: i % 7 !== 0,
    });
  }
  return customers;
}

function buildProducts(count: number): TinyStoreProduct[] {
  const products: TinyStoreProduct[] = [];
  for (let i = 0; i < count; i += 1) {
    const basePrice = PRICE_POINTS[i % PRICE_POINTS.length];
    const price = Number((basePrice + (i % 3) * 1.25).toFixed(2));
    products.push({
      product_id: 10 + i,
      name: PRODUCT_NAMES[i % PRODUCT_NAMES.length],
      category: PRODUCT_CATEGORIES[i % PRODUCT_CATEGORIES.length],
      price,
      in_stock: 2 + ((i * 3) % 25),
    });
  }
  return products;
}

function buildInventory(products: TinyStoreProduct[]): TinyStoreInventoryRecord[] {
  return products.map((product, index) => ({
    product_id: product.product_id,
    on_hand: product.in_stock,
    reorder_level: 3 + (index % 4),
  }));
}

function buildOrders(
  count: number,
  customers: TinyStoreCustomer[],
  products: TinyStoreProduct[]
): TinyStoreOrder[] {
  const orders: TinyStoreOrder[] = [];
  for (let i = 0; i < count; i += 1) {
    const customer = customers[i % customers.length];
    const itemCount = (i % 2) + 1;
    const items: TinyStoreLineItem[] = [];

    for (let j = 0; j < itemCount; j += 1) {
      const product = products[(i + j * 2) % products.length];
      const qty = (i + j) % 3 + 1;
      items.push({
        product_id: product.product_id,
        qty,
        unit_price: product.price,
      });
    }

    const total = Number(
      items.reduce((sum, item) => sum + item.qty * item.unit_price, 0).toFixed(2)
    );

    orders.push({
      order_id: 500 + i,
      customer_id: customer.customer_id,
      items,
      total,
      status: ORDER_STATUSES[i % ORDER_STATUSES.length],
    });
  }
  return orders;
}

function buildReviews(count: number, products: TinyStoreProduct[]): TinyStoreReview[] {
  const reviews: TinyStoreReview[] = [];
  for (let i = 0; i < count; i += 1) {
    const product = products[i % products.length];
    reviews.push({
      product_id: product.product_id,
      rating: (i % 5) + 1,
      comment: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length],
    });
  }
  return reviews;
}

function buildEvents(count: number): TinyStoreEvent[] {
  const events: TinyStoreEvent[] = [];
  for (let i = 0; i < count; i += 1) {
    events.push({
      event_id: `evt_${String(i + 1).padStart(3, '0')}`,
      kind: EVENT_KINDS[i % EVENT_KINDS.length],
      ts: buildTimestamp(i),
    });
  }
  return events;
}

function buildLogLines(events: TinyStoreEvent[], orders: TinyStoreOrder[]): string[] {
  return events.map((event, index) => {
    const level = LOG_LEVELS[index % LOG_LEVELS.length];
    const order = orders[index % orders.length];
    const detail =
      event.kind === 'checkout' || event.kind === 'refund'
        ? `order_id=${order.order_id}`
        : `event_id=${event.event_id}`;
    return `${event.ts} ${level} ${event.kind} ${detail}`;
  });
}

function buildDataset(size: number): TinyStoreDataset {
  const customers = buildCustomers(size);
  const products = buildProducts(size);
  const orders = buildOrders(Math.max(3, Math.floor(size / 2)), customers, products);
  const inventory = buildInventory(products);
  const reviews = buildReviews(Math.max(3, Math.floor(size / 2)), products);
  const events = buildEvents(Math.max(4, Math.floor(size / 2)));
  const logLines = buildLogLines(events, orders);

  return {
    customers,
    products,
    orders,
    inventory,
    reviews,
    events,
    logLines,
  };
}

const SMALL_DATASET = buildDataset(6);
const MEDIUM_DATASET = buildDataset(24);
const LARGE_DATASET = buildDataset(120);

export const tinyStoreDatasets = {
  small: SMALL_DATASET,
  medium: MEDIUM_DATASET,
  large: LARGE_DATASET,
};

export const tinyStoreLexicon = {
  customerNames: CUSTOMER_NAMES,
  productNames: PRODUCT_NAMES,
  categories: PRODUCT_CATEGORIES,
  orderStatuses: ORDER_STATUSES,
  warehouseCities: WAREHOUSE_CITIES,
  fileNames: FILE_NAMES,
  logLevels: [...LOG_LEVELS],
  pathDirs: PATH_DIRS,
  pathSubdirs: PATH_SUBDIRS,
  wordPool: WORD_POOL,
  sliceWords: SLICE_WORDS,
  sampleLines: SAMPLE_LINES,
  logLines: SMALL_DATASET.logLines,
};

export const tinyStoreDataPack = {
  list_sample: SMALL_DATASET.products.map((product) => product.name),
  dict_sample: {
    product_id: SMALL_DATASET.products[0]?.product_id ?? 0,
    name: SMALL_DATASET.products[0]?.name ?? 'product',
    price: SMALL_DATASET.products[0]?.price ?? 0,
    in_stock: SMALL_DATASET.products[0]?.in_stock ?? 0,
  },
  records_sample: SMALL_DATASET.orders.map((order) => ({
    order_id: order.order_id,
    total: order.total,
    status: order.status,
  })),
  string_samples: SMALL_DATASET.logLines.slice(0, 4),
};
