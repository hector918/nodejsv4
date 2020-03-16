const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const config = require("../config");

const connection = require('../common/maindb_connection');
const general_function = require('../common/general_function');
const regexp_comm = require('../common/regexp');

const schema = mongoose.Schema({

    created:{
        type: Date, 
        default: Date.now ,
    },
    
    user_id : { type : String, },
    form_name : { type : String, },
    rawdata : { type : mongoose.Schema.Types.Mixed, },
    
})

let unfinished_form = connection.model('unfinished_form', schema);

const save_unfinished_form = function (par)
{

    var par_ = general_function.DebugStep(par,"save_unfinished_form");

    
    let doc={
        "user_id" : par_.SessionDoc.user_info._id,
        "form_name" : par_.postBody.form_name,
        "rawdata" : par_.postBody.data,
        created : new Date(),
    }
    let query = {
        "user_id":par_.SessionDoc.user_info._id,
        "form_name":par_.postBody.form_name,
    };
    unfinished_form.findOneAndUpdate(query,{$set:doc},{upsert: true}).then(doc=>{

    }).catch(error=>{

    })
    
    
    par_.callback(par_);
    return;
    
}
const read_unfinished_form = function (par)
{
    var par_ = general_function.DebugStep(par,"read_unfinished_form");
    
    let query = {
        "user_id":par_.SessionDoc.user_info._id,
        "form_name":par_.postBody.form_name,
    };
    
    unfinished_form.findOne(query).then(doc=>{
        
        if(doc!=null)
        {
            par_.ResContent.content.form={};
            par_.ResContent.content.form["unfinished_form"] = doc;
        }
        else
        {
            par_.ResContent.content.result="fail";
        }
        
        par_.callback(par_);
    });
}
module.exports.SaveUnfinishedForm = save_unfinished_form;
module.exports.ReadUnfinishedForm = read_unfinished_form;