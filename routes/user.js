let express = require("express");
let router = express.Router();

// Require Controller module
let userController = require("../controllers/userController");

/// USER ROUTES

router.get("/", (req, res, next) => res.redirect("/"));

router.get("/login", userController.log_in_get);

router.post("/login", userController.log_in_post);

router.get("/logout", userController.log_out_get);

router.get("/signup", userController.sign_up_get);

router.post("/signup", userController.sign_up_post);

module.exports = router;
