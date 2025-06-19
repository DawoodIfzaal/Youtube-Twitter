import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
  addVideoToPlaylist,
  createPlaylist,
  getPlaylistById
} from "../controllers/playlist.controller.js"

const router = Router()

router.use(verifyJWT)

router.route("/create-playlist").post(createPlaylist)
router.route("/get-playlist/:playlistId").get(getPlaylistById)
router.route("/add-video/:videoId/:playlistId").patch(addVideoToPlaylist)


export default router