import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedVideo, toggleLike } from "../controllers/like.controller.js";


const router = Router()

router.use(verifyJWT)
router.route("/toggle-like").post(toggleLike)
router.route("/liked-videos/:userId").get(getLikedVideo)

export default router