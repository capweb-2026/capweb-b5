import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repondre, fournisseurDepuisEnvironnement } from '../server/ia.js';
import { replyTo } from '../public/js/brain.js';
import { createApp } from '../server/app.js';

// Tests rouges SPEC Etud'IA CP3 — critères 7 et 12, route /api/chat.
// Aucun test n'utilise de vraie clé ni la vraie passerelle : faux fournisseurs uniquement.

const QUESTION = 'Comment planifier mes révisions de maths ?';

// Faux fournisseur qui enregistre ses appels.
const espion = (reponse = 'Réponse de la fausse IA.') => {
  const appels = [];
  const fournisseur = async (messages) => {
    appels.push(messages);
    return reponse;
  };
  return { fournisseur, appels };
};

describe('repondre : mots connus (critère 7)', () => {
  for (const mot of ['salut', 'BONJOUR', ' aide ']) {
    it(`répond avec les règles sans appeler l'IA pour ${JSON.stringify(mot)}`, async () => {
      const { fournisseur, appels } = espion();
      const resultat = await repondre(mot, { fournisseur });
      assert.deepEqual(resultat, { ok: true, texte: replyTo(mot), source: 'regles', degrade: false });
      assert.equal(appels.length, 0);
    });
  }
});

describe('repondre : IA et repli (critère 12)', () => {
  it('renvoie le texte du fournisseur quand il répond', async () => {
    const { fournisseur } = espion('Fais un planning sur deux semaines.');
    const resultat = await repondre(QUESTION, { fournisseur });
    assert.deepEqual(resultat, { ok: true, texte: 'Fais un planning sur deux semaines.', source: 'ia', degrade: false });
  });

  it('se replie sur les règles quand le fournisseur lève une erreur', async () => {
    const fournisseur = async () => {
      throw new Error('401 clé refusée');
    };
    const resultat = await repondre(QUESTION, { fournisseur });
    assert.deepEqual(resultat, { ok: true, texte: replyTo(QUESTION), source: 'regles', degrade: true });
  });

  it('se replie sur les règles quand le fournisseur dépasse le délai', async () => {
    // Promesse qui ne se résout jamais : seul le délai peut terminer l'appel.
    const fournisseur = () => new Promise(() => {});
    const debut = performance.now();
    const resultat = await repondre(QUESTION, { fournisseur, delaiMs: 50 });
    const duree = performance.now() - debut;
    assert.deepEqual(resultat, { ok: true, texte: replyTo(QUESTION), source: 'regles', degrade: true });
    assert.ok(duree < 1000, `réponse obtenue en ${Math.round(duree)} ms, délai de 50 ms`);
  });

  it('se replie sur les règles quand le fournisseur est null', async () => {
    const resultat = await repondre(QUESTION, { fournisseur: null });
    assert.deepEqual(resultat, { ok: true, texte: replyTo(QUESTION), source: 'regles', degrade: true });
  });
});

describe('repondre : message refusé', () => {
  for (const message of ['', '   ']) {
    it(`renvoie ok false pour ${JSON.stringify(message)}`, async () => {
      const { fournisseur, appels } = espion();
      const resultat = await repondre(message, { fournisseur });
      assert.equal(resultat.ok, false);
      assert.equal(typeof resultat.error, 'string');
      assert.ok(resultat.error.length > 0);
      assert.equal(appels.length, 0);
    });
  }
});

describe('repondre : messages envoyés au fournisseur', () => {
  it('commence par le prompt système et garde au plus les 6 derniers messages', async () => {
    const historique = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `historique-${i}`,
    }));
    const { fournisseur, appels } = espion();
    await repondre(QUESTION, { fournisseur, historique });

    assert.equal(appels.length, 1);
    const messages = appels[0];
    assert.equal(messages[0].role, 'system');
    assert.equal(typeof messages[0].content, 'string');
    assert.ok(messages[0].content.length > 0);

    const dernier = messages.at(-1);
    assert.equal(dernier.role, 'user');
    assert.equal(dernier.content, QUESTION);

    const extraits = messages.slice(1, -1);
    assert.ok(extraits.length <= 6);
    assert.deepEqual(extraits, historique.slice(-6));
  });
});

describe('fournisseurDepuisEnvironnement', () => {
  it('renvoie null si CAPWEB_IA_URL manque', () => {
    assert.equal(fournisseurDepuisEnvironnement({ CAPWEB_IA_CLE: 'fausse-cle-de-test' }), null);
  });

  it('renvoie null si CAPWEB_IA_CLE manque', () => {
    assert.equal(fournisseurDepuisEnvironnement({ CAPWEB_IA_URL: 'http://127.0.0.1:9' }), null);
  });

  it('renvoie null si les deux manquent', () => {
    assert.equal(fournisseurDepuisEnvironnement({}), null);
  });
});

describe('POST /api/chat sans clé', () => {
  const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
  const sauvegarde = {};
  let serveur;
  let baseUrl;

  before(async () => {
    // Garantit l'absence de clé, même si l'environnement en contient une.
    for (const nom of ['CAPWEB_IA_URL', 'CAPWEB_IA_CLE']) {
      sauvegarde[nom] = process.env[nom];
      delete process.env[nom];
    }
    const app = createApp({ publicDir, version: 'test-ia' });
    await new Promise((resolve) => {
      serveur = app.listen(0, '127.0.0.1', resolve);
    });
    baseUrl = `http://127.0.0.1:${serveur.address().port}`;
  });

  after(async () => {
    for (const [nom, valeur] of Object.entries(sauvegarde)) {
      if (valeur !== undefined) process.env[nom] = valeur;
    }
    if (serveur) await new Promise((resolve, reject) => serveur.close((e) => (e ? reject(e) : resolve())));
  });

  const envoyer = (corps) =>
    fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(corps),
    });

  it('répond 200 avec source regles', async () => {
    const reponse = await envoyer({ message: QUESTION, historique: [] });
    assert.equal(reponse.status, 200);
    const corps = await reponse.json();
    assert.equal(corps.source, 'regles');
    assert.equal(corps.texte, replyTo(QUESTION));
    assert.equal(typeof corps.degrade, 'boolean');
  });

  it('répond 400 avec une erreur pour un message vide', async () => {
    const reponse = await envoyer({ message: '', historique: [] });
    assert.equal(reponse.status, 400);
    const corps = await reponse.json();
    assert.equal(typeof corps.error, 'string');
  });
});
