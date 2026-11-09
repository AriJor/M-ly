export function mainApi(req, res, fs, crypto) {
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

  // Return specific data with fallback checks for userInfo
  res.json({
    success: true,
    server: {
      username: user.username,
      joinedServers: user.joinedServers,

      // User profile
      pfp: user.userInfo ? user.userInfo.pfp : '',
      userInfoBackground: user.userInfo ? user.userInfo.background : ''
    }
  });
}