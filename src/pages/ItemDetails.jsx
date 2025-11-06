import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
// import items from '../data/data';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'

export default function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const docRef = doc(db, "items", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("Item not found");
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[80vh] text-lg font-medium">
        Loading item details...
      </div>
    );
  }

  if (!item) {
    return <div className="p-6 text-center">Item not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-bethLightGray shadow p-10 rounded mt-6">
      <img
        src={item.image || "https://via.placeholder.com/600x400?text=No+Image"}
        alt={item.name}
        className="w-full h-[500px] object-cover rounded mb-6"
      />
      <h2 className="text-3xl font-bold text-bethDeepBlue text-center mb-2">
        {item.name}
      </h2>
      <p className="text-center text-sm text-gray-500 mb-4">
        Status: {item.status}
      </p>
      <div className="flex justify-center gap-4">
        <Link
          to={`/reserve`}
          state={{ item }}
          className="bg-bethDeepBlue text-white px-4 py-2 rounded hover:bg-bethLightBlue"
        >
          Reserve Item
        </Link>
        <Link to="/" className="text-bethDeepBlue underline">
          Back to List
        </Link>
      </div>
    </div>
  );
}