const registerForm = document.querySelector("#register-form");
registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const username = document.querySelector("#register-username input").value;
  const password = document.querySelector("#register-password input").value;

  try {
    const response = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      
      alert("Registration successful! You can now log in.");
      window.location.href = "../main/main.html";
    } else {
      alert(data.message || "Registration failed.");
    }
  } catch (error) {
    console.error("Error connecting to server:", error);
    alert("Could not connect to the server.");
  }
});