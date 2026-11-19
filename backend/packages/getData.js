export function getData(info, req, res, fs) {
  // Check authorization
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "No token provided"
    });
  }

  // Info
  const infoType = info.type;
  const infoName = info.name;

  // Find user data
  const data = JSON.parse(fs.readFileSync('./db.json', 'utf8'));
  let selectedData = null;
  const selectedDataType = data[infoType];

  if (infoType === "users") {
    const token = authHeader.split(' ')[1];
    if (infoName) {
      selectedData = selectedDataType[infoName];
    } else {
      selectedData = selectedDataType.find(u => u.token === token);
    }
  } else {
    selectedData = selectedDataType[infoName];
  }
  
  if (!selectedData) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token"
    });
  }

  // Return specific data
  res.json({
    success: true,
    server: selectedData
  });
}