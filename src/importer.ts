import count from "./generated/count.json";

const randomNum = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const random_ids = (min: number, max: number, amount: number) => {
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
};

export const get_question_data = (lang: string) => {
  // @ts-ignore
  const ids = random_ids(0, count[lang] - 1, 30);
  const promises = ids.map((id) => {
    return fetch(`/json/questions/${lang}/${id}.json`)
      .then((res) => res.json())
      .then((result) => {
        return {
          id: id,
          q: result.q,
          answers: result.a,
          image: result.i,
        };
      });
  });
  return Promise.all(promises);
};

export const get_answer_data = (lang: string, ids: number[]) => {
  const promises = ids.map((id) => {
    return fetch(`/json/answers/${lang}/${id}.json`)
      .then((res) => res.json())
      .then((result) => {
        return {
          id: id,
          correct: result,
        };
      });
  });
  return Promise.all(promises);
};
