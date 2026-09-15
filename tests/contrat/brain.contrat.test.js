import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateMessage, replyTo } from '../../public/js/brain.js';

// Contrat CP1 fourni par le formateur. Ne pas modifier : c'est la spécification du chatbot de J1.
const sansCommentaires = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const lire = async (fichier) => sansCommentaires(await readFile(new URL(`../../public/js/${fichier}`, import.meta.url), 'utf8'));

describe('Contrat CP1 — validateMessage', () => {
  it('refuse ce qui n’est pas du texte, avec un message d’erreur', () => {
    for (const entree of [undefined, null, 42, {}, []]) {
      const r = validateMessage(entree);
      assert.equal(r.ok, false);
      assert.equal(typeof r.error, 'string');
      assert.ok(r.error.trim().length > 0);
    }
  });

  it('refuse le vide et les espaces seuls', () => {
    for (const entree of ['', ' ', '   \n\t ']) {
      const r = validateMessage(entree);
      assert.equal(r.ok, false);
      assert.ok(r.error.trim().length > 0);
    }
  });

  it('accepte un message et retire les espaces autour', () => {
    assert.deepEqual(validateMessage('  salut  '), { ok: true, value: 'salut' });
  });

  it('accepte 280 caractères et refuse 281', () => {
    assert.deepEqual(validateMessage('a'.repeat(280)), { ok: true, value: 'a'.repeat(280) });
    assert.equal(validateMessage('a'.repeat(281)).ok, false);
  });

  it('mesure la longueur après avoir retiré les espaces', () => {
    assert.equal(validateMessage(`  ${'a'.repeat(280)}  `).ok, true);
  });
});

describe('Contrat CP1 — replyTo', () => {
  it('répond toujours par un texte non vide', () => {
    for (const m of ['salut', 'aide', 'test', 'une phrase inconnue', '']) {
      const r = replyTo(m);
      assert.equal(typeof r, 'string');
      assert.ok(r.trim().length > 0);
    }
  });

  it('ignore la casse et les espaces autour', () => {
    assert.equal(replyTo('  SALUT '), replyTo('salut'));
    assert.equal(replyTo('Aide'), replyTo('aide'));
    assert.equal(replyTo(' TEST'), replyTo('test'));
  });

  it('donne la même réponse à « bonjour » et à « salut »', () => {
    assert.equal(replyTo('bonjour'), replyTo('salut'));
  });

  it('donne une réponse distincte à salut, aide et test', () => {
    assert.equal(new Set([replyTo('salut'), replyTo('aide'), replyTo('test')]).size, 3);
  });

  it('répond à une phrase inconnue par un repli distinct', () => {
    const repli = replyTo('parle-moi de la météo');
    assert.ok(![replyTo('salut'), replyTo('aide'), replyTo('test')].includes(repli));
  });
});

describe('Contrat CP1 — chaque module garde son rôle', () => {
  it('brain.js ne touche pas à la page', async () => {
    assert.doesNotMatch(await lire('brain.js'), /\bdocument\b|\bwindow\b|localStorage/, 'brain.js reste pur : aucun accès à la page');
  });

  it('view.js affiche du texte et ne décide pas des réponses', async () => {
    const code = await lire('view.js');
    assert.doesNotMatch(code, /innerHTML|outerHTML|insertAdjacentHTML/, 'affichage avec textContent uniquement');
    assert.doesNotMatch(code, /replyTo|validateMessage/, 'view.js ne décide pas des réponses');
  });

  it('app.js ne fabrique pas les lignes de la conversation', async () => {
    assert.doesNotMatch(await lire('app.js'), /createElement\(\s*['"]li['"]\s*\)/, 'la création des lignes appartient à view.js');
  });

  it('app.js n’injecte jamais de HTML', async () => {
    assert.doesNotMatch(await lire('app.js'), /innerHTML|outerHTML|insertAdjacentHTML/, 'le texte reste du texte, dans app.js aussi');
  });
});
