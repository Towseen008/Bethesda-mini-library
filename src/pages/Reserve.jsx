import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function Reserve() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [item, setItem] = useState(location.state?.item || null);
  const [loading, setLoading] = useState(!item);
  const [success, setSuccess] = useState(false);

  // Parent/child details
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [notes, setNotes] = useState(""); // Optional field

  useEffect(() => {
    if (!item) {
      const fetchItem = async () => {
        const idFromParam = searchParams.get("id");
        if (!idFromParam) return setLoading(false);
        try {
          const docRef = doc(db, "items", idFromParam);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) setItem({ id: docSnap.id, ...docSnap.data() });
        } catch (error) {
          console.error("Error fetching item:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchItem();
    }
  }, [item, searchParams]);

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!item) return;

    try {
      // 1 Update item status
      const docRef = doc(db, "items", item.id);
      await updateDoc(docRef, { status: "On Loan" });

      // 2 Save reservation info including item name
      await addDoc(collection(db, "reservations"), {
        itemId: item.id,
        itemName: item.name, // Include item name here
        parentName,
        parentEmail,
        childName,
        notes,
        reservedAt: new Date(),
        status: "Pending",
      });

      setSuccess(true);
    } catch (error) {
      console.error("Error reserving item:", error);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[80vh] text-lg font-medium">
        Loading item...
      </div>
    );

  if (!item)
    return (
      <div className="flex items-center justify-center h-[80vh] text-lg font-medium text-red-500">
        Item not found.
      </div>
    );

  if (success)
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold text-green-600 mb-3">
          Reservation Successful!
        </h2>
        <p className="text-gray-700">
          You’ve successfully reserved <strong>{item.name}</strong>. You’ll receive a notification via email.
        </p>
      </div>
    );

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded shadow mt-6 text-center">
      <h2 className="text-2xl font-semibold text-bethDeepBlue mb-4">
        Reserve {item.name}
      </h2>
      <p className="text-gray-700 mb-4">
        Current Status:{" "}
        <span
          className={item.status === "Available" ? "text-green-600" : "text-red-600"}
        >
          {item.status}
        </span>
      </p>

      {item.status === "Available" && (
        <form onSubmit={handleReserve} className="space-y-4 text-left">
          <div>
            <label className="block text-gray-700">Item Name</label>
            <input
              type="text"
              value={item.name}
              readOnly
              className="w-full border rounded px-3 py-2 mt-1 bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-gray-700">Parent Name</label>
            <input
              required
              type="text"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-gray-700">Parent Email</label>
            <input
              required
              type="email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-gray-700">Child Name</label>
            <input
              required
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-gray-700">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <button
            type="submit"
            className="bg-bethDeepBlue text-white px-6 py-2 rounded hover:bg-bethLightBlue"
          >
            Confirm Reservation
          </button>
        </form>
      )}

      {item.status !== "Available" && (
        <p className="text-red-500 font-medium">
          This item is currently on loan.
        </p>
      )}
    </div>
  );
}