// src/pages/Reserve.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Spinner from "../components/Spinner";

export default function Reserve() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    parentName: "",
    parentEmail: "",
    childName: "",
    preferredDay: "",
    note: "",
  });

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

  // ✅ Use Render/base URL from env (fallbacks to localhost for local testing)
  const EMAIL_API_BASE =
    import.meta.env.VITE_EMAIL_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

  const sendEmail = async (endpoint, payload) => {
    try {
      await fetch(`${EMAIL_API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error(`Email service error (${endpoint}):`, err);
      // Do not block the reservation flow if email fails
    }
  };

  /* -----------------------------------------------------------
      SUBMIT RESERVATION
  ----------------------------------------------------------- */
  const submitReservation = async (e) => {
    e.preventDefault();
    if (!item) return;

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

      // 🔔 Send email notification (parent + admin handled by backend)
      await sendEmail("/email/reservation-created", {
        parentEmail: formData.parentEmail,
        parentName: formData.parentName,
        childName: formData.childName,
        itemName: item.name,
        preferredDay: formData.preferredDay,
      });

      navigate("/confirmation", {
        state: { type: "reservation", itemName: item.name },
      });
    } catch (err) {
      console.error("Error submitting reservation:", err);
      alert("Error creating reservation.");
    }
  };

  /* -----------------------------------------------------------
      SUBMIT WAITLIST
  ----------------------------------------------------------- */
  const submitWaitlist = async (e) => {
    e.preventDefault();
    if (!item) return;

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

      // 🔔 Send waitlist email (parent + admin handled by backend)
      await sendEmail("/email/waitlist-created", {
        parentEmail: formData.parentEmail,
        parentName: formData.parentName,
        childName: formData.childName,
        itemName: item.name,
      });

      navigate("/confirmation", {
        state: { type: "waitlist", itemName: item.name },
      });
    } catch (err) {
      console.error("Error submitting waitlist:", err);
      alert("Error adding to waitlist.");
    }
  };

  if (loading)
    return (
      <div className="text-center py-8">
        <Spinner />
      </div>
    );

  if (!item) return <p className="text-center py-8 text-red-500">Item not found.</p>;

  const isOnLoan = item.status === "On Loan";
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold text-bethDeepBlue mb-4 animate-fadeUp">
        {isOnLoan ? "Join Waitlist" : "Reserve Toy"}
        <span className="font-semibold"> </span>For: {item.name}
      </h2>

      {/* IMAGE */}
      {item.images?.length > 0 && (
        <div className="w-full h-72 sm:h-96 bg-gray-100 mb-5 flex justify-center items-center overflow-hidden rounded animate-fadeUp">
          <img
            src={item.images[0]}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* ITEM INFO */}
      <p className="block text-bethDeepBlue font-semibold text-base sm:text-lg mb-4 animate-fadeUp">
        <span className="font-semibold">Status:</span>{" "}
        <span className={isOnLoan ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
          {item.status}
        </span>
      </p>

      {/* WAITLIST WARNING */}
      {isOnLoan && (
        <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded mb-6 text-sm animate-fadeUp">
          This toy is currently on loan. You may join the waitlist.
          <br />
          <span className="text-xs italic text-gray-700">
            Waitlist requests require final approval by Admin.
          </span>
        </div>
      )}

      {/* FORM */}
      <form
        onSubmit={isOnLoan ? submitWaitlist : submitReservation}
        className="space-y-4"
      >
        {/* Parent Name */}
        <div className="animate-fadeUp">
          <label className="block text-bethDeepBlue font-semibold text-base sm:text-lg mb-1">
            Parent&apos;s Name
          </label>
          <input
            type="text"
            required
            name="parentName"
            placeholder="Enter parent's name"
            value={formData.parentName}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Parent Email */}
        <div className="animate-fadeUp">
          <label className="block text-bethDeepBlue font-semibold text-base sm:text-lg mb-1">
            Parent Email
          </label>
          <input
            type="email"
            required
            name="parentEmail"
            placeholder="Enter parent email"
            value={formData.parentEmail}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Child Name */}
        <div className="animate-fadeUp">
          <label className="block text-bethDeepBlue font-semibold text-base sm:text-lg mb-1">
            Child&apos;s Name
          </label>
          <input
            type="text"
            required
            name="childName"
            placeholder="Enter child's name"
            value={formData.childName}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Preferred Day */}
        {!isOnLoan && (
          <div className="animate-fadeUp">
            <label className="block text-bethDeepBlue font-semibold text-base sm:text-lg mb-1">
              Preferred Pick-Up Day
            </label>
            <input
              type="date"
              required
              name="preferredDay"
              min={today}
              value={formData.preferredDay}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
        )}

        {/* Notes */}
        <div className="animate-fadeUp">
          <label className="block text-bethDeepBlue font-semibold text-base sm:text-lg mb-1">
            Additional Notes
          </label>
          <textarea
            name="note"
            placeholder="Optional message..."
            value={formData.note}
            onChange={handleChange}
            className="w-full border p-2 rounded h-24"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`w-full py-2 rounded text-white font-semibold animate-fadeUp ${
            isOnLoan ? "bg-purple-600 hover:bg-purple-700" : "bg-bethDeepBlue hover:bg-bethLightBlue"
          }`}
        >
          {isOnLoan ? "Join Waitlist" : "Submit Reservation"}
        </button>
      </form>
    </div>
  );
}
