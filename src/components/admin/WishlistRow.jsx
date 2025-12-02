// src/components/admin/WishlistRow.jsx

export default function WishlistRow({ res, onConvert, onDelete }) {
  if (!res) return null;

  // Safely format createdAt
  const requestDate =
    res.createdAt?.toDate?.() instanceof Date
      ? res.createdAt.toDate().toLocaleDateString()
      : "N/A";

  return (
    <tr className="hover:bg-gray-50">
      {/* Item */}
      <td className="p-2 border truncate whitespace-nowrap max-w-[160px]">
        {res.itemName}
      </td>

      {/* Parent */}
      <td className="p-2 border truncate whitespace-nowrap max-w-[160px]">
        {res.parentName}
      </td>

      {/* Email */}
      <td className="p-2 border truncate whitespace-nowrap max-w-[180px]">
        {res.parentEmail}
      </td>

      {/* Child */}
      <td className="p-2 border truncate whitespace-nowrap max-w-[160px]">
        {res.childName}
      </td>

      {/* Request Date */}
      <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {requestDate}
      </td>

      {/* Actions */}
      <td className="p-2 border">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onConvert(res)}
            className="bg-bethDeepBlue text-white px-2 py-1 rounded text-xs hover:bg-bethLightBlue"
          >
            Convert to Reservation
          </button>

          <button
            type="button"
            onClick={() => onDelete(res.id)}
            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
