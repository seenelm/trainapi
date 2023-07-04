const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

const FitSpace = require("./models/fitspace");

// Handle initial connection errors
mongoose
  .connect("mongodb://127.0.0.1:27017/train")
  .then(() => {
    console.log("Mongo Connection Open");
  })
  .catch((error) => {
    console.log("Oh No Mongo Connection Error");
    console.log(error);
  });

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

app.get("/ping", (req, res) => {
  res.send("home");
});

app.post("/fitspaces", async (req, res) => {
  console.log("Request: ", req.body);
  const { fitspaceName } = req.body;
  console.log({ fitspaceName });

  if (!fitspaceName) {
    return res.status(400).json({ error: "Name is required" });
  }
  const fitspace = new FitSpace(req.body);
  await fitspace.save();
});

app.listen(3000, () => {
  console.log("APP IS LISTENING ON PORT 3000");
});
