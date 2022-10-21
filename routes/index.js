let express = require("express");
let router = express.Router();

/// INDEX ROUTES

// GET home page.
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

module.exports = router;
