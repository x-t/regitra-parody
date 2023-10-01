import "./regitra.css";
import { strings } from "./i18n";
import { beginPage } from "./templates/beginPage";
import { beginExam } from "./exam";
import { selectQuestion } from "./examControl";
import { state } from "./lib/state";

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

window.addEventListener("keydown", function (event) {
  if (state.currentPage === "exam") {
    switch (event.key) {
      case "ArrowLeft":
        selectQuestion(state.currentQuestion - 1);
        break;
      case "ArrowRight":
        selectQuestion(state.currentQuestion + 1);
        break;
    }
  }
});
