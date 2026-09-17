import { validateMessage, replyTo } from "./brain.js";
import { renderMessages } from "./view.js";
import { persona } from "./persona.js";

const formulaire = document.querySelector("#chat-form");
const statut = document.querySelector("#status");
const versionElt = document.querySelector("#version");
const champ = document.querySelector("#message");
const liste = document.querySelector("#messages");
const accueilElt = document.querySelector("#accueil");
const suggestionsElt = document.querySelector("#suggestions");

const historique = [];
const CLE = "capweb.historique";

function mettreAJourAccueil() {
  if (!accueilElt) return;
  accueilElt.textContent = persona.accueil;
  accueilElt.hidden = historique.length > 0;
}

function construireSuggestions() {
  if (!suggestionsElt) return;
  const boutons = persona.suggestions.map((question) => {
    const bouton = document.createElement("button");
    bouton.type = "button";
    bouton.textContent = question;
    bouton.addEventListener("click", () => {
      champ.value = question;
      champ.focus();
    });
    return bouton;
  });
  suggestionsElt.replaceChildren(...boutons);
}

function enregistrer() {
  localStorage.setItem(CLE, JSON.stringify(historique));
}

try {
  const brut = localStorage.getItem(CLE);
  const donnees = brut ? JSON.parse(brut) : [];
  if (!Array.isArray(donnees)) throw new Error("format inattendu");
  historique.push(...donnees);
} catch {
  localStorage.removeItem(CLE);
  statut.textContent = "Conversation précédente illisible, elle a été effacée.";
}
construireSuggestions();
renderMessages(historique, liste);
mettreAJourAccueil();

const MODE_DEGRADE = "Mode dégradé : l'IA ne répond pas, Etud'IA utilise ses règles.";

// Demande la réponse au serveur ; en cas d'échec, repli local sur les règles.
async function obtenirReponse(message, precedents) {
  try {
    const reponse = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, historique: precedents }),
    });
    if (!reponse.ok) throw new Error(`statut ${reponse.status}`);
    const donnees = await reponse.json();
    if (typeof donnees.texte !== "string") throw new Error("réponse inattendue");
    return { texte: donnees.texte, degrade: donnees.degrade === true };
  } catch {
    return { texte: replyTo(message), degrade: true };
  }
}

let enCours = false;

formulaire?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (enCours) return;

  const resultat = validateMessage(champ.value);
  if (!resultat.ok) {
    statut.textContent = resultat.error;
    champ.focus();
    return;
  }

  enCours = true;
  const precedents = historique.slice(-6);
  const { texte, degrade } = await obtenirReponse(resultat.value, precedents);
  enCours = false;

  // Toujours exactement deux lignes par échange ; le mode dégradé ne va que dans #status.
  historique.push({ role: "user", text: resultat.value });
  historique.push({ role: "assistant", text: texte });
  renderMessages(historique, liste);
  mettreAJourAccueil();
  enregistrer();

  champ.value = "";
  statut.textContent = degrade ? MODE_DEGRADE : "";
  champ.focus();
});

document.querySelector("#effacer")?.addEventListener("click", () => {
  if (!confirm("Effacer toute la conversation ?")) return;
  historique.length = 0;
  localStorage.removeItem(CLE);
  renderMessages(historique, liste);
  mettreAJourAccueil();
});

// Version du serveur local, échec discret si indisponible.
fetch("/version.json", { headers: { accept: "application/json" } })
  .then((reponse) => (reponse.ok ? reponse.json() : null))
  .then((donnees) => {
    if (donnees && typeof donnees.version === "string" && versionElt) {
      versionElt.textContent = `version ${donnees.version}`;
    }
  })
  .catch(() => {});
