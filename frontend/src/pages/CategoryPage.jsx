import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import ProductImage from '../components/ProductImage.jsx';
import { SkeletonGrid } from '../components/Skeleton.jsx';

const ITEMS_PER_PAGE = 50;

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const start = currentPage;
  const end = Math.min(currentPage + 5, totalPages);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
      {currentPage > 1 && (
        <button onClick={() => onPageChange(1)}
          className="px-3 py-2 rounded-lg bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white transition-colors text-sm"
          title="Primeira página">«</button>
      )}
      {currentPage > 1 && (
        <button onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-2 rounded-lg bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white transition-colors text-sm">‹</button>
      )}
      {pages.map(p => (
        <button key={p} onClick={() => onPageChange(p)}
          className={`px-3.5 py-2 rounded-lg text-sm transition-colors ${p === currentPage ? 'bg-brand-500 text-white font-semibold' : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white'}`}>
          {p}
        </button>
      ))}
      {currentPage < totalPages && (
        <button onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-2 rounded-lg bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white transition-colors text-sm">›</button>
      )}
      {currentPage < totalPages && (
        <button onClick={() => onPageChange(totalPages)}
          className="px-3 py-2 rounded-lg bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white transition-colors text-sm"
          title="Última página">»</button>
      )}
    </div>
  );
}

function SubcategoryCard({ sub, catSlug }) {
  return (
    <Link to={`/${catSlug}/${sub.slug}`} className="group relative block rounded-2xl overflow-hidden bg-dark-800 card-hover">
      <div className="aspect-[4/5] overflow-hidden">
        <ProductImage src={sub.products[0]?.cover} alt={sub.name}
          className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-display text-xl tracking-wider text-white group-hover:text-brand-400 transition-colors">
          {sub.name.toUpperCase()}
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          {sub.products.length} {sub.products.length === 1 ? 'produto' : 'produtos'}
        </p>
      </div>
    </Link>
  );
}

function ProductCard({ product, href }) {
  return (
    <Link to={href} className="group block rounded-2xl overflow-hidden bg-dark-800 card-hover">
      <div className="aspect-square overflow-hidden relative">
        <ProductImage src={product.cover} alt={product.name}
          className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
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
      </div>
    </Link>
  );
}

export default function CategoryPage() {
  const { catSlug } = useParams();
  const { data: category, loading, error } = useFetch(() => api.category(catSlug), [catSlug]);
  const [subPage, setSubPage] = useState(1);
  const [prodPage, setProdPage] = useState(1);

  if (loading) {
    return (
      <div className="min-h-screen pt-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-4 skeleton rounded w-48 mb-8" />
        <div className="h-10 skeleton rounded w-64 mb-10" />
        <SkeletonGrid />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-28 max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-red-400">Categoria não encontrada.</p>
      </div>
    );
  }

  const hasSubcategories = category?.subcategories?.length > 0;
  const hasDirectProducts = category?.products?.length > 0;

  const totalSubPages = hasSubcategories ? Math.ceil(category.subcategories.length / ITEMS_PER_PAGE) : 0;
  const pagedSubs = hasSubcategories
    ? category.subcategories.slice((subPage - 1) * ITEMS_PER_PAGE, subPage * ITEMS_PER_PAGE)
    : [];

  const totalProdPages = hasDirectProducts ? Math.ceil(category.products.length / ITEMS_PER_PAGE) : 0;
  const pagedProds = hasDirectProducts
    ? category.products.slice((prodPage - 1) * ITEMS_PER_PAGE, prodPage * ITEMS_PER_PAGE)
    : [];

  function handleSubPageChange(p) { setSubPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function handleProdPageChange(p) { setProdPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Breadcrumb items={[{ label: category.name }]} />

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-5xl tracking-wider text-white">{category.name.toUpperCase()}</h1>
            <p className="text-gray-500 text-sm mt-1">
              {hasSubcategories
                ? `${category.subcategories.length} subcategorias${totalSubPages > 1 ? ` — página ${subPage} de ${totalSubPages}` : ''}`
                : `${category.products.length} produtos${totalProdPages > 1 ? ` — página ${prodPage} de ${totalProdPages}` : ''}`}
            </p>
          </div>
          <div className="w-12 h-1 bg-brand-500 rounded-full" />
        </div>

        {hasSubcategories && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {pagedSubs.map(sub => (
                <SubcategoryCard key={sub.slug} sub={sub} catSlug={catSlug} />
              ))}
            </div>
            <Pagination currentPage={subPage} totalPages={totalSubPages} onPageChange={handleSubPageChange} />
          </>
        )}

        {hasDirectProducts && (
          <div className="mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {pagedProds.map(p => (
                <ProductCard key={p.id} product={p} href={`/${catSlug}/${p.id}`} />
              ))}
            </div>
            <Pagination currentPage={prodPage} totalPages={totalProdPages} onPageChange={handleProdPageChange} />
          </div>
        )}
      </div>
    </div>
  );
}
