import mongoose from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const channelId = req.params.channelId

    if(!channelId){
      throw new ApiError(400, "channelId is required")
    }

    if(!mongoose.Types.ObjectId.isValid(channelId)){
      throw new ApiError(400, "invalid channelId format")
    }

    const subscriberId = req.user._id

    if(channelId.toString() === subscriberId.toString()){
      throw new ApiError(400, "You cannot subscribe to yourself")
    }

    const existingSubscription = await Subscription.findOne(
      {
        subscriber: subscriberId,
        channel: channelId
      }
    )

    let message = ""
    if(existingSubscription){
      await existingSubscription.deleteOne()
      message = "unsubscribed from channel successfully"
    }
    else{
      await Subscription.create({
        subscriber: subscriberId,
        channel: channelId
      })

      message = "subscribed to channel successfully"
    }

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

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const channelId = req.params.subscriberId;

  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }

  if(!mongoose.Types.ObjectId.isValid(channelId)){
    throw new ApiError(400, "invalid channelId format")
  }

  const subscribers = await Subscription.find({ channel: channelId })
    .populate("subscriber", "fullName username avatar");

  return res.status(200).json(
    new ApiResponse(
      200,
      subscribers.map(sub => sub.subscriber), // Return only subscriber user data
      "Subscriber list fetched successfully"
    )
  );
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscriberId = req.params.channelId

    if(!subscriberId){
      throw new ApiError(400, "subscriberId is required")
    }

    if(!mongoose.Types.ObjectId.isValid(subscriberId)){
      throw new ApiError(400, "invalid subscriberId format")
    }

    const channels = await Subscription.find({subscriber : subscriberId})
      .populate("channel", "fullName username avatar")

    return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channels.map(ch => ch.channel),
        "channel list fetched successfully"
      )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}