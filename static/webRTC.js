var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port)
var constraints = { audio: true };
// Media Devices
navigator.mediaDevices.getUserMedia(constraints).then(function (mediaStream) {
    var mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.onstart = function (e) {
        // diving the audio into chunks
        this.chunks = [];
    };

    mediaRecorder.ondataavailable = function (e) {
        // push all the audio bytes to radio
        this.chunks.push(e.data);
        var blob = new Blob(this.chunks);
        socket.emit('radio', { 'blob': blob });
    };

    mediaRecorder.start();

    setInterval(function () {
        mediaRecorder.stop()
        mediaRecorder.start();
    }, 300);
});

/// Enter call (mediaRecorder.start())
/// Leave call (mediaRecorder.stop())

socket.on('voice', function (arrayBuffer) {
    var blob = new Blob([arrayBuffer], { 'type': 'audio/webm;codecs=opus' });
    var audio = document.createElement('audio');
    audio.src = window.URL.createObjectURL(blob);
    audio.play();
});