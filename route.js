const config =  require('./config.js');
const general_function = require('./common/general_function');
const session = require('./dbmodel/session');
const url = require('url');


function process_without_session(par)
{
	//
	

	var par_=general_function.DebugStep(par,"process_without_session");

	//没有登陆标记
	par_.ResContent.content.session['islogin']=false;

	var url_parts = url.parse(par.Request.url);
 	url_parts.pathname = url_parts.pathname.replace("..","");
 	
 	if(url_parts.query!=null)
 	{
 		url_parts.query = url_parts.query.replace("..","");
 	}
	
	try{
		switch(url_parts.pathname) {
			case '/':
				par_.status_code=200;
				par_.ResContent.content="empty request";
				general_function.ResWrite(par_);
			break;
			case "/api/session/get_session":
				//获得session
				par_.callback = general_function.ResWrite;
				session.CreateSession(par);
				return;

			break;
			case (url_parts.pathname.match(/^\/api\/translate/) || {}).input:
				//:/api/translate/翻译功能直接接入db_model
				
				let translate = require('./dbmodel/translation');
				switch(url_parts.pathname)
				{
					case "/api/translate/listbylanguage":
						translate.ListTranslation(par_);
					break;
					default:
						//此处如不返回，将会返回到http response输出
						default_action();
					break;
				}	
				
			break;

			default:
				//此处如不返回，将会返回到http response输出
				default_action();
			break;
		}
		
	}
	catch(ex)
	{
		console.log(ex);
		
		par.Respond.end("Server 500");
	}
	function default_action()
	{
		//此处如不返回，将会返回到http response输出
				
		par_.status_code=200;

		
		
		general_function.ResWrite(par_);
	}
}


function handle_GET_with_sessionID( par)
{
	

	var par_=general_function.DebugStep(par,"handle_GET_with_sessionID");

	var url_parts = url.parse(par.Request.url);
 	
 	url_parts.pathname = url_parts.pathname.replace("..","");
 	
 	if(url_parts.query!=null)
 	{
 		url_parts.query = url_parts.query.replace("..","");
 	}
 	
 	try
 	{
 		//
 		switch(url_parts.pathname) {
	    
		case (url_parts.pathname.match(/^\/api\/login/) || {}).input:
			//:/api/login/
			var login = require('./api/login');
			
			switch(url_parts.pathname)
			{
				case "/api/login/logingin":
            		login.LoginByBarcode(par_);
				break;
				case "/api/login/logout":
					login.LoginOut(par_);
				break;
				default:
					default_action_w();
				break;
			}
            
		break;
		case (url_parts.pathname.match(/^\/api\/translate/) || {}).input:
			//:/api/translate/翻译功能直接接入db_model
			var translate = require('./dbmodel/translation');
			
			switch(url_parts.pathname)
			{
				case "/api/translate/updateunset":
					translate.UpdateUnset(par_);
				break;
				case "/api/translate/listbylanguage":
					translate.ListTranslation(par_);
				break;
				default:
					default_action_w();
				break;
			}
		break;
		case (url_parts.pathname.match(/^\/api\/users/) || {}).input:
			//:/api/translate/翻译功能直接接入db_model
			
			let users = require('./dbmodel/user');
			switch(url_parts.pathname)
			{
				case "/api/users/getalluser":
					let query = {};
					par_.callback = general_function.ResWrite;
					users.ListUser(query,par_);
				break;
				default:
					//此处如不返回，将会返回到http response输出
					default_action();
				break;
			}	
			
		break;
		case "/api/session/get_session":
			//回复session user station

			par_.status_code=200;
			const user = require("./dbmodel/user.js");
			
			par_ = user.ResponseUserInfo({},par_);
			
			general_function.ResWrite(par_);
		break;
		default : 
			default_action_w();
		break;
		}
    	
		
 	}
 	catch(ex)
 	{
 		console.log(ex);
		res.end("Server 500");
	}
	function default_action_w()
	{
		//此处如不返回，将会返回到http response输出
		par_.status_code=200;
		par_.ResContent.content="empty request";
		general_function.ResWrite(par_);
	}
}

exports.ProcessWithSession = handle_GET_with_sessionID;
exports.ProcessWithoutSession = process_without_session;
