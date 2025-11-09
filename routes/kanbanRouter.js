const express = require("express");
const router = express.Router();
const kanbanController = require("../controllers/kanbanController");
const { requireAuth } = require("../middleware/auth");

// Render Kanban UI (protected)
router.get("/", requireAuth, kanbanController.renderKanban);

// API endpoints for tasks (protected)
router.get("/tasks", requireAuth, kanbanController.getTasks);
router.post("/tasks", requireAuth, kanbanController.saveTasks);

module.exports = router;
