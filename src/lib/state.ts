type State = {
  selectedAnswers: any;
  currentQuestion: number;
  questionIDs: number[];
  selectedLanguage: string;
  examFinished: boolean;
  currentPage: string;
  examCategory: string;
  numOfQuestions: number;
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
};
