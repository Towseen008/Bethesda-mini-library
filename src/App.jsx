// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Reserve from './pages/Reserve';
import ItemDetails from './pages/ItemDetails';


export default function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/reserve' element={<Reserve />} />
        <Route path='/item/:id' element={<ItemDetails />} />
      </Routes>
      <Footer />
    </Router>
  );
}
