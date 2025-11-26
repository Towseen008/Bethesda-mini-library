// src/pages/Admin.jsx
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
import Pagination from "../components/Pagination";
import bethesdaLogo from "../assets/BethesdaLogo.png";

export default function Admin() {
  // --- Items State ---
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    ageGroup: "",
    description: "",
    images: [], // <-- Using multiple images
    status: "Available",
  });
  const [uploading, setUploading] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Items Filters ---
  const [categoryFilter, setCategoryFilter] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");
  const itemsPerPage = 12;
  const [currentItemPage, setCurrentItemPage] = useState(1);

  // --- Reservations State ---
  const [reservations, setReservations] = useState([]);
  const [reservationSearchTerm, setReservationSearchTerm] = useState("");
  const [reservationStatusFilter, setReservationStatusFilter] = useState("");
  const [filteredReservations, setFilteredReservations] = useState([]);
  const reservationsPerPage = 20;
  const [currentReservationPage, setCurrentReservationPage] = useState(1);

  // --- Fetch Items ---
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

  // --- Fetch Reservations (real-time) ---
  useEffect(() => {
    fetchItems();
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

  // --- Filter and Sort Items ---
  useEffect(() => {
    let updated = [...items];

    if (categoryFilter)
      updated = updated.filter((i) => i.category === categoryFilter);

    if (itemSearchTerm)
      updated = updated.filter((i) =>
        i.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
      );

    if (sortOption === "az") updated.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption === "za") updated.sort((a, b) => b.name.localeCompare(a.name));
    else if (sortOption === "newest")
      updated.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );

    setFilteredItems(updated);
    setCurrentItemPage(1);
  }, [items, categoryFilter, itemSearchTerm, sortOption]);

  // --- Filter Reservations ---
  useEffect(() => {
    let updated = [...reservations];

    if (reservationSearchTerm) {
      updated = updated.filter(
        (r) =>
          r.parentName
            .toLowerCase()
            .includes(reservationSearchTerm.toLowerCase()) ||
          r.childName
            .toLowerCase()
            .includes(reservationSearchTerm.toLowerCase()) ||
          r.itemName
            .toLowerCase()
            .includes(reservationSearchTerm.toLowerCase())
      );
    }

    if (reservationStatusFilter) {
      updated = updated.filter((r) => r.status === reservationStatusFilter);
    }

    setFilteredReservations(updated);
    setCurrentReservationPage(1);
  }, [reservations, reservationSearchTerm, reservationStatusFilter]);

  // --- Form Handlers ---
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- Remove Image Function ---
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // --- CLOUDINARY MULTIPLE UPLOAD ---
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);

    const uploadedUrls = [];

    for (let file of files) {
      const data = new FormData();
      data.append("file", file);
      data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        { method: "POST", body: data }
      );

      const json = await res.json();
      uploadedUrls.push(json.secure_url);
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...uploadedUrls],
    }));

    setUploading(false);
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
        images: [],
        status: "Available",
      });

      alert("✅ New toy added successfully!");
    } catch (error) {
      console.error("Error adding item:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ...item,
      images: item.images || [],
    });
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
          images: [],
          status: "Available",
        });
      }, 500);
    } catch (error) {
      console.error("Error updating item:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteDoc(doc(db, "items", id));
      fetchItems();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  // --- Reservation Status / Delete ---
  const handleReservationStatus = async (reservation, newStatus) => {
    try {
      const resRef = doc(db, "reservations", reservation.id);
      await updateDoc(resRef, { status: newStatus });

      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservation.id ? { ...r, status: newStatus } : r
        )
      );

      const itemRef = doc(db, "items", reservation.itemId);
      if (newStatus === "On Loan") await updateDoc(itemRef, { status: "On Loan" });
      if (newStatus === "Returned")
        await updateDoc(itemRef, { status: "Available" });
      if (newStatus === "Pending")
        await updateDoc(itemRef, { status: "Pending" });

      fetchItems();
    } catch (error) {
      console.error("Error updating reservation status:", error);
    }
  };

  const handleDeleteReservation = async (id) => {
    if (!window.confirm("Delete this reservation?")) return;
    try {
      await deleteDoc(doc(db, "reservations", id));
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error deleting reservation:", error);
    }
  };

  const getBadgeColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-200 text-yellow-800";
      case "On Loan":
        return "bg-red-200 text-red-800";
      case "Returned":
        return "bg-green-200 text-green-800";
      default:
        return "bg-green-200 text-green-800";
    }
  };

  // --- CSV EXPORT (Filtered Reservations) ---
  const exportReservationsCSV = () => {
    const headers = [
      "Item",
      "Parent",
      "Parent Email",
      "Child",
      "Preferred Day",
      "Status",
    ];

    const rows = filteredReservations.map((res) => [
      res.itemName || "",
      res.parentName || "",
      res.parentEmail || "",
      res.childName || "",
      res.preferredDay || "",
      res.status || "",
    ]);

    const escapeCell = (cell) =>
      `"${cell.toString().replace(/"/g, '""')}"`;

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((row) => row.map(escapeCell).join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "reservations_summary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">
      <h2 className="text-2xl font-bold text-bethDeepBlue border-b pb-2">
        Admin Dashboard
      </h2>

      {/* Add New Toy Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow p-4 rounded space-y-3"
      >
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

        {/* MULTIPLE IMAGE UPLOAD */}
        <div>
          <label className="font-semibold">Upload Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="w-full border p-2 rounded"
          />

          {uploading && <p className="text-sm text-blue-500">Uploading...</p>}

          {/* Preview with Remove */}
          <div className="flex gap-2 flex-wrap mt-2">
            {formData.images.map((img, i) => (
              <div key={i} className="relative w-20 h-20">
                <img
                  src={img}
                  className="w-20 h-20 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  title="Remove Image"
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

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
            <option value="All Age">All Age</option>
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

        <button
          type="submit"
          className="bg-bethDeepBlue text-white px-4 py-2 rounded hover:bg-bethLightBlue"
        >
          Add Toy
        </button>
      </form>

      {/* EXISTING TOYS */}
      <div className="space-y-4 mt-10">
        <h3 className="text-2xl font-bold text-bethDeepBlue border-b pb-2">
          Existing Toys
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border p-2 rounded w-full sm:w-1/4"
          >
            <option value="">All Categories</option>
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
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="border p-2 rounded w-full sm:w-1/4"
          >
            <option value="newest">Newest</option>
            <option value="az">A-Z</option>
            <option value="za">Z-A</option>
          </select>

          <input
            type="text"
            placeholder="Search toys..."
            value={itemSearchTerm}
            onChange={(e) => setItemSearchTerm(e.target.value)}
            className="border p-2 rounded w-full sm:w-1/3"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems
            .slice(
              (currentItemPage - 1) * itemsPerPage,
              currentItemPage * itemsPerPage
            )
            .map((item) => (
              <div
                key={item.id}
                className="bg-white border shadow rounded p-4 space-y-2"
              >
                <img
                  src={item.images?.[0]}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded"
                />

                <h3 className="font-semibold text-bethDeepBlue">{item.name}</h3>
                <p className="text-sm">Category: {item.category || "N/A"}</p>
                <p className="text-sm">Age: {item.ageGroup || "N/A"}</p>

                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getBadgeColor(
                    item.status
                  )}`}
                >
                  {item.status}
                </span>

                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>

        <Pagination
          currentPage={currentItemPage}
          totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
          onPageChange={setCurrentItemPage}
        />
      </div>

      {/* RESERVATIONS */}
      <div className="space-y-4 mt-10">
        <h3 className="text-2xl font-bold text-bethDeepBlue border-b pb-2">
          Reservations
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 justify-between">

          {/* Reservation Filters Section */}
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <select
              value={reservationStatusFilter}
              onChange={(e) => setReservationStatusFilter(e.target.value)}
              className="border p-2 rounded w-full sm:w-1/4"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="On Loan">On Loan</option>
              <option value="Returned">Returned</option>
            </select>

            <input
              type="text"
              placeholder="Search reservations..."
              value={reservationSearchTerm}
              onChange={(e) => setReservationSearchTerm(e.target.value)}
              className="border p-2 rounded w-full sm:w-1/3"
            />
          </div>

          {/* Export Button */}
          <button
            onClick={exportReservationsCSV}
            className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm"
          >
            Export CSV
          </button>

        </div>

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
              {filteredReservations
                .slice(
                  (currentReservationPage - 1) * reservationsPerPage,
                  currentReservationPage * reservationsPerPage
                )
                .map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50">
                    <td className="p-2 border">{res.itemName}</td>
                    <td className="p-2 border">{res.parentName}</td>
                    <td className="p-2 border">{res.parentEmail}</td>
                    <td className="p-2 border">{res.childName}</td>
                    <td className="p-2 border">{res.preferredDay}</td>

                    <td className="p-2 border">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getBadgeColor(
                          res.status
                        )}`}
                      >
                        {res.status}
                      </span>
                    </td>

                    <td className="p-2 border text-center flex gap-1 flex-wrap">
                      <select
                        value={res.status}
                        onChange={(e) =>
                          handleReservationStatus(res, e.target.value)
                        }
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

        <Pagination
          currentPage={currentReservationPage}
          totalPages={Math.ceil(
            filteredReservations.length / reservationsPerPage
          )}
          onPageChange={setCurrentReservationPage}
        />
      </div>

      {/* EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-3">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4 text-bethDeepBlue">
              Edit Toy
            </h3>

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

            {/* MULTIPLE IMAGE UPLOAD IN MODAL */}
            <div>
              <label className="font-semibold">Add More Images</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="w-full border p-2 rounded"
              />

              {uploading && (
                <p className="text-sm text-blue-500">Uploading...</p>
              )}

              <div className="flex gap-2 flex-wrap mt-2">
                {formData.images?.map((img, i) => (
                  <div key={i} className="relative w-20 h-20">
                    <img
                      src={img}
                      className="w-20 h-20 object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      title="Remove Image"
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                    >
                      ❌
                    </button>
                  </div>
                ))}
              </div>
            </div>

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
                <option value="All Age">All Age</option>
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