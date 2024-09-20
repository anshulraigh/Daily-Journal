const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  public: { type: Boolean, default: false }, // Add public field (default is private)
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Add reference to User model
  createdAt: { type: Date, default: Date.now } // Add timestamp field
});

module.exports = mongoose.model("Post", postSchema);
