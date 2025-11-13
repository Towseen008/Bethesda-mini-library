// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function Home() {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [category, setCategory] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [availability, setAvailability] = useState("");

  const itemsPerPage = 9;
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch from Firestore
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

  // Apply Filters
  useEffect(() => {
    let updatedItems = [...items];

    if (category) {
      updatedItems = updatedItems.filter(
        (item) => item.category === category
      );
    }
    if (ageGroup) {
      updatedItems = updatedItems.filter(
        (item) => item.ageGroup === ageGroup
      );
    }
    if (availability) {
      updatedItems = updatedItems.filter(
        (item) => item.status === availability
      );
    }

    setFilteredItems(updatedItems);
    setCurrentPage(1);
  }, [category, ageGroup, availability, items]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading)
    return <div className="text-center py-10">Loading toys...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Lending Library Banner */}
      <div className="bg-bethLightGray text-bethDeepBlue text-center p-8 md:p-10 rounded-lg shadow-lg animate-none md:animate-slideUp mb-6">
        <h2 className="text-4xl font-bold mb-3 animate-fadeIn">Welcome to Bethesda Lending Library</h2>
        <p className="max-w-2xl mx-auto text-base leading-relaxed animate-fadeIn">
            Discover an engaging collection of educational toys, books, and games designed to support developmental growth and learning. Parents can browse available items, reserve them, and get notified when their requested resources are ready for pickup.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-bethDeepBlue border-b pb-2">
        Available Toys
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-2 border rounded w-full"
        >
          <option value="">All Categories</option>
          <option value="Fine Motor">Fine Motor</option>
          <option value="Sensory Play">Sensory Play</option>
          <option value="Pretend Play">Pretend Play</option>
          <option value="Gross Motor">Gross Motor</option>
          <option value="Music">Music</option>
          <option value="STEM">STEM</option>
          <option value="Games">Games</option>
          <option value="Numbers">Numbers</option>
          <option value="Letters">Letters</option>
          <option value="Others">Others</option>
        </select>

        <select
          value={ageGroup}
          onChange={(e) => setAgeGroup(e.target.value)}
          className="p-2 border rounded w-full"
        >
          <option value="">All Age Groups</option>
          <option value="2-5">2-5 years</option>
          <option value="2-10">2-10 years</option>
          <option value="6-10">6–10 years</option>
          <option value="9+">9+ years</option>
        </select>

        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="p-2 border rounded w-full"
        >
          <option value="">All Status</option>
          <option value="Available">Available</option>
          <option value="Pending">Pending</option>
          <option value="On Loan">On Loan</option>
        </select>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <p className="text-center text-gray-500">No toys match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item) => (
            <Link
              to={`/item/${item.id}`}
              key={item.id}
              className="bg-white border shadow-md rounded overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition duration-300"
            >
              <img
                src={item.image}
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

                {/* Status Badge */}
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === "Available"
                      ? "bg-green-100 text-green-800"
                      : item.status === "Pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-6">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-1 bg-bethDeepBlue text-white rounded disabled:opacity-50"
        >
          Prev
        </button>

        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index}
            onClick={() => handlePageChange(index + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === index + 1
                ? "bg-bethLightBlue text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {index + 1}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-1 bg-bethDeepBlue text-white rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
