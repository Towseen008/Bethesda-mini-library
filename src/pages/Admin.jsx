import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function Admin() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    ageGroup: "",
    description: "",
    image: "",
    status: "Available",
  });
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters & Sort
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ageGroupFilter, setAgeGroupFilter] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    fetchItems();
    // Real-time listener for reservations
    const resCollection = collection(db, "reservations");
    const unsubscribe = onSnapshot(resCollection, (snapshot) => {
      const resData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReservations(resData);
    });

    return () => unsubscribe();
  }, []);

  // Fetch Items
  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "items"));
      const itemsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setItems(itemsData);
      setFilteredItems(itemsData);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  // Filter and Sort Logic
  useEffect(() => {
    let updated = [...items];

    if (categoryFilter) updated = updated.filter((i) => i.category === categoryFilter);
    if (statusFilter) updated = updated.filter((i) => i.status === statusFilter);
    if (ageGroupFilter) updated = updated.filter((i) => i.ageGroup === ageGroupFilter);

    if (sortOption === "az") updated.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption === "za") updated.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortOption === "newest")
      updated.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    setFilteredItems(updated);
  }, [categoryFilter, statusFilter, ageGroupFilter, sortOption, items]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "items"), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      fetchItems();
      setFormData({
        name: "",
        category: "",
        ageGroup: "",
        description: "",
        image: "",
        status: "Available",
      });
      alert("✅ New toy added successfully!");
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const docRef = doc(db, "items", editingItem.id);
      await updateDoc(docRef, { ...formData });
      alert("✅ Toy updated successfully!");
      setTimeout(() => {
        setIsModalOpen(false);
        setEditingItem(null);
        fetchItems();
        setFormData({
          name: "",
          category: "",
          ageGroup: "",
          description: "",
          image: "",
          status: "Available",
        });
      }, 500);
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, "items", id));
        fetchItems();
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  // Update Reservation Status and Item Status
  const handleReservationStatus = async (reservation, newStatus) => {
    try {
      const resRef = doc(db, "reservations", reservation.id);
      await updateDoc(resRef, { status: newStatus });

      setReservations((prev) =>
        prev.map((r) => (r.id === reservation.id ? { ...r, status: newStatus } : r))
      );

      const itemRef = doc(db, "items", reservation.itemId);
      if (newStatus === "On Loan") await updateDoc(itemRef, { status: "On Loan" });
      if (newStatus === "Returned") await updateDoc(itemRef, { status: "Available" });
      if (newStatus === "Pending") await updateDoc(itemRef, { status: "Pending" });

      fetchItems(); // Update items for real-time Home.jsx
    } catch (error) {
      console.error("Error updating reservation status:", error);
    }
  };

  const handleDeleteReservation = async (id) => {
    if (window.confirm("Are you sure you want to delete this reservation?")) {
      try {
        await deleteDoc(doc(db, "reservations", id));
        setReservations((prev) => prev.filter((r) => r.id !== id));
      } catch (error) {
        console.error("Error deleting reservation:", error);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">
      <h2 className="text-2xl font-bold text-bethDeepBlue border-b pb-2">
        Admin Dashboard
      </h2>

      {/* Add New Item Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow p-4 rounded space-y-3">
        <h3 className="font-bold text-lg text-bethDeepBlue">Add New Toy</h3>
        <input
          type="text"
          name="name"
          placeholder="Toy Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          name="image"
          placeholder="Image URL"
          value={formData.image}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded">
          </textarea>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select Category</option>
            <option value="Fine Motor">Fine Motor</option>
            <option value="Sensory Play">Sensory Play</option>
            <option value="Pretend Play">Pretend Play</option>
            <option value="Gross Motor">Gross Motor</option>
            <option value="Music">Music</option>
            <option value="STEM">STEM</option>
            <option value="Games">Games</option>
            <option value="Numbers">Numbers</option>
            <option value="Letters">Letters</option>
            <option value="Others">Others</option>
          </select>

          <select
            name="ageGroup"
            value={formData.ageGroup}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select Age Group</option>
            <option value="2-5">2-5 years</option>
            <option value="2-10">2-10 years</option>
            <option value="6-10">6-10 years</option>
            <option value="9+">9+ years</option>
          </select>

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="Available">Available</option>
            <option value="Pending">Pending</option>
            <option value="On Loan">On Loan</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-bethDeepBlue text-white px-4 py-2 rounded hover:bg-bethLightBlue"
        >
          Add Toy
        </button>
      </form>

      {/* Existing Items */}
      <div className="space-y-4 mt-10">
        <h3 className="text-2xl font-bold text-bethDeepBlue border-b pb-2">
          Existing Toys
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item.id} className="bg-white border shadow rounded p-4 space-y-2">
              <img src={item.image} alt={item.name} className="w-full h-48 object-cover rounded" />
              <h3 className="font-semibold text-bethDeepBlue">{item.name}</h3>
              <p className="text-sm">Category: {item.category || "N/A"}</p>
              <p className="text-sm">Age: {item.ageGroup || "N/A"}</p>
              <p className="text-sm">Status: {item.status}</p>
              <div className="flex justify-between">
                <button onClick={() => handleEdit(item)} className="text-blue-600">Edit</button>
                <button onClick={() => handleDelete(item.id)} className="text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reservations Management */}
      <div className="space-y-4 mt-10">
        <h3 className="text-2xl font-bold text-bethDeepBlue border-b pb-2">
          Reservations
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-bethLightGray">
              <tr>
                <th className="p-2 border">Item</th>
                <th className="p-2 border">Parent</th>
                <th className="p-2 border">Parent Email</th>
                <th className="p-2 border">Child</th>
                <th className="p-2 border">Preferred Day</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50">
                  <td className="p-2 border">{res.itemName}</td>
                  <td className="p-2 border">{res.parentName}</td>
                  <td className="p-2 border">{res.parentEmail}</td>
                  <td className="p-2 border">{res.childName}</td>
                  <td className="p-2 border">{res.preferredDay}</td>
                  <td className="p-2 border">{res.status}</td>
                  <td className="p-2 border text-center flex gap-1 flex-wrap">
                    <select
                      value={res.status}
                      onChange={(e) => handleReservationStatus(res, e.target.value)}
                      className="p-1 border rounded text-xs"
                    >
                      <option value="Pending">Pending</option>
                      <option value="On Loan">On Loan</option>
                      <option value="Returned">Returned</option>
                    </select>
                    <button
                      onClick={() => handleDeleteReservation(res.id)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-3">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4 text-bethDeepBlue">Edit Toy</h3>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-2"
            />
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full h-40 border p-2 rounded mb-2"
            />
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full border p-2 rounded mb-2"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="p-2 border rounded"
              >
                <option value="">Select Category</option>
                <option value="Fine Motor">Fine Motor</option>
                <option value="Sensory Play">Sensory Play</option>
                <option value="Pretend Play">Pretend Play</option>
                <option value="Gross Motor">Gross Motor</option>
                <option value="Music">Music</option>
                <option value="STEM">STEM</option>
                <option value="Games">Games</option>
                <option value="Numbers">Numbers</option>
                <option value="Letters">Letters</option>
                <option value="Others">Others</option>
              </select>

              <select
                name="ageGroup"
                value={formData.ageGroup}
                onChange={handleChange}
                className="p-2 border rounded"
              >
                <option value="">Select Age Group</option>
                <option value="2-5">2-5 years</option>
                <option value="2-10">2-10 years</option>
                <option value="6-10">6–10 years</option>
                <option value="9+">9+ years</option>
              </select>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="p-2 border rounded"
              >
                <option value="Available">Available</option>
                <option value="Pending">Pending</option>
                <option value="On Loan">On Loan</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-1 bg-bethDeepBlue text-white rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}