const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

app.use(bodyParser.json()); // for parsing application/json

app.get("/", (req, res) => {
  res.render("home");
});

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
