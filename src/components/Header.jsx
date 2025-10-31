// Navbar.jsx - navigation bar component
import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/BethesdaLogoWhite.png";

export default function Header() {
    return (
        <nav className="bg-bethDeepBlue shadow mb-8 p-4 flex justify-between items-center h-80% px-6">
            <img src={logo} alt="Mini Library Logo" className="h-14" />
            <div className="flex gap-4">
                <Link to="/" className="text-white hover:underline">Home</Link>
                <Link to="/reserve" className="text-white hover:underline">Reserve</Link>
            </div>
        </nav>
    );
}