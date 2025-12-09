// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// 1) Setup Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// 2) Helper to send a single email
async function sendEmail({ to, subject, html }) {
  const from =
    process.env.RESEND_FROM || "Bethesda Library <no-reply@yourdomain.com>";

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    throw error;
  }

  return data;
}

/* ======================================================
   ROUTE: /email/reservation-created
   → Called when a parent submits a reservation
   → Sends email to parent + admin
====================================================== */
app.post("/email/reservation-created", async (req, res) => {
  try {
    const {
      parentEmail,
      parentName,
      childName,
      itemName,
      preferredDay,
      note,
    } = req.body;

    if (!parentEmail || !itemName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Email to parent
    const pickupLine = preferredDay
      ? `Preferred pick-up day: <strong>${preferredDay}</strong>.`
      : "We will contact you with pick-up details soon.";

    await sendEmail({
      to: parentEmail,
      subject: `Reservation received for "${itemName}"`,
      html: `
        <h2>Thank you for your reservation</h2>
        <p>Hi ${parentName || "there"},</p>
        <p>We have received your reservation for <strong>${itemName}</strong> ${
        childName ? `for ${childName}` : ""
      }.</p>
        <p>${pickupLine}</p>
        ${
          note
            ? `<p><strong>Your note:</strong><br />${String(note)
                .replace(/\n/g, "<br />")
                .trim()}</p>`
            : ""
        }
        <p>We will send another email when this toy is <strong>ready for pickup</strong>.</p>
        <p>– Bethesda Toy Lending Library</p>
      `,
    });

    // Email to admin as well
    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New reservation: "${itemName}"`,
        html: `
          <h2>New Reservation</h2>
          <p><strong>Parent:</strong> ${parentName || "N/A"} (${parentEmail})</p>
          <p><strong>Child:</strong> ${childName || "N/A"}</p>
          <p><strong>Item:</strong> ${itemName}</p>
          <p><strong>Preferred pick-up:</strong> ${
            preferredDay || "N/A"
          }</p>
        `,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error sending reservation email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

/* ======================================================
   ROUTE: /email/waitlist-created
   → Called when a parent joins the waitlist
   → Sends email to parent + admin
====================================================== */
app.post("/email/waitlist-created", async (req, res) => {
  try {
    const { parentEmail, parentName, childName, itemName } = req.body;

    if (!parentEmail || !itemName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Email to parent
    await sendEmail({
      to: parentEmail,
      subject: `Waitlist request for "${itemName}" received`,
      html: `
        <h2>You're on the waitlist!</h2>
        <p>Hi ${parentName || "there"},</p>
        <p>We have added you to the waitlist for <strong>${itemName}</strong> ${
          childName ? `for ${childName}` : ""
        }.</p>
        <p>We will email you again when this item becomes available.</p>
        <p>– Bethesda Toy Lending Library</p>
      `,
    });

    // Email to admin
    if (process.env.ADMIN_EMAIL) {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: `New waitlist request: "${itemName}"`,
        html: `
          <h2>New Waitlist Entry</h2>
          <p><strong>Parent:</strong> ${parentName || "N/A"} (${parentEmail})</p>
          <p><strong>Child:</strong> ${childName || "N/A"}</p>
          <p><strong>Item:</strong> ${itemName}</p>
        `,
      });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error sending waitlist email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

/* ======================================================
   ROUTE: /email/status-updated
   → Called when admin changes reservation status
   → Sends parent a clear update (special for "Ready for Pickup")
====================================================== */
app.post("/email/status-updated", async (req, res) => {
  try {
    const {
      parentEmail,
      parentName,
      childName,
      itemName,
      newStatus,
      preferredDay,
    } = req.body;

    if (!parentEmail || !itemName || !newStatus) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let subject = `Update for "${itemName}"`;
    let bodyHtml = "";

    if (newStatus === "Ready for Pickup") {
      subject = `🎉 "${itemName}" is ready for pickup`;
      bodyHtml = `
        <h2>Your toy is ready!</h2>
        <p>Hi ${parentName || "there"},</p>
        <p>Good news! The toy <strong>${itemName}</strong>${
        childName ? ` for ${childName}` : ""
      } is now <strong>ready for pickup</strong>.</p>
        ${
          preferredDay
            ? `<p>You requested: <strong>${preferredDay}</strong>. If this date no longer works, please contact us.</p>`
            : ""
        }
        <p>You can pick it up at the Bethesda Toy Lending Library during our regular open hours.</p>
        <p>– Bethesda Toy Lending Library</p>
      `;
    } else if (newStatus === "On Loan") {
      bodyHtml = `
        <h2>Reservation Update</h2>
        <p>Hi ${parentName || "there"},</p>
        <p>Your reservation for <strong>${itemName}</strong> is now marked as <strong>On Loan</strong>.</p>
        <p>We hope ${childName || "your child"} enjoys the toy!</p>
        <p>– Bethesda Toy Lending Library</p>
      `;
    } else if (newStatus === "Returned") {
      bodyHtml = `
        <h2>Thank you!</h2>
        <p>Hi ${parentName || "there"},</p>
        <p>We have marked <strong>${itemName}</strong> as <strong>Returned</strong> in our system.</p>
        <p>Thank you for using the Toy Lending Library. We hope to see you again soon.</p>
        <p>– Bethesda Toy Lending Library</p>
      `;
    } else {
      // Generic fallback
      bodyHtml = `
        <h2>Reservation Update</h2>
        <p>Hi ${parentName || "there"},</p>
        <p>The status of your reservation for <strong>${itemName}</strong> has been updated to <strong>${newStatus}</strong>.</p>
        <p>If you have any questions, please contact us.</p>
        <p>– Bethesda Toy Lending Library</p>
      `;
    }

    await sendEmail({
      to: parentEmail,
      subject,
      html: bodyHtml,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Error sending status email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// 6) Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Email service running on http://localhost:${PORT}`);
});
