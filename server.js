const express = require('express');
const cors = require('cors');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send("API Server is running!");
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
  const user = data.users.find(u => u.username === username && u.password === password);
  if (user) {
    const randomToken = crypto.randomBytes(32).toString('hex');
    user.token = randomToken;
    fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));
    
    res.json({
        success: true,
        token: randomToken,
        user: { id: user.id, username: user.username }
    });
  } else {
    res.status(401).json({ success: false, message: "Invalid username or password" });
    }
});