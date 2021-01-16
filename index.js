const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');
const key = require('./config/key');
const _ = require('lodash');
const http = require('http');
require('./models/User');
require('./models/Room');
require('./services/passport');
const app = express();
const server = http.createServer(app);
const socket = require('socket.io');
const io = socket(server);
const parser = require('body-parser');
const Room = mongoose.model('room');

app.use(parser.urlencoded({extended: false}));
app.use(parser.json());

app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000,// 1day cookie survive long
        keys: [key.cookieKey]
    })
);

//testing socket io


app.use(passport.initialize());
app.use(passport.session());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept,Authorization");
    next();
});

require('./routes/authRoutes')(app);
require('./routes/meetRoutes')(app, io);


/*const users = {};

const socketToRoom = {};*/
let peers = [];
io.on('connection', socket => {

    /*    socket.on("join room", roomID => {

            // console.log('a user connected: ', socket.id +  ' roomID ' +  roomID);

            if (users[roomID]) {
                const length = users[roomID].length;

                users[roomID].push(socket.id);
                console.log(users);
            } else {
                users[roomID] = [socket.id];

            }
            socketToRoom[socket.id] = roomID;
            console.log(socketToRoom);
            const usersInThisRoom = users[roomID].filter(id => id !== socket.id);
            console.log(usersInThisRoom);
            socket.emit("all users", usersInThisRoom);
        });

        socket.on("sending signal", payload => {

            io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
            //console.log('sending signal done' + payload.userToSignal );
        });

        socket.on("returning signal", payload => {
            io.to(payload.callerID).emit('receiving returned signal', { signal: payload.signal, id: socket.id });
            //console.log('returning signal done' + payload.callerID);
        });*/

    /* peers.add(socket.id);

     socket.emit('id',{data:socket.id});
     socket.emit('peer-list', { data: [...peers] } );*/


    console.log(`Client ${socket.id} connected`);


    socket.on('create-roomID', async (InfoUser) => {
        const {roomId, userInfo} = InfoUser;
        socket.MyRoom = roomId;
        socket.join(socket.MyRoom);
        socket.emit('id', {data: socket.id});
        if(userInfo.role === 'teacher' && peers.length > 0){
            //console.log('teacher refresh');
            peers.unshift(socket.id);
            const usersInThisRoom = peers.filter(id => id !== socket.id);
            // console.log(usersInThisRoom);
            // socket.emit('peer-list',{data: [...peers]});
            socket.emit('user-in-room',usersInThisRoom);
            return;
        }
        peers.push(socket.id);
        const roomOwnerID = peers[0];
       // console.log(peers);

        if (userInfo.role === 'student' && InfoUser.request === 'Join-room') {
            //console.log(roomOwnerID);
            //console.log(roomOwner);
            //
            socket.to(roomOwnerID).emit('user-want-to-join', {userInfo, socket: socket.id});
        }
        if(userInfo.role === 'student' && InfoUser.request === 'Join-room-directly') {
            socket.to(roomOwnerID).emit('user-want-to-join-directly', {userInfo, socket: socket.id});
        }


        // request join room to owner
        // catch request
        // accept do

        // deny do
        //
        // allow to join room
        /* socket.join(socket.MyRoom);
         socket.emit('id',{data:socket.id});
         peers.push(socket.id);
         console.log(peers);


 */


    });
    socket.on('accept-join', async (data) => {
        //console.log(data);
        // console.log(socket.id);
        console.log(peers);
        const usersInThisRoom = peers.filter(id => id !== data.socket);
        console.log(usersInThisRoom);
        // socket.emit('peer-list',{data: [...peers]});
        io.to(data.socket).emit('user-in-room', usersInThisRoom);
    });
    socket.on('deny-join', async (data) => {
        const {dataUser} = data;
        io.to(dataUser.socket).emit('deny-to-join-room', {message: 'You was deny to join room by owner'})

    });
    // add user to database
    socket.on('join-room', async InfoUser => {
        socket.join(socket.MyRoom);
        const {roomId, userInfo} = InfoUser;
        const {_id, name, role} = userInfo;
        let UserToRoom = {_id, name, role};

        try {
            let roomHave = await Room.findOne({RoomId: roomId});
            /* if(roomHave.Member === undefined || roomHave.Member.length === 0){
                 console.log('first person');
                 roomHave.Member.push(UserToRoom);
                 roomHave.save();
                //
             }*/
            const checkExistInRoom = roomHave.Member.some(user => user.id === UserToRoom._id);
            const checkExistInAcceptList = roomHave.AcceptList.some(user => user.id === UserToRoom._id);
            if (checkExistInRoom) {
                //console.log('have member');
            } else {
                //console.log('add user');
                roomHave.Member.push(UserToRoom);
                if(!checkExistInAcceptList){
                    roomHave.AcceptList.push(UserToRoom)
                }

                roomHave.save();

            }

            io.emit('member', {member: roomHave.Member});
        } catch (e) {
            console.log(e);
        }
    });

    socket.on('user-in-accept-list', async InfoUser => {
        const {roomId, userInfo} = InfoUser;
         const {_id, name, role} = userInfo;
        let UserToRoom = {_id, name, role};
        try {
            let haveMember = await Room.findOne({RoomId: roomId});
            const checkExistInRoom = haveMember.AcceptList.some(user => user.id === UserToRoom._id);
            //console.log(checkExistInRoom);
            if (checkExistInRoom) {
               // console.log('have member');
                socket.emit('user-in-accept-list-response', {accept: true});
            } else {
                //console.log('dont have user');
                socket.emit('user-in-accept-list-response', {accept: false});

            }
        } catch (e) {
            console.log(e);
        }

    });

    socket.on('user-capture-screen', data => {
        //console.log(data);
        socket.emit('user-capture-screen-response',{answer: true});
       //console.log(InfoUser);
       /* peers.push(socket.id);
        console.log(peers);

        const usersInThisRoom = peers.filter(id => id !== socket.id);
        console.log(usersInThisRoom);
        socket.emit('user-capture-screen-response',usersInThisRoom);*/
        //
    });
    socket.on('capture-ref-emit',data => {
        //console.log(data);
        peers.push(socket.id);
        console.log(peers);

        const usersInThisRoom = peers.filter(id => id !== socket.id);
        console.log(usersInThisRoom);
        socket.emit('capture-ref-emit-user-in-room',usersInThisRoom);
    });

    socket.on('call-to-user-in-room', dataReceive => {
        //console.log(dataReceive);
        io.to(dataReceive.IdUserInRoom)
            .emit('user-join', {data: dataReceive.data, IdUserJoinRoom: dataReceive.IdUserJoinRoom});

    });


    socket.on('Return-signal-to-join', dataReceive => {

        io.to(dataReceive.IdUserJoinRoom)
            .emit('Receive-return-signal', {dataReceive: dataReceive.data, id: socket.id});
        //console.log(dataReceive);
    });

    socket.on('call-to-user-in-room-when-capture', dataReceive => {
       // console.log(dataReceive.userInfo);
        io.to(dataReceive.IdUserInRoom)
            .emit('user-join-when-capture',
                {data: dataReceive.data, IdUserJoinRoom: dataReceive.IdUserJoinRoom,InfoUserCapture:dataReceive.userInfo});
    });

    socket.on('Return-signal-to-join-when-capture',dataReceive => {
        //console.log(dataReceive);
        io.to(dataReceive.IdUserJoinRoom)
            .emit('Receive-return-signal-when-capture', {dataReceive: dataReceive.data, id: socket.id});
    });

    socket.on('remove-member-when-leave', async InfoUser => {
        //console.log(InfoUser);
        const {roomId, userInfo} = InfoUser;
        const {_id} = userInfo;
        try {
            let haveMember = await Room.findOne({RoomId: roomId});
            haveMember.Member.pull({_id});
            haveMember.save();
            //console.log(haveMember);
            io.emit('member', {member: haveMember.Member});
            io.emit('show-pop-up',userInfo);
            socket.emit('remove-member-success',{remove:true,userInfo});

        } catch (e) {
            console.log(e);
        }

    });

    socket.on('remove-when-refresh', async infoUser => {
       const {roomID,dataUserLeave} = infoUser;
       //console.log(infoUser);
       //console.log(dataUserLeave);
       const {_id} = dataUserLeave;
        try {
            let checkMember = await Room.findOne({RoomId: roomID});
            checkMember.Member.pull({_id});
            checkMember.save();
            io.emit('member', {member: checkMember.Member});
            io.emit('show-pop-up',dataUserLeave);
            //socket.emit('remove-member-success',{remove:true});
        }catch (e) {
            console.log(e);
        }
    });
    socket.on('remove-teacher-when-refresh', async user => {
        const {roomID,userInfo} = user;
        //console.log(userInfo);
        //console.log(dataUserLeave);
       // const {_id} = dataUserLeave;
     /*   try {
            let checkMember = await Room.findOne({RoomId: roomID});
            checkMember.Member.pull({_id});
            checkMember.save();
            io.emit('member', {member: checkMember.Member});
            io.emit('show-pop-up',dataUserLeave);
            //socket.emit('remove-member-success',{remove:true});
        }catch (e) {
            console.log(e);
        }*/
    });

    socket.on('disconnect', () => {
        //socket.leave(socket.MyRoom);
        //console.log(dataUser);
        console.log(`Client ${socket.id} disconnected`);
        //let peer_remain = peers.filter(id => id !== socket.id);
        let peer_remain = _.remove(peers, id => {
            return id !== socket.id;
        });
        //peers.remove(id=> id === socket.id);
        peers = peer_remain;
        //console.log(peers);
        console.log(' peer in room : ' + `${peer_remain}`);
        io.emit('user-member-leave', {socket:socket.id,answer:true});
        socket.broadcast.emit('peer-leave', {data: socket.id});


    });

    socket.on('capture-end', data => {
       socket.broadcast.emit('user-capture-have-end',data);
    });

    socket.on('getMember', async data => {
        try {
            let roomHave = await Room.findOne({RoomId: data});
            io.emit('MemberHave',{member: roomHave.Member});

        }catch (e) {
            console.log(e);
        }

    });

});



// mongodb connection
mongoose.connect(key.mongoURI, {
    useNewUrlParser: true,
    useCreateIndex: true
});
mongoose.connection.on('connected', () => {
    console.log('Connect to mongo instance');

});
mongoose.connection.on('error', (err) => {
    console.error('Error come to mongo', err);

});

if(process.env.NODE_ENV === 'production'){
    app.use(express.static('build'));

    const path =require('path');
    app.get('*',(req,res) => {
        res.sendFile(path.resolve(__dirname,'build','index.html'));
    });
}
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('server is running on port 5000'));



