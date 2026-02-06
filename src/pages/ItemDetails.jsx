// src/pages/ItemDetails.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Spinner from "../components/Spinner";

const isNotAvailableStatus = (status) =>
  String(status || "").toLowerCase() === "not available";

const getPublicStatus = (item) => {
  if (!item) return "On Loan";
  if (isNotAvailableStatus(item.status)) return "Not Available";
  const qty = Number(item.quantity ?? 0);
  return qty > 0 ? "Available" : "On Loan";
};

export default function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const ref = doc(db, "items", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

          setItem({ id: snap.id, ...data });
        }
      } catch (err) {
        console.error("Error fetching item:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  if (loading)
    return (
      <div className="text-center py-8">
        <Spinner />
      </div>
    );

  if (!item)
    return <p className="text-center text-red-500">Item not found.</p>;

  const publicStatus = getPublicStatus(item);

  const isAvailable = publicStatus === "Available";
  const isOnLoan = publicStatus === "On Loan";
  const isNotAvailable = publicStatus === "Not Available";

  const images = item.images?.length ? item.images : [item.image];

  return (
    <div className="flex flex-col items-center min-h-[80vh] px-4 py-6">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-3xl mx-auto">

        {/* IMAGE CAROUSEL */}
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
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white px-3 py-1 rounded"
              >
                &#10094;
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white px-3 py-1 rounded"
              >
                &#10095;
              </button>
            </>
          )}
        </div>

        {/* DETAILS */}
        <div className="p-6 space-y-3">
          <h2 className="text-3xl font-bold text-bethDeepBlue">{item.name}</h2>

          <p><span className="font-semibold">Category:</span> {item.category}</p>
          <p><span className="font-semibold">Age Group:</span> {item.ageGroup}</p>

          <p>
            <span className="font-semibold">Status:</span>{" "}
            <span
              className={
                isAvailable
                ? "text-green-600 font-bold"
                : isOnLoan
                ? "text-red-600 font-bold"
                : isNotAvailable
                ? "text-gray-700 font-bold"
                : "text-gray-700 font-bold"
              }
            >
              {publicStatus}
            </span>
          </p>

          <p>
            <span className="font-semibold">Description:</span>{" "}
            {item.description}
          </p>

          {/* BUTTONS */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">

        {/* Reserve Button */}
        {isAvailable && (
          <Link
            to={`/reserve/${id}`}
            className="px-5 py-2 bg-bethDeepBlue hover:bg-bethLightBlue text-white rounded"
          >
            Reserve This Toy
          </Link>
        )}

        {/* Waitlist Button */}
        {isOnLoan && (
          <Link
            to={`/reserve/${id}`}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded"
          >
            Join Waitlist
          </Link>
        )}

        {/* Not Available Notice */}
        {isNotAvailable && (
          <div className="px-5 py-2 bg-gray-100 text-gray-700 rounded border border-gray-200">
            This toy is temporarily unavailable and can’t be reserved right now.
          </div>
        )}
            {/* BACK */}
            <Link
              to="/"
              className="border border-bethDeepBlue text-bethDeepBlue px-5 py-2 rounded hover:bg-gray-100"
            >
              Back to Home
            </Link>
          </div>

          {/* WAITLIST NOTE */}
          {isOnLoan && (
            <p className="text-xs mt-2 text-gray-600 italic">
              * Joining waitlist requires final approval by Admin.
            </p>
          )}
          
          {/* NOT AVAILABLE NOTE */}
          {isNotAvailable && (
            <p className="text-xs mt-2 text-gray-600 italic">
              * This item may be under cleaning, repair, or temporarily removed from circulation.
            </p>
          )}

        </div>
      </div>
    </div>
  );
}
