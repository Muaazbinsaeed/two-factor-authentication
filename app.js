//-------------------------------------------------------

// Import Environmental Values
require("dotenv").config();

//-------------------------------------------------------

// Import NPM Packages and 'path' node package
let path = require("path");
let createError = require("http-errors");
let swaggerUi = require("swagger-ui-express");
let YAML = require("yamljs");
let cors = require("cors");
let express = require("express");
let cookieParser = require("cookie-parser");
let morgan = require("morgan");
let session = require("express-session");
let passport = require("passport");
let bcrypt = require("bcryptjs");
let LocalStrategy = require("passport-local").Strategy;
let mongoose = require("mongoose");

//-------------------------------------------------------

// Import Models
let User = require("./models/user");

//-------------------------------------------------------

// Import Routers
let indexRouter = require("./routes/index");
let userRouter = require("./routes/user");
let twofaRouter = require("./routes/2fa");

// Import Stream for logging Morgan HTTP- requests
let { myStream } = require("./logger");

//-------------------------------------------------------

// Setup mongoose connection
let mongoDB = process.env.MONGODB_URI;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
let db = mongoose.connection;
db.on("error", console.error.bind(console, "mongoDB connection error:"));

//-------------------------------------------------------

// Setup Passport Local strategy and cookie managing passport function
passport.use(
  new LocalStrategy(
    { passReqToCallback: true },
    (req, username, password, done) => {
      User.findOne({ username: username }, (err, user) => {
        if (err) return done(err);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        bcrypt.compare(password, user.password, (err, result) => {
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Incorrect password" });
          }
        });
      });
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

//-------------------------------------------------------

// Initialize Express App
let app = express();

//-------------------------------------------------------

// Setup View Engine and its location/path
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

//-------------------------------------------------------

// Initialize Other Middleware on App
app.use(cors());
app.use(morgan("combined", { stream: myStream }));
app.use(morgan("dev"));
app.use(express.json());
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

//-------------------------------------------------------

// Setup useful variables in local object
app.use(function (req, res, next) {
  res.locals.currentUser = req.user;
  next();
});

//-------------------------------------------------------

// Setup Swagger Ui Express
let swaggerDocument = YAML.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//-------------------------------------------------------

// Initialize Major Routes directly on App
app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/2fa", twofaRouter);

//-------------------------------------------------------

// Catch 404 and forward to Error Handler
app.use(function (req, res, next) {
  next(createError(404));
});

// Error Handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

//-------------------------------------------------------

// Export App
module.exports = app;

//-------------------------------------------------------
