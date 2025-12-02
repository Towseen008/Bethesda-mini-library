// src/components/admin/ToyForm.jsx

import {
  CATEGORY_OPTIONS,
  AGE_GROUP_OPTIONS,
  ITEM_STATUS_OPTIONS,
} from "./constants";

export default function ToyForm({
  formData,
  title,
  onChange,
  onUpload,
  onSubmit,
  uploading,
  onRemoveImage,
}) {
  return (
    <form onSubmit={onSubmit} className="bg-white shadow p-6 rounded-lg space-y-6">

      {/* TITLE */}
      <h3 className="text-2xl font-bold text-bethDeepBlue border-b pb-2">
        {title}
      </h3>

      {/* NAME + CATEGORY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Toy Name */}
        <div>
          <label className="font-semibold text-sm">Toy Name</label>
          <input
            name="name"
            required
            value={formData.name}
            onChange={onChange}
            className="border p-2 rounded w-full"
            placeholder="Enter toy name"
          />
        </div>

        {/* Category */}
        <div>
          <label className="font-semibold text-sm">Category</label>
          <select
            name="category"
            required
            value={formData.category}
            onChange={onChange}
            className="border p-2 rounded w-full"
          >
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* AGE GROUP */}
      <div>
        <label className="font-semibold text-sm">Age Group</label>
        <select
          name="ageGroup"
          value={formData.ageGroup}
          onChange={onChange}
          className="border p-2 rounded w-full"
        >
          <option value="">Select age group</option>
          {AGE_GROUP_OPTIONS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* DESCRIPTION */}
      <div>
        <label className="font-semibold text-sm">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={onChange}
          placeholder="Describe the toy..."
          className="border p-2 rounded w-full h-24"
        />
      </div>

      {/* INVENTORY FIELDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Status */}
        <div>
          <label className="font-semibold text-sm">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={onChange}
            className="border p-2 rounded w-full"
          >
            {ITEM_STATUS_OPTIONS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Available Quantity */}
        <div>
          <label className="font-semibold text-sm">Available</label>
          <input
            type="number"
            min="0"
            name="quantity"
            value={formData.quantity}
            onChange={onChange}
            className="border p-2 rounded w-full"
            placeholder="Available copies"
          />
        </div>

        {/* Total Quantity */}
        <div>
          <label className="font-semibold text-sm">Total Inventory</label>
          <input
            type="number"
            min="1"
            name="totalQuantity"
            value={formData.totalQuantity}
            onChange={onChange}
            className="border p-2 rounded w-full"
            placeholder="Total copies"
          />
          <p className="text-xs text-gray-500 mt-1">
            Available must be ≤ total.
          </p>
        </div>
      </div>

      {/* IMAGE UPLOAD */}
      <div>
        <label className="font-semibold text-sm">Toy Images</label>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onUpload}
          className="border p-2 rounded w-full"
        />

        {uploading && (
          <p className="text-sm text-yellow-600 mt-1">Uploading...</p>
        )}

        {/* Image Previews */}
        {formData.images?.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
            {formData.images.map((img, index) => (
              <div key={index} className="relative">
                <img
                  src={img}
                  alt="Toy"
                  className="w-full h-24 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => onRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs px-1 py-[2px] rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        className="w-full py-3 bg-bethDeepBlue hover:bg-bethLightBlue text-white font-semibold rounded"
      >
        Save Toy
      </button>
    </form>
  );
}
