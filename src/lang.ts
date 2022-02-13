export const getLanguage = () => {
  return localStorage.getItem("selectedLanguage")
    ? localStorage.getItem("selectedLanguage")!
    : "lt";
};
