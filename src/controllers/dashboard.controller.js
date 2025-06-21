import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import mongoose from "mongoose"

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user._id
  
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid channel ID")
  }

  //total videos and total views
  const videoStats = await Video.aggregate([
    {$match: {owner : new mongoose.Types.ObjectId(userId)}},
    {
      $group:{
      _id : null,
      totalViews : {$sum : "$views"},
      totalVideos : {$sum : 1}
      }
    }
  ])

  //total likes on videos
  const likeStats = await Like.countDocuments({
    targetModel: "Video",
    isLike: true,
    targetId: {$in : await Video.find({owner:userId}).distinct("_id")}
  })

  // Total subscribers
  const totalSubscribers = await Subscription.countDocuments({
    channel: userId
  })

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        totalLikes: likeStats || 0,
        totalSubscribers
      },
      "Channel statistics fetched successfully"
    )
  )
})

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user._id

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid channel ID format")
  }

  const videos = await Video.find({ owner: userId })
    .populate("owner", "username fullName avatar") 
    .sort({ createdAt: -1 })

  return res.status(200).json(
    new ApiResponse(
      200,
      videos,
      "Channel videos fetched successfully"
    )
  )
})


export {
  getChannelStats,
  getChannelVideos
}