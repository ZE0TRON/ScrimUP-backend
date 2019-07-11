import request from "request";
// Link parameters
const androidMinimumVersion = "1";
const androidPackageName = "com.scrimup.scrimup";
const iosBundleID = "com.scrimup.scrimup";
const iosIpadBundleID = "com.scrimup.scrimup";
const appStoreID = "1460515113";
const iosMinimumVersion = "1";
const logoLink = "http://scrimupapp.com/img/logo_square.png";
// Link Template
let linkTemplate =
  "&apn=" +
  androidPackageName +
  "&amv=" +
  androidMinimumVersion +
  "&ibi=" +
  iosBundleID +
  "&ipbi=" +
  iosIpadBundleID +
  "&isi=" +
  appStoreID +
  "&imv=" +
  iosMinimumVersion +
  "&efr=1&";
// Creates a team invite dynamic link
const createTeamInvite = (teamName: string, token: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const socialTemplate =
      "st= Join " +
      teamName +
      " on ScrimUP&sd=Your team mate invites you to join" +
      teamName +
      "on ScrimUP&si=" +
      logoLink;
    const deepLink = "?link=https://scrimup.page.link/join?token=" + token;
    let dynamicLink =
      "https://scrimup.page.link" + deepLink + linkTemplate + socialTemplate;
    dynamicLink = encodeURI(dynamicLink);
    request.post(
      "https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=" +
        process.env.FIREBASE_WEB_API_KEY,
      {
        json: {
          longDynamicLink: dynamicLink
        }
      },
      (error, res, body) => {
        if (error) {
          console.error(error);
          reject(false);
        }
        console.log(`statusCode: ${res.statusCode}`);
        console.log(body);
        resolve(body.shortLink);
      }
    );
  });
};
export { createTeamInvite };
