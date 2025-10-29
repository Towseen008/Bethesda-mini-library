import { useParams, Link } from 'react-router-dom';
import items from '../data/data';

export default function ItemDetails() {
  const { id } = useParams();
  const item = items.find(toy => toy.id === parseInt(id));

  if (!item) return <div className="p-6 text-center">Item not found.</div>;

  return (
    <div className="max-w-md mx-auto bg-bethLightGray shadow p-6 rounded mt-6">
      <img src={item.image} alt={item.name} className="w-48 h-48 object-cover rounded mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-bethDeepBlue text-center mb-2">{item.name}</h2>
      <p className="text-center text-sm text-gray-500 mb-4">Status: {item.status}</p>
      <div className="flex justify-center gap-4">
        <Link to={`/reserve`} state={{ item }} className="bg-bethDeepBlue text-white px-4 py-2 rounded hover:bg-bethLightBlue">
          Reserve Item
        </Link>
        <Link to="/" className="text-bethDeepBlue underline">Back to List</Link>
      </div>
    </div>
  );
}