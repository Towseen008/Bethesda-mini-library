// src/components/Footer.jsx
import bethesdaLogo from "../assets/BethesdaLogoWhite.png";

export function Footer() {
  return (
    <footer className="bg-bethDeepBlue text-white p-4 mt-10">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        <img
          src={bethesdaLogo}
          alt="Bethesda Logo"
          className="h-14 hover:opacity-90 transition"
        />

        <div className="text-center md:text-right space-y-1">
          <p className="text-sm">3310 Schmon Parkway, Thorold, ON, L2V 4Y6</p>

          <p className="text-sm">
            <a
              href="mailto:toylending@bethesdaservices.com"
              className="hover:text-bethLightBlue underline"
            >
              toylending@bethesdaservices.com
            </a>
          </p>

          <p className="text-sm">
            <a
              href="tel:+19056846918,212"
              className="hover:text-bethLightBlue underline"
            >
              905.684.6918 ext. 212
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}