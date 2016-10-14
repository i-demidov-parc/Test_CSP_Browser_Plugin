//библиотека функция для использования в примерах по криптоплагинам ООО "ЛИССИ-Софт"
var _IS_TEST=0;

//определяем глобальные переменные
var token_obj=null;//объект html с токеном
var cert_bd_obj=null;//объект html с файлом базы данных сертификатов
var file4sign_obj=null;//объект html с файлом для подписи
var cert_obj=null;//объект html с сертификатом
var lcplugin=null;
var db_dir = null;
var db_dir_obj = null;
var file4sign = null;
var file_path = null;
var file_path_obj = null;
var signature_path = null;
var cert_data=null;
var file_dir_obj=null;
var disButtonsArr;
var blnShowAllToken=true;
var cert_btn=null;

var _IS_LIR_CRYPTOWRAPPER;

var _HEADER1='MIME-Version: 1.0\nContent-Disposition: attachment; filename="smime.p7m"\nContent-Type: application/x-pkcs7-mime; name="smime.p7m"\nContent-Transfer-Encoding: base64\n\n';//for attached sign
var _CERT_HEADER='-----BEGIN CERTIFICATE-----\n';
var _CERT_FOOTER='\n-----END CERTIFICATE-----';

var _P7_HEADER='-----BEGIN PKCS7-----\n';
var _P7_FOOTER='\n-----END PKCS7-----';

//создаем слой и пишем в него про ошибку и способ получения
function show_not_plugin(){
	var div_obj=document.getElementById("not_plugin_msg");
	var title_str=_LANG_TYPE==0 ? "У Вас не установлен плагин!" : "You didn't establish a plugin!";
	var prod_str=_LANG_TYPE==0 ? "плагина" : "plugin";
	
	if(show_not_plugin.arguments.length>0) title_str=show_not_plugin.arguments[0];
	if(show_not_plugin.arguments.length>1) prod_str=show_not_plugin.arguments[1];
	
	if(div_obj!=null) return;
	
	div_obj=document.createElement("div");
	div_obj.setAttribute("id", "not_plugin_msg");
	if(_LANG_TYPE==0) div_obj.innerHTML="<h1 style=\"color: red;\">"+title_str+"</h1><p>Для получения "+prod_str+" перейдите на страницу сайта ООО \"ЛИССИ-Софт\" <a href=\"http://soft.lissi.ru/redirect.php?id=269#5\" target=\"_blank\">\"Лицензировать и скачать продукты\"</a>.</p><hr>";
	else div_obj.innerHTML="<h1 style=\"color: red;\">"+title_str+"</h1><p>For "+prod_str+", go to the page <a href=\"http://soft.lissi.ru/redirect.php?id=287\" target=\"_blank\">\"License & download\"</a>.</p><hr>";
	
	var arrTR=document.getElementsByTagName("tr");
	var arrTD=arrTR[1].getElementsByTagName("td");
	arrTD[0].insertBefore(div_obj, arrTD[0].childNodes[0]);
}

function CreateLCPlugin() {
	var div_obj=document.getElementById("for_plugin");
	
	var arrText=new Array();
	if(_IS_TEST==1) arrText.push("navigator.mimeTypes.namedItem = "+(navigator.mimeTypes.namedItem ? "true" : "false"));
	
	if(!navigator.mimeTypes.namedItem){
		div_obj.innerHTML='<object id="plugin" type="application/x-lcsignplugin" width="1" height="1"><param name="onload" value="pluginLoaded" /></object>\n'+'<object id="plugin2" type="application/x-lcsigncspplugin" width="1" height="1"><param name="onload" value="pluginLoaded" /></object>';
	}else{
		try{
			var mimetype=navigator.mimeTypes.namedItem("application/x-lcsignplugin");
			
			if(div_obj.innerHTML.length==0){
				if(mimetype!=null){
					//nss плагин
					if(_IS_TEST==1) arrText.push('navigator.mimeTypes.namedItem("application/x-lcsignplugin") != NULL');
					div_obj.innerHTML='<object id="plugin" type="application/x-lcsignplugin" width="1" height="1"><param name="onload" value="pluginLoaded" /></object>';
				}else if(navigator.mimeTypes.namedItem("application/x-lcsigncspplugin")!=null){
					if(_IS_TEST==1) arrText.push('navigator.mimeTypes.namedItem("application/x-lcsigncspplugin")!=NULL');
					div_obj.innerHTML='<object id="plugin" type="application/x-lcsigncspplugin" width="1" height="1"><param name="onload" value="pluginLoaded" /></object>';
				}else if(navigator.mimeTypes.length<1){
					//IE
					if(_IS_TEST==1) arrText.push('navigator.mimeTypes.length<1');
					div_obj.innerHTML='<object id="plugin" type="application/x-lcsignplugin" width="1" height="1"><param name="onload" value="pluginLoaded" /></object>\n'+'<object id="plugin2" type="application/x-lcsigncspplugin" width="1" height="1"><param name="onload" value="pluginLoaded" /></object>';
				}else{
					arrText.push("Ничего не обнаружили в mimetype");
					//alert("У Вас не установлен плагин!\nДля получения тестовой версии плагина отправьте нам письмо по адресу info@lissi.ru.");
					show_not_plugin();
					return null;
				}
			}
		}catch(err){
			//IE. нет поддержки метода namedItem
			div_obj.innerHTML='<object id="plugin" type="application/x-lcsignplugin" width="1" height="1"><param name="onload" value="pluginLoaded" /></object>\n'+'<object id="plugin2" type="application/x-lcsigncspplugin" width="1" height="1"><param name="onload" value="pluginLoaded" /></object>';
		}
	}
	
	if(_IS_TEST==1) alert(arrText.join("\n"));
	
	if(CreateLCPlugin.arguments.length>0) id_str=CreateLCPlugin.arguments[0];
	else id_str="plugin";
	
    return document.getElementById(id_str);
}

//заполняем глобальные переменные
//если передаем какой-либо параметр, то не грузим список токенов
function init_obj(){
	token_obj=document.getElementById("token");
	file4sign_obj=document.getElementById("file4sign");
	cert_obj=document.getElementById("cert");
	db_dir_obj=document.getElementById("db_dir");
	file_path_obj=document.getElementById("file_path");
	dir_path_obj=document.getElementById("signature_path");
	file_dir_obj=document.getElementById("file_dir");
	module_obj=document.getElementById("module");
	
	lcplugin = CreateLCPlugin();
	if(lcplugin==null){
		//alert("Отсутствует плагин!");
		show_not_plugin();
		return 0;
	}
	
	//берем токены
	var load_token_res;
	
	if(init_obj.arguments.length<1) load_token_res=load_token();
	else load_token_res=1;
	
	if(document.getElementById("Form1")!=null ? load_token_res : false) document.getElementById("Form1").style.display="block";
	else if(document.getElementById("Form1")!=null ) document.getElementById("Form1").style.display="none";
	
	//надо запомнить: какую бблиотеку используем
	_IS_LIR_CRYPTOWRAPPER=check_lir_cryptowrapper();
}

function check_lir_cryptowrapper(){
	try{
		var res_obj=lcplugin.About();
		if(res_obj.about.split("NSSCryptoWrapper").length > 1) return 0;
		return 1;
	}catch(err){
		return 0;
	}
}

function hide_cert_div(){
	var cert_div_obj=document.getElementById('cert_div');
	if(cert_div_obj!=null) cert_div_obj.style.display="none";
}

//функция грузит список токенов из базы данных и тем самым проверяет работоспособность плагина
function load_token(){
	var k;
	var token_ctrl;
	var btn_id;
	
	disabledButtons(true);
	
	hide_cert_div();
	
	if(load_token.arguments.length<1){
		token_ctrl=token_obj;
		btn_id='cert_btn';
	}else{
		token_ctrl=load_token.arguments[0];
		btn_id=load_token.arguments[1];
	}
	
	if(lcplugin==null){
		lcplugin = CreateLCPlugin();
	}
	
	try{
		k = lcplugin.ListToken();
	}catch(err){
		if(_IS_TEST==1) alert("Error calling lcplugin.ListToken() 1!");
		
		//пробуем взять второй плагин
		lcplugin = CreateLCPlugin("plugin2");
		
		try{
			k = lcplugin.ListToken();
		}catch(err){
			//alert("У Вас не установлен плагин!\nДля получения тестовой версии плагина отправьте нам письмо по адресу info@lissi.ru.");
			if(_IS_TEST==1) alert("Error calling lcplugin.ListToken() 2!");
			
			show_not_plugin();
			disabledButtons(false);
			return 0;
		}
	}
	
	if(token_ctrl==null){
		disabledButtons(false);
		return 1;
	}
	
	while(token_ctrl.options.length>0) token_obj.remove(0);
	
	if(k.length<1){
		//alert("Список токенов пуст!");
		if(_LANG_TYPE==0) show_not_plugin("У Вас отсутствует библиотека NSSCryptoWrapper, без которой невозможно выполнение криптографических операций!", "библиотеки");
		else show_not_plugin("You no library NSSCryptoWrapper, without which it is impossible to perform cryptographic operations!", "library");
		
		disabledButtons(false);
		return false;
	}
	
	for(var i=0; i<k.length; i++){
		if(!blnShowAllToken ? k[i]=="all" : false) continue;
		
	    var cur_elem=document.createElement("option");
	    cur_elem.value=k[i];
	    cur_elem.text=k[i];
	    token_ctrl.options.add(cur_elem);
	}
	
	//var btn_obj=document.getElementById(btn_id);
	//if(btn_obj!=null) btn_obj.disabled=false;
	
	disabledButtons(false);
	
	return 1;
}

//функция отображает данные по сертификату
function show_cert_info(){
	var cert_ctrl, cert_info_id;
	
	if(show_cert_info.arguments.length>0){
		cert_ctrl=show_cert_info.arguments[0];
		cert_info_id=show_cert_info.arguments[1];
	}else{
		cert_ctrl=cert_obj;
		cert_info_id="cert_info";
	}
	
	if(cert_ctrl==null) return 0;
	
	//юерем значение сертификата
	var cert_val=cert_ctrl.options[cert_ctrl.selectedIndex].value;
	k=new Array();
	
	k = lcplugin.GetCertInfo(cert_val);
	
	var cert_info_obj=document.getElementById(cert_info_id);
	
	cert_info_obj.innerHTML='';
	
	for(var i=0; i<k.length; i++){
	    cert_info_obj.innerHTML += k[i].split(",").join(", ") + "<br>";
	}
	cert_info_obj.innerHTML = "<pre>" + cert_info_obj.innerHTML  + "</pre>";
	
	var btn_div=document.getElementById("show_cert_info");
	if(btn_div!=null){
		btn_div.style.display='block';
	}
}

//отображает сертификат в PEM-формате
function show_cert_pem(div_id){
	disabledButtons(true);
	
	var div_obj=document.getElementById(div_id);
	div_obj.style.display="none";
	
	//берем значение сертификата
	var cert_val=cert_obj.options[cert_obj.selectedIndex].value;
	k=new Array();
	
	try{
		k = lcplugin.GetCertContent(cert_val);
		
		if ( k != 0 )
		{
			//document.getElementById('cert_content').innerHTML='<pre>'+k+'</pre>';
			var arrTmp=k.split("-----");
			if(arrTmp.length<2) div_obj.innerHTML='<pre>'+_CERT_HEADER+k+_CERT_FOOTER+'</pre>';
			else div_obj.innerHTML='<pre>'+k+'</pre>';
			div_obj.style.display="block";
		}else alert(_LANG_TYPE==0 ? "Функция GetCertContent вернула код ошибки 0!" : "GetCertContent function returned error code 0!");
	}catch(err){
		alert(_LANG_TYPE==0 ? "Ошибка: В криптоплагине нет метода GetCertContent!" : "Error: In plugine no method GetCertContent!");
	}
	
	disabledButtons(false);
}

//функция для инициализации токена
//параметры: если пусто, то нужны Priv, иначе - ALL
//функция загружает список сертификатов из выбранного хранилища
function init_token(){
	var token_ctrl;
	var cert_ctrl;
	var cert_div_name;
	var cert_info_id;
	
	if(init_token.arguments.length>1){
		token_ctrl=init_token.arguments[1];
		cert_ctrl=init_token.arguments[2];
		cert_div_name=init_token.arguments[3];
		cert_info_id=init_token.arguments[4];
	}else{
		token_ctrl=token_obj;
		cert_ctrl=cert_obj;
		cert_div_name='cert_div';
	}
	
	disabledButtons(true);
	
	if(init_token.arguments.length>0 ? init_token.arguments[0]==true : false){
		k = lcplugin.AllCert(token_ctrl.options[token_ctrl.selectedIndex].value);
	}else{
		//Здесь вызвать функцию плагина, которая вернет массив сертификатов
		k = lcplugin.PrivCert(token_ctrl.options[token_ctrl.selectedIndex].value);
	}
	
	if(k.length<1){
		alert("На выбранном токене нет сертификатов!");
		//пытаемся скрыть слой с сертификатами
		var cert_div=document.getElementById("cert_div");
		if(cert_div!=null) cert_div.style.display="none";
		
		disabledButtons(false);
		
		return false;
	}
	
	if(cert_btn!=null) cert_btn.disabled=false;
	
	if(cert_ctrl==null){
		disabledButtons(false);
		return 1;
	}
	
	while(cert_ctrl.options.length>0) cert_ctrl.remove(0);
	
	for(var i=0; i<k.length; i++){
	    var cur_elem=document.createElement("option");
	    cur_elem.value=k[i];
	    cur_elem.text=k[i];
	    cert_ctrl.options.add(cur_elem);
	}

	if(init_token.arguments.length>1) show_cert_info(cert_ctrl, cert_info_id);
	else show_cert_info();
	
	document.getElementById(cert_div_name).style.display="block";
	
	disabledButtons(false);
	
	return true;
}

function show_full_cert_info(cert_nickname, show_cert){
	disabledButtons(true);
	
	var res;
	
	try{
		res=lcplugin.CertOrReqView(cert_nickname, show_cert);
		if(res.length>0) alert(res);
		else alert(_LANG_TYPE==0 ? "Для просмотра был выбран файл некорректного типа!" : "To view the selected file with the incorrect type!");
	}catch(err){
		alert(_LANG_TYPE==0 ? "Ваша версия плагина не поддерживает метод CertOrReqView!\nОбратитесь в ООО \"ЛИССИ-Софт\" за новой версией плагина." : "Your plugin version is not supported in CertOrReqView!\nContact us for a new version of the plugin.");
	}
	
	disabledButtons(false);
}

//************************************************************************
//		Функции по работе с файлами и директориями
//************************************************************************
//возвращает новое имя для сохраняемого файла
function get_new_filename(filename_str, sep_str, dir_str, suffix){
	var clear_name;
	if(get_new_filename.arguments.length>4) clear_name=get_file_clear_name(filename_str, sep_str, true);
	else clear_name=get_file_clear_name(filename_str, sep_str);

	if(dir_str.substr(dir_str.length-1)!=sep_str) return dir_str+sep_str+clear_name+suffix;
	return dir_str+clear_name+suffix;
}

//возвращает текуший сепаратор в пути
function get_cur_sep(path_str){
	var arrTmp=path_str.split("/");
	
	if(arrTmp.length>1) return "/";
	return "\\";
}

//функция выбора файла для подписи
function select_dir(parent_ctrl){
	disabledButtons(true);
	
    var dir_path = lcplugin.SelectDir();
	
    if ( dir_path != "" )
		parent_ctrl.value = dir_path;
	else parent_ctrl.value='';
	
	disabledButtons(false);
}

//функция выбора файла для подписи
function select_file(file_obj){
	disabledButtons(true);
	
	file4sign = lcplugin.SelectFile();
    if ( file4sign != "" ) file_obj.value = file4sign;
	
	disabledButtons(false);
}

function get_file_clear_name(val_str, sep_str){
	var arrTmp=val_str.split(sep_str);
	
	var file_name=arrTmp[arrTmp.length-1];
	
	if(get_file_clear_name.arguments.length<3) return file_name;
	
	//отрезаем последнее окончание
	arrTmp=file_name.split(".");
	
	return arrTmp.slice(0, arrTmp.length-1).join(".");
}

var ButtonOnClickArr=new Array();

function disabledButtons(blnFlag){
	
	if(disButtonsArr==null) return true;
		
	if(blnFlag ? ButtonOnClickArr.length<1 : false) ButtonOnClickArr=new Array();//чтобы не было переопределяни пустыми событиями
	
	for(var i=0; i<disButtonsArr.length; i++){
		var cur_obj=document.getElementById(disButtonsArr[i]);
		if(cur_obj==null) continue;
		
		if(blnFlag){
			if(ButtonOnClickArr[i]==null) ButtonOnClickArr[i]=cur_obj.onclick;//чтобы не было переопределяни пустыми событиями
			cur_obj.onclick=null;
		}else{
			cur_obj.onclick=ButtonOnClickArr[i];
		}
		
		cur_obj.disabled=blnFlag;
		cur_obj.readonly=blnFlag;
	}
	
	if(!blnFlag) ButtonOnClickArr=new Array();
	
	return true;
}

//************************************************************************
//		Дополнительные метолы объекта String
//************************************************************************
String.prototype.trim=function()
{
  return rtrim(ltrim(this));
}

function ltrim(s)
{
  return s.replace(/^\s+/, ''); 
}

function rtrim(s)
{
  return s.replace(/\s+$/, ''); 
}

function valid_engtextbox(id_str){
	var obj=document.getElementById(id_str);
	var val=obj.value;
	
	if(val.length<1) return false;
	
	var arrTmp=val.split(".");
	val=arrTmp.join("");
	//проверяем наличие только английских букв и цифр
	var re=/^([A-Za-z0-9_-]+)$/;
	
	var res=re.test(val);
	
	if(!res) return false;
	
	return true;
}

//************************************************************//
//		Array functions
//************************************************************//
//возвращает true, если переданное значение есть в индексном массиве
Array.prototype.inArray = function (value) {
        var i;
        for (i=0; i < this.length; i++) {
                if (this[i] === value) {
                        return true;
                }
        }
        return false;
};

//************************************************************//
//		Функции и константы для многоязыковости
//************************************************************//
var _LANG_TYPE=0;//по умолчанию русский
var _ARR_LANG=new Array('ru', 'en');
var _LANG_SELECT_OPTIONS=new Array();//массив, в котором будем сохранять значения по языкам для option

function change_lang(){
	var obj=document.getElementById("lang_cmb");
	if(obj==null) return;
	
	_LANG_TYPE=obj.options[obj.selectedIndex].value;//переопределяем переменную языка
	
	//-1. Запоминаем в поле значение, если оно ест
	var hidden_obj=document.getElementById("LANG_VAL");
	if(hidden_obj!=null){
		hidden_obj.value=_LANG_TYPE;
	}
		
	//0. Заголовок страницы
	try{
		document.title=_ARR_TITLES[_LANG_TYPE];
	}catch(err){};
	
	//1. Надо отобразить соответствующие тексты
	for(var i=0; i<_ARR_LANG.length; i++){
		//1.1. Берем массив объектов
		var obj_arr=document.getElementsByTagName(_ARR_LANG[i]);
		var blnShow=(i==_LANG_TYPE);
		
		for(var j=0; j<obj_arr.length; j++) obj_arr[j].style.display=blnShow ? 'inline' : 'none';
	}
	
	//2. Пробегаем по кнопкам
	var obj_arr=document.getElementsByTagName("input");
	var cur_tag=_ARR_LANG[_LANG_TYPE];
	
	for(var j=0; j<obj_arr.length; j++){
		if(obj_arr[j].getAttribute(cur_tag)==null) continue;
		
		obj_arr[j].setAttribute("value", obj_arr[j].getAttribute(cur_tag));
	}
	
	//3. Пробегаем по select
	var obj_arr=document.getElementsByTagName("select");
	
	for(var j=0; j<obj_arr.length; j++){
		if(obj_arr[j].getAttribute("id")==null) continue;
		if(_LANG_SELECT_OPTIONS[obj_arr[j].getAttribute("id")]==null) continue;
		
		var cur_id=obj_arr[j].getAttribute("id");
		
		var cur_sel_index=obj_arr[j].selectedIndex;
		
		//стираем всё
		while(obj_arr[j].options.length>0) obj_arr[j].remove(0);
		
		for(var name in _LANG_SELECT_OPTIONS[cur_id]){
			if(typeof(_LANG_SELECT_OPTIONS[cur_id][name]) !='object') continue;
			
			//заполняем по-новой
			var curElem=document.createElement("OPTION");
			curElem.value=name;
			curElem.text=_LANG_SELECT_OPTIONS[cur_id][name][cur_tag]!=null ? _LANG_SELECT_OPTIONS[cur_id][name][cur_tag] : '';
			//if(iCount==0) curElem.selected=true;
			
			obj_arr[j].options.add(curElem);
		}
		
		if(obj_arr[j].options[cur_sel_index]!=null) obj_arr[j].options[cur_sel_index].selected=true;
		else obj_arr[j].options[0].selected=true;
	}
}

function get_page_anchor(){
	var arrTmp=self.location.toString().split("#"); 
	if(arrTmp.length<2) return _ARR_LANG[_LANG_TYPE];//'';
	
	return arrTmp[1];
}

//действия после загрузки страницы
function actions_after_load(){
	var cur_lang_str=get_page_anchor();
	
	var selIndex=0;
	
	if(cur_lang_str.length>0){
		//выставляем язык
		for(var i=0; i<_ARR_LANG.length; i++){
			if(_ARR_LANG[i]==cur_lang_str){
				selIndex=i;
				break;
			}
		}
	}
	
	//Пробегаем по option - ищем родительские select и сохраняем для них в массиве _LANG_SELECT_OPTIONS все данные по текстам
	var obj_arr=document.getElementsByTagName("option");
	var cur_parent=null;
	
	for(var j=0; j<obj_arr.length; j++){
		if(obj_arr[j].getAttribute("lng")==null) continue;
		
		cur_parent=obj_arr[j].parentNode;
		if(cur_parent.getAttribute("id")==null){
			//надо присвоить какой-нить ID
			cur_parent.setAttribute("id", "select_"+Math.random() * 1000000);
		}
		
		var cur_id=cur_parent.getAttribute("id");
		
		if(_LANG_SELECT_OPTIONS[cur_id]==null) _LANG_SELECT_OPTIONS[cur_id]=new Array();
		if(_LANG_SELECT_OPTIONS[cur_id][obj_arr[j].value]==null) _LANG_SELECT_OPTIONS[cur_id][obj_arr[j].value]=new Array();
		
		_LANG_SELECT_OPTIONS[cur_id][obj_arr[j].value][obj_arr[j].getAttribute("lng")]=obj_arr[j].text;
	}
	
	/*
	//печать ассоциативного массиа
	for(var name in _LANG_SELECT_OPTIONS['cert_type']){
		if(typeof(_LANG_SELECT_OPTIONS['cert_type'][name]) !='object') continue;
		
		var arrT=new Array();
		for(var name2 in _LANG_SELECT_OPTIONS['cert_type'][name]){
			if(typeof(_LANG_SELECT_OPTIONS['cert_type'][name][name2]) =='function') continue;
			
			arrT.push("          "+name2+": "+_LANG_SELECT_OPTIONS['cert_type'][name][name2]);
		}
		
		alert("name: "+name+"\n"+arrT.join("\n"));
	}
	*/
	
	var obj=document.getElementById("lang_cmb");
	if(obj==null) return;
	
	obj.selectedIndex=selIndex;
	
	change_lang();
}