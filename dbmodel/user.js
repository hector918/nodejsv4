const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const config = require("../config");

const connection = require('../common/maindb_connection');
const general_function = require('../common/general_function');
const regexp_comm = require('../common/regexp');

const schema = mongoose.Schema({
    barcode : { type : String, },
    created:{
        type: Date, 
        default: Date.now ,
    },
    last_access :{
        type: Date, 
        default: Date.now ,
    },
    firstname : { type : String, },
    lastname : { type : String, },
    sessions : { type : [] },
    power_tags : { type : [] },
})

let user = connection.model('users', schema);



const add_user_ = function (req,res,par)
{
    //
    var par_ =general_function.DebugStep(par,"add_user");
    
    const result = schema.validate(par_.user_doc);
    //
    if (result.error == null) 
    {
        
        //通过验证 
        users.insert(par_.user_doc).then((doc,error)=>{
            
            if(error==undefined)
            {
                //新建完成，回归主程
                
                par.callback(req,res,par_);

            }
            else
            {
                //没有成功插入文件，将会中止请求
                
                par_.res_response['status_code']=500;
                par_.errors.push({"message":"cant add user error:" + JSON.string(error)});
                par_.result = false;
                general_function.ResWrite(req,res,par_);

            }
            
        });
        
    } else {
        //没有通过验证，将会中止请求 
        
        par_.res_response['status_code']=500;
        par_.errors.push({"message":"cant verifi user doc:" + JSON.stringify( result.error)});
        par_.result = false;
        general_function.ResWrite(req,res,par_);
        
        //request end
    }

}


const update_user_field = function (query,par)
{
    //
    var par_ =general_function.DebugStep(par,"update_user_field");
    
    let update_doc = {};
    try{
        update_doc[query.field]=query.value;
        user.updateOne({_id:query._id},{$set:update_doc}).then(doc=>{
            console.log(doc);
            if(doc.nModified==1)
            {
                par_.ResContent.content.result="success";
            }
            else
            {
                par_.ResContent.content.result="fail";
            }
            par.callback(par_);
        });
        
    }
    catch(err)
    {
        console.log(err)
    }
    
}

const vaildate_user_by_barcode = function (query, par)
{
    var par_ =general_function.DebugStep(par,"vaildate_user_by_barcode");

    //如果users表没有任何，就添加一个0用户
    user.countDocuments({}).then((doc)=>{
        
        if(doc==0)
        {
            //add user
            let user_doc = {
                "firstname" : "hector",
                "lastname" : "zhong",
                "barcode" : "0",
                "power_tags" : [ 
                    "created_by_system", 
                    "first_user", 
                ],
            }
            add_user_(user_doc);
        }
        user.find(query).then((doc,error)=>{
            par_.callback(doc,error);
        });

    }).catch((error)=>{
        par_.ResContent['status_code']=500;
        par_.ResContent.content.result="vaild user error";
        par_.errors.push({"message":"vaild user error" + JSON.string(error)});
        par_.result = false;
        general_function.ResWrite(par_);
        
    })
    
    //
    async function add_user_(user_doc)
    {
        //
        await user.insert(user_doc).then((doc)=>{
            return doc
        }).catch((error)=>{
            par_.ResContent['status_code']=500;
            par_.errors.push({"message":"vaild/add user error"+JSON.string(error)});
            par_.result = false;
            general_function.ResWrite(par_);
        });

    }


    
}
const add_session_to_user = function (query,par)
{
    //
    /*
    var par_ = par;
    if(config.debug)
	{
		par_.debug_footprint.push({
			func_name : "add_session_to_user",
			time_record :  new Date() - par.on_request_time ,
		})
    }*/

    if(config.user_multiple_login)
    {
        //多登陆
        user.findOneAndUpdate(query, { $addToSet: {"sessions":{"_id":par.SessionDoc._id}} }).then((updatedDoc) => {

        }).catch((error)=>{
            console.log(error)
        })
    }
    else
    {
        //单登
        //此处要先取消session id 与前个user 绑定
        user.findOneAndUpdate(query, { $set: {"sessions":{"_id":par.SessionDoc._id}} }).then().catch((error)=>{
            console.log(error)
        })
    }
}
const response_user_info = function (userdoc,par)
{
    //
    var par_ = general_function.DebugStep(par,"response_user_info");
    
    if(userdoc.firstname!=undefined)
    {
        par_.ResContent.content.user = {
            firstname : userdoc.firstname,
            lastname : userdoc.lastname,
        }
        //如果有用户文档输入
    }
    else if(general_function.DeepGet(par_.SessionDoc.user_info,"firstname",undefined)!=undefined)
    {
        //如果没有就从sessiondoc处读出来
        par_.ResContent.content.user = {
            firstname : par_.SessionDoc.user_info.firstname,
            lastname : par_.SessionDoc.user_info.lastname,
        }
    }
    else
    {
        par_.ResContent.content.user = {}
    }
    par_.ResContent.content.session = {
        //输出用户已经 登陆
        islogin : true,
    }
    return par_;
}
const list_user = function (query , par)
{
    
    //
    var par_ = general_function.DebugStep(par,"list_user");
    
    user.find(query).then(doc=>{
        par_.ResContent.content.users = doc;
        par_.callback(par_);
    });

}


module.exports.AttachSessionToUser = add_session_to_user;
module.exports.ResponseUserInfo = response_user_info;
module.exports.ListUser = list_user;
module.exports.vaildateUserByBarcode = vaildate_user_by_barcode;
module.exports.UpdateUserField = update_user_field;
//module.exports.LoginByBarcode = user_login_by_barcode;
