const button = document.querySelector("#register-button");
button.addEventListener('click', async (event) => {
  event.preventDefault();

  try {
    window.location.href = "../main/main.html";
  } catch (error) {
    console.error("Registration error:", error);
  }
});