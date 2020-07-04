var player = '', time_update_interval = 0

var videoPlayer = function onYouTubeIframeAPIReady(videoId) {
    player = new YT.Player('video-placeholder', {
        width: 600,
        height: 400,
        videoId: videoId,
        playerVars: {
            color: 'white',
            controls: 0,
            autoplay: 0,
            loop: 0
        },
        events: {
            onReady: initialize
        }
    });
}

export default { 
    player, 
    time_update_interval,
    videoPlayer
} 