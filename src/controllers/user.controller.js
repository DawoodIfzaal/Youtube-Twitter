import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js"

const generateAccessAndRefreshTokens = async(userId) => {
  const user = await User.findById(userId)
  const accessToken = user.generateAccessToken()
  const refreshToken = user.generateRefreshToken()

  user.refreshToken = refreshToken
  await user.save({ValiditeBeforeSave: false})

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
      coverImage: coverImage?.url || "",
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


export {registerUser, loginUser}