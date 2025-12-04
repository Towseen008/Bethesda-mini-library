// App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { onAuthStateChanged } from "firebase/auth";   
import { auth } from "./firebaseConfig";

import Header from './components/Header';
import { Footer } from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import PageTransition from './components/PageTransition';

import Home from './pages/Home';
import Reserve from './pages/Reserve';
import ItemDetails from './pages/ItemDetails';
import Admin from './pages/Admin';
import AdminLogin from "./pages/AdminLogin";
import AboutUs from './pages/About';
import Confirmation from './pages/Confirmation';


function AdminRoute({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading; null = not logged in

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  if (user === undefined) {
    return <div className="p-4 text-center">Checking admin access...</div>;
  }

  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
}

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
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>}/>
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
