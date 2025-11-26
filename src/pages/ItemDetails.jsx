// src/pages/ItemDetails.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Spinner from "../components/Spinner";

export default function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (item.images?.length || 1) - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === (item.images?.length || 1) - 1 ? 0 : prev + 1
    );
  };

  if (loading)
    return (
      <p className="text-center py-8 text-gray-500">
        <Spinner />
      </p>
    );

  if (!item)
    return <p className="text-center py-8 text-red-500">Item not found.</p>;

  const images = item.images && item.images.length > 0 ? item.images : [item.image];

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-3xl mx-auto">

        {/* Image Carousel */}
        <div className="w-full h-auto sm:h-[500px] bg-gray-100 flex items-center justify-center relative">
          <img
            src={images[currentImageIndex]}
            alt={item.name}
            className="w-full h-full object-contain"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white px-3 py-1 rounded"
              >
                &#10094;
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-40 text-white px-3 py-1 rounded"
              >
                &#10095;
              </button>
            </>
          )}
        </div>

        {/* Details Section */}
        <div className="p-6 space-y-3 text-center sm:text-left">
          <h2 className="text-3xl font-bold text-bethDeepBlue">{item.name}</h2>

          <div className="text-sm sm:text-base text-gray-600 space-y-1">
            <p>
              <span className="font-semibold text-bethDeepBlue">Category:</span>{" "}
              {item.category || "N/A"}
            </p>
            <p>
              <span className="font-semibold text-bethDeepBlue">Age Group:</span>{" "}
              {item.ageGroup || "N/A"}
            </p>
            <p>
              <span className="font-semibold text-bethDeepBlue">Status:</span>{" "}
              {item.status || "N/A"}
            </p>
            <p>
              <span className="font-semibold text-bethDeepBlue">Description:</span>{" "}
              {item.description || "N/A"}
            </p>
          </div>

          {/* BUTTONS SECTION */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">

            {/* RESERVE BUTTON + TOOLTIP */}
            <div className="relative group flex justify-center sm:justify-start">
              <Link
                to={item.status === "Available" ? `/reserve/${id}` : "#"}
                onClick={(e) => {
                  if (item.status === "Pending" || item.status === "On Loan") {
                    e.preventDefault();
                  }
                }}
                className={`px-5 py-2 rounded transition text-white 
                  ${
                    item.status === "Available"
                      ? "bg-bethDeepBlue hover:bg-bethLightBlue"
                      : "bg-gray-400 cursor-not-allowed"
                  }
                `}
              >
                {item.status === "Available" ? "Reserve This Toy" : "Not Available"}
              </Link>

              {/* TOOLTIP */}
              {(item.status === "Pending" || item.status === "On Loan") && (
                <div
                  className="
                    absolute -top-10 left-1/2 -translate-x-1/2 
                    bg-black text-white text-xs px-3 py-1 rounded 
                    opacity-0 group-hover:opacity-100 transition 
                    pointer-events-none whitespace-nowrap
                  "
                >
                  {item.status === "On Loan"
                    ? "This toy is currently on loan"
                    : "This toy is currently pending"}
                </div>
              )}
            </div>

            {/* BACK BUTTON */}
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