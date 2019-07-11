const sgMail = require("@sendgrid/mail");
const fs = require("fs");
let verificationTemplate = "";
let forgotPasswordTemplate = "";
// Read mail templates(html)
fs.readFile(
  "api/utils/verificationTemplate.html",
  "utf8",
  (err: any, contents: string) => {
    if (err) {
      console.log(err);
    } else {
      verificationTemplate = contents;
    }
  }
);
fs.readFile(
  "api/utils/forgotPasswordTemplate.html",
  "utf8",
  (err: any, contents: string) => {
    if (err) {
      console.log(err);
    } else {
      forgotPasswordTemplate = contents;
    }
  }
);
// Sends the verification mail to given mail
const sendVerificationMail = (email: string, verificationCode: string) => {
  if (process.env.PROJECT_ENV != "DEVELOPMENT") {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
      to: email,
      from: "sign-up@scrimup.app",
      subject: "Email Verification",
      text: `Hey there!
      Here is your verification code :
      ${verificationCode}
      We are excited to see you in our app. `,
      html: verificationTemplate.replace("xxxxxx", verificationCode)
    };
    sgMail.send(msg);
  }
};
// Sends the recover code to the given mail
const sendForgotPasswordMail = (email: string, recoverKey: string) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: email,
    from: "account@scrimup.app",
    subject: "Reset Password",
    text: `So you have forgotten your password. Dont worry, we are here to help you here is the code to reset your password : ${recoverKey} `,
    html: forgotPasswordTemplate.replace("xxxxxx", recoverKey)
  };
  sgMail.send(msg);
};
export { sendVerificationMail };
export { sendForgotPasswordMail };
