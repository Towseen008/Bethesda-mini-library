import React, { useState, useEffect} from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const Admin = () => {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState({ name: "", type: "", status: "Available", image: "" });
  const [editId, setEditId] = useState(null);

  const fetchItems = async () => {
    const querySnapshot = await getDocs(collection(db, "items"));
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setItems(data);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateDoc(doc(db, "items", editId), formData);
      } else {
        await addDoc(collection(db, "items"), formData);
      }
      setFormData({ name: "", type: "", status: "Available", image: "" });
      setEditId(null);
      fetchItems();
    } catch (error) {
      console.error("Error saving item: ", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "items", id));
      fetchItems();
    } catch (error) {
      console.error("Error deleting item: ", error);
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditId(item.id);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-[80vh]">
      <h1 className="text-3xl font-bold text-[#0077b6] mb-6">Admin Dashboard</h1>

      {/* Form Section */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md mb-10 max-w-lg mx-auto"
      >
        <h2 className="text-xl font-semibold mb-4">{editId ? "Edit Item" : "Add New Item"}</h2>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full border rounded p-2 mb-3"
          required
        />
        <input
          type="text"
          placeholder="Type (e.g. Toy, Book)"
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full border rounded p-2 mb-3"
          required
        />
        <input
          type="text"
          placeholder="Image URL"
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          className="w-full border rounded p-2 mb-3"
        />
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full border rounded p-2 mb-4"
        >
          <option value="Available">Available</option>
          <option value="On Loan">On Loan</option>
        </select>
        <button
          type="submit"
          className="bg-[#0077b6] text-white px-4 py-2 rounded hover:bg-[#023e8a] w-full"
        >
          {editId ? "Update Item" : "Add Item"}
        </button>
      </form>

      {/* Item List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition"
          >
            <img
              src={item.image || "https://via.placeholder.com/200"}
              alt={item.name}
              className="w-full h-48 object-cover rounded mb-3"
            />
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <p className="text-sm text-gray-600">{item.type}</p>
            <p
              className={`text-sm font-semibold ${
                item.status === "Available" ? "text-green-600" : "text-red-500"
              }`}
            >
              {item.status}
            </p>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => handleEdit(item)}
                className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;