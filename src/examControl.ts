/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { state } from "./lib/state";
import { get_category_list } from "./importer";
import { begin } from "./main";

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

export async function changeCategory(category: string) {
  const category_list = await get_category_list();
  state.examCategory = category;
  state.categoryMakeup = category_list[category].makeup;
  state.numOfQuestions = category_list[category].qNum;
  localStorage.setItem("setCategory", category);
}

export function retakeExam() {
  begin();
}
