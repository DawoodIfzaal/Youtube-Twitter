import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import mongoose from "mongoose"
import { Like } from "../models/like.model.js"

const toggleLike = asyncHandler(async(req, res) => {
  const {targetId, targetModel, isLike} = req.body

  if(!targetId || !targetModel || typeof isLike !== "boolean"){
    throw new ApiError(400, "targetId, targetModel and isLike is required")
  }

  if(!["Video", "Tweet", "Comment"].includes(targetModel)){
    throw new ApiError(400, "Invalid targetModel value")
  }

  if(!mongoose.Types.ObjectId.isValid(targetId)){
    throw new ApiError(400, "Invalid targetId format")
  }

  const existing = await Like.findOne({
    user: req.user._id,
    targetId,
    targetModel
  })
  
  let message = ""

  if(existing){
    if(existing.isLike === isLike){
      await existing.deleteOne()
      message = isLike? "like removed" : "dislike removed"
    }
    else {
      existing.isLike = isLike
      await existing.save()
      message = isLike? "changed to like" : "changed to dislike"
    }
  }else{
    await Like.create(
      {
        user: req.user._id,
        targetId, 
        targetModel,
        isLike
      }
    )
    message = isLike? "liked" : "disliked"
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      `successfully ${message}`
    )
  )
})

const getLikedVideo = asyncHandler(async (req, res) => {
  const {userId} = req.params

  if(!mongoose.Types.ObjectId.isValid(userId)){
    throw new ApiError(400, "Invalid userId format")
  }

  const likedVideos = await Like.find({
    user : userId,
    isLike: true,
    targetModel: "Video"
  }).populate({
    path: "targetId",
    model: "Video",
    populate: {
      path: "owner",
      select: "username fullName avatar"
    }
  });

  const videos = likedVideos
    .filter(like => like.targetId) // remove null if video deleted
    .map(like => like.targetId);   // get actual video doc

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      videos,
      "Liked videos fetched successfully"
    )
  )
})

export {
  toggleLike,
  getLikedVideo
}