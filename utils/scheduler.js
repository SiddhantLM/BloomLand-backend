const cron = require("node-cron");
// const client = require("../config/database");
const Event = require("../models/event");
// Runs every minute
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    const events = await Event.find({ scheduled: true, visibility: "private" });
    for (let e of events) {
      if (new Date(e.scheduledFor) < now) {
        e.visibility = "public";
        await e.save();
      }
    }
  } catch (err) {
    console.error("Scheduler error:", err);
  }
});
