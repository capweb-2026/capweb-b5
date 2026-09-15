import { test, expect } from '@playwright/test';
/* global localStorage -- callbacks exécutés dans la page */

// Tests rouges SPEC Etud'IA — critères 1 à 5, dans un vrai navigateur.
// Ces tests échouent tant que le nom, l'emoji, #accueil, #suggestions
// et la signature « 🧑‍🎓 Etud'IA : » sont absents.

const NOM = "Etud'IA";
const EMOJI = '🧑‍🎓';
const ACCUEIL = "Bonjour, je suis Etud'IA. Je t'aide à organiser tes révisions et ton temps de travail.";
const SUGGESTIONS = [
  'Comment organiser mes révisions ?',
  'Quelle méthode de travail choisir ?',
  'Comment rester concentré ?',
];

function surveiller(page) {
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  return erreurs;
}

async function pageNeuve(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
}

async function envoyer(page, texte) {
  await page.locator('#message').fill(texte);
  await page.getByRole('button', { name: /envoyer/i }).click();
}

const lignes = (page) => page.locator('#messages li');

test.describe('Identité Etud\'IA — nom, emoji, accueil, suggestions, signature', () => {
  test('T-B1 (C1) : le titre principal affiche Etud\'IA', async ({ page }) => {
    const erreurs = surveiller(page);
    await pageNeuve(page);
    await expect(page.locator('h1')).toContainText(NOM);
    expect(erreurs).toHaveLength(0);
  });

  test('T-B2 (C2) : exactement un emoji 🧑‍🎓 à côté du nom', async ({ page }) => {
    await pageNeuve(page);
    const entete = page.locator('header');
    await expect(entete).toContainText(NOM);
    await expect(entete).toContainText(EMOJI);
    const texteEntete = (await entete.textContent()) ?? '';
    expect(texteEntete.split(EMOJI)).toHaveLength(2);
    const segments = await page.evaluate((emoji) => [...new Intl.Segmenter().segment(emoji)].length, EMOJI);
    expect(segments).toBe(1);
  });

  test('T-B3 (C3a) : à vide, #accueil affiche le message exact hors de #messages', async ({ page }) => {
    await pageNeuve(page);
    await expect(page.locator('#accueil')).toBeVisible();
    await expect(page.locator('#accueil')).toHaveText(ACCUEIL);
    await expect(page.locator('#accueil')).toContainText(NOM);
    await expect(page.locator('#messages #accueil')).toHaveCount(0);
    await expect(lignes(page)).toHaveCount(0);
  });

  test('T-B4 (C3b) : #accueil disparaît dès le premier message envoyé', async ({ page }) => {
    await pageNeuve(page);
    await expect(page.locator('#accueil')).toBeVisible();
    await envoyer(page, 'salut');
    await expect(lignes(page)).toHaveCount(2);
    await expect(page.locator('#accueil')).toBeHidden();
  });

  test('T-B5 (C3c) : #accueil revient quand la conversation est effacée', async ({ page }) => {
    await pageNeuve(page);
    await envoyer(page, 'salut');
    await expect(lignes(page)).toHaveCount(2);
    page.once('dialog', (d) => d.accept());
    await page.locator('#effacer').click();
    await expect(lignes(page)).toHaveCount(0);
    await expect(page.locator('#accueil')).toBeVisible();
    await expect(page.locator('#accueil')).toHaveText(ACCUEIL);
  });

  test('T-B6 (C4a) : #suggestions propose exactement les trois questions, hors de #messages', async ({ page }) => {
    await pageNeuve(page);
    await expect(page.locator('#messages #suggestions')).toHaveCount(0);
    const boutons = page.locator('#suggestions button');
    await expect(boutons).toHaveCount(3);
    for (let i = 0; i < SUGGESTIONS.length; i += 1) {
      await expect(boutons.nth(i)).toHaveText(SUGGESTIONS[i]);
    }
  });

  test('T-B7 (C4b) : cliquer une suggestion la place dans #message sans l\'envoyer', async ({ page }) => {
    await pageNeuve(page);
    await page.locator('#suggestions button').first().click();
    await expect(page.locator('#message')).toHaveValue(SUGGESTIONS[0]);
    await expect(lignes(page)).toHaveCount(0);
  });

  test('T-B8 (C5) : la réponse est signée « 🧑‍🎓 Etud\'IA : », l\'utilisateur garde « Vous : »', async ({ page }) => {
    const erreurs = surveiller(page);
    await pageNeuve(page);
    await envoyer(page, 'salut');
    await expect(lignes(page)).toHaveCount(2);
    const premiere = (await lignes(page).nth(0).textContent()) ?? '';
    const seconde = (await lignes(page).nth(1).textContent()) ?? '';
    expect(premiere.startsWith('Vous : ')).toBe(true);
    expect(seconde.startsWith(`${EMOJI} ${NOM} : `)).toBe(true);
    await expect(page.locator('#messages')).not.toContainText('Cap Web');
    expect(erreurs).toHaveLength(0);
  });
});
