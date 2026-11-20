export function joinServerApi(req, res, fs) {
  // Check authorization
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "No token provided"
    });
  }

  const token = authHeader.split(" ")[1];

  // Find user data
  const data = JSON.parse(fs.readFileSync("./db.json", "utf8"));
  const user = data.users.find(u => u.token === token);
  if (!user) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token"
    });
  }

  const serverCode = req.body.serverCode
  if (!serverCode) {
    return res.status(400).json({
      success: false,
      message: "Server code is required"
    });
  }

  const serverData = data.servers.find(x => x.joinCode === serverCode);
  if (!serverData) {
    return res.status(400).json({
      success: false,
      message: "Server does not exist"
    });
  }

  // Save the new server
  user.joinedServers.push(serverData.name);
  fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));

  res.json({
    success: true,
    serverData: serverData
  });
}