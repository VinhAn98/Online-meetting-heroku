const passport = require('passport');
const mongoose = require('mongoose');
const User = mongoose.model('users');
const jwt = require('jsonwebtoken');
const nodeMailer = require('nodemailer');
const uuid = require('uuid');
const _ = require('lodash');

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'onlinecourseda2@gmail.com',
        pass: 'Vinhan123'
    }
});
// route for login with google and log out
module.exports = (app) => {
    app.get('/auth/google', passport.authenticate('google', {
        scope: ['profile', 'email']
    }));

    app.get('/auth/google/callback', passport.authenticate('google'));

    app.get('/api/logout', (req, res) => {
        req.logout();
        res.send(req.user);
    });
    app.get('/api/current_user', (req, res) => {
        console.log(req.user);
        res.send(req.user);
    });


    // sign up
    app.post('/signup', async (req, res) => {


        const user = req.body;
        const _User = {...user, isActive: false};
        const {email} = _User;
        const randomURL = uuid.v4();
        const randomString = uuid.v4();
        // console.log(_User);
        //
        let mailOption = {
            from: 'onlinecourseda2@gmail.com',
            to: `${email}`,
            subject: 'Active your account',
            html: '<p>please click link below to active you account</p>' +
                `<a href="https://online-meetting.herokuapp.com/active/${randomURL}"> ${randomString}</a>`
        };
        try {
            const createUser = new User(_User);
            await createUser.save();
            const token = jwt.sign({userId: user._id}, 'MY_SECRET_KEY');

            await transporter.sendMail(mailOption, function (error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }

            });
            //send email active
            //console.log(token);
            const infoUser = await User.findOne({email});
            console.log(infoUser);
            const {_id, name, role} = infoUser;
            const userInfo = {_id, email, name, role};
            res.send({token,userInfo});


        } catch (err) {
            console.log(err);
            return res.status(422).send(err.message);
        }

    });

    // sign in
    app.post('/signin', async (req, res) => {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.send(422).send({error: 'you must provide a email and password'});
        }
        const user = await User.findOne({email});
        const {_id, name, role} = user;

        if (!user) {
            return res.status(404).send({error: 'Invalid password or email'});
        }

        try {
            //run after install bcrypt
            //console.log({email,password} );
            await user.comparePassword(password);
            const token = jwt.sign({userId: user._id}, 'MY_SECRET_KEY');
            const userInfo = {_id, email, name, role};

            //console.log(userInfo);
            res.send({token, userInfo});

        } catch (err) {
            console.log(err);
            return res.status(422).send({error: 'Invalid password or email'});

        }

    });

   app.post('/activeAccount', async (req,res) =>{
        // req Active account
       const {email} = req.body;
       console.log(email);
       const user = await User.findOne({email});
       user.isActive = true;
       user.save();
       console.log(user);
       res.send({active:true})
   });

   app.post('/forgetPassword' ,async (req,res) => {
      const {email} = req.body;
      const user = await User.findOne({email});
       const randomString = uuid.v4();
       let mailOption = {
           from: 'onlinecourseda2@gmail.com',
           to: `${email}`,
           subject: 'Active your account',
           html: '<p>please click link below to reset password</p>' +
               `<a href="http://localhost:3000/resetPassword"> ${randomString}</a>`
       };
       await transporter.sendMail(mailOption, function (error, info) {
           if (error) {
               console.log(error);
           } else {
               console.log('Email sent: ' + info.response);
           }

       });
       res.send({message:'email has send to your account'});

   });

};
