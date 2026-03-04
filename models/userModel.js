import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  balance: {
    type: Number,
    default: 0,
  }
})

const User = mongoose.model("User", userSchema);

export default User;
