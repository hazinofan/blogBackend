const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const user = require("./models/user");
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const jwt = require('jsonwebtoken');
const secret = 'zfhblaizfblzuiabfa9486f6ze45'

app.use(cors({credentials:true, origin: 'http://localhost:3000'}));
app.use(express.json());

app.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body
    
    const userData = await user.create({
      username,
      password:bcrypt.hashSync(password,salt),
      email });
    res.json(userData); 
  } catch (error) {    
    console.error("Error creating user:", error)
    res.status(500).json({ error: "Failed to create user" })
  }
})

app.post("/login", async (req, res) => {
  const { username, password } = req.body
  
  try {
    const userDoc = await user.findOne({ $or: [{ username }, { email: username }] })
    if (!userDoc) {
      return res.status(400).json({ error: 'User not found' })
    }

    const passOk = bcrypt.compareSync(password, userDoc.password)
    if (passOk) {
      const token = jwt.sign({ username, id: userDoc._id }, secret)
      res.cookie('token', token).json('ok')
    } else {
      res.status(400).json('Wrong credentials')
    }
  } catch (error) {
    console.error("Error during login:", error)
    res.status(500).json({ error: "An error occurred during login" });
  }
});


mongoose
  .connect(
    "mongodb+srv://maarouf:barcabarcaa123@cluster0.dt0qwfi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(
      4000, () => { 
      console.log("Server is running on port 4000");
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB", error);
  });
