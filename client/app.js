function _toConsumableArray2(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

(function webpackUniversalModuleDefinition(root, factory) {
	if (typeof exports === 'object' && typeof module === 'object') module.exports = factory();else if (typeof define === 'function' && define.amd) define([], factory);else if (typeof exports === 'object') exports["JsDiff"] = factory();else root["JsDiff"] = factory();
})(this, function () {
	return (/******/(function (modules) {
			// webpackBootstrap
			/******/ // The module cache
			/******/var installedModules = {};

			/******/ // The require function
			/******/function __webpack_require__(moduleId) {

				/******/ // Check if module is in cache
				/******/if (installedModules[moduleId])
					/******/return installedModules[moduleId].exports;

				/******/ // Create a new module (and put it into the cache)
				/******/var module = installedModules[moduleId] = {
					/******/exports: {},
					/******/id: moduleId,
					/******/loaded: false
					/******/ };

				/******/ // Execute the module function
				/******/modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

				/******/ // Flag the module as loaded
				/******/module.loaded = true;

				/******/ // Return the exports of the module
				/******/return module.exports;
				/******/
			}

			/******/ // expose the modules object (__webpack_modules__)
			/******/__webpack_require__.m = modules;

			/******/ // expose the module cache
			/******/__webpack_require__.c = installedModules;

			/******/ // __webpack_public_path__
			/******/__webpack_require__.p = "";

			/******/ // Load entry module and return exports
			/******/return __webpack_require__(0);
			/******/
		})(
		/************************************************************************/
		/******/[
		/* 0 */
		function (module, exports, __webpack_require__) {

			/* See LICENSE file for terms of use */

			/*
    * Text diff implementation.
    *
    * This library supports the following APIS:
    * JsDiff.diffChars: Character by character diff
    * JsDiff.diffWords: Word (as defined by \b regex) diff which ignores whitespace
    * JsDiff.diffLines: Line based diff
    *
    * JsDiff.diffCss: Diff targeted at CSS content
    *
    * These methods are based on the implementation proposed in
    * "An O(ND) Difference Algorithm and its Variations" (Myers, 1986).
    * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
    */
			'use strict';

			exports.__esModule = true;
			// istanbul ignore next

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { 'default': obj };
			}

			var _diffBase = __webpack_require__(1);

			var _diffBase2 = _interopRequireDefault(_diffBase);

			var _diffCharacter = __webpack_require__(2);

			var _diffWord = __webpack_require__(3);

			var _diffLine = __webpack_require__(5);

			var _diffSentence = __webpack_require__(6);

			var _diffCss = __webpack_require__(7);

			var _diffJson = __webpack_require__(8);

			var _patchApply = __webpack_require__(9);

			var _patchParse = __webpack_require__(10);

			var _patchCreate = __webpack_require__(11);

			var _convertDmp = __webpack_require__(12);

			var _convertXml = __webpack_require__(13);

			exports.Diff = _diffBase2['default'];
			exports.diffChars = _diffCharacter.diffChars;
			exports.diffWords = _diffWord.diffWords;
			exports.diffWordsWithSpace = _diffWord.diffWordsWithSpace;
			exports.diffLines = _diffLine.diffLines;
			exports.diffTrimmedLines = _diffLine.diffTrimmedLines;
			exports.diffSentences = _diffSentence.diffSentences;
			exports.diffCss = _diffCss.diffCss;
			exports.diffJson = _diffJson.diffJson;
			exports.structuredPatch = _patchCreate.structuredPatch;
			exports.createTwoFilesPatch = _patchCreate.createTwoFilesPatch;
			exports.createPatch = _patchCreate.createPatch;
			exports.applyPatch = _patchApply.applyPatch;
			exports.applyPatches = _patchApply.applyPatches;
			exports.parsePatch = _patchParse.parsePatch;
			exports.convertChangesToDMP = _convertDmp.convertChangesToDMP;
			exports.convertChangesToXML = _convertXml.convertChangesToXML;
			exports.canonicalize = _diffJson.canonicalize;

			/***/
		},
		/* 1 */
		function (module, exports) {

			'use strict';

			exports.__esModule = true;
			exports['default'] = Diff;

			function Diff() {}

			Diff.prototype = {
				diff: function diff(oldString, newString) {
					var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

					var callback = options.callback;
					if (typeof options === 'function') {
						callback = options;
						options = {};
					}
					this.options = options;

					var self = this;

					function done(value) {
						if (callback) {
							setTimeout(function () {
								callback(undefined, value);
							}, 0);
							return true;
						} else {
							return value;
						}
					}

					// Allow subclasses to massage the input prior to running
					oldString = this.castInput(oldString);
					newString = this.castInput(newString);

					oldString = this.removeEmpty(this.tokenize(oldString));
					newString = this.removeEmpty(this.tokenize(newString));

					var newLen = newString.length,
					    oldLen = oldString.length;
					var editLength = 1;
					var maxEditLength = newLen + oldLen;
					var bestPath = [{ newPos: -1, components: [] }];

					// Seed editLength = 0, i.e. the content starts with the same values
					var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);
					if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
						// Identity per the equality and tokenizer
						return done([{ value: newString.join(''), count: newString.length }]);
					}

					// Main worker method. checks all permutations of a given edit length for acceptance.
					function execEditLength() {
						for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
							var basePath = undefined;
							var addPath = bestPath[diagonalPath - 1],
							    removePath = bestPath[diagonalPath + 1],
							    _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;
							if (addPath) {
								// No one else is going to attempt to use this value, clear it
								bestPath[diagonalPath - 1] = undefined;
							}

							var canAdd = addPath && addPath.newPos + 1 < newLen,
							    canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;
							if (!canAdd && !canRemove) {
								// If this path is a terminal then prune
								bestPath[diagonalPath] = undefined;
								continue;
							}

							// Select the diagonal that we want to branch from. We select the prior
							// path whose position in the new string is the farthest from the origin
							// and does not pass the bounds of the diff graph
							if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
								basePath = clonePath(removePath);
								self.pushComponent(basePath.components, undefined, true);
							} else {
								basePath = addPath; // No need to clone, we've pulled it from the list
								basePath.newPos++;
								self.pushComponent(basePath.components, true, undefined);
							}

							_oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath);

							// If we have hit the end of both strings, then we are done
							if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
								return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
							} else {
								// Otherwise track this path as a potential candidate and continue.
								bestPath[diagonalPath] = basePath;
							}
						}

						editLength++;
					}

					// Performs the length of edit iteration. Is a bit fugly as this has to support the
					// sync and async mode which is never fun. Loops over execEditLength until a value
					// is produced.
					if (callback) {
						(function exec() {
							setTimeout(function () {
								// This should not happen, but we want to be safe.
								/* istanbul ignore next */
								if (editLength > maxEditLength) {
									return callback();
								}

								if (!execEditLength()) {
									exec();
								}
							}, 0);
						})();
					} else {
						while (editLength <= maxEditLength) {
							var ret = execEditLength();
							if (ret) {
								return ret;
							}
						}
					}
				},

				pushComponent: function pushComponent(components, added, removed) {
					var last = components[components.length - 1];
					if (last && last.added === added && last.removed === removed) {
						// We need to clone here as the component clone operation is just
						// as shallow array clone
						components[components.length - 1] = { count: last.count + 1, added: added, removed: removed };
					} else {
						components.push({ count: 1, added: added, removed: removed });
					}
				},
				extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
					var newLen = newString.length,
					    oldLen = oldString.length,
					    newPos = basePath.newPos,
					    oldPos = newPos - diagonalPath,
					    commonCount = 0;
					while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
						newPos++;
						oldPos++;
						commonCount++;
					}

					if (commonCount) {
						basePath.components.push({ count: commonCount });
					}

					basePath.newPos = newPos;
					return oldPos;
				},

				equals: function equals(left, right) {
					return left === right;
				},
				removeEmpty: function removeEmpty(array) {
					var ret = [];
					for (var i = 0; i < array.length; i++) {
						if (array[i]) {
							ret.push(array[i]);
						}
					}
					return ret;
				},
				castInput: function castInput(value) {
					return value;
				},
				tokenize: function tokenize(value) {
					return value.split('');
				}
			};

			function buildValues(diff, components, newString, oldString, useLongestToken) {
				var componentPos = 0,
				    componentLen = components.length,
				    newPos = 0,
				    oldPos = 0;

				for (; componentPos < componentLen; componentPos++) {
					var component = components[componentPos];
					if (!component.removed) {
						if (!component.added && useLongestToken) {
							var value = newString.slice(newPos, newPos + component.count);
							value = value.map(function (value, i) {
								var oldValue = oldString[oldPos + i];
								return oldValue.length > value.length ? oldValue : value;
							});

							component.value = value.join('');
						} else {
							component.value = newString.slice(newPos, newPos + component.count).join('');
						}
						newPos += component.count;

						// Common case
						if (!component.added) {
							oldPos += component.count;
						}
					} else {
						component.value = oldString.slice(oldPos, oldPos + component.count).join('');
						oldPos += component.count;

						// Reverse add and remove so removes are output first to match common convention
						// The diffing algorithm is tied to add then remove output and this is the simplest
						// route to get the desired output with minimal overhead.
						if (componentPos && components[componentPos - 1].added) {
							var tmp = components[componentPos - 1];
							components[componentPos - 1] = components[componentPos];
							components[componentPos] = tmp;
						}
					}
				}

				// Special case handle for when one terminal is ignored. For this case we merge the
				// terminal into the prior string and drop the change.
				var lastComponent = components[componentLen - 1];
				if ((lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
					components[componentLen - 2].value += lastComponent.value;
					components.pop();
				}

				return components;
			}

			function clonePath(path) {
				return { newPos: path.newPos, components: path.components.slice(0) };
			}
			module.exports = exports['default'];

			/***/
		},
		/* 2 */
		function (module, exports, __webpack_require__) {

			'use strict';

			exports.__esModule = true;
			exports.diffChars = diffChars;
			// istanbul ignore next

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { 'default': obj };
			}

			var _base = __webpack_require__(1);

			var _base2 = _interopRequireDefault(_base);

			var characterDiff = new _base2['default']();
			exports.characterDiff = characterDiff;

			function diffChars(oldStr, newStr, callback) {
				return characterDiff.diff(oldStr, newStr, callback);
			}

			/***/
		},
		/* 3 */
		function (module, exports, __webpack_require__) {

			'use strict';

			exports.__esModule = true;
			exports.diffWords = diffWords;
			exports.diffWordsWithSpace = diffWordsWithSpace;
			// istanbul ignore next

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { 'default': obj };
			}

			var _base = __webpack_require__(1);

			var _base2 = _interopRequireDefault(_base);

			var _utilParams = __webpack_require__(4);

			// Based on https://en.wikipedia.org/wiki/Latin_script_in_Unicode
			//
			// Ranges and exceptions:
			// Latin-1 Supplement, 0080–00FF
			//  - U+00D7  × Multiplication sign
			//  - U+00F7  ÷ Division sign
			// Latin Extended-A, 0100–017F
			// Latin Extended-B, 0180–024F
			// IPA Extensions, 0250–02AF
			// Spacing Modifier Letters, 02B0–02FF
			//  - U+02C7  ˇ &#711;  Caron
			//  - U+02D8  ˘ &#728;  Breve
			//  - U+02D9  ˙ &#729;  Dot Above
			//  - U+02DA  ˚ &#730;  Ring Above
			//  - U+02DB  ˛ &#731;  Ogonek
			//  - U+02DC  ˜ &#732;  Small Tilde
			//  - U+02DD  ˝ &#733;  Double Acute Accent
			// Latin Extended Additional, 1E00–1EFF
			var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;

			var reWhitespace = /\S/;

			var wordDiff = new _base2['default']();
			exports.wordDiff = wordDiff;
			wordDiff.equals = function (left, right) {
				return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
			};
			wordDiff.tokenize = function (value) {
				var tokens = value.split(/(\s+|\b)/);

				// Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.
				for (var i = 0; i < tokens.length - 1; i++) {
					// If we have an empty string in the next field and we have only word chars before and after, merge
					if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
						tokens[i] += tokens[i + 2];
						tokens.splice(i + 1, 2);
						i--;
					}
				}

				return tokens;
			};

			function diffWords(oldStr, newStr, callback) {
				var options = _utilParams.generateOptions(callback, { ignoreWhitespace: true });
				return wordDiff.diff(oldStr, newStr, options);
			}

			function diffWordsWithSpace(oldStr, newStr, callback) {
				return wordDiff.diff(oldStr, newStr, callback);
			}

			/***/
		},
		/* 4 */
		function (module, exports) {

			'use strict';

			exports.__esModule = true;
			exports.generateOptions = generateOptions;

			function generateOptions(options, defaults) {
				if (typeof options === 'function') {
					defaults.callback = options;
				} else if (options) {
					for (var _name in options) {
						/* istanbul ignore else */
						if (options.hasOwnProperty(_name)) {
							defaults[_name] = options[_name];
						}
					}
				}
				return defaults;
			}

			/***/
		},
		/* 5 */
		function (module, exports, __webpack_require__) {

			'use strict';

			exports.__esModule = true;
			exports.diffLines = diffLines;
			exports.diffTrimmedLines = diffTrimmedLines;
			// istanbul ignore next

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { 'default': obj };
			}

			var _base = __webpack_require__(1);

			var _base2 = _interopRequireDefault(_base);

			var _utilParams = __webpack_require__(4);

			var lineDiff = new _base2['default']();
			exports.lineDiff = lineDiff;
			lineDiff.tokenize = function (value) {
				var retLines = [],
				    linesAndNewlines = value.split(/(\n|\r\n)/);

				// Ignore the final empty token that occurs if the string ends with a new line
				if (!linesAndNewlines[linesAndNewlines.length - 1]) {
					linesAndNewlines.pop();
				}

				// Merge the content and line separators into single tokens
				for (var i = 0; i < linesAndNewlines.length; i++) {
					var line = linesAndNewlines[i];

					if (i % 2 && !this.options.newlineIsToken) {
						retLines[retLines.length - 1] += line;
					} else {
						if (this.options.ignoreWhitespace) {
							line = line.trim();
						}
						retLines.push(line);
					}
				}

				return retLines;
			};

			function diffLines(oldStr, newStr, callback) {
				return lineDiff.diff(oldStr, newStr, callback);
			}

			function diffTrimmedLines(oldStr, newStr, callback) {
				var options = _utilParams.generateOptions(callback, { ignoreWhitespace: true });
				return lineDiff.diff(oldStr, newStr, options);
			}

			/***/
		},
		/* 6 */
		function (module, exports, __webpack_require__) {

			'use strict';

			exports.__esModule = true;
			exports.diffSentences = diffSentences;
			// istanbul ignore next

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { 'default': obj };
			}

			var _base = __webpack_require__(1);

			var _base2 = _interopRequireDefault(_base);

			var sentenceDiff = new _base2['default']();
			exports.sentenceDiff = sentenceDiff;
			sentenceDiff.tokenize = function (value) {
				return value.split(/(\S.+?[.!?])(?=\s+|$)/);
			};

			function diffSentences(oldStr, newStr, callback) {
				return sentenceDiff.diff(oldStr, newStr, callback);
			}

			/***/
		},
		/* 7 */
		function (module, exports, __webpack_require__) {

			'use strict';

			exports.__esModule = true;
			exports.diffCss = diffCss;
			// istanbul ignore next

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { 'default': obj };
			}

			var _base = __webpack_require__(1);

			var _base2 = _interopRequireDefault(_base);

			var cssDiff = new _base2['default']();
			exports.cssDiff = cssDiff;
			cssDiff.tokenize = function (value) {
				return value.split(/([{}:;,]|\s+)/);
			};

			function diffCss(oldStr, newStr, callback) {
				return cssDiff.diff(oldStr, newStr, callback);
			}

			/***/
		},
		/* 8 */
		function (module, exports, __webpack_require__) {

			'use strict';

			exports.__esModule = true;
			exports.diffJson = diffJson;
			exports.canonicalize = canonicalize;
			// istanbul ignore next

			function _interopRequireDefault(obj) {
				return obj && obj.__esModule ? obj : { 'default': obj };
			}

			var _base = __webpack_require__(1);

			var _base2 = _interopRequireDefault(_base);

			var _line = __webpack_require__(5);

			var objectPrototypeToString = Object.prototype.toString;

			var jsonDiff = new _base2['default']();
			exports.jsonDiff = jsonDiff;
			// Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
			// dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:
			jsonDiff.useLongestToken = true;

			jsonDiff.tokenize = _line.lineDiff.tokenize;
			jsonDiff.castInput = function (value) {
				return typeof value === 'string' ? value : JSON.stringify(canonicalize(value), undefined, '  ');
			};
			jsonDiff.equals = function (left, right) {
				return _base2['default'].prototype.equals(left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'));
			};

			function diffJson(oldObj, newObj, callback) {
				return jsonDiff.diff(oldObj, newObj, callback);
			}

			// This function handles the presence of circular references by bailing out when encountering an
			// object that is already on the "stack" of items being processed.

			function canonicalize(obj, stack, replacementStack) {
				stack = stack || [];
				replacementStack = replacementStack || [];

				var i = undefined;

				for (i = 0; i < stack.length; i += 1) {
					if (stack[i] === obj) {
						return replacementStack[i];
					}
				}

				var canonicalizedObj = undefined;

				if ('[object Array]' === objectPrototypeToString.call(obj)) {
					stack.push(obj);
					canonicalizedObj = new Array(obj.length);
					replacementStack.push(canonicalizedObj);
					for (i = 0; i < obj.length; i += 1) {
						canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack);
					}
					stack.pop();
					replacementStack.pop();
				} else if (typeof obj === 'object' && obj !== null) {
					stack.push(obj);
					canonicalizedObj = {};
					replacementStack.push(canonicalizedObj);
					var sortedKeys = [],
					    key = undefined;
					for (key in obj) {
						/* istanbul ignore else */
						if (obj.hasOwnProperty(key)) {
							sortedKeys.push(key);
						}
					}
					sortedKeys.sort();
					for (i = 0; i < sortedKeys.length; i += 1) {
						key = sortedKeys[i];
						canonicalizedObj[key] = canonicalize(obj[key], stack, replacementStack);
					}
					stack.pop();
					replacementStack.pop();
				} else {
					canonicalizedObj = obj;
				}
				return canonicalizedObj;
			}

			/***/
		},
		/* 9 */
		function (module, exports, __webpack_require__) {

			'use strict';

			exports.__esModule = true;
			exports.applyPatch = applyPatch;
			exports.applyPatches = applyPatches;

			var _parse = __webpack_require__(10);

			function applyPatch(source, uniDiff) {
				var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

				if (typeof uniDiff === 'string') {
					uniDiff = _parse.parsePatch(uniDiff);
				}

				if (Array.isArray(uniDiff)) {
					if (uniDiff.length > 1) {
						throw new Error('applyPatch only works with a single input.');
					}

					uniDiff = uniDiff[0];
				}

				// Apply the diff to the input
				var lines = source.split('\n'),
				    hunks = uniDiff.hunks,
				    compareLine = options.compareLine || function (lineNumber, line, operation, patchContent) {
					return line === patchContent;
				},
				    errorCount = 0,
				    fuzzFactor = options.fuzzFactor || 0,
				    removeEOFNL = undefined,
				    addEOFNL = undefined;

				for (var i = 0; i < hunks.length; i++) {
					var hunk = hunks[i],
					    toPos = hunk.newStart - 1;

					// Sanity check the input string. Bail if we don't match.
					for (var j = 0; j < hunk.lines.length; j++) {
						var line = hunk.lines[j],
						    operation = line[0],
						    content = line.substr(1);
						if (operation === ' ' || operation === '-') {
							// Context sanity check
							if (!compareLine(toPos + 1, lines[toPos], operation, content)) {
								errorCount++;

								if (errorCount > fuzzFactor) {
									return false;
								}
							}
						}

						if (operation === ' ') {
							toPos++;
						} else if (operation === '-') {
							lines.splice(toPos, 1);
							/* istanbul ignore else */
						} else if (operation === '+') {
								lines.splice(toPos, 0, content);
								toPos++;
							} else if (operation === '\\') {
								var previousOperation = hunk.lines[j - 1] ? hunk.lines[j - 1][0] : null;
								if (previousOperation === '+') {
									removeEOFNL = true;
								} else if (previousOperation === '-') {
									addEOFNL = true;
								}
							}
					}
				}

				// Handle EOFNL insertion/removal
				if (removeEOFNL) {
					while (!lines[lines.length - 1]) {
						lines.pop();
					}
				} else if (addEOFNL) {
					lines.push('');
				}
				return lines.join('\n');
			}

			// Wrapper that supports multiple file patches via callbacks.

			function applyPatches(uniDiff, options) {
				if (typeof uniDiff === 'string') {
					uniDiff = _parse.parsePatch(uniDiff);
				}

				var currentIndex = 0;
				function processIndex() {
					var index = uniDiff[currentIndex++];
					if (!index) {
						options.complete();
					}

					options.loadFile(index, function (err, data) {
						if (err) {
							return options.complete(err);
						}

						var updatedContent = applyPatch(data, index, options);
						options.patched(index, updatedContent);

						setTimeout(processIndex, 0);
					});
				}
				processIndex();
			}

			/***/
		},
		/* 10 */
		function (module, exports) {

			'use strict';

			exports.__esModule = true;
			exports.parsePatch = parsePatch;

			function parsePatch(uniDiff) {
				var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

				var diffstr = uniDiff.split('\n'),
				    list = [],
				    i = 0;

				function parseIndex() {
					var index = {};
					list.push(index);

					// Ignore any leading junk
					while (i < diffstr.length) {
						if (/^Index:/.test(diffstr[i]) || /^@@/.test(diffstr[i])) {
							break;
						}
						i++;
					}

					var header = /^Index: (.*)/.exec(diffstr[i]);
					if (header) {
						index.index = header[1];
						i++;

						if (/^===/.test(diffstr[i])) {
							i++;
						}

						parseFileHeader(index);
						parseFileHeader(index);
					} else {
						// Ignore erant header components that might occur at the start of the file
						parseFileHeader({});
						parseFileHeader({});
					}

					index.hunks = [];

					while (i < diffstr.length) {
						if (/^Index:/.test(diffstr[i])) {
							break;
						} else if (/^@@/.test(diffstr[i])) {
							index.hunks.push(parseHunk());
						} else if (diffstr[i] && options.strict) {
							// Ignore unexpected content unless in strict mode
							throw new Error('Unknown line ' + (i + 1) + ' ' + JSON.stringify(diffstr[i]));
						} else {
							i++;
						}
					}
				}

				// Parses the --- and +++ headers, if none are found, no lines
				// are consumed.
				function parseFileHeader(index) {
					var fileHeader = /^(\-\-\-|\+\+\+)\s(\S+)\s?(.*)/.exec(diffstr[i]);
					if (fileHeader) {
						var keyPrefix = fileHeader[1] === '---' ? 'old' : 'new';
						index[keyPrefix + 'FileName'] = fileHeader[2];
						index[keyPrefix + 'Header'] = fileHeader[3];

						i++;
					}
				}

				// Parses a hunk
				// This assumes that we are at the start of a hunk.
				function parseHunk() {
					var chunkHeaderIndex = i,
					    chunkHeaderLine = diffstr[i++],
					    chunkHeader = chunkHeaderLine.split(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);

					var hunk = {
						oldStart: +chunkHeader[1],
						oldLines: +chunkHeader[2] || 1,
						newStart: +chunkHeader[3],
						newLines: +chunkHeader[4] || 1,
						lines: []
					};

					var addCount = 0,
					    removeCount = 0;
					for (; i < diffstr.length; i++) {
						var operation = diffstr[i][0];

						if (operation === '+' || operation === '-' || operation === ' ' || operation === '\\') {
							hunk.lines.push(diffstr[i]);

							if (operation === '+') {
								addCount++;
							} else if (operation === '-') {
								removeCount++;
							} else if (operation === ' ') {
								addCount++;
								removeCount++;
							}
						} else {
							break;
						}
					}

					// Handle the empty block count case
					if (!addCount && hunk.newLines === 1) {
						hunk.newLines = 0;
					}
					if (!removeCount && hunk.oldLines === 1) {
						hunk.oldLines = 0;
					}

					// Perform optional sanity checking
					if (options.strict) {
						if (addCount !== hunk.newLines) {
							throw new Error('Added line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
						}
						if (removeCount !== hunk.oldLines) {
							throw new Error('Removed line count did not match for hunk at line ' + (chunkHeaderIndex + 1));
						}
					}

					return hunk;
				}

				while (i < diffstr.length) {
					parseIndex();
				}

				return list;
			}

			/***/
		},
		/* 11 */
		function (module, exports, __webpack_require__) {

			'use strict';

			exports.__esModule = true;
			exports.structuredPatch = structuredPatch;
			exports.createTwoFilesPatch = createTwoFilesPatch;
			exports.createPatch = createPatch;
			// istanbul ignore next

			function _toConsumableArray(arr) {
				if (Array.isArray(arr)) {
					for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];return arr2;
				} else {
					return Array.from(arr);
				}
			}

			var _diffLine = __webpack_require__(5);

			function structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
				if (!options) {
					options = { context: 4 };
				}

				var diff = _diffLine.diffLines(oldStr, newStr);
				diff.push({ value: '', lines: [] }); // Append an empty value to make cleanup easier

				function contextLines(lines) {
					return lines.map(function (entry) {
						return ' ' + entry;
					});
				}

				var hunks = [];
				var oldRangeStart = 0,
				    newRangeStart = 0,
				    curRange = [],
				    oldLine = 1,
				    newLine = 1;

				var _loop = function _loop(i) {
					var current = diff[i],
					    lines = current.lines || current.value.replace(/\n$/, '').split('\n');
					current.lines = lines;

					if (current.added || current.removed) {
						// istanbul ignore next

						var _curRange;

						// If we have previous context, start with that
						if (!oldRangeStart) {
							var prev = diff[i - 1];
							oldRangeStart = oldLine;
							newRangeStart = newLine;

							if (prev) {
								curRange = options.context > 0 ? contextLines(prev.lines.slice(-options.context)) : [];
								oldRangeStart -= curRange.length;
								newRangeStart -= curRange.length;
							}
						}

						// Output our changes
						(_curRange = curRange).push.apply(_curRange, _toConsumableArray(lines.map(function (entry) {
							return (current.added ? '+' : '-') + entry;
						})));

						// Track the updated file position
						if (current.added) {
							newLine += lines.length;
						} else {
							oldLine += lines.length;
						}
					} else {
						// Identical context lines. Track line changes
						if (oldRangeStart) {
							// Close out any changes that have been output (or join overlapping)
							if (lines.length <= options.context * 2 && i < diff.length - 2) {
								// istanbul ignore next

								var _curRange2;

								// Overlapping
								(_curRange2 = curRange).push.apply(_curRange2, _toConsumableArray(contextLines(lines)));
							} else {
								// istanbul ignore next

								var _curRange3;

								// end the range and output
								var contextSize = Math.min(lines.length, options.context);
								(_curRange3 = curRange).push.apply(_curRange3, _toConsumableArray(contextLines(lines.slice(0, contextSize))));

								var hunk = {
									oldStart: oldRangeStart,
									oldLines: oldLine - oldRangeStart + contextSize,
									newStart: newRangeStart,
									newLines: newLine - newRangeStart + contextSize,
									lines: curRange
								};
								if (i >= diff.length - 2 && lines.length <= options.context) {
									// EOF is inside this hunk
									var oldEOFNewline = /\n$/.test(oldStr);
									var newEOFNewline = /\n$/.test(newStr);
									if (lines.length == 0 && !oldEOFNewline) {
										// special case: old has no eol and no trailing context; no-nl can end up before adds
										curRange.splice(hunk.oldLines, 0, '\\ No newline at end of file');
									} else if (!oldEOFNewline || !newEOFNewline) {
										curRange.push('\\ No newline at end of file');
									}
								}
								hunks.push(hunk);

								oldRangeStart = 0;
								newRangeStart = 0;
								curRange = [];
							}
						}
						oldLine += lines.length;
						newLine += lines.length;
					}
				};

				for (var i = 0; i < diff.length; i++) {
					_loop(i);
				}

				return {
					oldFileName: oldFileName, newFileName: newFileName,
					oldHeader: oldHeader, newHeader: newHeader,
					hunks: hunks
				};
			}

			function createTwoFilesPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options) {
				var diff = structuredPatch(oldFileName, newFileName, oldStr, newStr, oldHeader, newHeader, options);

				var ret = [];
				if (oldFileName == newFileName) {
					ret.push('Index: ' + oldFileName);
				}
				ret.push('===================================================================');
				ret.push('--- ' + diff.oldFileName + (typeof diff.oldHeader === 'undefined' ? '' : '\t' + diff.oldHeader));
				ret.push('+++ ' + diff.newFileName + (typeof diff.newHeader === 'undefined' ? '' : '\t' + diff.newHeader));

				for (var i = 0; i < diff.hunks.length; i++) {
					var hunk = diff.hunks[i];
					ret.push('@@ -' + hunk.oldStart + ',' + hunk.oldLines + ' +' + hunk.newStart + ',' + hunk.newLines + ' @@');
					ret.push.apply(ret, hunk.lines);
				}

				return ret.join('\n') + '\n';
			}

			function createPatch(fileName, oldStr, newStr, oldHeader, newHeader, options) {
				return createTwoFilesPatch(fileName, fileName, oldStr, newStr, oldHeader, newHeader, options);
			}

			/***/
		},
		/* 12 */
		function (module, exports) {

			// See: http://code.google.com/p/google-diff-match-patch/wiki/API
			"use strict";

			exports.__esModule = true;
			exports.convertChangesToDMP = convertChangesToDMP;

			function convertChangesToDMP(changes) {
				var ret = [],
				    change = undefined,
				    operation = undefined;
				for (var i = 0; i < changes.length; i++) {
					change = changes[i];
					if (change.added) {
						operation = 1;
					} else if (change.removed) {
						operation = -1;
					} else {
						operation = 0;
					}

					ret.push([operation, change.value]);
				}
				return ret;
			}

			/***/
		},
		/* 13 */
		function (module, exports) {

			'use strict';

			exports.__esModule = true;
			exports.convertChangesToXML = convertChangesToXML;

			function convertChangesToXML(changes) {
				var ret = [];
				for (var i = 0; i < changes.length; i++) {
					var change = changes[i];
					if (change.added) {
						ret.push('<ins>');
					} else if (change.removed) {
						ret.push('<del>');
					}

					ret.push(escapeHTML(change.value));

					if (change.added) {
						ret.push('</ins>');
					} else if (change.removed) {
						ret.push('</del>');
					}
				}
				return ret.join('');
			}

			function escapeHTML(s) {
				var n = s;
				n = n.replace(/&/g, '&amp;');
				n = n.replace(/</g, '&lt;');
				n = n.replace(/>/g, '&gt;');
				n = n.replace(/"/g, '&quot;');

				return n;
			}

			/***/
		}
		/******/])
	);
});
;
(function () {

	var button = document.querySelector('button');
	var first = document.querySelector('.js-first');
	var second = document.querySelector('.js-second');
	var headers = document.querySelector('.js-headers');
	var body = document.querySelector('.js-body');

	var animateIntro = function animateIntro() {
		var elems = document.querySelectorAll('.is-animated');
		[].concat(_toConsumableArray2(elems)).forEach(function (el) {
			return el.classList.remove('is-animated');
		});
		first.classList.add('inputs-url--red');
		second.classList.add('inputs-url--green');
	};

	var prettyPrint = function prettyPrint(response) {
		try {
			return JSON.stringify(JSON.parse(response), null, '\t');
		} catch (e) {
			return response;
		}
	};

	var request = function request(url, cb) {
		var xhr = new XMLHttpRequest();
		xhr.open('GET', url, true);
		xhr.onload = function (evt) {
			animateIntro();
			cb(null, xhr.response);
		};
		xhr.onerror = function (evt) {
			throw new Error(xhr.statusText);
		};
		xhr.send();
	};

	var compare = function compare(first, second, element) {
		var diff = JsDiff.diffLines(first, second);
		var frag = document.createDocumentFragment();

		diff.forEach(function (part) {
			var classes = ['diff-line'];
			if (part.added) classes.push('diff-line--green');else if (part.removed) classes.push('diff-line--red');

			var span = document.createElement('span');
			classes.forEach(function (c) {
				return span.classList.add(c);
			});

			span.appendChild(document.createTextNode(part.value));
			frag.appendChild(span);
		});

		element.appendChild(frag);
	};

	var start = function start() {
		var firstURL = first.value;
		var secondURL = second.value;
		var url = '/proxy?url1=' + firstURL + '&url2=' + secondURL;

		headers.innerHTML = '';
		body.innerHTML = '';

		request(url, function (err, res) {
			var data = JSON.parse(res);
			compare(prettyPrint(data.first.headers), prettyPrint(data.second.headers), headers);
			compare(prettyPrint(data.first.body), prettyPrint(data.second.body), body);
		});
	};

	button.addEventListener('click', start);
	first.value = 'http://reqr.es/api/users?page=1';
	second.value = 'http://reqr.es/api/users?page=3';
})();
/***/ /***/ /***/ /***/ /***/ /***/ /***/ /***/ /***/ /***/ /***/ /***/ /***/ /***/