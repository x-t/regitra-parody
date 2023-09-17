interface I18NStrings {
    beginHeader:            string;
    category:               string;
    testLang:               string;
    startExam:              string;
    test:                   string;
    bCategory:              string;
    taskNum:                string;
    previousTask:           string;
    nextTask:               string;
    timeLeft:               string;
    finishTest:             string;
    warningUnanswered:      string;
    ok:                     string;
    cancel:                 string;
    confirmFinish:          string;
    langCode:               string;
    examRegistrationNumber: string;
    examFail:               string;
    examPass:               string;
    participant:            string;
    givenAnswers:           string;
    correctAnswers:         string;
    incorrectAnswers:       string;
    allowedErrors:          string;
    viewAnswers:            string;
    noIllustration:         string;
    close:                  string;
    errorStart:             string;
    errorEnd:               string;
    wait:                   string;
}

export const getLanguage = () => {
  return localStorage.getItem("selectedLanguage")
    ? localStorage.getItem("selectedLanguage")!
    : "lt";
};

export const strings = async (key: keyof I18NStrings) => {
  const language = getLanguage();
  const map = await import(`./i18n/${language}.json`);
  return map[key];
}
