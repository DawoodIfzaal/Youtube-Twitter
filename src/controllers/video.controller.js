import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { uploadImageOnCloudinary, uploadVideoOnCloudinary } from "../utils/cloudinary.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { getVideoDurationInSeconds } from "../utils/getVideoDuration.js"

const publishAVideo = asyncHandler(async (req, res) => {
  const {title, description} = req.body
  
  if(!title || !description){
    throw new ApiError(400, "please, give title and description")
  }

  const videoLocalPath = req.files?.videoFile?.[0]?.path

  if(!videoLocalPath){
    throw new ApiError(400, "videoFile is required")
  }

  let thumbnailPath
  if(req.files && req.files.thumbnail && req.files.thumbnail[0].path){
    thumbnailPath = req.files.thumbnail[0].path
  }

  const duration = await getVideoDurationInSeconds(videoLocalPath)
  
  const videoFile = await uploadVideoOnCloudinary(videoLocalPath)
  const thumbnail = await uploadImageOnCloudinary(thumbnailPath)

  if(!videoFile?.url){
    throw new ApiError(400, "video file is required in cloudinary")
  }
  
  const user = await User.findById(req.user._id)

  const videoDetails = await Video.create(
    {
      title,
      description,
      videoFile: videoFile?.url,
      thumbnail: thumbnail?.url || "",
      owner: user._id,
      duration,
      views: 0,
      isPublished: true
    }
  )

  if(!videoDetails){
    throw new ApiError(500, "something went wrong when adding video")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      videoDetails,
      "published the video successfully"
    )
  )
})


export{
  publishAVideo
}