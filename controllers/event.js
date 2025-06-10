const fs = require("fs");
const path = require("path");
const BASE_PATH = process.env.BACKEND_URL;
const Event = require("../models/event");

exports.addEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      address,
      type,
      visibility = "private",
      scheduledFor,
      inclusions,
      price,
      subtitle,
      duration,
      itinerary,
    } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    let imageUrls = [];
    if (req.files && req.files.images) {
      let images = [];
      if (!Array.isArray(req.files.images)) {
        images.push(req.files.images);
      } else {
        images = req.files.images;
      }

      imageUrls = await Promise.all(
        images.map(async (image) => {
          const safeName = image.name.replace(/[^a-z0-9.\-_]/gi, "_"); // sanitize name
          const filename = Date.now() + "-" + safeName;
          const filePath = path.join(__dirname, "..", "uploads", filename);
          await image.mv(filePath);
          return `${BASE_PATH}/uploads/${filename}`;
        })
      );
    }

    let poster = null;
    if (req.files && req.files.poster) {
      const imageName = req.files.poster.name.replace(/[^a-z0-9.\-_]/gi, "_");
      const filename = `${Date.now()}-${imageName}`;
      const filePath = path.join(__dirname, "..", "uploads", filename);
      await req.files.poster.mv(filePath);
      poster = `${BASE_PATH}/uploads/${filename}`;
    }

    const newEvent = await Event.create({
      title: title,
      description: description,
      start_date: startDate,
      end_date: endDate ? endDate : null,
      location: JSON.parse(location),
      address: address ? JSON.parse(address) : null,
      category: type,
      schedduledFor: scheduledFor ? scheduledFor : null,
      scheuled: scheduledFor ? true : false,
      visibility: visibility,
      includes: JSON.parse(inclusions),
      price: price,
      images: imageUrls,
      poster: poster,
      subtitle: subtitle,
      duration: duration,
      itinerary: itinerary ? JSON.parse(itinerary) : null,
    });
    await newEvent.save();

    return res.status(201).json({
      message: "Event added successfully",
      event: newEvent,
    });
  } catch (error) {
    console.error("Error adding event:", error);
    return res
      .status(500)
      .json({ message: "Error occurred while adding event" });
  }
};

exports.publishEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    event.visibility = "public";
    await event.save();

    return res.status(200).json({
      message: "Event published successfully",
    });
  } catch (error) {
    console.error("Error publishing event:", error);
    return res
      .status(500)
      .json({ message: "Error occurred while publishing event" });
  }
};

exports.unpublishEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(400).json({
        message: "Event not found",
      });
    }

    event.visibility = "private";
    await event.save();

    return res.status(200).json({
      message: "Event unpublished successfully",
    });
  } catch (error) {
    console.error("Error unpublishing event:", error);
    return res
      .status(500)
      .json({ message: "Error occurred while unpublishing event" });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params; // Get the event ID from the URL
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      address,
      type,
      visibility = "private",
      scheduledFor,
      inclusions,
      price,
      duration,
      subtitle,
      itinerary,
    } = req.body;
    // Ensure eventId exists in the database
    // console.log(id);

    let imageUrls = [];
    if (req.files && req.files.newImages) {
      let images = [];
      if (!Array.isArray(req.files.newImages)) {
        images.push(req.files.newImages);
      } else {
        images = req.files.newImages;
      }

      imageUrls = await Promise.all(
        images.map(async (image) => {
          const safeName = image.name.replace(/[^a-z0-9.\-_]/gi, "_"); // sanitize name
          const filename = Date.now() + "-" + safeName;
          const filePath = path.join(__dirname, "..", "uploads", filename);
          await image.mv(filePath);
          return `${BASE_PATH}/uploads/${filename}`;
        })
      );
    }
    if (req.body.images) {
      if (Array.isArray(req.body.images)) {
        imageUrls = [...imageUrls, ...req.body.images];
      } else {
        const temp = [req.body.images];
        imageUrls = [...imageUrls, ...temp];
      }
    }
    let poster = null;
    if (req.files && req.files.poster) {
      const safeName = req.files.poster.name.replace(/[^a-z0-9.\-_]/gi, "_"); // sanitize name
      const filename = Date.now() + "-" + safeName;
      const filePath = path.join(__dirname, "..", "uploads", filename);
      await req.files.poster.mv(filePath);
      poster = `${BASE_PATH}/uploads/${filename}`;
    }
    // imageUrls = [...imageUrls, ...req.body.images];
    // console.log("urls", imageUrls);

    const updateData = {
      title: title,
      description: description,
      start_date: startDate,
      end_date: endDate ? endDate : null,
      location: JSON.parse(location),
      address: address ? JSON.parse(address) : null,
      category: type,
      scheduledFor: scheduledFor ? scheduledFor : null,
      scheduled: scheduledFor ? true : false,
      visibility: visibility,
      includes: inclusions ? JSON.parse(inclusions) : null,
      price: price,
      images: imageUrls,
      duration: duration,
      subtitle: subtitle,
      itinerary: itinerary ? JSON.parse(itinerary) : null,
    };

    if (poster !== null) {
      updateData.poster = poster;
    }

    const event = await Event.findByIdAndUpdate(eventId, updateData, {
      new: true,
    });

    if (!event) {
      return res.status(400).json({ message: "Event not found" });
    }

    return res.status(200).json({
      message: "Event added successfully",
      event: event,
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return res
      .status(500)
      .json({ message: "Error occurred while updating event" });
  }
};

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({});
    return res.status(200).json({ events: events });
  } catch (error) {
    console.error("Error getting all events:", error);
    return res
      .status(500)
      .json({ message: "Error occurred while getting all events" });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(400).json({ message: "Event not found" });
    }

    await event.deleteOne();
    return res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Error deleting event:", error);
    return res
      .status(500)
      .json({ message: "Error occurred while deleting event" });
  }
};

exports.getSingleEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }
    const event = await Event.findById(eventId)
      .populate({
        path: "requests",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "approved",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      })
      .populate({
        path: "attendees",
        populate: [
          { path: "userId", model: "User" },
          { path: "eventId", model: "Event" },
        ],
      });
    if (!event) {
      return res.status(400).json({ message: "Event not found" });
    }

    return res.status(200).json({ event: event });
  } catch (error) {
    console.error("Error getting single event:", error);
    return res
      .status(500)
      .json({ message: "Error occurred while getting single event" });
  }
};

exports.fetchEventData = async (req, res) => {
  try {
    const events = await Event.find({ visibility: "public" });
    const data = [];

    events.map((event) => {
      const eventData = {
        title: event.title,
        description: event.description,
        price: event.price,
        requests: event.requests.length,
        attendees: event.attendees.length,
        start_date: event.start_date,
        end_data: event.end_date,
        location: event.location,
        address: event.address ? event.address : null,
        included: event.includes,
        category: event.category,
        images: event.images,
        poster: event.poster,
        duration: event.duration,
        subtitle: event.subtitle,
        itinerary: event.itinerary,
        _id: event._id,
      };
      data.push(eventData);
    });

    return res.status(200).json({
      message: "Events fetched successfully",
      events: data,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error occured" });
  }
};
