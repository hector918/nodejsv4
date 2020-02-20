const config =  require('../config.js');
const general_function = require('../common/general_function');
const session = require("../dbmodel/session.js");
const user = require("../dbmodel/user.js");

const Log = require('../dbmodel/log_event');

const user_login_by_barcode = function ( par )
{
    //
    var par_ = general_function.DebugStep(par,"user_login_by_barcode");
    
    //par_.ResContent.content.user=par_.postBody;
    if(par_.postBody['barcode']==undefined)
    {
        par_.ResContent.content.result = "fail";
        general_function.ResWrite(par_);
        return;
    }
    
    let query = {
        "barcode" : par_.postBody['barcode'],
    }
    par_.callback=function(doc,error){
        if(doc.length>0)
        {
            
            if(config.log_event==true)
            {
                //log event
                Log.LogEvent("user login success","","",doc[0],par.Respond.connection.remoteAddress);
            }


            let query ={"_id":doc[0]._id};
            user.AttachSessionToUser(query,par_);
            
            //如果有就附回用户信息，并附带去session 文档之内
            session.AttachPowerTagsToSession(doc[0],par_);
            par_.ResContent.content.result="success";
            
            par_ = user.ResponseUserInfo(doc[0],par_);
            
            general_function.ResWrite(par_);

        }
        else
        {
            //如果没有就返回空用户信息，
            session.DetachAllFromSession(par_);
            
            par_.ResContent.content.result="barcode error";
            par_.ResContent.content.session = {
                islogin : false,
            }
            par_.ResContent.content.user = {};
            general_function.ResWrite(par_);
        }
    }
    user.vaildateUserByBarcode(query,par_);

}

const user_logout = function ( par )
{
    //
    var par_ = general_function.DebugStep(par,"user_logout");

    session.DetachAllFromSession(par_).then((doc,error)=>{
        par_.ResContent.content.result = "success";
        par_.ResContent.content.session = {islogin:false};
        general_function.ResWrite(par_);
    });
}

module.exports.LoginOut = user_logout;
module.exports.LoginByBarcode = user_login_by_barcode;