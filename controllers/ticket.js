const Ticket = require("../models/ticket");
const path = require("path");
const { sendTicketReplyEmail } = require("../utils/mailer");

exports.createTicket = async (req, res) => {
  try {
    const { email, description, category } = req.body;

    if (!email || !description || !category) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    let imageUrls = [];

    if (req.files && req.files.images) {
      let imgArr = [];
      console.log(req.files.images);
      if (Array.isArray(req.files.images)) {
        imgArr = req.files.images;
      } else {
        imgArr.push(req.files.images);
      }
      const BASE_PATH = process.env.BACKEND_URL;
      imageUrls = await Promise.all(
        imgArr.map(async (image) => {
          const safeName = image.name.replace(/[^a-z0-9.\-_]/gi, "_"); // sanitize name
          const filename = Date.now() + "-" + safeName;
          const filePath = path.join(__dirname, "..", "uploads", filename);
          await image.mv(filePath);
          return `${BASE_PATH}/${filename}`;
        })
      );
    }

    const newTicket = await Ticket.create({
      category: category,
      description: description,
      email: email,
      images: imageUrls,
    });

    newTicket.save();

    return res.status(200).json({
      message: "Your ticket has been submitted successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while sending ticket",
    });
  }
};

exports.replyTicket = async (req, res) => {
  try {
    const { reply } = req.body;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Ticker ID is required",
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }
    ticket.status = "in-touch";

    //SEND REPLY ON EMAIL AND WHATSAPP
    await sendTicketReplyEmail(ticket.email, reply);

    await ticket.save();
    return res.status(200).json({
      message: "Reply sent successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error while sending the message",
    });
  }
};

exports.closeTicket = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Ticket ID is required",
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    ticket.status = "resolved";
    await ticket.save();

    return res.status(200).json({
      message: "Ticket closed successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while closing the tiket",
    });
  }
};

exports.getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({});
    if (!tickets) {
      return res.status(404).json({
        message: "Tickets not found",
      });
    }

    return res.status(200).json({
      message: "Tickets fetched successfully",
      tickets,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while fetching tickets",
    });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        message: "Ticket ID required",
      });
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
      });
    }

    return res.status(200).json({
      ticket,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Error while fetching ticket details",
    });
  }
};
