// src/components/admin/ToyForm.jsx

import ImagePreviewList from "./ImagePreviewList";
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
    <form onSubmit={onSubmit} className="bg-white shadow p-4 rounded space-y-3">
      <h3 className="font-bold text-lg text-bethDeepBlue">{title}</h3>

      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={onChange}
        placeholder="Toy Name"
        className="w-full border p-2 rounded"
        required
      />

      {/* Images */}
      <div>
        <label className="font-semibold">Upload Images</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onUpload}
          className="w-full border p-2 rounded"
        />

        {uploading && <p className="text-sm text-blue-500">Uploading...</p>}

        <ImagePreviewList images={formData.images} onRemove={onRemoveImage} />
      </div>

      <textarea
        name="description"
        value={formData.description}
        onChange={onChange}
        placeholder="Description"
        className="w-full border p-2 rounded"
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <select
          name="category"
          value={formData.category}
          onChange={onChange}
          className="p-2 border rounded"
        >
          <option value="">Select Category</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>

        <select
          name="ageGroup"
          value={formData.ageGroup}
          onChange={onChange}
          className="p-2 border rounded"
        >
          <option value="">Select Age Group</option>
          {AGE_GROUP_OPTIONS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>

        <select
          name="status"
          value={formData.status}
          onChange={onChange}
          className="p-2 border rounded"
        >
          {ITEM_STATUS_OPTIONS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        <div className="flex flex-col gap-2">
          <input
            type="number"
            name="quantity"
            min="0"
            value={formData.quantity}
            onChange={onChange}
            className="p-2 border rounded"
            placeholder="Available"
          />

          <input
            type="number"
            name="totalQuantity"
            min="0"
            value={formData.totalQuantity}
            onChange={onChange}
            className="p-2 border rounded"
            placeholder="Total Inventory"
          />
        </div>
      </div>

      <button className="bg-bethDeepBlue text-white px-4 py-2 rounded">
        Save
      </button>
    </form>
  );
}
