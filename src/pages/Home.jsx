// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import heroImage from "../assets/Bethesda_NiagaraBuilding.jpg";

import SkeletonCard from "../components/SkeletonCard";
import Pagination from "../components/Pagination";

export default function Home() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterOption, setFilterOption] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const itemsPerPage = 9;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "items"));
        const itemsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setItems(itemsData);
        setFilteredItems(itemsData);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Filtering + Sorting
  useEffect(() => {
    let updated = [...items];

    if (searchTerm) {
      updated = updated.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const [filterType, filterValue] = filterOption.split(":");

    if (filterType === "category") {
      updated = updated.filter((i) => i.category === filterValue);
    }

    if (filterType === "age") {
      updated = updated.filter((i) => i.ageGroup === filterValue);
    }

    if (filterType === "status") {
      updated = updated.filter((i) => i.status === filterValue);
    }

    if (filterType === "sort") {
      if (filterValue === "newest") {
        updated.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
      } else if (filterValue === "az") {
        updated.sort((a, b) => a.name.localeCompare(b.name));
      } else if (filterValue === "za") {
        updated.sort((a, b) => b.name.localeCompare(a.name));
      }
    }

    setFilteredItems(updated);
    setCurrentPage(1);
  }, [filterOption, searchTerm, items]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Loading Skeletons
  if (loading)
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">

      {/* HERO SECTION WITH PARALLAX */}
      <div
        className="relative w-full h-[60vh] sm:h-[70vh] lg:h-[80vh] parallax-bg flex items-center justify-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-3xl">

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 opacity-0 animate-heroFloat delay-[150ms] leading-tight">
            Welcome To The Toy Lending Library
          </h2>

          <p className="text-sm sm:text-lg lg:text-xl text-gray-200 mb-6 opacity-0 animate-heroFloat delay-[350ms] leading-relaxed">
            Discover an engaging collection of educational toys designed to
            support developmental growth and learning. Browse available items,
            reserve them, and get notified when your resources are ready for
            pickup.
          </p>

          <a
            href="#available-toys"
            className="bg-bethDeepBlue hover:bg-bethLightBlue text-white font-semibold px-8 py-3 rounded-lg shadow-lg opacity-0 animate-heroFloat delay-[550ms]"
          >
            Browse Available Toys
          </a>
        </div>
      </div>

      {/* Section Title */}
      <h2
        id="available-toys"
        className="text-2xl font-bold mb-4 text-bethDeepBlue border-b pb-2"
      >
        Available Toys
      </h2>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4 flex-wrap">
        <input
          type="text"
          placeholder="Search toys..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="p-2 border rounded w-full sm:w-1/4"
        />

        <select
          value={filterOption}
          onChange={(e) => setFilterOption(e.target.value)}
          className="p-2 border rounded w-full sm:w-1/4"
        >
          <option value="all">Filter Toys</option>

          <optgroup label="Age Groups">
                <option value="All Age">All Age</option>
                <option value="2 to 5">2-5 years</option>
                <option value="2 to 10">2-10 years</option>
                <option value="6 to 10">6–10 years</option>
                <option value="9+">9+ years</option>
          </optgroup>

          <optgroup label="Availability">
            <option value="status:Available">Available</option>
            <option value="status:Pending">Pending</option>
            <option value="status:On Loan">On Loan</option>
          </optgroup>

          <optgroup label="Categories">
            <option value="category:Fine Motor">Fine Motor</option>
            <option value="category:Sensory Play">Sensory Play</option>
            <option value="category:Pretend Play">Pretend Play</option>
            <option value="category:Gross Motor">Gross Motor</option>
            <option value="category:Music">Music</option>
            <option value="category:STEM">STEM</option>
            <option value="category:Games">Games</option>
            <option value="category:Numbers">Numbers</option>
            <option value="category:Letters">Letters</option>
            <option value="category:Others">Others</option>
          </optgroup>

          <optgroup label="Sort By">
            <option value="sort:newest">Newest</option>
            <option value="sort:az">A → Z</option>
            <option value="sort:za">Z → A</option>
          </optgroup>
        </select>
      </div>

      {/* ITEMS GRID WITH ANIMATIONS */}
      {filteredItems.length === 0 ? (
        <p className="text-center text-gray-500">No toys match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item, index) => (
            <Link
              to={`/item/${item.id}`}
              key={item.id}
              className="bg-white border shadow-md rounded overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition duration-300 opacity-0 animate-cardPop"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <img
                src={item.images?.[0] || item.image}
                alt={item.name}
                className="w-full h-64 object-cover"
              />

              <div className="p-4">
                <h3 className="text-lg font-semibold text-bethDeepBlue mb-2">
                  {item.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Age Group: {item.ageGroup || "N/A"}
                </p>

                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === "Available"
                      ? "bg-green-200 text-green-800"
                      : item.status === "Pending"
                      ? "bg-yellow-200 text-yellow-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
