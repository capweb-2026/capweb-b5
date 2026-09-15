# SPEC.md — Identité d'Etud'IA

## Objectif

L'utilisateur reconnaît l'assistant dès l'ouverture de la page : un nom, un emoji, un message
d'accueil et trois questions pour démarrer. Etud'IA est un assistant d'organisation étudiante
(planning de révisions, gestion du temps, méthodes de travail).

## Critères d'acceptation

1. **Nom** — Quand la page s'ouvre, le système affiche `Etud'IA` dans le titre principal.
   Le nom, espaces autour retirés, fait de 2 à 20 caractères. `Etud'IA` en fait 7.
2. **Emoji** — Quand la page s'ouvre, le système affiche exactement un emoji, `🧑‍🎓`, à côté du nom.
   « Un seul emoji » se mesure en segments de graphème, pas en `length` :
   `[...new Intl.Segmenter().segment(emoji)].length` vaut `1`.
   `'🧑‍🎓'.length` vaut `5` (3 points de code dont un liant U+200D) et reste un seul emoji.
   Deux emojis (`🧑‍🎓📅`) sont refusés ; du texte (`ab`) est refusé ; une chaîne vide est refusée.
3. **Accueil** — Quand la conversation est vide, le système affiche le message d'accueil
   `Bonjour, je suis Etud'IA. Je t'aide à organiser tes révisions et ton temps de travail.`
   Ce message contient le nom. Il n'est pas une ligne de `#messages`, disparaît dès le premier
   message envoyé, et revient quand la conversation est effacée.
4. **Suggestions** — Quand la page s'ouvre, le système propose exactement trois questions :
   `Comment organiser mes révisions ?`, `Quelle méthode de travail choisir ?`,
   `Comment rester concentré ?`. Quand l'utilisateur clique sur l'une d'elles, le système la place
   dans `#message` sans l'envoyer : `#messages` ne gagne aucune ligne.
5. **Réponses signées** — Quand l'assistant répond, sa ligne commence par `🧑‍🎓 Etud'IA : `
   au lieu de `Cap Web : `. Les lignes de l'utilisateur gardent le préfixe `Vous : `.
6. **Contrat** — Les tests de contrat CP1 restent verts.

## Hors périmètre

Pas de choix de l'identité par l'utilisateur, pas d'image d'avatar, pas d'appel à une IA,
pas de thème visuel clair/sombre, pas de traduction. Les réponses restent celles du cerveau
à règles de `brain.js` : cette spec ne change ni `validateMessage` ni `replyTo`.

## Données et fonctions attendues

- `public/js/persona.js` exporte :
  - `persona = { nom, emoji, accueil, suggestions }`, où `suggestions` est un tableau de trois
    chaînes non vides ;
  - `validatePersona(persona)`, qui renvoie `{ ok: true }` ou `{ ok: false, erreurs: [texte, …] }`.
- `validatePersona` refuse : un `nom` qui n'est pas une chaîne, ou dont la longueur après `trim()`
  est inférieure à 2 ou supérieure à 20 ; un `emoji` dont le nombre de segments de graphème
  n'est pas exactement 1 ; un `accueil` qui ne contient pas le `nom` ; un `suggestions` qui n'est
  pas un tableau de trois éléments, ou dont un élément est vide après `trim()`.
- `persona.js` n'accède ni à `document`, ni à `window`, ni à `localStorage` : il est testable avec Node.
- `public/index.html` contient `#accueil` et `#suggestions`, tous deux en dehors de `#messages`.
- `view.js` signe les lignes de l'assistant avec `persona.emoji` et `persona.nom`.
- `persona.js` est ajouté à la liste blanche de `server/app.js`, dans `FICHIERS` et dans `TYPES`.

## Questions ouvertes

Aucune.
