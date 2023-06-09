// const express = require("express");
// const mysql = require("mysql2");
// const app = express();
// const port = 3000;
// const cors = require("cors");
// app.use(cors());

// const connection = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "yassine99",
//   database: "train",
// });

// app.use(express.json());

// app.get("/users", (req, res) => {
//   connection.query("SELECT * FROM users", function (err, results, fields) {
//     if (err) {
//       console.log(err);
//       res.status(500).send(err);
//     } else {
//       res.json(results);
//     }
//   });
// });

// app.post("/login", (req, res) => {
//   const { username, password } = req.body;
//   const query = "SELECT * FROM users WHERE username = ?";
//   connection.query(query, [username], (err, results) => {
//     if (err) {
//       console.log(err);
//       res.status(500).send(err);
//     } else if (results.length === 0) {
//       res.json({ authenticated: false });
//     } else if (password === results[0].PasswordHash) {
//       console.log("Authentication successful for user:", username);
//       res.json({ authenticated: true });
//     } else {
//       res.json({ authenticated: false });
//     }
//   });
// });

// // Endpoint to get all existing events
// app.get("/events", (req, res) => {
//   connection.query("SELECT * FROM events", function (err, results) {
//     if (err) {
//       console.log(err);
//       res.status(500).send(err);
//     } else {
//       res.json(results);
//     }
//   });
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

app.use(bodyParser.json()); // for parsing application/json

app.post("/signup", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("train");
    const users = db.collection("users");
    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const user = { username: req.body.username, password: hashedPassword };
    const result = await users.insertOne(user);
    res.json({ success: true, userId: result.insertedId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Something went wrong" });
  } finally {
    await client.close();
  }
});

app.post("/login", async (req, res) => {
  try {
    await client.connect();

    const db = client.db("train");
    const users = db.collection("users");

    const user = await users.findOne({ username: req.body.username });
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(400).json({ authenticated: false });
    }
    return res.json({ authenticated: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Something went wrong" });
  } finally {
    await client.close();
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
