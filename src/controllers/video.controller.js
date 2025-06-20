import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { 
  deleteImageFromCloudinary, 
  deleteVideoFromCloudinary, 
  uploadImageOnCloudinary, 
  uploadVideoOnCloudinary 
} from "../utils/cloudinary.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { Playlist } from "../models/playlist.model.js"
import { getVideoDurationInSeconds } from "../utils/getVideoDuration.js"
import mongoose from "mongoose"

const publishAVideo = asyncHandler(async (req, res) => {
  const {title, description} = req.body
  
  if(!title?.trim() || !description?.trim()){
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
      videoPublicId: videoFile?.public_id,
      thumbnail: thumbnail?.url || "",
      thumbnailPublicId: thumbnail?.public_id || "",
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

const togglePublishStatus = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId

  if(!videoId){
    throw new ApiError(404, "video id is required")
  }  

  if(!mongoose.Types.ObjectId.isValid(videoId)){
    throw new ApiError(400, "Invalid video ID format")
  }

  const video = await Video.findById(videoId)

  if(!video){
    throw new ApiError(404, "video not found")
  }
  
  //use equals() or toString() to both if comparing 2 objects
  if(!video.owner.equals(req.user._id)){
    throw new ApiError(400, "you are not the video owner")
  }

  let message = ""
  if(video.isPublished){
    video.isPublished = false
    message = "video is privated"
  }
  else{
    video.isPublished = true
    message = "video is published online"
  }

  await video.save({validateBeforeSave: false})

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      message
    )
  )
})

const getVideoById = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId

  if(!videoId){
    throw new ApiError(404, "video Id is required")
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)){
    throw new ApiError(400, "Invalid video ID format")
  }

  const video = await Video.findById(videoId).populate("owner", "username avatar")
  if(!video){
    throw new ApiError(404, "video not found")
  }

  if(!video.isPublished){
    throw new ApiError(404, "video is private")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      video,
      "video fetched successfully"
    )
  )
})

const deleteVideo = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId

  if(!videoId){
    throw new ApiError(404, "video Id is required")
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)){
    throw new ApiError(400, "Invalid video ID format")
  }

  const video = await Video.findById(videoId)

  if(!video){
    throw new ApiError(404, "video not found")
  }

  if(!video.owner.equals(req.user._id)){
    throw new ApiError(403, "you are not the video owner")
  }

  if(video.thumbnailPublicId){
    await deleteImageFromCloudinary(video.thumbnailPublicId)
  }
  
  await Playlist.updateMany(
    {videos : videoId},
    {$pull : {videos: videoId}}
  )

  await deleteVideoFromCloudinary(video.videoPublicId)
  await video.deleteOne()

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "video deleted successfully"
    )
  )
})

const updateVideo = asyncHandler(async (req, res) => {
  const videoId = req.params.videoId

  if(!videoId){
    throw new ApiError(404, "video Id is required")
  }

  if(!mongoose.Types.ObjectId.isValid(videoId)){
    throw new ApiError(400, "Invalid video ID format")
  }
  
  const video = await Video.findById(videoId)
  if (!video) {
    throw new ApiError(404, "Video not found")
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not the owner of this video")
  }

  const { title, description } = req.body
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description cannot be empty")
  }

  // Handle thumbnail
  if (req.file?.path) {
    if (video.thumbnail) {
      await deleteImageFromCloudinary(video.thumbnailPublicId)
    }
    const uploadedThumb = await uploadImageOnCloudinary(req.file.path)
    video.thumbnail = uploadedThumb?.url || video.thumbnail
    video.thumbnailPublicId = uploadedThumb?.public_id || video.thumbnailPublicId
  }

  video.title = title
  video.description = description
  await video.save()

  return res.status(200).json(
    new ApiResponse(200, {
      title: video.title,
      description: video.description,
      thumbnail: video.thumbnail
    }, "Video updated successfully")
  )
})

const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query
  
  // Convert to integers
  page = parseInt(page)
  limit = parseInt(limit)

  const filter = {}

  // Search query (title or description)
  if(query){
    filter.$or = [
      {title: {$regex: query, $options: "i"}},//filter by given query with case insensitive
      {description: {$regex: query, $options: "i"}}
    ]
  }

  // filter by uploader
  if (userId) {
    filter.owner = userId;
  }

  // Sorting logic eg: sortOptions = {createdBy = -1}(descending) or {createdBy = 1}(ascending)
  const sortOptions = {};
  sortOptions[sortBy] = (sortType === "asc")? 1 : -1;

  // Count total documents
  const total = await Video.countDocuments(filter);

  // Fetch videos with pagination
  const videos = await Video.find(filter)
    .sort(sortOptions)
    .skip((page - 1) * limit)//"Don't give me the first N results, give me the next ones."
    .limit(limit)
    .populate("owner", "username fullName avatar");

  return res.status(200).json(
    new ApiResponse(200, {
      total,
      page,
      limit,
      videos,
    }, "Videos fetched successfully")
  );
});



export{
  publishAVideo,
  togglePublishStatus,
  getVideoById,
  deleteVideo,
  updateVideo,
  getAllVideos
}