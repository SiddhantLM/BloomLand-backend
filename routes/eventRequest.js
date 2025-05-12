const express = require("express");
const router = express.Router();

const {
  sendEventRequest,
  approveEventRequest,
  rejectEventRequest,
  getEventRequests,
  getEventApproved,
  getEventAttendees,
  getEventRequestsByEventId,
  getEventApprovedByEventId,
  getEventAttendeesByEventId,
  joinEvent,
  withdrawRequest,
} = require("../controllers/eventRequest");
const { isAuth } = require("../middlewares/isAuth");
const { isAdmin } = require("../middlewares/isAdmin");

router.post("/send", isAuth, sendEventRequest);

router.put("/approve/:id", isAdmin, approveEventRequest);
router.put("/reject/:id", isAdmin, rejectEventRequest);

router.get("/requests", isAdmin, getEventRequests);
router.get("/approved", isAdmin, getEventApproved);
router.get("/attendees", isAdmin, getEventAttendees);

router.get("/requests/:eventId", isAdmin, getEventRequestsByEventId);
router.get("/approved/:eventId", isAdmin, getEventApprovedByEventId);
router.get("/attendees/:eventId", isAdmin, getEventAttendeesByEventId);

router.post("/join", isAuth, joinEvent);
router.post("/withdraw", isAuth, withdrawRequest);

module.exports = router;
