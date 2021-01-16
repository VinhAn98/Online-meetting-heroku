const uuid = require('uuid');
const requireAuth = require('../middlewares/requireLogin');
const mongoose = require('mongoose');
const Room = mongoose.model('room');

const nodeMailer = require('nodemailer');
const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'onlinecourseda2@gmail.com',
        pass: 'Vinhan123'
    }
});
module.exports = (app,io) => {

 /*   const io = socket(server);*/

    app.post(`/createRoom`,requireAuth,async (req, res) => {
        // handle request create room from client
        // send back random url
        // create room in database
        const roomData = req.body;
        const urlID = uuid.v1();
        const _roomDataCreate = {...roomData,RoomId:urlID.toString(),Condition:'Open'};

        //{RoomId:urlID,Owner:'An',Title:'test'}
        //const codeToJoin =
        try{
            const createRoom = new Room(_roomDataCreate);

            await  createRoom.save();
            console.log('create success');
        }catch (e) {
            console.log(e);
        }
        res.send(urlID);



    });
    app.post('/joinRoom',requireAuth, async (req, res) => {
        // handle request join room from client
        // check if room code that receive have that room in database
        // if have room send back data to client to add to member
        // save member to database
        const {roomId} = req.body;

        const roomHave = await Room.findOne({RoomId:roomId},'RoomId Condition');
        console.log(roomHave);

        if(roomHave && roomHave.Condition ==='Open'){
            res.send({roomHave:true ,error:''});
        }else if(roomHave && roomHave.Condition ==='Close') {
            res.send({roomHave:false ,error:'this room is close'});
        }else  {
            res.send({roomHave:false ,error:'this room is not exist'});
        }

        // step missing save member to database




    });
    app.post('/outRoom', (req,res) => {

       // handle request out room from client
       //
    });

    app.post('/fetchUser',requireAuth, async (req,res) => {
        // handle request fetch from client
        const {roomId,userInfo} = req.body;
        const {_id,name,role} = userInfo;
        let UserToRoom = {_id,name,role};
        //console.log(roomId);
        //

        try{
            let roomHave = await Room.findOne({RoomId:roomId});
           /* if(roomHave.Member === undefined || roomHave.Member.length === 0){
                console.log('first person');
                roomHave.Member.push(UserToRoom);
                roomHave.save();
               //
            }*/
            const checkExistInRoom = roomHave.Member.some(user => user.id === UserToRoom._id);
            if(checkExistInRoom){
                //console.log('have member');
            }
            else {
                console.log('add user');
                roomHave.Member.push(UserToRoom);
                roomHave.save();
            }

            res.send({member:roomHave.Member});
        }catch (e) {
            console.log(e);
        }

    });

    // get all message in database
    app.post('/getMessages' ,async (req,res) => {
        const {user} = req.body;
        const {roomId,userInfo} = user;
        try {
            const roomHave = await Room.findOne({RoomId:roomId});
            //console.log(roomHave.ChatLog);
            res.send(roomHave.ChatLog);
            io.emit('messages',roomHave.ChatLog);
        }catch (e) {
            console.log(e);
        }

    });

    app.post('/messages',async (req,res) => {
        const {message,user} = req.body;
        const {roomId,userInfo} = user;
        const {_id,name} = userInfo;
        console.log(name);
        try {
            let roomHave = await Room.findOne({RoomId:roomId});

            let content = message;
            let ChatLog = {_id,content,name};
            //roomHave.ChatLog.push({IdUser:userInfo._id,content: {type:'String' , content:message},name:userInfo.name});
            roomHave.ChatLog.push(ChatLog);
            roomHave.save();
           // console.log(roomHave.ChatLog);
            io.emit('messages',roomHave.ChatLog);
            res.sendStatus(200);
        }catch (e) {
            console.log(e);
        }
    });

    app.post('/inviteUSer',async  (req,res) => {
        //const {textarea} = req.body;
        const {email,roomID} = req.body;
        const {textarea} = email;
        const emailToInvite = textarea.split(',');
        emailToInvite.forEach( email => {
            let mailOption = {
                from: 'onlinecourseda2@gmail.com',
                to: `${email}`,
                subject: 'Enjoy meeting room',
                html: '<p>please click link below to meeting with sender</p>' +
                    `<a href="https://online-meetting.herokuapp.com/room/${roomID}"> ${roomID}</a>`
            };
            try {
                 transporter.sendMail(mailOption, function (error, info) {
                    if (error) {
                        console.log(error);
                    } else {
                        console.log('Email sent: ' + info.response);
                    }

                });
            }catch (e) {
                console.log(e);
            }
        });
        res.send({message:'email has been send'});
    });


};