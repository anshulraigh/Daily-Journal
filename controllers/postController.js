const Post = require('../models/Post'); // Import the Post model

// Get all posts
exports.getPosts = async (req, res) => {
  try {
    const posts = await Post.find({}).populate('author');
    res.render('home', { posts });
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// Edit a post
exports.editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.author.equals(req.user._id)) { // Ensure user is the author
      post.title = req.body.title;
      post.content = req.body.content;
      post.public = req.body.isPublic === 'on';
      await post.save();
      res.redirect(`/posts/${post._id}`);
    } else {
      res.status(403).send('Unauthorized');
    }
  } catch (err) {
    res.status(500).send('Server Error');
  }
};

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (post.author.equals(req.user._id)) {
      await post.remove();
      res.redirect('/profile');
    } else {
      res.status(403).send('Unauthorized');
    }
  } catch (err) {
    res.status(500).send('Server Error');
  }
};
