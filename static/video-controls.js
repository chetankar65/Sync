var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port)

var audio = document.getElementById("message_audio")

function playAudio() { 
    audio.play(); 
} 

function pauseAudio() { 
    audio.pause(); 
} 
// Create UUID
function create_UUID()
{
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c == 'x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
}
var room_code = create_UUID()
// Send message
function send_message() 
{
    var code = room_code
    var message = document.querySelector('#message').value
    var username = 'chetankar65'
    if (message.length == 0 && message.trim() == "")
    {
        return false
    } 
    else 
    {
        socket.emit('message', {'code': code, 'username': username, 'message': message})
        document.querySelector('#message').value = ''
        return false
    }
}
// On connect
socket.on('connect', () => {
    document.querySelector('#form').onsubmit = () => {
        var code = room_code
        var link = document.querySelector('#link').value
        var username = 'chetankar65'
        if (link.length == 0){
            swal('Please enter some value!')
            return false
        } else {
            socket.emit('join', {'code': code, 'username': username, 'link': link})
            return false
        }
    }
})
// Play boolean... stream it over all devices in room
var play = true;
// exit the room
function exit() 
{
    var code = room_code
    socket.emit('leave', {'code': code, 'username': 'chetankar65'})
    location.reload();
}
/// give alert if someone left
socket.on('left', function (json) 
{
    playAudio()
})

function enter(id) 
{
    var input = document.getElementById(id)
    input.addEventListener("keyup", function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            document.getElementById("send_btn").click();
        }
    });
}

socket.on('allRooms', function(json) 
{
    var video_id = json.link
    playAudio()
    swal(json.greet);
    document.getElementById('alert').innerHTML = '<h3>Do not refresh the page as you will lose progress and need to rejoin</h3>'
    document.querySelector('#main').innerHTML = `
    <div class='row'>
        <div class="col-lg-8">
            <div id="video-placeholder" style="width:100%;height:500px;"></div>
            <div class="jumbotron" id="controls">
                <p><span id="current-time">0:00</span> / <span id="duration">0:00</span></p>
                <input type="range" id="progress-bar" value="0" style="width:100%;"><br>
                <i id="play" class="material-icons">play_arrow</i>
                <i id="pause" class="material-icons">pause</i>
                <i id="mute-toggle" class="material-icons">volume_up</i><br>
                <div class="row">
                    <div class="col-sm-6 col-lg-6 col-6 col-md-6">
                        <p>Speed</p>
                        <select id="speed">
                            <option>0.25</option>
                            <option>0.5</option>
                            <option selected="selected">1</option>
                            <option>1.5</option>
                            <option>2</option>
                        </select>
                    </div>
                    <div class="col-sm-6 col-lg-6 col-6 col-md-6">
                        <p>Quality</p>
                        <select id="quality">
                            <option>small</option>
                            <option>medium</option>
                            <option selected="selected">large</option>
                            <option>hd720</option>
                            <option>hd1080</option>
                            <option>highres</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <br><br>
        <div class="col-lg-4">
            <button class='btn btn-danger' onclick="exit()">Exit room</button><br><br>
            <h3>Chat :</h3><hr>
            <div id="messages" style="height:400px;overflow:scroll;" align='left'>
            </div>
            <br>
            <input type="text" id="message" style="width:100%;padding:20px;" placeholder="Message...">
            <button style="padding: 12px 20px 12px;width:100%;" class="submit" onclick="send_message()" id="send_btn" hidden>Send message</button>
            <br>
        </div>
    </div>
    `
    enter('message');
    onYouTubeIframeAPIReady(video_id)
})

function scrollToBottom (id) 
{
    var div = document.getElementById(id);
    div.scrollTop = div.scrollHeight - div.clientHeight;
}

socket.on('allmessages', function(json) 
{
    document.querySelector('#messages').innerHTML += 
        `<div id="message_box">
            <b>${json.username}
            </b><br><br>
            ${json.message}
        </div><br>`
    scrollToBottom ("messages") 
    playAudio()
    return false
})

var player, time_update_interval = 0
function onYouTubeIframeAPIReady(video_id) {
    player = new YT.Player('video-placeholder', {
        width: 600,
        height: 400,
        videoId: video_id,
        playerVars: {
            color: 'white',
            controls:0,
            autoplay:0,
            loop:0
        },
        events: {
            onReady: initialize
        }
    });
}
//
function initialize()
{
    // Update the controls on load
    updateTimerDisplay();
    updateProgressBar();
    // Clear any old interval.
    clearInterval(time_update_interval);
    // Start interval to update elapsed time display and
    // the elapsed part of the progress bar every second.
    time_update_interval = setInterval(function () {
        updateTimerDisplay();
        updateProgressBar();
    }, 1000);

    $('#volume-input').val(Math.round(player.getVolume()));
}
// This function is called by initialize()
function updateTimerDisplay(){
    // Update current time text display.
    $('#current-time').text(formatTime( player.getCurrentTime() ));
    $('#duration').text(formatTime( player.getDuration() ));
}
// This function is called by initialize()
function updateProgressBar(){
    // Update the value of our progress bar accordingly.
    $('#progress-bar').val((player.getCurrentTime() / player.getDuration()) * 100);
}
// Progress bar
jQuery(document.body).on('mouseup touchend','#progress-bar' ,function (event) {
    // Calculate the new time for the video.
    // new time in seconds = total duration in seconds * ( value of range input / 100 )
    var newTime = player.getDuration() * (event.target.value / 100);
    // Skip video to new time.
    player.seekTo(newTime);
});
// Playback
jQuery(document.body).on('click','#play' ,function (event) {
    player.playVideo();
});

jQuery(document.body).on('click',' #pause' ,function (event) {
    player.pauseVideo();
});
// Sound volume
jQuery(document.body).on('click', '#mute-toggle' ,function(event) {
    var mute_toggle = $(this);
    if(player.isMuted()){
        player.unMute();
        mute_toggle.text('volume_up');
    }
    else{
        player.mute();
        mute_toggle.text('volume_off');
    }
});

jQuery(document.body).on('change', '#speed' ,function (event) {
    player.setPlaybackRate($(this).val());
});

jQuery(document.body).on('change', '#quality' ,function (event) {
    player.setPlaybackQuality($(this).val());
});
// Load video
// Helper Functions
function formatTime(time){
    time = Math.round(time);

    var minutes = Math.floor(time / 60),
        seconds = time - minutes * 60;

    seconds = seconds < 10 ? '0' + seconds : seconds;

    return minutes + ":" + seconds;
}

/*
function check()
{
    if (player.getPlayerState() == 1)
    {
        socket.emit(1) to other people in the room
    }
    else if (player.getPlayerState() == 2)
    {
        socket.emit(2) to other people
    }
    else if (player.getPlayerState() == -1)
    {
        get ready with your popcorn
    }
    else 
    {
        whatever
    }
}
*/

//check frequently video state.
/*
-1 - unstarted
0 - ended
1 - playing
2 - paused
3 - buffering
5 - video cued

*/

