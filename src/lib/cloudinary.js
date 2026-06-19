/**
 * Reusable utility for client-side uploads to Cloudinary
 * using XMLHttpRequest to support progress tracking.
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
 * Base file upload handler
 */
export const uploadFile = (file, resourceType = 'auto', onProgress) => {
  return new Promise((resolve, reject) => {
    try {
      const { cloudName, uploadPreset } = getCloudinaryConfig();

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, true);

      // Track progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            if (response.secure_url) {
              resolve(response.secure_url);
            } else {
              reject(new Error('Cloudinary response did not contain secure_url.'));
            }
          } catch (err) {
            reject(new Error('Failed to parse Cloudinary upload response.'));
          }
        } else {
          try {
            const response = JSON.parse(xhr.responseText);
            reject(new Error(response.error?.message || `Upload failed with status ${xhr.status}`));
          } catch (e) {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error occurred during Cloudinary upload.'));
      };

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      xhr.send(formData);
    } catch (error) {
      reject(error);
    }
  });
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
