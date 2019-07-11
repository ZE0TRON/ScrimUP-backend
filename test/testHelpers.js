/* eslint-disable require-jsdoc */
const { exec } = require("child_process");
function State() {
  return {
    numberOfStates: 0,
    states: [],
    setState: function() {
      return new Promise((resolve, reject) => {
        exec(
          "mongodump --db scrimUpTest -o ./test_data/State/",
          (err, stdout, stderr) => {
            if (err) {
              // node couldn't execute the command
              console.log(err);
              resolve(false);
            }
            // the *entire* stdout and stderr (buffered)
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            resolve(true);
          }
        );
      });
    },
    revertState: function() {
      return new Promise((resolve, reject) => {
        exec(
          'mongo scrimUpTest --eval "printjson(db.dropDatabase())"',
          (err, stdout, stderr) => {
            if (err) {
              // node couldn't execute the command
              console.log(err);
              resolve(false);
            }
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
            exec(
              "mongorestore --db scrimUpTest ./test_data/State/scrimUpTest",
              (err, stdout, stderr) => {
                if (err) {
                  // node couldn't execute the command
                  console.log(err);
                  resolve(false);
                }

                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                exec(
                  "rm -rf ./test_data/State/scrimUpTest",
                  (err, stdout, stderr) => {
                    if (err) {
                      // node couldn't execute the command
                      console.log(err);
                      resolve(false);
                    }
                    // the *entire* stdout and stderr (buffered)
                    console.log(`stdout: ${stdout}`);
                    console.log(`stderr: ${stderr}`);
                    resolve(true);
                  }
                );
              }
            );
            // the *entire* stdout and stderr (buffered)
          }
        );
      });
    }
    // Creates a state of the database and returns the number of the stat
  };
}
exports.State = State;
