# La Fraiserie Studio — PWA

## Contenu
- `index.html` : application
- `manifest.json` : configuration PWA
- `service-worker.js` : cache et fonctionnement hors connexion
- `icons/` : icônes de l’application

## Important
Une PWA doit être servie depuis HTTPS (ou localhost pour les tests). Ouvrir `index.html` directement en `file://` ne suffit généralement pas pour installer la PWA.

## Test local
Depuis ce dossier, lancer un serveur HTTP local, par exemple :
`python -m http.server 8000`

Puis ouvrir :
`http://localhost:8000/`

Pour une installation sur téléphone, publier ensuite le dossier sur un hébergement HTTPS.
