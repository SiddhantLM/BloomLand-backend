const client = require("../config/database");
const { sendRegistrationStatusEmail } = require("../utils/mailer");

exports.sendRequest = async (req, res) => {
  try {
    const { name, email, country, number } = req.body;
    if (!name || !email || !country || !number) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const query = `
            INSERT INTO registration_requests (name, email, country, number)
            VALUES ($1, $2, $3, $4)
        `;
    await client.query(query, [name, email, country, number]);
    res.status(201).json({ message: "Request sent successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const query = `
            SELECT * FROM registration_requests
        `;
    const result = await client.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    //RETRIEVE EMAIL
    const emailQuery = "SELECT * FROM registration_requests WHERE id = $1";
    const emailResult = await client.query(emailQuery, [id]);

    if (emailResult.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = emailResult.rows[0];
    const email = request.email;

    // Step 2: Insert the approved request into approved_requests table
    const insertApprovedQuery = `
   INSERT INTO approved_requests (email, name, country, number, created_at)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING *;
 `;
    const insertValues = [
      request.email,
      request.name,
      request.country,
      request.number,
      new Date(),
    ];
    const approvedResult = await client.query(
      insertApprovedQuery,
      insertValues
    );

    // Step 3: Delete the request from registration_requests
    const deleteRequestQuery =
      "DELETE FROM registration_requests WHERE id = $1";
    await client.query(deleteRequestQuery, [id]);

    await sendRegistrationStatusEmail(email, "approved");
    res.status(200).json({ message: "Request approved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;

    //RETRIEVE EMAIL
    const emailQuery = "SELECT email FROM registration_requests WHERE id = $1";
    const emailResult = await client.query(emailQuery, [id]);

    if (emailResult.rows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const email = emailResult.rows[0].email;

    const query = `
            DELETE FROM registration_requests
            WHERE id = $1
        `;
    await client.query(query, [id]);

    await sendRegistrationStatusEmail(email, "rejected");
    res.status(200).json({ message: "Request rejected successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
