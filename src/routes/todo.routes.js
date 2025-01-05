import express from "express";
import {
  createTodo,
  getAllTodos,
  getTodoById,
  updateTodoStatus,
  deleteTodo,
} from "../controllers/todo.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/tasks", verifyJWT, createTodo);
router.get("/tasks", verifyJWT, getAllTodos);
router.get("/tasks/:id", verifyJWT, getTodoById);
router.put("/tasks/:id", verifyJWT, updateTodoStatus);
router.delete("/tasks/:id", verifyJWT, deleteTodo);

export default router;
