// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import {Footer} from './components/Footer';
import Home from './pages/Home';
import Reserve from './pages/Reserve';
import ItemDetails from './pages/ItemDetails';
import Admin from './pages/Admin';


export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen overflow-x-hidden">
        <header className="h-[10vh] flex-shrink-0">
          <Header />
        </header>
        <main className="flex-1 h-[75vh] overflow-y-auto p-4">
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path='/item/:id' element={<ItemDetails />} />
            <Route path='/reserve/:id' element={<Reserve />} /> {/* <-- add :id */}
            <Route path='/admin' element={<Admin />} />
          </Routes>
        </main>
        <footer className="h-[15vh] flex-shrink-0">
          <Footer />
        </footer>
      </div>
    </Router>
  );
}
