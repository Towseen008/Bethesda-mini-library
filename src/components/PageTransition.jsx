// src/components/PageTransition.jsx
export default function PageTransition({ children }) {
  return (
    <div
      className="animate-pageFade"
    >
      {children}
    </div>
  );
}
