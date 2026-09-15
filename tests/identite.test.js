import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { persona, validatePersona } from '../public/js/persona.js';
import { createApp } from '../server/app.js';

// Tests rouges SPEC Etud'IA — critères 1 à 5.
// Ces tests échouent tant que persona.js, #accueil, #suggestions,
// la signature des réponses et la liste blanche sont absents.

const NOM = "Etud'IA";
const EMOJI = '🧑‍🎓';
const ACCUEIL = "Bonjour, je suis Etud'IA. Je t'aide à organiser tes révisions et ton temps de travail.";
const SUGGESTIONS = [
  'Comment organiser mes révisions ?',
  'Quelle méthode de travail choisir ?',
  'Comment rester concentré ?',
];

const compterSegments = (texte) => [...new Intl.Segmenter().segment(texte)].length;
const sansCommentaires = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const lire = async (fichier) => sansCommentaires(await readFile(new URL(`../public/${fichier}`, import.meta.url), 'utf8'));
const lireServeur = async () => sansCommentaires(await readFile(new URL('../server/app.js', import.meta.url), 'utf8'));

// Base valide pour tester chaque refus de validatePersona un par un.
const baseValide = () => ({ nom: NOM, emoji: EMOJI, accueil: ACCUEIL, suggestions: [...SUGGESTIONS] });

const echec = (resultat) => {
  assert.equal(resultat.ok, false);
  assert.ok(Array.isArray(resultat.erreurs));
  assert.ok(resultat.erreurs.length > 0);
  for (const erreur of resultat.erreurs) {
    assert.equal(typeof erreur, 'string');
    assert.ok(erreur.trim().length > 0);
  }
};

describe('Identité — valeurs exactes de persona (C1 à C4)', () => {
  it('T-N1 (C1) : le nom vaut Etud\'IA, 7 caractères après trim', () => {
    assert.equal(persona.nom, NOM);
    assert.equal(persona.nom.trim().length, NOM.length);
    assert.ok(persona.nom.trim().length >= 2);
    assert.ok(persona.nom.trim().length <= 20);
  });

  it('T-N2 (C2) : l\'emoji vaut 🧑‍🎓, un seul segment de graphème', () => {
    assert.equal(persona.emoji, EMOJI);
    assert.equal(compterSegments(persona.emoji), 1);
    // '🧑‍🎓'.length vaut 5 : c'est le piège documenté par la SPEC, pas la mesure.
    assert.equal(persona.emoji.length, 5);
  });

  it('T-N3 (C3) : l\'accueil est le message exact et contient le nom', () => {
    assert.equal(persona.accueil, ACCUEIL);
    assert.ok(persona.accueil.includes(persona.nom));
  });

  it('T-N4 (C4) : les suggestions sont les trois questions exactes', () => {
    assert.deepEqual(persona.suggestions, SUGGESTIONS);
  });
});

describe('Identité — validatePersona refuse un nom invalide', () => {
  it('T-N5 : refuse un nom qui n\'est pas une chaîne', () => {
    for (const nom of [undefined, null, 42, {}, []]) {
      echec(validatePersona({ ...baseValide(), nom }));
    }
  });

  it('T-N6 : refuse un nom de moins de 2 caractères après trim', () => {
    for (const nom of ['', ' ', 'a', ' a ']) {
      echec(validatePersona({ ...baseValide(), nom }));
    }
  });

  it('T-N7 : refuse un nom de plus de 20 caractères après trim', () => {
    echec(validatePersona({ ...baseValide(), nom: 'a'.repeat(21) }));
    echec(validatePersona({ ...baseValide(), nom: `  ${'a'.repeat(21)}  ` }));
  });

  it('T-N8 : accepte Etud\'IA', () => {
    assert.deepEqual(validatePersona(baseValide()), { ok: true });
  });
});

describe('Identité — validatePersona refuse un emoji invalide', () => {
  it('T-N9 : accepte 🧑‍🎓 mesuré en segments, pas en length', () => {
    assert.deepEqual(validatePersona(baseValide()), { ok: true });
    assert.equal(compterSegments(EMOJI), 1);
  });

  it('T-N10 : refuse deux emojis 🧑‍🎓📅', () => {
    echec(validatePersona({ ...baseValide(), emoji: '🧑‍🎓📅' }));
  });

  it('T-N11 : refuse du texte ab', () => {
    echec(validatePersona({ ...baseValide(), emoji: 'ab' }));
  });

  it('T-N12 : refuse une chaîne vide', () => {
    echec(validatePersona({ ...baseValide(), emoji: '' }));
  });
});

describe('Identité — validatePersona refuse un accueil ou des suggestions invalides', () => {
  it('T-N13 : refuse un accueil qui ne contient pas le nom', () => {
    echec(validatePersona({ ...baseValide(), accueil: 'Bonjour, je vais t\'aider à réviser.' }));
  });

  it('T-N14 : un échec renvoie { ok: false, erreurs: [texte non vide, …] }', () => {
    echec(validatePersona({ ...baseValide(), nom: '' }));
  });

  it('T-N15 : refuse des suggestions qui ne sont pas un tableau', () => {
    for (const suggestions of [null, 'texte', {}, undefined]) {
      echec(validatePersona({ ...baseValide(), suggestions }));
    }
  });

  it('T-N16 : refuse des suggestions qui n\'ont pas exactement trois éléments', () => {
    echec(validatePersona({ ...baseValide(), suggestions: [] }));
    echec(validatePersona({ ...baseValide(), suggestions: ['une', 'deux'] }));
    echec(validatePersona({ ...baseValide(), suggestions: ['une', 'deux', 'trois', 'quatre'] }));
  });

  it('T-N17 : refuse des suggestions avec un élément vide après trim', () => {
    echec(validatePersona({ ...baseValide(), suggestions: [SUGGESTIONS[0], '', SUGGESTIONS[2]] }));
    echec(validatePersona({ ...baseValide(), suggestions: [SUGGESTIONS[0], '   ', SUGGESTIONS[2]] }));
  });
});

describe('Identité — garde-fous statiques (fichiers servis, page, signature)', () => {
  it('T-N18 : persona.js ne touche ni à document, ni à window, ni à localStorage', async () => {
    assert.doesNotMatch(await lire('js/persona.js'), /\bdocument\b|\bwindow\b|localStorage/, 'persona.js reste pur : aucun accès à la page');
  });

  it('T-N19 : persona.js compte l\'emoji en segments de graphème', async () => {
    const code = await lire('js/persona.js');
    assert.match(code, /Intl\.Segmenter/, 'un seul emoji se mesure avec Intl.Segmenter');
    assert.match(code, /\.segment\(/, 'les segments sont comptés avec .segment(');
    assert.doesNotMatch(code, /emoji\s*\.\s*length/, 'l\'emoji ne se mesure jamais avec .length');
  });

  it('T-N20 : index.html contient #accueil et #suggestions hors de #messages', async () => {
    const brut = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
    assert.ok(brut.includes('id="accueil"'), '#accueil est présent');
    assert.ok(brut.includes('id="suggestions"'), '#suggestions est présent');
    assert.ok(brut.includes('id="messages"'), '#messages est présent');
    const debutMessages = brut.indexOf('id="messages"');
    const finMessages = brut.indexOf('</ul>', debutMessages);
    assert.ok(finMessages > debutMessages, '#messages est une liste fermée');
    for (const id of ['id="accueil"', 'id="suggestions"']) {
      const position = brut.indexOf(id);
      assert.ok(position < debutMessages || position > finMessages, `${id} est en dehors de #messages`);
    }
  });

  it('T-N21 : server/app.js met persona.js en liste blanche (FICHIERS et TYPES)', async () => {
    const code = await lireServeur();
    assert.match(code, /\/js\/persona\.js/, 'la route /js/persona.js est listée');
    assert.match(code, /js\/persona\.js/, 'le fichier js/persona.js a un MIME déclaré');
  });

  it('T-N22 : view.js signe avec persona.emoji et persona.nom, sans Cap Web', async () => {
    const code = await lire('js/view.js');
    assert.match(code, /persona\s*\.\s*emoji/, 'la signature utilise persona.emoji');
    assert.match(code, /persona\s*\.\s*nom/, 'la signature utilise persona.nom');
    assert.doesNotMatch(code, /Cap Web/, 'l\'ancien préfixe Cap Web a disparu');
  });
});

describe('Identité — serveur local (liste blanche)', () => {
  const nomFichier = fileURLToPath(import.meta.url);
  const publicDir = path.join(path.dirname(nomFichier), '..', 'public');

  let serveur;
  let baseUrl;

  before(async () => {
    const app = createApp({ publicDir, version: 'test-identite' });
    await new Promise((resolve) => {
      serveur = app.listen(0, '127.0.0.1', resolve);
    });
    const adresse = serveur.address();
    const port = typeof adresse === 'object' && adresse !== null ? adresse.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(
    () =>
      new Promise((resolve, reject) => {
        if (!serveur) {
          resolve();
          return;
        }
        serveur.close((erreur) => (erreur ? reject(erreur) : resolve()));
      }),
  );

  it('T-N21 (live) : GET /js/persona.js sert du JavaScript non vide', async () => {
    const reponse = await fetch(`${baseUrl}/js/persona.js`);
    assert.equal(reponse.status, 200);
    const mime = reponse.headers.get('content-type') ?? '';
    assert.ok(mime.includes('javascript'), `MIME JavaScript attendu, reçu : ${mime}`);
    const corps = await reponse.text();
    assert.ok(corps.trim().length > 0, 'persona.js servi ne doit pas être vide');
    assert.ok(corps.includes('persona'), 'le fichier servi expose persona');
  });
});
