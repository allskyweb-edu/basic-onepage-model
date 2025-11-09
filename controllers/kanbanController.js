const path = require("path");
const taskMapper = require("../mappers/taskMapper");

exports.renderKanban = async (req, res) => {
	// Render EJS view (server-side) for the Kanban app
	res.render("kanban", { user: req.session.user || null });
};

exports.getTasks = async (req, res) => {
	try {
		const tasks = await taskMapper.readTasks();
		res.json(tasks);
	} catch (err) {
		res.status(500).json({ error: "Impossible de lire les tâches" });
	}
};

exports.saveTasks = async (req, res) => {
	const payload = req.body;
	if (!Array.isArray(payload))
		return res.status(400).json({ error: "Format attendu: tableau de tâches" });
	try {
		await taskMapper.writeTasks(payload);
		res.json({ ok: true });
	} catch (err) {
		res.status(500).json({ error: "Impossible de sauvegarder les tâches" });
	}
};
