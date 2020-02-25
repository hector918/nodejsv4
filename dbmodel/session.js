const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const config = require("../config");

const connection = require('../common/maindb_connection');
const general_function = require('../common/general_function');
const regexp_comm = require('../common/regexp');

const session_prefix = config.session_prefix;
const session_expire = 720;//unit second default 60

const schema = mongoose.Schema({
    session_id:{
        type : String,
        validate : regexp_comm.no_blank,
    },
    created:{
        type: Date, 
        default: Date.now ,
    },
    last_access :{
        type: Date, 
        default: Date.now ,
    },
    ip_address : { type : String, },
    macaddress : { type : String, },
    
    power_tags : { type : [], },
    user_info : { type : mongoose.Schema.Types.Mixed, },
    islogin : {
        type : Boolean,
        default : false ,
    },
    temp_power_tags : { type : [], },
    station_info : { type : mongoose.Schema.Types.Mixed , },
    active : {
        type : Boolean,
        default : true ,
    },
})
let model = connection.model('session', schema);

const create_session = function (par)
{
    //
    
    var par_=general_function.DebugStep(par,"create_session");

    let client_ipaddress=par.Request.connection.remoteAddress;
    var date=new Date();
    
	let session_id=bcrypt.hashSync((date.toLocaleString()+client_ipaddress),10);
    
    let session_doc = new model({
        "session_id" : session_id,
        "ip_address" : client_ipaddress,
        created : new Date(),
        last_access : new Date(),
        active : true,
    })
    session_doc.save().then((doc) => {
        //此处应该删除同ip的session zhong 01292020
        //insert done
        par_.ResContent['Set-Cookie']=session_prefix+'='+session_id;
        par_.ResContent['Content-Type'] = 'text/html';
        par_.ResContent.content.session = {
            "session_id":doc.session_id,
            islogin:false
        };
        par_.ResContent.content.secret = config.secret;
        par_.ResContent.content.user ={};
        par_.SessionDoc = doc;
        
        update_mac_to_session({_id:doc._id},client_ipaddress,par_);

    }).catch(error=>{
        //return error
        par_.errors.push(error);
        general_function.ProcessError(par_);
    });  
}

const vaildate_session = function (par)
{
    var par_ = general_function.DebugStep(par,"vaildate_session");
    
    //
	let client_ipaddress = par.Respond.connection.remoteAddress;	
    
    //读取访问session
    
    let token = par.Request.headers.token;
    
	if(token!=undefined)
    {

    	//如果带有session
    	
    	let session_id = token;

		var dateOffset = (1000)*session_expire; //unit second
		
		var query={
    		'session_id' : session_id,
    		'ip_address' : client_ipaddress,
            'active' : true,
            "last_access" : { 
				$gt: new Date(new Date().setTime(new Date().getTime() - dateOffset))
            },
            
        };
        
        //查找数据库，并更新最新访问
			
        model.findOneAndUpdate(query, { $set: { "last_access" : new Date()} },{returnNewDocument : true,useFindAndModify: false},function(error,doc){
            if(doc==null)
			{
                //如果没有，就把session id 取消 
                par_.ResContent['Set-Cookie']=session_prefix+'=';
                par_.ResContent['Content-Type'] = 'text/html';
                par_.ResContent.content.session = {"islogin":false,"session_id":""};
                par_.ResContent.content.secret = config.secret;
                
                par.callback(par_);
			}
			else
			{
                //如果找到就附上
				par_.SessionDoc = doc;
				par.callback(par_);
            }
        })
        
    }
    else
    {
        //如果没有带有session,就直接退出
        
        par.callback(par_);
    }
}

async function update_mac_to_session(query,remote_ip,par)
{
    var par_ = general_function.DebugStep(par,"update_mac_to_session");
    var remote_ip = "192.168.0.1";//ip address replace from tempotory
    
    const stations = require('./stations');
    let mac_doc = await stations.GetStationMac(remote_ip,par);
   
    let update_doc = {
        $set : {
            "macaddress" : mac_doc.mac_address,
            "station_info" : mac_doc,
        }
    }
    model.findOneAndUpdate(query,update_doc).then(doc=>{
        par.callback(par_);
    }).catch(error=>{
        general_function.ProcessErrorWithSilence(error,par);
    });
    //general_function.ApiRouteEnd(par_);
}

const detach_all_from_session = function (par)
{
    //解除session的用户信息及权限
    var par_=general_function.DebugStep(par,"detach_all_from_session");
    
    let query = {
        "_id" : par.SessionDoc._id,
    }
    let update_doc = { 
        $set: { 
            "last_access" : new Date() ,
            "power_tags" : [],
            islogin : false,
            user_info:{},
        } 
    }

    let ret = model.findOneAndUpdate(query,update_doc ,{returnNewDocument : true,useFindAndModify: false});
    ret.then((doc,error)=>{

        par_.result = true;//非必要
        par_.SessionDoc = doc;
    });

    return ret;

}


const attach_power_tags_to_session = function (user_doc,par)
{
    var par_ = general_function.DebugStep(par,"attach_power_tags_to_session");
    let query = {
        "_id" : par.SessionDoc._id,
    }
    
    let update_doc = {
        $set:{
            "power_tags" : user_doc.power_tags,
            "user_info" : user_doc,
            "islogin" : true,
        }
    }
    
    model.updateOne(query,update_doc).then((doc,error) => {
        //
        
        //console.log(doc);
    })
    .catch(function(error){
        process_error_with_silence(error,par_);
    });
    
}

module.exports = {
    DetachAllFromSession : detach_all_from_session,
    CreateSession : create_session,
    VaildateSession : vaildate_session,
    AttachPowerTagsToSession : attach_power_tags_to_session,
}