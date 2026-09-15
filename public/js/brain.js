export function validateMessage(raw) {
  if (typeof raw !== "string") {
    return { ok: false, error: "Le message doit être du texte" };
  }
  const value = raw.trim();
  if (value === "") {
    return { ok: false, error: "Le message ne doit pas être vide" };
  }
  if (value.length > 280) {
    return { ok: false, error: "Le message dépasse 280 caractères" };
  }
  return { ok: true, value };
}

export function replyTo(message) {
  const mot = message.trim().toLowerCase();
  if (mot === "salut" || mot === "bonjour") return "Salut ! Comment puis-je aider ?";
  if (mot === "aide") return "Je connais : salut, bonjour, aide, test.";
  if (mot === "test") return "Test reçu, tout fonctionne.";
  return "Je ne sais pas encore répondre à ça.";
}
