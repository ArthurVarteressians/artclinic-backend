const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const db = require("../database");
const moment = require("moment");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const util = require("util");

const SECRET = "1I1d6WhwZWjGn4ijZDpBaGq";
const query = util.promisify(db.query).bind(db);

router.post("/", async (req, res) => {
  const { name, email, age, phonenumber, password, registrationDate } = req.body;

  // Check if password is provided
  if (password) {
    try {
      // Format registrationDate to YYYY-MM-DD
      const formattedDate = moment(registrationDate, "YYYY-MM-DD").format("YYYY-MM-DD");

      // Check if email or phone number already exists in the database
      const existingUser = await query(
        "SELECT COUNT(*) as emailCount, COUNT(*) as phoneNumberCount FROM patientslist WHERE email = ? OR phonenumber = ?",
        [email, phonenumber]
      );

      // Check if email or phone number already exists
      const emailCount = existingUser[0].emailCount;
      const phoneNumberCount = existingUser[0].phoneNumberCount;

      if (emailCount > 0) {
        return res.status(400).json({ message: "Email already exists" });
      } else if (phoneNumberCount > 0) {
        return res.status(400).json({ message: "Phone number already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert the new user with the registrationDate
      await query(
        "INSERT INTO patientslist (name, email, age, phonenumber, hashedpassword, registration_date, patient_status) VALUES (?, ?, ?, ?, ?, ?, 0)",
        [name, email, age, phonenumber, hashedPassword, formattedDate]
      );

      // Retrieve the new user and generate JWT token
      const newUser = await query("SELECT * FROM patientslist WHERE email = ?", [email]);

      const token = jwt.sign({ id: newUser[0].id }, SECRET, {
        expiresIn: "10m",
      });

      // Respond with success and the token
      return res.status(200).header("Authorization", token).json({
        message: "New patient added",
        token: token,
      });

    } catch (err) {
      console.error("Error inserting new patient: ", err);
      return res.status(500).send("Internal server error");
    }
  } else {
    console.error("Passwords do not match");
    return res.status(400).send("Passwords do not match");
  }
});

module.exports = router;

