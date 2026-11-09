// Server cerate
const middleButtonContainer = document.querySelector("#middle-button-container");
document.querySelector("#server-create").addEventListener("click", (event) => {
  event.preventDefault();
  middleButtonContainer.classList.add("active");
});

// Exit creating a server via Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    middleButtonContainer.classList.remove("active");
  }
});

document.querySelector("#create-server-button").addEventListener("click", async (event) => {
  event.preventDefault();

  const inputtedServerName = document.querySelector("#create-server-input").value;
  const token = localStorage.getItem("authToken"); 

  try {
    const response = await fetch('http://localhost:3000/api/createServer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ serverName: inputtedServerName })
    });

    const serverData = await response.json();
    if (response.ok && serverData.success) {
      console.log(serverData.serverData);
      alert("Server creation completed");
      middleButtonContainer.classList.remove("active");

      const joinedServerListContainer = document.querySelector("#joined-server-list-container");
      const joinedServerTempplate = document.querySelector("#joined-server-tempplate");
      if (joinedServerListContainer && joinedServerTempplate) {
        const copy = joinedServerTempplate.cloneNode(true);
        if (copy) {
          const serverTitle = copy.querySelector("h1");
          serverTitle.textContent = serverData.serverName

          copy.style.display = "block";
          joinedServerListContainer.append(copy);
        } else {
          console.error("Could not get the copy for the server")
        }
      } else {
        console.error("Joined server container & template not found")
      }
    } else {
      alert(serverData.message || "Server creation failed.");
    }
  } catch (error) {
    console.error("Error connecting to server:", error);
    alert("Could not connect to the server.");
  }
});