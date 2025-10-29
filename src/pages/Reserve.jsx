// 4. Reserve.jsx
import { useLocation } from 'react-router-dom';
import { useState } from 'react';


export default function Reserve() {
  const location = useLocation();
  const item = location.state?.item || {};


  const [formData, setFormData] = useState({ name: '', email: '', message: '', itemName: item.name || '' });


  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });


  const handleSubmit = e => {
    e.preventDefault();
    alert(`Reservation submitted for ${formData.itemName}!`);
    setFormData({ name: '', email: '', message: '', itemName: formData.itemName });
    };


  return (
    <div className="max-w-md mx-auto bg-bethLightGray shadow p-6 rounded">
      <h2 className="text-2xl font-bold mb-4 text-bethDeepBlue">Reserve Item</h2>
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Your Name" required className="border p-2 rounded" />
        <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Your Email" required className="border p-2 rounded" />
        <input name="itemName" value={formData.itemName} readOnly className="border p-2 rounded bg-gray-100" />
        <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Optional message" className="border p-2 rounded" />
        <button type="submit" className="bg-bethDeepBlue text-white py-2 rounded hover:bg-bethLightBlue">Submit Reservation</button>
      </form>
    </div>
  );
}