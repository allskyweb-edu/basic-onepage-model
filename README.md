# Portfolio One Page (HTML/CSS/JS)

# Portfolio One Page (HTML/CSS/JS)

Site one-page minimal et moderne construit en HTML, CSS et JavaScript.

Fonctionnalités

- Header avec zone logo/titre, navigation, bouton dark mode.
- Sections : hero, services, portfolio, contact.
- Footer.
- Design mobile-first, responsive.
- Dark mode mémorisé dans localStorage.
- Images remplacées par des carrés placeholders.
- Page Kanban (tableau de tâches) avec drag & drop, modales et import/export JSON.

Fichiers principaux

- `index.html` — page principale
- `styles.css` — styles globaux (mobile-first, variables CSS)
- `script.js` — darkmode, menu mobile, smooth scroll, validation du formulaire
- `kanban.html` — page Kanban (3 colonnes : À faire / En cours / Terminé)
- `kanban.css` — styles spécifiques pour le Kanban
- `kanban.js` — logique Kanban (drag & drop, modales, import/export)
- `tasks.json` — jeu de tâches d'exemple (chargé si aucune donnée en localStorage)
- `mentions-legales.html`, `plan-du-site.html` — pages légales et plan du site

Comment lancer localement

Dans un terminal, depuis le dossier du projet (contenant `index.html`) :

```bash
# Serveur statique Python (port 8000)
python3 -m http.server 8000
```

Ouvrir ensuite : http://localhost:8000

Serveur Express (optionnel)

Si tu veux lancer l'application avec le serveur Express (routes protégées, API pour sauvegarder les tâches), installe les dépendances et démarre le serveur :

```bash
cd /home/armandine/AllskyWeb-Learning/basic-onpage
npm install
npm start
```

Ensuite ouvre : http://localhost:3000

Par défaut, un compte de développement est disponible : `admin` / `password` (modifiable via les variables d'environnement `DEV_USER` / `DEV_PASS`).

Utilisation du Kanban

- Aller sur `kanban.html` (lien depuis la navigation ou le footer).
- Le tableau charge les tâches depuis `localStorage` si présentes, sinon depuis `tasks.json`.
- Drag & drop : glisser une carte vers une autre colonne pour changer son statut.
- Double-cliquer ou cliquer sur une carte ouvre la modale d'édition.
- Bouton "Ajouter une tâche" ouvre la modale d'ajout.
- Import/Export JSON : exporter télécharge l'état actuel ; importer permet de charger un fichier JSON valide pour remplacer l'état.
- Les changements sont sauvegardés en localStorage (clé : `kanbanTasks_v1`).

Limitation importante

Dans cette version statique, le navigateur ne peut pas écrire directement dans `tasks.json` sur le serveur. Si tu veux une sauvegarde centralisée :

- Option simple : exporter le JSON local et remplacer manuellement `tasks.json` sur le serveur.
- Option avancée : mettre en place un petit backend (par ex. Node/Express) avec un endpoint POST pour sauvegarder les tâches côté serveur. Si tu veux, je peux préparer un petit exemple d'API et les instructions pour l'exécuter.

Améliorations possibles

- Ajouter authentification et API pour synchroniser les tâches entre utilisateurs.
- Ajouter filtres/étiquettes/priorités sur les tâches.
- Ajouter animations & accessibilité pour le drag & drop.

Le projet contient maintenant un petit serveur Express, des routes EJS et une authentification minimale. Le Kanban est accessible via la route protégée `/kanban`.
