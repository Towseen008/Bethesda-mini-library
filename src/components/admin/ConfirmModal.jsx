// src/components/admin/ConfirmModal.jsx

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-5 space-y-4">
        <h3 className="text-lg font-semibold text-bethDeepBlue">{title}</h3>
        {message && (
          <p className="text-sm text-gray-700 whitespace-pre-line">{message}</p>
        )}

        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded border text-sm"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1 rounded bg-red-600 text-white text-sm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
