export const persona = {
  nom: "Etud'IA",
  emoji: "🧑‍🎓",
  accueil:
    "Bonjour, je suis Etud'IA. Je t'aide à organiser tes révisions et ton temps de travail.",
  suggestions: [
    "Comment organiser mes révisions ?",
    "Quelle méthode de travail choisir ?",
    "Comment rester concentré ?",
  ],
};

function compterSegments(texte) {
  return [...new Intl.Segmenter().segment(texte)].length;
}

export function validatePersona(candidate) {
  const erreurs = [];
  const nom =
    candidate === null || typeof candidate !== "object"
      ? undefined
      : candidate.nom;
  const glyphe =
    candidate === null || typeof candidate !== "object"
      ? undefined
      : candidate.emoji;
  const accueil =
    candidate === null || typeof candidate !== "object"
      ? undefined
      : candidate.accueil;
  const suggestions =
    candidate === null || typeof candidate !== "object"
      ? undefined
      : candidate.suggestions;

  if (typeof nom !== "string") {
    erreurs.push("Le nom doit être une chaîne.");
  } else {
    const nettoye = nom.trim();
    if (nettoye.length < 2) {
      erreurs.push("Le nom doit faire au moins 2 caractères après trim.");
    } else if (nettoye.length > 20) {
      erreurs.push("Le nom doit faire au plus 20 caractères après trim.");
    }
  }

  if (typeof glyphe !== "string") {
    erreurs.push("L'emoji doit être une chaîne.");
  } else if (compterSegments(glyphe) !== 1) {
    erreurs.push("L'emoji doit être exactement un segment de graphème.");
  }

  if (
    typeof accueil !== "string" ||
    typeof nom !== "string" ||
    !accueil.includes(nom)
  ) {
    erreurs.push("L'accueil doit contenir le nom.");
  }

  if (!Array.isArray(suggestions) || suggestions.length !== 3) {
    erreurs.push("Les suggestions doivent être un tableau de trois éléments.");
  } else {
    const invalide = suggestions.some(
      (question) =>
        typeof question !== "string" || question.trim().length === 0,
    );
    if (invalide) {
      erreurs.push(
        "Chaque suggestion doit être une chaîne non vide après trim.",
      );
    }
  }

  if (erreurs.length === 0) {
    return { ok: true };
  }
  return { ok: false, erreurs };
}
