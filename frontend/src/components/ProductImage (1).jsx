import { useState } from 'react';

function resolveUrl(src) {
  if (!src) return '';
  // URLs do Cloudinary vão direto (capas)
  if (src.startsWith('https://res.cloudinary.com')) return src;
  // Tokens opacos do servidor /api/img/... vão direto (já são a rota correta)
  if (src.startsWith('/api/img/')) return src;
  // URLs http brutas (fallback) passam pelo proxy antigo
  if (src.startsWith('http')) return `/api/image?url=${encodeURIComponent(src)}`;
  return src;
}

export default function ProductImage({ src, alt, className = '', style = {} }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed || !src) {
    return (
      <div className={`flex items-center justify-center bg-dark-700 ${className}`} style={style}>
        <svg className="w-12 h-12 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={style}>
      {!loaded && <div className="absolute inset-0 skeleton rounded-inherit" />}
      <img
        src={resolveUrl(src)}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
