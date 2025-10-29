// Home.jsx 
import { Link } from 'react-router-dom';
import items from '../data/data';


export default function Home() {

    return (
        <div className="max-w-6xl m-auto p-4">
            <h2 className="text-2xl font-bold mb-4 text-bethDeepBlue">Available Toys & Books</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(item => (
                    <Link
                    to={`/item/${item.id}`}
                    key={item.id}
                    className="bg-bethLightGray shadow rounded p-4 flex flex-col items-center hover:shadow-xl hover:scale-105 transition-transform cursor-pointer"
                    >
                        <img src={item.image} alt={item.name} className="w-32 h-32 object-cover mb-2 rounded" />
                        <h3 className="text-lg font-semibold text-bethDeepBlue">{item.name}</h3>
                        <p className="text-sm text-gray-500">Status: {item.status}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}