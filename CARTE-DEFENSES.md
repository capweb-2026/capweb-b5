# Carte des défenses

Chaque ligne dit quelle connerie est arrêtée, par quoi, et **où est la preuve** : le lien d'un run rouge ou d'une PR bloquée. Une barrière sans preuve ne compte pas.

| Connerie | Barrière qui l'arrête | Preuve (lien) | Checkpoint |
|---|---|---|---|
| Régression | Tests de contrat et CI obligatoire sur `main` | https://github.com/capweb-2026/capweb-b5/actions/runs/34945671238 : run rouge sur `main`, le socle sans `public/`. Le contrat ne trouvait pas `public/js/brain.js` : la chaîne a refusé un projet sans chatbot. <br>https://github.com/capweb-2026/capweb-b5/actions/runs/34976264345 : run rouge du commit `test:` de la PR #4, nos tests d'identité échouaient avant le code (`persona.js` introuvable). <br>https://github.com/capweb-2026/capweb-b5/pull/6 : PR piégée refusée, elle acceptait des messages jusqu'à 300 caractères ; `npm test` rouge sur le contrat « accepte 280 caractères et refuse 281 ». | CP1 |
| Test affaibli ou supprimé | `check:tests` (TEST-CHANGE obligatoire) et relecture | https://github.com/capweb-2026/capweb-b5/pull/7 : PR piégée refusée, elle remplaçait une assertion du contrat par une comparaison d'une valeur avec elle-même ; `check:tests` rouge, test existant modifié sans `TEST-CHANGE:`. | CP2 |
| Dépendance ajoutée | `check:deps` et `dependances-autorisees.json` | https://github.com/capweb-2026/capweb-b5/pull/8 : PR piégée refusée, elle ajoutait `dayjs` sans aucun code qui l'utilise ; `check:deps` rouge, dépendance absente de la liste autorisée. | CP2 |
| Secret exposé | | | CP3 |
| IA qui sort de son thème | | | CP3 |
| Faille (`innerHTML`, injection) | | | CP4 |
| Contrôle désactivé | | | CP4 |
| Action destructrice | | | CP4 |
