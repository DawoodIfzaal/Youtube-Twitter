import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
  addComment, 
  deleteComment, 
  getVideoComments, 
  updateComment
} from "../controllers/comment.controller.js"

const router = Router()

router.use(verifyJWT)

router.route("/add-comment/:videoId").post(addComment)
router.route("/update-comment/:commentId").patch(updateComment)
router.route("/delete-comment/:commendId").delete(deleteComment)
router.route("/get-video-comments/:videoId").get(getVideoComments)

export default router