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
export const uploadFile = async (file, resourceType = 'auto', onProgress, folder = 'sharevit') => {
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  if (folder) {
    formData.append('folder', folder);
  }

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
      return {
        secure_url: response.data.secure_url,
        public_id: response.data.public_id
      };
    } else {
      throw new Error('Cloudinary response did not contain secure_url.');
    }
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message || 'Upload failed.';
    throw new Error(errorMsg);
  }
};

/**
 * Validates an image file type
 */
export const validateImage = (file) => {
  if (!file) {
    throw new Error('No file selected');
  }
  const ext = file.name?.split('.').pop().toLowerCase();
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('Invalid image format');
  }
  return true;
};

/**
 * Validates a document file type
 */
export const validateDocument = (file) => {
  if (!file) {
    throw new Error('No file selected');
  }
  const ext = file.name?.split('.').pop().toLowerCase();
  const allowedExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx'];
  
  if (!allowedExtensions.includes(ext)) {
    throw new Error('Invalid document format');
  }
  return true;
};

/**
 * Validates and uploads an image (JPG, JPEG, PNG, WEBP)
 */
export const uploadImage = async (file, onProgress, folder = 'sharevit/images') => {
  validateImage(file);
  
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image size exceeds the 10MB limit.');
  }

  const res = await uploadFile(file, 'image', onProgress, folder);
  return res.secure_url;
};

/**
 * Validates and uploads a document file (PDF, DOC, DOCX, PPT, PPTX) to raw/upload
 */
export const uploadDocument = async (file, onProgress, folder = 'sharevit/documents') => {
  validateDocument(file);

  if (file.size > 25 * 1024 * 1024) {
    throw new Error('Document size exceeds the 25MB limit.');
  }

  // Upload to /raw/upload
  const res = await uploadFile(file, 'raw', onProgress, folder);
  return res.secure_url;
};

/**
 * Client-side placeholder for deleting file (requires backend signatures normally)
 */
export const deleteCloudinaryFile = async (publicId) => {
  console.log(`deleteCloudinaryFile called for publicId: ${publicId}`);
  return true;
};

/**
 * Extracts Cloudinary public ID from secure URL
 */
export const getPublicIdFromUrl = (url) => {
  if (!url) return '';
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return '';
    const pathAndExt = parts[1];
    const segments = pathAndExt.split('/');
    if (segments[0].match(/^v\d+$/)) {
      segments.shift();
    }
    const pathWithoutVersion = segments.join('/');
    const dotIndex = pathWithoutVersion.lastIndexOf('.');
    if (dotIndex !== -1) {
      return pathWithoutVersion.substring(0, dotIndex);
    }
    return pathWithoutVersion;
  } catch (e) {
    console.error('Error parsing Cloudinary public ID:', e);
    return '';
  }
};
