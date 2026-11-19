// Imports
import { io } from "https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.8.4/socket.io.esm.min.js";

// Info
const socket = io("http://10.29.71.203:3000");
const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// Variables
const usersOnCall = {};
let localStream = null;
let peerConnections = {};

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

function createPeerConnection(userId, isInitiator) {
  if (peerConnections[userId]) {
    return peerConnections[userId]
  };

  const pc = new RTCPeerConnection(ICE_SERVERS);
  peerConnections[userId] = pc;

  if (localStream) {
    localStream.getTracks().forEach(
      track => pc.addTrack(track, localStream)
    );
  }

  pc.ontrack = (event) => {
    let remoteAudio = document.getElementById(`audio-${userId}`);
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

  pc.onicecandidate = (event) => {
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
    pc.createOffer().then(offer => {
      return pc.setLocalDescription(offer);
    }).then(() => {
      socket.emit("signal", {
        to: userId,
        signal: {
          description: pc.localDescription
        }
      });
    }).catch(err => console.error("Error creating offer:", err));
  }
  
  return pc;
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

function handleServerCall() {
  const serverCallJoinButton = document.querySelector("#server-call-join-button");
  serverCallJoinButton.addEventListener("click", async (event) => {
    // Setup
    serverCallJoinButton.style.backgroundColor = "red";
    serverCallJoinButton.querySelector("b").textContent = "Poistu";

    // Disconect from the call
    serverCallJoinButton.addEventListener("click", async (event) => {
      // Setup
      serverCallJoinButton.style.backgroundColor = "green";
      serverCallJoinButton.querySelector("b").textContent = "Liity";

      socket.emit("disconnecting");
    });
    
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
      } catch (err) {
        console.error("Error accessing microphone:", err);
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
      userName: username
    });

    // Create user template for server call & make sure to not create a duplicate
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
  });
}

function handleServerText() {
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
        handleServerText();
      } else {
        alert(data.message || "Failed to fetch server data.");
      }
    } catch (error) {
      console.error("Error connecting to server:", error);
      alert("Could not connect to the server.");
    }
  });
}


// -------------> Socket on <------------- \\
socket.on("connect", () => {
  console.log("Connected successfully! Socket ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Connection failed:", err.message);
});

socket.on("room-users", (users) => {
  users.forEach(user => {
    if (user.userId !== socket.id) {
      createUserCallTemplate(user.userName, user.userId);
      createPeerConnection(user.userId, true);
    }
  });
});

socket.on("user-joined", async (data) => {
  console.log(`${data.userName} joined the call!`);
  createUserCallTemplate(data.userName, data.userId);
});

socket.on("signal", async ({ from, signal }) => {
  let pc = peerConnections[from];
  if (!pc) {
    pc = createPeerConnection(from, false);
  }

  if (signal.description) {
    await pc.setRemoteDescription(new RTCSessionDescription(signal.description));
    if (signal.description.type === "offer") {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("signal", {
        to: from,
        signal: {
          description: pc.localDescription
        }
      });
    }
  } else if (signal.candidate) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    } catch (e) {
      console.error("Error adding received ice candidate", e);
    }
  }
});
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