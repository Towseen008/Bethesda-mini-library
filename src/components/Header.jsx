// src/components/Header.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/BethesdaLogoWhite.png";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const closeAll = () => {
    setAboutOpen(false);
    setMenuOpen(false);
  };

  return (
    <nav className="bg-bethDeepBlue shadow p-4 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center px-2">
        
        {/* Logo */}
        <Link to="/" onClick={closeAll}>
          <img src={logo} alt="Bethesda Logo" className="h-14" />
        </Link>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-white text-3xl md:hidden"
        >
          ☰
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6 items-center">
          <Link
            to="/"
            onClick={closeAll}
            className="text-white hover:text-bethLightBlue"
          >
            Home
          </Link>

          {/* ABOUT US DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className="text-white hover:text-bethLightBlue flex items-center gap-1"
            >
              About Us ▾
            </button>

            <div
              className={`
                absolute right-0 bg-white text-black shadow-lg rounded mt-2 w-60 p-2 
                transition-all duration-300 origin-top transform
                ${aboutOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"}
              `}
            >
              <Link
                to="/about"
                onClick={closeAll}
                className="block p-2 hover:bg-gray-100 rounded"
              >
                About Library
              </Link>
              <Link
                to="/about#faq"
                onClick={closeAll}
                className="block p-2 hover:bg-gray-100 rounded"
              >
                FAQ
              </Link>
              <Link
                to="/about#contact"
                onClick={closeAll}
                className="block p-2 hover:bg-gray-100 rounded"
              >
                Contact Us
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden bg-bethDeepBlue mt-3 p-4 space-y-4 text-white rounded">
          <Link to="/" onClick={closeAll} className="block">Home</Link>

          {/* Mobile About Us */}
          <button
            onClick={() => setAboutOpen(!aboutOpen)}
            className="block text-left w-full"
          >
            About Us ▾
          </button>

          {aboutOpen && (
            <div className="ml-4 space-y-2 animate-slideDown">
              <Link to="/about" onClick={closeAll} className="block hover:text-bethLightBlue">
                About Library
              </Link>
              <Link to="/about#faq" onClick={closeAll} className="block hover:text-bethLightBlue">
                FAQ
              </Link>
              <Link to="/about#contact" onClick={closeAll} className="block hover:text-bethLightBlue">
                Contact Us
              </Link>
            </div>
          )}

        </div>
      )}
    </nav>
  );
}