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
      a: "Toys can be borrowed for up to 2 weeks. Extensions may be requested based on availability."
    },
    {
      q: "How many toys can I borrow at once?",
      a: "Families may check out up to 3 toys at a time."
    },
    {
      q: "Are the toys sanitized?",
      a: "Yes. Every toy is cleaned and inspected before being made available for borrowing."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-20">

      {/* HERO / ABOUT */}
      <section
        id="about"
        className="bg-bethDeepBlue/5 rounded-2xl p-8 md:p-10"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-bethDeepBlue mb-4">
          About the Toy Lending Library
        </h1>

        <p className="text-gray-700 leading-relaxed mb-3">
          The Toy Lending Library is a community toy and learning resource
          supporting children and families through play, learning, and
          inclusion in the Niagara region.
        </p>

        <p className="text-gray-700 leading-relaxed mb-3">
          Our aim is to promote inclusive play and healthy child development by
          providing access to educational toys and learning resources for
          children of all abilities.
        </p>

        <p className="text-gray-700 leading-relaxed">
          Our collection supports fine motor skills, sensory play, cognitive
          learning, and social interaction—helping children learn through
          meaningful play.
        </p>
      </section>

      {/* INFO CARDS */}
      <section className="grid gap-8 md:grid-cols-2">
        <div className="border border-bethDeepBlue/20 rounded-xl p-6 hover:shadow-md transition">
          <h2 className="text-xl font-semibold text-bethDeepBlue mb-2">
            Our Commitment
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We are committed to safety, privacy, and creating a welcoming
            environment where every child can learn, grow, and feel included.
          </p>
        </div>

        <div className="border border-bethDeepBlue/20 rounded-xl p-6 hover:shadow-md transition">
          <h2 className="text-xl font-semibold text-bethDeepBlue mb-2">
            Who We Serve
          </h2>
          <p className="text-gray-700 leading-relaxed">
            We support families, caregivers, and children across the Niagara
            region, including children with diverse learning and developmental
            needs.
          </p>
        </div>
      </section>

      {/* WHY SECTION */}
      <section>
        <h2 className="text-2xl font-bold text-bethDeepBlue mb-4">
          Why a Toy Lending Library?
        </h2>

        <ul className="grid gap-3 sm:grid-cols-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-bethDeepBlue font-bold">•</span>
            Affordable access to quality learning tools
          </li>
          <li className="flex items-start gap-2">
            <span className="text-bethDeepBlue font-bold">•</span>
            Try toys before committing to purchase
          </li>
          <li className="flex items-start gap-2">
            <span className="text-bethDeepBlue font-bold">•</span>
            Encourages sustainability and reuse
          </li>
          <li className="flex items-start gap-2">
            <span className="text-bethDeepBlue font-bold">•</span>
            Supports learning through purposeful play
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section id="faq">
        <h2 className="text-2xl font-bold text-bethDeepBlue mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqList.map((item, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full text-left px-5 py-4 font-semibold bg-gray-50 hover:bg-gray-100 transition flex justify-between items-center"
              >
                <span>{item.q}</span>
                <span className="text-bethDeepBlue text-xl">
                  {openFAQ === index ? "−" : "+"}
                </span>
              </button>

              <div
                className={`transition-all duration-300 overflow-hidden ${
                  openFAQ === index ? "max-h-40 px-5 pb-4" : "max-h-0 px-5"
                }`}
              >
                <p className="text-gray-700">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className=" bg-bethDeepBlue/5 text-bethDeepBlue rounded-2xl p-8"
      >
        <h2 className="text-2xl font-bold mb-4">Contact Us</h2>

        <div className="space-y-2  text-gray-700">
          <p>📍 3310 Schmon Parkway, Thorold, ON, L2V 4Y6</p>

          <p>
            📧{" "}
            <a
              href="mailto:toylending@bethesdaservices.com"
              className="underline hover:text-white"
            >
              toylending@bethesdaservices.com
            </a>
          </p>

          <p>
            ☎️{" "}
            <a
              href="tel:9056846918"
              className="underline hover:text-white"
            >
              905.684.6918
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}