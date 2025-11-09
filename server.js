const path = require("path");
const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");

const kanbanRouter = require("./routes/kanbanRouter");
const authRouter = require("./routes/authRouter");

const app = express();
const PORT = process.env.PORT || 3000;

// Views
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
	session({
		secret: process.env.SESSION_SECRET || "dev-secret",
		resave: false,
		saveUninitialized: false,
		cookie: { secure: false },
	})
);

// Static assets
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/data", express.static(path.join(__dirname, "data")));
app.use("/", express.static(path.join(__dirname)));

// Simple request logger (debug)
app.use((req, res, next) => {
	console.log(`[req] ${req.method} ${req.url}`);
	next();
});

// Allow OPTIONS preflight responses for any route (helps fetch with JSON preflight)
app.use((req, res, next) => {
	if (req.method === "OPTIONS") {
		// minimal headers to satisfy preflight
		res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
		res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
		res.header(
			"Access-Control-Allow-Headers",
			req.headers["access-control-request-headers"] || "Content-Type, Accept"
		);
		return res.sendStatus(204);
	}
	next();
});

// Routers
app.use("/auth", authRouter);
app.use("/kanban", kanbanRouter);

// fallback root
app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () =>
	console.log(`Server listening http://localhost:${PORT}`)
);
