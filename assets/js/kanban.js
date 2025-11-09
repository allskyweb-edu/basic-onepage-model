// Kanban logic: load tasks (from localStorage or tasks.json), render, drag & drop, modals, import/export
const kanbanStateKey = "kanbanTasks_v1";
let tasks = [];

function uid(prefix = "t") {
	return prefix + Math.random().toString(36).slice(2, 9);
}

async function loadTasks() {
	const saved = localStorage.getItem(kanbanStateKey);
	if (saved) {
		try {
			tasks = JSON.parse(saved);
			return;
		} catch (e) {
			console.warn("Invalid local tasks, fallback");
		}
	}
	// Try server API first (if running behind Express), fallback to data file
	try {
		const apiRes = await fetch("/kanban/tasks");
		if (apiRes.ok) {
			tasks = await apiRes.json();
			localStorage.setItem(kanbanStateKey, JSON.stringify(tasks));
			return;
		}
	} catch (e) {
		// ignore, try file
	}
	try {
		const res = await fetch("../data/tasks.json");
		if (res.ok) {
			tasks = await res.json();
			localStorage.setItem(kanbanStateKey, JSON.stringify(tasks));
			return;
		}
	} catch (e) {
		console.warn("Could not fetch tasks.json", e);
	}
	tasks = [];
}

function saveTasks() {
	localStorage.setItem(kanbanStateKey, JSON.stringify(tasks));
	// try send to server to persist
	fetch("/kanban/tasks", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(tasks),
	}).catch(() => {});
	renderBoard();
}

function renderBoard() {
	const cols = { todo: 0, doing: 1, done: 2 };
	["todo", "doing", "done"].forEach((status) => {
		const list = document.querySelector(`#col-${status} .cards-list`);
		if (!list) return;
		list.innerHTML = "";
		const filtered = tasks.filter((t) => t.status === status);
		filtered.forEach((t) => {
			const card = document.createElement("div");
			card.className = "card-item";
			card.draggable = true;
			card.dataset.id = t.id;
			card.innerHTML = `<div class="card-title">${escapeHtml(
				t.title
			)}</div><div class="card-desc">${escapeHtml(t.description || "")}</div>`;
			card.addEventListener("dragstart", onDragStart);
			card.addEventListener("dragend", onDragEnd);
			card.addEventListener("dblclick", () => openEditModal(t.id));
			list.appendChild(card);
		});
		const count = document.querySelector(`#col-${status} .col-count`);
		if (count) count.textContent = filtered.length + " tâches";
	});
}

function onDragStart(e) {
	e.dataTransfer.setData("text/plain", e.target.dataset.id);
	e.target.classList.add("dragging");
}
function onDragEnd(e) {
	e.target.classList.remove("dragging");
}

function setupDropZones() {
	["todo", "doing", "done"].forEach((status) => {
		const zone = document.getElementById(`col-${status}`);
		if (!zone) return;
		zone.addEventListener("dragover", (e) => {
			e.preventDefault();
			zone.classList.add("drag-over");
		});
		zone.addEventListener("dragleave", (e) =>
			zone.classList.remove("drag-over")
		);
		zone.addEventListener("drop", (e) => {
			e.preventDefault();
			zone.classList.remove("drag-over");
			const id = e.dataTransfer.getData("text/plain");
			const t = tasks.find((x) => x.id === id);
			if (t) {
				t.status = status;
				saveTasks();
			}
		});
	});
}

/* Modals */
function openAddModal() {
	const el = document.getElementById("modal-add");
	if (!el) return;
	el.classList.add("open");
	const form = document.getElementById("add-form");
	if (form) form.reset();
}
function closeAddModal() {
	const el = document.getElementById("modal-add");
	if (el) el.classList.remove("open");
}

function openEditModal(id) {
	const t = tasks.find((x) => x.id === id);
	if (!t) return;
	const form = document.getElementById("edit-form");
	if (!form) return;
	form.elements["id"].value = t.id;
	form.elements["title"].value = t.title;
	form.elements["description"].value = t.description || "";
	form.elements["status"].value = t.status;
	document.getElementById("modal-edit").classList.add("open");
}
function closeEditModal() {
	const el = document.getElementById("modal-edit");
	if (el) el.classList.remove("open");
}

function openDeleteModal(id) {
	const el = document.getElementById("del-id");
	if (el) el.value = id;
	const m = document.getElementById("modal-delete");
	if (m) m.classList.add("open");
}
function closeDeleteModal() {
	const el = document.getElementById("modal-delete");
	if (el) el.classList.remove("open");
}

function bindForms() {
	const addForm = document.getElementById("add-form");
	if (addForm)
		addForm.addEventListener("submit", (e) => {
			e.preventDefault();
			const title = e.target.title.value.trim();
			const desc = e.target.description.value.trim();
			if (!title) return alert("Titre requis");
			const t = { id: uid(), title, description: desc, status: "todo" };
			tasks.unshift(t);
			saveTasks();
			closeAddModal();
		});

	const editForm = document.getElementById("edit-form");
	if (editForm)
		editForm.addEventListener("submit", (e) => {
			e.preventDefault();
			const id = e.target.id.value;
			const t = tasks.find((x) => x.id === id);
			if (!t) return;
			t.title = e.target.title.value.trim();
			t.description = e.target.description.value.trim();
			t.status = e.target.status.value;
			saveTasks();
			closeEditModal();
		});

	const deleteForm = document.getElementById("delete-form");
	if (deleteForm)
		deleteForm.addEventListener("submit", (e) => {
			e.preventDefault();
			const id = document.getElementById("del-id").value;
			tasks = tasks.filter((x) => x.id !== id);
			saveTasks();
			closeDeleteModal();
		});
}

function setupUI() {
	const addBtn = document.getElementById("btn-add");
	if (addBtn) addBtn.addEventListener("click", openAddModal);
	const exportBtn = document.getElementById("btn-export");
	if (exportBtn) exportBtn.addEventListener("click", exportTasksFile);
	const importTrigger = document.getElementById("btn-import-trigger");
	if (importTrigger)
		importTrigger.addEventListener("click", () =>
			document.getElementById("file-import").click()
		);
	const fileInput = document.getElementById("file-import");
	if (fileInput) fileInput.addEventListener("change", handleImportFile);
	// delegate edit clicks
	document.addEventListener("click", (e) => {
		if (e.target.matches(".card-item .card-title")) {
			const id = e.target.closest(".card-item").dataset.id;
			openEditModal(id);
		}
	});
}

function exportTasksFile() {
	const blob = new Blob([JSON.stringify(tasks, null, 2)], {
		type: "application/json",
	});
	const a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = "tasks.json";
	document.body.appendChild(a);
	a.click();
	a.remove();
}

function handleImportFile(e) {
	const f = e.target.files[0];
	if (!f) return;
	const reader = new FileReader();
	reader.onload = () => {
		try {
			const parsed = JSON.parse(reader.result);
			if (Array.isArray(parsed)) {
				tasks = parsed;
				saveTasks();
				alert("Import OK");
			} else alert("Format JSON invalide");
		} catch (err) {
			alert("Erreur lecture JSON");
		}
	};
	reader.readAsText(f);
}

function escapeHtml(s) {
	return String(s).replace(
		/[&<>"']/g,
		(c) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
				c
			])
	);
}

/* init */
document.addEventListener("DOMContentLoaded", async () => {
	document.body.classList.add("kanban-body");
	await loadTasks();
	renderBoard();
	setupDropZones();
	bindForms();
	setupUI();
});
