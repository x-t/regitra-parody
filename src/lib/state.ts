/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

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

export const state: State = {
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
