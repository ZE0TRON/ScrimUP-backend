import mongoose from "mongoose";
const Schema = mongoose.Schema;
export const filledUserSchema = new Schema({
  nick: String,
  email: String
});

export const allHoursSchema = new Schema({
  t0: { type: Number, default: 0 },
  t1: { type: Number, default: 0 },
  t2: { type: Number, default: 0 },
  t3: { type: Number, default: 0 },
  t4: { type: Number, default: 0 },
  t5: { type: Number, default: 0 },
  t6: { type: Number, default: 0 },
  t7: { type: Number, default: 0 },
  t8: { type: Number, default: 0 },
  t9: { type: Number, default: 0 },
  t10: { type: Number, default: 0 },
  t11: { type: Number, default: 0 },
  t12: { type: Number, default: 0 },
  t13: { type: Number, default: 0 },
  t14: { type: Number, default: 0 },
  t15: { type: Number, default: 0 },
  t16: { type: Number, default: 0 },
  t17: { type: Number, default: 0 },
  t18: { type: Number, default: 0 },
  t19: { type: Number, default: 0 },
  t20: { type: Number, default: 0 },
  t21: { type: Number, default: 0 },
  t22: { type: Number, default: 0 },
  t23: { type: Number, default: 0 },
  filledUsers: [filledUserSchema]
});
export const availabilitySchema = new Schema({
  // 0 not available 1 weak 1.15 strong
  monday: allHoursSchema,
  tuesday: allHoursSchema,
  wednesday: allHoursSchema,
  thursday: allHoursSchema,
  friday: allHoursSchema,
  saturday: allHoursSchema,
  sunday: allHoursSchema
});

export const StrategySchema = new Schema({
  title: String,
  detail: String,
  winCount: { type: Number, default: 0 },
  loseCount: { type: Number, default: 0 }
});

export const TaskSchema = new Schema({
  title: String,
  detail: String,
  goal: Number,
  current: { type: Number, default: 0 },
  assigned: String
});

export const gameSchema = new Schema({
  name: String,
  team: String,
  isSolo: { type: Boolean, default: false },
  nickName: String,
  strategies: [StrategySchema],
  tasks: [TaskSchema],
  availability: availabilitySchema,
  prevAvailability: availabilitySchema
});

export const userSchema = new Schema({
  email: String,
  password: String,
  games: [gameSchema],
  verified: { type: Boolean, default: false },
  verificationCode: String,
  recoverKey: String,
  FCMToken: String,
  discordAccessToken: String,
  discordRefreshToken: String,
  googleID: String,
  googleToken: String,
  avatar: String
});
export const memberSchema = new Schema({
  email: String,
  nickName: String,
  active: { type: Boolean, default: false }
});
export const bestTimeSchema = new Schema({
  time: String,
  numberOfPlayers: Number,
  precision: Number,
  available: [String],
  absent: [String],
  notActive: [String]
});
export const challengeSchema = new Schema({
  hostTeam: String,
  otherTeam: String,
  time: String,
  numberOfPlayers: Number,
  exactTime: String,
  note: String
});
export const eventSchema = new Schema({
  name: String,
  numberOfPlayers: Number,
  note: String,
  time: String,
  exactTime: String,
  players: [memberSchema]
});
export const teamSchema = new Schema({
  game: String,
  name: String,
  leader: memberSchema,
  members: [memberSchema],
  token: String,
  bestTimes: [bestTimeSchema],
  challenges: [challengeSchema],
  pendingChallenges: [challengeSchema],
  strategies: [StrategySchema],
  tasks: [TaskSchema],
  occupied: [String],
  events: [eventSchema],
  availability: availabilitySchema
});

export const allowedGameSchema = new Schema({
  name: String
});
