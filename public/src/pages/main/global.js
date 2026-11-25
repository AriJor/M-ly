/* Left sidebar */
import "./components/leftSide/script.js";

// Server container
import { serverHandler } from "./components/serverContainer/script.js";

async function loadUserData() {
  const token = localStorage.getItem("authToken"); 

  try {
    const response = await fetch("http://10.29.71.203:3000/api/main", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const selectedData = await response.json();
    if (response.ok && selectedData.success) {
      // Load joined servers
      const data = selectedData.server
      for (const server of data.joinedServers) {
        const joinedServerListContainer = document.querySelector("#joined-server-list-container");
        const joinedServerTemplate = document.querySelector("#joined-server-template");
        if (joinedServerListContainer && joinedServerTemplate) {
          const copy = joinedServerTemplate.cloneNode(true);
          if (copy) {
            const serverContainer = document.querySelector("#server-container");
            serverContainer.classList.add(server);
            
            const serverTitle = copy.querySelector("h1");
            serverTitle.textContent = server;
            
            serverHandler(copy, server);
            copy.style.display = "block";
            copy.style.zIndez = "999";
            joinedServerListContainer.append(copy);
          } else {
            console.error("Could not get the copy for the server")
          }
        } else {
          console.error("Joined server container & template not found")
        }
      }

      // Load user info
      const userInfoName = document.querySelector("#user-info-name");
      userInfoName.textContent = data.username
    } else {
      alert(data.message || "User data load failed.");
    }
  } catch (error) {
    console.error("Error connecting to server:", error);
  }
}
loadUserData();