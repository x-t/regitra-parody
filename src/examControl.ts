/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { state } from "./lib/state";

export function selectQuestion(id: number) {
  if (id < 1 || id > state.numOfQuestions) {
    return;
  }

  if (id === 1) {
    document.querySelector<HTMLButtonElement>(
      ".testControl > div:nth-child(1) > div > button",
    )!.disabled = true;
    document.querySelector<HTMLButtonElement>(
      ".testControl > div:nth-child(1) > div:nth-child(2) > button",
    )!.disabled = false;
  } else if (id === state.numOfQuestions) {
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

  document.querySelector<HTMLImageElement>(
    `.examTaskSelectorContainer[data-questionNumber="${
      state.currentQuestion - 1
    }"] > div > img`,
  )!.style.display = "none";
  document.querySelector<HTMLSpanElement>("#currentQuestion")!.innerHTML =
    String(id);
  document.querySelector<HTMLDivElement>(
    `.testQuestion[data-qidx="${state.currentQuestion - 1}"]`,
  )!.style.display = "none";
  document.querySelector<HTMLDivElement>(
    `.testQuestion[data-qidx="${id - 1}"]`,
  )!.style.display = "unset";
  document.querySelector<HTMLImageElement>(
    `.examTaskSelectorContainer[data-questionNumber="${id - 1}"] > div > img`,
  )!.style.display = "unset";
  state.currentQuestion = id;
}

export function changeWithOffset(off: number) {
  return () => {
    let currentQuestion = state.currentQuestion;
    selectQuestion(currentQuestion + off);
  };
}

export function changeCategory(category: string) {
  switch (category) {
    case "b":
    default:
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
