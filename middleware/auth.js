exports.requireAuth = (req, res, next) => {
	if (req.session && req.session.user) return next();
	// if AJAX request, return 401 json
	if (req.xhr || req.headers.accept.indexOf("json") > -1)
		return res.status(401).json({ error: "Unauthorized" });
	res.redirect("/auth/login");
};
