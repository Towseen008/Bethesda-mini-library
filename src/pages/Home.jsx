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
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  /* ---------- Fetch items ---------- */
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

  /* ---------- Filtering & Search ---------- */
  useEffect(() => {
    let updated = [...items];

    // Treat Pending as Available for parents (display logic only)
    updated = updated.map((i) => ({
      ...i,
      status: i.status === "Pending" ? "Available" : i.status,
    }));

    // Text search
    if (searchTerm.trim()) {
      updated = updated.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const [filterType, filterValue] = filterOption.split(":");

    // Category filter
    if (filterType === "category") {
      updated = updated.filter((i) => i.category === filterValue);
    }

    // Age filter
    if (filterType === "age") {
      if (filterValue !== "All Age") {
        updated = updated.filter((i) => {
          const age = i.ageGroup || "";
          return age.toLowerCase().includes(filterValue.toLowerCase());
        });
      }
      // If "All Age", we do NOT filter by age (show all ages)
    }

    // Status filter
    if (filterType === "status") {
      if (filterValue === "Available") {
        // Available includes Pending (already mapped above)
        updated = updated.filter((i) => i.status === "Available");
      } else {
        // On Loan filter is normal
        updated = updated.filter((i) => i.status === filterValue);
      }
    }

    // Sorting
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

  /* ---------- Pagination ---------- */
  const totalCatalog = items.length;
  const totalFiltered = filteredItems.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const showingCount = currentItems.length;

  const handlePageChange = (page) => {
    setCurrentPage(page);

    const element = document.getElementById("available-toys");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  /* ---------- Helpers for filter chips ---------- */
  const activeChips = [];

  if (searchTerm.trim()) {
    activeChips.push({
      type: "search",
      label: `Search: "${searchTerm}"`,
    });
  }

  if (filterOption !== "all") {
    const [filterType, filterValue] = filterOption.split(":");
    let label = "";

    if (filterType === "age") label = `Age: ${filterValue}`;
    if (filterType === "status") label = `Status: ${filterValue}`;
    if (filterType === "category") label = `Category: ${filterValue}`;
    if (filterType === "sort") {
      if (filterValue === "newest") label = "Sort: Newest";
      else if (filterValue === "az") label = "Sort: A → Z";
      else if (filterValue === "za") label = "Sort: Z → A";
    }

    if (label) {
      activeChips.push({
        type: "filter",
        label,
      });
    }
  }

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterOption("all");
  };

  /* ---------- Loading Skeleton ---------- */
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
      {/* HERO SECTION */}
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

      {/* SECTION TITLE */}
      <h2
        id="available-toys"
        className="text-2xl font-bold mb-2 text-bethDeepBlue border-b pb-2 scroll-mt-24"
      >
        Available Toys
      </h2>

      {/* SUMMARY & VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <p className="text-sm text-gray-700">
          Showing{" "}
          <span className="font-semibold">
            {showingCount} of {totalFiltered}
          </span>{" "}
          items{" "}
          <span className="text-gray-500">
            (Total catalog: <span className="font-semibold">{totalCatalog}</span>)
          </span>
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">View:</span>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1 text-xs rounded border ${
              viewMode === "grid"
                ? "bg-bethDeepBlue text-white border-bethDeepBlue"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            ⬛ Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 text-xs rounded border ${
              viewMode === "list"
                ? "bg-bethDeepBlue text-white border-bethDeepBlue"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            ☰ List
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4 flex-wrap justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <input
            type="text"
            placeholder="Search toys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border rounded w-full sm:w-1/3"
          />

          <select
            value={filterOption}
            onChange={(e) => setFilterOption(e.target.value)}
            className="p-2 border rounded w-full sm:w-1/3"
          >
            <option value="all">Filter Toys</option>

            <optgroup label="Age Groups">
              <option value="age:All Age">All Age</option>
              <option value="age:2 to 5">2–5 years</option>
              <option value="age:2 to 10">2–10 years</option>
              <option value="age:6 to 10">6–10 years</option>
              <option value="age:9+">9+ years</option>
            </optgroup>

            <optgroup label="Availability">
              <option value="status:Available">Available</option>
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

        {/* Clear filters button */}
        {(searchTerm.trim() || filterOption !== "all") && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs px-3 py-1 border border-gray-300 rounded self-start sm:self-center hover:bg-gray-100"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* FILTER CHIPS */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {activeChips.map((chip, index) => (
            <button
              key={chip.type}
              type="button"
              onClick={() => {
                if (chip.type === "search") setSearchTerm("");
                if (chip.type === "filter") setFilterOption("all");
              }}
              className="flex items-center gap-2 bg-bethLightGray text-xs text-bethDeepBlue px-3 py-1 rounded-full shadow-sm hover:bg-gray-200 opacity-0 animate-cardPop"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span>{chip.label}</span>
              <span className="text-xs font-bold">✕</span>
            </button>
          ))}
        </div>
      )}

      {/* ITEMS GRID / LIST */}
      {filteredItems.length === 0 ? (
        <p className="text-center text-gray-500">No toys match your filters.</p>
      ) : viewMode === "grid" ? (
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
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        // LIST VIEW
        <div className="space-y-3">
          {currentItems.map((item, index) => (
            <Link
              to={`/item/${item.id}`}
              key={item.id}
              className="flex gap-4 bg-white border shadow-sm rounded overflow-hidden hover:shadow-md transition transform hover:-translate-y-0.5 opacity-0 animate-cardPop"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="w-32 h-32 flex-shrink-0 bg-gray-100 overflow-hidden">
                <img
                  src={item.images?.[0] || item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 p-3 flex flex-col justify-center">
                <h3 className="text-base font-semibold text-bethDeepBlue mb-1 line-clamp-1">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-600 mb-1">
                  Age Group: {item.ageGroup || "N/A"}
                </p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-[11px] font-semibold ${
                    item.status === "Available"
                      ? "bg-green-200 text-green-800"
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
