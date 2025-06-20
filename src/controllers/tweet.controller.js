import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler }  from "../utils/asyncHandler.js"
import mongoose from "mongoose"


const createTweet = asyncHandler(async (req, res) => {
  const content = req.body.content

  if(!content?.trim()){
    throw new ApiError(400, "Content cannot be empty")
  }

  const tweet = await Tweet.create({
    content, 
    owner : req.user._id
  })

  if(!tweet){
    throw new ApiError(500, "tweet creation failed")
  }

  return res
  .status(201)
  .json(
    new ApiResponse(
      201,
      tweet,
      "tweet is created successfully"
    )
  )
})

export {
  createTweet
}