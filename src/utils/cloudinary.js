import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { ApiError } from "./apiError.js"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadImageOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null
  
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image"
    })

    fs.unlinkSync(localFilePath)
    return response

  } catch (error) {
    //remove the locally saved temporary file as the upload operation failed
    fs.unlinkSync(localFilePath) 
    return null
  }
}

const uploadVideoOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null
  
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "video"
    })

    fs.unlinkSync(localFilePath)
    return response

  } catch (error) {
    //remove the locally saved temporary file as the upload operation failed
    fs.unlinkSync(localFilePath) 
    return null
  }
}

const deleteImageFromCloudinary = async(publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image"
    })

    console.log("Deleted: ", result)  
    return result
  } catch (error) {
    throw new ApiError(500, "Error deleting from cloudinary")
  }
}

const deleteVideoFromCloudinary = async(publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video"
    })

    console.log("Deleted: ", result)  
    return result
  } catch (error) {
    throw new ApiError(500, "Error deleting from cloudinary")
  }
}

export {
  uploadImageOnCloudinary, 
  uploadVideoOnCloudinary,
  deleteImageFromCloudinary, 
  deleteVideoFromCloudinary
}