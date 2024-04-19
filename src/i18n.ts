/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { state } from "./lib/state";

interface I18NStrings {
  beginHeader: string;
  category: string;
  testLang: string;
  startExam: string;
  test: string;
  testCategory: string;
  taskNum: string;
  previousTask: string;
  nextTask: string;
  timeLeft: string;
  finishTest: string;
  warningUnanswered: string;
  ok: string;
  cancel: string;
  confirmFinish: string;
  langCode: string;
  examRegistrationNumber: string;
  examFail: string;
  examPass: string;
  participant: string;
  givenAnswers: string;
  correctAnswers: string;
  incorrectAnswers: string;
  allowedErrors: string;
  viewAnswers: string;
  noIllustration: string;
  close: string;
  errorStart: string;
  errorEnd: string;
  wait: string;
  noAlt: string;
  affiliationWarning: string;
  retakeExam: string;
  maybeRetake: string;
}

export async function strings(key: keyof I18NStrings) {
  const language = state.selectedLanguage;
  const map = await import(`./i18n/${language}.json`);
  return map[key];
}

export function changeLanguage(lang: string) {
  state.selectedLanguage = lang;
  document.querySelector("html")?.setAttribute("lang", lang);
  localStorage.setItem("setLanguage", lang);
}
