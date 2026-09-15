import { persona } from "./persona.js";

export function renderMessages(messages, container) {
  const lignes = messages.map((msg) => {
    const li = document.createElement("li");
    li.textContent = `${msg.role === "user" ? "Vous" : `${persona.emoji} ${persona.nom}`} : ${msg.text}`;
    return li;
  });
  container.replaceChildren(...lignes);
}
