import * as userService from "../service/userService.js";

export const login = async (req, res) => {
    console.log(`req.body`,req.body);
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ status: "error", message: "Username and password required" });
    }

    try {
        const result = await userService.loginUser({ username, password });

        if (result.status === "error") {
            return res.status(Number(result.code)).json({ status: "error", message: result.message });
        }
        
        res.cookie('token', result.token)
        res.cookie('refreshtoken', result.refreshtoken)

        return res.json({ status: "success", token: result.token });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", message: "Internal server error" });
    }
};