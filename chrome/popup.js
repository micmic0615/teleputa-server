

buttonKonek.addEventListener("click", async () => {
    document.querySelector("#buttonKonek").innerHTML = "CONNECTING"
    document.querySelector("#buttonKonek").classList.add("connecting")

    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: connectToWebSocket
    })
});

// The body of this function will be executed as a content script inside the
// current page
function connectToWebSocket() {
   
    const ws = new WebSocket(`wss://teleputa.herokuapp.com`);
    ws.binaryType = "blob";

    ws.addEventListener("open",  (event) => {
        console.log("Websocket connection opened");
        chrome.runtime.sendMessage(chrome.runtime.id,"connected")

        let newPlayPauseButton = document.createElement("div")
        newPlayPauseButton.style.width = "100%";
        newPlayPauseButton.style.height = "100%";
        newPlayPauseButton.style.backgroundColor = "#f00"
        newPlayPauseButton.style.position = "absolute"
        newPlayPauseButton.style.pointerEvents = "all"

        let currentPlayPauseButton =  document.querySelector(".control_buttons_play_pause");
        currentPlayPauseButton.style.position = "relative"
        currentPlayPauseButton.style.pointerEvents = "none"

        currentPlayPauseButton.appendChild(newPlayPauseButton)

        window.sessionName = String(Math.round(Math.random()*999999999))

        newPlayPauseButton.addEventListener("click",  () => {
            ws.send(`${window.sessionName}-click`);
            document.querySelector(".shaka-video-container video").dispatchEvent(new MouseEvent("click"))
        })
    });
    ws.addEventListener("close", event => {
        console.log("Websocket connection closed");
    });
    ws.onmessage = function (message) {
        if (message.data instanceof Blob) {
            reader = new FileReader();
            reader.onload = () => {
                readMessage( reader.result)
            };
            reader.readAsText(message.data);
        } else {
            readMessage(message.data)
        }
    }

    const readMessage = (message)=>{
        let messageSession = message.split('-')[0]
        console.log(messageSession,window.sessionName )
        if (messageSession != window.sessionName){
            document.querySelector(".shaka-video-container video").click()
            document.querySelector(".shaka-video-container video").dispatchEvent(new MouseEvent("click"))
        }
    }
}


chrome.runtime.onMessage.addListener(
    function(request) {
        switch(request){
            case "connected":
                document.querySelector("#buttonKonek").innerHTML = "CONNECTED"
                document.querySelector("#buttonKonek").classList.add("connected")
                break
        }
        
    }
);