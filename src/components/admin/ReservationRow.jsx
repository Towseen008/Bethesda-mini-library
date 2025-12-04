// src/components/admin/ReservationRow.jsx

import { badgeColor } from "./helpers";
import { RESERVATION_STATUS_OPTIONS } from "./constants";

export default function ReservationRow({ res, onStatus, onDelete }) {
  const status = res.status || "Pending"; // Safe fallback

  // Format preferredDay safely
  const preferred = res.preferredDay
    ? new Date(res.preferredDay).toLocaleDateString()
    : "—";

  return (
    <tr className="hover:bg-gray-50">
      <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {res.itemName}
      </td>

      <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {res.parentName}
      </td>

      <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {res.parentEmail}
      </td>

      <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {res.childName}
      </td>

      <td className="p-2 border truncate whitespace-nowrap max-w-[140px]">
        {preferred}
      </td>

      <td className="p-2 border">
        <span
          className={`px-2 py-1 text-xs rounded-full ${badgeColor(status)}`}
        >
          {status}
        </span>
      </td>

      <td className="p-2 border flex gap-1">
        <select
          value={status}
          onChange={(e) => onStatus(res, e.target.value)}
          className="border p-1 text-xs rounded"
        >
          {RESERVATION_STATUS_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <button
          onClick={() => onDelete(res.id)}
          className="bg-red-600 text-white px-2 py-1 rounded text-xs"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
