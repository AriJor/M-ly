const loginInputContainer = document.querySelector("#login-input-container");
loginInputContainer.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const username = document.querySelector("#login-username input").value;
  const password = document.querySelector("#login-password input").value;

  try {
    const response = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok && data.success) {
      localStorage.setItem('authToken', data.user.token);
      window.location.href = "../main/main.html";
    } else {
      const errorMsg = data.message || response.statusText || "Login failed.";
      alert("Error: " + errorMsg);
    }
  } catch (error) {
    console.error("Network or server error:", error);
    alert("Failed to connect to the server.");
  }
});