const express = require("express");
const router = express.Router();

const {
  addEvent,
  publishEvent,
  unpublishEvent,
  getAllEvents,
  updateEvent,
  deleteEvent,
  getSingleEvent,
  fetchEventData,
} = require("../controllers/event");

const { isAdmin } = require("../middlewares/isAdmin");

router.post("/add", isAdmin, addEvent);
router.post("/publish", isAdmin, publishEvent);
router.post("/unpublish", isAdmin, unpublishEvent);
router.get("/all", isAdmin, getAllEvents);
router.get("/events", fetchEventData);
router.get("/getSingle/:eventId", getSingleEvent);
router.put("/update/:eventId", isAdmin, updateEvent);
router.delete("/delete/:eventId", isAdmin, deleteEvent);

module.exports = router;
