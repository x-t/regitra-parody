import { selectQuestion } from "./examControl";
import { state } from "./lib/state";

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
