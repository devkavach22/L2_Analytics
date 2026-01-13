import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    folderId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      required: true,
      default: null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    url: {
      type: String,
      required: true
    },

    extractedText: {
      type: String,
      default: ""
    },

    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Link", linkSchema);
