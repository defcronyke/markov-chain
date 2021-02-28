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
			var startTime = now();

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
	if (!els || !els.innerText || !els.value) {
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

function words(inputText) {
	if (!inputText) {
		return;
	}

	const arr = inputText.split(/[\s\n]+/);
	if (!arr) {
		return;
	}

	const arr2 = arr.filter(function(val) {
		return val !== '';
	});

	return arr2;
}

function wordOccurrences(wds, wordCount, wordOccurrencesEl, clearEls) {
	if (!wds) {
		return;
	}

	console.log('!!!!!! STARTED !!!!!!!!');

	const arr = [];
	const obj = {};

	window.setTimeout(function() {
		processLargeArrayAsync(wds, 
			function(word) {
				const item = (arr.find(function(val) {
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

				if (word in obj) {
					obj[word]++;
					return;
				}

				obj[word] = 1;
			},

			function() {
				console.log('!!!!!! SORTING !!!!!!!!');

				arr.sort(function(a, b) {
					const sort1 = b.occurrences - a.occurrences;
		
					if (sort1 === 0) {
						return a.word.toLowerCase() < b.word.toLowerCase() ? -1 : 1;
					}
		
					return sort1;
				});

				const res = {'number_of_words': wordCount, 'sorted': arr, 'lookup': obj};

				console.log('!!!!!! MAKING JSON !!!!!!!!');

				const wordOccurrencesJSON = JSON.stringify(res, null, 2);

				console.log('!!!!!! ADDING INNER TEXT !!!!!!!!');

				addInnerText(wordOccurrencesEl, wordOccurrencesJSON, clearEls);

				console.log('!!!!!! ASYNC DONE !!!!!!!!');
			}
		);

	}, 1);

	return true;
}

function markovChain(inputText, outputTextEl, clearEls) {
	if (!inputText || !clearEls) {
		return;
	}

	const wds = words(inputText);
	if (!wds) {
		return;
	}

	const wordCount = wds.length;
	if (!wordCount) {
		return;
	}

	console.log('word count: ' + wordCount);

	const wordCountEl = document.getElementById('num-words');
	if (!wordCountEl) {
		return;
	}

	addInnerText(wordCountEl, wordCount, clearEls);

	const wordOccurrencesEl = document.getElementById('word-occurrences');
	if (!wordOccurrencesEl) {
		return;
	}

	const wdOccurrences = wordOccurrences(wds, wordCount, wordOccurrencesEl, clearEls);
	if (!wdOccurrences) {
		return;
	}

	outputTextEl.innerText = '';

	return true;
}

(function() {

	const clearEls = {
		innerText: [],
		value: []
	};

	const generateButton = document.getElementById('generate-button');
	if (!generateButton) {
		return;
	}

	generateButton.addEventListener('click', function() {
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

		const res = markovChain(inputText, outputTextEl, clearEls);
		if (!res) {
			return;
		}

		console.log('!!!!!! DONE !!!!!!!!');
	});

	const clearButton = document.getElementById('clear-button');
	if (!clearButton) {
		return;
	}

	clearButton.addEventListener('click', function() {
		const inputTextEl = document.getElementById('input-text');
		if (!inputTextEl) {
			return;
		}

		inputTextEl.value = '';

		const outputTextEl = document.getElementById('output-text');
		if (!outputTextEl) {
			return;
		}

		outputTextEl.value = '';

		clear(clearEls);
	});

})();
