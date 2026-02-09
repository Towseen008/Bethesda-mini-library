// src/pages/Reserve.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
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

const isNotAvailableStatus = (status) =>
  String(status || "").toLowerCase() === "not available";

const getPublicStatus = (item) => {
  if (!item) return "On Loan";
  if (isNotAvailableStatus(item.status)) return "Not Available";
  const qty = Number(item.quantity ?? 0);
  return qty > 0 ? "Available" : "On Loan";
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
        if (snap.exists()) setItem({ id: snap.id, ...snap.data() });
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
    const itemRef = doc(db, "items", id);
    const reservationRef = doc(collection(db, "reservations")); // create ID first

    const result = await runTransaction(db, async (tx) => {
      const itemSnap = await tx.get(itemRef);
      if (!itemSnap.exists()) throw new Error("Item not found");

      const latest = itemSnap.data();

      // block if admin marked Not Available
      if (isNotAvailableStatus(latest.status)) {
        return { type: "not_available" };
      }

      const qty = Number(latest.quantity ?? 0);

      // if no inventory, do not create reservation, return "waitlist"
      if (qty <= 0) {
        return { type: "waitlist" };
      }

      const newQty = qty - 1;

      const currentStatus = String(latest.status || "");
      const nextStatus =
        currentStatus.toLowerCase() === "not available"
          ? "Not Available"
          : newQty === 0
          ? "On Loan"
          : "Available";

      tx.update(itemRef, {
        quantity: newQty,
        status: nextStatus,
      });


      tx.set(reservationRef, {
        itemId: id,
        itemName: latest.name,
        parentName: formData.parentName,
        parentEmail: formData.parentEmail,
        childName: formData.childName,
        preferredDay: formData.preferredDay,
        note: formData.note || "",
        status: "Pending",
        createdAt: serverTimestamp(),
        inventoryCommitted: true, 
      });

      return { type: "reserved" };
    });

    // Handle outcomes
    if (result.type === "not_available") {
      alert("This toy is temporarily unavailable and can’t be reserved right now.");
      setSubmitting(false);
      return;
    }

    if (result.type === "waitlist") {
      // allow waitlist submission to proceed
      setSubmitting(false);
      await submitWaitlist(e);
      return;
    }

    // ✅ Navigate immediately
    navigate("/confirmation", {
      state: { type: "reservation", itemName: item.name },
    });

    // 🔔 Fire-and-forget email
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
    if (isNotAvailableStatus(item.status)) {
      alert("This toy is temporarily unavailable and can’t be waitlisted right now.");
      setSubmitting(false);
      return;
    }

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

  const publicStatus = getPublicStatus(item);
  const isOnLoan = publicStatus === "On Loan";
  const isNotAvailable = publicStatus === "Not Available";

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
            isNotAvailable
            ? "text-gray-700 font-bold"
            :isOnLoan
            ? "text-red-600 font-bold"
            : "text-green-600 font-bold"
          }
        >
          {publicStatus}
        </span>
      </p>

      {isNotAvailable && (
        <div className="mb-4 p-3 rounded bg-gray-100 border border-gray-200 text-gray-700">
          This toy is temporarily unavailable and cannot be reserved right now.
        </div>
      )}

      <form
        onSubmit={isNotAvailable ? (e) => e.preventDefault() : isOnLoan ? submitWaitlist : submitReservation
        }
        className={`space-y-4 ${isNotAvailable ? "opacity-60 pointer-events-none" : ""}`}
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
                    disabled={submitting || isNotAvailable}
                    className={`w-full py-2 rounded text-white font-semibold ${
                      isOnLoan
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-bethDeepBlue hover:bg-bethLightBlue"
                    }`}
                >
                  {submitting
                    ? "Submitting..."
                    : isNotAvailable
                    ? "Not Available"
                    : isOnLoan
                    ? "Join Waitlist"
                    : "Submit Reservation"
                  }
              </button>
        </form>
    </div>
  );
}
