import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose from "mongoose"

const createPlaylist = asyncHandler(async (req, res) => {
  const {name, description} = req.body

  if(!name || !description){
    throw new ApiError(400, "name and description cannot be empty")
  }

  const existing = await Playlist.findOne({name, owner: req.user._id})

  if(existing){
    throw new ApiError(409, "you already have a playlist with same name")
  }

  const playlist = await Playlist.create(
    {
      name,
      description,
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
      .populate("videos")
    
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

  if(!mongoose.Types.ObjectId.isValid({playlistId, videoId})){
    throw new ApiError(400, "Invalid playlistId or videoId format")
  }

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

export {
  createPlaylist,
  getPlaylistById,
  addVideoToPlaylist
}