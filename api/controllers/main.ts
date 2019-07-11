"use strict";
import express from "express";

namespace mainController {
  export const hello = (req: express.Request, res: express.Response) => {
    res.send("Hello");
  };
}
export default mainController;
