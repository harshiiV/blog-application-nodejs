const express = require('express');
const fs = require('fs');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// -----------------------------
// BLOG POSTS
// -----------------------------
const blogPost = [
  { id: 1, title: 'Learning JavaScript' },
  { id: 2, title: 'Explore MERN Stack' }
];

// -----------------------------
// AUTH + COMMENTS
// -----------------------------
let isAuthenticated = false;
const COMMENTS_FILE = './comments.json';
let comments = {};

//  Load existing comments from file when server starts
if (fs.existsSync(COMMENTS_FILE)) {
  try {
    const data = fs.readFileSync(COMMENTS_FILE, 'utf8');
    comments = JSON.parse(data);
  } catch (err) {
    console.error('Error reading comments file:', err);
    comments = {};
  }
}

// -----------------------------
// ROUTES
// -----------------------------

//  Login Page
app.get('/login', (req, res) => {
  res.render('pages/login', { error: null });
});

//  Handle Login Form
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'password') {
    isAuthenticated = true;
    res.redirect('/'); //  Redirect to home after login
  } else {
    res.render('pages/login', { error: 'Invalid username or password' });
  }
});

//  Logout
app.get('/logout', (req, res) => {
  isAuthenticated = false;
  res.redirect('/login');
});

//  Home Route
app.get('/', (req, res) => {
  // If not logged in, show login page first
  if (!isAuthenticated) {
    return res.redirect('/login');
  }

  res.render('./pages/home', { blogPost, isAuthenticated });
});

//  Individual Post Page
app.get('/pages/:id', (req, res) => {
  if (!isAuthenticated) return res.redirect('/login');

  const postId = req.params.id;
  const post = blogPost.find((p) => p.id == postId);

  if (post) {
    const postComments = comments[postId] || [];
    res.render(`pages/post${post.id}`, {
      post,
      isAuthenticated,
      comments: postComments
    });
  } else {
    res.status(404).render('pages/404');
  }
});

//  Handle Comment Submission
app.post('/pages/:id/comment', (req, res) => {
  const postId = req.params.id;
  const { name, comment } = req.body;

  if (!comments[postId]) comments[postId] = [];
  comments[postId].push({ name, comment });

  // Save comments persistently to file
  fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), (err) => {
    if (err) console.error('Error saving comments:', err);
  });

  res.redirect(`/pages/${postId}`);
});

// About Me Page
app.get('/about', (req, res) => {
  if (!isAuthenticated) return res.redirect('/login');
  res.render('pages/about', { isAuthenticated });
});

//  Contact Page (GET)
app.get('/contact', (req, res) => {
  if (!isAuthenticated) return res.redirect('/login');
  res.render('pages/contact', { isAuthenticated, success: false });
});

//  Handle Contact Form Submission (POST)
app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;

  // Read existing messages from file
  let messages = [];
  if (fs.existsSync('messages.json')) {
    messages = JSON.parse(fs.readFileSync('messages.json', 'utf8'));
  }

  // Add new message
  messages.push({ name, email, message, date: new Date().toLocaleString() });

  // Save back to file
  fs.writeFileSync('messages.json', JSON.stringify(messages, null, 2));

  res.render('pages/contact', { isAuthenticated, success: true });
});

app.listen(port, () => {
  console.log(` Server running at http://localhost:${port}`);
});
