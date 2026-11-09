export function createServerApi(req, res, fs, crypto) {
  // Check authorization
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "No token provided"
    });
  }

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

  const serverName = req.body.serverName || req.body.inputtedServerName;
  if (!serverName) {
    return res.status(400).json({
      success: false,
      message: "Server name is required"
    });
  }

  // Check if the sent name has already been taken
  const existingServer = data.servers.find(n => n.name === serverName);
  if (existingServer) {
    return res.status(400).json({
      success: false, 
      message: "Server name is already taken"
    });
  }
  
  // Set the new server values
  const newServer = {
    "name": serverName,
    "joinCode": "",
    "owner": user.username,
    "joinedUsers": []
  };

  // Save the new server
  data.servers.push(newServer);
  newServer.joinedUsers.push(user.username);
  user.joinedServers.push(serverName);
  fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));

  res.json({
    success: true,
    serverData: newServer
  });
}