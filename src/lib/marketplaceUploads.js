import { validateDocument, validateImage } from "@/lib/cloudinary";

export const DOCUMENT_CATEGORIES = [
  "Notes",
  "Assignments",
  "Study Materials",
  "PYQs",
  "Lab Manuals",
  "Viva Notes",
];

export const IMAGE_CATEGORIES = [
  "Books",
  "Electronics",
  "Marketplace Items",
  "Miscellaneous",
  "Miscellaneous Marketplace Items",
];

const CATEGORY_DOCUMENT_RULES = {
  Notes: ["pdf"],
  PYQs: ["pdf"],
  Assignments: ["pdf", "doc", "docx"],
  "Study Materials": ["pdf", "doc", "docx", "ppt", "pptx"],
  "Lab Manuals": ["pdf", "doc", "docx", "ppt", "pptx"],
  "Viva Notes": ["pdf", "doc", "docx", "ppt", "pptx"],
};

export const isDocumentCategory = (category) =>
  DOCUMENT_CATEGORIES.includes(category);

export const isImageCategory = (category) =>
  IMAGE_CATEGORIES.includes(category);

export const getAllowedDocumentExtensions = (category) =>
  CATEGORY_DOCUMENT_RULES[category] || ["pdf", "doc", "docx", "ppt", "pptx"];

export const getDocumentAccept = (category) =>
  getAllowedDocumentExtensions(category)
    .map((ext) => `.${ext}`)
    .join(",");

export const getDocumentLabel = (category) => {
  const exts = getAllowedDocumentExtensions(category);
  return exts.map((ext) => ext.toUpperCase()).join(", ");
};

export const validateMarketplaceDocument = (file, category) => {
  validateDocument(file);

  const ext = file.name?.split(".").pop()?.toLowerCase();
  if (!getAllowedDocumentExtensions(category).includes(ext)) {
    throw new Error("Invalid document format");
  }

  return true;
};

export const validateMarketplaceImage = (file) => {
  validateImage(file);
  return true;
};
