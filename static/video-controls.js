var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port)
var audio = document.getElementById("message_audio")
/// Playing the audio
function playAudio() { 
    audio.play(); 
} 
// Pausing the audio
function pauseAudio() { 
    audio.pause(); 
} 
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
// Enter button
var input = document.getElementById('message')
input.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("send_btn").click();
    }
});

socket.on('video-player', function (json) 
{
    onYouTubeIframeAPIReady(json.link)
    return false;
})

function scrollToBottom(id) 
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

    scrollToBottom("messages") 
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
// Initialise video 
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
    // $('#volume-input').val(Math.round(player.getVolume()));
}
// This function is called by initialize()
function updateTimerDisplay()
{
    // Update current time text display.
    $('#current-time').text(formatTime(player.getCurrentTime()));
    $('#duration').text(formatTime(player.getDuration()));
    /// controllers
}
// This function is called by initialize()
function updateProgressBar()
{
    // Update the value of our progress bar accordingly.
    $('#progress-bar').val((player.getCurrentTime() / player.getDuration()) * 100);
}
// Progress bar
jQuery(document.body).on('mouseup touchend', '#progress-bar' ,function (event) 
{
    // Calculate the new time for the video.
    // new time in seconds = total duration in seconds * ( value of range input / 100 )
    var newTime = player.getDuration() * (event.target.value / 100);
    // Skip video to new time.
    socket.emit('control_time', {'newtime': newTime, 'code': room_code})
    //player.seekTo(newTime);
});
// play video
jQuery(document.body).on('click','#play' , function (event) 
{
    var control = true
    socket.emit('control_video', {'control': control, 'code': room_code})
});
// pause Video
jQuery(document.body).on('click',' #pause' , function (event) 
{
    var control = false
    socket.emit('control_video', {'control':  control, 'code': room_code})
});
// Sound volume
jQuery(document.body).on('click', '#mute-toggle' , function(event) 
{
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
// speed of the video
jQuery(document.body).on('change', '#speed' , function (event) 
{
    socket.emit('control_speed', {'speed': speed, 'code': room_code})
});
// quality of the video
jQuery(document.body).on('change', '#quality' , function (event) 
{
    player.setPlaybackQuality($(this).val());
});
// Time
function formatTime(time){
    time = Math.round(time);

    var minutes = Math.floor(time / 60),
        seconds = time - minutes * 60;

    seconds = seconds < 10 ? '0' + seconds : seconds;

    return minutes + ":" + seconds;
}

socket.on('time', function(json) 
{
    player.seekTo(json.newtime, true)
    return false
})

socket.on('status', function(json)
{
    if (json.status == true)
    {
        player.playVideo()
    }
    else
    {
        player.pauseVideo()
    }
})

socket.on('speed', function(json)
{
    player.setPlaybackRate(json.speed);
})

/*
Check frequently video state:

-1 - unstarted
0 - ended
1 - playing
2 - paused
3 - buffering
5 - video cued
*/