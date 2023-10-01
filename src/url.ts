import { state } from "./lib/state";

const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get("experiments") === "true") {
  if (urlParams.get("exposeState") === "true") {
    // @ts-ignore
    window.state = state;
  }

  const catMakeup = urlParams.get("catMakeup");
  if (catMakeup) {
    state.categoryMakeup = JSON.parse(catMakeup);
  }

  const qNum = urlParams.get("qNum");
  if (qNum) {
    state.numOfQuestions = JSON.parse(qNum);
  }
}

const lang = urlParams.get("lang");
if (lang) {
  state.selectedLanguage = lang;
}

const category = urlParams.get("category");
if (category) {
  switch (category) {
    case "b":
      state.examCategory = "b";
      state.categoryMakeup = { b: 30 };
      state.numOfQuestions = 30;
      break;
    case "a":
      state.examCategory = "a";
      state.categoryMakeup = { b: 30, a: 5 };
      state.numOfQuestions = 35;
      break;
  }
}
