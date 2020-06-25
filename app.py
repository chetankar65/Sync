import os
from flask import Flask, render_template,jsonify, request, session
from flask_socketio import SocketIO, emit, join_room, leave_room, send
import uuid
'''
import urlparse

def get_video_id(value):
    """
    Examples:
    - http://youtu.be/SA2iWivDJiE
    - http://www.youtube.com/watch?v=_oPAwA_Udwc&feature=feedu
    - http://www.youtube.com/embed/SA2iWivDJiE
    - http://www.youtube.com/v/SA2iWivDJiE?version=3&amp;hl=en_US
    """
    query = urlparse.urlparse(value)
    if query.hostname == 'youtu.be':
        return query.path[1:]
    if query.hostname in ('www.youtube.com', 'youtube.com'):
        if query.path == '/watch':
            p = urlparse.parse_qs(query.query)
            return p['v'][0]
        if query.path[:7] == '/embed/':
            return query.path.split('/')[2]
        if query.path[:3] == '/v/':
            return query.path.split('/')[2]
    # fail?
    return None
'''

app = Flask(__name__)
app.config["SECRET_KEY"] = 'somerandomstring'
socketio = SocketIO(app)

room_messages = {}

@app.route("/")
def index():
    return render_template('room.html')

@app.route("/room/<string:value>")
def room():
    return render_template('room.html')

@app.route("/generate_room")
def generate_room():
    generated_string_room = str(uuid.uuid4())
    return generated_string_room

@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['code']
    link = data['link']
    video_id = link.split('=')[1]
    print(video_id)
    greeting = username + f' has entered the room {room}'
    join_room(room)
    print('Joined room')
    socketio.emit("allRooms", {'greet': greeting, 'link': video_id}, room = room)

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['code']
    leave_room(room)
    print('Left room')
    greet = f'{username} has left the room.'
    socketio.emit("left" , greet , room = room)


@socketio.on('message')
def send_message(data):
    username = data['username']
    message = data['message']
    room = data['code']
    socketio.emit("allmessages", {"username": username, "message": message}, room = room)

'''
@socketio.on('controls')
def control_video(data):
    status = data['status']
    time = data['time']
    volume = data['volume']
    mute = data['mute']
    seekTo = data['seekTo']
    socketio.emit('controllers', {'status': status, 'time': time, 'volume': volume, 'mute': mute}, room = room)
'''

if __name__ == '__main__':
    socketio.run(app)