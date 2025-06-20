import { Playlist } from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose from "mongoose"

const createPlaylist = asyncHandler(async (req, res) => {
  const {name, description} = req.body

  if(!name?.trim() || !description?.trim()){
    throw new ApiError(400, "name and description cannot be empty")
  }

  const existing = await Playlist.findOne({name, owner: req.user._id})

  if(existing){
    throw new ApiError(409, "you already have a playlist with same name")
  }

  const playlist = await Playlist.create(
    {
      name : name.trim(),
      description : description.trim(),
      owner: req.user._id
    }
  )

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      playlist,
      "Playlist created successfully"
    )
  )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const playlistId = req.params.playlistId
    
    if(!playlistId){
      throw new ApiError(400, "cannot get playlistId")
    }

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
      throw new ApiError(400, "Invalid playlist ID format")
    }

    const playlist = await Playlist.findById(playlistId)
      .populate("owner", "username fullName avatar")
      .populate({
        path: "videos",
        match: { isPublished: true }
      })
    
    if(!playlist){
      throw new ApiError(400, "couldn't find playlist")
    }

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlist,
        "playlist fetched successfully"
      )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const playlistId = req.params.playlistId
  const videoId = req.params.videoId
  
  if(!playlistId || !videoId){
    throw new ApiError(400, "playlistId and videoId is required")
  }

  if(!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)){
    throw new ApiError(400, "Invalid playlistId or videoId format")
  }

  const playlist = await Playlist.findById(playlistId)

  if(!playlist){
    throw new ApiError(404, "cannot find playlist")
  }

  const video = await Video.findById(videoId)

  if(!video){
    throw new ApiError(404, "cannot find the video")
  }

  if(!req.user._id.equals(playlist.owner) || !playlist.owner.equals(video.owner)){
    throw new ApiError(403, "you are not the video or playlist owner")
  }

  if(playlist.videos.includes(video._id)){
    throw new ApiError(400, "video already exists in the playlist")
  }

  playlist.videos.push(video._id)
  await playlist.save()

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "Added to playlist successfully"
    )
  )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const {videoId, playlistId} = req.params

  if(!videoId || !playlistId){
    throw new ApiError(400, "videoId and playlistId are required")
  }

  if(!mongoose.Types.ObjectId.isValid(videoId) || !mongoose.Types.ObjectId.isValid(playlistId)){
    throw new ApiError(400, "Invalid videoId or playlistId format")
  }

  const video = await Video.findById(videoId)
  const playlist = await Playlist.findById(playlistId)

  if(!video || !playlist){
    throw new ApiError(404, "cannot find the video or playlist")
  }

  if(!req.user._id.equals(playlist.owner) || !playlist.owner.equals(video.owner)){
    throw new ApiError(403, "you are not the video or playlist owner")
  }

  if(!playlist.videos.includes(video._id)){
    throw new ApiError(400, "video already does not exist in the playlist")
  }  

  playlist.videos.pull(video._id)
  await playlist.save()

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "video removed successfully from the playlist"
    )
  )
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const playlistId = req.params.playlistId
  const {name, description} = req.body

  if(!name?.trim() || !description?.trim()){
    throw new ApiError(400, "name and description is required")
  }

  if(!playlistId){
    throw new ApiError(400, "playlistId is required")    
  }

  if(!mongoose.Types.ObjectId.isValid(playlistId)){
    throw new ApiError(400, "Invalid playlistId format")
  }

  const playlist = await Playlist.findById(playlistId)
  
  if(!playlist){
    throw new ApiError(404, "cannot find the playlist")
  }

  if(!playlist.owner.equals(req.user._id)){
    throw new ApiError(403, "you are not the playlist owner")
  }

  playlist.name = name.trim()
  playlist.description = description.trim()
  await playlist.save()

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {
        name,
        description
      },
      "playlist updated successfully"
    )
  )
})

const deletePlaylist = asyncHandler(async (req, res) => {
  const playlistId = req.params.playlistId
 
  if(!playlistId){
    throw new ApiError(400, "playlistId is required")    
  }

  if(!mongoose.Types.ObjectId.isValid(playlistId)){
    throw new ApiError(400, "Invalid playlistId format")
  }

  const playlist = await Playlist.findById(playlistId)
  
  if(!playlist){
    throw new ApiError(404, "cannot find the playlist")
  }

  if(!playlist.owner.equals(req.user._id)){
    throw new ApiError(403, "you are not the playlist owner")
  }

  await playlist.deleteOne()

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "playlist deleted successfully"
    )
  )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
  const userId = req.params.userId

  if(!userId){
    throw new ApiError(400, "userId is required")
  }

  if(!mongoose.Types.ObjectId.isValid(userId)){
    throw new ApiError(400, "Invalid userId format")
  }

  const playlists = await Playlist.find({
    owner : userId
  })

  if(!playlists){
    throw new ApiError(400, "No playlists created by the user")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      playlists,
      "All playlists fetched successfully"
    )
  )
})

export {
  createPlaylist,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist,
  getUserPlaylists
}