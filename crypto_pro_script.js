var messagesType = 0;

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

function clearMessages() {
	document.getElementById('result').innerHTML = '';
}

function checkPluginMethods() {
	var DOMObject = document.createElement('object'),
		methods = [];

	for(var key in cadesplugin) {
		if (!(key in DOMObject)){
			methods.push(key);
		}
	}
	

	if (methods.length) {
		for (var i = 0, max = methods.length; i < max; i++) {
			logFunction(methods[i], true);
		}
	}
}

function syncCreateCertificatesSelectOptions (certificates) {
	var select = document.getElementById('certificates'),
		cert;

	for (var i = 1, imax = certificates.Count; i <= imax; i++) {
		cert = certificates.Item(i);

		select.options[select.options.length] = new Option(cert.SubjectName, i);
		
		console.log('certificate ' + i, cert.SubjectName);
	}

	select.size = certificates.Count;
}

function asyncCreateCertificatesSelectOptions (certificates) {
	var select = document.getElementById('certificates');

	certificates.then(function (collection) {
		collection.Count.then(function (count) {
			select.size = count;

			for (var i = 1, imax = count; i <= imax; i++) {
				collection.Item(i).then((function (i) {
					return function (item) {
						item.SubjectName.then(function (name) {
							select.options[select.options.length] = new Option(name, i);
						});
					};
				})(i));
			}
		});
	});
}

function createCertificatesSelectOptions (certificates) {
	if (cadesplugin.CreateObjectAsync) {
		asyncCreateCertificatesSelectOptions(certificates);
	} else {
		syncCreateCertificatesSelectOptions(certificates);
	}
}

function sign_file () {
	if (cadesplugin.CreateObjectAsync) {
		getSelectedCert().then(function (cert) {
			console.log(cert);
		});
	} else {
		console.log(getSelectedCert());
	}
}

function asyncGetSelectedCert (index) {
	return new Promise(function (resolve) {
		CAPICOMStore.Certificates.then(function (collection) {
			collection.Item(index).then(function (cert) {
				resolve(cert);
			});
		});
	});
}

function syncGetSelectedCert (index) {
	return CAPICOMStore.Certificates.Item(index);
}

function getSelectedCert () {
	var select = document.getElementById('certificates'),
		index = parseInt(select.value, 10) || 1;

	if (cadesplugin.CreateObjectAsync) {
		return asyncGetSelectedCert(index);
	} else {
		return syncGetSelectedCert(index);
	}
}

function syncLoading (loadedModules) {
	console.log('syncLoading');

	//loadedModules.CAdESCOMStore = cadesplugin.CreateObject("CAdESCOM.Store"),
	loadedModules.CAdESCOMSigner = cadesplugin.CreateObject("CAdESCOM.CPSigner"),
	loadedModules.CAPICOMStore = cadesplugin.CreateObject("CAPICOM.Store");
	loadedModules.CAdESCOMSignedData = cadesplugin.CreateObject("CAdESCOM.CadesSignedData");

	for (var key in loadedModules) {
		if (loadedModules.hasOwnProperty(key)) {
			window[key] = loadedModules[key];
		}
	}

	console.log('all modules loaded', loadedModules);

	loadedModules.CAPICOMStore.Open(cadesplugin.CAPICOM_CURRENT_USER_STORE, cadesplugin.CAPICOM_MY_STORE, cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

	createCertificatesSelectOptions(loadedModules.CAPICOMStore.Certificates);
}

function asyncLoading (loadedModules) {
	console.log('asyncLoading');

	var CAdESCOMSignedData = cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData"),
		//CAdESCOMStore = cadesplugin.CreateObjectAsync("CAdESCOM.Store"),
		CAdESCOMSigner = cadesplugin.CreateObjectAsync("CAdESCOM.CPSigner"),
		CAPICOMStore = cadesplugin.CreateObjectAsync("CAPICOM.Store"),
		load = new Promise(function (resolve, reject) {
			function checkLoadedStatus () {
				for (var key in loadedModules) {
					if (!loadedModules[key]) {
						return false;
					}
				}

				return true;
			};

			/*CAdESCOMStore.then(function (module) {
				loadedModules.CAdESCOMStore = module;

				if (checkLoadedStatus()) {
					resolve();
				}
			}, function () {});*/

			CAdESCOMSignedData.then(function (module) {
				loadedModules.CAdESCOMSignedData = module;

				if (checkLoadedStatus()) {
					resolve();
				}
			}, function () {});

			CAPICOMStore.then(function (module) {
				loadedModules.CAPICOMStore = module;

				if (checkLoadedStatus()) {
					resolve();
				}
			}, function () {});

			CAdESCOMSigner.then(function (module) {
				loadedModules.CAdESCOMSigner = module;

				if (checkLoadedStatus()) {
					resolve();
				}
			}, function () {});
		});

	load.then(function () {
		for (var key in loadedModules) {
			if (loadedModules.hasOwnProperty(key)) {
				window[key] = loadedModules[key];
			}
		}

		console.log('all modules loaded', loadedModules);

		loadedModules.CAPICOMStore.Open(cadesplugin.CAPICOM_CURRENT_USER_STORE, cadesplugin.CAPICOM_MY_STORE, cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

		createCertificatesSelectOptions(loadedModules.CAPICOMStore.Certificates);
	});
}

cadesplugin.then(function () {
	var loadedModules = {
			//CAdESCOMStore: null,
			CAdESCOMSigner: null,
			CAdESCOMSignedData: null,
			CAPICOMStore: null
		};

	if (cadesplugin.CreateObjectAsync) {
		asyncLoading(loadedModules);
	} else {
		syncLoading(loadedModules);
	}
		
},
function(error) {
	console.log('Не удалось загрузить плагин!');
});