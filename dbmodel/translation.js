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
    last_access :{
        type: Date, 
        default: Date.now ,
    },
    CHN : { type : String, },
    ENG : { type : String, },
    status : {
        type : Boolean,
        default : false ,
    },
})

let translation = connection.model('translation', schema);


const insert_unset_to_db = function ( par )
{
    //
    var par_=general_function.DebugStep(par,"insert_unset_to_db");
    
    let query = { ENG : par.postBody.text };
    
    
    //transtion_doc[par.postBody.current_language] = par.postBody.text;
    
    let options = {
        returnNewDocument : true,
        upsert: true,
    }
    let ret = translation.findOne(query);
    
    ret.then((doc)=>{
        //如果找到对应英文，就查找目前语言是否存在
        
        if(doc==undefined)
        {
            //如果没,插入文档
            

            let transtion_doc = new translation({
                ENG : par.postBody.text,
                CHN : par.postBody.text,
                status : true,
            });

            transtion_doc.save().then(doc=>{

                par_.ResContent['status_code']=200;
                par_.ResContent.content="success";
                par_.result = true;
                general_function.ResWrite(par_);

            }).catch(error=>{

                par_.errors.push({"message":"insert_unset_to_db:"+JSON.stringify(error)});
                general_function.ProcessError(par_);

            });
        

        }
        else
        {
            let transtion_doc = new translation({
                ENG : par.postBody.text,
                CHN : par.postBody.text,
                status : true,
            });
            //如果有
            translation.update({_id:doc._id},{$set:{transtion_doc}});
            par_.ResContent['status_code']=200;
            par_.ResContent.content="success";
            par_.result = true;
            general_function.ResWrite(par_);
           

        }
    }).catch((error)=>{
        //出错
        par_.errors.push({"message":"insert_unset_to_db:"+JSON.stringify(error)});
        general_function.ProcessError(par_);
    })
    

}

const return_translation = function (par)
{
    //
    
    var par_=general_function.DebugStep(par,"return_translation");
    
    if(typeof(par.postBody.current_language)=="undefined")
    {
        
        var current_language = config.default_language;
    }
    else
    {
        var current_language = par.postBody.current_language;
    }
    
    /*
    db.collection.aggregate([
        {
            $addFields: {
                "root": "$$ROOT"
            }
        },
        {
            $project: {
                "root.key": 0,
                "root._id": 0
            }
        },
        {
            $replaceRoot: {
                newRoot: {
                    $arrayToObject: [[ { k: "$key", v: "$root" } ]]
                }            
            }
        }
    ])
    
    let stages = [];
    //addfield
    stages.push({$addFields:{"root":"$$ROOT"}});
    stages.push({$project:{"root.key":0,"root._id":0}});
    stages.push({$replaceRoot:{
        newRoot:{$arrayToObject:[[{k:"$ENG",v:("$"+current_language)}]]}
    }})
    let ret = translation.aggregate([]);
    */
    
    
    let ret = translation.find();
    ret.then((doc)=>{
        let arrtoobj={};
        for(var x in doc)
        {
            arrtoobj[doc[x]['ENG']]=doc[x][current_language];
        }
        par_.status_code=200;
        console.log(par_.ResContent)
        par_.ResContent.content.translation = arrtoobj;
        general_function.ResWrite(par_);
        
    }).catch((error)=>{
        console.log(error)
    })
}

module.exports.UpdateUnset = insert_unset_to_db;
module.exports.ListTranslation = return_translation;

//module.exports.LoginByBarcode = user_login_by_barcode;
