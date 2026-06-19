import axios from 'axios';

/**
 * Reusable utility for client-side uploads to Cloudinary
 * using Axios to support progress tracking.
 */

const getCloudinaryConfig = () => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing. Ensure NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET are set in your .env.local file.');
  }

  return { cloudName, uploadPreset };
};

/**
 * Base file upload handler using Axios
 */
export const uploadFile = async (file, resourceType = 'auto', onProgress) => {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      formData,
      {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const percentComplete = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentComplete);
          }
        }
      }
    );

    if (response.data?.secure_url) {
      return response.data.secure_url;
    } else {
      throw new Error('Cloudinary response did not contain secure_url.');
    }
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message || 'Upload failed.';
    throw new Error(errorMsg);
  }
};

/**
 * Validates and uploads an image (JPG, PNG, WEBP)
 */
export const uploadImage = async (file, onProgress) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid image type. Please select a JPG, PNG, or WEBP image file.');
  }
  
  // Enforce 10MB maximum image size limit
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size exceeds the 10MB limit.');
  }

  return uploadFile(file, 'image', onProgress);
};

/**
 * Validates and uploads a PDF file
 */
export const uploadPDF = async (file, onProgress) => {
  if (file.type !== 'application/pdf') {
    throw new Error('Invalid document type. Only PDF documents are allowed for academic resources.');
  }

  // Enforce 20MB maximum file size limit
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('PDF file size exceeds the 20MB limit.');
  }

  return uploadFile(file, 'auto', onProgress);
};
