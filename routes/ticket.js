const express = require("express");
const router = express.Router();

const {
  createTicket,
  getAllTickets,
  getTicketById,
  replyTicket,
  closeTicket,
} = require("../controllers/ticket");
const { isAdmin } = require("../middlewares/isAdmin");

router.post("/create", createTicket);

router.get("/all", isAdmin, getAllTickets);
router.get("/:id", isAdmin, getTicketById);
router.post("/reply/:id", isAdmin, replyTicket);
router.put("/close/:id", isAdmin, closeTicket);

module.exports = router;
