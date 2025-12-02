// src/components/admin/ArchiveRow.jsx

export default function ArchiveRow({ entry, onRestore, onDelete }) {
  if (!entry) return null;

  const returnedDate = entry.archivedAt?.toDate
    ? entry.archivedAt.toDate().toLocaleDateString()
    : "N/A";

  return (
    <tr>
      {/* Item */}
      <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {entry.itemName}
        </td>
        <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {entry.parentName}
        </td>
        <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {entry.parentEmail}
        </td>
        <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {entry.childName}
        </td>
        <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        Returned
        </td>
        <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {entry.archivedAt?.toDate?.().toLocaleDateString() ?? "N/A"}
        </td>


      {/* Actions */}
      <td className="p-2 border">
        <div className="flex flex-wrap gap-2">
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
