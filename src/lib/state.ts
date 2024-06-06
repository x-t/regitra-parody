/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { get_defaults_info } from "../importer";
import { changeCategory } from "../examControl";
import { changeLanguage } from "../i18n";

type State = {
  selectedAnswers: { [questionId: string]: number[] };
  currentQuestion: number;
  questionIDs: string[];
  selectedLanguage: string;
  examFinished: boolean;
  currentPage: string;
  examCategory: string;
  numOfQuestions: number;
  categoryMakeup: { [category: string]: number };
};

export const defaultState: State = {
  selectedAnswers: {},
  currentQuestion: 1,
  questionIDs: [],
  selectedLanguage: "lt",
  examFinished: false,
  currentPage: "index",
  examCategory: "b",
  numOfQuestions: 30,
  categoryMakeup: { b: 30 },
};

export let state: State;

export function initialiseState() {
  state = JSON.parse(JSON.stringify(defaultState));

  let defaults = get_defaults_info();
  let setCategory = localStorage.getItem("setCategory");
  let setLanguage = localStorage.getItem("setLanguage");
  if (!setCategory) changeCategory(defaults.c);
  else changeCategory(setCategory);
  if (!setLanguage) changeLanguage(defaults.l);
  else changeLanguage(setLanguage);
}
