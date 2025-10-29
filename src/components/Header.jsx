// Navbar.jsx - navigation bar component
import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/BethesdaLogo.png";

export default function Header() {
    return (
        <header className="bg-gradient-to-r from-bethLightGray-300 to-bethLightGray-500 shadow-md rounded-b-xl">
            <div className="container mx-auto flex items-center justify-between p-4">
                <Link to="/" className="flex items-center space-x-2">
                    <img src={logo} alt="Bethesda Logo" className="h-12 w-auto rounded" />
                </Link>
                <nav className="flex space-x-6 text-bethDeepBlue font-semibold tracking-wide">
                    <Link to="/" className="hover:underline">Home</Link>
                    <Link to="/reserve" className="hover:underline">Reserve</Link>
                </nav>
            </div>
        </header>
    );
}