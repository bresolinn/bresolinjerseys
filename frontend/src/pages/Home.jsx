import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import ProductImage from '../components/ProductImage.jsx';

function CategoryCard({ cat }) {
  return (
    <Link
      to={`/${cat.slug}`}
      className="group relative block rounded-2xl overflow-hidden bg-dark-800 card-hover cursor-pointer"
      style={{ animationFillMode: 'both' }}
    >
      {/* Image */}
      <div className="aspect-[4/5] overflow-hidden">
        <ProductImage
          src={cat.cover}
          alt={cat.name}
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-display text-2xl tracking-wider text-white mb-1 group-hover:text-brand-400 transition-colors">
          {cat.name.toUpperCase()}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {cat.productCount} {cat.productCount === 1 ? 'produto' : 'produtos'}
          </span>
          <span className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCategoryCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-dark-800">
      <div className="aspect-[4/5] skeleton" />
      <div className="p-4 space-y-2">
        <div className="h-5 skeleton rounded w-2/3" />
        <div className="h-3 skeleton rounded w-1/3" />
      </div>
    </div>
  );
}

export default function Home() {
  const { data: categories, loading, error } = useFetch(api.categories, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex items-end pb-16 pt-32 px-4 sm:px-6 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-brand-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto w-full">
          <div className="max-w-2xl">
            <span className="tag mb-4 inline-block">Nova Coleção</span>
            <h1 className="font-display text-6xl sm:text-8xl tracking-wider text-white leading-none mb-4">
              BRESOLIN<br />
              <span className="text-brand-500">JERSEYS</span>
            </h1>
            <p className="text-gray-400 text-lg font-light max-w-md">
              As melhores camisas de futebol do mundo, reunidas em um só lugar.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-white/10" />
          <span className="font-display text-lg tracking-widest text-gray-500">CATEGORIAS</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
      </div>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        {error && (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <p className="text-red-400 font-medium mb-1">Erro ao carregar dados</p>
            <p className="text-gray-500 text-sm">
              Certifique-se de que o servidor está rodando em http://localhost:3001
            </p>
            <p className="text-gray-600 text-xs mt-2">{error}</p>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCategoryCard key={i} />)}
          </div>
        )}

        {!loading && !error && categories && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <CategoryCard key={cat.slug} cat={cat} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
