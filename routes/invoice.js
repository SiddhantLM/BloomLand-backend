const express = require("express");
const router = express.Router();

const { getAll } = require("../controllers/invoice");
const { isAdmin } = require("../middlewares/isAdmin");

router.get("/all", isAdmin, getAll);

module.exports = router;
