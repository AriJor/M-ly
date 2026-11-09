export function loginApi(req, res, fs, crypto) {
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
        username: user.username,
        token: user.token
      }
    });
    // Expect an error, like wrongly inputted password
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid username or password"
    });
  }
}