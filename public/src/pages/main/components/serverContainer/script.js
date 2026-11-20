// Imports
import { io } from "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.4/socket.io.esm.min.js";

// Info
const socket = io("http://10.29.71.203:3000");
const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// Variables
const usersOnCall = {};
let localStream = null;
let peerConnections = {};

// -------------> Audio functions <------------- \\
function monitorAudioLevel(stream, onSpeechStateChange) {
  try {
    const audioCtx = new window.AudioContext;
    const analyzer = audioCtx.createAnalyser();
    analyzer.fftSize = 512;

    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyzer);

    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
    let userSpeaking = false;

    function checkVolume() {
      analyzer.getByteFrequencyData(dataArray);
      
      let x = 0;
      for (let i = 0; i < dataArray.length; i++) {
        x += dataArray[i];
      }
      let average = x / dataArray.length;

      const speakingThreshold = 10; 
      const currentlySpeaking = average > speakingThreshold;
      if (currentlySpeaking !== userSpeaking) {
        userSpeaking = currentlySpeaking;
        onSpeechStateChange(userSpeaking);
      }

      requestAnimationFrame(checkVolume);
    }

    checkVolume();
  } catch (error) {
    console.error("Error setting up audio:", error);
  }
}
// --------------------------------------------- \\

// -------------> Remove functions <------------- \\
function removePeerConnection(userId) {
  if (peerConnections[userId]) {
    peerConnections[userId].close();
    delete peerConnections[userId];
  }
  const audioEl = document.querySelector(`#audio-${userId}`);
  if (audioEl) {
    audioEl.remove();
  }
  delete usersOnCall[userId];
}
// ----------------------------------------------- \\

// -------------> Create functions <------------- \\
function createPeerConnection(userId, isInitiator) {
  if (peerConnections[userId]) {
    return peerConnections[userId]
  };

  const device = new RTCPeerConnection(ICE_SERVERS);
  peerConnections[userId] = device;

  if (localStream) {
    localStream.getTracks().forEach(
      track => device.addTrack(track, localStream)
    );
  }

  device.ontrack = (event) => {
    let remoteAudio = document.querySelector(`#audio-${userId}`);
    if (!remoteAudio) {
      remoteAudio = document.createElement("audio");
      remoteAudio.id = `audio-${userId}`;
      remoteAudio.srcObject = event.streams[0];
      remoteAudio.autoplay = true;
      remoteAudio.muted = true;
      remoteAudio.volume = 1.0;
      
      document.body.appendChild(remoteAudio);
  
      setTimeout(() => {
        remoteAudio.muted = false;
      }, 200);
    } else {
      remoteAudio.srcObject = event.streams[0];
    }

    monitorAudioLevel(event.streams[0], (speaking) => {
      const remoteUsername = usersOnCall[userId];
      if (remoteUsername) {
        const userElement = document.querySelector(`[data-username="${remoteUsername}"]`);
        if (userElement) {
          if (speaking) {
            userElement.classList.add("speaking");
          } else {
            userElement.classList.remove("speaking");
          }
        }
      }
    });
  };

  device.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", {
        to: userId,
        signal: {
          candidate: event.candidate
        }
      });
    }
  };

  if (isInitiator) {
    device.createOffer().then(offer => {
      return device.setLocalDescription(offer);
    }).then(() => {
      socket.emit("signal", {
        to: userId,
        signal: {
          description: device.localDescription
        }
      });
    }).catch(error =>
      console.error("Error creating offer:", error
      ));
  }
  
  return device;
}
function createUserCallTemplate(name, userId) {
  const serverCallCemplate = document.querySelector("#server-call-template");
  const clone = serverCallCemplate.cloneNode(true);
  if (clone) {
    clone.style.display = "block";
    clone.dataset.username = name;
    clone.querySelector("p").textContent = name;

    if (userId) {
      usersOnCall[userId] = name;
    }

    const serverCallUserContainer = document.querySelector("#server-call-user-container");
    serverCallUserContainer.append(clone);
  } else {
    console.error("Could not clone server call template");
  }
}
// ----------------------------------------------- \\

// -------------> Handle functions <------------- \\
function handleMuteButton() {
  const muteButton = document.querySelector("#server-call-mute-button");
  muteButton.addEventListener("click", () => {
    if (!localStream) {
      return
    };
    
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      if (audioTrack.enabled) {
        muteButton.style.backgroundColor = "green";
      } else {
        muteButton.style.backgroundColor = "red";
      }
    }
  });
}
function handleDefault() {
  const serverCallButtonContainer = document.querySelector("#server-call-button-container").querySelector("div");
  serverCallButtonContainer.style.display = "flex";

  const serverTextContainer = document.querySelector("#server-text-container");
  serverTextContainer.style.display = "block";

  const serverCallUserContainer = document.querySelector("#server-call-user-container");
  serverCallUserContainer.style.opacity = "100%";
  serverCallUserContainer.style.justifyContent = "flex-start";
  serverCallUserContainer.style.alignContent = "flex-start";
  
  const serverCallConnectionText = serverCallUserContainer.querySelector("h1");
  serverCallConnectionText.textContent = "";

  const serverTextUserContainer = document.querySelector("#default-server-text-container");
  serverTextUserContainer.querySelector("div").style.opacity = "100%";
  
  const serverTextConnectionText = serverTextUserContainer.querySelector("h1");
  serverTextConnectionText.textContent = "";
  
  function onMobile() {
    return window.matchMedia("(any-hover: none)").matches && window.matchMedia("(max-width: 1024px)").matches;
  }

  if (onMobile() == true) {
    // PHONE

    console.log("PHONE")
    document.querySelector("body").style.overflow = "auto";

    const serverCallTemplate = document.querySelector("#server-call-template");
    serverCallTemplate.style.width = "30vw";
    
    const serverContainer = document.querySelector("#server-container");
    serverContainer.style.width = "98%";
    serverContainer.style.display = "flex";
    serverContainer.style.flexDirection = "column";
    serverContainer.style.height = "60vh";
    serverContainer.style.justifyContent = "flex-start";
  
    const leftSide = document.querySelector("#left-side");
    leftSide.style.display = "none"; 

    const serverTextUserContainer = document.querySelector("#default-server-text-container");
    serverTextUserContainer.style.height = "70%";

    serverTextContainer.style.flex = "0 0 50%";
    serverCallUserContainer.style.height = "80%";

    const serverCallBackButton = document.querySelector("#server-call-back-button");
    serverCallBackButton.style.display = "block";
    serverCallBackButton.addEventListener("click", async (event) => {
      serverContainer.style.display = "none";
      leftSide.style.display = "flex";
    });
  } else {
    // PC
    
    console.log("PC")
    
    const defaultServerCallContainer = document.querySelector("#default-server-call-container");
    defaultServerCallContainer.style.opacity = "100%";
    
    const DefaultServerTextInputContainer = document.querySelector("#default-server-textInput-container");
    DefaultServerTextInputContainer.style.cursor = "pointer";
    DefaultServerTextInputContainer.style.pointerEvents = "all";

    const serverCallContainer = document.querySelector("#server-call-container");
    serverCallContainer.style.flex = "0 0 70%";
    serverCallContainer.style.height = "90%";

    serverTextContainer.style.flex = "0 0 28%";
  }
}
async function handleServerCall() {
  const serverCallJoinButton = document.querySelector("#server-call-join-button");
  serverCallJoinButton.addEventListener("click", async (event) => {
    if (serverCallJoinButton.querySelector("b").textContent === "Liity") {
      serverCallJoinButton.style.backgroundColor = "red";
      serverCallJoinButton.querySelector("b").textContent = "Poistu";
  
      async function initAudioCall() {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              autoGainControl: true
            },
            video: false
          });
      
          const username = localStorage.getItem("username");
          monitorAudioLevel(localStream, (speaking) => {
            const userElement = document.querySelector(`[data-username="${username}"]`);
            if (userElement) {
              if (speaking) {
                userElement.classList.add("speaking");
              } else {
                userElement.classList.remove("speaking");
              }
            }
          });
          
          const muteButton = document.querySelector("#server-call-mute-button");
          if (muteButton) {
            muteButton.style.backgroundColor = "green";
          }
        } catch (error) {
          console.error("Error accessing microphone:", error);
          alert("Microphone access is required for the call.");
        }
      }
      await initAudioCall();
  
      // Info
      const username = localStorage.getItem("username");
  
      // Setup
      handleMuteButton();
      socket.emit("join-call", {
        roomId: 1,
        username: username
      });
  
      const serverCallUserContainer = document.querySelector("#server-call-user-container");
      if (serverCallUserContainer) {
        let isDuplicate = false;
      
        for (const user of serverCallUserContainer.children) {
          const userText = user.querySelector("p");
          if (userText) {
            const gottenName = userText.textContent?.trim();
            if (gottenName === username) {
              console.log("Duplicate call template");
              isDuplicate = true;
              break;
            }
          }
        }
      
        if (!isDuplicate) {
          createUserCallTemplate(username);
        }
      }
    } else {
      // Disconnect from the call
      serverCallJoinButton.style.backgroundColor = "green";
      serverCallJoinButton.querySelector("b").textContent = "Liity";
          
      socket.emit("leave-call", {
        roomId: 1,
        username: localStorage.getItem("username")
      });
    
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
      }
    
      Object.keys(peerConnections).forEach(userId => {
        removePeerConnection(userId);
      });
    
      const serverCallUserContainer = document.querySelector("#server-call-user-container");
      const userCards = serverCallUserContainer.querySelectorAll("[data-username]");
      userCards.forEach(card => card.remove());
    }
  });
}
function handleServerText(serverData) {
  console.log(serverData)
  // Delete old messages
  const serverTextMessagesWrapper = document.querySelector("#server-text-messages-wrapper");
  const serverTextTemplate = document.querySelector("#server-text-template");
  serverTextMessagesWrapper.replaceChildren(serverTextTemplate);

  function createText(savedTextInfo) {
    if (serverTextTemplate) {
      const clone = serverTextTemplate.cloneNode(true);
    
      const contentText = clone.querySelector("p");
      contentText.textContent = savedTextInfo.text;
  
      const sentUser = clone.querySelector("h1");
      sentUser.textContent = savedTextInfo.from;
  
      clone.style.display = "flex";
      
      serverTextMessagesWrapper.append(clone);
      serverTextMessagesWrapper.scrollTop = serverTextMessagesWrapper.scrollHeight;
    }
  }
  
  // Load saved messages
  for (const savedTextInfo of serverData.sentText) {
    createText(savedTextInfo);
  }
  
  const defaultServerTextInputContainer = document.querySelector("#default-server-textInput-container");
  defaultServerTextInputContainer.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      const serverContainer = document.querySelector("#server-container");
      const serverName = serverContainer.classList[0];

      const sentMessage = defaultServerTextInputContainer.value;
      if (sentMessage) {
        const username = localStorage.getItem("username");
        console.log(username)
        socket.emit("chat message",
          {
            sentMessage: sentMessage,
            serverName: serverName,
            username: username
          });
      }
    }
  });
}
// ----------------------------------------------- \\

// -------------> Main function <------------- \\
export function serverHandler(copy, server) {
  const serverButton = copy.querySelector("button");
  if (!serverButton) return;

  serverButton.addEventListener("click", async () => {
    try {
      const params = new URLSearchParams({ serverName: server });
      const response = await fetch(`http://10.29.71.203:3000/api/selectServer?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });
  
      const data = await response.json();
      if (response.ok && data.success) {
        handleDefault();
        handleServerCall();
        handleServerText(data.serverData);
      } else {
        alert(data.message || "Failed to fetch server data.");
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
      alert("Could not connect to the server.");
    }
  });
}
// ------------------------------------------- \\

// -------------> Socket on <------------- \\
// Connect \\
socket.on("connect", () => {
  console.log("Connected successfully! Socket ID:", socket.id);
});
socket.on("connect_error", (error) => {
  console.error("Connection failed:", error.message);
});

// Room \\
socket.on("room-users", (users) => {
  users.forEach(user => {
    if (user.userId !== socket.id) {
      createUserCallTemplate(user.username, user.userId);
      createPeerConnection(user.userId, true);
    }
  });
});
socket.on("user-joined", async (data) => {
  createUserCallTemplate(data.username, data.userId);
});
socket.on("user-left", async ({ username, userId }) => {
  removePeerConnection(userId);
  
  const serverCallUserContainer = document.querySelector("#server-call-user-container");
  if (serverCallUserContainer) {
    for (const userCall of serverCallUserContainer.children) {
      const dataUsername = userCall.getAttribute("data-username");
      if (dataUsername && dataUsername === username) {
        userCall.remove();
      }
    }
  }
});

// Audio \\
socket.on("signal", async ({ from, signal }) => {
  let device = peerConnections[from];
  if (!device) {
    device = createPeerConnection(from, false);
  }

  if (signal.description) {
    await device.setRemoteDescription(new RTCSessionDescription(signal.description));
    if (signal.description.type === "offer") {
      const answer = await device.createAnswer();
      await device.setLocalDescription(answer);
      socket.emit("signal", {
        to: from,
        signal: {
          description: device.localDescription
        }
      });
    }
  } else if (signal.candidate) {
    try {
      await device.addIceCandidate(new RTCIceCandidate(signal.candidate));
    } catch (error) {
      console.error("Error adding received ice candidate", error);
    }
  }
});

// Send message \\
socket.on("chat message", ({ sentMessage, username }) => {
  const messagesWrapper = document.querySelector("#default-server-text-container").querySelector("div");
  const serverTextTemplate = document.querySelector("#server-text-template");
  
  if (serverTextTemplate && messagesWrapper) {
    const clone = serverTextTemplate.cloneNode(true);
  
    const contentText = clone.querySelector("p");
    contentText.textContent = sentMessage;

    const sentUser = clone.querySelector("h1");
    sentUser.textContent = `${username}: `;

    clone.style.display = "flex";
    
    messagesWrapper.append(clone);
    messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
  }
});
// -------------------------------------- \\