// Require
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');

// Setup
const app = express();
app.use(express.json());
app.use(cors());

// Get
app.get('/', (req, res) => {
    res.send("API Server is running!");
});
app.get('/api/main', (req, res) => {
  // Check authorization
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "No token provided"
    });
  }

  // Info
  const token = authHeader.split(' ')[1];

  // Find user data
  const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
  const user = data.users.find(u => u.token === token);
  if (!user) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token"
    });
  }

  // Return spesific data
  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username
    }
  });
});

// Post
app.post('/api/login', (req, res) => {
  // Receive sent username & password
  const { username, password } = req.body;

  // Get user & data
  const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
  const user = data.users.find(user => user.username === username && user.password === password);

  // When logged in, send required user data back to the frontend
  if (user) {
    fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username
      }
    });
    // Expect an error, like wrongly inputted password
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid username or password"
    });
  }
});
app.post('/api/register', (req, res) => {
  // Receive sent username & password
  const { username, password } = req.body;

  // Check if both username & password have been sent
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required"
    });
  }

  // Check if the sent username has already been taken
  const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
  const existingUser = data.users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({
      success: false, message:
      "Username is already taken"
    });
  }

  // New user info
  const lastId = data.users.length > 0 ? Number(data.users[data.users.length - 1].id) : 0;
  const newId = lastId + 1;
  const randomToken = crypto.randomBytes(32).toString('hex');

  // Set the new user values
  const newUser = {
    id: eval(newId),
    username: username,
    password: password,
    addedFriends: [],
    friendRequests: [],
    sentMessages: {
      friends: [],
      direct: []
    },
    token: randomToken
  };

  // Save the new user
  data.users.push(newUser);
  fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));

  // Send back the requred user data back to the frontend
  res.json({
      success: true,
      message: "User registered successfully",
      token: randomToken,
      user: username
    });
});

// Make sure "server.js" can run
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});