import { Todo } from "../models/todo.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//----------------------------------------------------------------------------------------------

// create a todo
export const createTodo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // Validate input
  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const newTodo = await Todo.create({
    userId: req.user?._id,
    title,
    description,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newTodo, "Todo created successfully"));
});


//get all todos
export const getAllTodos = asyncHandler(async (req, res) => {

    const todos = await Todo.find({userId: req.user?._id});
    if (!todos.length) {
        throw new ApiError(404, "No todos found");
      }
    
      return res
        .status(200)
        .json(new ApiResponse(200, todos, "todos fetched successfully"))
});


//fetch a todo by id
export const getTodoById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const todo = await Todo.findOne({ _id: id, userId: req.user._id }); 

    if (!todo) {
      throw new ApiError(404, "todo not found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, todo, "Todo fetched successfully"));
});


//update todo status
export const updateTodoStatus = asyncHandler(async (req, res) => {

  const {id} = req.params;
  const {status} = req.body;

  // Validate status
  if (!["pending", "in-progress", "completed"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

    const todo = await Todo.findOneAndUpdate(
    { _id: id, userId: req.user?._id }, 
    { status },
    { new: true }
  );

   if (!todo) {
    throw new ApiError(404, "todo not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, todo, "Todo status updated successfully"));

});


//delete todo
export const deleteTodo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const todo = await Todo.findOneAndDelete({ _id: id, userId: req.user?._id }); 

  if (!todo) {
    throw new ApiError(404, "Todo not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Todo deleted successfully"));
});
