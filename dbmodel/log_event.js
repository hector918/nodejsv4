const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const config = require("../config");

const connection = require('../common/logdb_connection');
const general_function = require('../common/general_function');
const regexp_comm = require('../common/regexp');

const schema = mongoose.Schema({

    created:{
        type: Date, 
        default: Date.now ,
    },
    
    type : { type : String, },
    text : { type : String, },
    content : { type : String, },
    rawdata : { type : mongoose.Schema.Types.Mixed, },
    content : { ip : String, },
    
})

let log = connection.model('log', schema);

const log_access = function ()
{
    
}

const log_event = function (type,text,content,rawdata,ip)
{
    let doc = new log({
        "type" : type,
        "text" : text,
        "content" : content,
        "rawdata" : rawdata,
        "ip" : ip,
        created : new Date(),
    })
    doc.save().then(doc=>{

    }).catch(error=>{
        console.log(error)
    });

    
}
const order_history = function ()
{
    //

}

module.exports.LogEvent = log_event;

