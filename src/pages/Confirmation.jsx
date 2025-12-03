// src/pages/Confirmation.jsx

import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import confetti from "canvas-confetti";

export default function Confirmation() {
  const location = useLocation();
  const type = location.state?.type || "reservation";
  const itemName = location.state?.itemName || "Toy";

  const isWaitlist = type === "waitlist";

  /* --------------------------------------------------------
     TRIGGER CONFETTI OR FINGER-CROSSED ANIMATION ON LOAD
  --------------------------------------------------------- */
  useEffect(() => {
    if (!isWaitlist) {
      // 🎉 Confetti for reservations
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } else {
      // 🤞 Finger crossed animation (subtle float effect)
      const icon = document.getElementById("waitlist-icon");
      if (icon) {
        icon.classList.add("animate-wiggle");
      }
    }
  }, [isWaitlist]);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow rounded text-center mt-10">

      <h2 className="text-3xl font-bold text-bethDeepBlue mb-4">
        {isWaitlist ? "Waitlist Request Received" : "Reservation Submitted"}
      </h2>

      {/* SUCCESS ICON */}
      {!isWaitlist ? (
        <div className="text-green-600 text-6xl mb-4">✔</div>
      ) : (
        <div
          id="waitlist-icon"
          className="text-yellow-600 text-6xl mb-4 select-none"
        >
          🤞
        </div>
      )}

      {/* MAIN MESSAGE */}
      {!isWaitlist ? (
        <p className="text-gray-700 text-lg mb-6">
          Your reservation for <span className="font-semibold">{itemName}</span> has been submitted!
          <br />
          Our team will review it and notify you when it is ready for pickup.
        </p>
      ) : (
        <p className="text-gray-700 text-lg mb-6">
          You have been added to the waitlist for{" "}
          <span className="font-semibold">{itemName}</span>.
          <br />
          You will be contacted as soon as this toy becomes available.
        </p>
      )}

      {/* Notes */}
      {isWaitlist && (
        <p className="text-sm text-yellow-600 italic mb-4">
          * Waitlist approval is handled by Admin.
        </p>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4 mt-6">

        <Link
          to="/"
          className="px-6 py-2 bg-bethDeepBlue hover:bg-bethLightBlue text-white rounded shadow"
        >
          Back to Home
        </Link>

        <Link
          to="/"
          className="px-6 py-2 border border-bethDeepBlue text-bethDeepBlue rounded hover:bg-gray-100"
        >
          Browse More Toys
        </Link>
      </div>
    </div>
  );
}
