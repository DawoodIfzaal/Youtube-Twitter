import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js"

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


  // receive user details from frontend
  const {fullName, email, username, password} = req.body
  console.log("email: ", email);
  
  //validation for empty fields
  if(
    [fullName, email, username, password].some((field) => {
      field?.trim() === ""
    })
  ){
    throw new ApiError(400, "All the fields are required")
  }

  //check if user already exists - with username and email
  const existedUser = User.findOne({$or : [{username}, {email}]})

  if(existedUser){
    throw new ApiError (409, "user with email or username already exists")
  }

  // check for images - for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path //multer provides .files method
  const coverImageLocalPath = req.files?.coverImage[0]?.path

  if(!avatarLocalPath){
    throw new ApiError(400, "avatar file is required")
  }

  // upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "avatar file is required")
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

export {registerUser}