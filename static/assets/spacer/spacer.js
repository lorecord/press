(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
    'use strict';
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _core = require('./core/core.js');
    
    var _core2 = _interopRequireDefault(_core);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    var IGNORED_TAGS = /^(script|link|style|code|meta)$/i;
    var BLOCK_TAGS = /^(div|p|h1|h2|h3|h4|h5|h6|blockqoute|pre|textarea|nav|header|main|footer|section|sidbar|aside|table|li|ul|ol|dl)$/i;
    var SPACING_TAGS = /^(br|hr|img|video|audio|sup|sub|a|code|span|strong|del|i)$/i;
    
    _core2.default.config({
        tagAttrMap: {
            '*': ['title'],
            'optgroup': ['label'],
            'input': ['placeholder'],
            'img': ['alt']
        }
    });
    
    var BrowserSpacer = function (_Spacer) {
        _inherits(BrowserSpacer, _Spacer);
    
        function BrowserSpacer(options) {
            _classCallCheck(this, BrowserSpacer);
    
            var _this = _possibleConstructorReturn(this, (BrowserSpacer.__proto__ || Object.getPrototypeOf(BrowserSpacer)).call(this, options));
    
            if (options.wrapper) {
                _this.options.spacingContent = _this.options.spacingContent.replace(' ', '&nbsp;');
            }
            return _this;
        }
    
        _createClass(BrowserSpacer, [{
            key: 'spacePage',
            value: function spacePage(elements, options, observe) {
                var _this2 = this;
    
                elements = typeof elements === 'string' ? document.querySelectorAll(elements) : elements || document;
                options = this.resolveOptions(options);
                if (options.wrapper) {
                    options.spacingContent = options.spacingContent.replace(' ', '&nbsp;');
                }
                if (!elements.forEach) {
                    elements = [elements];
                }
                elements.forEach(function (e) {
                    spaceNode(_this2, e, options);
                    if (observe) {
                        var observer = new MutationObserver(function (mutations, observer) {
                            observer.disconnect();
                            mutations.forEach(function (m) {
                                if (m.type === 'childList') {
                                    _this2.spacePage(m.addedNodes, options, false);
                                }
                            });
                            _connect();
                        });
                        var _connect = function _connect() {
                            observer.observe(e, {
                                characterData: true,
                                childList: true,
                                attributes: true,
                                subtree: true,
                                attributeOldValue: true,
                                characterDataOldValue: true
                            });
                        };
                        _connect();
                    }
                });
            }
        }]);
    
        return BrowserSpacer;
    }(_core2.default);
    
    function spaceNode(spacer, node, options) {
        if (node.tagName && IGNORED_TAGS.test(node.tagName) || node.nodeType === Node.COMMENT_NODE) {
            return;
        }
        var optionsNoWrapper = Object.assign({}, options, { wrapper: false });
        var optionsNoWrapperNoHTMLEntity = Object.assign({}, optionsNoWrapper, {
            spacingContent: options.spacingContent.replace('&nbsp;', ' ')
        });
        var optionsEffect = options;
        if (node.parentNode && node.parentNode.tagName === 'TITLE') {
            optionsEffect = optionsNoWrapperNoHTMLEntity;
        }
    
        spacer.custom(optionsEffect, function (step, opts) {
            var current = _core2.default.createSnippet(function () {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.data;
                } else {
                    return node.textContent;
                }
            }());
            if (current && current.text) {
                step({
                    current: current
                });
            }
        }, function (c, opts) {
            if(node.getAttribute && (node.getAttribute('data-spacer-ignore') || node.getAttribute('data-spacer') === 'ignore')){
                return;
            }
            if (node.previousSibling && (!node.previousSibling.tagName || !BLOCK_TAGS.test(node.previousSibling.tagName) && !SPACING_TAGS.test(node.previousSibling.tagName)) && (!node.tagName || !BLOCK_TAGS.test(node.tagName) && !SPACING_TAGS.test(node.tagName))) {
                return _core2.default.createSnippet(node.previousSibling.nodeType === Node.TEXT_NODE ? node.previousSibling.data : node.previousSibling.textContent);
            }
        }, function (c) {
            return null;
        }, function (opts, c, add, s, append) {
            if (add) {
                if (opts.wrapper) {
                    insertBefore(createNode(opts.wrapper.open + s + opts.wrapper.close), node);
                } else {
                    insertBefore(document.createTextNode(append), node);
                }
            }
        });
    
        if (node.nodeType === Node.TEXT_NODE) {
            if (optionsEffect.wrapper) {
                spacer.custom(optionsEffect, function (step, opts) {
                    return spacer.split(node.data, opts).reduce(function (acc, cur, i, src) {
                        return step({
                            current: cur,
                            acc: acc,
                            i: i,
                            src: src
                        });
                    }, '');
                }, function (c) {
                    return c.i == 0 ? null : c.src[c.i - 1];
                }, function (c) {
                    return null;
                }, function (opts, c, add, s, append) {
                    if (add) {
                        insertBefore(createNode('' + opts.wrapper.open + s + opts.wrapper.close), node);
                    }
                    if (append) {
                        insertBefore(document.createTextNode(append), node);
                    }
                });
                node.remove();
            } else {
                if (node.parentNode && node.parentNode.tagName === 'TITLE') {
                    spaceAttribute(spacer, node, 'data', optionsNoWrapperNoHTMLEntity);
                } else {
                    spaceAttribute(spacer, node, 'data', optionsNoWrapper);
                }
            }
        } else {
            // tag attr map
            if (node.tagName) {
                for (var k in optionsEffect.tagAttrMap) {
                    var attrs = optionsEffect.tagAttrMap[k];
                    if (k === '*' || k === node.tagName.toLowerCase()) {
                        attrs.forEach(function (a) {
                            return spaceAttribute(spacer, node, a, optionsNoWrapperNoHTMLEntity);
                        });
                    }
                }
            }
        }
    
        if (node.childNodes) {
            var staticNodes = [];
            node.childNodes.forEach(function (child) {
                staticNodes.push(child);
            });
            staticNodes.forEach(function (child) {
                spaceNode(spacer, child, options);
            });
        }
    }
    
    function createNode(html) {
        var div = document.createElement('div');
        div.innerHTML = html;
        return div.firstChild;
    }
    
    function insertBefore(newNode, node) {
        if (node.tagName !== 'HTML' && node.parentNode && node.parentNode.tagName !== 'HTML') {
            node.parentNode.insertBefore(newNode, node);
        }
    }
    
    function spaceAttribute(spacer, node, attr, options) {
        if (node[attr]) {
            var result = spacer.space(node[attr], options);
            if (node[attr] !== result) {
                node[attr] = result;
            }
        }
    }
    
    exports.default = BrowserSpacer;
    
    },{"./core/core.js":2}],2:[function(require,module,exports){
    'use strict';
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /*
                                                                                                                                                                                                                                                                                   *
                                                                                                                                                                                                                                                                                   */
    
    
    var _snippet = require('./snippet.js');
    
    var _snippet2 = _interopRequireDefault(_snippet);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    var LOOKBEHIND_SUPPORTED = function () {
        try {
            new RegExp('(?<=exp)');
            return true;
        } catch (e) {
            return false;
        }
    }();
    
    /*
     * \u2E80-\u2EFF    CJK 部首
     * \u2F00-\u2FDF    康熙字典部首
     * \u3000-\u303F    CJK 符号和标点
     * \u31C0-\u31EF    CJK 笔画
     * \u3200-\u32FF    封闭式 CJK 文字和月份
     * \u3300-\u33FF    CJK 兼容
     * \u3400-\u4DBF    CJK 统一表意符号扩展 A
     * \u4DC0-\u4DFF    易经六十四卦符号
     * \u4E00-\u9FBF    CJK 统一表意符号
     * \uF900-\uFAFF    CJK 兼容象形文字
     * \uFE30-\uFE4F    CJK 兼容形式
     * \uFF00-\uFFEF    全角ASCII、全角标点
     *
     * https://www.unicode.org/Public/5.0.0/ucd/Unihan.html
     */
    var CJK = '\u2E80-\u2FDF\u3040-\uFE4F';
    var SYMBOLS = '@&=_\$%\^\*\-+';
    var LATIN = 'A-Za-z0-9\xC0-\xFF\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF';
    var ONE_OR_MORE_SPACE = '[ ]+';
    var ANY_SPACE = '[ ]*';
    var SYMBOLS_NEED_SPACE_FOLLOWED = '[\.:,?!]';
    var ONE_AJK = '[' + CJK + ']';
    var ONE_LATIN = '[' + LATIN + ']';
    var ONE_LATIN_LIKE = '[' + LATIN + '%]';
    var SPLIT_AJK_SPACE_LATIN_LIKE = buildSplit('' + ONE_LATIN_LIKE, '' + ANY_SPACE, '' + ONE_AJK);
    var SPLIT_LATIN_LIKE_SPACE_AJK = buildSplit('' + ONE_AJK, '' + ANY_SPACE, '' + ONE_LATIN_LIKE);
    var SPLIT_SPACE = SPLIT_AJK_SPACE_LATIN_LIKE + '|' + SPLIT_LATIN_LIKE_SPACE_AJK;
    var SPLIT_SYMBOLS_NEED_SPACE_FOLLOWED = buildSplit('' + SYMBOLS_NEED_SPACE_FOLLOWED, '', ONE_AJK + '|' + ONE_LATIN);
    var SPLIT_AJK_LATIN_LIKE = buildSplit('' + ONE_LATIN_LIKE, '', '' + ONE_AJK);
    var SPLIT_LATIN_LIKE_AJK = buildSplit('' + ONE_AJK, '', '' + ONE_LATIN_LIKE);
    var REGEXP_SPACES = new RegExp('^' + ONE_OR_MORE_SPACE + '$');
    var REGEXP_ANY_CJK = new RegExp('' + ONE_AJK);
    var REGEXP_ENDS_WITH_SYMBOLS_NEED_SPACE_FOLLOWED = new RegExp(SYMBOLS_NEED_SPACE_FOLLOWED + '$');
    var REGEXP_STARTS_WITH_SYMBOLS_NEED_SPACE_FOLLOWED = new RegExp('^' + SYMBOLS_NEED_SPACE_FOLLOWED);
    var REGEXP_ENDS_WITH_CJK_AND_SPACE = new RegExp('' + ONE_AJK + ONE_OR_MORE_SPACE + '$');
    var REGEXP_ENDS_WITH_LATIN_AND_SPACE = new RegExp('' + ONE_LATIN_LIKE + ONE_OR_MORE_SPACE + '$');
    var REGEXP_ENDS_WITH_ANY_SPACE = new RegExp(ANY_SPACE + '$');
    var REGEXP_ENDS_WITH_CJK = new RegExp(ONE_AJK + '$');
    var REGEXP_ENDS_WITH_LATIN = new RegExp(ONE_LATIN_LIKE + '$');
    var REGEXP_STARTS_WITH_CJK = new RegExp('^' + ONE_AJK);
    var REGEXP_STARTS_WITH_LATIN = new RegExp('^' + ONE_LATIN_LIKE);
    var REGEXP_SPLIT_END_SPACE = new RegExp('(' + ANY_SPACE + ')$');
    var REGEXP_SPLIT_DEFAULT = new RegExp('(' + SPLIT_AJK_LATIN_LIKE + '|' + SPLIT_LATIN_LIKE_AJK + '|' + SPLIT_SYMBOLS_NEED_SPACE_FOLLOWED + ')', 'g');
    var REGEXP_SPLIT_SPACE = new RegExp('(' + SPLIT_SPACE + '|' + SPLIT_SYMBOLS_NEED_SPACE_FOLLOWED + ')', 'g');
    
    function wrapSplit(exp) {
        return LOOKBEHIND_SUPPORTED ? exp : format.call('({0})', exp);
    }
    
    function buildSplit(lookbehind, exp, lookahead) {
        return format.call(LOOKBEHIND_SUPPORTED ? '(?<={0}){1}(?={2})' : '{0}{1}(?={2})', lookbehind, exp, lookahead);
    }
    
    function format() {
        var result = this;
    
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }
    
        if (args.length == 0) {
            return result;
        }
        var data = args.length == 1 && _typeof(args[1]) === 'object' ? args[1] : args;
        for (var key in data) {
            if (data[key] !== undefined) {
                result = result.replaceAll('\{' + key + '\}', data[key]);
            }
        }
        return result;
    }
    
    var DEFAULT_OPTIONS = {
        spacingContent: ' '
    };
    
    var defaultOptions = {};
    
    var Spacer = function () {
        function Spacer(options) {
            _classCallCheck(this, Spacer);
    
            this.options = handleOptions(options);
        }
    
        _createClass(Spacer, [{
            key: 'space',
            value: function space(text, options) {
                var _this = this;
    
                return this.custom(options, function (step, opts) {
                    return _this.split(text, opts).reduce(function (acc, cur, i, src) {
                        return step({
                            current: cur,
                            acc: acc,
                            i: i,
                            src: src
                        });
                    }, '');
                }, function (c) {
                    return c.i == 0 ? null : c.src[c.i - 1];
                }, function (c) {
                    return null;
                }, function (opts, c, add, s, append) {
                    if (add) {
                        if (opts.wrapper) {
                            s = '' + opts.wrapper.open + s + opts.wrapper.close;
                        }
                        return '' + c.acc + s + append;
                    }
                    return '' + c.acc + append;
                });
            }
        }, {
            key: 'custom',
            value: function custom(options, prepare, prevSolver, nextSolver, splicer) {
                options = this.resolveOptions(options);
                return prepare(function (context) {
                    var cur = context.current;
                    var spacingContent = options.spacingContent;
                    var append = '';
                    var addSpace = false;
    
                    if (Spacer.isSpaces(cur)) {
                        addSpace = true;
                        if (!options.forceUnifiedSpacing && options.keepOriginalSpace) {
                            spacingContent = cur.text;
                        }
                    } else {
                        append = cur.text;
                        var prev = prevSolver(context, options);
                        if (prev) {
                            if (Spacer.endsWithSymbolsNeedSpaceFollowed(prev)) {
                                if (prev.is(/\.$/) && cur.is(/^\d+/) || prev.is(/:$/) && cur.is(/^\d+/)|| prev.is(/.$/) && cur.is(/^[a-z]+/)) {
                                    addSpace = false;
                                } else {
                                    addSpace = true;
                                }
                            } else if (Spacer.endsWithCJK(prev) && Spacer.startsWithLatin(cur) || Spacer.endsWithLatin(prev) && Spacer.startsWithCJK(cur)) {
                                // between CJK and Latin-like(English letters, numbers, etc.)
                                addSpace = true;
                            }
                        }
                    }
                    return splicer(options, context, addSpace, spacingContent, append);
                }, options);
            }
    
            /**
             * Split to Snippet[]
             * @param text
             * @param options
             * @returns {Snippet[]}
             */
    
        }, {
            key: 'split',
            value: function split(text, options) {
                options = this.resolveOptions(options);
                if (typeof text === 'string') {
                    var pattern = options.handleOriginalSpace ? REGEXP_SPLIT_SPACE : REGEXP_SPLIT_DEFAULT;
                    var arr = text.split(pattern).filter(function (cur) {
                        return cur !== '' && cur !== undefined;
                    }).map(function (cur, i, src) {
                        return new _snippet2.default(cur);
                    });
                    if (arr.length > 1 && !LOOKBEHIND_SUPPORTED) {
                        arr = arr.flatMap(function (cur, i, src) {
                            // 'Spacer 间隔器'=>['Space', 'r ', '间隔器']=>['Space','r',' ', '', '间隔器']
                            if (cur.is(REGEXP_ENDS_WITH_ANY_SPACE)) {
                                return cur.text.split(REGEXP_SPLIT_END_SPACE).map(function (cur) {
                                    return new _snippet2.default(cur);
                                });
                            }
                            return cur;
                        });
                        var result = [];
                        arr.forEach(function (cur, i, src) {
                            // 'Spacer间隔器'=>['Space', 'r', '间隔器']=>['Spacer', '间隔器']
                            if (cur.text.length == 1 && i > 0 && !cur.is(/^[ ]*$/)) {
                                console.log('cur.text3', cur.text);
                                var prev = src[i - 1];
                                if (!Spacer.endsWithCJK(prev) && !Spacer.startsWithCJK(cur) || !Spacer.endsWithLatin(prev) && !Spacer.startsWithLatin(cur)) {
                                    result[result.length - 1] = new _snippet2.default(result[result.length - 1] + cur);
                                    return;
                                }
                            }
                            result.push(cur);
                        });
                        arr = result;
                    }
                    return arr;
                }
                return [new _snippet2.default(text)];
            }
        }, {
            key: 'resolveOptions',
            value: function resolveOptions(options) {
                return options ? Object.assign({}, this.options, wrapOptions(options)) : this.options;
            }
        }], [{
            key: 'config',
            value: function config(options) {
                options = wrapOptions(options);
                Object.assign(defaultOptions, DEFAULT_OPTIONS, options);
            }
        }, {
            key: 'endsWithCJKAndSpacing',
            value: function endsWithCJKAndSpacing(text) {
                return test(REGEXP_ENDS_WITH_CJK_AND_SPACE, text);
            }
        }, {
            key: 'endsWithCJK',
            value: function endsWithCJK(text) {
                return test(REGEXP_ENDS_WITH_CJK, text);
            }
        }, {
            key: 'endsWithLatin',
            value: function endsWithLatin(text) {
                return test(REGEXP_ENDS_WITH_LATIN, text);
            }
        }, {
            key: 'startsWithCJK',
            value: function startsWithCJK(text) {
                return test(REGEXP_STARTS_WITH_CJK, text);
            }
        }, {
            key: 'startsWithLatin',
            value: function startsWithLatin(text) {
                return test(REGEXP_STARTS_WITH_LATIN, text);
            }
        }, {
            key: 'endsWithLatinAndSpacing',
            value: function endsWithLatinAndSpacing(text) {
                return test(REGEXP_ENDS_WITH_LATIN_AND_SPACE, text);
            }
        }, {
            key: 'endsWithSymbolsNeedSpaceFollowed',
            value: function endsWithSymbolsNeedSpaceFollowed(text) {
                return test(REGEXP_ENDS_WITH_SYMBOLS_NEED_SPACE_FOLLOWED, text);
            }
        }, {
            key: 'startsWithSymbolsNeedSpaceFollowed',
            value: function startsWithSymbolsNeedSpaceFollowed(text) {
                return test(REGEXP_STARTS_WITH_SYMBOLS_NEED_SPACE_FOLLOWED, text);
            }
        }, {
            key: 'isSpaces',
            value: function isSpaces(text) {
                return test(REGEXP_SPACES, text);
            }
        }, {
            key: 'createSnippet',
            value: function createSnippet(text) {
                return new _snippet2.default(text);
            }
        }]);
    
        return Spacer;
    }();
    
    function test(regexp, text) {
        return text instanceof _snippet2.default ? text.is(regexp) : regexp.test(text);
    }
    
    function wrapOptions(options) {
        return typeof options === 'string' ? { spacingContent: options } : options;
    }
    
    function handleOptions(options) {
        options = wrapOptions(options);
        return Object.assign({}, DEFAULT_OPTIONS, defaultOptions, options);
    }
    
    exports.default = Spacer;
    
    },{"./snippet.js":3}],3:[function(require,module,exports){
    'use strict';
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    var TEST_CACHE = Symbol('testCache');
    
    var Snippet = function () {
        function Snippet(text) {
            _classCallCheck(this, Snippet);
    
            this.text = text;
            this[TEST_CACHE] = {};
        }
    
        _createClass(Snippet, [{
            key: 'is',
            value: function is(regexp) {
                var cache = this[TEST_CACHE][regexp];
                return cache === undefined ? this[TEST_CACHE][regexp] = regexp.test(this.text) : cache;
            }
        }, {
            key: 'toString',
            value: function toString() {
                return this.text;
            }
        }]);
    
        return Snippet;
    }();
    
    exports.default = Snippet;
    
    },{}],4:[function(require,module,exports){
    'use strict';
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _browser = require('./browser.js');
    
    var _browser2 = _interopRequireDefault(_browser);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    // Add support for AMD (Asynchronous Module Definition) libraries such as require.js.
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return {
                Spacer: _browser2.default
            };
        });
    }
    //Add support form CommonJS libraries such as browserify.
    if (typeof exports !== 'undefined') {
        exports.Spacer = _browser2.default;
    }
    //Define globally in case AMD is not available or unused
    if (typeof window !== 'undefined') {
        window.Spacer = _browser2.default;
    }
    
    exports.default = _browser2.default;
    
    },{"./browser.js":1}]},{},[4])
