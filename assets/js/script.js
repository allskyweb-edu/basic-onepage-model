// Theme (dark/light) handling
const themeToggle = document.getElementById("theme-toggle");
const storedTheme = localStorage.getItem("theme");
const root = document.documentElement;

function applyTheme(theme) {
	if (theme === "dark") {
		root.setAttribute("data-theme", "dark");
		themeToggle.textContent = "☀️";
		themeToggle.setAttribute("aria-pressed", "true");
	} else {
		root.removeAttribute("data-theme");
		themeToggle.textContent = "🌙";
		themeToggle.setAttribute("aria-pressed", "false");
	}
}

// init theme
if (storedTheme) {
	applyTheme(storedTheme);
} else {
	// prefer dark if user OS prefers dark
	const prefersDark =
		window.matchMedia &&
		window.matchMedia("(prefers-color-scheme: dark)").matches;
	applyTheme(prefersDark ? "dark" : "light");
}

themeToggle &&
	themeToggle.addEventListener("click", () => {
		const isDark = root.getAttribute("data-theme") === "dark";
		const next = isDark ? "light" : "dark";
		applyTheme(next);
		localStorage.setItem("theme", next);
	});

// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle");
const header = document.querySelector(".site-header");
const siteNav = document.getElementById("site-nav");
navToggle &&
	navToggle.addEventListener("click", () => {
		const open = header.classList.toggle("header-open");
		navToggle.setAttribute("aria-expanded", open ? "true" : "false");
	});

// Smooth scroll for internal links
document.querySelectorAll('a[href^="#"]').forEach((a) => {
	a.addEventListener("click", (e) => {
		const href = a.getAttribute("href");
		if (href.length > 1) {
			e.preventDefault();
			const el = document.querySelector(href);
			if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
			// close mobile nav after click
			if (header.classList.contains("header-open")) {
				header.classList.remove("header-open");
				navToggle.setAttribute("aria-expanded", "false");
			}
		}
	});
});

// Contact form basic validation & feedback
const form = document.getElementById("contact-form");
const formMsg = document.getElementById("form-msg");
form &&
	form.addEventListener("submit", (ev) => {
		ev.preventDefault();
		const name = form.querySelector("#name").value.trim();
		const email = form.querySelector("#email").value.trim();
		const message = form.querySelector("#message").value.trim();
		if (!name || !email || !message) {
			formMsg.textContent = "Merci de compléter tous les champs.";
			formMsg.style.color = "var(--muted)";
			return;
		}
		// Simulate send
		formMsg.textContent = "Message envoyé — merci ! (simulation)";
		form.reset();
		setTimeout(() => (formMsg.textContent = ""), 4000);
	});

// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- Kanban link protection + inline login modal ---
(() => {
	const kanbanLinks = document.querySelectorAll('a[href="/kanban"]');
	if (!kanbanLinks || kanbanLinks.length === 0) return;

	const modal = document.getElementById("inline-login-modal");
	const form = document.getElementById("inline-login-form");
	const cancel = document.getElementById("inline-login-cancel");
	const err = document.getElementById("inline-login-error");

	let _previousActive = null;
	function showModal() {
		if (!modal) return;
		// store previously focused element to restore later
		_previousActive = document.activeElement;
		modal.style.display = "flex";
		// focus first input
		const first = modal.querySelector("input[name]");
		first && first.focus();
		// attach escape handler
		document.addEventListener("keydown", _escHandler);
	}
	function hideModal() {
		if (!modal) return;
		modal.style.display = "none";
		if (err) {
			err.style.display = "none";
			err.textContent = "";
		}
		form && form.reset();
		// restore focus
		try {
			if (_previousActive && typeof _previousActive.focus === "function")
				_previousActive.focus();
		} catch (e) {}
		_previousActive = null;
		document.removeEventListener("keydown", _escHandler);
	}

	// close modal on escape
	function _escHandler(e) {
		if (e.key === "Escape" || e.key === "Esc") {
			// hide any visible modal
			const open = document.querySelectorAll(".modal");
			open.forEach((m) => {
				if (m.style && m.style.display && m.style.display !== "none") {
					m.style.display = "none";
				}
			});
			if (err) {
				err.style.display = "none";
				err.textContent = "";
			}
			form && form.reset();
			// restore focus
			if (_previousActive && typeof _previousActive.focus === "function") {
				_previousActive.focus();
			}
			_previousActive = null;
			document.removeEventListener("keydown", _escHandler);
		}
	}

	// close modal when clicking on backdrop (outside panel)
	document.addEventListener("click", (ev) => {
		const t = ev.target;
		if (t && t.classList && t.classList.contains("modal")) {
			// clicked backdrop
			t.style.display = "none";
			if (err) {
				err.style.display = "none";
				err.textContent = "";
			}
			form && form.reset();
			if (_previousActive && typeof _previousActive.focus === "function")
				_previousActive.focus();
			_previousActive = null;
			document.removeEventListener("keydown", _escHandler);
		}
	});

	// check auth status via API
	async function checkAuth() {
		try {
			const res = await fetch("/auth/status");
			if (!res.ok) return false;
			const j = await res.json();
			return j && j.authenticated;
		} catch (e) {
			return false;
		}
	}

	// attach click handlers to all kanban links
	kanbanLinks.forEach((a) => {
		a.addEventListener("click", async (ev) => {
			// let normal local anchors proceed
			const href = a.getAttribute("href");
			if (!href || href.startsWith("#")) return;

			ev.preventDefault();
			const ok = await checkAuth();
			if (ok) {
				window.location.href = "/kanban";
			} else {
				showModal();
			}
		});
	});

	// cancel
	cancel &&
		cancel.addEventListener("click", (e) => {
			e.preventDefault();
			hideModal();
		});

	// submit inline login via ajax
	form &&
		form.addEventListener("submit", async (ev) => {
			ev.preventDefault();
			if (!form) return;
			const data = new FormData(form);
			const payload = {
				username: data.get("username"),
				password: data.get("password"),
			};
			try {
				const res = await fetch("/auth/login", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Accept: "application/json",
					},
					body: JSON.stringify(payload),
				});
				if (res.ok) {
					const j = await res.json();
					if (j && (j.authenticated || j.ok)) {
						// success -> navigate
						window.location.href = "/kanban";
						return;
					}
				}
				// failure
				const msg = await res.text().catch(() => "Erreur de connexion");
				if (err) {
					err.textContent = msg || "Échec de la connexion";
					err.style.display = "block";
				}
			} catch (e) {
				if (err) {
					err.textContent = "Erreur réseau";
					err.style.display = "block";
				}
			}
		});
})();
