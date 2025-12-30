// src/pages/Reserve.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import Spinner from "../components/Spinner";

/* ======================================================
   EMAIL API BASE (ENV SAFE)
====================================================== */
const EMAIL_API_BASE =
  import.meta.env.VITE_EMAIL_API_URL ||
  (location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://bethesda-mini-library.onrender.com");

/* ======================================================
   EMAIL HELPER (NON-BLOCKING SAFE)
====================================================== */
const sendEmail = async (endpoint, payload) => {
  try {
    const res = await fetch(`${EMAIL_API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Email API error:", res.status, text);
    }
  } catch (err) {
    console.error("Email service network error:", err);
  }
};

export default function Reserve() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false); // ✅ prevent double submit

  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    childName: "",
    preferredDay: "",
    note: "",
  });

  /* ------------------ LOAD ITEM ------------------ */
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const ref = doc(db, "items", id);
        const snap = await getDoc(ref);
        if (snap.exists()) setItem(snap.data());
      } catch (err) {
        console.error("Error loading item:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  /* -----------------------------------------------------------
      SUBMIT RESERVATION
  ----------------------------------------------------------- */
  const submitReservation = async (e) => {
    e.preventDefault();
    if (!item || submitting) return;

    setSubmitting(true);

    try {
      await addDoc(collection(db, "reservations"), {
        itemId: id,
        itemName: item.name,
        parentName: formData.parentName,
        parentEmail: formData.parentEmail,
        childName: formData.childName,
        preferredDay: formData.preferredDay,
        note: formData.note || "",
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      // ✅ Navigate immediately
      navigate("/confirmation", {
        state: { type: "reservation", itemName: item.name },
      });

      // 🔔 Fire-and-forget email (DO NOT await)
      sendEmail("/email/reservation-created", {
        parentEmail: formData.parentEmail,
        parentName: formData.parentName,
        childName: formData.childName,
        itemName: item.name,
        preferredDay: formData.preferredDay || "Not specified",
        note: formData.note || "",
      });
    } catch (err) {
      console.error("Error submitting reservation:", err);
      alert("Error creating reservation.");
      setSubmitting(false);
    }
  };

  /* -----------------------------------------------------------
      SUBMIT WAITLIST
  ----------------------------------------------------------- */
  const submitWaitlist = async (e) => {
    e.preventDefault();
    if (!item || submitting) return;

    setSubmitting(true);

    try {
      await addDoc(collection(db, "wishlists"), {
        itemId: id,
        itemName: item.name,
        parentName: formData.parentName,
        parentEmail: formData.parentEmail,
        childName: formData.childName,
        preferredDay: null,
        note: "Waitlist request — Admin review required",
        createdAt: serverTimestamp(),
      });

      // ✅ Navigate immediately
      navigate("/confirmation", {
        state: { type: "waitlist", itemName: item.name },
      });

      // 🔔 Fire-and-forget email
      sendEmail("/email/waitlist-created", {
        parentEmail: formData.parentEmail,
        parentName: formData.parentName,
        childName: formData.childName,
        itemName: item.name,
        preferredDay: "Waitlist request",
      });
    } catch (err) {
      console.error("Error submitting waitlist:", err);
      alert("Error adding to waitlist.");
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-8">
        <Spinner />
      </div>
    );

  if (!item)
    return <p className="text-center py-8 text-red-500">Item not found.</p>;

  const isOnLoan = item.status === "On Loan";
  const today = new Date().toISOString().split("T")[0];

  /* ======================= RENDER ======================= */
  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      {/* UI BELOW IS UNCHANGED */}
      <h2 className="text-2xl font-bold text-bethDeepBlue mb-4 animate-fadeUp">
        {isOnLoan ? "Join Waitlist" : "Reserve Toy"} For: {item.name}
      </h2>

      {item.images?.length > 0 && (
        <div className="w-full h-72 sm:h-96 bg-gray-100 mb-5 flex justify-center items-center overflow-hidden rounded animate-fadeUp">
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <p className="block text-bethDeepBlue font-semibold text-base sm:text-lg mb-4 animate-fadeUp">
        <span className="font-semibold">Status:</span>{" "}
        <span
          className={
            isOnLoan
              ? "text-red-600 font-bold"
              : "text-green-600 font-bold"
          }
        >
          {item.status}
        </span>
      </p>

      <form
        onSubmit={isOnLoan ? submitWaitlist : submitReservation}
        className="space-y-4"
      >
         {/* Parent Name */}
  <div>
    <label className="block text-sm font-medium mb-1">
      Parent / Guardian Full Name
    </label>
    <input
      type="text"
      name="parentName"
      value={formData.parentName}
      onChange={handleChange}
      required
      className="w-full border rounded px-3 py-2"
    />
  </div>

  {/* Parent Email */}
  <div>
    <label className="block text-sm font-medium mb-1">
      Registered Email on File
    </label>
    <input
      type="email"
      name="parentEmail"
      value={formData.parentEmail}
      onChange={handleChange}
      required
      className="w-full border rounded px-3 py-2"
    />
  </div>

  {/* Child Name */}
  <div>
    <label className="block text-sm font-medium mb-1">
      Child Initials Or Assigned Number
    </label>
    <input
      type="text"
      name="childName"
      value={formData.childName}
      onChange={handleChange}
      required
      className="w-full border rounded px-3 py-2"
    />
  </div>

  {/* Preferred Day (only if reserving) */}
  {!isOnLoan && (
    <div>
      <label className="block text-sm font-medium mb-1">
        Preferred Pickup Day
      </label>
      <input
        type="date"
        name="preferredDay"
        min={today}
        value={formData.preferredDay}
        onChange={handleChange}
        required
        className="w-full border rounded px-3 py-2"
      />
    </div>
  )}

  {/* Optional Note */}
  <div>
    <label className="block text-sm font-medium mb-1">
      Notes (optional)
    </label>
    <textarea
      name="note"
      value={formData.note}
      onChange={handleChange}
      rows={3}
      className="w-full border rounded px-3 py-2"
    />
  </div>
        {/* Button just disabled during submit */}
        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-2 rounded text-white font-semibold ${
            isOnLoan
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-bethDeepBlue hover:bg-bethLightBlue"
          }`}
        >
          {submitting
            ? "Submitting..."
            : isOnLoan
            ? "Join Waitlist"
            : "Submit Reservation"}
        </button>
      </form>
    </div>
  );
}
