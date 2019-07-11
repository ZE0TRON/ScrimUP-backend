import { admin } from "./firebase";
import { User, IUserModel } from "../models/user";

// Interface for Notification
interface Message {
  notification: {
    title: string;
    body: string;
  };
  token: string;
}

// Sends the nofitication
const sendNotification = (message: Message) => {
  // TODO: instead of doing it mock them
  if (process.env.PROJECT_ENV != "DEVELOPMENT") {
    admin
      .messaging()
      .send(message)
      .then((response: any) => {
        console.log("Sent");
        // Response is a message ID string.
      })
      .catch((error: any) => {
        console.log("Error sending message:", error);
      });
  }
};

// Returns the user's FCM Token
const getToken = (email: string): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    try {
      User.findOne({ email: email })
        .select({ FCMToken: 1 })
        .exec((err, userToken) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          if (!userToken) {
            resolve("-1");
          } else {
            resolve(userToken.FCMToken);
          }
        });
    } catch (e) {
      resolve("-1");
    }
  });
};

// Known as wanna update your availability notification
const enterAvailabilityNotification = (emails: string[]) => {
  emails.forEach(email => {
    getToken(email).then((token: string | null) => {
      if (token != "-1" && token) {
        let message: Message = {
          notification: {
            title: "Wanna update your availability ?",
            body:
              "Seems like you dont have any available time in some of your games wanna update them ?"
          },
          token: token
        };
        sendNotification(message);
      }
    });
  });
};

// When some one joins to the team send notification to the leader with team and
// new user's nickname
const someoneJoinedTeamNotification = (
  email: string,
  teamName: string,
  nickName: string
) => {
  getToken(email).then(token => {
    if (token != "-1" && token) {
      let message = {
        notification: {
          title: `${nickName} joined your team`,
          body: `${nickName} joined ${teamName}`
        },
        token: token
      };
      sendNotification(message);
    }
  });
};
// When some ones challenges a team a notification sent to the other team.
const challengeRequestReceivedNotification = (
  email: string,
  teamName: string,
  otherTeam: string
) => {
  getToken(email).then(token => {
    if (token != "-1" && token) {
      let message = {
        notification: {
          title: `Someone challenged your team`,
          body: `${otherTeam} sent a challenge request to ${teamName}`
        },
        token: token
      };
      sendNotification(message);
    }
  });
};
// When the other team accepts the challenge request a notification sent to the host team.
const challengeRequestAcceptedNotification = (
  email: string,
  teamName: string,
  otherTeam: string
) => {
  getToken(email).then(token => {
    if (token != "-1" && token) {
      let message = {
        notification: {
          title: `Your challenge request accepted`,
          body: `${otherTeam} accepted the challenge with ${teamName}`
        },
        token: token
      };
      sendNotification(message);
    }
  });
};

// Not in currently use will be in use later
const teamPracticeNotification = (email: string, teamName: string) => {
  getToken(email).then(token => {
    if (token != "-1" && token) {
      let message = {
        notification: {
          title: `Your leader set a practice`,
          body: `${teamName} has a scheduled practice check it in challenges`
        },
        token: token
      };
      sendNotification(message);
    }
  });
};

// Specific notification
const specificNotification = (
  email: string,
  messageContent: string,
  messageTitle: string
) => {
  getToken(email).then(token => {
    if (token != "-1" && token) {
      let message = {
        notification: {
          title: messageTitle,
          body: messageContent
        },
        token: token
      };
      sendNotification(message);
    }
  });
};

export { enterAvailabilityNotification };
export { specificNotification };
export { challengeRequestAcceptedNotification };
export { challengeRequestReceivedNotification };
export { teamPracticeNotification };
export { someoneJoinedTeamNotification };
