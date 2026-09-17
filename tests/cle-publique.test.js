import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Test SPEC Etud'IA CP3 — critère 13 : aucun secret ni adresse de passerelle dans public/.

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

// L'adresse réelle n'est jamais écrite ici : on vérifie le chemin de l'API de la passerelle,
// et l'hôte de CAPWEB_IA_URL seulement s'il est défini dans l'environnement.
const interdits = ['sk-', 'CAPWEB_IA_CLE', '/chat/completions'];
if (process.env.CAPWEB_IA_URL) {
  try {
    interdits.push(new URL(process.env.CAPWEB_IA_URL).host);
  } catch {
    interdits.push(process.env.CAPWEB_IA_URL);
  }
}

test('aucun fichier de public/ ne contient de clé, CAPWEB_IA_CLE ni adresse de passerelle', async () => {
  const entrees = await readdir(publicDir, { recursive: true, withFileTypes: true });
  const fichiers = entrees.filter((e) => e.isFile()).map((e) => path.join(e.parentPath ?? e.path, e.name));
  assert.ok(fichiers.length > 0);

  for (const fichier of fichiers) {
    const contenu = await readFile(fichier, 'utf8');
    for (const motif of interdits) {
      // Le message ne répète pas le motif pour ne jamais afficher l'adresse de la passerelle.
      assert.ok(!contenu.includes(motif), `${path.relative(publicDir, fichier)} contient un motif interdit (n°${interdits.indexOf(motif) + 1})`);
    }
  }
});
