const mongoose = require('mongoose');

const bcrypt = require('bcrypt');
// this is just  user with login with google
/*const tokenSchema = new Schema({
    tokenId: mongoose.ObjectId,
    token: {
        type:String,
        unique: true,
        required:true
    },
    day_create:Date
});*/

const userSchema = new mongoose.Schema({
    userID: mongoose.ObjectId,
    name: String,
    role:String,
    email:{
        type:String,
        unique: true,
        required:true
    },
    password:{
        type:String,
        required: true
    },
    isActive: Boolean,

});

userSchema.pre('save',function (next) {
    const user = this;
    if(!user.isModified('password')){
        return next();
    }
    bcrypt.genSalt(10,(err,salt) =>{
        if(err){
            return next(err);
        }

        bcrypt.hash(user.password,salt,(err,hash) =>{
            if(err){
                return next();
            }
            user.password = hash;
            next();
        });
    });
});
userSchema.methods.comparePassword =  function(candidatePassword){
    const user = this;
    return new  Promise((resolve,reject) =>{
        bcrypt.compare(candidatePassword,user.password,(err,isMatch) =>{
            if(err){
                return reject(err);
            }
            if(!isMatch){
                return  reject(false);
            }
            resolve(true);
        });
    });
};

//using Bcrypt
/*userScheme.pre('save',function (next) {
    const user = this;
    if(!user.isModified('password')){
        return next();
    }
    bcrypt.genSalt(10,(err,salt) =>{
        if(err){
            return next(err);
        }

        bcrypt.hash(user.password,salt,(err,hash) =>{
            if(err){
                return next();
            }
            user.password = hash;
            next();
        });
    });
});*/



mongoose.model('users',userSchema);
