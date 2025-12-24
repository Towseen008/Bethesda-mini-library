// src/components/admin/ToyCard.jsx

import { badgeColor } from "./helpers";

export default function ToyCard({ item, onEdit, onDelete }) {
  return (
    <div className="bg-white border shadow rounded p-4 space-y-2">
      <img
        src={item.images?.[0]}
        className="w-full h-48 object-cover rounded"
      />

      <h3 className="font-semibold text-bethDeepBlue truncate">{item.name}</h3>
      <p className="text-sm">Category: {item.category}</p>
      <p className="text-sm">Age: {item.ageGroup}</p>
      <p className="text-sm">Qty Available: {item.quantity}</p>
      <p className="text-sm">
        Total Inventory: {item.totalQuantity}
      </p>

      <span
        className={`px-2 py-1 text-xs rounded-full font-semibold ${badgeColor(
          item.status
        )}`}
      >
        {item.status}
      </span>

      <div className="flex justify-between mt-2">
        <button onClick={() => onEdit(item)} className="text-blue-600">
          Edit
        </button>
        <button onClick={() => onDelete(item.id)} className="text-red-600">
          Delete
        </button>
      </div>
    </div>
  );
}
