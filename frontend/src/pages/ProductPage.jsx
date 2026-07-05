import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch.js';
import { api } from '../services/api.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import ProductImage from '../components/ProductImage.jsx';

function resolveUrl(src) {
  if (!src) return '';
  if (src.startsWith('https://res.cloudinary.com')) return src;
  if (src.startsWith('/api/img/')) return src;
  if (src.startsWith('http')) return `/api/image?url=${encodeURIComponent(src)}`;
  return src;
}

function ImageGallery({ images }) {
  const [active, setActive] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => setActive(0), [images]);

  function prev() {
    setActive((v) => (v === 0 ? images.length - 1 : v - 1));
  }

  function next() {
    setActive((v) => (v === images.length - 1 ? 0 : v + 1));
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setZoomed(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Bloqueia scroll do body quando modal aberto
  useEffect(() => {
    if (zoomed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [zoomed]);

  return (
    <>
      {/* Zoom modal */}
      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); setZoomed(false); }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navegação no modal (se houver mais de 1 imagem) */}
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); prev(); }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-16 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); next(); }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          <img
            src={resolveUrl(images[active])}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-xs text-white font-medium">
              {active + 1} / {images.length}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Main image */}
        <div className="relative rounded-2xl overflow-hidden bg-dark-800 group">
          <div
            className="aspect-square cursor-zoom-in"
            onClick={() => setZoomed(true)}
          >
            <ProductImage
              src={images[active]}
              alt="Produto"
              className="w-full h-full"
            />
          </div>

          {/* Arrow controls */}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Counter badge */}
          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-xs text-white font-medium">
              {active + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  i === active
                    ? 'border-brand-500 scale-105'
                    : 'border-transparent hover:border-white/30 opacity-60 hover:opacity-100'
                }`}
              >
                <ProductImage src={img} alt={`Foto ${i + 1}`} className="w-full h-full" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SkeletonProduct() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
      <div>
        <div className="aspect-square skeleton rounded-2xl" />
        <div className="flex gap-2 mt-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-16 h-16 skeleton rounded-xl" />
          ))}
        </div>
      </div>
      <div className="space-y-4 pt-4">
        <div className="h-4 skeleton rounded w-48" />
        <div className="h-10 skeleton rounded w-3/4" />
        <div className="h-4 skeleton rounded w-1/2" />
      </div>
    </div>
  );
}

export default function ProductPage() {
  const { catSlug, subSlug, productId, subOrProduct } = useParams();
  const navigate = useNavigate();

  const fetchFn = subSlug && productId
    ? () => api.subProduct(catSlug, subSlug, productId)
    : () => api.product(catSlug, productId || subOrProduct);

  const { data: product, loading, error } = useFetch(
    fetchFn,
    [catSlug, subSlug, productId, subOrProduct]
  );

  // Busca a categoria para usar o nome real no breadcrumb
  const { data: category } = useFetch(() => api.category(catSlug), [catSlug]);

  if (loading) return <SkeletonProduct />;

  if (error) {
    return (
      <div className="min-h-screen pt-28 max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-red-400">Produto não encontrado.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-brand-500 hover:underline text-sm">
          ← Voltar
        </button>
      </div>
    );
  }

  // Nomes reais para o breadcrumb
  const categoryLabel = category?.name ?? catSlug.replace(/-/g, ' ');
  const subcategoryLabel = subSlug
    ? (category?.subcategories?.find(s => s.slug === subSlug)?.name ?? subSlug.replace(/-/g, ' '))
    : null;

  const breadcrumbItems = (subSlug && productId)
    ? [
        { label: categoryLabel, href: `/${catSlug}` },
        { label: subcategoryLabel, href: `/${catSlug}/${subSlug}` },
        { label: product.name },
      ]
    : [
        { label: categoryLabel, href: `/${catSlug}` },
        { label: product.name },
      ];

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-28">
        <Breadcrumb items={breadcrumbItems} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Gallery */}
          <div className="animate-fade-in">
            <ImageGallery images={product.images} />
          </div>

          {/* Info */}
          <div className="flex flex-col gap-6 animate-fade-up pt-2">
            {/* Tag */}
            <span className="tag w-fit">
              {subcategoryLabel ?? categoryLabel}
            </span>

            {/* Name */}
            <div>
              <h1 className="font-display text-4xl sm:text-5xl tracking-wider text-white leading-tight">
                {product.name.toUpperCase()}
              </h1>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* Fotos counter */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {product.images.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-full border-2 border-dark-900 overflow-hidden bg-dark-700"
                  >
                    <img
                      src={resolveUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-400">
                {product.images.length}{' '}
                {product.images.length === 1 ? 'foto disponível' : 'fotos disponíveis'}
              </span>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/10" />

            {/* CTA area */}
            <div className="glass rounded-2xl p-5 space-y-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                Interessado neste produto? Entre em contato para consultar disponibilidade e tamanhos.
              </p>
              <a
                href={`https://wa.me/?text=Olá! Tenho interesse na camisa: ${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.524 5.855L0 24l6.335-1.524A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.793 9.793 0 01-5.031-1.386l-.36-.214-3.732.978.995-3.636-.235-.374A9.775 9.775 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                </svg>
                Consultar via WhatsApp
              </a>
            </div>

            {/* Back */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-fit"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
