const express = require("express");

const app = express();

app.use(JSON.stringify());

app.post("/", function (req, res) {});

exports.addToCart = async (req, res) => {
  const { id } = req.user;
  const cart = new Cart({ ...req.body, user: id });
  try {
    const doc = await cart.save();
    const result = await doc.populate("product");
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json(err);
  }
};

const router = express.Router();
//  /auth is already added in base path
router.post("/signup", createUser);
