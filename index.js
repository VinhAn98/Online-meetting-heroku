const express = require('express');
const mongoose = require('mongoose');
const cookieSession = require('cookie-session');
const passport = require('passport');
const key = require('./config/key');
require('./models/User');
require('./services/passport');

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


const app = express();

//app.use(bodyParser.json());
app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000,// 1day cookie survive long
        keys: [key.cookieKey]
    })
);

app.use(passport.initialize());
app.use(passport.session());

require('./routes/authRoutes')(app);


const PORT = process.env.PORT || 5000;
app.listen(PORT);