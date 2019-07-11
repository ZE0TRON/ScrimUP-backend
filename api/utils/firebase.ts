import admin from "firebase-admin";

const serviceAccount = require("../../scrimupFirebase.json");
// Initialize firebase admin instance
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://scrimup-d531c.firebaseio.com"
});
export { admin };
