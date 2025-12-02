// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import { Footer } from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import PageTransition from './components/PageTransition';

import Home from './pages/Home';
import Reserve from './pages/Reserve';
import ItemDetails from './pages/ItemDetails';
import Admin from './pages/Admin';
import AboutUs from './pages/About';
import Confirmation from './pages/Confirmation';

export default function App() {
  return (
    <Router>
      <ScrollToTop />

      <div className="flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Header */}
        <header className="flex-shrink-0">
          <Header />
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Routes>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/item/:id" element={<PageTransition><ItemDetails /></PageTransition>} />
            <Route path="/reserve/:id" element={<PageTransition><Reserve /></PageTransition>} />
            <Route path="/about" element={<PageTransition><AboutUs /></PageTransition>} />
            <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
            <Route path="/confirmation" element={<Confirmation />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="flex-shrink-0">
          <Footer />
        </footer>

      </div>
    </Router>
  );
}
