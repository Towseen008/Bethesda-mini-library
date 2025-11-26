// src/pages/AboutUs.jsx
import { useState } from "react";

export default function AboutUs() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const faqList = [
    {
      q: "How long can I borrow a toy?",
      a: "Toys can be borrowed for up to 2 weeks. Extensions can be requested based on availability."
    },
    {
      q: "How many toys can I borrow at once?",
      a: "Families may check out up to 3 toys at a time."
    },
    {
      q: "Are the toys sanitized?",
      a: "Yes! Every toy is cleaned and inspected before being made available for borrowing."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-16">

      {/* ABOUT LIBRARY */}
      <section id="about">
        <h2 className="text-3xl font-bold text-bethDeepBlue mb-4">
          About The Toy Lending Library
        </h2>
        <p className="text-gray-700 leading-relaxed">
          The Toy Lending Library provides access to a wide collection of
          educational toys designed to support childhood development, including
          fine motor skills, sensory play, cognitive learning, and social interaction.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq">
        <h2 className="text-3xl font-bold text-bethDeepBlue mb-4">FAQ</h2>

        <div className="space-y-4">
          {faqList.map((item, index) => (
            <div key={index} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left px-4 py-3 font-semibold bg-gray-100 hover:bg-gray-200 transition flex justify-between items-center"
              >
                {item.q}
                <span className="text-xl">
                  {openFAQ === index ? "−" : "+"}
                </span>
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  openFAQ === index ? "max-h-40 p-4" : "max-h-0 p-0"
                }`}
              >
                <p className="text-gray-700">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact">
        <h2 className="text-3xl font-bold text-bethDeepBlue mb-4">
          Contact Us
        </h2>

        <div className="space-y-2 text-gray-700">
          <p>📍 3280 Schmon Parkway, Thorold, ON, L2V 4Y6</p>

          <p>
            📧{" "}
            <a href="mailto:info@bethesdaservices.com" className="text-bethDeepBlue underline">
              info@bethesdaservices.com
            </a>
          </p>

          <p>
            ☎️{" "}
            <a href="tel:9056846918" className="text-bethDeepBlue underline">
              905.684.6918
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}