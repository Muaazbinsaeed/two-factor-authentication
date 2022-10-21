//-------------------------------------------------------

let winston = require("winston");

//-------------------------------------------------------

// Config Winston Logger
let logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: "app.log" }),
    new winston.transports.Console(),
  ],
});
module.exports = logger;

//-------------------------------------------------------

// Define Stream for Morgan to write on .log
module.exports.myStream = {
  write: function (message) {
    logger.info(message);
  },
};

//-------------------------------------------------------
