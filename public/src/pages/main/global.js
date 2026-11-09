// Left sidebar
import "./components/leftSide/script.js";

// Settings
import "./components/settings/script.js";

async function loadUserData() {
  const token = localStorage.getItem("authToken"); 

  try {
    const response = await fetch('http://localhost:3000/api/main', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const serverData = await response.json();
    if (response.ok && serverData.success) {
      for (const server of serverData.server.joinedServers) {
        const joinedServerListContainer = document.querySelector("#joined-server-list-container");
        const joinedServerTempplate = document.querySelector("#joined-server-tempplate");
        if (joinedServerListContainer && joinedServerTempplate) {
          const copy = joinedServerTempplate.cloneNode(true);
          if (copy) {
            const serverTitle = copy.querySelector("h1");
            serverTitle.textContent = server;

            const serverButton = copy.querySelector("button");
  
            copy.style.display = "block";
            joinedServerListContainer.append(copy);
          } else {
            console.error("Could not get the copy for the server")
          }
        } else {
          console.error("Joined server container & template not found")
        }
      }
    } else {
      alert(serverData.message || "User data load failed.");
    }
  } catch (error) {
    console.error("Error connecting to server:", error);
    alert("Could not connect to the server.");
  }
};
loadUserData();