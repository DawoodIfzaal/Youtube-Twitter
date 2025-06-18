import {Router} from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
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


export default router