import logo from "../assets/BethesdaLogo.png";


export default function Footer() {
return (
<footer className="bg-bethLightGray text-white mt-10 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
    <div className="flex items-center gap-4">
        <img src={logo} alt="Bethesda Logo" className="h-16 object-contain" />
    </div>
    <div className="text-center md:text-right text-bethDeepBlue text-sm leading-6">
        <p>3280 Schmon Parkway<br />Thorold, ON, L2V 4Y6</p>
        <p className="mt-2">E: info@bethesdaservices.com<br />T: 905.684.6918</p>
    </div>
</footer>
);
}