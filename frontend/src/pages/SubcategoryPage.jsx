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

function ProductCard({ product, href }) {
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
      </div>
    </Link>
  );
}

export default function SubcategoryPage() {
  const { catSlug, subSlug, subOrProduct } = useParams();
  const subKey = subSlug || subOrProduct;
  const [page, setPage] = useState(1);

  // Busca a categoria para pegar o nome real (sem transformar o slug)
  const { data: category } = useFetch(() => api.category(catSlug), [catSlug]);

  const { data: subcategory, loading, error } = useFetch(
    () => api.subcategory(catSlug, subKey),
    [catSlug, subKey]
  );

  if (loading) {
    return (
      <div className="min-h-screen pt-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-4 skeleton rounded w-64 mb-8" />
        <div className="h-10 skeleton rounded w-72 mb-10" />
        <SkeletonGrid />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-28 max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-red-400">Subcategoria não encontrada.</p>
      </div>
    );
  }

  // Usa o nome real da categoria se já carregou, senão faz fallback para o slug
  const categoryLabel = category?.name ?? catSlug.replace(/-/g, ' ');

  const totalPages = Math.ceil(subcategory.products.length / ITEMS_PER_PAGE);
  const pagedProducts = subcategory.products.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  function handlePageChange(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Breadcrumb
          items={[
            { label: categoryLabel, href: `/${catSlug}` },
            { label: subcategory.name },
          ]}
        />

        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-5xl tracking-wider text-white">
              {subcategory.name.toUpperCase()}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {subcategory.products.length}{' '}
              {subcategory.products.length === 1 ? 'produto' : 'produtos'}
              {totalPages > 1 && ` — página ${page} de ${totalPages}`}
            </p>
          </div>
          <div className="w-12 h-1 bg-brand-500 rounded-full" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {pagedProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              href={`/${catSlug}/${subKey}/${p.id}`}
            />
          ))}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        {subcategory.products.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-gray-500">Nenhum produto encontrado nesta subcategoria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
