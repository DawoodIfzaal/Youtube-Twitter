import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async(userId) => {
  const user = await User.findById(userId)
  const accessToken = user.generateAccessToken()
  const refreshToken = user.generateRefreshToken()

  user.refreshToken = refreshToken
  await user.save({validiteBeforeSave: false})

  return {accessToken, refreshToken}
}

const registerUser = asyncHandler(async (req, res) => {
  // receive user details from frontend
  // validation - not empty
  // check if user already exists - with username and email
  // check if file is there
  // check for images - for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response 
  // check for user creation
  // return response

  console.log(req.body)

  // receive user details from frontend
  const {fullName, email, username, password} = req.body

  //validation for empty fields
  if(
    [fullName, email, username, password].some((field) => {
      field?.trim() === ""
    })
  ){
    throw new ApiError(400, "All the fields are required")
  }

  //check if user already exists - with username and email
  const existedUser = await User.findOne({$or : [{username}, {email}]})

  if(existedUser){
    throw new ApiError (409, "user with email or username already exists")
  }

  // check for images - for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path //multer provides .files method
  
  let coverImageLocalPath
  if(req.files && req.files.coverImage && req.files.coverImage[0].path){
    coverImageLocalPath = req.files.coverImage[0].path
  }

  if(!avatarLocalPath){
    throw new ApiError(400, "avatar file is required")
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  
  if(!avatar){
    throw new ApiError(400, "avatar file is required in cloudinary")
  }

  // create user object - create entry in db
  const user = await User.create(
    {
      fullName,
      avatar: avatar.url,
      avatarPublicId: avatar.public_id,
      coverImage: coverImage?.url || "",
      coverImagePublicId: coverImage?.public_id || "",
      username: username.toLowerCase(), 
      email, 
      password
    }
  )
  
  // remove password and refresh token field from response 
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  // check for user creation
  if(!createdUser){
    throw new ApiError(500, "something went wrong when registering the user")
  }

  // return response
  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )
})

const loginUser = asyncHandler(async (req, res) => {
// Steps	    Action	                            Purpose

// 1	Extract email + password      Get login data
// 2	Find user by email	          Look up in DB
// 3	Handle user not found	        Avoid crash, show correct message
// 4	Verify password	              Authenticate user securely
// 5	Generate JWT tokens	          Give access and refresh tokens
// 6	Save refresh token to DB	    For future re-authentication
// 7	Sanitize user data	          Exclude password, refreshToken
// 8	Set tokens as cookies	        Secure storage on client
// 9	Send response	                Let frontend know login was successful

  const {username, email, password} = req.body

  if (!username && !email) {
    throw new ApiError(400, "username or email is required")
  }

  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  if(!user){
    throw new ApiError(400, "user doesn't exist")
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(400, "password is incorrect")
  }
  
  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
  
  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  
  const options = {
    httpOnly: true, 
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(new ApiResponse(200, 
    {
      user: loggedInUser, accessToken, refreshToken
    },
    "user logged in successfully"
  ))
})

const logoutUser = asyncHandler(async (req, res) => {
// Steps	  Action	                        Purpose
// 1	Get user ID from request	       Identify who is logging out
// 2	Clear refresh token in DB	       Prevent reuse
// 3	Clear auth cookies	             Remove client’s ability to re-authenticate
// 4	Send success response	           Confirm logout to frontend

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set : {
        refreshToken : undefined
      }
    }
  )

  const options = {
    httpOnly: true,
    secure: true 
  }

  res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "user logged out successfully"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401, "unauthorized request")
  }

  
  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = User.findById(decodedToken?._id)
    
    if(!user){
      throw new ApiError(401, "Invalid request token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token was expired or used")
    }
  
    const options = {
      secure: true,
      httpOnly: true
    }
  
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", newRefreshToken, option)
    .json(
      new ApiResponse(
        200,
        {accessToken, refreshToken: newRefreshToken},
        "Access token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
  }

})

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken")
  
  return res
  .status(200)
  .json(new ApiResponse(200, user, "user fetched successfully"))
})

const updateUserPassword = asyncHandler(async (req, res) => {
  const {oldPassword, newPassword} = req.body

  const user = await User.findById(req.user._id)

  if(!oldPassword || !newPassword){
    throw new ApiError(401, "fill both fields")
  }

  if(!await user.isPasswordCorrect(oldPassword)){
    throw new ApiError(401, "incorrect password")
  }

  //if i use findidandupdate it doesn't trigger pre-save middle

  user.password = newPassword //triggers pre-save hash
  await user.save({validiteBeforeSave: false}) //triggers pre-save hook

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    {},
    "password updated successfully" 
  ))
})

const updateUserDetails = asyncHandler(async (req, res) => {
  const {fullName, email} = req.body

  if(!fullName || !email){
    throw new ApiError(400, "fullName and email must be filled")
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email
      }
    },
    {new: true, select: "-password -refreshToken"}
  )

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    user,
    "updated user successfully"
  ))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "avatar file missing")
  }

  const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath)

  if(!uploadedAvatar?.url){
    throw new ApiError(400, "error while uploading on cloudinary")
  }

  const user = await User.findById(user.req.user._id)

  if(user.avatarPublicId){
    await deleteFromCloudinary(user.avatarPublicId)
  }

  user.avatar = uploadedAvatar.url
  user.avatarPublicId = uploadedAvatar.public_id
  await user.save({validiteBeforeSave: false})


  return res
  .status(200)
  .json(new ApiResponse(
    200,
    {},
    "avatar successfully updated"
  ))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    return res.status(200).json(new ApiResponse(200, {}, "coverImage not uploaded"))
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage?.url){
    throw new ApiError(400, "error while uploading on cloudinary")
  }
  
  const user = await User.findById(req.user._id)

  if(user.coverImagePublicId){
    await deleteFromCloudinary(user.coverImagePublicId)
  }

  user.coverImage = uploadedcoverImage.url
  user.coverImagePublicId = uploadedcoverImage.public_id
  await user.save({validiteBeforeSave: false})

  return res
  .status(200)
  .json(new ApiResponse(
    200,
    {},
    "cover image successfully updated"
  ))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const {username} = req.params

  if(!username.trim()){
    throw new ApiError(404, "user not found")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignFeild: "channel",
        as: "subscribers"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignFeild: "subscriber",
        as: "subscribedTo"
      }
    },
    {
      $addFields: {
        subscibersCount: {
          $size: "$subscribers"
        },

        channelsSubscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: {$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        coverImage: 1,
        avatar: 1, 
        username: 1,
        subscriberCount: 1,
        channelsSubscribedToCount: 1,
        email: 1,
        isSubscribed: 1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404, "channel not found")
  }

  res
  .status(200)
  .json(
    new ApiResponse(200, channel[0], "user channel fetched successfully")
  )

})

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    userName: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addField: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    },

  ])

  if(!user || user.length === 0){
    throw new ApiError(404, "user not found")
  }

  return res
  .status(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "watch history fetched successfully"
    )
  )
})

export {
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  getCurrentUser,
  updateUserPassword,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}