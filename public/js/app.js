import { validateMessage, replyTo } from "./brain.js";
import { renderMessages } from "./view.js";

const formulaire = document.querySelector("#chat-form");
const statut = document.querySelector("#status");
const versionElt = document.querySelector("#version");
const champ = document.querySelector("#message");
const liste = document.querySelector("#messages");

const historique = [];
const CLE = "capweb.historique";

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
renderMessages(historique, liste);

formulaire?.addEventListener("submit", (event) => {
  event.preventDefault();

  const resultat = validateMessage(champ.value);
  if (!resultat.ok) {
    statut.textContent = resultat.error;
    champ.focus();
    return;
  }

  historique.push({ role: "user", text: resultat.value });
  historique.push({ role: "assistant", text: replyTo(resultat.value) });
  renderMessages(historique, liste);
  enregistrer();

  champ.value = "";
  statut.textContent = "";
  champ.focus();
});

document.querySelector("#effacer")?.addEventListener("click", () => {
  if (!confirm("Effacer toute la conversation ?")) return;
  historique.length = 0;
  localStorage.removeItem(CLE);
  renderMessages(historique, liste);
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
