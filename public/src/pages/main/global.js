async function fetchProtectedData() {
  // User token
  const token = localStorage.getItem('authToken');
  if (!token) {
    alert("You are not logged in!");
    window.location.href = "../login/login.html";
    return;
  }

  try {
    // Get data from through the backend
    const response = await fetch('http://localhost:3000/api/main', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Info
    const data = await response.json();

    // Check if data is available
    if (response.ok) {
      console.log("Protected data received:", data);
    } else {
      alert("Session expired or invalid. Please log in again.");
      localStorage.clear();
      window.location.href = "../login/login.html";
    }
  } catch (error) {
    console.error("Error connecting to server:", error);
  }
}
fetchProtectedData();