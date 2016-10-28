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

function openCertificatesStore () {
	CAPICOMStore.Open(cadesplugin.CAPICOM_CURRENT_USER_STORE, cadesplugin.CAPICOM_MY_STORE, cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);
}

function closeCertificatesStore () {
	CAPICOMStore.Close();
}

function syncCreateCertificatesSelectOptions () {
	openCertificatesStore();

	var select = document.getElementById('certificates'),
		certificates = CAPICOMStore.Certificates;
		cert;

	for (var i = 1, imax = certificates.Count; i <= imax; i++) {
		cert = certificates.Item(i);

		select.options[select.options.length] = new Option(cert.SubjectName, i);
		
		console.log('certificate ' + i, cert.SubjectName);
	}

	select.size = certificates.Count;

	closeCertificatesStore();
}

function asyncCreateCertificatesSelectOptions () {
	openCertificatesStore();

	var select = document.getElementById('certificates');

	CAPICOMStore.Certificates.then(function (collection) {
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

	closeCertificatesStore();
}

function createCertificatesSelectOptions () {
	if (cadesplugin.CreateObjectAsync) {
		asyncCreateCertificatesSelectOptions();
	} else {
		syncCreateCertificatesSelectOptions();
	}
}

function asyncGetSelectedCert (index) {
	openCertificatesStore();

	var promise = new Promise(function (resolve) {
			CAPICOMStore.Certificates.then(function (collection) {
				collection.Item(index).then(function (cert) {
					resolve(cert);
				});
			});
		});

	closeCertificatesStore();

	return promise;
}

function syncGetSelectedCert (index) {
	openCertificatesStore();

	var cert = CAPICOMStore.Certificates.Item(index);

	closeCertificatesStore();

	return cert;
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

function sign_file (isDetached) {
	isDetached = isDetached || false;

	//console.log('sign_file', isDetached);
	var fileReader = new FileReader,
		file = document.getElementById("file").files[0],
		content;

	if (!file) {
		return;
	}

	fileReader.readAsDataURL(file);

	fileReader.onload = function (e) {
		var header = ";base64,",
			fileData = e.target.result,
			content = fileData.substr(fileData.indexOf(header) + header.length);

		if (cadesplugin.CreateObjectAsync) {
			getSelectedCert().then(function (cert) {
				CAdESCOMSigner.propset_Certificate(cert).then(function () {
					CAdESCOMSignedData.propset_Content(content).then(function () {
						CAdESCOMSignedData.Sign(CAdESCOMSigner/*, cadesplugin.CADESCOM_CADES_DEFAULT*/).then(function (result) {
							logFunction(result);
						});
					});
				});
			});
		} else {
			CAdESCOMSigner.Certificate = getSelectedCert();

			CAdESCOMSignedData.Content = content;

			logFunction(CAdESCOMSignedData.Sign(CAdESCOMSigner/*, cadesplugin.CADESCOM_CADES_DEFAULT*/));
		}
	};
}

function syncLoading (loadedModules) {
	console.log('syncLoading');

	loadedModules.CAdESCOMSigner = cadesplugin.CreateObject("CAdESCOM.CPSigner");
	loadedModules.CAPICOMStore = cadesplugin.CreateObject("CAPICOM.Store");
	loadedModules.CAdESCOMSignedData = cadesplugin.CreateObject("CAdESCOM.CadesSignedData");

	for (var key in loadedModules) {
		if (loadedModules.hasOwnProperty(key)) {
			window[key] = loadedModules[key];
		}
	}

	console.log('all modules loaded', loadedModules);

	createCertificatesSelectOptions();
}

function asyncLoading (loadedModules) {
	console.log('asyncLoading');

	var CAdESCOMSignedData = cadesplugin.CreateObjectAsync("CAdESCOM.CadesSignedData"),
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

		createCertificatesSelectOptions();
	});
}

cadesplugin.then(function () {
	var loadedModules = {
			CAdESCOMSigner: null,
			CAdESCOMSignedData: null,
			CAPICOMStore: null
		};

	if (cadesplugin.CreateObjectAsync) {
		asyncLoading(loadedModules);
	} else {
		syncLoading(loadedModules);
	}
		
}, function(error) {
	console.log('Не удалось загрузить плагин!');
});