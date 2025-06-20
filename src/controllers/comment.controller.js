import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"

const addComment = asyncHandler(async (req, res) => {
  const {videoId} = req.params
  const {content} = req.body

  if(!videoId){
    throw new ApiError(400, "videoId is required")
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)){
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

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  const { content } = req.body

  if(!content?.trim()){
    throw new ApiError(400, "Comment cannot be empty")
  }

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID")
  }

  const comment = await Comment.findById(commentId)
  
  if (!comment) {
    throw new ApiError(404, "Comment not found")
  }

  if (!comment.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not the owner of this comment")
  }

  comment.content = content.trim()
  await comment.save()

  return res
  .status(200)
  .json(
    new ApiResponse(
      200, 
      comment, 
      "Comment deleted successfully"
    )
  )
})


const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid comment ID")
  }

  const comment = await Comment.findById(commentId)
  
  if (!comment) {
    throw new ApiError(404, "Comment not found")
  }

  if (!comment.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not the owner of this comment")
  }

  await comment.deleteOne()

  return res
  .status(200)
  .json(
    new ApiResponse(
      200, 
      {}, 
      "Comment deleted successfully"
    )
  )
})

const getVideoComments = asyncHandler(async (req, res) => {
  const {videoId} = req.params
  const {page = 1, limit = 10} = req.query

  if(!mongoose.Types.ObjectId.isValid(videoId)){
    throw new ApiError(400, "Invalid videoId format")
  }

  const video = await Video.findById(videoId)

  if(!video){
    throw new ApiError(404, "video not found")
  }

  const comments = await Comment.find({ video: videoId })
    .populate("owner", "username fullName avatar") 
    .sort({ createdAt: -1 }) //latest first
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      comments,
      "video comments fetched successfully"
    )
  )
})


export{
  addComment,
  updateComment,
  deleteComment,
  getVideoComments
}
