import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { CartProvider } from '@/hooks/useCart';
import { Toaster } from '@/components/ui/toaster';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import StorePage from '@/pages/StorePage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import SuccessPage from '@/pages/SuccessPage';

function App() {
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/success" element={<SuccessPage />} />
          </Route>
        </Routes>
        <Toaster />
      </Router>
    </CartProvider>
  );
}

export default App;
