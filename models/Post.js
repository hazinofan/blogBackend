const mongoose = require('mongoose')
const {Schema, model} = mongoose;

const PostSchema = new Schema({
    title:String,
    summary:String,
    content:String,
    cover:String,
<<<<<<< HEAD
    author:{type:Schema.Types.ObjectId, ref:'User'}
=======
>>>>>>> 2161fd87719c8d3b13e984605143bf9265e55ddd
} , {
    timestamps: true
})

const PostModel = model('Post', PostSchema);

module.exports = PostModel ;
