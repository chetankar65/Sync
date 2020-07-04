import os
from flask import Flask, render_template, jsonify, request, session, redirect, after_this_request
from flask_socketio import SocketIO, emit, join_room, leave_room, send
import uuid
from urllib.parse import urlparse, parse_qs
import hashlib
# Import all database dependencies
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
import psycopg2
DATABASE_URL = os.getenv("DATABASE_URL")

# Set up database
engine = create_engine(DATABASE_URL) #Postgres database URL hosted on heroku
db = scoped_session(sessionmaker(bind=engine))

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
app.config["SECRET_KEY"] = os.getenv('sync')
socketio = SocketIO(app)

# all links dictionary
allLinks = dict()
# all the messages
room_messages = dict()
# all the users (probably a session)
# room member count
room_members_count = dict()
# room moderators
room_moderators = dict()
# Room members limit (creator of room can set a limit to number of people in each room)
room_members_limit = dict()
# all the people in one room
room_members = dict()

@app.route("/")
def index():
    if(session.get('user_id')):
        return redirect('/dashboard')
    else:
        return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    if(session.get('user_id')):
        return render_template('dashboard.html')
    else:
        return redirect('/')

@app.route('/register_page')
def register_page():
    if(session.get('user_id')):
        return redirect('/dashboard')
    else:
        return render_template('register.html')

@app.route('/create_room', methods=['POST'])
def submit():
    # set admin everytime someone creates a room
    link = request.form.get('youtube')
    room = str(uuid.uuid4())
    allLinks[room] = extract_video_id(link)
    room_members_count[room] = 1
    room_messages[room] = [{'message':'Start your conversation here!', 'username':'SyncApp'}]
    room_moderators[room] = session.get('user_id')
    room_members[room] = []
    # send json
    redirect_link = f'/room/{room}'
    # redirect to the redirect link
    return redirect(redirect_link)

@app.route('/join_room', methods=['POST'])
def join():
    room = request.form.get('room')
    # send json
    return jsonify({'success': True, 'code': room})

@app.route('/register', methods=['POST'])
def register():
    email = request.form.get("email")
    username = request.form.get("username")
    password = request.form.get("password")
    newpass = password + "abmcnk2o210u9win" #salting
    # store salt in an environment variable as has secret
    password_hash = hashlib.sha256(newpass.encode())
    if db.execute("SELECT * FROM users WHERE username = :username",{"username":username}).rowcount == 0:
        db.execute("INSERT INTO users (username, email, password) VALUES (:username, :email, :pass)",{"username": username, "email":email,"pass": password_hash.hexdigest()})
        db.commit()
        return jsonify({'success':True, 'msg':'Registered!'})
    else:
        return jsonify({'success':False, 'msg':'Email already exists!'})

@app.route("/login", methods=['POST'])
def login():
    username = request.form.get("username")
    password = request.form.get("password")
    newpass = password + "abmcnk2o210u9win" #salting
    password_hash = hashlib.sha256(newpass.encode())
    if db.execute("SELECT * FROM users WHERE username = :username",{"username":username}).rowcount == 0:
        return jsonify({'success':False, 'msg':"Account doesn't exist!"})
    else:
        rows = db.execute("SELECT user_id,username,password FROM users WHERE username = :username",{"username":username}).fetchone()
        if (password_hash.hexdigest() == rows.password and username == rows.username):
            session["user_id"] = rows.user_id
            return jsonify({'success':True, 'msg':'Logged in!'})
        else:
            return jsonify({'success':False, 'msg':'Wrong password!'})

@app.route("/logout")
def logout():
    session.pop('user_id', None)
    return redirect('/')

@app.route("/room/<string:code>")
def room(code):
    if(session.get('user_id')):
        room_members_count[code] += 1
        if (allLinks.get(code) != None):
            link = allLinks[code]
            control_bool = False
            if (room_moderators[code] == session.get('user_id')):
                control_bool = True
            return render_template('room.html', room = code, control_bool = control_bool, link = link)
        else:
            # send error 
            return "Room doesn't exist!"
    else:
        return redirect('/')

@socketio.on('join')
def on_join(data):
    rows = db.execute("SELECT username FROM users WHERE user_id = :user_id",{"user_id":session.get('user_id')}).fetchone()
    username = rows.username
    room = data['code']
    room_members[room].append(username)
    join_room(room)
    print('Join room')
    greet = f'{username} just dropped by!'
    socketio.emit("allRooms", {'greet': greet,'room': room}, room = room)

@socketio.on('leave')
def on_leave(data):
    rows = db.execute("SELECT username FROM users WHERE user_id = :user_id",{"user_id":session.get('user_id')}).fetchone()
    username = rows.username
    room = data['code']
    print(room)
    leave_room(room)
    room_members[room].remove(username)
    room_members_count[room] -= 1
    if (room_members_count[room] == 0):
        room_members_count.pop(room)
        room_messages.pop(room)
        allLinks.pop(room)
        room_moderators.pop(room)
        room_members.pop(room)
    greet = f'{username} has left the room.'
    socketio.emit("left" , {'greet': greet} , room = room)

@socketio.on('message')
def send_message(data):
    rows = db.execute("SELECT username FROM users WHERE user_id = :user_id",{"user_id":session.get('user_id')}).fetchone()
    username = rows.username
    message = data['message']
    room = data['code']
    messages = room_messages[room]
    messages.append({'message':message, 'username':username})
    socketio.emit("allmessages", {"messages": messages}, room = room)

@socketio.on('get messages')
def get_all_messages(data):
    room = data['code']
    messages = room_messages[room]
    socketio.emit('allmessages', {"messages": messages}, room = room)

@socketio.on('control_time')
def control_time(data):
    newtime = data['newtime']
    room = data['code']
    socketio.emit("time", {"newtime": newtime}, room = room)

@socketio.on('get users')
def getUsers(data):
    room = data['code']
    user_list = room_members[room]
    socketio.emit('allUsers', {'users': user_list}, room = room)

@socketio.on('control_video')
def control_video(data):
    control = data['control']
    room = data['code']
    socketio.emit('status', {"status": control}, room = room)

@socketio.on('control_speed')
def control_speed(data):
    speed = data['speed']
    room = data['code']
    socketio.emit('speed', {"speed": speed}, room = room)

@socketio.on('rewind')
def control_speed(data):
    value = data['value']
    room = data['code']
    socketio.emit('jumpRewind', {"value": value}, room = room)

@socketio.on('forward')
def control_speed(data):
    value = data['value']
    room = data['code']
    socketio.emit('jumpForward', {"value": value}, room = room)

@socketio.on('restart')
def restart(data):
    value = data['value']
    room = data['code']
    socketio.emit('restarted', {}, room = room)

@socketio.on('sync videos')
def sync(data):
    room = data['code']
    time = data['time']
    socketio.emit('synced', {"time": time}, room = room)
    
# we need to load all controls in the front end as well
if __name__ == '__main__':
    socketio.run(app, policy_server = False, transports = 'websocket, xhr-polling, xhr-multipart')