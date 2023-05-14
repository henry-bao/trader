"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Item = new Schema({
  itemName: String,
  itemPic: String,
  fileName: String,
  itemPrice: String,
  itemCurrency: String,
  itemDescription: String,
  itemTags: String,
  itemOwner: String,
  itemOwnerId: String,
  itemAdditionDate: String,
  itemRequests: Array,
  key: String,
});

module.exports = mongoose.model("Item", Item);
