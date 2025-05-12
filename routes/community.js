const express = require("express");
const router = express.Router();

const { isAuth } = require("../middlewares/isAuth");
const { joinCommunity } = require("../controllers/community");

router.post("/join", isAuth, joinCommunity);

module.exports = router;
