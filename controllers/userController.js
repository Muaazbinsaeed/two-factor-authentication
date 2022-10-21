let bcrypt = require("bcryptjs");
let passport = require("passport");
let { body, validationResult } = require("express-validator");

let User = require("../models/user");

let tfaController = require("../controllers/2faController");
let logger = require("../logger");

exports.log_in_get = (req, res, next) => {
  try {
    if (req.user) {
      logger.error("Already logged in. Redirecting to '/'");
      res.redirect("/");
    } else {
      res.render("login");
      logger.info("Rendering Login Page");
    }
  } catch (err) {
    // Error Logging
    logger.error(err);
    next(err);
  }
};

exports.log_in_post = (req, res, next) => {
  try {
    passport.authenticate("local", (err, user, info) => {
      if (err || !user) {
        // Error Logging
        if (err) logger.error(err);
        if (!user) logger.error(`${info.message}. Rerendering Login Page`);
        let data = {
          username: req.body.username,
          password: req.body.password,
        };
        return res.status(401).render("login", { user: data, messages: info });
      }
      logger.info("1FA (username & password) successful");
      if (!user.twofa_enabled) {
        req.login(user, (err) => {
          if (err) {
            // Error Logging
            logger.error(err);
            return next(err);
          }
          logger.info(
            "2FA is not enabled. Login Successful. Redirecting to '/'"
          );
          res.redirect("/");
        });
      } else if ((user.twofa_enabled = true)) {
        let secret = user.secret;
        if (user.twofa_preferred === "email") {
          tfaController.mailToken(user, secret);
        }
        logger.info("2FA is enabled. No Login. Rendering '2fa-validate'");
        res.render("2fa-validate", { id: user._id });
      }
    })(req, res);
  } catch (err) {
    // Error Logging
    logger.error(err);
    next(err);
  }
};

exports.log_out_get = (req, res, next) => {
  try {
    req.logout(function (err) {
      if (err) {
        // Error Logging
        logger.error(err);
        return next(err);
      }
      logger.info("Logout successful. Redirecting to '/'");
      res.redirect("/");
    });
  } catch (err) {
    // Error Logging
    logger.error(err);
    next(err);
  }
};

exports.sign_up_get = (req, res, next) => {
  try {
    if (req.user) {
      logger.error("Already Logged in. Logout before getting sign-up page");
      res.redirect("/");
    } else {
      res.render("signup");
      logger.info("Rendering Sign-up page");
    }
  } catch (err) {
    // Error Logging
    logger.error(err);
    next(err);
  }
};

exports.sign_up_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .withMessage("First name must be specified")
    .escape(),
  body("second_name").trim().escape(),
  body("username")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Username is missing")
    .custom(async (value) => {
      let usernameCheck = await User.findOne({ username: value }).catch(
        (err) => {
          return next(err);
        }
      );
      if (usernameCheck !== null) return Promise.reject();
      return true;
    })
    .withMessage("Username is already in use")
    .escape(),
  body("password")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Password is missing")
    .escape(),
  body("passwordConfirmation")
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) return false;
      return true;
    })
    .withMessage("Password Confirmation does not match the Password")
    .escape(),
  (req, res, next) => {
    try {
      let errors = validationResult(req);
      let user = new User({
        first_name: req.body.first_name,
        second_name: req.body.second_name,
        username: req.body.username,
        password: req.body.password,
      });
      if (!errors.isEmpty()) {
        // Error Logging
        let errorLogs = errors.array();
        errorLogs.forEach((err) => {
          logger.error(err);
        });
        // There are errors. Render form again with sanitized
        // values / errors messages.
        user.passwordConfirmation = req.body.passwordConfirmation;
        res.status(400).render("signup", {
          user,
          errors: errors.array(),
        });
        return;
      } else {
        bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
          if (err) {
            // Error Logging
            logger.error(err);
            return next(err);
          }
          logger.info("Hashed Password Created using bcrypt");
          user.password = hashedPassword;
          user.save((err) => {
            if (err) {
              // Error Logging
              logger.error(err);
              return next(err);
            }
            logger.info("User Doc saved in Database");
            req.login(user, (err) => {
              if (err) {
                // Error Logging
                logger.error(err);
                return next(err);
              }
              logger.info("Login successful. Redirecting to '/'");
              res.redirect("/");
            });
          });
        });
      }
    } catch (err) {
      // Error Logging
      logger.error(err);
      next(err);
    }
  },
];
