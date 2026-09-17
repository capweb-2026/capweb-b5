import { repondre, fournisseurDepuisEnvironnement } from '../server/ia.js';

// Porte d'entrée Vercel : simple aiguillage vers server/ia.js.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }
  const corps = req.body && typeof req.body === 'object' ? req.body : {};
  const resultat = await repondre(corps.message, {
    fournisseur: fournisseurDepuisEnvironnement(),
    historique: corps.historique,
  });
  if (!resultat.ok) {
    res.status(400).json({ error: resultat.error });
    return;
  }
  res.status(200).json({ texte: resultat.texte, source: resultat.source, degrade: resultat.degrade });
}
