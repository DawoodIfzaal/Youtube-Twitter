import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { asyncHandler }  from "../utils/asyncHandler.js"
import mongoose from "mongoose"
import { Like } from "../models/like.model.js"

const createTweet = asyncHandler(async (req, res) => {
  const content = req.body.content

  if(!content?.trim()){
    throw new ApiError(400, "Content cannot be empty")
  }

  const tweet = await Tweet.create({
    content : content.trim(), 
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

const updateTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId
  const content = req.body.content

  if(!content?.trim()){
    throw new ApiError(400, "content cannot be empty")
  }

  if(!tweetId){
    throw new ApiError(400, "tweetId is required")
  }

  if(!mongoose.Types.ObjectId.isValid(tweetId)){
    throw new ApiError(400, "Invalid tweetId format")
  }

  const tweet = await Tweet.findById(tweetId)

  if(!tweet){
    throw new ApiError(500, "tweet not found")
  }
  
  if(!tweet.owner.equals(req.user._id)){
    throw new ApiError(403, "you are not the tweet owner")
  }

  tweet.content = content.trim()
  await tweet.save()  

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      tweet,
      "tweet was updated successfully"
    )
  )
})

const deleteTweet = asyncHandler(async (req, res) => {
  const tweetId = req.params.tweetId

  if(!tweetId){
    throw new ApiError(400, "tweetId is required")
  }

  if(!mongoose.Types.ObjectId.isValid(tweetId)){
    throw new ApiError(400, "Invalid tweetId format")
  }

  const tweet = await Tweet.findById(tweetId)

  if(!tweet){
    throw new ApiError(500, "tweet not found")
  }

  if(!tweet.owner.equals(req.user._id)){
    throw new ApiError(403, "you are not the tweet owner")
  }

  await tweet.deleteOne()  

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {},
      "tweet was deleted successfully"
    )
  )
})

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params

  if(!userId){
    throw new ApiError(400, "userId is required")
  }

  if(!mongoose.Types.ObjectId.isValid(userId)){
    throw new ApiError(400, "Invalid userId format")
  }

  const tweets = await Tweet.find(
    {owner : userId}
  )


  if(!tweets){
    throw new ApiError(400, "No tweets tweeted by the user")
  }

  const enrichedTweets = await Promise.all(
    tweets.map(async (tweet) => {
      const [likes, dislikes] = await Promise.all([
        Like.countDocuments({
          targetId: tweet._id,
          targetModel: "Tweet",
          isLike: true
        }),
        Like.countDocuments({
          targetId: tweet._id,
          targetModel: "Tweet",
          isLike: false
        })
      ]);

      return {
        ...tweet.toObject(),
        likes,
        dislikes
      };
    })
  )

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      enrichedTweets,
      "tweets fetched successfully"
    )
  )
})

export {
  createTweet,
  updateTweet,
  deleteTweet,
  getUserTweets
}