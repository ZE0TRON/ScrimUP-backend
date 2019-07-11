interface filledUserInterface {
  nick: string;
  email: string;
}
export interface IDictionary {
  key: string;
  value: number;
}

interface allHoursInterface {
  [index: string]: number | [filledUserInterface];
  t0: number;
  t1: number;
  t2: number;
  t3: number;
  t4: number;
  t5: number;
  t6: number;
  t7: number;
  t8: number;
  t9: number;
  t10: number;
  t11: number;
  t12: number;
  t13: number;
  t14: number;
  t15: number;
  t16: number;
  t17: number;
  t18: number;
  t19: number;
  t20: number;
  t21: number;
  t22: number;
  t23: number;
  filledUsers: [filledUserInterface];
}
interface availabilityInterface {
  // 0 not available 1 weak 1.15 strong
  [index: string]: allHoursInterface;
  monday: allHoursInterface;
  tuesday: allHoursInterface;
  wednesday: allHoursInterface;
  thursday: allHoursInterface;
  friday: allHoursInterface;
  saturday: allHoursInterface;
  sunday: allHoursInterface;
}
interface StrategyInterface {
  title: string;
  detail: string;
  winCount: number;
  loseCount: number;
}

interface TaskInterface {
  title: string;
  detail: string;
  goal: number;
  current: number;
  assigned: string;
}

interface gameInterface {
  name: string;
  team: string;
  nickName: string;
  locale: string;
  tasks: [TaskInterface];
  strategies: [StrategyInterface];
  isSolo: boolean;
  availability: availabilityInterface;
  prevAvailability: availabilityInterface;
}

interface userInterface {
  email: string;
  password: string;
  games: [gameInterface];
  verified: Boolean;
  verificationCode: string;
  recoverKey: string;
  FCMToken: string;
  discordAccessToken: string;
  discordRefreshToken: string;
  googleID: string;
  googleToken: string;
  avatar: string;
}
interface memberInterface {
  email: string;
  nickName: string;
  active: Boolean;
}
interface bestTimeInterface {
  time: string;
  numberOfPlayers: number;
  precision: number;
  available: [string];
  absent: [string];
  notActive: [string];
}
interface challengeInterface {
  hostTeam: string;
  otherTeam: string;
  time: string;
  numberOfPlayers: number;
  exactTime: string;
  note: string;
}
interface eventInterface {
  name: string;
  numberOfPlayers: number;
  note: string;
  time: string;
  exactTime: string;
  players: [memberInterface];
}
interface teamInterface {
  game: string;
  name: string;
  leader: memberInterface;
  members: [memberInterface];
  token: string;
  bestTimes: [bestTimeInterface];
  challenges: [challengeInterface];
  pendingChallenges: [challengeInterface];
  strategies: [StrategyInterface];
  tasks: [TaskInterface];
  occupied: [string];
  events: [eventInterface];
  availability: availabilityInterface;
}
interface allowedGamesInterface {
  name: string;
}
export { allowedGamesInterface };
export { allHoursInterface };
export { gameInterface };
export { userInterface };
export { teamInterface };
export { memberInterface };
export { availabilityInterface };
export { bestTimeInterface };
export { challengeInterface };
export { eventInterface };
export { StrategyInterface };
export { TaskInterface };
