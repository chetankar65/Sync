import os
from flask import Flask, render_template,jsonify, request, session
from flask_socketio import SocketIO, emit, join_room, leave_room, send
import uuid

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
    greeting = username + f' has entered the room {room}'
    join_room(room)
    print('Joined room')
    socketio.emit("allRooms", {'greet': greeting, 'link': link}, room = room)

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
    socketio.emit('controllers', status, room = room)
'''
if __name__ == '__main__':
    socketio.run(app)