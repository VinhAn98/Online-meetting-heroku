const mongoose = require('mongoose');
const {Schema} = mongoose;

// this is just  user with login with google
const userSchema = new Schema({
    googleId: String,

});
// need new scheme with user sign up and login

mongoose.model('users',userSchema);