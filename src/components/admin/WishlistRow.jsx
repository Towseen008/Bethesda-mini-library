// src/components/admin/WishlistRow.jsx

export default function WishlistRow({ res, onConvert, onDelete }) {
  if (!res) return null;

  const requestDate = res.createdAt?.toDate
    ? res.createdAt.toDate().toLocaleDateString()
    : "N/A";

  return (
    <tr>
      {/* Item */}
      <td className="p-2 border">{res.itemName}</td>

      {/* Parent */}
      <td className="p-2 border">{res.parentName}</td>

      {/* Email */}
      <td className="p-2 border">{res.parentEmail}</td>

      {/* Child */}
      <td className="p-2 border">{res.childName}</td>

      {/* Request Date */}
      <td className="p-2 border">{requestDate}</td>

      {/* Actions */}
      <td className="p-2 border">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onConvert}
            className="px-2 py-1 text-xs rounded bg-bethDeepBlue text-white hover:bg-bethLightBlue"
          >
            Convert to Reservation
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
