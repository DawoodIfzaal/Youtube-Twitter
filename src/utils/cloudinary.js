import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { ApiError } from "./apiError"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null
  
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    })

    //file has been uploaded successfully
    fs.unlinkSync(localFilePath)
    return response

  } catch (error) {
    //remove the locally saved temporary file as the upload operation failed
    fs.unlinkSync(localFilePath) 
    return null
  }
}

const deleteFromCloudinary = async(publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "auto"
    })
    console.log("Deleted: ", result)  
    return result
  } catch (error) {
    throw new ApiError(500, "Error deleting from cloudinary")
  }
}
export {uploadOnCloudinary, deleteFromCloudinary}