// src/pages/ItemDetails.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

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
          setItem(docSnap.data());
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) return <p className="text-center py-8 text-gray-500">Loading item details...</p>;
  if (!item) return <p className="text-center py-8 text-red-500">Item not found.</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-3xl mx-auto">
        {/* Image Section */}
        <div className="w-full h-96 sm:h-[500px] overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-3 text-center sm:text-left">
          <h2 className="text-3xl font-bold text-bethDeepBlue">{item.name}</h2>

          <div className="text-sm sm:text-base text-gray-600 space-y-1">
            <p><span className="font-semibold text-bethDeepBlue">Category:</span> {item.category || "N/A"}</p>
            <p><span className="font-semibold text-bethDeepBlue">Age Group:</span> {item.ageGroup || "N/A"}</p>
            <p><span className="font-semibold text-bethDeepBlue">Status:</span> {item.status || "N/A"}</p>
          </div>

          {item.description && (
            <div className="mt-3">
              <h3 className="font-semibold text-lg text-bethDeepBlue mb-1">Description</h3>
              <p className="text-gray-700 leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
            <Link
              to={`/reserve/${id}`}
              className="bg-bethDeepBlue text-white px-5 py-2 rounded hover:bg-bethLightBlue transition"
            >
              Reserve This Toy
            </Link>
            <Link
              to="/"
              className="border border-bethDeepBlue text-bethDeepBlue px-5 py-2 rounded hover:bg-gray-100 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}