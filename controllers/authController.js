// Minimal auth controller (for development/demo only)
const fs = require("fs");
const path = require("path");

function loadUsers() {
	const p = path.join(__dirname, "..", "data", "users.json");
	try {
		const raw = fs.readFileSync(p, "utf8");
		const parsed = JSON.parse(raw);
		return parsed;
	} catch (e) {
		// fallback to defaults
		return { admin: process.env.DEV_PASS || "re-admin" };
	}
}

const USERS = loadUsers();

exports.renderLogin = (req, res) => {
	res.render("login", { error: null });
};

exports.handleLogin = (req, res) => {
	const { username, password } = req.body || {};
	const expected = USERS[username];
	// Accept if exact match in users file, otherwise fallback to env/default
	const fallbackUser = process.env.DEV_USER || "admin";
	const fallbackPass = process.env.DEV_PASS || "re-admin";

	const ok =
		(expected && password === expected) ||
		(username === fallbackUser && password === fallbackPass);
	if (ok) {
		req.session.user = { username };
		if (
			req.xhr ||
			(req.headers.accept &&
				req.headers.accept.indexOf("application/json") !== -1)
		) {
			return res.json({ authenticated: true });
		}
		return res.redirect("/kanban");
	}

	if (
		req.xhr ||
		(req.headers.accept &&
			req.headers.accept.indexOf("application/json") !== -1)
	) {
		return res.status(401).json({ error: "Identifiants invalides" });
	}
	res.status(401).render("login", { error: "Identifiants invalides" });
};

exports.handleLogout = (req, res) => {
	req.session.destroy(() => res.redirect("/"));
};

exports.status = (req, res) => {
	res.json({ authenticated: !!(req.session && req.session.user) });
};
