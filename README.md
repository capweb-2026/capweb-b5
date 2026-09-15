# Cap Web — le chatbot du binôme et son harnais

Ce dépôt contient votre assistant et tout ce qui l'empêche de casser : tests de contrat, contrôles, chaîne CI/CD et carte des défenses. Des agents peuvent écrire le code ; c'est vous qui décidez de ce qui entre dans `main` et de ce qui part en prod.

## Lancer en local

Avec Node 24.20 ou plus récent :

```sh
npm ci
npx playwright install chromium
npm start
```

Ouvrir `http://127.0.0.1:3000`.

## Vérifier

```sh
npm run verify
```

Cette commande enchaîne le lint, les tests (unitaires, contrat, harnais), le contrôle des dépendances et les tests navigateur. Tout doit être vert avant de proposer une PR.

## La chaîne

Chaque pull request passe par : **verifier** (les mêmes contrôles que `npm run verify`, plus les justifications des changements sensibles) → **preview** (déploiement de test) → **smoke-preview** (la page déployée répond). Chaque fusion dans `main` passe par : **verifier** → **production** (après approbation humaine) → **smoke-production** → **tag** `prod-<numéro>`. Le workflow **retour-arriere** remet en ligne un tag de prod.

## Les règles du harnais

1. L'agent ne touche jamais à git : l'humain commit, et le commit est la décision.
2. On ne délègue pas de code sans test vu rouge.
3. Zéro dépendance ajoutée sans justification : la CI refuse tout changement non justifié de `package.json`.
4. Modifier un test existant exige `TEST-CHANGE:` et une raison dans la description de la PR ; modifier la chaîne, les scripts ou les configurations exige `HARNAIS-CHANGE:`.
5. Le comportement de l'IA se vérifie par un jeu d'évaluation, hors CI ; la CI tourne sans clé.
6. `AGENTS.md` guide l'agent mais ne l'empêche de rien : ce qui bloque, ce sont la CI, la protection de `main`, les permissions de l'outil et l'approbation humaine.

## Les fichiers à connaître

- [`CARTE-DEFENSES.md`](CARTE-DEFENSES.md) : chaque connerie, sa barrière, sa preuve.
- `SPEC.md` et `AGENTS.md` : ajoutés au checkpoint CP2.
- `tests/contrat/` et `browser/contrat.spec.js` : le contrat fourni par le formateur. On ne les modifie pas.
