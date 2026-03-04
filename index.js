import express ,{urlencoded}from "express";
import { login } from "./Controller/userController.js";
import connectDB from "./config/database.js";
import User from "./models/userModel.js";
import Order from "./models/orderModel.js";
import axios from "axios";
import verifyToken from "./middleware/verifyToken.js";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import "dotenv/config";

connectDB();

const app = express();
app.use(cookieParser());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = process.env.PORT || 3000;


app.get("/", (req, res) => {
    const {from} = req.body;
     res.send(`Backend Working :${from}...`) 
});

app.post("/login", login)
app.post("/admin/wallet/credit", verifyToken, async (req, res) => {
    try {
        const { client_id, amount } = req.body;

        if (!client_id || typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({ message: "Invalid request data" });
        }

        const userdb = await User.findByIdAndUpdate(
            client_id,
            { $inc: { balance: amount } },
            { new: true }
        );

        if (!userdb) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Wallet credited successfully",
            balance: userdb.balance
        });

    } catch (error) {
        console.error("Wallet credit error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
app.post("/admin/wallet/debit", async (req, res) => {
    try {
        const { client_id, amount } = req.body;

        if (!client_id || typeof amount !== "number" || amount <= 0) {
            return res.status(400).json({ message: "Invalid request data" });
        }

        const userdb = await User.findByIdAndUpdate(
            client_id,
            { $inc: { balance: -amount } },
            { new: true }
        );

        if (!userdb) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Wallet debited successfully",
            balance: userdb.balance
        });

    } catch (error) {
        console.error("Wallet debit error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
})

app.post("/orders",verifyToken, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const client_id = req.headers["client-id"];
        const { amount } = req.body;

        if (!client_id || !amount || amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Invalid request data" });
        }

        const userdb = await User.findOneAndUpdate(
            {
                _id: client_id,
                balance: { $gte: amount } 
            },
            {
                $inc: { balance: -amount }
            },
            {
                new: true,
                session
            }
        );

        if (!userdb) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Insufficient balance" });
        }

        const order = await Order.create([{
            client_id,
            amount,
            status: "PENDING"
        }], { session });

        const fulfillmentResponse = await axios.get(
            "https://jsonplaceholder.typicode.com/posts"
        );
        console.log(fulfillmentResponse);
        const fulfillmentId = fulfillmentResponse.data.fulfillmentId;

        order[0].fulfillmentId = fulfillmentId;
        order[0].status = "COMPLETED";
        await order[0].save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(201).json(order[0]);

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log(error)
        return res.status(500).json({ message: "Order processing failed" });
    }
});

app.get("/balance",verifyToken, (req, res) => {
    try {
        const client_id = req.header("client-id");
        if (!client_id) {
            return res.status(400).json({ message: "Invalid request data" });
        }
        const userdb = User.findById(client_id);
        if (!userdb) {
            return res.status(400).json({ message: "Invalid request data" });
        }
        return res.send({ client_id, balance: userdb.balance });
    } catch (error) {
        console.error("Balance fetch error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
})

app.get("/orders/:order_id",verifyToken, async (req, res) => {
    try {
        const { order_id } = req.params;
        const clientId = req.header("client-id");

        if (!order_id) {
            return res.status(400).json({ message: "order_id is required in params" });
        }

        if (!clientId) {
            return res.status(400).json({ message: "client-id header is required" });
        }

        if (!mongoose.Types.ObjectId.isValid(order_id)) {
            return res.status(400).json({ message: "Invalid order_id format" });
        }

        const order = await Order.findOne({
            _id: order_id,
            client_id: clientId
        }).select("amount status fulfillment_id");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        return res.status(200).json({
            order_id: order._id,
            amount: order.amount,
            status: order.status,
            fulfillment_id: order.fulfillment_id
        });

    } catch (error) {
        console.error("Order fetch error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
})