const mongoose = require("mongoose");

const fitspaceSchema = new mongoose.Schema({
  fitspaceName: {
    type: String,
    required: true,
  },
});

const FitSpace = mongoose.model("FitSpace", fitspaceSchema);

module.exports = FitSpace;
