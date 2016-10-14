var lcplugin = null,
	SUCCESS_TRUE = 537133056,
	SUCCESS_FALSE = -1610350587,
	messagesType = 0;

function logFunction() {
	[function() {
		document.getElementById('result').innerHTML += '<br /><br />' + [].join.call(arguments, '<br />');
	}, function() {
		alert([].join.call(arguments, '\n'));
	}, function() {
		console.log.apply(console, arguments);
	}][messagesType].apply(this, arguments);
};

function toggleIsAlertMessages(button) {
	button = button || document.getElementById('messages_types_toggler');

	if (!messagesType) {
		clearMessages();
	}
	
	if (++messagesType > 2) {
		messagesType = 0;
	}

	button.innerText = ['Выводить сообщения в документе', 'Выводить сообщения во всплывающем окне', 'Выводить сообщения в консоли'][messagesType];

	document.getElementById('clear_messages')[messagesType === 0 ? 'removeAttribute' : 'setAttribute']('hidden', 'hidden');
}

//toggleIsAlertMessages();

function clearMessages() {
	document.getElementById('result').innerHTML = '';
}

function CreateLCPlugin() {
	var div_obj = document.getElementById("for_plugin"),
		plugin = null;

	if (!div_obj.innerHTML.length) {
		div_obj.innerHTML = '<object id="plugin" type="application/x-lcsignplugin" width="1" height="1"><param name="onload" value="pluginLoaded" /></object>';
	}

	plugin = div_obj.getElementsByTagName('object')[0];

	if (!plugin.SelectFile) {
		div_obj.innerHTML = '<object id="plugin" type="application/x-lcsigncspplugin" width="1" height="1"><param name="onload" value="pluginLoaded" /></object>';
		plugin = div_obj.getElementsByTagName('object')[0];
	}

	if (!plugin.SelectFile) {
		logFunction("Плагин не установлен.");

		return null;
	}

	return plugin;
}

function init_obj() {
	lcplugin = CreateLCPlugin();

	if (lcplugin == null) {
		logFunction("Отсутствует плагин!");

		return 0;
	} else {
		//checkPluginMethods();
	}
}

function sign_file(isAttached) {
	if (lcplugin) {
		var file = lcplugin.SelectFile(),
			result = null,
			b64File, b64FileP7, errorSignMessage;

		if (file) {
			result = lcplugin.PKCS7SignFile(file, file + '.p7s', isAttached || false);

			if (result === SUCCESS_TRUE) {
				b64File = encodeFileBase64(file);
				b64FileP7 = encodeFileBase64(file + '.p7s');

				if (b64File.length && b64FileP7.length) {
					logFunction(file + 'Файл подписан.');
					logFunction('Подписанный файл - ' + file);
					logFunction('Файл подписи - ' + file + '.p7s');
					/*logFunction({
						b64File: b64File,
						b64FileP7: b64FileP7
					});*/
				}
			} else {
				switch (result) {
					case -1610350576:
						errorSignMessage = 'Не найден сертификат.';
						break;
					case -1610350558:
						errorSignMessage = 'Криптопровайдер не установлен.';
						break;
					case 537133057:
						errorSignMessage = 'Ошибка подписи.';
						break;
					case -1610350587:
						errorSignMessage = 'Не удалось открыть файл.';
						break;
					case -1610350589:
						errorSignMessage = 'Недостаточно памяти.';
						break;
					case -1610350586:
						errorSignMessage = 'Не удалось создать файл для записи.';
						break;
					case -1610350575:
						errorSignMessage = 'Нет сертификатов.';
						break;
					case -1610350588:
						errorSignMessage = 'Пользователь отменил выбор сертификата.';
						break;
					case -1610350569:
						errorSignMessage = 'Не удалось построить цепочку сертификата.';
						break;
					case -1610350568:
						errorSignMessage = 'Истек срок действия сертификата.';
						break;
					case -1610350560:
						errorSignMessage = 'Корневой сертификат цепочки не доверенный.';
						break;
					case -1610350559:
						errorSignMessage = 'Неполная цепочка сертификата.';
						break;
					case -1610350570:
						errorSignMessage = 'Не удалось получить доступ к хранилищу сертификатов.';
						break;
				}

				logFunction(errorSignMessage);

				return false;
			}
		}
	}
}

function sign_file_with_attach() {
	sign_file(true);
}

function encodeFileBase64(file) {
	var	file = file || lcplugin.SelectFile(),
		b64Strings = [],
		b64 = '',
		length = 1024*1024*2;

	if (file) {
		for (var i = 0;; i++) {
			b64 = lcplugin.EncodeFileBase64(file, length*i, length);

			if (b64.length) {
				//b64 = b64.replace(/\n+/g, '');
				b64Strings.push(b64);
			} else {
				break;
			}
		}
	}

	if (!arguments.length) {
		logFunction(b64Strings);
	}

	if (file && !b64Strings.length) {
		logFunction('Декодирование файла ' + file + ' не удалось.');
	}

	return b64Strings;
}

function check_sign(isAttached) {
	var file4sign = lcplugin.SelectFile(),
		result, errorSignMessage;

	if (file4sign) {
		result = lcplugin.PKCS7VerifyFile(file4sign, file4sign + (isAttached ? '' : '.p7s'));

		console.log(result);

		if (result === SUCCESS_TRUE) {
			logFunction('Подпись действительна.');
		} else {
			switch (result) {
				case -1610350583:
					errorSignMessage = 'Подпись неверна, неверный формат подписи.';
					break;
				case -1610350584:
					errorSignMessage = 'Подпись неверна, не совпадают данные.';
					break;
				case -1610350585:
					errorSignMessage = 'Подпись неверна.';
					break;
				case -1610350558:
					errorSignMessage = 'Криптопровайдер не установлен.';
					break;
				case -1610350587:
					errorSignMessage = 'Не удалось открыть файл данных.';
					break;
				case -1610350589:
					errorSignMessage = 'Недостаточно памяти.';
					break;
				case -1610350586:
					errorSignMessage = 'Не удалось открыть файл подписи.';
					break;

				case -1610350575:
					errorSignMessage = 'Нет сертификатов.';
					break;
				case -1610350588:
					errorSignMessage = 'Пользователь отменил выбор сертификата.';
					break;
				case -1610350569:
					errorSignMessage = 'Не удалось построить цепочку сертификата.';
					break;
				case -1610350568:
					errorSignMessage = 'Истек срок действия сертификата.';
					break;
				case -1610350560:
					errorSignMessage = 'Корневой сертификат цепочки не доверенный.';
					break;
				case -1610350559:
					errorSignMessage = 'Неполная цепочка сертификата.';
					break;
				case -1610350570:
					errorSignMessage = 'Не удалось получить доступ к хранилищу сертификатов.';
					break;
			}

			logFunction(errorSignMessage || 'Ошибка ' + result);
		}
	}
}

function check_attached_sign() {
	check_sign(true);
}

function checkPluginMethods() {
	var DOMObject = document.createElement('object'),
		methods = [];

	for(var key in lcplugin) {
		if (!(key in DOMObject)){
			methods.push(key);
		}
	}

	if (lcplugin) {
		logFunction('pluginType ', lcplugin.getAttribute('type'));
	}

	try {
		logFunction('application/x-lcsignplugin', !!navigator.mimeTypes.namedItem('application/x-lcsignplugin'));
		logFunction('application/x-lcsigncspplugin', !!navigator.mimeTypes.namedItem('application/x-lcsigncspplugin'));
	} catch(e) {}
	

	if (methods.length) {
		for (var i = 0, max = methods.length; i < max; i++) {
			logFunction(methods[i], true);
		}
	} else {
		logFunction('PKCS7SignFile', !!lcplugin.PKCS7SignFile);
		logFunction('PKCS7VerifyFile', !!lcplugin.PKCS7VerifyFile);
		logFunction('TLSClientSession', !!lcplugin.TLSClientSession);

		logFunction('SelectFile', !!lcplugin.SelectFile);
		logFunction('EncodeFileBase64', !!lcplugin.EncodeFileBase64);


		logFunction('AddModulePKCS11', !!lcplugin.AddModulePKCS11);
		logFunction('ListToken', !!lcplugin.ListToken);
		logFunction('PrivCert', !!lcplugin.PrivCert);
		logFunction('P7SignFile', !!lcplugin.P7SignFile);
		logFunction('TLSClient', !!lcplugin.TLSClient);
	}
}