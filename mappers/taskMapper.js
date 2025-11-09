const fs = require("fs").promises;
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "tasks.json");

async function readTasks() {
	try {
		const raw = await fs.readFile(DATA_FILE, "utf8");
		return JSON.parse(raw);
	} catch (err) {
		// If file doesn't exist or invalid, return empty array
		return [];
	}
}

async function writeTasks(tasks) {
	const str = JSON.stringify(tasks, null, 2);
	await fs.writeFile(DATA_FILE, str, "utf8");
}

module.exports = { readTasks, writeTasks };
