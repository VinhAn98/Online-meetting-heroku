const mongoose = require('mongoose');


const ContentSchema = new mongoose.Schema({
   content: String
});



/*

const roomSchema = new Schema({
   RoomId: String,
   Owner:String,
  /!* Member: [{
      userId:{
         type: mongoose.Schema.Types.ObjectId,
         ref:'users'
      },
      name:{
         type:String,
         ref:'users'
      }
   }]*!/

  /!* chat:[ChatLogSchema]*!/
   Title:String,
   TimeStart:Date,
   TimeEnd:Date,


});
*/

const roomSchema = new mongoose.Schema({
   RoomId: String,
   Owner:String,
   Title:String,
   TimeStart:String,
   TimeEnd:String,
   Condition:String,
   ChatLog: [{
      _id:{
         type: mongoose.Schema.Types.ObjectId,
         ref:'users'
      },
      content:String,
      name:{
         type:String,
         ref:'users'
      }
   }],
   Member: [{
      _id:{
         type: mongoose.Schema.Types.ObjectId,
         ref: 'users'

      },
      name:{
         type:String,
         ref:'users'
      },
      role:{
        type:String,
        ref:'users'
      }

   }],
   AcceptList: [{
      _id:{
         type: mongoose.Schema.Types.ObjectId,
         ref: 'users'

      },
      name:{
         type:String,
         ref:'users'
      },
      role:{
         type:String,
         ref:'users'
      }

   }]
});
mongoose.model('room',roomSchema);
mongoose.model('content',ContentSchema);