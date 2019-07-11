import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { userInterface } from "./modelInterfaces";
import { userSchema } from "./schemas";
interface IUserMethods {
  generateHash: (password: string) => Promise<string>;
  comparePassword: (password: string, hash: string) => Promise<boolean>;
}
/*
 * Generate Salt and Hash
 */

userSchema.methods.generateHash = (password: string) => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) reject(err);
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) reject(err);
        resolve(hash);
      });
    });
  });
};

/**
 *Compare Password and Hash
 */

userSchema.methods.comparePassword = (password: string, hash: string) => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(password, hash, (err, res) => {
      if (err) reject(err);
      if (res) resolve(true);
      else resolve(false);
    });
  });
};
interface IUserModel extends userInterface, mongoose.Document, IUserMethods {}
let User = mongoose.model<IUserModel>("User", userSchema);
export { User };
export { IUserModel };
