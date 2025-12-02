// src/components/admin/ImagePreviewList.jsx

export default function ImagePreviewList({ images, onRemove }) {
  return (
    <div className="flex gap-2 flex-wrap mt-2">
      {images.map((img, i) => (
        <div key={i} className="relative w-20 h-20">
          <img src={img} className="w-full h-full object-cover rounded border" />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
          >
            ❌
          </button>
        </div>
      ))}
    </div>
  );
}
