// getRandomInt is borrowed from here:
// https://stackoverflow.com/a/1527820
function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// processLargeArrayAsync is borrowed and slightly modified from here:
// https://stackoverflow.com/a/10344560
function processLargeArrayAsync(array, fn, done, maxTimePerChunk, context) {
	context = context || window;
	maxTimePerChunk = maxTimePerChunk || 200;
	var index = 0;

	function now() {
		return new Date().getTime();
	}

	console.log('!!!!!! STARTED PROCESS !!!!!!!!');

	function doChunk() {
		const startTime = now();

		console.log('!!!!!! STARTED CHUNK !!!!!!!!');

		while (index < array.length && (now() - startTime) <= maxTimePerChunk) {
			// callback called with args (value, index, array)
			fn.call(context, array[index], index, array);
			++index;
		}
		if (index < array.length) {
			console.log('!!!!!! FINISHED CHUNK !!!!!!!!');
			// set Timeout for async iteration
			window.setTimeout(doChunk, 1);
			return;
		}

		done.call(context);
	}
	doChunk();
}

function clear(els) {
	if (!els || (!els.innerText && !els.value)) {
		return;
	}

	for (const i in els.innerText) {
		const el = els.innerText[i];

		if ('defaultVal' in el) {
			el.innerText = el.defaultVal;
			continue;
		}

		el.innerText = '';
	}

	for (const i in els.value) {
		const el = els.value[i];

		if ('defaultVal' in el) {
			el.value = el.defaultVal;
			continue;
		}

		el.value = '';
	}
}

function addInnerText(el, val, clearEls) {
	if (!el || !val || !clearEls) {
		return;
	}

	if (!('defaultVal' in el)) {
		el.defaultVal = el.innerText;
	}

	el.innerText = val;
	clearEls.innerText.push(el);
}

function addValue(el, val, clearEls) {
	if (!el || !val || !clearEls) {
		return;
	}

	if (!('defaultVal' in el)) {
		el.defaultVal = el.value;
	}

	el.value = val;
	clearEls.value.push(el);
}

function getBook(done, lastIdx, context) {
	context = context || window;
	lastIdx = lastIdx || -1;

	const books = [
		'alices-adventures-in-wonderland-by-lewis-carroll-gutenberg.txt',
		'dracula-by-bram-stoker-gutenberg.txt',
		'frankenstein-by-mary-wollstonecraft-godwin-shelley-gutenberg.txt',
		'grimms-fairy-tales-by-the-brothers-grimm-gutenberg.txt',
		'the-republic-by-plato-gutenberg.txt'
	];

	const baseURL = 'https://defcronyke.github.io/markov-chain/';
	const textDir = 'text/';

	const inputTextEl = document.getElementById('input-text');
	if (!inputTextEl) {
		return;
	}

	inputTextEl.readonly = true;
	inputTextEl.value = 'Loading a free book, please wait...';

	var randomIdx = getRandomInt(0, books.length - 1);

	if (lastIdx !== -1) {
		while (randomIdx === lastIdx) {
			console.log('Selected the same book as last time, and we don\'t want that. Trying again...');
			randomIdx = getRandomInt(0, books.length - 1);
		}
	}

	const book = books[randomIdx];

	const url = baseURL + textDir + book;

	fetch(url)
		.then(function (res) {
			return res.text();
		})
		.then(function (res) {
			inputTextEl.value = res;
			inputTextEl.readonly = false;

			if (!!done) {
				done.call(context, randomIdx, url, res);
			}

			return res;
		})
		.catch(function (err) {
			console.log('error: Failed fetching book: ' + path);
			console.log('error:');
			console.log(err);
			return err;
		});
}

function words(inputText) {
	if (!inputText) {
		return;
	}

	const arr = inputText.split(/[\s\n]+/);
	if (!arr) {
		return;
	}

	const arr2 = arr.filter(function (val) {
		return val !== '';
	});

	return arr2;
}

function startingWords(wds) {
	if (!wds) {
		return;
	}

	const arr = wds.filter(function (val) {
		return /[A-Z]/g.test(val[0]);
	});

	return arr;
}

function endingWords(wds) {
	if (!wds) {
		return;
	}

	const arr = wds.filter(function (val) {
		return /\.\!\?/g.test(val[val.length - 1]);
	});

	return arr;
}

function wordOccurrences(wds, wordCount, wordOccurrencesEl, clearEls, done, context) {
	if (!wds) {
		return;
	}

	context = context || window;

	console.log('!!!!!! STARTED !!!!!!!!');

	const arr = [];
	const occObj = {};
	const probObj = {};

	window.setTimeout(function () {
		processLargeArrayAsync(wds,
			function (word) {
				const item = (arr.find(function (val) {
					if (val.word === word) {
						val.occurrences++;
						val.probability = val.occurrences / wordCount;
						return true;
					}

					return false;

				}) || { word: word, occurrences: 1, probability: 1 / wordCount });

				if (item.occurrences === 1) {
					arr.push(item);
				}

				if (word in occObj) {
					occObj[word]++;
					probObj[word] = occObj[word] / wordCount;
					return;
				}

				occObj[word] = 1;
				probObj[word] = 1 / wordCount;
			},

			function () {
				console.log('!!!!!! SORTING !!!!!!!!');

				arr.sort(function (a, b) {
					const sort1 = b.occurrences - a.occurrences;

					if (sort1 === 0) {
						return a.word.toLowerCase() < b.word.toLowerCase() ? -1 : 1;
					}

					return sort1;
				});

				const res = { 'number_of_words': wordCount, 'sorted': arr, 'occurrences': occObj, 'probabilities': probObj };

				console.log('!!!!!! MAKING JSON !!!!!!!!');

				const wordOccurrencesJSON = JSON.stringify(res, null, 2);

				console.log('!!!!!! ADDING INNER TEXT !!!!!!!!');

				addInnerText(wordOccurrencesEl, wordOccurrencesJSON, clearEls);

				console.log('!!!!!! ASYNC DONE !!!!!!!!');

				done.call(context);
			}
		);

	}, 1);

	return true;
}

function getMarkovWords(wds, inWord) {
	const nextWords = wds
		.filter(function (val, idx, arr) {
			if (idx === 0) {
				return val === inWord;
			}

			return arr[idx - 1] === inWord;
		});

	return nextWords || [];
}

function markovChain(inputText, outputTextEl, clearEls, done, context) {
	if (!inputText || !outputTextEl || !clearEls) {
		return;
	}

	context = context || window;

	const wds = words(inputText);
	if (!wds) {
		return;
	}

	const startingWds = startingWords(wds) || [wds[getRandomInt(0, wds.length - 1)]];
	if (!startingWds) {
		return;
	}

	const wordCount = wds.length;
	if (!wordCount) {
		return;
	}

	const wordOccurrencesEl = document.getElementById('word-occurrences');
	if (!wordOccurrencesEl) {
		return;
	}

	// Start a sentence.
	var randomWord = startingWds[getRandomInt(0, startingWds.length - 1)];

	var outputText = randomWord;

	const outputNumWordsEl = document.getElementById('output-num-words');
	if (!outputNumWordsEl) {
		return;
	}

	const outputNumWords = outputNumWordsEl.value || 10;

	for (var i = 0; i < (outputNumWords - 1); i++) {
		const markovWords = getMarkovWords(wds, randomWord);

		randomWord = markovWords[getRandomInt(0, markovWords.length - 1)];

		outputText += ' ' + randomWord;
	}

	// End the last sentence.
	while ((!/[\.\!\?]/g.test(randomWord[randomWord.length - 1])) &&
		(!(/[\"\”]/g.test(randomWord[randomWord.length - 1]) && /[\.\!\?]/g.test(randomWord[randomWord.length - 2])))) {
		const markovWords = getMarkovWords(wds, randomWord);

		randomWord = markovWords[getRandomInt(0, markovWords.length - 1)];

		outputText += ' ' + randomWord;
	}

	outputTextEl.value = outputText;

	const enableStatsEl = document.getElementById('enable-stats');
	if (!enableStatsEl) {
		return;
	}

	const enableStats = enableStatsEl.checked;

	if (enableStats) {
		addInnerText(wordOccurrencesEl, 'Processing stats, please wait...', clearEls);

		wordOccurrences(wds, wordCount, wordOccurrencesEl, clearEls, function () {
			done.call(context);
		});
	}

	return true;
}

function removeUnwantedQueryParams(unwantedQueryParams) {
	if (!('URLSearchParams' in window)) {
		return;
	}

	unwantedQueryParams = unwantedQueryParams || [];

	var searchParams = new URLSearchParams(window.location.search);

	var modified = false;

	for (var i in unwantedQueryParams) {
		const unwantedQueryParam = unwantedQueryParams[i];

		if (!!searchParams.get(unwantedQueryParam)) {
			searchParams.delete(unwantedQueryParam);
			modified = true;
		}
	}

	if (modified) {
		var newRelativePathQuery = window.location.pathname;
		const searchParamsStr = searchParams.toString();

		if (searchParamsStr !== '') {
			newRelativePathQuery += '?' + searchParamsStr;
		}

		history.replaceState(null, '', newRelativePathQuery);
	}
}

(function () {
	const unwantedQueryParams = [
		'fbclid'
	];

	removeUnwantedQueryParams(unwantedQueryParams);

	const clearEls = {
		innerText: [],
		value: []
	};

	const selectedFileEl = document.getElementById('selected-file');
	if (!selectedFileEl) {
		return;
	}

	if (!('defaultVal' in selectedFileEl)) {
		selectedFileEl.defaultVal = selectedFileEl.innerText;
	}

	const loadFileEl = document.getElementById('load-file');
	if (!loadFileEl) {
		return;
	}

	loadFileEl.addEventListener('change', function () {
		var inputText = '';

		const selectedFileEl = document.getElementById('selected-file');
		if (!selectedFileEl) {
			return;
		}

		console.log(loadFileEl.files[0]);

		selectedFileEl.innerText = loadFileEl.files.length === 1 ? loadFileEl.files[0].name : loadFileEl.files.length + ' files';

		const inputTextEl = document.getElementById('input-text');
		if (!inputTextEl) {
			return;
		}

		inputTextEl.readonly = true;
		inputTextEl.value = 'Loading files, please wait...';

		var first = true;

		for (var i = 0; i < loadFileEl.files.length; i++) {
			const file = loadFileEl.files[i];

			const reader = new FileReader();

			reader.addEventListener('load', function (e) {
				if (first === true) {
					inputTextEl.value = '';
					first = false;
					inputTextEl.readonly = false;
				}

				const res = e.target.result;

				inputTextEl.value += res + '\n\n';
			});

			reader.readAsText(file);
		}
	});

	const outputNumWordsEl = document.getElementById('output-num-words');
	if (!outputNumWordsEl) {
		return;
	}

	outputNumWordsEl.defaultVal = outputNumWordsEl.value || 10;

	const generateButton = document.getElementById('generate-button');
	if (!generateButton) {
		return;
	}

	generateButton.addEventListener('click', function () {
		const inputTextEl = document.getElementById('input-text');
		if (!inputTextEl) {
			return;
		}

		const inputText = inputTextEl.value;
		if (!inputText) {
			return;
		}

		const outputTextEl = document.getElementById('output-text');
		if (!outputTextEl) {
			return;
		}

		markovChain(inputText, outputTextEl, clearEls, function () {
			console.log('!!!!!! DONE !!!!!!!!');
		});

	});

	const bookButton = document.getElementById('book-button');
	if (!bookButton) {
		return;
	}

	var bookIdx = -1;

	bookButton.addEventListener('click', function () {
		getBook(function (lastIdx, url) {
			console.log('Fetched book: ' + lastIdx + ': ' + url);
			bookIdx = lastIdx;
		}, bookIdx);
	});

	const clearButton = document.getElementById('clear-button');
	if (!clearButton) {
		return;
	}

	clearButton.addEventListener('click', function () {
		const inputTextEl = document.getElementById('input-text');
		if (!inputTextEl) {
			return;
		}

		inputTextEl.value = '';

		const selectedFileEl = document.getElementById('selected-file');
		if (!selectedFileEl) {
			return;
		}

		selectedFileEl.innerText = selectedFileEl.defaultVal || 'No file chosen';

		const loadFileEl = document.getElementById('load-file');
		if (!loadFileEl) {
			return;
		}

		loadFileEl.value = '';

		const outputNumWordsEl = document.getElementById('output-num-words');
		if (!outputNumWordsEl) {
			return;
		}

		outputNumWordsEl.value = outputNumWordsEl.defaultVal || 10;

		const enableStatsEl = document.getElementById('enable-stats');
		if (!enableStatsEl) {
			return;
		}

		enableStatsEl.checked = false;

		const outputTextEl = document.getElementById('output-text');
		if (!outputTextEl) {
			return;
		}

		outputTextEl.value = '';

		clear(clearEls);
	});

	const outputTextEl = document.getElementById('output-text');
	if (!outputTextEl) {
		return;
	}

	outputTextEl.addEventListener('click', function () {
		outputTextEl.select();
		document.execCommand('copy');
	});

})();
