const express = require("express");
const router = express.Router();

const {
  sendRequest,
  getRequests,
  approveRequest,
  rejectRequest,
} = require("../controllers/registrationRequest");

const { isAdmin } = require("../middlewares/isAdmin");

router.post("/request", sendRequest);
router.get("/requests", isAdmin, getRequests);
router.put("/requests/approve/:id", isAdmin, approveRequest);
router.put("/requests/reject/:id", isAdmin, rejectRequest);

module.exports = router;
