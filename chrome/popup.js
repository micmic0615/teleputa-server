

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
   
    const connect = ()=>{
        const ws = new WebSocket(`wss://teleputa.herokuapp.com`);
        ws.binaryType = "blob";

        ws.addEventListener("open",  (event) => {
            console.log("Websocket connection opened");
            chrome.runtime.sendMessage(chrome.runtime.id,"connected")

            let newPlayPauseButton = document.createElement("div")
            newPlayPauseButton.style.width = "100%";
            newPlayPauseButton.style.height = "100%";
            newPlayPauseButton.style.backgroundColor = "rgba(255,0,0,0.35)"
            newPlayPauseButton.style.position = "absolute"
            newPlayPauseButton.style.pointerEvents = "all"
            newPlayPauseButton.classList.add("custom-play-button-puta")

            let currentPlayPauseButton =  document.querySelector(".control_buttons_play_pause");
            currentPlayPauseButton.style.position = "relative"
            currentPlayPauseButton.style.pointerEvents = "none"

            currentPlayPauseButton.appendChild(newPlayPauseButton)

            window.sessionName = String(Math.round(Math.random()*999999999))

            newPlayPauseButton.addEventListener("click",  () => {
                document.querySelector(".shaka-video-container video").dispatchEvent(new MouseEvent("click"))

                setTimeout(()=>{
                    let action = document.querySelector(".control_buttons_play_pause").classList.contains("control_buttons_play") ? "pause" : "play"
                    ws.send(`${window.sessionName}-${action}-${document.querySelector(".shaka-video-container video").currentTime}`);
                },200)
            })
        });
        ws.addEventListener("close", event => {
            console.log("Websocket connection closed");
            if (document.querySelector(".custom-play-button-puta")){
                document.querySelector(".custom-play-button-puta").remove()
            }

            connect()
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
    }

    connect()

    const readMessage = (message)=>{
        if (message){
            let messageSession = message.split('-')[0]
            let messageAction = message.split('-')[1]
            let messageTimestamp = message.split('-')[2]
            if (messageSession != window.sessionName){
                document.querySelector(".shaka-video-container video").currentTime = messageTimestamp
                if (messageAction == "play"){
                    console.log(document.querySelector(".shaka-video-container video").play)
                    document.querySelector(".shaka-video-container video").play()
                    document.querySelector(".shaka-video-container video").dispatchEvent(new MouseEvent("play"))
                } else {
                    console.log(document.querySelector(".shaka-video-container video").pause)
                    document.querySelector(".shaka-video-container video").pause()
                    document.querySelector(".shaka-video-container video").dispatchEvent(new MouseEvent("pause"))
                }
                
               
            }
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