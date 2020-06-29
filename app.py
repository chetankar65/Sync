import os
from flask import Flask, render_template,jsonify, request, session, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room, send
import uuid
from urllib.parse import urlparse, parse_qs

def extract_video_id(url):
    # Examples:
    # - http://youtu.be/SA2iWivDJiE
    # - http://www.youtube.com/watch?v=_oPAwA_Udwc&feature=feedu
    # - http://www.youtube.com/embed/SA2iWivDJiE
    # - http://www.youtube.com/v/SA2iWivDJiE?version=3&amp;hl=en_US
    query = urlparse(url)
    if query.hostname == 'youtu.be': return query.path[1:]
    if query.hostname in ('www.youtube.com', 'youtube.com'):
        if query.path == '/watch': return parse_qs(query.query)['v'][0]
        if query.path[:7] == '/embed/': return query.path.split('/')[2]
        if query.path[:3] == '/v/': return query.path.split('/')[2]
    # fail?
    return None

app = Flask(__name__)
app.config["SECRET_KEY"] = 'somerandomstring'
socketio = SocketIO(app)

# all links dictionary
allLinks = dict()
# all the messages
room_messages = dict()
# all the users (probably a session)
# room member count
room_members = dict()

@app.route("/")
def index():
    return render_template('index.html')

@app.route('/create_room', methods=['POST'])
def submit():
    username = request.form.get('username')
    link = request.form.get('link')
    room = request.form.get('room')
    allLinks[room] = extract_video_id(link)
    room_members[room] = 1
    # send json
    return jsonify({'success': True, 'code': room})

@app.route('/join_room', methods=['POST'])
def join():
    username = request.form.get('displayName')
    room = request.form.get('room')
    # send json
    return jsonify({'success': True, 'code': room})

@app.route("/room/<string:code>")
def room(code):
    if (allLinks.get(code) != None):
        link = allLinks[code]
        # render room.html
        return render_template('room.html', room = code)
    else:
        # send error 
        return "Room doesn't exist!"

@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['code']
    greeting = username + f' has entered the room {room}'
    join_room(room)
    members = room_members[room]
    print('Join room')
    greet = f'{username} just dropped by!'
    print(allLinks[room])
    socketio.emit("allRooms", {'greet': greet,'room': room, 'members': members, 'link': allLinks[room]}, room = room)

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['code']
    print(room)
    leave_room(room)
    room_members[room] -= 1
    print('Left room')
    greet = f'{username} has left the room.'
    socketio.emit("left" , {'greet': greet} , room = room)

@socketio.on('message')
def send_message(data):
    username = data['username']
    message = data['message']
    room = data['code']
    print(message, room)
    socketio.emit("allmessages", {"username": username, "message": message}, room = room)

@socketio.on('control_time')
def control_time(data):
    newtime = data['newtime']
    room = data['code']
    print(newtime)
    socketio.emit("time", {"newtime": newtime}, room = room)

@socketio.on('control_video')
def control_video(data):
    control = data['control']
    room = data['code']
    print(control)
    socketio.emit('status', {"status": control}, room = room)

@socketio.on('control_speed')
def control_speed(data):
    speed = data['speed']
    room = data['code']
    print(speed)
    socketio.emit('speed', {"speed": speed}, room = room)

if __name__ == '__main__':
    socketio.run(app)