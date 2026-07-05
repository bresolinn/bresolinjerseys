import { Routes, Route, useLocation, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from './services/api.js';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import SearchPage from './pages/SearchPage.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import SubcategoryPage from './pages/SubcategoryPage.jsx';
import ProductPage from './pages/ProductPage.jsx';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

// 404
function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 pt-16">
      <span className="font-display text-8xl text-brand-500">404</span>
      <p className="text-gray-400">Página não encontrada</p>
      <a href="/" className="text-sm text-white hover:text-brand-500 transition-colors">
        ← Voltar ao início
      </a>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          {/* Home */}
          <Route path="/" element={<Home />} />

          {/* Search results */}
          <Route path="/busca" element={<SearchPage />} />

          {/*
            Rotas dinâmicas:
            /:catSlug                           → Categoria (subcategorias OU produtos diretos)
            /:catSlug/:subSlug                  → Subcategoria (lista de produtos)
            /:catSlug/:productId                → Produto direto (sem subcategoria)
            /:catSlug/:subSlug/:productId       → Produto dentro de subcategoria

            O React Router não sabe diferenciar subSlug de productId pelo slug sozinho.
            A lógica de "é subcategoria ou produto?" é resolvida pelo backend via API:
              - CategoryPage tenta buscar a categoria e decide o que renderizar
              - O segmento do meio pode ser subSlug OU productId — usamos o componente
                DynamicMiddle que testa ambos.
          */}
          <Route path="/:catSlug" element={<CategoryPage />} />
          <Route path="/:catSlug/:subOrProduct" element={<DynamicMiddle />} />
          <Route path="/:catSlug/:subSlug/:productId" element={<ProductPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl tracking-widest text-gray-600">
            BRESOLIN <span className="text-brand-600">JERSEYS</span>
          </span>
          <p className="text-xs text-gray-700">
            © {new Date().getFullYear()} Bresolin Jerseys. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </>
  );
}

/**
 * DynamicMiddle — resolve ambiguidade entre subcategoria e produto direto.
 * /:catSlug/:subOrProduct pode ser:
 *   1. Uma subcategoria → renderiza SubcategoryPage
 *   2. Um produto direto da categoria → renderiza ProductPage (sem subSlug)
 *
 * Estratégia: tenta carregar como subcategoria; se falhar, trata como produto.
 */


function DynamicMiddle() {
  const { catSlug, subOrProduct } = useParams();
  const [isSubcategory, setIsSubcategory] = useState(null); // null = loading

  useEffect(() => {
    api.category(catSlug)
      .then((cat) => {
        const found = cat.subcategories?.some((s) => s.slug === subOrProduct);
        setIsSubcategory(found);
      })
      .catch(() => setIsSubcategory(false));
  }, [catSlug, subOrProduct]);

  if (isSubcategory === null) {
    return (
      <div className="min-h-screen pt-28 flex items-start justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mt-8" />
      </div>
    );
  }

  if (isSubcategory) {
    return <SubcategoryPage />;
  }

  // Treat as direct product (no subSlug in URL)
  return <ProductPage />;
}