const supabase = require("./supabase");


// ==========================================
// AUTH MIDDLEWARE
// ==========================================

async function requireAuth(req, res, next) {

    try {

        // Get Authorization header

        const authHeader =
            req.headers.authorization;


        // Check whether token exists

        if (!authHeader) {

            return res.status(401).json({
                error: "Authentication required"
            });

        }


        // Expected format:
        // Authorization: Bearer ACCESS_TOKEN

        const parts =
            authHeader.split(" ");


        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {

            return res.status(401).json({
                error: "Invalid authorization format"
            });

        }


        const token = parts[1];


        // Ask Supabase to verify the token

        const {
            data: {
                user
            },
            error
        } = await supabase.auth.getUser(token);


        // Invalid / expired token

        if (error || !user) {

            return res.status(401).json({
                error: "Invalid or expired authentication token"
            });

        }


        // Attach authenticated user
        // to the request

        req.user = user;


        // Continue to API route

        next();


    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );


        return res.status(401).json({
            error: "Authentication failed"
        });

    }

}


module.exports = {
    requireAuth
};