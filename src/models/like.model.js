import mongoose, {Schema} from "mongoose"

const likeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },

    targetId: {
      type: Schema.Types.ObjectId
    },

    targetModel: {
      type: String,
      enum: ["Video", "Tweet", "Comment"]
    },

    isLike: {
      type: Boolean
    }
  },
  {timestamps: true}
)

export const Like = mongoose.model("Like", likeSchema)