import { state } from "./lib/state";

export function selectQuestion(id: number) {
  if (id < 1 || id > 30) {
    return;
  }

  if (id === 1) {
    document.querySelector<HTMLButtonElement>(
      ".testControl > div:nth-child(1) > div > button",
    )!.disabled = true;
    document.querySelector<HTMLButtonElement>(
      ".testControl > div:nth-child(1) > div:nth-child(2) > button",
    )!.disabled = false;
  } else if (id === 30) {
    if (state.examFinished !== true)
      document.querySelector<HTMLButtonElement>(
        ".testControl > div:nth-child(2) > button",
      )!.style.display = "unset";
    document.querySelector<HTMLButtonElement>(
      ".testControl > div:nth-child(1) > div > button",
    )!.disabled = false;
    document.querySelector<HTMLButtonElement>(
      ".testControl > div:nth-child(1) > div:nth-child(2) > button",
    )!.disabled = true;
  } else {
    document.querySelector<HTMLButtonElement>(
      ".testControl > div:nth-child(1) > div > button",
    )!.disabled = false;
    document.querySelector<HTMLButtonElement>(
      ".testControl > div:nth-child(1) > div:nth-child(2) > button",
    )!.disabled = false;
    document.querySelector<HTMLButtonElement>(
      ".testControl > div:nth-child(2) > button",
    )!.style.display = "none";
  }

  let currentQuestion = state.currentQuestion ? state.currentQuestion : 1;
  document.querySelector<HTMLImageElement>(
    `.questionControls > div > div:nth-child(${currentQuestion}) > div > img`,
  )!.style.display = "none";
  document.querySelector<HTMLSpanElement>("#currentQuestion")!.innerHTML =
    String(id);
  document.querySelector<HTMLDivElement>(
    `.testQuestion[data-qidx="${currentQuestion - 1}"]`,
  )!.style.display = "none";
  document.querySelector<HTMLDivElement>(
    `.testQuestion[data-qidx="${id - 1}"]`,
  )!.style.display = "unset";
  document.querySelector<HTMLImageElement>(
    `.questionControls > div > div:nth-child(${id}) > div > img`,
  )!.style.display = "unset";
  state.currentQuestion = id;
}

export function changeWithOffset(off: number) {
  return () => {
    let currentQuestion = state.currentQuestion;
    selectQuestion(currentQuestion + off);
  };
}
