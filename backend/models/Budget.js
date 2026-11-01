const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
{
user: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true,
index: true,
},

name: {
  type: String,
  required: true,
  trim: true,
  maxlength: 100,
},

category: {
  type: String,
  required: true,
  enum: [
    "Food",
    "Salary",
    "Shopping",
    "Travel",
    "Bills",
    "Education",
    "Health",
    "Entertainment",
    "Business",
    "Other",
  ],
},

amount: {
  type: Number,
  required: true,
  min: 1,
},

month: {
  type: Number,
  required: true,
  min: 1,
  max: 12,
},

year: {
  type: Number,
  required: true,
  min: 2000,
  max: 2100,
},

alertAt: {
  type: Number,
  default: 80,
  min: 1,
  max: 100,
},

},
{
timestamps: true,
}
);

budgetSchema.index(
{ user: 1, category: 1, month: 1, year: 1 },
{ unique: true }
);

module.exports = mongoose.model("Budget", budgetSchema);