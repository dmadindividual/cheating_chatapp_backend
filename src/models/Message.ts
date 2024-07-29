import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId
const Schema = mongoose.Schema


const MessageSchema = new Schema({
message: String,
date: Date
})

const  MessageModel = mongoose.model('Message', MessageSchema)
export default MessageModel