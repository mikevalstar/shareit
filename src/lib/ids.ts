import { customAlphabet } from "nanoid";

const alpha = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

export const newId = customAlphabet(alpha, 21);
export const newSlug = customAlphabet(alpha, 7);
