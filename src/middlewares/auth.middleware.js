import { ApiError } from "../utils/apiError"
import { asyncHandler } from "../utils/asyncHandler"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler( async(req, _, next) => {

  try {
      //    Line	                 Purpose
    // const token = ...	 Looks for token in cookies(in browser) or headers(in mobile or postman)
    // if (!token)	       Denies access if no token
    // jwt.verify(...)	   Validates and decodes the JWT
    // User.findById(...)	 Gets the user info from DB
    // if (!user)	         Denies access if user not found
    // req.user = user	   Attaches user info to request
    // next()	             Passes control to next handler
    
      const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
      
      if (!token) {
        throw new ApiError(401, "unauthorized request")  
      }
    
      const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
      const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
      if(!user){
        throw new ApiError(401, "invalid access token")
      }
    
      req.user = user
      next()
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid access token")
  }
})