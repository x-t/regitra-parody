/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { AnswerT, Question } from "./exam";
import count from "./generated/count.json";
import category_list from "./generated/categories.json";
import languages_list from "./generated/languages.json";
import version_info from "./generated/versions.json";
import { shuffle } from "./lib/array";
import { state } from "./lib/state";

function randomNum(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function random_ids(min: number, max: number, amount: number) {
  const ids: number[] = [];
  for (let i = 0; i < amount; i++) {
    // Generate unique IDs
    let id = randomNum(min, max);
    while (ids.includes(id)) {
      id = randomNum(min, max);
    }
    ids.push(id);
  }
  return ids;
}

export async function get_question_data() {
  let ids: string[] = [];
  for (const c in state.categoryMakeup) {
    const cids = random_ids(
      0,
      // @ts-ignore
      count[state.selectedLanguage][c] - 1,
      state.categoryMakeup[c],
    );
    ids = [...ids, ...cids.map((cid) => `${c}/${cid}`)];
  }

  shuffle(ids);

  const promises = ids.map((id) => {
    return fetch(`/generated/questions/${state.selectedLanguage}/${id}.json`)
      .then((res) => res.json())
      .then((result) => {
        return {
          id: id,
          q: result.q,
          answers: result.a,
          image: result.i,
          alt: result.alt,
        };
      });
  });
  return Promise.all(promises) as Promise<unknown> as Promise<Question[]>;
}

export async function get_answer_data(ids: string[]) {
  const promises = ids.map((id) => {
    return fetch(`/generated/answers/${state.selectedLanguage}/${id}.json`)
      .then((res) => res.json())
      .then((result) => {
        return {
          id: id,
          correct: result,
        };
      });
  });
  return (await Promise.all(promises)) as unknown as AnswerT[];
}

export function get_language_list() {
  // @ts-ignore
  return languages_list as unknown as string[];
}

type CategoryList = {
  [category: string]: {
    makeup: {
      [category: string]: number
    },
    qNum: number
  }
}

export function get_category_list() {
  // @ts-ignore
  return category_list as unknown as CategoryList;
}

export function get_category_arr() {
  const categories = get_category_list();
  let category_arr = [];

  for (const category in categories) {
    category_arr.push(category);
  }

  return category_arr;
}

type VersionInfo = {
  version: string,
  schemaVersion: string
}

export function get_version_info() {
  // @ts-ignore
  return version_info as unknown as VersionInfo;
}
