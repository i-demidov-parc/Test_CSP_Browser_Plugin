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

function syncLoading (loadedModules) {
	console.log('syncLoading');

	loadedModules.CAdESCOMStore = cadesplugin.CreateObject("CAdESCOM.Store"),
	loadedModules.CAdESCOMSigner = cadesplugin.CreateObject("CAdESCOM.CPSigner"),
	loadedModules.CAPICOMStore = cadesplugin.CreateObject("CAPICOM.Store");

	for (var key in loadedModules) {
		if (loadedModules.hasOwnProperty(key)) {
			window[key] = loadedModules[key];
		}
	}

	console.log('all modules loaded', loadedModules);

	console.log('certificates before store open', loadedModules.CAPICOMStore.Certificates);

	console.log('store open', loadedModules.CAPICOMStore.Open(cadesplugin.CAPICOM_CURRENT_USER_STORE, cadesplugin.CAPICOM_MY_STORE, cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED));

	console.log('certificates after store open', loadedModules.CAPICOMStore.Certificates);

	console.log('certificates count', loadedModules.CAPICOMStore.Certificates.Count);

	for (var i = 1, imax = loadedModules.CAPICOMStore.Certificates.Count; i <= imax; i++) {
		console.log('certificate ' + i, loadedModules.CAPICOMStore.Certificates.Item(i));
	}
}

function asyncLoading (loadedModules) {
	console.log('asyncLoading');

	var CAdESCOMStore = cadesplugin.CreateObjectAsync("CAdESCOM.Store"),
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

			CAdESCOMStore.then(function (module) {
				loadedModules.CAdESCOMStore = module;

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

		loadedModules.CAPICOMStore.Certificates.then(function () {
			console.log('certificates before store open', arguments);
		}, function () {console.log('certificates before store open', arguments);});

		loadedModules.CAPICOMStore.Open(cadesplugin.CAPICOM_CURRENT_USER_STORE, cadesplugin.CAPICOM_MY_STORE, cadesplugin.CAPICOM_STORE_OPEN_MAXIMUM_ALLOWED);

		loadedModules.CAPICOMStore.Certificates.then(function (collection) {
			collection.Count.then(function (count) {
				for (var i = 1, imax = count; i <= imax; i++) {
					collection.Item(i).then((function (i) {
						return function (item) {
							console.log('certificate ' + i, item);
						};
					})(i));
				}
			});

			console.log('certificates after store open', collection);
		}, function () {});

		//console.log('certificates after store open', loadedModules.CAPICOMStore.Certificates);
	});
}

cadesplugin.then(function () {
	var loadedModules = {
			CAdESCOMStore: null,
			CAdESCOMSigner: null,
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