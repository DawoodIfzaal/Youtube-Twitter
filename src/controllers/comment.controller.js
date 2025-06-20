import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { isValid } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"

const addComment = asyncHandler(async (req, res) => {
  const {videoId} = req.params
  const {content} = req.body

  if(!videoId){
    throw new ApiError(400, "videoId is required")
  }

  if(!isValid(videoId)){
    throw new ApiError(400, "Invalid videoId format")
  }

  const video = await Video.findById(videoId)

  if(!video){
    throw new ApiError(404, "video not found")
  }

  if(!content?.trim()){
    throw new ApiError(400, "comment is empty")
  } 

  const comment = await Comment.create(
    {
      content: content.trim(),
      owner: req.user._id,
      video: videoId
    }
  )

  if(!comment){
    throw new ApiError(500, "comment creation failed")
  }

  return res
  .status(201)
  .json(
    new ApiResponse(
      201,
      comment,
      "commented on a video successfully"
    )
  )
  
})

export{
  addComment
}
