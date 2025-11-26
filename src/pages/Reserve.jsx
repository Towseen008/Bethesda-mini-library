// src/pages/Reserve.jsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

import confetti from "canvas-confetti";
import Spinner from "../components/Spinner";

export default function Reserve() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Form states
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [preferredDay, setPreferredDay] = useState("");

  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const docRef = doc(db, "items", id);
        const snap = await getDoc(docRef);

        if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
      } catch (err) {
        console.error("Error fetching item:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const validateForm = () => {
    let newErrors = {};

    if (!parentName.trim()) newErrors.parentName = "Parent name is required.";
    if (!parentEmail.trim()) newErrors.parentEmail = "Email is required.";
    if (!childName.trim()) newErrors.childName = "Child name is required.";
    if (!preferredDay.trim())
      newErrors.preferredDay = "Pickup date is required.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setProcessing(true);

    try {
      await addDoc(collection(db, "reservations"), {
        itemId: item.id,
        itemName: item.name,
        parentName,
        parentEmail,
        childName,
        preferredDay,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "items", item.id), { status: "Pending" });

      setProcessing(false);
      setSuccess(true);
      triggerConfetti();

      setTimeout(() => navigate("/"), 4000);
    } catch (err) {
      alert("Error submitting reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <p className="text-center justify-center py-8 text-gray-500">
        <Spinner />
      </p>
    );

  if (!item)
    return <p className="text-center py-8 text-red-500">Item not found.</p>;

  const images = item.images?.length > 0 ? item.images : [item.image];

  // PROCESSING SCREEN
  if (processing && !success) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] text-center px-4">
        <Spinner />
        <h2 className="text-xl font-semibold mt-3 text-gray-700 animate-pulse">
          Processing your reservation...
        </h2>
      </div>
    );
  }

  // SUCCESS SCREEN
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] px-4 text-center">
        <div className="bg-green-100 border border-green-400 text-green-800 px-6 py-6 rounded-lg shadow max-w-md animate-fadeIn">
          <h2 className="text-2xl font-bold mb-3">
            Reservation Successful! 🎉
          </h2>

          <p className="mb-4">
            Your reservation has been submitted. You’ll be notified when it’s
            ready for pickup.
          </p>

          <Link
            to="/"
            className="mt-4 inline-block bg-bethDeepBlue text-white px-6 py-3 rounded-lg hover:bg-bethLightBlue transition font-medium"
          >
            Return Home
          </Link>

          <p className="mt-3 text-sm text-gray-500 animate-pulse">
            Redirecting automatically...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-3xl mx-auto">

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
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === 0 ? images.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-1 rounded"
              >
                &#10094;
              </button>

              <button
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === images.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-1 rounded"
              >
                &#10095;
              </button>
            </>
          )}
        </div>

        {/* ITEM DETAILS */}
        <div className="p-6 space-y-3 text-center sm:text-left animate-fadeIn">

          <h2 className="text-3xl font-bold text-bethDeepBlue">
            {item.name}
          </h2>

          <p className="text-sm text-gray-600">
            <strong>Category:</strong> {item.category}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Age Group:</strong> {item.ageGroup}
          </p>

          {item.description && (
            <div className="mt-2">
              <h3 className="font-semibold text-lg text-bethDeepBlue">
                Description
              </h3>
              <p className="text-gray-700">{item.description}</p>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">

            {/* Parent Name */}
            <div>
              <label className="text-sm font-semibold text-bethDeepBlue">
                Parent Name
              </label>
              <input
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                className="w-full border p-2 rounded mt-1"
                required
              />
              {errors.parentName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.parentName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-semibold text-bethDeepBlue">
                Parent Email
              </label>
              <input
                type="email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                className="w-full border p-2 rounded mt-1"
                required
              />
              {errors.parentEmail && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.parentParent}
                </p>
              )}
            </div>

            {/* Child Name */}
            <div>
              <label className="text-sm font-semibold text-bethDeepBlue">
                Registered Child Name
              </label>
              <input
                type="text"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                className="w-full border p-2 rounded mt-1"
                required
              />
              {errors.childName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.childName}
                </p>
              )}
            </div>

            {/* Preferred Day */}
            <div>
              <label className="text-sm font-semibold text-bethDeepBlue">
                Preferred Pickup Date
              </label>
              <input
                type="date"
                value={preferredDay}
                onChange={(e) => setPreferredDay(e.target.value)}
                className="w-full border p-2 rounded mt-1"
                required
              />
              {errors.preferredDay && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.preferredDay}
                </p>
              )}
            </div>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">

              {/* Polished Reserve Button */}
              <button
                type="submit"
                disabled={submitting}
                className={`px-6 py-3 rounded-lg font-medium text-white transition
                  ${
                    submitting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-bethDeepBlue hover:bg-bethLightBlue"
                  }
                `}
              >
                {submitting ? "Submitting..." : "Reserve Item"}
              </button>

              {/* Matching Back Button */}
              <Link
                to="/"
                className="px-6 py-3 rounded-lg font-medium border border-bethDeepBlue text-bethDeepBlue hover:bg-gray-100 transition flex items-center justify-center"
              >
                Back to Home
              </Link>
            </div>

            {submitting && <Spinner />}
          </form>

        </div>
      </div>
    </div>
  );
}
