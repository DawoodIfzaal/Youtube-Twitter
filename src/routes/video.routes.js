import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
  updateVideo,
  deleteVideo,
  getVideoById,
  publishAVideo, 
  togglePublishStatus 
} from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/publish-video").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1
    },
    {
      name: "thumbnail",
      maxCount: 1
    }
  ]),
  publishAVideo
)

router.route("/publish-toggle/:videoId").patch(togglePublishStatus)
router.route("/get-video/:videoId").get(getVideoById)
router.route("/delete-video/:videoId").delete(deleteVideo)
router.route("/update-video/:videoId").patch(upload.single("thumbnail"), updateVideo)

export default router