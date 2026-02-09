// src/pages/Admin.jsx
import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, onSnapshot, getDoc, Timestamp, runTransaction,
} from "firebase/firestore";

import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";

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

/* ======================================================
   EMAIL API BASE (RENDER + LOCAL SAFE)
====================================================== */
const isBrowser = typeof window !== "undefined";
const EMAIL_API_BASE =
  import.meta.env.VITE_EMAIL_API_URL ||
  (isBrowser && window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://bethesda-email-service.onrender.com");

/* ======================================================
   EMAIL HELPER
====================================================== */
const sendStatusEmail = async (payload) => {
  try {
    await fetch(`${EMAIL_API_BASE}/email/status-updated`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Status email error:", err);
  }
};

/* ======================================================
   INVENTORY HELPERS
====================================================== */

const incrementItemQuantity = async (itemId) => {
  const ref = doc(db, "items", itemId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const { quantity = 0, totalQuantity = 0 } = snap.data();
  if (quantity >= totalQuantity) return;

  const newQty = quantity + 1;

  const { status } = snap.data();

  await updateDoc(ref, {
    quantity: newQty,
    // keep Not Available if currently Not Available
    status: status === "Not Available" ? "Not Available" : "Available",
  });
};

// ===============================
// TRANSACTION CLAIM LOCK (prevents duplicate emails)
// ===============================
const claimEmailLock = async (reservationId, flagField) => {
  const resRef = doc(db, "reservations", reservationId);

  const claimed = await runTransaction(db, async (tx) => {
    const snap = await tx.get(resRef);
    if (!snap.exists()) return false;

    const data = snap.data();

    // If already sent/claimed, stop
    if (data?.[flagField] === true) return false;

    // Claim it (ONLY ONE browser can win this)
    tx.update(resRef, { [flagField]: true });

    return true; // winner
  });

  return claimed;
};


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
  const archivePerPage = 20;
  const [currentArchivePage, setCurrentArchivePage] = useState(1);

  /* ---------------- CONFIRM MODAL STATE ---------------- */
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    mode: null,
    // 'convertWishlist' | 'deleteWishlist' | 'restoreArchive' | 'deleteArchive'
    // 'moveResToWaitlist' | 'moveResToArchive' | 'deleteReservation'
    // 'confirmBagChange'
    payload: null,
  });

  const openConfirm = (mode, payload) => {
    setConfirmModal({ open: true, mode, payload });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, mode: null, payload: null });
  };

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
      data.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
      );

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

        const fetchItems = async () => {
        const res = await getDocs(collection(db, "items"));
        const data = res.docs.map((d) => ({ id: d.id, ...d.data() }));
        setItems(data);
        setFilteredItems(data);
      };

  /* ------------------ INITIAL LOAD ------------------ */
  useEffect(() => {
    const unsubItems = onSnapshot(collection(db, "items"), (snap) => {
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setItems(data);
    setFilteredItems(data);
  });

    const unsubRes = onSnapshot(collection(db, "reservations"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReservations(data);

      const now = new Date();

      (async () => {
        for (const r of data) {
          try {
            // ===============================
            // AUTO MARK DUE (if due date passed)
            // ===============================
            if (
              r.status === "On Loan" &&
              r.dueDate &&
              typeof r.dueDate.toDate === "function" &&
              r.dueDate.toDate() < now
            ) {
              await updateDoc(doc(db, "reservations", r.id), {
                status: "Due",
                dueReminderSent: true,
                overdue3DaySent: false,
              });

              r.status = "Due";
            }

            // ===============================
            // 2-DAY REMINDER EMAIL (ONCE)
            // ===============================
            if (
              (r.status === "On Loan" || r.status === "Due") &&
              r.dueDate &&
              typeof r.dueDate.toDate === "function" &&
              r.dueReminderSent !== true
            ) {
              const dueDate = r.dueDate.toDate();
              const diffInDays = Math.ceil(
                (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
              );

              if (diffInDays <= 2 && diffInDays > 0) {
                const claimed = await claimEmailLock(r.id, "dueReminderSent");
                if (!claimed) continue;

                try {
                  const resp = await fetch(`${EMAIL_API_BASE}/email/due-reminder`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      parentEmail: r.parentEmail,
                      parentName: r.parentName,
                      childName: r.childName,
                      itemName: r.itemName,
                      dueDate: dueDate.toISOString(),
                    }),
                  });

                  if (!resp.ok) throw new Error(`Email API failed: ${resp.status}`);
                } catch (err) {
                  await updateDoc(doc(db, "reservations", r.id), {
                    dueReminderError: String(err?.message || err),
                    dueReminderErrorAt: serverTimestamp(),
                  });
                  console.error("Due reminder email send failed:", err);
                }
              }
            }

            // ===============================
            // 3-DAYS PAST DUE EMAIL (ONCE)
            // ===============================
            if (
              r.status === "Due" &&
              r.dueDate &&
              typeof r.dueDate.toDate === "function" &&
              r.overdue3DaySent !== true
            ) {
              const dueDate = r.dueDate.toDate();
              const msPerDay = 1000 * 60 * 60 * 24;
              const daysPastDue = Math.floor(
                (now.getTime() - dueDate.getTime()) / msPerDay
              );

              if (daysPastDue >= 3) {
                const claimed = await claimEmailLock(r.id, "overdue3DaySent");
                if (!claimed) continue;

                try {
                  const resp = await fetch(`${EMAIL_API_BASE}/email/overdue-3days`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      parentEmail: r.parentEmail,
                      parentName: r.parentName,
                      childName: r.childName,
                      itemName: r.itemName,
                      dueDate: dueDate.toISOString(),
                      daysPastDue,
                      bagNo: r.bagNo || "",
                    }),
                  });

                  if (!resp.ok) throw new Error(`Email API failed: ${resp.status}`);
                } catch (err) {
                  await updateDoc(doc(db, "reservations", r.id), {
                    overdue3DayError: String(err?.message || err),
                    overdue3DayErrorAt: serverTimestamp(),
                  });
                  console.error("Overdue 3-day email send failed:", err);
                }
              }
            }
          } catch (err) {
            console.error("Reminder/Due check error:", err);
          }
        }
      })();
    });


        const unsubWish = onSnapshot(collection(db, "wishlists"), (snap) => {
          setWishlist(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        const unsubArch = onSnapshot(collection(db, "archives"), (snap) => {
          setArchives(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        });

        return () => {
          unsubItems();
          unsubRes();
          unsubWish();
          unsubArch();
        };
      }, []);

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

  /* ---------------- FILTER RESERVATIONS ---------------- */
  useEffect(() => {
    let updated = [...reservations];

    if (reservationSearchTerm) {
      const t = reservationSearchTerm.toLowerCase();
      updated = updated.filter((r) =>
        [r.itemName, r.parentName, r.childName].join(" ").toLowerCase().includes(t)
      );
    }

    if (reservationStatusFilter)
      updated = updated.filter((r) => r.status === reservationStatusFilter);

    updated.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );

    setFilteredReservations(updated);
    setCurrentReservationPage(1);
  }, [reservations, reservationSearchTerm, reservationStatusFilter]);

  /* ---------------- FILTER WISHLIST ---------------- */
  useEffect(() => {
    let updated = [...wishlist];

    if (wishlistSearch) {
      const t = wishlistSearch.toLowerCase();
      updated = updated.filter((w) =>
        [w.itemName, w.parentName, w.childName].join(" ").toLowerCase().includes(t)
      );
    }

    updated.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );

    setFilteredWishlist(updated);
    setCurrentWishlistPage(1);
  }, [wishlist, wishlistSearch]);

  /* ---------------- FILTER ARCHIVE ---------------- */
  useEffect(() => {
    let updated = [...archives];

    if (archiveSearch) {
      const t = archiveSearch.toLowerCase();
      updated = updated.filter((a) =>
        [a.itemName, a.parentName, a.childName].join(" ").toLowerCase().includes(t)
      );
    }

    updated.sort(
      (a, b) => (b.archivedAt?.seconds || 0) - (a.archivedAt?.seconds || 0)
    );

    setFilteredArchives(updated);
    setCurrentArchivePage(1);
  }, [archives, archiveSearch]);
  
  /* ---------------- ARCHIVE NOTE SAVE ---------------- */
const handleSaveArchiveNote = async (archiveId, newNote) => {
  try {
    await updateDoc(doc(db, "archives", archiveId), {
      note: newNote || "",
      noteUpdatedAt: serverTimestamp(), // optional but helpful
    });
  } catch (err) {
    console.error("Failed to save archive note:", err);
    throw err;
  }
};

  /* --------------------- ADD ITEM ---------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const qty = Number(formData.quantity) || 0;
    const totalQty = Number(formData.totalQuantity) || qty;

    const safeQty = Math.min(qty, totalQty);
    const computedStatus =
      formData.status === "Not Available"
        ? "Not Available"
        : safeQty === 0
        ? "On Loan"
        : "Available";

    await addDoc(collection(db, "items"), {
      ...formData,
      quantity: safeQty,
      totalQuantity: totalQty,
      status: computedStatus,
      createdAt: serverTimestamp(),
    });

    setFormData(INITIAL_FORM_STATE);
    fetchItems();
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
    const qty = Number(formData.quantity) || 0;
    const totalQty = Number(formData.totalQuantity) || 0;

    const safeQty = Math.min(qty, totalQty);
    const computedStatus =
      formData.status === "Not Available"
        ? "Not Available"
        : safeQty === 0
        ? "On Loan"
        : "Available";

    await updateDoc(doc(db, "items", editingItem.id), {
      ...formData,
      quantity: safeQty,
      totalQuantity: totalQty,
      status: computedStatus,
    });

    setEditingItem(null);
    setIsModalOpen(false);
    setFormData(INITIAL_FORM_STATE);
    fetchItems();
  };

  /* ------------------- DELETE ITEM ------------------- */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this toy?")) return;
    await deleteDoc(doc(db, "items", id));
    fetchItems();
  };

  /* ======================================================
    BAG NO UPDATE (called ONLY after confirmation)
  ======================================================= */
  const handleUpdateBagNo = async (reservation, bagNo) => {
    try {
      await updateDoc(doc(db, "reservations", reservation.id), {
        bagNo: bagNo || null,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to update bag number:", err);
    }
  };

  /* ======================================================
  CONFIRM BAG NO CHANGE (non-IT friendly)
  ======================================================= */
  const confirmBagNoChange = (reservation, newBagNo, onConfirmSave) => {
    setConfirmModal({
      open: true,
      mode: "confirmBagChange",
      payload: {
        reservation,
        newBagNo,
        onConfirmSave,
      },
    });
  };

  /* ---------------- RESERVATION STATUS ---------------- */
  const handleReservationStatus = async (reservation, newStatus) => {
    try {
      // 1) Returned: increment stock + archive + delete reservation + email
      if (newStatus === "Returned") {
      // restore stock only if it was committed
      if (reservation.inventoryCommitted) {
        await incrementItemQuantity(reservation.itemId);
      }

      //Only send "Returned" email if it was actually loaned out
      const wasLoaned =
        reservation.status === "On Loan" ||
        reservation.status === "Due" ||
        reservation.status === "Review Return" ||
        !!reservation.loanStartDate;

      const { id, bagNo, ...cleanReservation } = reservation;

      await addDoc(collection(db, "archives"), {
        ...cleanReservation,
        bagNo: bagNo || null,
        status: "Returned",
        archivedAt: serverTimestamp(),
        loanStartDate: reservation.loanStartDate ?? null,
        note: reservation.note ?? "",
      });

      await deleteDoc(doc(db, "reservations", reservation.id));

      // Email only if it was loaned
      if (wasLoaned) {
        await sendStatusEmail({
          parentEmail: reservation.parentEmail,
          parentName: reservation.parentName,
          childName: reservation.childName,
          itemName: reservation.itemName,
          newStatus: "Returned",
          preferredDay: reservation.preferredDay || "",
        });
      }

      return;
    }

      // On Loan: DO NOT decrement stock anymore (already decremented at reservation creation)
      if (newStatus === "On Loan") {
        const start = new Date();
        const due = new Date(start);
        due.setDate(start.getDate() + 14);

        await updateDoc(doc(db, "reservations", reservation.id), {
          status: "On Loan",
          loanStartDate: serverTimestamp(),
          dueDate: Timestamp.fromDate(due),
          dueReminderSent: false,
          overdue3DaySent: false,
          extended: false,
        });
        return;
      }


      //Review Return: just mark status, do NOT increment stock, do NOT archive/delete, do NOT email
      if (newStatus === "Review Return") {
        await updateDoc(doc(db, "reservations", reservation.id), {
          status: "Review Return",
          reviewReturnAt: serverTimestamp(),
        });
        return;
      }

      //All other statuses (Pending / Ready for Pickup / Due)
      await updateDoc(doc(db, "reservations", reservation.id), {
        status: newStatus,
      });

      // Email for all statuses EXCEPT "On Loan", "Due", and "Review Return"
      if (newStatus !== "On Loan" && newStatus !== "Due" && newStatus !== "Review Return") {
        await sendStatusEmail({
          parentEmail: reservation.parentEmail,
          parentName: reservation.parentName,
          childName: reservation.childName,
          itemName: reservation.itemName,
          newStatus,
          preferredDay: reservation.preferredDay || "",
        });
      }
    } catch (err) {
      console.error("Failed to update reservation status:", err);
    }
  };

   /* ---------------- EXTEND LOAN ( +7 days ) ---------------- */
const handleExtendLoan = async (reservation) => {
  try {
    // Only allow extend when On Loan or Due
    if (reservation.status !== "On Loan" && reservation.status !== "Due") return;

    // Prevent extending twice (optional but recommended)
    if (reservation.extended === true) return;

    // Use existing dueDate if present, otherwise base from today
    const baseDue = reservation.dueDate?.toDate
      ? reservation.dueDate.toDate()
      : new Date();

    const newDue = new Date(baseDue);
    newDue.setDate(newDue.getDate() + 7);

    await updateDoc(doc(db, "reservations", reservation.id), {
      dueDate: Timestamp.fromDate(newDue), // Firestore Timestamp
      dueReminderSent: false,              // reset reminder
      overdue3DaySent: false,
      extended: true,                      // label flag
      extendedAt: serverTimestamp(),       // optional audit
      status: "On Loan",
    });
  } catch (err) {
    console.error("Failed to extend loan:", err);
  }
};

  /* ======================================================
     RESERVATION ACTIONS (NOW CONFIRM MODAL, NO window.confirm)
  ======================================================= */

  // Delete action should still move to Archive (Delete (Archive))
  const handleDeleteReservation = (reservation) => {
    openConfirm("deleteReservation", reservation);
  };

  const moveReservationToWaitlist = (reservation) => {
    openConfirm("moveResToWaitlist", reservation);
  };

  const moveReservationToArchive = (reservation, reason = "Archived") => {
    // Pass reason through payload so confirm handler can store it
    openConfirm("moveResToArchive", { ...reservation, archiveReason: reason });
  };

  /* ----------- CONFIRM MODAL ACTION HANDLER ----------- */
  const handleConfirmAction = async () => {
    const { mode, payload } = confirmModal;
    if (!mode || !payload) {
      closeConfirm();
      return;
    }

    // Bag change confirmation
    if (mode === "confirmBagChange") {
      try {
        if (typeof payload.onConfirmSave === "function") {
          payload.onConfirmSave();
        }
      } catch (err) {
        console.error("Error confirming bag change:", err);
      } finally {
        closeConfirm();
      }
      return;
    }
   
    // IMPORTANT: do NOT store the Firestore doc id inside the document
    const { id, ...clean } = payload;

    try {
     
      if (mode === "moveResToWaitlist") {
      // restore stock because this active reservation is being removed
      if (payload.inventoryCommitted) {
        await incrementItemQuantity(payload.itemId);
      }

      await addDoc(collection(db, "wishlists"), {
        ...clean,
        createdAt: payload.createdAt || serverTimestamp(),
      });

      await deleteDoc(doc(db, "reservations", id));
    }


      // ===== NEW: Reservations -> Archive
        else if (mode === "moveResToArchive") {
        // restore stock because this active reservation is being removed
        if (payload.inventoryCommitted) {
          await incrementItemQuantity(payload.itemId);
        }

        const reason = payload.archiveReason || "Archived";
        const { archiveReason, ...cleanNoReason } = payload;

        await addDoc(collection(db, "archives"), {
          ...cleanNoReason,
          archivedAt: serverTimestamp(),
          archiveReason: reason,
          loanStartDate: payload.loanStartDate ?? null,
          note: payload.note ?? "",
        });
 
        await deleteDoc(doc(db, "reservations", id));
      }


      // ===== NEW: Reservation delete (still archives) =====
      else if (mode === "deleteReservation") {
        // restore stock because this active reservation is being removed
        if (payload.inventoryCommitted) {
          await incrementItemQuantity(payload.itemId);
        }

        await addDoc(collection(db, "archives"), {
          ...clean,
          archivedAt: serverTimestamp(),
          archiveReason: "Deleted",
          loanStartDate: payload.loanStartDate ?? null,
          note: payload.note ?? "",
        });

        await deleteDoc(doc(db, "reservations", id));
      }

      // ===== Existing wishlist/archive actions (unchanged) =====
      else if (mode === "convertWishlist") {
        const itemRef = doc(db, "items", payload.itemId);
        const reservationRef = doc(collection(db, "reservations"));

        const result = await runTransaction(db, async (tx) => {
          const itemSnap = await tx.get(itemRef);
          if (!itemSnap.exists()) throw new Error("Item not found");

          const item = itemSnap.data();
          const qty = Number(item.quantity ?? 0);

          if (qty <= 0) return { type: "no_stock" };

          const newQty = qty - 1;

          // keep "Not Available" if admin locked it
          const currentStatus = String(item.status || "");
          const nextStatus =
            currentStatus === "Not Available"
              ? "Not Available"
              : newQty === 0
              ? "On Loan"
              : "Available";

          tx.update(itemRef, { quantity: newQty, status: nextStatus });

          tx.set(reservationRef, {
            ...clean,
            status: "Pending",
            createdAt: payload.createdAt || serverTimestamp(),
            inventoryCommitted: true,
          });

          return { type: "ok" };
        });

        if (result.type === "no_stock") {
          alert("No copies available right now. Keep on waitlist.");
          return;
        }

        await deleteDoc(doc(db, "wishlists", id));
        setActiveTab("reservations");
      }

      
      else if (mode === "deleteWishlist") {
        await deleteDoc(doc(db, "wishlists", id));
      }else if (mode === "restoreArchive") {
        const itemRef = doc(db, "items", payload.itemId);
        const reservationRef = doc(collection(db, "reservations"));

        const result = await runTransaction(db, async (tx) => {
          const itemSnap = await tx.get(itemRef);
          if (!itemSnap.exists()) throw new Error("Item not found");

          const item = itemSnap.data();
          const qty = Number(item.quantity ?? 0);

          if (qty <= 0) return { type: "no_stock" };

          const newQty = qty - 1;

          // keep "Not Available" if admin locked it
          const currentStatus = String(item.status || "");
          const nextStatus =
            currentStatus === "Not Available"
              ? "Not Available"
              : newQty === 0
              ? "On Loan"
              : "Available";

          tx.update(itemRef, { quantity: newQty, status: nextStatus });

          tx.set(reservationRef, {
            ...clean,
            status: "Pending",
            createdAt: payload.createdAt || serverTimestamp(),
            inventoryCommitted: true,
          });

          return { type: "ok" };
        });

        if (result.type === "no_stock") {
          alert("No copies available right now. Cannot restore to Reservations.");
          return;
        }

        await deleteDoc(doc(db, "archives", id));
        setActiveTab("reservations");
      }else if (mode === "deleteArchive") {
        await deleteDoc(doc(db, "archives", id));
      }
    } catch (err) {
      console.error("Error in confirm action:", err);
    } finally {
      closeConfirm();
    }
  };

  /* ------------------- CSV EXPORTS ------------------- */
  const exportInventoryCSV = () =>
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

  const exportReservationsCSV = () =>
    downloadCSV(
      ["Item", "Parent", "Email", "Child", "Preferred Day", "Bag No", "Status"],
      filteredReservations.map((r) => [
        r.itemName,
        r.parentName,
        r.parentEmail,
        r.childName,
        r.preferredDay,
        r.bagNo || "",
        r.status,
      ]),
      "reservations.csv"
    );

  const exportWishlistCSV = () =>
    downloadCSV(
      ["Item", "Parent", "Email", "Child", "Request Date"],
      filteredWishlist.map((w) => [
        w.itemName,
        w.parentName,
        w.parentEmail,
        w.childName,
        w.createdAt?.toDate ? w.createdAt.toDate().toLocaleDateString() : "N/A",
      ]),
      "wishlist.csv"
    );

 
  const exportArchiveCSV = () =>
    downloadCSV(
      ["Item", "Parent", "Email", "Child", "Status", "Pickup Date", "Returned Date", "Note"],
      filteredArchives.map((a) => [
        a.itemName,
        a.parentName,
        a.parentEmail,
        a.childName,
        "Returned",
        a.loanStartDate?.toDate ? a.loanStartDate.toDate().toLocaleDateString() : "N/A",
        a.archivedAt?.toDate ? a.archivedAt.toDate().toLocaleDateString() : "N/A",
        a.note || "",
      ]),
      "archive.csv"
    );

  /* ------------------- SUMMARY COUNTS (FIXED) ------------------- */
  const totalInventory = items.reduce((sum, i) => sum + (i.totalQuantity ?? 0), 0);
  // Copies that are actually available for borrowing NOW:
  const totalAvailable = items.reduce((sum, i) => {
    const status = String(i.status || "");
    if (status === "Not Available") return sum;        // locked out
    const qty = Number(i.quantity ?? 0);
    return sum + (qty > 0 ? qty : 0);                  // count real available copies
  }, 0);

  const itemsOnLoan = reservations.filter((r) =>
    ["On Loan", "Due"].includes(r.status)
  ).length;

  const pending = reservations.filter((r) => r.status === "Pending").length;
  const ready = reservations.filter((r) => r.status === "Ready for Pickup").length;
  const loanInProcess = reservations.filter((r) =>
    ["Pending", "Ready for Pickup", "Review Return"].includes(r.status)
  ).length;
  const waitlistCount = wishlist.length;
  const dueCount = reservations.filter((r) => r.status === "Due").length;

  /* ------------------- LOGOUT ------------------- */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.href = "/admin-login";
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  /* ======================= RENDER ======================= */
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-10">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-bethDeepBlue">Admin Dashboard</h2>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          Logout
        </button>
      </div>

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
          value={itemsOnLoan}
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
          label="Loan in Process"
          value={loanInProcess}
          border="border-slate-700"
        />
        <SectionCard
          label="Waitlist Requests"
          value={waitlistCount}
          border="border-purple-500"
        />
        <SectionCard
          label="Due for Return"
          value={dueCount}
          border="border-red-800"
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
            <h3 className="text-2xl font-bold text-bethDeepBlue">Existing Toys</h3>
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
          <div className="grid grid-cols-1 sm:flex-row sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <h3 className="text-2xl font-bold text-bethDeepBlue">Reservations</h3>
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
                  <th className="p-2 border">Bag No</th>
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
                      onMoveToWaitlist={moveReservationToWaitlist}
                      onMoveToArchive={moveReservationToArchive}
                      onDelete={handleDeleteReservation}
                      onUpdateBagNo={handleUpdateBagNo}
                      onConfirmBagChange={confirmBagNoChange}
                      onExtendLoan={handleExtendLoan}
                    />
                  ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentReservationPage}
            totalPages={Math.ceil(filteredReservations.length / reservationsPerPage)}
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
                      onConvert={() => openConfirm("convertWishlist", entry)}
                      onDelete={() => openConfirm("deleteWishlist", entry)}
                    />
                  ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentWishlistPage}
            totalPages={Math.ceil(filteredWishlist.length / wishlistPerPage)}
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
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Pickup Date</th>
                  <th className="p-2 border">Returned Date</th>
                  <th className="p-2 border">Note</th>
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
                      onRestore={() => openConfirm("restoreArchive", entry)}
                      onDelete={() => openConfirm("deleteArchive", entry)}
                      onSaveNote={handleSaveArchiveNote}
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

      {/* CONFIRM MODAL */}
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
            : confirmModal.mode === "moveResToWaitlist"
            ? "Move Reservation to Waitlist"
            : confirmModal.mode === "moveResToArchive"
            ? "Archive Reservation"
            : confirmModal.mode === "deleteReservation"
            ? "Delete Reservation"
            : confirmModal.mode === "confirmBagChange"
            ? "Confirm Bag Number Change"
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
            : confirmModal.mode === "moveResToWaitlist"
            ? "Move this reservation to the waitlist?"
            : confirmModal.mode === "moveResToArchive"
            ? "Move this reservation to the archive?"
            : confirmModal.mode === "deleteReservation"
            ? "Delete this reservation? It will be moved to Archive."
            : confirmModal.mode === "confirmBagChange"
            ? `Are you sure you want to change the bag number to "${
                confirmModal.payload?.newBagNo || ""
              }"?`
            : ""
        }
        confirmLabel={
          confirmModal.mode === "deleteWishlist" ||
          confirmModal.mode === "deleteArchive" ||
          confirmModal.mode === "deleteReservation"
            ? "Delete"
            : "Confirm"
        }
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />
    </div>
  );
}
