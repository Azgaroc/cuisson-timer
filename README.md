# 🥞 Pancake Timer

Application web mobile-first, installable en PWA, pour minuter et compter la cuisson de **crêpes**, **pancakes** et **gaufres**.

Aucun backend, aucune dépendance : uniquement HTML, CSS et JavaScript vanilla. Fonctionne hors-ligne une fois installée.

---

## ✨ Fonctionnalités

- 3 modes de cuisson : crêpe, pancake, gaufre
- Minuteur réglable par face (face 1 / face 2) pour crêpes et pancakes
- Minuteur à durée unique pour les gaufres
- Étapes affichées clairement : Face 1 → Retourner maintenant → Face 2 → Cuisson terminée
- Bouton contextuel "Nouvelle crêpe / Nouveau pancake / Nouvelle gaufre" qui relance un cycle et incrémente le compteur
- Compteurs indépendants par préparation + total global
- Réinitialisation des compteurs
- Réglages et compteurs sauvegardés dans le navigateur (`localStorage`)
- Alerte sonore discrète + vibration à chaque fin d'étape
- Mode sombre
- Interface 100% en français, grands boutons tactiles, pensée pour la cuisine
- Installable comme application sur iPhone et Android (PWA)

---

## 📁 Structure du projet

```
.
├── index.html          # Structure de la page
├── style.css           # Styles (mobile-first, mode sombre)
├── script.js           # Logique de l'application
├── manifest.json        # Manifeste PWA
├── service-worker.js    # Cache hors-ligne
├── README.md
└── assets/
    ├── icons/
    │   ├── icon-192.png
    │   └── icon-512.png
    └── sounds/
        └── beep.mp3
```

---

## 🚀 Installation locale

Aucune installation n'est requise, le projet est 100% statique.

1. Clonez ou téléchargez le dépôt :
   ```bash
   git clone https://github.com/VOTRE-COMPTE/cuisson-timer.git
   cd cuisson-timer
   ```
2. Lancez un petit serveur local (nécessaire pour que le service worker fonctionne) :
   ```bash
   npx serve .
   # ou
   python3 -m http.server 8080
   ```
3. Ouvrez `http://localhost:8080` dans votre navigateur (idéalement sur smartphone via le réseau local).

> ⚠️ Ouvrir directement `index.html` en double-cliquant (protocole `file://`) fonctionne pour tester l'interface, mais le service worker et l'installation PWA nécessitent un serveur HTTP (local ou en ligne).

---

## 📱 Utilisation

1. **Choisir un mode** : appuyez sur Crêpe, Pancake ou Gaufre en haut de l'écran.
2. **Ajuster les temps** : modifiez la durée de la face 1 (et face 2 si applicable) directement dans les champs.
3. **Démarrer** : appuyez sur le grand bouton orange "Démarrer".
4. **Retourner** : quand l'indicateur affiche "🔄 Retournez maintenant !", retournez votre crêpe/pancake et appuyez sur "Face 2 : Démarrer".
5. **Terminer** : à la fin du cycle, un bip sonore et une vibration signalent la fin, l'indicateur passe au vert "✅ Cuisson terminée !".
6. **Relancer** : appuyez sur le bouton "Nouvelle crêpe / pancake / gaufre" pour incrémenter le compteur et relancer immédiatement un nouveau cycle.

Les compteurs sont visibles en bas de l'écran et se mettent à jour en temps réel. Un bouton permet de tout remettre à zéro.

### Ajouter l'application sur l'écran d'accueil

**iPhone (Safari)** : ouvrez le site → bouton Partager → "Sur l'écran d'accueil".

**Android (Chrome)** : ouvrez le site → menu ⋮ → "Ajouter à l'écran d'accueil" (ou bannière d'installation automatique).

---

## 🎨 Personnalisation

### Modifier les durées par défaut

Dans `script.js`, changez les valeurs de `defaultDurations` dans l'objet `MODES` :

```js
const MODES = {
  crepe: {
    defaultDurations: { face1: 45, face2: 30 }, // en secondes
    ...
  },
  ...
};
```

### Modifier les couleurs / thème

Toutes les couleurs sont centralisées dans les variables CSS en haut de `style.css` :

```css
:root {
  --accent: #ff8a3d;
  --success: #22c55e;
  ...
}
```

### Remplacer le son d'alerte

Remplacez le fichier `assets/sounds/beep.mp3` par un autre son court (format mp3, quelques centaines de ko max recommandé).

### Ajouter un nouveau mode de cuisson

Ajoutez une entrée dans l'objet `MODES` de `script.js`, un bouton correspondant dans `.mode-selector` de `index.html`, et une entrée initiale dans l'objet `counters`.

---

## 🌐 Publication sur GitHub Pages

1. Poussez le projet sur un dépôt GitHub :
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Cuisson Timer"
   git branch -M main
   git remote add origin https://github.com/VOTRE-COMPTE/cuisson-timer.git
   git push -u origin main
   ```
2. Sur GitHub, allez dans **Settings → Pages**.
3. Sous "Build and deployment", sélectionnez **Deploy from a branch**, branche `main`, dossier `/ (root)`.
4. Enregistrez. L'application sera disponible à l'adresse :
   ```
   https://VOTRE-COMPTE.github.io/cuisson-timer/
   ```
5. Attendez 1 à 2 minutes puis testez l'URL sur votre smartphone. Vous pourrez alors l'installer en PWA.

> 💡 Le `manifest.json` utilise des chemins relatifs (`./`), ce qui garantit la compatibilité avec GitHub Pages même si le dépôt n'est pas à la racine du domaine.

---

## 🔧 Détails techniques

- **Aucune dépendance externe** : pas de framework, pas de build step.
- **Persistance** : `localStorage` pour les réglages (`cuissonTimer.settings`), les compteurs (`cuissonTimer.counters`) et le thème (`cuissonTimer.theme`).
- **Minuteur fiable** : basé sur `setInterval` à 1 seconde, avec vérification de l'état `isRunning` à chaque tick.
- **Vibration** : utilise l'API `navigator.vibrate()` si supportée (Android principalement ; iOS Safari ne la supporte pas nativement, dégradation silencieuse).
- **Son** : élément `<audio>` HTML5, lecture déclenchée par JavaScript.
- **Hors-ligne** : le service worker met en cache les fichiers statiques essentiels lors de la première visite.

---

## 🔮 Améliorations futures possibles

- Ajouter un historique des cuissons (date, mode, durée réelle)
- Ajouter une notification "wake lock" pour empêcher l'écran de s'éteindre pendant la cuisson
- Ajouter un choix de sons d'alerte personnalisables
- Ajouter un mode "plusieurs crêpes en parallèle" (plaque à plusieurs empreintes)
- Export/import des réglages et compteurs (fichier JSON)
- Ajouter des statistiques (temps moyen, nombre par jour/semaine)
- Ajouter un écran de réglages dédié avec plus d'options (langues, unités)
- Ajouter des animations de transition plus poussées entre les étapes
- Support multilingue (anglais, etc.)
- Icônes PWA plus travaillées (illustrations dédiées crêpe/pancake/gaufre)
