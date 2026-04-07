// Cloudinary Configuration for Image Uploads
// Images uploaded by customers will be stored in Cloudinary cloud storage
// and the URLs will be sent via email

export const CLOUDINARY_CONFIG = {
  // Your Cloudinary Cloud Name
  cloudName: 'djupvlz3l',
  
  // Your Upload Preset (must be set to "unsigned" in Cloudinary dashboard)
  uploadPreset: 'inno_group_uploads',
  
  // API endpoint for image uploads
  uploadUrl: 'https://api.cloudinary.com/v1_1/djupvlz3l/image/upload'
};

// Upload a single image to Cloudinary
export async function uploadImageToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  try {
    const response = await fetch(CLOUDINARY_CONFIG.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url; // Returns the HTTPS URL of the uploaded image
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}
