/**
 * Copyright (C) zxyz 2023
 * This Source Code Form is subject to the terms
 * of the Mozilla Public License, v. 2.0. If a
 * copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { AnswerT, Question } from "./exam";
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

type VersionInfo = {
  version: string;
  schemaVersion: string;
};

type CategoryList = {
  [category: string]: {
    makeup: {
      [category: string]: number;
    };
    qNum: number;
  };
};

type DefaultsInfo = {
  l: string;
  c: string;
};

type CountInfo = {
  [language: string]: {
    [category: string]: number;
  };
};

type UnifiedData = {
  ver: VersionInfo;
  lan: string[];
  cat: CategoryList;
  cnt: CountInfo;
  def: DefaultsInfo;
};

async function get_unified_data() {
  const req = await fetch(`/artifacts/unified.json`);
  return (await req.json()) as unknown as UnifiedData;
}

export async function get_question_data() {
  let ids: string[] = [];
  for (const c in state.categoryMakeup) {
    const cids = random_ids(
      0,
      // @ts-ignore
      (await get_count_info())[state.selectedLanguage][c] - 1,
      state.categoryMakeup[c],
    );
    ids = [...ids, ...cids.map((cid) => `${c}_${cid}`)];
  }

  shuffle(ids);

  const promises = ids.map((id) => {
    return fetch(`/artifacts/questions/${state.selectedLanguage}_${id}.json`)
      .then((res) => res.json())
      .then((result) => {
        return {
          id: id,
          q: result.q,
          answers: result.a,
          image: result.i,
          img_sizes: result.is,
          img_fmts: result.if,
          alt: result.alt,
        };
      });
  });
  return Promise.all(promises) as Promise<unknown> as Promise<Question[]>;
}

export async function get_answer_data(ids: string[]) {
  const promises = ids.map((id) => {
    return fetch(`/artifacts/answers/${state.selectedLanguage}_${id}.json`)
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

export async function get_language_list() {
  return (await get_unified_data())["lan"] as unknown as string[];
}


export async function get_category_list() {
  return (await get_unified_data())["cat"] as unknown as CategoryList;
}

export async function get_category_arr() {
  const categories = await get_category_list();
  let category_arr = [];

  for (const category in categories) {
    category_arr.push(category);
  }

  return category_arr;
}


export async function get_version_info() {
  return (await get_unified_data())["ver"] as unknown as VersionInfo;
}

export async function get_defaults_info() {
  return (await get_unified_data())["def"] as unknown as DefaultsInfo;
}

export async function get_count_info() {
  return (await get_unified_data())["cnt"] as unknown as CountInfo;
}
