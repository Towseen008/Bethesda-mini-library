// src/components/admin/constants.js

export const CATEGORY_OPTIONS = [
  "Fine Motor",
  "Sensory Play",
  "Pretend Play",
  "Gross Motor",
  "Music",
  "STEM",
  "Games",
  "Numbers",
  "Letters",
  "Others",
];

export const AGE_GROUP_OPTIONS = ["All Age", "2 to 5", "2 to 10", "6 to 10","10 to 13","14+"];

export const ITEM_STATUS_OPTIONS = ["Available", "Pending", "On Loan"];

export const RESERVATION_STATUS_OPTIONS = [
  "Pending",
  "Ready for Pickup",
  "Due",
  "On Loan",
  "Review Return",
  "Returned",
];

export const INITIAL_FORM_STATE = {
  name: "",
  category: "",
  ageGroup: "",
  description: "",
  images: [],
  status: "Available",
  quantity: 1,
  totalQuantity: 1,
};
