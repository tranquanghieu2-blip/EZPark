export const DISABLED_OPACITY = 70;
export const maxLengthPassword = 64;
export const maxLengthEmail = 120;
export const maxLengthName = 100;
export const maxLengthReview = 200;
export const maxLengthSearch = 200;
export const maxLengthChatBot = 100;

export const isValidPassword = (password: string): boolean => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\W]{10,}$/;
  return regex.test(password);
};

export const isValidName = (name: string): boolean => {
  const regex = /^[A-Za-zÀ-ỹ]+(?:\s[A-Za-zÀ-ỹ]+)*$/;
  return regex.test(name);
}

export const isValidEmail = (email: string): boolean => {
  const regex = /^\S+@\S+\.\S+$/;
  return regex.test(email);
}