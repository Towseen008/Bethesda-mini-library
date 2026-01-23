// src/components/admin/helpers.js

export const escapeCell = (c) =>
  `"${(c ?? "").toString().replace(/"/g, '""')}"`;

export const downloadCSV = (headers, rows, filename) => {
  const content =
    "data:text/csv;charset=utf-8," +
    [headers, ...rows]
      .map((r) => r.map(escapeCell).join(","))
      .join("\n");

  const link = document.createElement("a");
  link.href = encodeURI(content);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const badgeColor = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-200 text-yellow-800";
    case "On Loan":
      return "bg-red-200 text-red-800";
    case "Due":
      return "bg-red-500 text-red-800";
    case "Returned":
      return "bg-green-200 text-green-800";
    case "Ready for Pickup":
      return "bg-green-100 text-green-700 border border-green-300";
    default:
      return "bg-green-200 text-green-800";
  }
};

