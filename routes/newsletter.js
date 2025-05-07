const express = require("express");
const router = express.Router();

const { addEmail, getAll } = require("../controllers/newsletter");
const { isAdmin } = require("../middlewares/isAdmin");
router.post("/add", addEmail);
router.get("/all", isAdmin, getAll);

module.exports = router;
