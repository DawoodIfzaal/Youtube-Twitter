import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { 
  createTweet, 
  deleteTweet, 
  updateTweet,
  getUserTweets
} from "../controllers/tweet.controller.js"

const router = Router()

router.use(verifyJWT)

router.route("/create-tweet").post(createTweet)
router.route("/update-tweet/:tweetId").patch(updateTweet)
router.route("/delete-tweet/:tweetId").delete(deleteTweet)
router.route("/get-tweets/:userId").get(getUserTweets)


export default router