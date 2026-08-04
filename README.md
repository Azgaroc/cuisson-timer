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
- Compteurs indépendants par préparation + total global, dérivés de l'historique des préparations
- Historique par jour consultable dans un calendrier (onglet Stats), avec correction/suppression manuelle des entrées
- Trophées débloqués selon le nombre de préparations et la régularité
- Réglages et historique sauvegardés dans le navigateur (`localStorage`)
- Alerte sonore (bips synthétisés, pas de fichier audio) + vibration à chaque fin d'étape
- L'écran reste allumé pendant la cuisson (Screen Wake Lock API, quand le navigateur le supporte)
- Mode sombre
- Interface disponible en français, anglais, espagnol, allemand et portugais ; grands boutons tactiles, pensée pour la cuisine
- Installable comme application sur iPhone et Android (PWA), avec mise à jour automatique du cache hors-ligne

---

## 📁 Structure du projet

```
.
├── index.html          # Structure de la page
├── style.css           # Styles (mobile-first, mode sombre)
├── script.js           # Logique de l'application (minuteur, stats, réglages)
├── recipes.js           # Données des recettes (ingrédients, étapes)
├── translations.js      # Dictionnaire i18n (fr, en, es, de, pt)
├── manifest.json        # Manifeste PWA
├── service-worker.js    # Cache hors-ligne
├── README.md
└── assets/
    └── icons/
        ├── icon-192.png
        ├── icon-512.png
        └── apple-touch-icon-180.png
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

### Changer le son d'alerte

Les bips ne viennent pas d'un fichier audio : ils sont synthétisés au vol avec la Web Audio API (voir `beepTone()` dans `script.js`), ce qui évite les soucis de lecture audio bloquée sur mobile. Pour changer le son, ajustez la fréquence et la durée passées à `beepTone()` dans `playBeep()` et `playFinalAlert()`.

### Ajouter un nouveau mode de cuisson

Ajoutez une entrée dans l'objet `MODES` de `script.js` (avec ses `defaultDurations` et son `emoji`), un bouton correspondant dans `.mode-selector` et `.mode-chooser` de `index.html`, une entrée dans `RECIPES` (`recipes.js`) et les clés de traduction associées dans `translations.js`.

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
- **Persistance** : `localStorage` pour les réglages de durée (`cuissonTimer.settings`), les préférences (`cuissonTimer.prefs` : langue, son, vibration, mode sombre) et l'historique des préparations (`cuissonTimer.history`). Les compteurs affichés ne sont jamais stockés séparément : ils sont recalculés à partir de l'historique à chaque changement, ce qui évite toute désynchronisation entre le compteur et le calendrier.
- **Minuteur fiable en arrière-plan** : basé sur un horodatage de fin d'étape (et non sur un simple décompte à chaque tick), pour rester exact même si le navigateur suspend le `setInterval` pendant que l'app est en arrière-plan (écran verrouillé, changement d'appli).
- **Écran maintenu allumé** : Screen Wake Lock API pendant un cycle actif, redemandée automatiquement au retour au premier plan.
- **Vibration** : utilise l'API `navigator.vibrate()` si supportée (Android principalement ; iOS Safari ne la supporte pas nativement, dégradation silencieuse).
- **Son** : bips générés avec la Web Audio API (pas de fichier audio), débloqués dès le premier tap pour rester utilisables même déclenchés depuis un timer en arrière-plan sur iOS.
- **Hors-ligne** : le service worker utilise une stratégie *network-first* (toujours servir la version la plus fraîche quand le réseau répond, retomber sur le cache sinon), avec rechargement automatique de la page dès qu'une nouvelle version est activée.

---

## 🔮 Améliorations futures possibles

- Ajouter un choix de sons d'alerte personnalisables
- Ajouter un mode "plusieurs crêpes en parallèle" (plaque à plusieurs empreintes)
- Export/import des réglages et de l'historique (fichier JSON)
- Statistiques plus fines (temps moyen par préparation, tendance par semaine)
- Ajouter des animations de transition plus poussées entre les étapes
- Icônes PWA plus travaillées (illustrations dédiées crêpe/pancake/gaufre)
