import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import ProductImage from '../components/ProductImage.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';

const ITEMS_PER_PAGE = 50;

function ProductCard({ product }) {
  const href = product.subcategorySlug
    ? `/${product.categorySlug}/${product.subcategorySlug}/${product.id}`
    : `/${product.categorySlug}/${product.id}`;

  return (
    <Link
      to={href}
      className="group block rounded-2xl overflow-hidden bg-dark-800 card-hover"
    >
      <div className="aspect-square overflow-hidden relative">
        <ProductImage
          src={product.cover}
          alt={product.name}
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="text-white font-display text-lg tracking-widest border border-white px-4 py-2 rounded-full text-sm">
            VER PRODUTO
          </span>
        </div>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors line-clamp-2">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {product.category}{product.subcategory ? ` › ${product.subcategory}` : ''}
        </p>
      </div>
    </Link>
  );
}

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  // Build page numbers to show: current + next 5, always show 1 and last
  const pages = [];
  const start = currentPage;
  const end = Math.min(currentPage + 5, totalPages);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
      {/* First page */}
      {currentPage > 1 && (
        <button
          onClick={() => onPageChange(1)}
          className="px-3 py-2 rounded-lg bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white transition-colors text-sm"
          title="Primeira página"
        >
          «
        </button>
      )}

      {/* Previous */}
      {currentPage > 1 && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-2 rounded-lg bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white transition-colors text-sm"
        >
          ‹
        </button>
      )}

      {/* Page numbers */}
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3.5 py-2 rounded-lg text-sm transition-colors ${
            p === currentPage
              ? 'bg-brand-500 text-white font-semibold'
              : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white'
          }`}
        >
          {p}
        </button>
      ))}

      {/* Next */}
      {currentPage < totalPages && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-2 rounded-lg bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white transition-colors text-sm"
        >
          ›
        </button>
      )}

      {/* Last page */}
      {currentPage < totalPages && (
        <button
          onClick={() => onPageChange(totalPages)}
          className="px-3 py-2 rounded-lg bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white transition-colors text-sm"
          title="Última página"
        >
          »
        </button>
      )}
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  useEffect(() => {
    if (!query.trim()) {
      setAllResults([]);
      return;
    }
    setLoading(true);
    api.search(query)
      .then(results => {
        // Deduplicate by album id
        const seen = new Set();
        const unique = [];
        for (const r of results) {
          if (!seen.has(r.id)) {
            seen.add(r.id);
            unique.push(r);
          }
        }
        setAllResults(unique);
        setLastQuery(query);
      })
      .catch(() => setAllResults([]))
      .finally(() => setLoading(false));
  }, [query]);

  const totalPages = Math.ceil(allResults.length / ITEMS_PER_PAGE);
  const safePage = Math.min(Math.max(1, page), totalPages || 1);
  const pageResults = allResults.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  function onPageChange(newPage) {
    setSearchParams({ q: query, page: String(newPage) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl tracking-wider text-white">
              {query ? `"${query}"` : 'BUSCA'}
            </h1>
            {!loading && allResults.length > 0 && (
              <p className="text-gray-500 text-sm mt-1">
                {allResults.length} {allResults.length === 1 ? 'resultado' : 'resultados'}
                {totalPages > 1 && ` — página ${safePage} de ${totalPages}`}
              </p>
            )}
          </div>
          <div className="w-12 h-1 bg-brand-500 rounded-full" />
        </div>

        {loading && <SkeletonGrid />}

        {!loading && !query && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-gray-500">Digite algo na barra de busca para pesquisar.</p>
          </div>
        )}

        {!loading && query && allResults.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">Nenhum resultado encontrado</p>
            <p className="text-gray-600 text-sm">Tente termos diferentes ou mais gerais.</p>
          </div>
        )}

        {!loading && pageResults.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {pageResults.map((product, i) => (
                <ProductCard key={`${product.id}-${i}`} product={product} />
              ))}
            </div>

            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </>
        )}
      </div>
    </div>
  );
}
