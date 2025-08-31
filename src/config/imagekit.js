import ImageKit from 'imagekit';

// Lazy initialization of ImageKit
let imagekit = null;

// Initialize ImageKit instance
const getImageKitInstance = () => {
  if (!imagekit) {
    if (!validateImageKitConfig()) {
      throw new Error('ImageKit not properly configured');
    }
    
    imagekit = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
    });
  }
  return imagekit;
};

// Validate ImageKit configuration
const validateImageKitConfig = () => {
  const required = ['IMAGEKIT_PUBLIC_KEY', 'IMAGEKIT_PRIVATE_KEY', 'IMAGEKIT_URL_ENDPOINT'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing ImageKit configuration: ${missing.join(', ')}`);
    console.warn('📝 Please set the following environment variables:', missing.join(', '));
    return false;
  }
  
  console.log('✅ ImageKit configuration loaded successfully');
  return true;
};

// Upload file to ImageKit
export const uploadToImageKit = async (file, fileName, folder = 'socyads') => {
  try {
    const imagekitInstance = getImageKitInstance();

    const uploadResponse = await imagekitInstance.upload({
      file: file.buffer || file, // buffer for multer files, base64 for direct uploads
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
      tags: ['socyads', folder],
    });

    return {
      success: true,
      data: {
        fileId: uploadResponse.fileId,
        name: uploadResponse.name,
        url: uploadResponse.url,
        thumbnailUrl: uploadResponse.thumbnailUrl,
        filePath: uploadResponse.filePath,
        size: uploadResponse.size,
        fileType: uploadResponse.fileType,
        height: uploadResponse.height,
        width: uploadResponse.width,
      }
    };
  } catch (error) {
    console.error('ImageKit upload error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload file'
    };
  }
};

// Delete file from ImageKit
export const deleteFromImageKit = async (fileId) => {
  try {
    const imagekitInstance = getImageKitInstance();

    await imagekitInstance.deleteFile(fileId);
    return { success: true };
  } catch (error) {
    console.error('ImageKit delete error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete file'
    };
  }
};

// Get ImageKit authentication parameters for frontend
export const getAuthenticationParameters = () => {
  try {
    const imagekitInstance = getImageKitInstance();

    const authenticationParameters = imagekitInstance.getAuthenticationParameters();
    return {
      success: true,
      data: authenticationParameters
    };
  } catch (error) {
    console.error('ImageKit auth error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get authentication parameters'
    };
  }
};

// Transform image URL
export const transformImageUrl = (url, transformations = {}) => {
  try {
    const imagekitInstance = getImageKitInstance();
    const transformedUrl = imagekitInstance.url({
      src: url,
      transformation: [transformations]
    });
    return transformedUrl;
  } catch (error) {
    console.error('ImageKit transform error:', error);
    return url; // Return original URL if transformation fails
  }
};

// Common image transformations
export const imageTransformations = {
  avatar: {
    height: 200,
    width: 200,
    cropMode: 'maintain_ratio',
    quality: 80,
    format: 'webp'
  },
  thumbnail: {
    height: 300,
    width: 400,
    cropMode: 'maintain_ratio',
    quality: 75,
    format: 'webp'
  },
  gallery: {
    height: 600,
    width: 800,
    cropMode: 'maintain_ratio',
    quality: 85,
    format: 'webp'
  },
  portfolio: {
    height: 800,
    width: 1200,
    cropMode: 'maintain_ratio',
    quality: 90,
    format: 'webp'
  }
};

// Export the getter function instead of the instance
export default getImageKitInstance;
