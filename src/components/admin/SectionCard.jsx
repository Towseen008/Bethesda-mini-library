// src/components/admin/SectionCard.jsx

export default function SectionCard({ label, value, border }) {
  return (
    <div className={`bg-white shadow p-4 rounded border-l-4 ${border}`}>
      <h4 className="text-sm text-gray-600">{label}</h4>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
