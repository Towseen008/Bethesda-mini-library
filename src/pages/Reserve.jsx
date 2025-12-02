// src/pages/Reserve.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";
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
    note: ""
  });

  /* --------------------------------------------------------
     LOAD ITEM DETAILS
  --------------------------------------------------------- */
  useEffect(() => {
    const fetchItem = async () => {
      try {
        const ref = doc(db, "items", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setItem(snap.data());
        } else {
          console.error("Item not found.");
        }
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

  /* --------------------------------------------------------
     SUBMIT RESERVATION  (Available / Treated-as-Available)
  --------------------------------------------------------- */
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
        createdAt: serverTimestamp()
      });

      navigate("/confirmation", {
        state: {
          type: "reservation",
          itemName: item.name
        }
      });
    } catch (err) {
      console.error("Error submitting reservation:", err);
      alert("Error creating reservation.");
    }
  };

  /* --------------------------------------------------------
     WAITLIST SUBMISSION (for On Loan toys)
     → Saved to "wishlists" ONLY
  --------------------------------------------------------- */
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
        createdAt: serverTimestamp()
      });

      navigate("/confirmation", {
        state: {
          type: "waitlist",
          itemName: item.name
        }
      });
    } catch (err) {
      console.error("Error submitting waitlist:", err);
      alert("Error adding to waitlist.");
    }
  };

  /* --------------------------------------------------------
     PAGE OUTPUT
  --------------------------------------------------------- */
  if (loading)
    return (
      <div className="text-center py-8">
        <Spinner />
      </div>
    );

  if (!item)
    return <p className="text-center py-8 text-red-500">Item not found.</p>;

  const isOnLoan = item.status === "On Loan";

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold text-bethDeepBlue mb-4">
        {isOnLoan ? "Join Waitlist" : "Reserve Toy"}
      </h2>

      {/* ITEM INFO */}
      <p className="text-sm mb-4">
        <span className="font-semibold">Toy:</span> {item.name}
      </p>

      <p className="text-sm mb-4">
        <span className="font-semibold">Status:</span>{" "}
        <span className={isOnLoan ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
          {item.status}
        </span>
      </p>

      {/* WAITLIST WARNING */}
      {isOnLoan && (
        <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded mb-4 text-sm">
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
        className="space-y-3"
      >
        <input
          type="text"
          required
          name="parentName"
          placeholder="Parent's Name"
          value={formData.parentName}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="email"
          required
          name="parentEmail"
          placeholder="Parent Email"
          value={formData.parentEmail}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          required
          name="childName"
          placeholder="Child's Name"
          value={formData.childName}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        {/* Preferred day ONLY for reservations */}
        {!isOnLoan && (
          <input
            type="text"
            required
            name="preferredDay"
            placeholder="Preferred Pick-Up Day"
            value={formData.preferredDay}
            onChange={handleChange}
            className="w-full border p-2 rounded"
          />
        )}

        <textarea
          name="note"
          placeholder="Additional Notes (optional)"
          value={formData.note}
          onChange={handleChange}
          className="w-full border p-2 rounded h-24"
        />

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          className={`w-full py-2 rounded text-white font-semibold ${
            isOnLoan
              ? "bg-purple-600 hover:bg-purple-700"
              : "bg-bethDeepBlue hover:bg-bethLightBlue"
          }`}
        >
          {isOnLoan ? "Join Waitlist" : "Submit Reservation"}
        </button>
      </form>
    </div>
  );
}
