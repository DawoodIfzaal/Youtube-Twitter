import { Router } from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {
  addVideoToPlaylist,
  createPlaylist,
  getPlaylistById,
  removeVideoFromPlaylist,
  updatePlaylist,
  deletePlaylist,
  getUserPlaylists
} from "../controllers/playlist.controller.js"

const router = Router()

router.use(verifyJWT)

router.route("/create-playlist").post(createPlaylist)
router.route("/get-playlist/:playlistId").get(getPlaylistById)
router.route("/add-video/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove-video/:videoId/:playlistId").patch(removeVideoFromPlaylist)
router.route("/update-playlist/:playlistId").patch(updatePlaylist)
router.route("/delete-playlist/:playlistId").delete(deletePlaylist)
router.route("/get-all-playlists/:userId").get(getUserPlaylists)

export default router