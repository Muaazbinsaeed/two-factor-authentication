let nodemailer = require("nodemailer");
let speakeasy = require("speakeasy");
let qrcode = require("qrcode");
let User = require("../models/user");
const logger = require("../logger");

exports.tfa_register_get = (req, res, next) => {
  try {
    if (req.user === undefined) {
      logger.error(
        "Unauthorized Request. No User logged in. Redirecting to '/user/login'"
      );
      res.status(401).redirect("/user/login");
    } else {
      let temp_secret = speakeasy.generateSecret();
      logger.info("Speakeasy secret generated as temp_secret");
      qrcode.toDataURL(temp_secret.otpauth_url, (err, qrcode) => {
        if (err) {
          // Error Logging
          logger.error(err);
          return next(err);
        }
        logger.info("qr-code generated and stored in temp_secret");
        temp_secret.qrcode = qrcode;
        User.findByIdAndUpdate(req.user._id, { temp_secret }, (err, user) => {
          if (err) {
            // Error Logging
            logger.error(err);
            return next(err);
          }
          logger.info("temp_secret added to User doc in database");
          if (user.twofa_preferred === "email") mailToken(user, temp_secret);
          // console.log(user, temp_secret);
          logger.info("Rendering 2fa-register Page with relevant info");
          res.render("2fa-register", {
            method: user.twofa_preferred,
            secret: temp_secret.base32,
            qrcode: temp_secret.qrcode,
          });
        });
      });
    }
  } catch (err) {
    // Error Logging
    logger.error(err);
    next(err);
  }
};

exports.tfa_register_post = (req, res, next) => {
  try {
    if (req.user === undefined) {
      logger.error(
        "Unauthorized Request. No User logged in. Redirecting to '/user/login'"
      );
      res.status(401).redirect("/user/login");
    } else {
      User.findById(req.user._id).exec((err, user) => {
        if (err) {
          // Error Logging
          logger.error(err);
          return next(err);
        }
        let verified = speakeasy.totp.verifyDelta({
          secret: user.temp_secret.base32,
          encoding: "base32",
          token: req.body.token,
          window: 10,
        });
        // console.log(verified, 1 - process.env.TFA_DELTA);
        if (!verified) {
          logger.error("Incorrect 2FA Token");
          res.status(401).render("2fa-register", {
            method: user.twofa_preferred,
            secret: user.temp_secret.base32,
            qrcode: user.temp_secret.qrcode,
            messages: ["Incorrect Token"],
          });
        } else if (verified.delta < 1 - process.env.TFA_DELTA) {
          logger.error("2FA Token Expired");
          res.status(401).render("2fa-register", {
            method: user.twofa_preferred,
            secret: user.temp_secret.base32,
            qrcode: user.temp_secret.qrcode,
            messages: ["Token Expired"],
          });
        } else if (verified.delta >= 1 - process.env.TFA_DELTA) {
          user.twofa_enabled = true;
          user.secret = user.temp_secret;
          user.temp_secret = "";
          user.save((err) => {
            if (err) {
              // Error Logging
              logger.error(err);
              return next(err);
            }
            logger.info(
              "in database, 2FA enabled. temp_secret is transferred to secret. Redirecting back to '/'"
            );
            res.redirect("/");
          });
        }
      });
    }
  } catch (err) {
    // Error Logging
    logger.error(err);
    next(err);
  }
};

exports.tfa_validate_get = (req, res, next) => {
  try {
    // Does nothing, Just redirects
    logger.info("Nothing happened!");
    res.redirect("/");
  } catch (err) {
    // Error Logging
    logger.error(err);
    next(err);
  }
};

exports.tfa_validate_post = (req, res, next) => {
  try {
    User.findById(req.body.id).exec((err, user) => {
      if (err) {
        // Error Logging
        logger.error(err);
        return next(err);
      }
      let verified = speakeasy.totp.verifyDelta({
        secret: user.secret.base32,
        encoding: "base32",
        token: req.body.token,
        window: 10,
      });
      // console.log(verified, 1 - process.env.TFA_DELTA);
      if (!verified) {
        logger.error("Incorrect 2FA Token");
        res.status(401).render("2fa-validate", {
          id: user._id,
          messages: ["Incorrect Token"],
        });
      } else if (verified.delta < 1 - process.env.TFA_DELTA) {
        logger.error("2FA Token Expired");
        res.status(401).render("2fa-validate", {
          id: user._id,
          messages: ["Token Expired"],
        });
      } else if (verified.delta >= 1 - process.env.TFA_DELTA) {
        req.login(user, (err) => {
          if (err) {
            // Error Logging
            logger.error(err);
            return next(err);
          }
          logger.info("Successful Login. Redirecting to '/'");
          res.redirect("/");
        });
      }
    });
  } catch (err) {
    // Error Logging
    logger.error(err);
    next(err);
  }
};

exports.tfa_options_get = (req, res, next) => {
  try {
    if (req.user === undefined) {
      logger.error(
        "Unauthorized Request. No User logged in. Redirecting to '/user/login'"
      );
      res.status(401).redirect("/user/login");
    } else {
      logger.info("Rendering 2fa-options Page");
      res.render("2fa-options");
    }
  } catch (err) {
    // Error Logging
    logger.error(err);
    next(err);
  }
};

exports.tfa_options_post = (req, res, next) => {
  try {
    if (req.user === undefined) {
      logger.error(
        "Unauthorized Request. No User logged in. Redirecting to '/user/login'"
      );
      res.status(401).redirect("/user/login");
    } else {
      User.findByIdAndUpdate(
        req.user._id,
        {
          twofa_preferred: req?.body?.twofa_preferred,
          email: req?.body?.email,
        },
        (err, user) => {
          if (err) {
            // Error Logging
            logger.error(err);
            return next(err);
          }
          logger.info(
            `${req?.body?.twofa_preferred} chosen as preferred 2FA method. Redirecting to '/2fa/register'`
          );
          res.redirect("/2fa/register");
        }
      );
    }
  } catch (err) {
    // Error Logging
    logger.error(err);
    next(err);
  }
};

let mailToken = (exports.mailToken = (user, secret) => {
  try {
    let serverToken = speakeasy.totp({
      secret: secret?.base32,
      encoding: "base32",
    });
    logger.info("ServerToken generated against secret to be sent to user");
    var transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "2FA AUTH DEMO",
      text: `Token: ${serverToken}`,
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        // Error Logging
        logger.error(err);
        return next(err);
      } else {
        logger.info("Email Sent: " + info.response);
      }
    });
  } catch (err) {
    // Error Logging
    logger.error(err);
    next(err);
  }
});
