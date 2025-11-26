// 

export default function SkeletonCard() {
  return (
    <div className="animate-pulse bg-white border shadow-md rounded overflow-hidden">
      {/* Image skeleton */}
      <div className="h-64 w-full bg-gray-300"></div>

      {/* Text skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/4"></div>
      </div>
    </div>
  );
}
