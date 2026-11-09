export function registerApi(req, res, fs, crypto) {
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
}