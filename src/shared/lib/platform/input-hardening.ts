"use client";

import { z } from "zod";

const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const MULTISPACE_REGEX = /\s{2,}/g;

/**
 * Normalize potentially unsafe user text for storage/rendering.
 */
export const sanitizeUserText = (value: string, maxLength: number) =>
  value
    .replace(CONTROL_CHARS_REGEX, " ")
    .replace(/\r\n?/g, "\n")
    .replace(MULTISPACE_REGEX, " ")
    .trim()
    .slice(0, maxLength);

/**
 * Validate a display name with bounded length and safe characters.
 */
export const validateDisplayName = (value: string) => {
  const schema = z
    .string()
    .min(1)
    .max(40)
    .regex(/^[\p{L}\p{N}\s.'-]+$/u);
  return schema.safeParse(value);
};

/**
 * Validate a user comment body for safe local-first rendering.
 */
export const validateCommentBody = (value: string) => {
  const schema = z.string().min(3).max(500);
  return schema.safeParse(value);
};

/**
 * Validate a user-entered email for capture flows.
 */
export const validateEmailInput = (value: string) => {
  const schema = z.string().email().max(160);
  return schema.safeParse(value);
};
