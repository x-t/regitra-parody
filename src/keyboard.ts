import { changeWithOffset } from "./examControl";
import { state } from "./lib/state";

window.addEventListener("keydown", function (event) {
  if (state.currentPage === "exam") {
    switch (event.key) {
      case "ArrowLeft":
        changeWithOffset(-1)();
        break;
      case "ArrowRight":
        changeWithOffset(1)();
        break;
    }
  }
});
