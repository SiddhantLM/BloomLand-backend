const express = require("express");
const router = express.Router();

const {
  approveAll,
  approveDay0,
  approve10x,
  approve100x,
  rejectAll,
} = require("../controllers/admin");
const { isAdmin } = require("../middlewares/isAdmin");

router.post("/approveAll", isAdmin, approveAll);
router.post("/rejectAll", isAdmin, rejectAll);
router.post("/approveDay0", isAdmin, approveDay0);
router.post("/approve10x", isAdmin, approve10x);
router.post("/approve100x", isAdmin, approve100x);

module.exports = router;
