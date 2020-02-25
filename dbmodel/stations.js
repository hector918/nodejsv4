const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const config = require("../config");

const connection = require('../common/maindb_connection');
const general_function = require('../common/general_function');
const regexp_comm = require('../common/regexp');

const schema = mongoose.Schema({
    name:{
        type : String,
        default : "" ,
    },
    created:{
        type: Date, 
        default: Date.now ,
    },
    last_access :{
        type: Date, 
        default: Date.now ,
    },
    ip_address : {
        type : String,
    },
    default_language : {
        type : String,
    },
    mac_address : {
        type : String,
    },
    address_setted : {
        type : Boolean,
        default : false ,
    }
})

let station = connection.model('station', schema);

const attach_station_to_session = function(req, res, par)
{
    //

    var par_ = general_function.DebugStep(par,"attach_station_to_session");
    //此处ip 地址替换,zhong 01202020
    //let remote_ip = req.connection.remoteAddress;
    const remote_ip = "192.168.0.1";

    arp.toMAC(remote_ip).then((mac)=>{
        //console.log(mac);
        ///par_.station['macaddress']=mac;
    }).catch((error)=>{
        //console.log(error);
    })
    
}

const add_station = function (name ,par)
{
    //
    var par_ = general_function.DebugStep(par,"add_station");


    let station_doc = {
        "name" : name,
        address_setted : false,
    }


    const result = schema.validate(station_doc);
    //
    if (result.error == null) 
    {
        
        //通过验证 
        stations.insert(station_doc).then((doc)=>{
            //

        }).catch((error)=>{
            
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
        general_function.ResWrite(par_);
        
        //request end
    }
}

async function get_station_mac(remote_ip,par)
{
    //
    var par_ = general_function.DebugStep(par,"get_station_mac");
    switch(remote_ip)
    {
        case "localhost":case "127.0.0.1":
            //
        break;
        default :
            //
        break;
    }
    
    const arp = require('@network-utils/arp-lookup');
    
    let mac_address = await arp.toMAC(remote_ip);
    let query = { "mac_address" : mac_address };
    
    let doc = await station.findOne(query);
    if(doc==undefined)
    {
        //not exist
        let station_doc = new station({
            "mac_address" : mac_address,
            "last_access" : new Date(),
            "default_language" : "ENG",
        })
    
        station_doc.save().then(doc=>{

            console.log("station inserted");

        }).catch(error=>{

            general_function.ProcessErrorWithSilence(error,par_);
            
        });
        return station_doc;
    }
    else
    {
        return doc;
    }

    //return mac_address;    
}

function get_arp_table (par)
{
    
    var par_ = general_function.DebugStep(par,"get_arp_table");
    arp.getTable().then(table=>{
        par_.ResContent.content.arp_table = table;
    }).catch(error=>{   
        general_function.ProcessErrorWithSilence(error,par_);
    });
}

const get_station_info = function (req, res ,par)
{
    //
    
    var par_ = general_function.DebugStep(par,"attach_station_to_session");


    let allow_unreg_station = true;
    //此处ip 地址替换,zhong 01202020
    //let remote_ip = req.connection.remoteAddress;
    const remote_ip = "192.168.0.1";

    arp.toMAC(remote_ip).then((mac)=>{
        console.log(mac);
        par_.station['macaddress']=mac;
    }).catch((error)=>{
        console.log(error);
    })
    
}

module.exports = {
    GetStationMac : get_station_mac,
    AttachStationToSession : attach_station_to_session ,
}