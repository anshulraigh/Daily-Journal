//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("./config/mongoose");
const MongoStore = require("connect-mongo");
const User = require("./models/User");
const Post = require("./models/Post");
const postController = require('./controllers/postController');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URL
  })
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware for authentication checks
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return res.redirect("/profile");
  next();
}

// Pagination settings
const POSTS_PER_PAGE = 8;

// Home page: display public posts with pagination
app.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  try {
    const totalPosts = await Post.countDocuments({ public: true });
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

    const posts = await Post.find({ public: true })
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * POSTS_PER_PAGE)
      .limit(POSTS_PER_PAGE);

    res.render("home", {
      startingContent: "Start writing your story and see your entries come to life below.",
      posts: posts,
      currentPage: page,
      totalPages: totalPages,
      user: req.user  // Pass the user to the view
    });
  } catch (err) {
    console.error("Error fetching posts", err);
    res.sendStatus(500);
  }
});

app.get("/search", async (req, res) => {
  const query = req.query.query;
  try {
    const results = await Post.find({
      $or: [
        { title: new RegExp(query, 'i') },
        { 'author.username': new RegExp(query, 'i') }
      ]
    })
    .populate('author', 'username')
    .sort({ createdAt: -1 });

    res.render('searchResults', { results, user: req.user });
  } catch (err) {
    console.error("Error during search", err);
    res.sendStatus(500);
  }
});

app.get('/autocomplete', async (req, res) => {
  const query = req.query.query;
  try {
    const searchResults = await Post.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
      ]
    })
    .populate('author', 'username')
    .sort({ createdAt: -1 })
    .limit(5);

    const formattedResults = searchResults.map(post => ({
      _id: post._id,
      title: post.title,
      author: post.author.username
    }));

    res.json(formattedResults);
  } catch (err) {
    console.error("Error during autocomplete", err);
    res.sendStatus(500);
  }
});

app.get("/about", (req, res) => {
  res.render("about", { aboutContent: "About Content", user: req.user });
});

app.get("/contact", (req, res) => {
  res.render("contact", { contactContent: "Contact Content", user: req.user });
});

app.get("/compose", checkAuthenticated, (req, res) => {
  res.render("compose", { user: req.user });
});

app.post("/compose", checkAuthenticated, async (req, res) => {
  const isPublic = req.body.isPublic === 'true';
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    public: isPublic,
    author: req.user._id
  });

  try {
    await post.save();
    res.redirect("/profile");
  } catch (err) {
    console.error("Error saving post", err);
    res.sendStatus(500);
  }
});

app.get("/posts/:postId", checkAuthenticated, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId }).populate('author', 'username');
    if (!post) return res.sendStatus(404);

    res.render("post", {
      post: post,
      user: req.user
    });
  } catch (err) {
    console.error("Error fetching post", err);
    res.sendStatus(500);
  }
});

app.get("/posts/:postId/edit", checkAuthenticated, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId, author: req.user._id });
    if (!post) return res.redirect("/profile");

    res.render("editPost", { post, user: req.user });
  } catch (err) {
    console.error("Error fetching post for editing", err);
    res.sendStatus(500);
  }
});

app.post("/posts/:postId/edit", checkAuthenticated, async (req, res) => {
  try {
    await Post.updateOne(
      { _id: req.params.postId, author: req.user._id },
      { title: req.body.title, content: req.body.content, public: req.body.isPublic === 'on' }
    );
    res.redirect(`/posts/${req.params.postId}`);
  } catch (err) {
    console.error("Error updating post", err);
    res.sendStatus(500);
  }
});

app.post("/posts/:postId/delete", checkAuthenticated, async (req, res) => {
  try {
    await Post.deleteOne({ _id: req.params.postId, author: req.user._id });
    res.redirect("/profile");
  } catch (err) {
    console.error("Error deleting post", err);
    res.sendStatus(500);
  }
});

app.get("/register", checkNotAuthenticated, (req, res) => {
  res.render("register");
});

app.post("/register", checkNotAuthenticated, (req, res) => {
  User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/profile");
      });
    }
  });
});

app.get("/profile", checkAuthenticated, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  try {
    const totalPosts = await Post.countDocuments({ author: req.user._id });
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

    const posts = await Post.find({ author: req.user._id })
      .populate('author', 'username')
      .skip((page - 1) * POSTS_PER_PAGE)
      .limit(POSTS_PER_PAGE)
      .sort({ createdAt: -1 });

    res.render("profile", {
      user: req.user,
      posts: posts,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (err) {
    console.error("Error fetching user's posts", err);
    res.sendStatus(500);
  }
});

app.get("/login", checkNotAuthenticated, (req, res) => {
  res.render("login");
});

app.post("/login", checkNotAuthenticated, (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, (err) => {
    if (err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, () => {
        res.redirect("/profile");
      });
    }
  });
});

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/login");
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
