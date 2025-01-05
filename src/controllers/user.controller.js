import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

//-----------------------------------------------------------------------------------------------

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);     // get user access
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};



// ******* Register user ******
const registerUser = asyncHandler(async (req, res) => {
 
  /******** getting user details from frontend */
  const { fullName, email, password } = req.body;
  console.log(req.body);
  console.log("email:", email);

 // checking input fields

  if (
    [fullName, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }

  /******* checking existed user --- User from user model */
  const existedUser = await User.findOne({
    $or: [ { email }],
  });
  if (existedUser) {
    throw new ApiError(409, "User Already Exists");
  }

  /******* create user and entry in db   */
  const user = await User.create({
    fullName,
    email,
    password,
  });

  /******check user is created or not & we dont want to send password and refresh token in db */
  const createdUser = await User.findById(user._id).select(
    " -password  -refreshToken "
  );

  if (!createdUser) {
    throw new ApiError(500, "user is not registered something went wrong !!!");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "user registered successfully"));
});


//**** Login User ****/
const loginUser = asyncHandler(async (req, res) => {
  // data from req.body
  const { email, password } = req.body;
  console.log(req.body);
  console.log(email);

  if ( !email) {
    throw new ApiError(400, " email is required");
  }

  //find the user
  const user = await User.findOne({
    $or: [ { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  //password check
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  //access and referesh token
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );

  // we pass logged-in-user in response of login
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  //send cookie and api response
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

// ***** Logout user *****
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id, // we are getting this from middleware
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  try {
    // verifying secrest token in env file & incoming refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // find user by decoded token
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // check if token has expired or not
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // cookie option
    const options = {
      httpOnly: true,
      secure: true,
    };

    // genrate new refresh and access token from the function for the user
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    // returning response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  //old and new password from body
  const { oldPassword, newPassword } = req.body;

  // find user from req.user
  const user = await User.findById(req.user?._id);
  // check first the old password is correct or not
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword); // boolean value

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  // assign new password in user and save it
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully")); 
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  // take fullname and email from body
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  //find the user and update the info
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password"); // remove password

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
};
