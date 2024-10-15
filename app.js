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

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}

// Pagination settings
const POSTS_PER_PAGE = 10;

// Home page: display public posts with pagination
app.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  try {
    const totalPosts = await Post.countDocuments({ public: true });
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

    const posts = await Post.find({ public: true })
      .populate('author', 'username')
      .sort({ createdAt: -1 }) // Sort by creation date in descending order
      .skip((page - 1) * POSTS_PER_PAGE)
      .limit(POSTS_PER_PAGE);

    res.render("home", {
      startingContent: "Start writing your story and see your entries come to life below.",
      posts: posts,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (err) {
    console.error("Error fetching posts", err);
    res.sendStatus(500);
  }
});

// My Journals: display user's own posts (both public and private) with pagination
app.get("/myjournals", checkAuthenticated, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  try {
    const totalPosts = await Post.countDocuments({ author: req.user._id });
    const totalPages = Math.ceil(totalPosts / POSTS_PER_PAGE);

    const posts = await Post.find({ author: req.user._id })
      .populate('author', 'username')
      .sort({ createdAt: -1 }) // Sort by creation date in descending order
      .skip((page - 1) * POSTS_PER_PAGE)
      .limit(POSTS_PER_PAGE);

    res.render("myjournals", {
      posts: posts,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (err) {
    console.error("Error fetching user's posts", err);
    res.sendStatus(500);
  }
});

app.get("/about", (req, res) => {
  res.render("about", { aboutContent: "About Content" });
});

app.get("/contact", (req, res) => {
  res.render("contact", { contactContent: "Contact Content" });
});

app.get("/compose", checkAuthenticated, (req, res) => {
  res.render("compose");
});

app.post("/compose", checkAuthenticated, async (req, res) => {
  const isPublic = req.body.isPublic === 'true'; // Check if the journal should be public

  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody,
    public: isPublic, // Save whether the post is public or private
    author: req.user._id // Save the author as the logged-in user
  });

  try {
    await post.save();
    res.redirect("/myjournals"); // Redirect to My Journals after saving
  } catch (err) {
    console.error("Error saving post", err);
    res.sendStatus(500);
  }
});

app.get("/posts/:postId", checkAuthenticated, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId }).populate('author', 'username');
    res.render("post", {
      title: post.title,
      content: post.content,
      author: post.author.username,
      createdAt: post.createdAt
    });
  } catch (err) {
    console.error("Error fetching post", err);
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
        res.redirect("/");
      });
    }
  });
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
        res.redirect("/");
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
