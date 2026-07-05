const BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://bresolinjerseys.onrender.com/api';

async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  categories: () => get('/categories'),
  category: (slug) => get(`/categories/${slug}`),
  subcategory: (catSlug, subSlug) => get(`/categories/${catSlug}/subcategories/${subSlug}`),
  product: (catSlug, productId) => get(`/categories/${catSlug}/products/${productId}`),
  subProduct: (catSlug, subSlug, productId) =>
    get(`/categories/${catSlug}/subcategories/${subSlug}/products/${productId}`),
  search: (q) => get(`/search?q=${encodeURIComponent(q)}`),
  searchPage: (q, page = 1) => get(`/search?q=${encodeURIComponent(q)}&page=${page}&limit=50`),
};
