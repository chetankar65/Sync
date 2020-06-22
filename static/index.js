var player,
    time_update_interval = 0;

    document.addEventListener('DOMContentLoaded', () => 
{
    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port)

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

    function send_message() 
    {
        var code = room_code
        var message = document.querySelector('#message').value
        var username = 'chetankar65';
        if (message.length == 0)
        {
            alert('Please enter some message!')
            return false
        } else {
            socket.emit('join', {'code': code, 'username': username, 'message': message})
            return false
        }
    }

    socket.on('connect', () => {
        document.querySelector('#form').onsubmit = () => {
            var code = room_code
            var link = document.querySelector('#link').value
            var username = 'chetankar65';
            if (code.length == 0){
                alert('Please enter some value!')
                return false
            } else {
                socket.emit('join', {'code': code, 'username' : username, 'link':link})
                return false
            }
        }
    })
    
    // Play boolean... stream it over all devices in room
    var play = true;

    socket.on('allRooms', function(json) 
    {
        document.querySelector('#active').innerHTML += `<b>${json.greet}</b><br>`
        document.querySelector('#main').innerHTML = `
        <div class='row'>
            <div class="col-lg-6">
                <iframe width="600" height="345" src="${json.link}">
                </iframe>
            </div>
            <br><br>
            <div class="col-lg-6">
                <button class='btn btn-danger'>Exit room</button><br>
                <h3>Chat :</h3><br>
                <div id="messages" style="height:250px;">
                </div>
                <br><br>
                <form id="form3">
                    <input type="text" id="message" placeholder="Message"><br>
                    <button style="padding: 12px 20px 12px;" class="submit" onclick="send_message()">Send message</button>
                </form>
            </div>
        </div>
        `
    })

    socket.on('allmessages', function(json) 
    {
        document.querySelector('#messages').innerHTML += `<b>${json.username}</b> <br> ${json.message} <br><hr>`
    })
})

//https://www.youtube.com/embed/tgbNymZ7vqY

function onYouTubeIframeAPIReady() {
    player = new YT.Player('video-placeholder', {
        width: 600,
        height: 400,
        videoId: 'Xa0Q0J5tOP0',
        playerVars: {
            color: 'white',
            playlist: 'taJ60kskkns,FG0fTKAqZ5g'
        },
        events: {
            onReady: initialize
        }
    });
}

function initialize(){

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

$('#progress-bar').on('mouseup touchend', function (e) {

    // Calculate the new time for the video.
    // new time in seconds = total duration in seconds * ( value of range input / 100 )
    var newTime = player.getDuration() * (e.target.value / 100);

    // Skip video to new time.
    player.seekTo(newTime);

});


// Playback

$('#play').on('click', function () {
    player.playVideo();
});


$('#pause').on('click', function () {
    player.pauseVideo();
});


// Sound volume


$('#mute-toggle').on('click', function() {
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

$('#volume-input').on('change', function () {
    player.setVolume($(this).val());
});


// Other options


$('#speed').on('change', function () {
    player.setPlaybackRate($(this).val());
});

$('#quality').on('change', function () {
    player.setPlaybackQuality($(this).val());
});


// Playlist

$('#next').on('click', function () {
    player.nextVideo()
});

$('#prev').on('click', function () {
    player.previousVideo()
});


// Load video

$('.thumbnail').on('click', function () {

    var url = $(this).attr('data-video-id');

    player.cueVideoById(url);

});


// Helper Functions

function formatTime(time){
    time = Math.round(time);

    var minutes = Math.floor(time / 60),
        seconds = time - minutes * 60;

    seconds = seconds < 10 ? '0' + seconds : seconds;

    return minutes + ":" + seconds;
}


$('pre code').each(function(i, block) {
    hljs.highlightBlock(block);
});