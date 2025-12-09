// src/components/Pagination.jsx

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showFirstLast = true, // New option
}) {
  if (totalPages <= 1) return null;

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  // Smart pagination: show fewer buttons for long lists
  const generatePages = () => {
    const pages = [];

    // Always show first and last page when applicable
    if (totalPages <= 7) {
      // If few pages, show all
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let p = start; p <= end; p++) pages.push(p);

      if (currentPage < totalPages - 2) pages.push("...");

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pages = generatePages();

  return (
    <div className="flex justify-center items-center mt-6 gap-2 flex-wrap">

      {/* FIRST PAGE BUTTON */}
      {showFirstLast && (
        <button
          onClick={() => goToPage(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50"
        >
          «
        </button>
      )}

      {/* PREVIOUS */}
      <button
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50"
      >
        Prev
      </button>

      {/* PAGE NUMBERS */}
      {pages.map((page, index) =>
        page === "..." ? (
          <span key={index} className="px-2 text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={index}
            onClick={() => goToPage(page)}
            className={`px-3 py-1 border rounded hover:bg-gray-200 ${
              page === currentPage
                ? "bg-bethDeepBlue text-white border-bethDeepBlue"
                : ""
            }`}
          >
            {page}
          </button>
        )
      )}

      {/* NEXT */}
      <button
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50"
      >
        Next
      </button>

      {/* LAST PAGE BUTTON */}
      {showFirstLast && (
        <button
          onClick={() => goToPage(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border rounded hover:bg-gray-200 disabled:opacity-50"
        >
          »
        </button>
      )}
    </div>
  );
}
