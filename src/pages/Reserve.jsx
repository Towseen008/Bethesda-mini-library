import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function Reserve() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [preferredDay, setPreferredDay] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const docRef = doc(db, "items", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setItem({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such item!");
        }
      } catch (error) {
        console.error("Error fetching item:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parentName || !parentEmail || !childName || !preferredDay) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      // Create a reservation record in Firestore
      await addDoc(collection(db, "reservations"), {
        itemId: item.id,
        itemName: item.name,
        parentName,
        parentEmail,
        childName,
        preferredDay,
        status: "Pending", // always Pending by default
        createdAt: serverTimestamp(),
      });

      setMessage("✅ Reservation submitted! Admin will notify you when item is ready for pickup.");
      setParentName("");
      setParentEmail("");
      setChildName("");
      setPreferredDay("");
    } catch (error) {
      console.error("Error submitting reservation:", error);
      setMessage("❌ Error submitting reservation. Please try again.");
    }
  };

  if (loading) return <p className="text-center py-8 text-gray-500">Loading item...</p>;
  if (!item) return <p className="text-center py-8 text-red-500">Item not found.</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden w-full max-w-3xl mx-auto">
        {/* Item Image */}
        <div className="w-full h-96 sm:h-[500px] overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Item Details */}
        <div className="p-6 space-y-3 text-center sm:text-left">
          <h2 className="text-3xl font-bold text-bethDeepBlue">{item.name}</h2>
          <p className="text-sm text-gray-600"><span className="font-semibold">Category:</span> {item.category || "N/A"}</p>
          <p className="text-sm text-gray-600"><span className="font-semibold">Age Group:</span> {item.ageGroup || "N/A"}</p>
          <p className="text-sm text-gray-600"><span className="font-semibold">Status:</span> {item.status}</p>

          {item.description && (
            <div className="mt-3">
              <h3 className="font-semibold text-lg text-bethDeepBlue mb-1">Description</h3>
              <p className="text-gray-700 leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* Reservation Form */}
          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Parent Name"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="email"
              placeholder="Parent Email"
              value={parentEmail}
              onChange={(e) => setParentEmail(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="text"
              placeholder="Registered Child Name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <input
              type="date"
              placeholder="Preferred Day for Pick Up"
              value={preferredDay}
              onChange={(e) => setPreferredDay(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <button
              type="submit"
              className="bg-bethDeepBlue text-white px-5 py-2 rounded hover:bg-bethLightBlue transition"
            >
              Reserve Item
            </button>
          </form>

          {message && <p className="mt-3 text-center text-green-600">{message}</p>}

          <div className="mt-6 text-center sm:text-left">
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