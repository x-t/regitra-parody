import { AnswerT, Question } from "./exam";
import count from "./generated/count.json";
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
