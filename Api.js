const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const Post = require('./models/Post')
const user = require("./models/user");
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const jwt = require('jsonwebtoken');
const secret = 'zfhblaizfblzuiabfa9486f6ze45'
const cookieParser = require('cookie-parser')
const multer = require('multer')
const uploadMiddleware = multer({ dest : 'uploads/'})


app.use(cors({credentials:true, origin: 'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads' , express.static(__dirname + '/uploads'))

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
      res.cookie('token', token).json({
        id:userDoc._id,
        username
      })
    } else {
      res.status(400).json('Wrong credentials')
    }
  } catch (error) {
    console.error("Error during login:", error)
    res.status(500).json({ error: "An error occurred during login" });
  }
});

app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    res.json(info);
  });
});

app.post('/logout', (req,res) => {
  res.cookie('token', '').json('ok')
});


app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  const { token } = req.cookies;
  
  // Verify the JWT token
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Ensure req.file and req.body are defined
      if (!req.file || !req.body.title || !req.body.summary || !req.body.content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Create the post document
      const { title, summary, content } = req.body;
      const { path: cover } = req.file;
      const imagePath = cover; // Define imagePath here
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: imagePath,
        author: info.id,
      });
      
      const populatedPost = await Post.findById(postDoc._id).populate('author');
      res.json(populatedPost);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: 'Failed to create post' });
    }
  });
});

app.get('/post', async (req, res) => {
  try {
    const posts = await Post.find().sort({createdAt: -1}).limit(20);
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/post/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate('author', ['username']);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/post/:id', uploadMiddleware.single('file'), async (req, res) => {
  const { id } = req.params;
  const { title, summary, content } = req.body;
  const newPath = req.file ? req.file.path : null;

  jwt.verify(req.cookies.token, secret, {}, async (err, info) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const postDoc = await Post.findById(id);
      if (!postDoc) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (String(postDoc.author) !== String(info.id)) {
        return res.status(403).json({ error: 'You are not the author of this post' });
      }

      postDoc.title = title;
      postDoc.summary = summary;
      postDoc.content = content;
      // Update the cover only if a new file was uploaded
      if (newPath) {
        postDoc.cover = newPath;
      }
      await postDoc.save();

      res.json(postDoc);
    } catch (error) {
      console.error('Error updating post:', error);
      res.status(500).json({ error: 'Failed to update post' });
    }
  });
});


// app.get('/profile/:username', async (req, res) => { // Change to accept username as parameter
//   const { username } = req.params;
//   try {
//     const user = await User.findOne({ username });
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }
//     res.json(user);
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });




mongoose
  .connect(
    "mongodb+srv://maarouf:barcabarcaa123@cluster0.dt0qwfi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0" ,
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
