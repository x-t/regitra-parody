import "./regitra.css";
import { getLanguage, strings } from "./i18n";
import { beginPage } from "./templates/beginPage";
import { beginExam } from "./exam";
import { selectQuestion } from "./examControl";

export const app = document.querySelector<HTMLDivElement>("#app")!;
export const examName = "DEMO NAUDOTOJAS";

// Instead of some state management library, I just quickly decided to use localStorage
// It works, you just have to reset it every page load.
localStorage.removeItem("selectedAnswers");
localStorage.removeItem("currentQuestion");
localStorage.removeItem("questionIDs");
localStorage.removeItem("selectedLanguage");
localStorage.removeItem("examFinished");
localStorage.removeItem("currentPage");
localStorage.setItem("selectedLanguage", "lt");
localStorage.setItem("examFinished", "false");
localStorage.setItem("currentPage", "index");

const hydrateFront = async () => {
  document.querySelector<HTMLSpanElement>("#__Loading_Box_Text")!.innerHTML =
    await strings("wait");

  // Significant duplication.... whatever
  document.querySelector<HTMLButtonElement>("#changeLangLT")!.onclick =
    async () => {
      if (getLanguage() === "lt") return;
      localStorage.setItem("selectedLanguage", "lt");
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
      localStorage.setItem("selectedLanguage", "en");
      document.querySelector<HTMLImageElement>(`#changeLangLTImg`)!.src =
        "/img/LToff.png";
      document.querySelector<HTMLImageElement>(`#changeLangENImg`)!.src =
        "/img/ENyes.png";
      app.innerHTML = await beginPage(examName, "en");
      hydrateFront();
    };

  document.querySelector<HTMLButtonElement>(".beginButton")!.onclick =
    beginExam;
};

window.onload = async () => {
  app.innerHTML = await beginPage(examName, getLanguage());
  hydrateFront();
};

window.addEventListener("keydown", function (event) {
  if (this.localStorage.getItem("currentPage") === "exam") {
    switch (event.key) {
      case "ArrowLeft":
        selectQuestion(
          parseInt(this.localStorage.getItem("currentQuestion")!) - 1,
        );
        break;
      case "ArrowRight":
        selectQuestion(
          parseInt(this.localStorage.getItem("currentQuestion")!) + 1,
        );
        break;
    }
  }
});
