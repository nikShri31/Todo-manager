import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(
        401,
        "Unauthorized request, Access token Required !!!"
      );
    }

    // Verify the token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new ApiError(401, "Access token has expired.");
      }
      throw new ApiError(401, "Invalid access token.");
    }

    // find the user using access token & get user data from it
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token: User not found.");
    }

    // save this user in req.user now we can use it in logout or any other function
    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Authentication error: Invalid access token."
    );
  }
});
