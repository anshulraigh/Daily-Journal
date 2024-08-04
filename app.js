//jshint esversion:6

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
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    mongoUrl: "mongodb://localhost:27017/journalDB" // Your MongoDB URL here
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

app.get("/", checkAuthenticated, async (req, res) => {
  try {
    const posts = await Post.find({});
    res.render("home", {
      startingContent: "Start writing your story and see your entries come to life below.",
      posts: posts
    });
  } catch (err) {
    console.error("Error fetching posts", err);
    res.sendStatus(500);
  }
});

app.get("/about", checkAuthenticated, (req, res) => {
  res.render("about", { aboutContent: "About Content" });
});

app.get("/contact", checkAuthenticated, (req, res) => {
  res.render("contact", { contactContent: "Contact Content" });
});

app.get("/compose", checkAuthenticated, (req, res) => {
  res.render("compose");
});

app.post("/compose", checkAuthenticated, async (req, res) => {
  const post = new Post({
    title: req.body.postTitle,
    content: req.body.postBody
  });

  try {
    await post.save();
    res.redirect("/");
  } catch (err) {
    console.error("Error saving post", err);
    res.sendStatus(500);
  }
});

app.get("/posts/:postId", checkAuthenticated, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.postId });
    res.render("post", {
      title: post.title,
      content: post.content
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

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
