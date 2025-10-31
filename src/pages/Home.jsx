// Home.jsx (with pagination)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import items from '../data/data';

export default function Home() {
    const itemsPerPage = 9;
    const [currentPage, setCurrentPage] = useState(1);


    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = items.slice(startIndex, startIndex + itemsPerPage);


    const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="max-w-6xl m-auto py-6 px-4 space-y-6">
            {/* <div className="text-center bg-bethLightGray p-6 rounded-lg shadow animate-fadeIn">
        <p className="text-lg text-bethDeepBlue font-medium leading-relaxed max-w-3xl mx-auto">
          Bethesda inspires, encourages and empowers children, youth, and adults with intellectual and/or developmental disabilities, and their families, to live their best lives.
        </p>
      </div> */}

            {/* Animated Lending Library Banner */}
            <div className="bg-bethLightGray text-bethDeepBlue text-center p-8 md:p-10 rounded-lg shadow-lg animate-none md:animate-slideUp mb-6">
                <h2 className="text-4xl font-bold mb-3 animate-fadeIn">Welcome to Bethesda Lending Library</h2>
                <p className="max-w-2xl mx-auto text-base leading-relaxed animate-fadeIn">
                Discover an engaging collection of educational toys, books, and games designed to support developmental growth and learning. Parents can browse available items, reserve them, and get notified when their requested resources are ready for pickup.
                </p>
            </div>

            <h2 className="text-2xl font-bold mb-4 text-bethDeepBlue">Available Toys & Books</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentItems.map(item => (
                    <Link
                        to={`/item/${item.id}`}
                        key={item.id}
                        className="bg-white border shadow-md rounded overflow-hidden hover:shadow-xl transform hover:-translate-y-1 transition duration-300"
                    >
                        <img src={item.image} alt={item.name} className="w-full h-64 object-cover" />
                        <div className="p-4">
                            <h3 className="text-lg font-semibold text-bethDeepBlue mb-1">{item.name}</h3>
                            <p className={`text-sm font-medium ${item.status === 'Available' ? 'text-green-600' : 'text-red-600'}`}>
                                Status: {item.status}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
            {/* Pagination Controls */}
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
                        className={`px-3 py-1 rounded ${currentPage === index + 1 ? 'bg-bethLightBlue text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
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