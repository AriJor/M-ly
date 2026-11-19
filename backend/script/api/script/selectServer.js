export function selectServerApi(req, res, fs) {
  const { serverName } = req.query;
  if (!serverName) {
    return res.status(400).json({
      success: false,
      message: "Server name is required"
    });
  }

  try {
    const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
    const serverData = data.servers.find(n => n.name === serverName);
    
    if (!serverData) {
      return res.status(404).json({
        success: false,
        message: "Could not find data for server"
      });
    }

    return res.json({
      success: true,
      serverData: serverData
    });
  } catch (error) {
    console.error("Error reading database:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}