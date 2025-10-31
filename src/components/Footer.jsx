import bethesdaLogo from "../assets/BethesdaLogoWhite.png";


export function Footer() {
    return (
        <footer className="bg-bethDeepBlue text-white flex flex-row items-center justify-between h-full px-4">
            <div className="flex-shrink-0">
                <img src={bethesdaLogo} alt="Bethesda Logo" className="h-14 hover:opacity-90 transition" />
            </div>
            <div className="flex flex-col text-center ">
                <p className="text-sm">3280 Schmon Parkway, Thorold, ON, L2V 4Y6</p>
                <p className="text-sm">
                    <a href="mailto:info@bethesdaservices.com" className="hover:text-bethLightBlue underline">info@bethesdaservices.com</a>
                </p>
                <p>
                    <a href="tel:9056846918" className="hover:text-bethLightBlue underline">905.684.6918</a>
                </p>
            </div>
        </footer>
    );
}