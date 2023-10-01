type State = {
  selectedAnswers: any;
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
  selectedAnswers: [],
  currentQuestion: 0,
  questionIDs: [],
  selectedLanguage: "lt",
  examFinished: false,
  currentPage: "index",
  examCategory: "b",
  numOfQuestions: 30,
  categoryMakeup: { b: 30 },
};
