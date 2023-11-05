import "./regitra.css";
import { strings } from "./i18n";
import { beginPage } from "./templates/beginPage.html";
import { beginExam } from "./exam";
import { state } from "./lib/state";
import "./keyboard";
import "./url";

export const app = document.querySelector<HTMLDivElement>("#app")!;
export const examName = "DEMO NAUDOTOJAS";

async function hydrateFront() {
  document.querySelector<HTMLSpanElement>("#__Loading_Box_Text")!.innerHTML =
    await strings("wait");

  const langs = ["lt", "en"];
  langs.forEach((lang) => {
    document.querySelector<HTMLButtonElement>(
      `#changeLang${lang.toUpperCase()}`,
    )!.onclick = async () => {
      if (state.selectedLanguage === lang) return;
      state.selectedLanguage = lang;
      document.querySelector("html")?.setAttribute("lang", lang);
      app.innerHTML = await beginPage(examName, lang);
      hydrateFront();
    };
  });

  document.querySelector<HTMLButtonElement>(".beginButton")!.onclick =
    beginExam;
}

window.onload = async function () {
  app.innerHTML = await beginPage(examName, state.selectedLanguage);
  hydrateFront();
};
