/*
 * Minimal client-side cart for the sandbox. Commerce comes later; until then the cart
 * lives in localStorage so the header count and add-to-cart confirmation work.
 */
const STORAGE_KEY = 'slack-tide-cart';
export const CART_EVENT = 'slacktide:cart';

function read() {
  try {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(items) ? items : [];
  } catch (e) {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    // storage unavailable: the count still updates for this page view
  }
  const count = items.reduce((n, i) => n + i.qty, 0);
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { count } }));
}

let memory = null;

export function getCartItems() {
  if (memory) return memory;
  return read();
}

export function getCartCount() {
  return getCartItems().reduce((n, item) => n + item.qty, 0);
}

/**
 * Adds one of an item to the cart.
 * @param {{ sku: string, name: string, price: string, url?: string }} item
 */
export function addToCart(item) {
  const items = getCartItems();
  const existing = items.find((i) => i.sku === item.sku);
  if (existing) existing.qty += 1;
  else items.push({ ...item, qty: 1 });
  memory = items;
  write(items);
}
