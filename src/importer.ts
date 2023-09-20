import count from "./generated/count.json";

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

export function get_question_data(lang: string) {
  // @ts-ignore
  const ids = random_ids(0, count[lang] - 1, 30);
  const promises = ids.map((id) => {
    return import(`./data/questions/${lang}/${id}.json`).then((result) => {
      return {
        id: id,
        q: result.q,
        answers: result.a,
        image: result.i,
      };
    });
  });
  return Promise.all(promises);
}

export function get_answer_data(lang: string, ids: number[]) {
  const promises = ids.map((id) => {
    return (
      import(`./data/answers/${lang}/${id}.json`)
        /**
         * Somehow import()'ing a JSON file which
         * is an array ([]) in root instead of an
         * object ({}) will put the value of imported
         * JSON in obj.default.
         * Don't know why.
         * It's just what Vite does.
         * Because you don't deserve nice things.
         */
        .then(({ default: result }) => {
          return {
            id: id,
            correct: result,
          };
        })
    );
  });
  return Promise.all(promises);
}
