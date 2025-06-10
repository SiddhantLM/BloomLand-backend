const express = require("express");
const router = express.Router();

const {
  approveAll,
  approveDay0,
  approve10x,
  approve100x,
  rejectAll,
  approveOne,
  rejectOne,
  approveEventAll,
  rejectEventAll,
  enterOne,
  deleteApproval,
} = require("../controllers/admin");
const { isAdmin } = require("../middlewares/isAdmin");

router.post("/approveAll", isAdmin, approveAll);
router.post("/rejectAll", isAdmin, rejectAll);
router.post("/approveDay0", isAdmin, approveDay0);
router.post("/approve10x", isAdmin, approve10x);
router.post("/approve100x", isAdmin, approve100x);
router.post("/approveOne/:id", isAdmin, approveOne);
router.post("/rejectOne/:id", isAdmin, rejectOne);
router.post("/approveEventAll", isAdmin, approveEventAll);
router.post("/rejectEventAll", isAdmin, rejectEventAll);
router.post("/enterOne/:id", isAdmin, enterOne);
router.post("/deleteApproval/:id", isAdmin, deleteApproval);

module.exports = router;
