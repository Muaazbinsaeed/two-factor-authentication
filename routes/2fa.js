let express = require("express");
let router = express.Router();

// Require Controller module
let tfaController = require("../controllers/2faController");

/// 2FA ROUTES

router.get("/", (req, res, next) => res.redirect("/"));

router.get("/register", tfaController.tfa_register_get);

router.post("/register", tfaController.tfa_register_post);

router.get("/validate", tfaController.tfa_validate_get);

router.post("/validate", tfaController.tfa_validate_post);

router.get("/options", tfaController.tfa_options_get);

router.post("/options", tfaController.tfa_options_post);

module.exports = router;
