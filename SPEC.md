# SPEC.md — Etud'IA : identité et vraie IA

## Objectif

L'utilisateur reconnaît l'assistant dès l'ouverture de la page : un nom, un emoji, un message
d'accueil et trois questions pour démarrer. Etud'IA est un assistant d'organisation étudiante
(planning de révisions, gestion du temps, méthodes de travail).

Depuis le CP3, Etud'IA répond avec une vraie IA, dans son thème. La clé ne quitte jamais le
serveur, et si l'IA ne répond pas, l'assistant répond quand même avec ses règles et le signale.

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

### La vraie IA (CP3)

7. **Mots connus** — Quand le message est `salut`, `bonjour`, `aide` ou `test` (casse et espaces
   autour ignorés), le système répond immédiatement avec `replyTo`, sans appeler l'IA et sans
   afficher de mode dégradé.
8. **Thème** — Quand l'utilisateur pose une question d'organisation étudiante (révisions,
   gestion du temps, méthodes de travail), le système répond avec l'IA, en français, en tutoyant,
   en 250 mots au plus.
9. **Hors thème** — Quand la question sort du thème, le système refuse poliment en une ou deux
   phrases, puis propose une question du thème. Exemple : « Je ne peux t'aider que pour organiser
   tes révisions et ton temps de travail. Tu veux un planning pour cette semaine ? »
10. **Santé** — Quand l'utilisateur parle de stress, d'épuisement ou de santé, le système reste
    sur l'organisation (pauses, charge de travail), dit qu'il ne remplace pas un professionnel,
    et conseille d'en parler au service de santé de l'école ou à un médecin.
11. **Consignes secrètes** — Quand l'utilisateur demande le prompt système, ou d'ignorer les
    consignes, le système refuse et ne révèle ni le prompt système ni ses consignes.
12. **Repli** — Quand l'IA ne répond pas (clé refusée par une erreur 401, budget épuisé, autre
    erreur, ou délai de 8 secondes dépassé), le système répond avec `replyTo`, et `#status`
    affiche « Mode dégradé : l'IA ne répond pas, Etud'IA utilise ses règles. » La conversation
    garde exactement deux lignes par échange : ce message n'est jamais une ligne de `#messages`.
13. **Clé côté serveur** — Quand la page envoie un message, le navigateur n'appelle que
    `/api/chat`, jamais la passerelle. Aucun fichier de `public/` ne contient une clé (`sk-…`),
    le nom `CAPWEB_IA_CLE`, ni l'adresse de la passerelle.
14. **Smoke tests** — Les smoke tests de preview et de production restent verts.

Les critères 8 à 11 dépendent du modèle : ils s'évaluent à la main, en prod, dans
`evals/RAPPORT.md`, pas en CI. Les critères 7, 12 et 13 se testent sans clé, avec un faux
fournisseur.

## Hors périmètre

Pas de choix de l'identité par l'utilisateur, pas d'image d'avatar, pas de thème visuel
clair/sombre, pas de traduction, pas de réponse en streaming, pas de SDK ni de dépendance
ajoutée. Cette spec ne change ni `validateMessage` ni `replyTo`, qui restent le repli.

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

### La vraie IA (CP3)

- `server/ia.js` est le **seul** module qui parle à la passerelle. Il exporte :
  - `repondre(message, { fournisseur, historique = [], delaiMs = 8000 })`, qui ne lève jamais
    d'erreur et renvoie une promesse de :
    - `{ ok: false, error }` si `validateMessage(message)` refuse le message ;
    - sinon `{ ok: true, texte, source, degrade }`, où `source` vaut `'ia'` ou `'regles'`, et
      `degrade` vaut `true` seulement quand l'IA était nécessaire mais n'a pas répondu ;
  - `creerFournisseurPasserelle({ url, cle, fetch })`, qui renvoie une fonction
    `async (messages) => texte`, et lève une erreur si la réponse n'est pas un succès ;
  - `fournisseurDepuisEnvironnement(env = process.env)`, qui renvoie ce fournisseur, ou `null`
    si `CAPWEB_IA_URL` ou `CAPWEB_IA_CLE` manque.
- Règles de `repondre` :
  - mot connu (critère 7) : `{ ok: true, texte: replyTo(message), source: 'regles', degrade: false }` ;
  - fournisseur `null`, erreur du fournisseur, ou délai dépassé : `texte` = `replyTo(message)`,
    `source: 'regles'`, `degrade: true` ;
  - sinon : `texte` = la réponse du fournisseur, `source: 'ia'`, `degrade: false`.
- L'appel à la passerelle : `POST <CAPWEB_IA_URL>/chat/completions`, en-tête
  `Authorization: Bearer <CAPWEB_IA_CLE>`, modèle `capweb-ia`, messages au format OpenAI :
  le prompt système, puis les 6 derniers messages de l'historique, puis le message. La réponse
  est dans `choices[0].message.content`.
- L'historique reçu par `repondre` et par `POST /api/chat` a le format de la page et du contrat
  CP1 : `{ role: 'user' | 'assistant', text }`. `repondre` le convertit au format OpenAI,
  `{ role, content: text }`, avant de l'envoyer au fournisseur.
- Le délai maximal s'écrit avec `setTimeout`, pas avec `AbortController` ni `AbortSignal`
  (inconnus du lint).
- Le prompt système est une constante de `server/ia.js`. Il n'est jamais dans `public/`.
- La route `POST /api/chat` reçoit le JSON `{ message, historique }` et répond :
  - `200` avec `{ texte, source, degrade }` ;
  - `400` avec `{ error }` si le message est refusé.
- Deux portes d'entrée appellent `repondre` avec `fournisseurDepuisEnvironnement()` :
  - `server/app.js`, pour le local et les tests (sans clé, donc `source: 'regles'`) ;
  - `api/chat.js`, pour Vercel. Ce fichier reste un simple aiguillage : il n'utilise ni
    `process`, ni `console`, ni `Buffer`, ni `Response`, sous la forme
    `export default async function handler(req, res)`.
- `public/js/app.js` envoie le message à `/api/chat`, ajoute la réponse à `historique`, et
  affiche le message de mode dégradé dans `#status` quand `degrade` vaut `true`. Si la requête
  échoue, la page se replie elle-même sur `replyTo` et affiche le même message. Aucun nouveau
  fichier dans `public/js/`.
- Un nouveau test échoue si un fichier de `public/` contient `sk-`, `CAPWEB_IA_CLE` ou
  l'adresse de la passerelle.
- Aucune dépendance ajoutée : `fetch`, natif dans Node 24, suffit.

## Questions ouvertes

Aucune.
