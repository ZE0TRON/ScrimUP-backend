// A utility file for mostly const and other functions

import crypto from "crypto";

// Buffer offset for creating a random six digit code
const bufferOffset = 2;

// Creates a copy of the object not reference
export const clone = (a: object) => {
  return JSON.parse(JSON.stringify(a));
};

// creates a random six digit code
export const createSixDigitCode = () => {
  let buffer = crypto.randomBytes(10);
  return (buffer.readUInt32LE(bufferOffset) % 900000) + 100000;
};

export const dayHours = [
  "t0",
  "t1",
  "t2",
  "t3",
  "t4",
  "t5",
  "t6",
  "t7",
  "t8",
  "t9",
  "t10",
  "t12",
  "t13",
  "t14",
  "t15",
  "t16",
  "t17",
  "t18",
  "t19",
  "t20",
  "t21",
  "t22",
  "t23"
];

export const weekDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];
export const days = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
];
