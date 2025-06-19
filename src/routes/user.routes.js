import { Router } from "express";
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  updateUserDetails, 
  getCurrentUser, 
  updateUserPassword, 
  updateUserAvatar, 
  updateUserCoverImage, 
  getUserChannelProfile,
  getWatchHistory
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1
    }, 
    {
      name: "coverImage",
      maxCount: 1
    }]),
  registerUser)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-password").patch(verifyJWT, updateUserPassword)
router.route("/update-details").patch(verifyJWT, updateUserDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router