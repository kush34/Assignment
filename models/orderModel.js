import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
    user_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
})

const Order = mongoose.model("Order",orderSchema);

export default Order;