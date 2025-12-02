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
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

// Components
import SectionCard from "../components/admin/SectionCard";
import ToyForm from "../components/admin/ToyForm";
import ToyCard from "../components/admin/ToyCard";
import ReservationRow from "../components/admin/ReservationRow";
import WishlistRow from "../components/admin/WishlistRow";
import ArchiveRow from "../components/admin/ArchiveRow";
import Pagination from "../components/Pagination";
import ConfirmModal from "../components/admin/ConfirmModal";

// Constants & Helpers
import {
  CATEGORY_OPTIONS,
  RESERVATION_STATUS_OPTIONS,
  INITIAL_FORM_STATE,
} from "../components/admin/constants";

import { downloadCSV } from "../components/admin/helpers";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("add");

  /* --------------------- ITEM STATE --------------------- */
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [uploading, setUploading] = useState(false);

  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  const itemsPerPage = 12;
  const [currentItemPage, setCurrentItemPage] = useState(1);

  /* ----------------- RESERVATION STATE ------------------ */
  const [reservations, setReservations] = useState([]);
  const [reservationSearchTerm, setReservationSearchTerm] = useState("");
  const [reservationStatusFilter, setReservationStatusFilter] = useState("");
  const [filteredReservations, setFilteredReservations] = useState([]);

  const reservationsPerPage = 20;
  const [currentReservationPage, setCurrentReservationPage] = useState(1);

  /* ------------------ WISHLIST STATE ------------------ */
  const [wishlist, setWishlist] = useState([]);
  const [filteredWishlist, setFilteredWishlist] = useState([]);
  const [wishlistSearch, setWishlistSearch] = useState("");
  const wishlistPerPage = 30;
  const [currentWishlistPage, setCurrentWishlistPage] = useState(1);

  /* ------------------ ARCHIVE STATE ------------------ */
  const [archives, setArchives] = useState([]);
  const [filteredArchives, setFilteredArchives] = useState([]);
  const [archiveSearch, setArchiveSearch] = useState("");
  const archivePerPage = 30;
  const [currentArchivePage, setCurrentArchivePage] = useState(1);

  /* ---------------- CONFIRM MODAL STATE ---------------- */
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    mode: null, // 'convertWishlist' | 'deleteWishlist' | 'restoreArchive' | 'deleteArchive'
    payload: null,
  });

  const openConfirm = (mode, payload) => {
    setConfirmModal({ open: true, mode, payload });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, mode: null, payload: null });
  };

  /* ------------------ INITIAL LOAD ------------------ */
  useEffect(() => {
    fetchItems();

    const unsubscribeRes = onSnapshot(collection(db, "reservations"), (snap) => {
      setReservations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubscribeWish = onSnapshot(collection(db, "wishlists"), (snap) => {
      setWishlist(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    const unsubscribeArchive = onSnapshot(collection(db, "archives"), (snap) => {
      setArchives(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribeRes();
      unsubscribeWish();
      unsubscribeArchive();
    };
  }, []);

  const fetchItems = async () => {
    const res = await getDocs(collection(db, "items"));
    const data = res.docs.map((d) => ({ id: d.id, ...d.data() }));
    setItems(data);
    setFilteredItems(data);
  };

  /* ------------------ FILTER ITEMS ------------------ */
  useEffect(() => {
    let updated = [...items];

    if (categoryFilter)
      updated = updated.filter((i) => i.category === categoryFilter);

    if (itemSearchTerm)
      updated = updated.filter((i) =>
        i.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
      );

    if (sortOption === "az") updated.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortOption === "za")
      updated.sort((a, b) => b.name.localeCompare(a.name));
    else
      updated.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );

    setFilteredItems(updated);
    setCurrentItemPage(1);
  }, [items, categoryFilter, itemSearchTerm, sortOption]);

  /* ---------------- FILTER RESERVATIONS ------------- */
  useEffect(() => {
    let updated = [...reservations];

    if (reservationSearchTerm) {
      const t = reservationSearchTerm.toLowerCase();
      updated = updated.filter((r) => {
        const dateStr = r.createdAt?.toDate
          ? r.createdAt.toDate().toLocaleDateString().toLowerCase()
          : "";
        return (
          r.itemName?.toLowerCase().includes(t) ||
          r.parentName?.toLowerCase().includes(t) ||
          r.childName?.toLowerCase().includes(t) ||
          dateStr.includes(t)
        );
      });
    }

    if (reservationStatusFilter)
      updated = updated.filter((r) => r.status === reservationStatusFilter);

    setFilteredReservations(updated);
    setCurrentReservationPage(1);
  }, [reservations, reservationSearchTerm, reservationStatusFilter]);

  /* ---------------- FILTER + SORT WISHLIST ------------- */
  useEffect(() => {
    let updated = [...wishlist];

    if (wishlistSearch) {
      const term = wishlistSearch.toLowerCase();
      updated = updated.filter((w) => {
        const dateStr = w.createdAt?.toDate
          ? w.createdAt.toDate().toLocaleDateString().toLowerCase()
          : "";
        return (
          w.itemName?.toLowerCase().includes(term) ||
          w.parentName?.toLowerCase().includes(term) ||
          w.childName?.toLowerCase().includes(term) ||
          dateStr.includes(term)
        );
      });
    }

    // Oldest waitlist first
    updated.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return aTime - bTime;
    });

    setFilteredWishlist(updated);
    setCurrentWishlistPage(1);
  }, [wishlist, wishlistSearch]);

  /* ---------------- FILTER + SORT ARCHIVES ------------- */
  useEffect(() => {
    let updated = [...archives];

    if (archiveSearch) {
      const term = archiveSearch.toLowerCase();
      updated = updated.filter((a) => {
        const dateStr = a.archivedAt?.toDate
          ? a.archivedAt.toDate().toLocaleDateString().toLowerCase()
          : "";
        return (
          a.itemName?.toLowerCase().includes(term) ||
          a.parentName?.toLowerCase().includes(term) ||
          a.childName?.toLowerCase().includes(term) ||
          dateStr.includes(term)
        );
      });
    }

    // Newest returns first
    updated.sort((a, b) => {
      const aTime = a.archivedAt?.seconds || 0;
      const bTime = b.archivedAt?.seconds || 0;
      return bTime - aTime;
    });

    setFilteredArchives(updated);
    setCurrentArchivePage(1);
  }, [archives, archiveSearch]);

  /* ---------------- FORM CHANGE ------------------ */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const removeImage = (i) =>
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== i),
    }));

  /* ---------------- CLOUDINARY UPLOAD ---------------- */
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploading(true);
    const urls = [];

    for (let f of files) {
      const data = new FormData();
      data.append("file", f);
      data.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        { method: "POST", body: data }
      );

      const json = await res.json();
      urls.push(json.secure_url);
    }

    setFormData((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    setUploading(false);
  };

  /* --------------------- ADD ITEM ---------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(formData.quantity) || 0;
    const totalQty = Number(formData.totalQuantity) || qty;

    await addDoc(collection(db, "items"), {
      ...formData,
      quantity: qty,
      totalQuantity: totalQty,
      createdAt: serverTimestamp(),
    });

    fetchItems();
    setFormData(INITIAL_FORM_STATE);
    alert("Toy added successfully!");
  };

  /* --------------------- EDIT ITEM ---------------------- */
  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || "",
      category: item.category || "",
      ageGroup: item.ageGroup || "",
      description: item.description || "",
      images: item.images || [],
      status: item.status || "Available",
      quantity: item.quantity ?? 0,
      totalQuantity: item.totalQuantity ?? item.quantity ?? 0,
    });
    setIsModalOpen(true);
  };

  const handleSaveEdit = async () => {
    const qty = Number(formData.quantity);
    const totalQty = Number(formData.totalQuantity);

    await updateDoc(doc(db, "items", editingItem.id), {
      ...formData,
      quantity: Math.min(qty, totalQty),
      totalQuantity: totalQty,
    });

    fetchItems();
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(INITIAL_FORM_STATE);
  };

  /* ------------------- DELETE ITEM ------------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this toy?")) return;
    await deleteDoc(doc(db, "items", id));
    fetchItems();
  };

  /* ----------- RESERVATION STATUS UPDATE + AUTO-ARCHIVE ----------- */
  const handleReservationStatus = async (reservation, newStatus) => {
    try {
      const resRef = doc(db, "reservations", reservation.id);
      await updateDoc(resRef, { status: newStatus });

      // Fetch item
      const itemRef = doc(db, "items", reservation.itemId);
      const snap = await getDoc(itemRef);
      if (!snap.exists()) return;

      const item = snap.data();
      const total = Number(item.totalQuantity ?? 0);
      let quantity = Number(item.quantity ?? 0);
      let itemStatus = item.status || "Available";

      if (newStatus === "On Loan") {
        quantity = Math.max(0, quantity - 1);
        itemStatus = quantity === 0 ? "On Loan" : "Available";
      } else if (newStatus === "Returned") {
        // Increase inventory, set Available, archive, remove from reservations
        quantity = Math.min(total, quantity + 1);
        itemStatus = "Available";

        await updateDoc(itemRef, {
          quantity,
          status: itemStatus,
        });

        // Move to archives collection
        await addDoc(collection(db, "archives"), {
          itemId: reservation.itemId,
          itemName: reservation.itemName,
          parentName: reservation.parentName,
          parentEmail: reservation.parentEmail,
          childName: reservation.childName,
          preferredDay: reservation.preferredDay || "",
          note: reservation.note || "",
          status: "Returned",
          createdAt: reservation.createdAt || serverTimestamp(),
          archivedAt: serverTimestamp(),
        });

        await deleteDoc(resRef);
        fetchItems();
        return;
      }

      // Pending / Ready for Pickup: inventory unchanged
      await updateDoc(itemRef, {
        quantity,
        status: itemStatus,
      });

      fetchItems();
    } catch (err) {
      console.error("Error updating reservation status:", err);
    }
  };

  const handleDeleteReservation = async (id) => {
    if (!window.confirm("Delete reservation?")) return;
    await deleteDoc(doc(db, "reservations", id));
  };

  /* ----------- CONFIRM MODAL ACTION HANDLER ----------- */
  const handleConfirmAction = async () => {
    const { mode, payload } = confirmModal;
    if (!mode || !payload) {
      closeConfirm();
      return;
    }

    try {
      if (mode === "convertWishlist") {
        // Move to reservations as Pending
        await addDoc(collection(db, "reservations"), {
          itemId: payload.itemId,
          itemName: payload.itemName,
          parentName: payload.parentName,
          parentEmail: payload.parentEmail,
          childName: payload.childName,
          preferredDay: "",
          note: payload.note || "",
          status: "Pending",
          createdAt: payload.createdAt || serverTimestamp(),
        });

        await deleteDoc(doc(db, "wishlists", payload.id));
      } else if (mode === "deleteWishlist") {
        await deleteDoc(doc(db, "wishlists", payload.id));
      } else if (mode === "restoreArchive") {
        // Restore with same original data → Pending
        await addDoc(collection(db, "reservations"), {
          itemId: payload.itemId,
          itemName: payload.itemName,
          parentName: payload.parentName,
          parentEmail: payload.parentEmail,
          childName: payload.childName,
          preferredDay: payload.preferredDay || "",
          note: payload.note || "",
          status: "Pending",
          createdAt: payload.createdAt || serverTimestamp(),
        });

        await deleteDoc(doc(db, "archives", payload.id));

        // Switch to Reservations tab (Option A)
        setActiveTab("reservations");
      } else if (mode === "deleteArchive") {
        await deleteDoc(doc(db, "archives", payload.id));
      }
    } catch (err) {
      console.error("Error in confirm action:", err);
    } finally {
      closeConfirm();
    }
  };

  /* ------------------- CSV EXPORTS ------------------- */
  const exportInventoryCSV = () => {
    downloadCSV(
      ["Name", "Category", "Age Group", "Status", "Available", "Total"],
      filteredItems.map((i) => [
        i.name,
        i.category,
        i.ageGroup,
        i.status,
        i.quantity,
        i.totalQuantity,
      ]),
      "inventory.csv"
    );
  };

  const exportReservationsCSV = () => {
    downloadCSV(
      ["Item", "Parent", "Email", "Child", "Preferred Day", "Status"],
      filteredReservations.map((r) => [
        r.itemName,
        r.parentName,
        r.parentEmail,
        r.childName,
        r.preferredDay,
        r.status,
      ]),
      "reservations.csv"
    );
  };

  const exportWishlistCSV = () => {
    downloadCSV(
      ["Item", "Parent", "Email", "Child", "Request Date"],
      filteredWishlist.map((w) => [
        w.itemName,
        w.parentName,
        w.parentEmail,
        w.childName,
        w.createdAt?.toDate
          ? w.createdAt.toDate().toLocaleDateString()
          : "N/A",
      ]),
      "wishlist.csv"
    );
  };

  const exportArchiveCSV = () => {
    downloadCSV(
      ["Item", "Parent", "Email", "Child", "Preferred Day", "Status", "Returned Date"],
      filteredArchives.map((a) => [
        a.itemName,
        a.parentName,
        a.parentEmail,
        a.childName,
        a.preferredDay || "",
        a.status || "Returned",
        a.archivedAt?.toDate
          ? a.archivedAt.toDate().toLocaleDateString()
          : "N/A",
      ]),
      "archives.csv"
    );
  };

  /* ------------------- SUMMARY COUNTS ------------------- */
  const totalInventory = items.reduce(
    (sum, item) => sum + (item.totalQuantity ?? 0),
    0
  );
  const totalAvailable = items.reduce(
    (sum, item) => sum + (item.quantity ?? 0),
    0
  );
  const totalLoaned = totalInventory - totalAvailable;

  const pending = reservations.filter((res) => res.status === "Pending").length;
  const ready = reservations.filter(
    (res) => res.status === "Ready for Pickup"
  ).length;
  const waitlistCount = wishlist.length;

  /* ======================= RENDER ======================= */

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">
      <h2 className="text-2xl font-bold text-bethDeepBlue">Admin Dashboard</h2>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SectionCard
          label="Total Toy Types"
          value={items.length}
          border="border-bethDeepBlue"
        />
        <SectionCard
          label="Total Inventory Copies"
          value={totalInventory}
          border="border-green-600"
        />
        <SectionCard
          label="Available Copies"
          value={totalAvailable}
          border="border-blue-500"
        />
        <SectionCard
          label="Items On Loan"
          value={totalLoaned}
          border="border-red-600"
        />
        <SectionCard
          label="Pending Reservations"
          value={pending}
          border="border-yellow-500"
        />
        <SectionCard
          label="Ready for Pickup"
          value={ready}
          border="border-green-400"
        />
        <SectionCard
          label="Waitlist Requests"
          value={waitlistCount}
          border="border-purple-500"
        />
      </div>

      {/* TABS */}
      <div className="flex gap-3 border-b pb-2 mt-4">
        {["add", "items", "reservations", "wishlist", "archive"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t font-medium ${
              activeTab === tab
                ? "bg-bethDeepBlue text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tab === "add" && "➕ Add Toy"}
            {tab === "items" && "🧸 Existing Toys"}
            {tab === "reservations" && "📋 Reservations"}
            {tab === "wishlist" && "⭐ Waitlist"}
            {tab === "archive" && "📦 Archive"}
          </button>
        ))}
      </div>

      {/* TAB: ADD TOY */}
      {activeTab === "add" && (
        <ToyForm
          formData={formData}
          title="Add New Toy"
          onChange={handleChange}
          onUpload={handleImageUpload}
          uploading={uploading}
          onSubmit={handleSubmit}
          onRemoveImage={removeImage}
        />
      )}

      {/* TAB: EXISTING TOYS */}
      {activeTab === "items" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-bethDeepBlue">
              Existing Toys
            </h3>
            <button
              onClick={exportInventoryCSV}
              className="bg-green-600 text-white px-3 py-2 rounded text-sm"
            >
              Export Inventory CSV
            </button>
          </div>

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              className="border p-2 rounded w-full sm:w-1/4"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat}>{cat}</option>
              ))}
            </select>

            <select
              className="border p-2 rounded w-full sm:w-1/4"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="az">A-Z</option>
              <option value="za">Z-A</option>
            </select>

            <input
              type="text"
              className="border p-2 rounded w-full sm:w-1/3"
              placeholder="Search toys..."
              value={itemSearchTerm}
              onChange={(e) => setItemSearchTerm(e.target.value)}
            />
          </div>

          {/* TOY GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems
              .slice(
                (currentItemPage - 1) * itemsPerPage,
                currentItemPage * itemsPerPage
              )
              .map((item) => (
                <ToyCard
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
          </div>

          <Pagination
            currentPage={currentItemPage}
            totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
            onPageChange={setCurrentItemPage}
          />
        </div>
      )}

      {/* TAB: RESERVATIONS */}
      {activeTab === "reservations" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-bethDeepBlue">
              Reservations
            </h3>

            <button
              onClick={exportReservationsCSV}
              className="bg-purple-600 text-white px-3 py-2 rounded text-sm"
            >
              Export Reservations CSV
            </button>
          </div>

          {/* FILTERS */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              className="border p-2 rounded w-full sm:w-1/4"
              value={reservationStatusFilter}
              onChange={(e) => setReservationStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              {RESERVATION_STATUS_OPTIONS.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search reservations (name or date)..."
              value={reservationSearchTerm}
              onChange={(e) => setReservationSearchTerm(e.target.value)}
              className="border p-2 rounded w-full sm:w-1/3"
            />
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-bethLightGray">
                <tr>
                  <th className="p-2 border">Item</th>
                  <th className="p-2 border">Parent</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Child</th>
                  <th className="p-2 border">Preferred Day</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredReservations
                  .slice(
                    (currentReservationPage - 1) * reservationsPerPage,
                    currentReservationPage * reservationsPerPage
                  )
                  .map((r) => (
                    <ReservationRow
                      key={r.id}
                      res={r}
                      onStatus={handleReservationStatus}
                      onDelete={handleDeleteReservation}
                    />
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
      )}

      {/* TAB: WISHLIST */}
      {activeTab === "wishlist" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-bethDeepBlue">
              Waitlist Requests
            </h3>

            <button
              onClick={exportWishlistCSV}
              className="bg-purple-600 text-white px-3 py-2 rounded text-sm"
            >
              Export Wishlist CSV
            </button>
          </div>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search waitlist (name or date)..."
            value={wishlistSearch}
            onChange={(e) => setWishlistSearch(e.target.value)}
            className="border p-2 rounded w-full sm:w-1/3"
          />

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-bethLightGray">
                <tr>
                  <th className="p-2 border">Item</th>
                  <th className="p-2 border">Parent</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Child</th>
                  <th className="p-2 border">Request Date</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredWishlist
                  .slice(
                    (currentWishlistPage - 1) * wishlistPerPage,
                    currentWishlistPage * wishlistPerPage
                  )
                  .map((entry) => (
                    <WishlistRow
                      key={entry.id}
                      res={entry}
                      onConvert={() =>
                        openConfirm("convertWishlist", entry)
                      }
                      onDelete={() =>
                        openConfirm("deleteWishlist", entry)
                      }
                    />
                  ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentWishlistPage}
            totalPages={Math.ceil(
              filteredWishlist.length / wishlistPerPage
            )}
            onPageChange={setCurrentWishlistPage}
          />
        </div>
      )}

      {/* TAB: ARCHIVE */}
      {activeTab === "archive" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-bethDeepBlue">
              Archived Reservations
            </h3>

            <button
              onClick={exportArchiveCSV}
              className="bg-gray-700 text-white px-3 py-2 rounded text-sm"
            >
              Download Archive CSV
            </button>
          </div>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search archive (name or date)..."
            value={archiveSearch}
            onChange={(e) => setArchiveSearch(e.target.value)}
            className="border p-2 rounded w-full sm:w-1/3"
          />

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-bethLightGray">
                <tr>
                  <th className="p-2 border">Item</th>
                  <th className="p-2 border">Parent</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Child</th>
                  <th className="p-2 border">Preferred Day</th>
                  <th className="p-2 border">Returned Date</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredArchives
                  .slice(
                    (currentArchivePage - 1) * archivePerPage,
                    currentArchivePage * archivePerPage
                  )
                  .map((entry) => (
                    <ArchiveRow
                      key={entry.id}
                      entry={entry}
                      onRestore={() =>
                        openConfirm("restoreArchive", entry)
                      }
                      onDelete={() =>
                        openConfirm("deleteArchive", entry)
                      }
                    />
                  ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentArchivePage}
            totalPages={Math.ceil(filteredArchives.length / archivePerPage)}
            onPageChange={setCurrentArchivePage}
          />
        </div>
      )}

      {/* EDIT TOY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-3">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <ToyForm
              formData={formData}
              title="Edit Toy"
              onChange={handleChange}
              onUpload={handleImageUpload}
              uploading={uploading}
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
              onRemoveImage={removeImage}
            />

            <div className="flex justify-end mt-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingItem(null);
                  setFormData(INITIAL_FORM_STATE);
                }}
                className="px-3 py-1 border rounded mr-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL (shared for wishlist/archive actions) */}
      <ConfirmModal
        open={confirmModal.open}
        title={
          confirmModal.mode === "convertWishlist"
            ? "Convert to Reservation"
            : confirmModal.mode === "deleteWishlist"
            ? "Delete Waitlist Entry"
            : confirmModal.mode === "restoreArchive"
            ? "Restore Reservation"
            : confirmModal.mode === "deleteArchive"
            ? "Delete Archived Record"
            : "Confirm Action"
        }
        message={
          confirmModal.mode === "convertWishlist"
            ? "Move this waitlist entry into the active reservations list as a Pending reservation?"
            : confirmModal.mode === "deleteWishlist"
            ? "Delete this waitlist entry? This cannot be undone."
            : confirmModal.mode === "restoreArchive"
            ? "Restore this archived reservation back into the Reservations list as Pending?"
            : confirmModal.mode === "deleteArchive"
            ? "Permanently delete this archived record? This cannot be undone."
            : ""
        }
        confirmLabel={
          confirmModal.mode === "deleteWishlist" ||
          confirmModal.mode === "deleteArchive"
            ? "Delete"
            : "Confirm"
        }
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />
    </div>
  );
}