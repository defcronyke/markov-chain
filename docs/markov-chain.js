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

	const outputNumWords = outputNumWordsEl.value || 50;

	for (var i = 0; i < (outputNumWords - 1); i++) {
		const markovWords = getMarkovWords(wds, randomWord);

		randomWord = markovWords[getRandomInt(0, markovWords.length - 1)];

		outputText += ' ' + randomWord;
	}

	// End the last sentence.
	while (!/[\.\!\?]/g.test(randomWord[randomWord.length - 1])) {
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

(function () {
	const clearEls = {
		innerText: [],
		value: []
	};

	const outputNumWordsEl = document.getElementById('output-num-words');
	if (!outputNumWordsEl) {
		return;
	}

	outputNumWordsEl.defaultVal = outputNumWordsEl.value || 50;

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

	bookButton.addEventListener('click', function () {
		const baseURL = 'https://defcronyke.github.io/markov-chain/';
		const textDir = 'text/';
		const book = 'alices-adventures-in-wonderland-by-lewis-carroll-gutenberg.txt';
		const url = baseURL + textDir + book;

		fetch(url)
			.then(function (res) {
				return res.text();
			})
			.then(function (res) {
				const inputTextEl = document.getElementById('input-text');
				if (!inputTextEl) {
					return;
				}

				inputTextEl.value = res;

				return res;
			})
			.catch(function (err) {
				console.log('error: Failed fetching book: ' + path);
				console.log('error:');
				console.log(err);
				return err;
			});
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

		const outputNumWordsEl = document.getElementById('output-num-words');
		if (!outputNumWordsEl) {
			return;
		}

		outputNumWordsEl.value = outputNumWordsEl.defaultVal || 50;

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

})();
