import "./regitra.css";
import { getLanguage, strings } from "./i18n";
import { beginPage } from "./templates/beginPage";
import { beginExam } from "./exam";
import { selectQuestion } from "./examControl";
import { state } from "./state";

export const app = document.querySelector<HTMLDivElement>("#app")!;
export const examName = "DEMO NAUDOTOJAS";

async function hydrateFront() {
  document.querySelector<HTMLSpanElement>("#__Loading_Box_Text")!.innerHTML =
    await strings("wait");

  // Significant duplication.... whatever
  document.querySelector<HTMLButtonElement>("#changeLangLT")!.onclick =
    async () => {
      if (getLanguage() === "lt") return;
      state.selectedLanguage = "lt";
      document.querySelector<HTMLImageElement>(`#changeLangENImg`)!.src =
        "/img/ENoff.png";
      document.querySelector<HTMLImageElement>(`#changeLangLTImg`)!.src =
        "/img/LTyes.png";
      app.innerHTML = await beginPage(examName, "lt");
      hydrateFront();
    };

  document.querySelector<HTMLButtonElement>("#changeLangEN")!.onclick =
    async () => {
      if (getLanguage() === "en") return;
      state.selectedLanguage = "en";
      document.querySelector<HTMLImageElement>(`#changeLangLTImg`)!.src =
        "/img/LToff.png";
      document.querySelector<HTMLImageElement>(`#changeLangENImg`)!.src =
        "/img/ENyes.png";
      app.innerHTML = await beginPage(examName, "en");
      hydrateFront();
    };

  document.querySelector<HTMLButtonElement>(".beginButton")!.onclick =
    beginExam;
}

window.onload = async function () {
  app.innerHTML = await beginPage(examName, getLanguage());
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
