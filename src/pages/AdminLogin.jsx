// src/pages/AdminLogin.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import bethesdaLogo from "../assets/BethesdaLogo.png";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      navigate("/admin");
    } catch (err) {
      console.error("Login error:", err);
      setErrorMsg("Invalid email or password.");
    }

    setLoading(false);
  };

  return (
    <div className="admin-login-page min-h-screen flex items-center justify-center relative px-4">

      <div className="relative bg-white/90 backdrop-blur-md shadow-2xl rounded-xl p-8 w-full max-w-md animate-fadeIn border border-bethDeepBlue/20">

        {/* Logo */}
        <div className="flex justify-center mb-2">
          <img
            src={bethesdaLogo}
            alt="Bethesda Logo"
            className="w-24 h-24 object-contain drop-shadow-lg"
          />
        </div>

        <h2 className="text-3xl font-extrabold text-center text-bethDeepBlue mb-2">
          Admin Portal
        </h2>
        <p className="text-center text-gray-600 mb-6 text-sm">
          Staff Access Only
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1 text-bethDeepBlue">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-bethLightBlue"
              placeholder="admin@bethesda.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-bethDeepBlue">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full border p-2 rounded focus:ring-2 focus:ring-bethLightBlue"
              placeholder="Enter password"
            />
          </div>

          {errorMsg && (
            <p className="text-red-600 text-sm text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded text-white font-semibold transition ${
              loading
                ? "bg-gray-400"
                : "bg-bethDeepBlue hover:bg-bethLightBlue shadow-md hover:shadow-lg"
            }`}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-4">
          © Bethesda Niagara – Authorized Use Only
        </p>
      </div>
    </div>
  );
}
