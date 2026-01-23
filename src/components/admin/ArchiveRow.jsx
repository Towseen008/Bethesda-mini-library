// src/components/admin/ArchiveRow.jsx
import { useEffect, useState } from "react";

export default function ArchiveRow({
  entry,
  onRestore,
  onDelete,
  onSaveNote,
}) {
  if (!entry) return null;

  const returnedDate = entry.archivedAt?.toDate
    ? entry.archivedAt.toDate().toLocaleDateString()
    : "N/A";

  const pickupDate = entry.loanStartDate?.toDate
    ? entry.loanStartDate.toDate().toLocaleDateString()
    : "N/A";

  const [note, setNote] = useState(entry.note || "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // keep note synced if row changes
  useEffect(() => {
    setNote(entry.note || "");
    setIsEditing(false);
  }, [entry?.id, entry?.note]);

  const handleSave = async () => {
    if (!onSaveNote) return;
    setSaving(true);
    setStatusMsg("");

    try {
      await onSaveNote(entry.id, note);
      setIsEditing(false);
      setStatusMsg("Saved ✓");
      setTimeout(() => setStatusMsg(""), 1500);
    } catch (err) {
      console.error(err);
      setStatusMsg("Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr>
      <td className="p-2 border">{entry.itemName}</td>
      <td className="p-2 border">{entry.parentName}</td>
      <td className="p-2 border">{entry.parentEmail}</td>
      <td className="p-2 border">{entry.childName}</td>
      <td className="p-2 border">Returned</td>

      {/* Pickup Date */}
      <td className="p-2 border">{pickupDate}</td>

      {/* Returned Date */}
      <td className="p-2 border">{returnedDate}</td>

      {/* NOTE COLUMN */}
      <td className="p-2 border min-w-[260px]">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={!isEditing}
          rows={2}
          className={`w-full text-xs p-2 rounded border resize-y
            ${
              isEditing
                ? "bg-white text-black border-blue-400"
                : "bg-gray-100 text-gray-700 cursor-not-allowed"
            }`}
          placeholder="Return notes (missing parts, damage, follow-up...)"
        />

        <div className="flex items-center gap-2 mt-1">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-2 py-1 text-xs rounded bg-gray-600 text-white hover:bg-gray-700"
            >
              Edit
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => {
                  setNote(entry.note || "");
                  setIsEditing(false);
                }}
                className="px-2 py-1 text-xs rounded bg-gray-300 text-black hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          )}

          {statusMsg && (
            <span
              className={`text-[11px] ${
                statusMsg.includes("failed") ? "text-red-600" : "text-green-600"
              }`}
            >{statusMsg}
            </span>
          )}
        </div>
      </td>

      {/* ACTIONS */}
      <td className="p-2 border">
        <div className="flex gap-2">
          <button
            onClick={onRestore}
            className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
          >
            Restore
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
