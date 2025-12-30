// src/components/admin/ReservationRow.jsx

import { useState, useEffect } from "react";
import { badgeColor } from "./helpers";
import { RESERVATION_STATUS_OPTIONS } from "./constants";

export default function ReservationRow({
  res,
  onStatus,
  onMoveToWaitlist,
  onMoveToArchive,
  onDelete,
  onUpdateBagNo,        // saves after confirmation
  onConfirmBagChange,   // opens ConfirmModal
}) {
  const status = res.status || "Pending";


  const actionsDisabled = status === "On Loan";

  const preferred = res.preferredDay
    ? new Date(res.preferredDay).toLocaleDateString()
    : "—";

  /* ---------------- BAG NO EDIT STATE ---------------- */
  const [editingBag, setEditingBag] = useState(false);
  const [bagDraft, setBagDraft] = useState(res.bagNo || "");

  // Keep local state in sync if Firestore updates
  useEffect(() => {
    setBagDraft(res.bagNo || "");
  }, [res.bagNo]);

  return (
    <tr className="hover:bg-gray-50">
      {/* ITEM */}
      <td className="p-2 border whitespace-nowrap">
        {res.itemName}
      </td>

      {/* PARENT NAME */}
      <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {res.parentName}
      </td>

      {/* PARENT EMAIL */}
      <td className="p-2 border whitespace-nowrap">
        {res.parentEmail}
      </td>

      {/* CHILD NAME */}
      <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {res.childName}
      </td>

      {/* PREFERRED DAY */}
      <td className="p-2 border whitespace-nowrap">
        {preferred}
      </td>

      {/* 👜 BAG NO (EDIT → CONFIRM → SAVE) */}
      <td className="p-2 border whitespace-nowrap">
        {!editingBag ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">
              {res.bagNo || "—"}
            </span>

            {/* ✅ Edit is ALWAYS visible */}
            <button
              onClick={() => setEditingBag(true)}
              className="text-xs text-blue-600 underline"
            >
              Edit
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={bagDraft}
              onChange={(e) => setBagDraft(e.target.value)}
              className="border p-1 text-xs rounded w-20"
              autoFocus
            />

            <button
              onClick={() => {
                const trimmed = bagDraft.trim();

                // Only confirm if value actually changed
                if (trimmed !== (res.bagNo || "")) {
                  onConfirmBagChange(res, trimmed, () => {
                    onUpdateBagNo(res, trimmed);
                  });
                }

                setEditingBag(false);
              }}
              className="text-xs bg-green-600 text-white px-2 py-1 rounded"
            >
              Save
            </button>

            <button
              onClick={() => {
                setBagDraft(res.bagNo || "");
                setEditingBag(false);
              }}
              className="text-xs px-2 py-1 border rounded"
            >
              Cancel
            </button>
          </div>
        )}
      </td>

      {/* STATUS BADGE */}
      <td className="p-2 border whitespace-nowrap">
        <span
          className={`px-2 py-1 text-xs rounded-full ${badgeColor(status)}`}
        >
          {status}
        </span>
      </td>

      {/* ACTIONS */}
      <td className="p-2 border flex gap-2 items-center">
        {/* STATUS DROPDOWN */}
        <select
          value={status}
          onChange={(e) => onStatus(res, e.target.value)}
          className="border p-1 text-xs rounded"
        >
          {RESERVATION_STATUS_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        {/* ACTIONS DROPDOWN (still disabled when On Loan) */}
        <select
          defaultValue=""
          disabled={actionsDisabled}
          onChange={(e) => {
            const action = e.target.value;
            e.target.value = "";

            if (action === "waitlist") onMoveToWaitlist(res);
            if (action === "archive") onMoveToArchive(res, "Archived");
            if (action === "delete") onDelete(res);
          }}
          className={`border p-1 text-xs rounded bg-white ${
            actionsDisabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <option value="" disabled>
            {actionsDisabled ? "On Loan" : "Actions"}
          </option>
          <option value="waitlist">Move to Waitlist</option>
          <option value="archive">Move to Archive</option>
          <option value="delete">Delete (Archive)</option>
        </select>
      </td>
    </tr>
  );
}
