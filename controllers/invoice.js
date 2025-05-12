const Invoice = require("../models/invoice");

exports.getAll = async (req, res) => {
  try {
    const invoices = await Invoice.find({}).populate("user_id product_id");

    return res.status(200).json({
      message: "Fetched invoices successfully",
      invoices,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error while fetching invoices",
    });
  }
};
