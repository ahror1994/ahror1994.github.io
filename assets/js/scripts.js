"use strict";

/*! jQuery UI - v1.12.1 - 2017-08-08
* http://jqueryui.com
* Includes: widget.js, position.js, form-reset-mixin.js, keycode.js, labels.js, unique-id.js, widgets/accordion.js, widgets/menu.js, widgets/mouse.js, widgets/selectmenu.js, widgets/slider.js
* Copyright jQuery Foundation and other contributors; Licensed MIT */

(function (factory) {
	if (typeof define === "function" && define.amd) {

		// AMD. Register as an anonymous module.
		define(["jquery"], factory);
	} else {

		// Browser globals
		factory(jQuery);
	}
})(function ($) {

	$.ui = $.ui || {};

	var version = $.ui.version = "1.12.1";

	/*!
  * jQuery UI Widget 1.12.1
  * http://jqueryui.com
  *
  * Copyright jQuery Foundation and other contributors
  * Released under the MIT license.
  * http://jquery.org/license
  */

	//>>label: Widget
	//>>group: Core
	//>>description: Provides a factory for creating stateful widgets with a common API.
	//>>docs: http://api.jqueryui.com/jQuery.widget/
	//>>demos: http://jqueryui.com/widget/


	var widgetUuid = 0;
	var widgetSlice = Array.prototype.slice;

	$.cleanData = function (orig) {
		return function (elems) {
			var events, elem, i;
			for (i = 0; (elem = elems[i]) != null; i++) {
				try {

					// Only trigger remove when necessary to save time
					events = $._data(elem, "events");
					if (events && events.remove) {
						$(elem).triggerHandler("remove");
					}

					// Http://bugs.jquery.com/ticket/8235
				} catch (e) {}
			}
			orig(elems);
		};
	}($.cleanData);

	$.widget = function (name, base, prototype) {
		var existingConstructor, constructor, basePrototype;

		// ProxiedPrototype allows the provided prototype to remain unmodified
		// so that it can be used as a mixin for multiple widgets (#8876)
		var proxiedPrototype = {};

		var namespace = name.split(".")[0];
		name = name.split(".")[1];
		var fullName = namespace + "-" + name;

		if (!prototype) {
			prototype = base;
			base = $.Widget;
		}

		if ($.isArray(prototype)) {
			prototype = $.extend.apply(null, [{}].concat(prototype));
		}

		// Create selector for plugin
		$.expr[":"][fullName.toLowerCase()] = function (elem) {
			return !!$.data(elem, fullName);
		};

		$[namespace] = $[namespace] || {};
		existingConstructor = $[namespace][name];
		constructor = $[namespace][name] = function (options, element) {

			// Allow instantiation without "new" keyword
			if (!this._createWidget) {
				return new constructor(options, element);
			}

			// Allow instantiation without initializing for simple inheritance
			// must use "new" keyword (the code above always passes args)
			if (arguments.length) {
				this._createWidget(options, element);
			}
		};

		// Extend with the existing constructor to carry over any static properties
		$.extend(constructor, existingConstructor, {
			version: prototype.version,

			// Copy the object used to create the prototype in case we need to
			// redefine the widget later
			_proto: $.extend({}, prototype),

			// Track widgets that inherit from this widget in case this widget is
			// redefined after a widget inherits from it
			_childConstructors: []
		});

		basePrototype = new base();

		// We need to make the options hash a property directly on the new instance
		// otherwise we'll modify the options hash on the prototype that we're
		// inheriting from
		basePrototype.options = $.widget.extend({}, basePrototype.options);
		$.each(prototype, function (prop, value) {
			if (!$.isFunction(value)) {
				proxiedPrototype[prop] = value;
				return;
			}
			proxiedPrototype[prop] = function () {
				function _super() {
					return base.prototype[prop].apply(this, arguments);
				}

				function _superApply(args) {
					return base.prototype[prop].apply(this, args);
				}

				return function () {
					var __super = this._super;
					var __superApply = this._superApply;
					var returnValue;

					this._super = _super;
					this._superApply = _superApply;

					returnValue = value.apply(this, arguments);

					this._super = __super;
					this._superApply = __superApply;

					return returnValue;
				};
			}();
		});
		constructor.prototype = $.widget.extend(basePrototype, {

			// TODO: remove support for widgetEventPrefix
			// always use the name + a colon as the prefix, e.g., draggable:start
			// don't prefix for widgets that aren't DOM-based
			widgetEventPrefix: existingConstructor ? basePrototype.widgetEventPrefix || name : name
		}, proxiedPrototype, {
			constructor: constructor,
			namespace: namespace,
			widgetName: name,
			widgetFullName: fullName
		});

		// If this widget is being redefined then we need to find all widgets that
		// are inheriting from it and redefine all of them so that they inherit from
		// the new version of this widget. We're essentially trying to replace one
		// level in the prototype chain.
		if (existingConstructor) {
			$.each(existingConstructor._childConstructors, function (i, child) {
				var childPrototype = child.prototype;

				// Redefine the child widget using the same prototype that was
				// originally used, but inherit from the new version of the base
				$.widget(childPrototype.namespace + "." + childPrototype.widgetName, constructor, child._proto);
			});

			// Remove the list of existing child constructors from the old constructor
			// so the old child constructors can be garbage collected
			delete existingConstructor._childConstructors;
		} else {
			base._childConstructors.push(constructor);
		}

		$.widget.bridge(name, constructor);

		return constructor;
	};

	$.widget.extend = function (target) {
		var input = widgetSlice.call(arguments, 1);
		var inputIndex = 0;
		var inputLength = input.length;
		var key;
		var value;

		for (; inputIndex < inputLength; inputIndex++) {
			for (key in input[inputIndex]) {
				value = input[inputIndex][key];
				if (input[inputIndex].hasOwnProperty(key) && value !== undefined) {

					// Clone objects
					if ($.isPlainObject(value)) {
						target[key] = $.isPlainObject(target[key]) ? $.widget.extend({}, target[key], value) :

						// Don't extend strings, arrays, etc. with objects
						$.widget.extend({}, value);

						// Copy everything else by reference
					} else {
						target[key] = value;
					}
				}
			}
		}
		return target;
	};

	$.widget.bridge = function (name, object) {
		var fullName = object.prototype.widgetFullName || name;
		$.fn[name] = function (options) {
			var isMethodCall = typeof options === "string";
			var args = widgetSlice.call(arguments, 1);
			var returnValue = this;

			if (isMethodCall) {

				// If this is an empty collection, we need to have the instance method
				// return undefined instead of the jQuery instance
				if (!this.length && options === "instance") {
					returnValue = undefined;
				} else {
					this.each(function () {
						var methodValue;
						var instance = $.data(this, fullName);

						if (options === "instance") {
							returnValue = instance;
							return false;
						}

						if (!instance) {
							return $.error("cannot call methods on " + name + " prior to initialization; " + "attempted to call method '" + options + "'");
						}

						if (!$.isFunction(instance[options]) || options.charAt(0) === "_") {
							return $.error("no such method '" + options + "' for " + name + " widget instance");
						}

						methodValue = instance[options].apply(instance, args);

						if (methodValue !== instance && methodValue !== undefined) {
							returnValue = methodValue && methodValue.jquery ? returnValue.pushStack(methodValue.get()) : methodValue;
							return false;
						}
					});
				}
			} else {

				// Allow multiple hashes to be passed on init
				if (args.length) {
					options = $.widget.extend.apply(null, [options].concat(args));
				}

				this.each(function () {
					var instance = $.data(this, fullName);
					if (instance) {
						instance.option(options || {});
						if (instance._init) {
							instance._init();
						}
					} else {
						$.data(this, fullName, new object(options, this));
					}
				});
			}

			return returnValue;
		};
	};

	$.Widget = function () /* options, element */{};
	$.Widget._childConstructors = [];

	$.Widget.prototype = {
		widgetName: "widget",
		widgetEventPrefix: "",
		defaultElement: "<div>",

		options: {
			classes: {},
			disabled: false,

			// Callbacks
			create: null
		},

		_createWidget: function _createWidget(options, element) {
			element = $(element || this.defaultElement || this)[0];
			this.element = $(element);
			this.uuid = widgetUuid++;
			this.eventNamespace = "." + this.widgetName + this.uuid;

			this.bindings = $();
			this.hoverable = $();
			this.focusable = $();
			this.classesElementLookup = {};

			if (element !== this) {
				$.data(element, this.widgetFullName, this);
				this._on(true, this.element, {
					remove: function remove(event) {
						if (event.target === element) {
							this.destroy();
						}
					}
				});
				this.document = $(element.style ?

				// Element within the document
				element.ownerDocument :

				// Element is window or document
				element.document || element);
				this.window = $(this.document[0].defaultView || this.document[0].parentWindow);
			}

			this.options = $.widget.extend({}, this.options, this._getCreateOptions(), options);

			this._create();

			if (this.options.disabled) {
				this._setOptionDisabled(this.options.disabled);
			}

			this._trigger("create", null, this._getCreateEventData());
			this._init();
		},

		_getCreateOptions: function _getCreateOptions() {
			return {};
		},

		_getCreateEventData: $.noop,

		_create: $.noop,

		_init: $.noop,

		destroy: function destroy() {
			var that = this;

			this._destroy();
			$.each(this.classesElementLookup, function (key, value) {
				that._removeClass(value, key);
			});

			// We can probably remove the unbind calls in 2.0
			// all event bindings should go through this._on()
			this.element.off(this.eventNamespace).removeData(this.widgetFullName);
			this.widget().off(this.eventNamespace).removeAttr("aria-disabled");

			// Clean up events and states
			this.bindings.off(this.eventNamespace);
		},

		_destroy: $.noop,

		widget: function widget() {
			return this.element;
		},

		option: function option(key, value) {
			var options = key;
			var parts;
			var curOption;
			var i;

			if (arguments.length === 0) {

				// Don't return a reference to the internal hash
				return $.widget.extend({}, this.options);
			}

			if (typeof key === "string") {

				// Handle nested keys, e.g., "foo.bar" => { foo: { bar: ___ } }
				options = {};
				parts = key.split(".");
				key = parts.shift();
				if (parts.length) {
					curOption = options[key] = $.widget.extend({}, this.options[key]);
					for (i = 0; i < parts.length - 1; i++) {
						curOption[parts[i]] = curOption[parts[i]] || {};
						curOption = curOption[parts[i]];
					}
					key = parts.pop();
					if (arguments.length === 1) {
						return curOption[key] === undefined ? null : curOption[key];
					}
					curOption[key] = value;
				} else {
					if (arguments.length === 1) {
						return this.options[key] === undefined ? null : this.options[key];
					}
					options[key] = value;
				}
			}

			this._setOptions(options);

			return this;
		},

		_setOptions: function _setOptions(options) {
			var key;

			for (key in options) {
				this._setOption(key, options[key]);
			}

			return this;
		},

		_setOption: function _setOption(key, value) {
			if (key === "classes") {
				this._setOptionClasses(value);
			}

			this.options[key] = value;

			if (key === "disabled") {
				this._setOptionDisabled(value);
			}

			return this;
		},

		_setOptionClasses: function _setOptionClasses(value) {
			var classKey, elements, currentElements;

			for (classKey in value) {
				currentElements = this.classesElementLookup[classKey];
				if (value[classKey] === this.options.classes[classKey] || !currentElements || !currentElements.length) {
					continue;
				}

				// We are doing this to create a new jQuery object because the _removeClass() call
				// on the next line is going to destroy the reference to the current elements being
				// tracked. We need to save a copy of this collection so that we can add the new classes
				// below.
				elements = $(currentElements.get());
				this._removeClass(currentElements, classKey);

				// We don't use _addClass() here, because that uses this.options.classes
				// for generating the string of classes. We want to use the value passed in from
				// _setOption(), this is the new value of the classes option which was passed to
				// _setOption(). We pass this value directly to _classes().
				elements.addClass(this._classes({
					element: elements,
					keys: classKey,
					classes: value,
					add: true
				}));
			}
		},

		_setOptionDisabled: function _setOptionDisabled(value) {
			this._toggleClass(this.widget(), this.widgetFullName + "-disabled", null, !!value);

			// If the widget is becoming disabled, then nothing is interactive
			if (value) {
				this._removeClass(this.hoverable, null, "ui-state-hover");
				this._removeClass(this.focusable, null, "ui-state-focus");
			}
		},

		enable: function enable() {
			return this._setOptions({ disabled: false });
		},

		disable: function disable() {
			return this._setOptions({ disabled: true });
		},

		_classes: function _classes(options) {
			var full = [];
			var that = this;

			options = $.extend({
				element: this.element,
				classes: this.options.classes || {}
			}, options);

			function processClassString(classes, checkOption) {
				var current, i;
				for (i = 0; i < classes.length; i++) {
					current = that.classesElementLookup[classes[i]] || $();
					if (options.add) {
						current = $($.unique(current.get().concat(options.element.get())));
					} else {
						current = $(current.not(options.element).get());
					}
					that.classesElementLookup[classes[i]] = current;
					full.push(classes[i]);
					if (checkOption && options.classes[classes[i]]) {
						full.push(options.classes[classes[i]]);
					}
				}
			}

			this._on(options.element, {
				"remove": "_untrackClassesElement"
			});

			if (options.keys) {
				processClassString(options.keys.match(/\S+/g) || [], true);
			}
			if (options.extra) {
				processClassString(options.extra.match(/\S+/g) || []);
			}

			return full.join(" ");
		},

		_untrackClassesElement: function _untrackClassesElement(event) {
			var that = this;
			$.each(that.classesElementLookup, function (key, value) {
				if ($.inArray(event.target, value) !== -1) {
					that.classesElementLookup[key] = $(value.not(event.target).get());
				}
			});
		},

		_removeClass: function _removeClass(element, keys, extra) {
			return this._toggleClass(element, keys, extra, false);
		},

		_addClass: function _addClass(element, keys, extra) {
			return this._toggleClass(element, keys, extra, true);
		},

		_toggleClass: function _toggleClass(element, keys, extra, add) {
			add = typeof add === "boolean" ? add : extra;
			var shift = typeof element === "string" || element === null,
			    options = {
				extra: shift ? keys : extra,
				keys: shift ? element : keys,
				element: shift ? this.element : element,
				add: add
			};
			options.element.toggleClass(this._classes(options), add);
			return this;
		},

		_on: function _on(suppressDisabledCheck, element, handlers) {
			var delegateElement;
			var instance = this;

			// No suppressDisabledCheck flag, shuffle arguments
			if (typeof suppressDisabledCheck !== "boolean") {
				handlers = element;
				element = suppressDisabledCheck;
				suppressDisabledCheck = false;
			}

			// No element argument, shuffle and use this.element
			if (!handlers) {
				handlers = element;
				element = this.element;
				delegateElement = this.widget();
			} else {
				element = delegateElement = $(element);
				this.bindings = this.bindings.add(element);
			}

			$.each(handlers, function (event, handler) {
				function handlerProxy() {

					// Allow widgets to customize the disabled handling
					// - disabled as an array instead of boolean
					// - disabled class as method for disabling individual parts
					if (!suppressDisabledCheck && (instance.options.disabled === true || $(this).hasClass("ui-state-disabled"))) {
						return;
					}
					return (typeof handler === "string" ? instance[handler] : handler).apply(instance, arguments);
				}

				// Copy the guid so direct unbinding works
				if (typeof handler !== "string") {
					handlerProxy.guid = handler.guid = handler.guid || handlerProxy.guid || $.guid++;
				}

				var match = event.match(/^([\w:-]*)\s*(.*)$/);
				var eventName = match[1] + instance.eventNamespace;
				var selector = match[2];

				if (selector) {
					delegateElement.on(eventName, selector, handlerProxy);
				} else {
					element.on(eventName, handlerProxy);
				}
			});
		},

		_off: function _off(element, eventName) {
			eventName = (eventName || "").split(" ").join(this.eventNamespace + " ") + this.eventNamespace;
			element.off(eventName).off(eventName);

			// Clear the stack to avoid memory leaks (#10056)
			this.bindings = $(this.bindings.not(element).get());
			this.focusable = $(this.focusable.not(element).get());
			this.hoverable = $(this.hoverable.not(element).get());
		},

		_delay: function _delay(handler, delay) {
			function handlerProxy() {
				return (typeof handler === "string" ? instance[handler] : handler).apply(instance, arguments);
			}
			var instance = this;
			return setTimeout(handlerProxy, delay || 0);
		},

		_hoverable: function _hoverable(element) {
			this.hoverable = this.hoverable.add(element);
			this._on(element, {
				mouseenter: function mouseenter(event) {
					this._addClass($(event.currentTarget), null, "ui-state-hover");
				},
				mouseleave: function mouseleave(event) {
					this._removeClass($(event.currentTarget), null, "ui-state-hover");
				}
			});
		},

		_focusable: function _focusable(element) {
			this.focusable = this.focusable.add(element);
			this._on(element, {
				focusin: function focusin(event) {
					this._addClass($(event.currentTarget), null, "ui-state-focus");
				},
				focusout: function focusout(event) {
					this._removeClass($(event.currentTarget), null, "ui-state-focus");
				}
			});
		},

		_trigger: function _trigger(type, event, data) {
			var prop, orig;
			var callback = this.options[type];

			data = data || {};
			event = $.Event(event);
			event.type = (type === this.widgetEventPrefix ? type : this.widgetEventPrefix + type).toLowerCase();

			// The original event may come from any element
			// so we need to reset the target on the new event
			event.target = this.element[0];

			// Copy original event properties over to the new event
			orig = event.originalEvent;
			if (orig) {
				for (prop in orig) {
					if (!(prop in event)) {
						event[prop] = orig[prop];
					}
				}
			}

			this.element.trigger(event, data);
			return !($.isFunction(callback) && callback.apply(this.element[0], [event].concat(data)) === false || event.isDefaultPrevented());
		}
	};

	$.each({ show: "fadeIn", hide: "fadeOut" }, function (method, defaultEffect) {
		$.Widget.prototype["_" + method] = function (element, options, callback) {
			if (typeof options === "string") {
				options = { effect: options };
			}

			var hasOptions;
			var effectName = !options ? method : options === true || typeof options === "number" ? defaultEffect : options.effect || defaultEffect;

			options = options || {};
			if (typeof options === "number") {
				options = { duration: options };
			}

			hasOptions = !$.isEmptyObject(options);
			options.complete = callback;

			if (options.delay) {
				element.delay(options.delay);
			}

			if (hasOptions && $.effects && $.effects.effect[effectName]) {
				element[method](options);
			} else if (effectName !== method && element[effectName]) {
				element[effectName](options.duration, options.easing, callback);
			} else {
				element.queue(function (next) {
					$(this)[method]();
					if (callback) {
						callback.call(element[0]);
					}
					next();
				});
			}
		};
	});

	var widget = $.widget;

	/*!
  * jQuery UI Position 1.12.1
  * http://jqueryui.com
  *
  * Copyright jQuery Foundation and other contributors
  * Released under the MIT license.
  * http://jquery.org/license
  *
  * http://api.jqueryui.com/position/
  */

	//>>label: Position
	//>>group: Core
	//>>description: Positions elements relative to other elements.
	//>>docs: http://api.jqueryui.com/position/
	//>>demos: http://jqueryui.com/position/


	(function () {
		var cachedScrollbarWidth,
		    max = Math.max,
		    abs = Math.abs,
		    rhorizontal = /left|center|right/,
		    rvertical = /top|center|bottom/,
		    roffset = /[\+\-]\d+(\.[\d]+)?%?/,
		    rposition = /^\w+/,
		    rpercent = /%$/,
		    _position = $.fn.position;

		function getOffsets(offsets, width, height) {
			return [parseFloat(offsets[0]) * (rpercent.test(offsets[0]) ? width / 100 : 1), parseFloat(offsets[1]) * (rpercent.test(offsets[1]) ? height / 100 : 1)];
		}

		function parseCss(element, property) {
			return parseInt($.css(element, property), 10) || 0;
		}

		function getDimensions(elem) {
			var raw = elem[0];
			if (raw.nodeType === 9) {
				return {
					width: elem.width(),
					height: elem.height(),
					offset: { top: 0, left: 0 }
				};
			}
			if ($.isWindow(raw)) {
				return {
					width: elem.width(),
					height: elem.height(),
					offset: { top: elem.scrollTop(), left: elem.scrollLeft() }
				};
			}
			if (raw.preventDefault) {
				return {
					width: 0,
					height: 0,
					offset: { top: raw.pageY, left: raw.pageX }
				};
			}
			return {
				width: elem.outerWidth(),
				height: elem.outerHeight(),
				offset: elem.offset()
			};
		}

		$.position = {
			scrollbarWidth: function scrollbarWidth() {
				if (cachedScrollbarWidth !== undefined) {
					return cachedScrollbarWidth;
				}
				var w1,
				    w2,
				    div = $("<div " + "style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'>" + "<div style='height:100px;width:auto;'></div></div>"),
				    innerDiv = div.children()[0];

				$("body").append(div);
				w1 = innerDiv.offsetWidth;
				div.css("overflow", "scroll");

				w2 = innerDiv.offsetWidth;

				if (w1 === w2) {
					w2 = div[0].clientWidth;
				}

				div.remove();

				return cachedScrollbarWidth = w1 - w2;
			},
			getScrollInfo: function getScrollInfo(within) {
				var overflowX = within.isWindow || within.isDocument ? "" : within.element.css("overflow-x"),
				    overflowY = within.isWindow || within.isDocument ? "" : within.element.css("overflow-y"),
				    hasOverflowX = overflowX === "scroll" || overflowX === "auto" && within.width < within.element[0].scrollWidth,
				    hasOverflowY = overflowY === "scroll" || overflowY === "auto" && within.height < within.element[0].scrollHeight;
				return {
					width: hasOverflowY ? $.position.scrollbarWidth() : 0,
					height: hasOverflowX ? $.position.scrollbarWidth() : 0
				};
			},
			getWithinInfo: function getWithinInfo(element) {
				var withinElement = $(element || window),
				    isWindow = $.isWindow(withinElement[0]),
				    isDocument = !!withinElement[0] && withinElement[0].nodeType === 9,
				    hasOffset = !isWindow && !isDocument;
				return {
					element: withinElement,
					isWindow: isWindow,
					isDocument: isDocument,
					offset: hasOffset ? $(element).offset() : { left: 0, top: 0 },
					scrollLeft: withinElement.scrollLeft(),
					scrollTop: withinElement.scrollTop(),
					width: withinElement.outerWidth(),
					height: withinElement.outerHeight()
				};
			}
		};

		$.fn.position = function (options) {
			if (!options || !options.of) {
				return _position.apply(this, arguments);
			}

			// Make a copy, we don't want to modify arguments
			options = $.extend({}, options);

			var atOffset,
			    targetWidth,
			    targetHeight,
			    targetOffset,
			    basePosition,
			    dimensions,
			    target = $(options.of),
			    within = $.position.getWithinInfo(options.within),
			    scrollInfo = $.position.getScrollInfo(within),
			    collision = (options.collision || "flip").split(" "),
			    offsets = {};

			dimensions = getDimensions(target);
			if (target[0].preventDefault) {

				// Force left top to allow flipping
				options.at = "left top";
			}
			targetWidth = dimensions.width;
			targetHeight = dimensions.height;
			targetOffset = dimensions.offset;

			// Clone to reuse original targetOffset later
			basePosition = $.extend({}, targetOffset);

			// Force my and at to have valid horizontal and vertical positions
			// if a value is missing or invalid, it will be converted to center
			$.each(["my", "at"], function () {
				var pos = (options[this] || "").split(" "),
				    horizontalOffset,
				    verticalOffset;

				if (pos.length === 1) {
					pos = rhorizontal.test(pos[0]) ? pos.concat(["center"]) : rvertical.test(pos[0]) ? ["center"].concat(pos) : ["center", "center"];
				}
				pos[0] = rhorizontal.test(pos[0]) ? pos[0] : "center";
				pos[1] = rvertical.test(pos[1]) ? pos[1] : "center";

				// Calculate offsets
				horizontalOffset = roffset.exec(pos[0]);
				verticalOffset = roffset.exec(pos[1]);
				offsets[this] = [horizontalOffset ? horizontalOffset[0] : 0, verticalOffset ? verticalOffset[0] : 0];

				// Reduce to just the positions without the offsets
				options[this] = [rposition.exec(pos[0])[0], rposition.exec(pos[1])[0]];
			});

			// Normalize collision option
			if (collision.length === 1) {
				collision[1] = collision[0];
			}

			if (options.at[0] === "right") {
				basePosition.left += targetWidth;
			} else if (options.at[0] === "center") {
				basePosition.left += targetWidth / 2;
			}

			if (options.at[1] === "bottom") {
				basePosition.top += targetHeight;
			} else if (options.at[1] === "center") {
				basePosition.top += targetHeight / 2;
			}

			atOffset = getOffsets(offsets.at, targetWidth, targetHeight);
			basePosition.left += atOffset[0];
			basePosition.top += atOffset[1];

			return this.each(function () {
				var collisionPosition,
				    using,
				    elem = $(this),
				    elemWidth = elem.outerWidth(),
				    elemHeight = elem.outerHeight(),
				    marginLeft = parseCss(this, "marginLeft"),
				    marginTop = parseCss(this, "marginTop"),
				    collisionWidth = elemWidth + marginLeft + parseCss(this, "marginRight") + scrollInfo.width,
				    collisionHeight = elemHeight + marginTop + parseCss(this, "marginBottom") + scrollInfo.height,
				    position = $.extend({}, basePosition),
				    myOffset = getOffsets(offsets.my, elem.outerWidth(), elem.outerHeight());

				if (options.my[0] === "right") {
					position.left -= elemWidth;
				} else if (options.my[0] === "center") {
					position.left -= elemWidth / 2;
				}

				if (options.my[1] === "bottom") {
					position.top -= elemHeight;
				} else if (options.my[1] === "center") {
					position.top -= elemHeight / 2;
				}

				position.left += myOffset[0];
				position.top += myOffset[1];

				collisionPosition = {
					marginLeft: marginLeft,
					marginTop: marginTop
				};

				$.each(["left", "top"], function (i, dir) {
					if ($.ui.position[collision[i]]) {
						$.ui.position[collision[i]][dir](position, {
							targetWidth: targetWidth,
							targetHeight: targetHeight,
							elemWidth: elemWidth,
							elemHeight: elemHeight,
							collisionPosition: collisionPosition,
							collisionWidth: collisionWidth,
							collisionHeight: collisionHeight,
							offset: [atOffset[0] + myOffset[0], atOffset[1] + myOffset[1]],
							my: options.my,
							at: options.at,
							within: within,
							elem: elem
						});
					}
				});

				if (options.using) {

					// Adds feedback as second argument to using callback, if present
					using = function using(props) {
						var left = targetOffset.left - position.left,
						    right = left + targetWidth - elemWidth,
						    top = targetOffset.top - position.top,
						    bottom = top + targetHeight - elemHeight,
						    feedback = {
							target: {
								element: target,
								left: targetOffset.left,
								top: targetOffset.top,
								width: targetWidth,
								height: targetHeight
							},
							element: {
								element: elem,
								left: position.left,
								top: position.top,
								width: elemWidth,
								height: elemHeight
							},
							horizontal: right < 0 ? "left" : left > 0 ? "right" : "center",
							vertical: bottom < 0 ? "top" : top > 0 ? "bottom" : "middle"
						};
						if (targetWidth < elemWidth && abs(left + right) < targetWidth) {
							feedback.horizontal = "center";
						}
						if (targetHeight < elemHeight && abs(top + bottom) < targetHeight) {
							feedback.vertical = "middle";
						}
						if (max(abs(left), abs(right)) > max(abs(top), abs(bottom))) {
							feedback.important = "horizontal";
						} else {
							feedback.important = "vertical";
						}
						options.using.call(this, props, feedback);
					};
				}

				elem.offset($.extend(position, { using: using }));
			});
		};

		$.ui.position = {
			fit: {
				left: function left(position, data) {
					var within = data.within,
					    withinOffset = within.isWindow ? within.scrollLeft : within.offset.left,
					    outerWidth = within.width,
					    collisionPosLeft = position.left - data.collisionPosition.marginLeft,
					    overLeft = withinOffset - collisionPosLeft,
					    overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset,
					    newOverRight;

					// Element is wider than within
					if (data.collisionWidth > outerWidth) {

						// Element is initially over the left side of within
						if (overLeft > 0 && overRight <= 0) {
							newOverRight = position.left + overLeft + data.collisionWidth - outerWidth - withinOffset;
							position.left += overLeft - newOverRight;

							// Element is initially over right side of within
						} else if (overRight > 0 && overLeft <= 0) {
							position.left = withinOffset;

							// Element is initially over both left and right sides of within
						} else {
							if (overLeft > overRight) {
								position.left = withinOffset + outerWidth - data.collisionWidth;
							} else {
								position.left = withinOffset;
							}
						}

						// Too far left -> align with left edge
					} else if (overLeft > 0) {
						position.left += overLeft;

						// Too far right -> align with right edge
					} else if (overRight > 0) {
						position.left -= overRight;

						// Adjust based on position and margin
					} else {
						position.left = max(position.left - collisionPosLeft, position.left);
					}
				},
				top: function top(position, data) {
					var within = data.within,
					    withinOffset = within.isWindow ? within.scrollTop : within.offset.top,
					    outerHeight = data.within.height,
					    collisionPosTop = position.top - data.collisionPosition.marginTop,
					    overTop = withinOffset - collisionPosTop,
					    overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset,
					    newOverBottom;

					// Element is taller than within
					if (data.collisionHeight > outerHeight) {

						// Element is initially over the top of within
						if (overTop > 0 && overBottom <= 0) {
							newOverBottom = position.top + overTop + data.collisionHeight - outerHeight - withinOffset;
							position.top += overTop - newOverBottom;

							// Element is initially over bottom of within
						} else if (overBottom > 0 && overTop <= 0) {
							position.top = withinOffset;

							// Element is initially over both top and bottom of within
						} else {
							if (overTop > overBottom) {
								position.top = withinOffset + outerHeight - data.collisionHeight;
							} else {
								position.top = withinOffset;
							}
						}

						// Too far up -> align with top
					} else if (overTop > 0) {
						position.top += overTop;

						// Too far down -> align with bottom edge
					} else if (overBottom > 0) {
						position.top -= overBottom;

						// Adjust based on position and margin
					} else {
						position.top = max(position.top - collisionPosTop, position.top);
					}
				}
			},
			flip: {
				left: function left(position, data) {
					var within = data.within,
					    withinOffset = within.offset.left + within.scrollLeft,
					    outerWidth = within.width,
					    offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left,
					    collisionPosLeft = position.left - data.collisionPosition.marginLeft,
					    overLeft = collisionPosLeft - offsetLeft,
					    overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft,
					    myOffset = data.my[0] === "left" ? -data.elemWidth : data.my[0] === "right" ? data.elemWidth : 0,
					    atOffset = data.at[0] === "left" ? data.targetWidth : data.at[0] === "right" ? -data.targetWidth : 0,
					    offset = -2 * data.offset[0],
					    newOverRight,
					    newOverLeft;

					if (overLeft < 0) {
						newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth - outerWidth - withinOffset;
						if (newOverRight < 0 || newOverRight < abs(overLeft)) {
							position.left += myOffset + atOffset + offset;
						}
					} else if (overRight > 0) {
						newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset + atOffset + offset - offsetLeft;
						if (newOverLeft > 0 || abs(newOverLeft) < overRight) {
							position.left += myOffset + atOffset + offset;
						}
					}
				},
				top: function top(position, data) {
					var within = data.within,
					    withinOffset = within.offset.top + within.scrollTop,
					    outerHeight = within.height,
					    offsetTop = within.isWindow ? within.scrollTop : within.offset.top,
					    collisionPosTop = position.top - data.collisionPosition.marginTop,
					    overTop = collisionPosTop - offsetTop,
					    overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop,
					    top = data.my[1] === "top",
					    myOffset = top ? -data.elemHeight : data.my[1] === "bottom" ? data.elemHeight : 0,
					    atOffset = data.at[1] === "top" ? data.targetHeight : data.at[1] === "bottom" ? -data.targetHeight : 0,
					    offset = -2 * data.offset[1],
					    newOverTop,
					    newOverBottom;
					if (overTop < 0) {
						newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight - outerHeight - withinOffset;
						if (newOverBottom < 0 || newOverBottom < abs(overTop)) {
							position.top += myOffset + atOffset + offset;
						}
					} else if (overBottom > 0) {
						newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset + offset - offsetTop;
						if (newOverTop > 0 || abs(newOverTop) < overBottom) {
							position.top += myOffset + atOffset + offset;
						}
					}
				}
			},
			flipfit: {
				left: function left() {
					$.ui.position.flip.left.apply(this, arguments);
					$.ui.position.fit.left.apply(this, arguments);
				},
				top: function top() {
					$.ui.position.flip.top.apply(this, arguments);
					$.ui.position.fit.top.apply(this, arguments);
				}
			}
		};
	})();

	var position = $.ui.position;

	// Support: IE8 Only
	// IE8 does not support the form attribute and when it is supplied. It overwrites the form prop
	// with a string, so we need to find the proper form.
	var form = $.fn.form = function () {
		return typeof this[0].form === "string" ? this.closest("form") : $(this[0].form);
	};

	/*!
  * jQuery UI Form Reset Mixin 1.12.1
  * http://jqueryui.com
  *
  * Copyright jQuery Foundation and other contributors
  * Released under the MIT license.
  * http://jquery.org/license
  */

	//>>label: Form Reset Mixin
	//>>group: Core
	//>>description: Refresh input widgets when their form is reset
	//>>docs: http://api.jqueryui.com/form-reset-mixin/


	var formResetMixin = $.ui.formResetMixin = {
		_formResetHandler: function _formResetHandler() {
			var form = $(this);

			// Wait for the form reset to actually happen before refreshing
			setTimeout(function () {
				var instances = form.data("ui-form-reset-instances");
				$.each(instances, function () {
					this.refresh();
				});
			});
		},

		_bindFormResetHandler: function _bindFormResetHandler() {
			this.form = this.element.form();
			if (!this.form.length) {
				return;
			}

			var instances = this.form.data("ui-form-reset-instances") || [];
			if (!instances.length) {

				// We don't use _on() here because we use a single event handler per form
				this.form.on("reset.ui-form-reset", this._formResetHandler);
			}
			instances.push(this);
			this.form.data("ui-form-reset-instances", instances);
		},

		_unbindFormResetHandler: function _unbindFormResetHandler() {
			if (!this.form.length) {
				return;
			}

			var instances = this.form.data("ui-form-reset-instances");
			instances.splice($.inArray(this, instances), 1);
			if (instances.length) {
				this.form.data("ui-form-reset-instances", instances);
			} else {
				this.form.removeData("ui-form-reset-instances").off("reset.ui-form-reset");
			}
		}
	};

	/*!
  * jQuery UI Keycode 1.12.1
  * http://jqueryui.com
  *
  * Copyright jQuery Foundation and other contributors
  * Released under the MIT license.
  * http://jquery.org/license
  */

	//>>label: Keycode
	//>>group: Core
	//>>description: Provide keycodes as keynames
	//>>docs: http://api.jqueryui.com/jQuery.ui.keyCode/


	var keycode = $.ui.keyCode = {
		BACKSPACE: 8,
		COMMA: 188,
		DELETE: 46,
		DOWN: 40,
		END: 35,
		ENTER: 13,
		ESCAPE: 27,
		HOME: 36,
		LEFT: 37,
		PAGE_DOWN: 34,
		PAGE_UP: 33,
		PERIOD: 190,
		RIGHT: 39,
		SPACE: 32,
		TAB: 9,
		UP: 38
	};

	// Internal use only
	var escapeSelector = $.ui.escapeSelector = function () {
		var selectorEscape = /([!"#$%&'()*+,./:;<=>?@[\]^`{|}~])/g;
		return function (selector) {
			return selector.replace(selectorEscape, "\\$1");
		};
	}();

	/*!
  * jQuery UI Labels 1.12.1
  * http://jqueryui.com
  *
  * Copyright jQuery Foundation and other contributors
  * Released under the MIT license.
  * http://jquery.org/license
  */

	//>>label: labels
	//>>group: Core
	//>>description: Find all the labels associated with a given input
	//>>docs: http://api.jqueryui.com/labels/


	var labels = $.fn.labels = function () {
		var ancestor, selector, id, labels, ancestors;

		// Check control.labels first
		if (this[0].labels && this[0].labels.length) {
			return this.pushStack(this[0].labels);
		}

		// Support: IE <= 11, FF <= 37, Android <= 2.3 only
		// Above browsers do not support control.labels. Everything below is to support them
		// as well as document fragments. control.labels does not work on document fragments
		labels = this.eq(0).parents("label");

		// Look for the label based on the id
		id = this.attr("id");
		if (id) {

			// We don't search against the document in case the element
			// is disconnected from the DOM
			ancestor = this.eq(0).parents().last();

			// Get a full set of top level ancestors
			ancestors = ancestor.add(ancestor.length ? ancestor.siblings() : this.siblings());

			// Create a selector for the label based on the id
			selector = "label[for='" + $.ui.escapeSelector(id) + "']";

			labels = labels.add(ancestors.find(selector).addBack(selector));
		}

		// Return whatever we have found for labels
		return this.pushStack(labels);
	};

	/*!
  * jQuery UI Unique ID 1.12.1
  * http://jqueryui.com
  *
  * Copyright jQuery Foundation and other contributors
  * Released under the MIT license.
  * http://jquery.org/license
  */

	//>>label: uniqueId
	//>>group: Core
	//>>description: Functions to generate and remove uniqueId's
	//>>docs: http://api.jqueryui.com/uniqueId/


	var uniqueId = $.fn.extend({
		uniqueId: function () {
			var uuid = 0;

			return function () {
				return this.each(function () {
					if (!this.id) {
						this.id = "ui-id-" + ++uuid;
					}
				});
			};
		}(),

		removeUniqueId: function removeUniqueId() {
			return this.each(function () {
				if (/^ui-id-\d+$/.test(this.id)) {
					$(this).removeAttr("id");
				}
			});
		}
	});

	/*!
  * jQuery UI Accordion 1.12.1
  * http://jqueryui.com
  *
  * Copyright jQuery Foundation and other contributors
  * Released under the MIT license.
  * http://jquery.org/license
  */

	//>>label: Accordion
	//>>group: Widgets
	// jscs:disable maximumLineLength
	//>>description: Displays collapsible content panels for presenting information in a limited amount of space.
	// jscs:enable maximumLineLength
	//>>docs: http://api.jqueryui.com/accordion/
	//>>demos: http://jqueryui.com/accordion/
	//>>css.structure: ../../themes/base/core.css
	//>>css.structure: ../../themes/base/accordion.css
	//>>css.theme: ../../themes/base/theme.css


	var widgetsAccordion = $.widget("ui.accordion", {
		version: "1.12.1",
		options: {
			active: 0,
			animate: {},
			classes: {
				"ui-accordion-header": "ui-corner-top",
				"ui-accordion-header-collapsed": "ui-corner-all",
				"ui-accordion-content": "ui-corner-bottom"
			},
			collapsible: false,
			event: "click",
			header: "> li > :first-child, > :not(li):even",
			heightStyle: "auto",
			icons: {
				activeHeader: "ui-icon-triangle-1-s",
				header: "ui-icon-triangle-1-e"
			},

			// Callbacks
			activate: null,
			beforeActivate: null
		},

		hideProps: {
			borderTopWidth: "hide",
			borderBottomWidth: "hide",
			paddingTop: "hide",
			paddingBottom: "hide",
			height: "hide"
		},

		showProps: {
			borderTopWidth: "show",
			borderBottomWidth: "show",
			paddingTop: "show",
			paddingBottom: "show",
			height: "show"
		},

		_create: function _create() {
			var options = this.options;

			this.prevShow = this.prevHide = $();
			this._addClass("ui-accordion", "ui-widget ui-helper-reset");
			this.element.attr("role", "tablist");

			// Don't allow collapsible: false and active: false / null
			if (!options.collapsible && (options.active === false || options.active == null)) {
				options.active = 0;
			}

			this._processPanels();

			// handle negative values
			if (options.active < 0) {
				options.active += this.headers.length;
			}
			this._refresh();
		},

		_getCreateEventData: function _getCreateEventData() {
			return {
				header: this.active,
				panel: !this.active.length ? $() : this.active.next()
			};
		},

		_createIcons: function _createIcons() {
			var icon,
			    children,
			    icons = this.options.icons;

			if (icons) {
				icon = $("<span>");
				this._addClass(icon, "ui-accordion-header-icon", "ui-icon " + icons.header);
				icon.prependTo(this.headers);
				children = this.active.children(".ui-accordion-header-icon");
				this._removeClass(children, icons.header)._addClass(children, null, icons.activeHeader)._addClass(this.headers, "ui-accordion-icons");
			}
		},

		_destroyIcons: function _destroyIcons() {
			this._removeClass(this.headers, "ui-accordion-icons");
			this.headers.children(".ui-accordion-header-icon").remove();
		},

		_destroy: function _destroy() {
			var contents;

			// Clean up main element
			this.element.removeAttr("role");

			// Clean up headers
			this.headers.removeAttr("role aria-expanded aria-selected aria-controls tabIndex").removeUniqueId();

			this._destroyIcons();

			// Clean up content panels
			contents = this.headers.next().css("display", "").removeAttr("role aria-hidden aria-labelledby").removeUniqueId();

			if (this.options.heightStyle !== "content") {
				contents.css("height", "");
			}
		},

		_setOption: function _setOption(key, value) {
			if (key === "active") {

				// _activate() will handle invalid values and update this.options
				this._activate(value);
				return;
			}

			if (key === "event") {
				if (this.options.event) {
					this._off(this.headers, this.options.event);
				}
				this._setupEvents(value);
			}

			this._super(key, value);

			// Setting collapsible: false while collapsed; open first panel
			if (key === "collapsible" && !value && this.options.active === false) {
				this._activate(0);
			}

			if (key === "icons") {
				this._destroyIcons();
				if (value) {
					this._createIcons();
				}
			}
		},

		_setOptionDisabled: function _setOptionDisabled(value) {
			this._super(value);

			this.element.attr("aria-disabled", value);

			// Support: IE8 Only
			// #5332 / #6059 - opacity doesn't cascade to positioned elements in IE
			// so we need to add the disabled class to the headers and panels
			this._toggleClass(null, "ui-state-disabled", !!value);
			this._toggleClass(this.headers.add(this.headers.next()), null, "ui-state-disabled", !!value);
		},

		_keydown: function _keydown(event) {
			if (event.altKey || event.ctrlKey) {
				return;
			}

			var keyCode = $.ui.keyCode,
			    length = this.headers.length,
			    currentIndex = this.headers.index(event.target),
			    toFocus = false;

			switch (event.keyCode) {
				case keyCode.RIGHT:
				case keyCode.DOWN:
					toFocus = this.headers[(currentIndex + 1) % length];
					break;
				case keyCode.LEFT:
				case keyCode.UP:
					toFocus = this.headers[(currentIndex - 1 + length) % length];
					break;
				case keyCode.SPACE:
				case keyCode.ENTER:
					this._eventHandler(event);
					break;
				case keyCode.HOME:
					toFocus = this.headers[0];
					break;
				case keyCode.END:
					toFocus = this.headers[length - 1];
					break;
			}

			if (toFocus) {
				$(event.target).attr("tabIndex", -1);
				$(toFocus).attr("tabIndex", 0);
				$(toFocus).trigger("focus");
				event.preventDefault();
			}
		},

		_panelKeyDown: function _panelKeyDown(event) {
			if (event.keyCode === $.ui.keyCode.UP && event.ctrlKey) {
				$(event.currentTarget).prev().trigger("focus");
			}
		},

		refresh: function refresh() {
			var options = this.options;
			this._processPanels();

			// Was collapsed or no panel
			if (options.active === false && options.collapsible === true || !this.headers.length) {
				options.active = false;
				this.active = $();

				// active false only when collapsible is true
			} else if (options.active === false) {
				this._activate(0);

				// was active, but active panel is gone
			} else if (this.active.length && !$.contains(this.element[0], this.active[0])) {

				// all remaining panel are disabled
				if (this.headers.length === this.headers.find(".ui-state-disabled").length) {
					options.active = false;
					this.active = $();

					// activate previous panel
				} else {
					this._activate(Math.max(0, options.active - 1));
				}

				// was active, active panel still exists
			} else {

				// make sure active index is correct
				options.active = this.headers.index(this.active);
			}

			this._destroyIcons();

			this._refresh();
		},

		_processPanels: function _processPanels() {
			var prevHeaders = this.headers,
			    prevPanels = this.panels;

			this.headers = this.element.find(this.options.header);
			this._addClass(this.headers, "ui-accordion-header ui-accordion-header-collapsed", "ui-state-default");

			this.panels = this.headers.next().filter(":not(.ui-accordion-content-active)").hide();
			this._addClass(this.panels, "ui-accordion-content", "ui-helper-reset ui-widget-content");

			// Avoid memory leaks (#10056)
			if (prevPanels) {
				this._off(prevHeaders.not(this.headers));
				this._off(prevPanels.not(this.panels));
			}
		},

		_refresh: function _refresh() {
			var maxHeight,
			    options = this.options,
			    heightStyle = options.heightStyle,
			    parent = this.element.parent();

			this.active = this._findActive(options.active);
			this._addClass(this.active, "ui-accordion-header-active", "ui-state-active")._removeClass(this.active, "ui-accordion-header-collapsed");
			this._addClass(this.active.next(), "ui-accordion-content-active");
			this.active.next().show();

			this.headers.attr("role", "tab").each(function () {
				var header = $(this),
				    headerId = header.uniqueId().attr("id"),
				    panel = header.next(),
				    panelId = panel.uniqueId().attr("id");
				header.attr("aria-controls", panelId);
				panel.attr("aria-labelledby", headerId);
			}).next().attr("role", "tabpanel");

			this.headers.not(this.active).attr({
				"aria-selected": "false",
				"aria-expanded": "false",
				tabIndex: -1
			}).next().attr({
				"aria-hidden": "true"
			}).hide();

			// Make sure at least one header is in the tab order
			if (!this.active.length) {
				this.headers.eq(0).attr("tabIndex", 0);
			} else {
				this.active.attr({
					"aria-selected": "true",
					"aria-expanded": "true",
					tabIndex: 0
				}).next().attr({
					"aria-hidden": "false"
				});
			}

			this._createIcons();

			this._setupEvents(options.event);

			if (heightStyle === "fill") {
				maxHeight = parent.height();
				this.element.siblings(":visible").each(function () {
					var elem = $(this),
					    position = elem.css("position");

					if (position === "absolute" || position === "fixed") {
						return;
					}
					maxHeight -= elem.outerHeight(true);
				});

				this.headers.each(function () {
					maxHeight -= $(this).outerHeight(true);
				});

				this.headers.next().each(function () {
					$(this).height(Math.max(0, maxHeight - $(this).innerHeight() + $(this).height()));
				}).css("overflow", "auto");
			} else if (heightStyle === "auto") {
				maxHeight = 0;
				this.headers.next().each(function () {
					var isVisible = $(this).is(":visible");
					if (!isVisible) {
						$(this).show();
					}
					maxHeight = Math.max(maxHeight, $(this).css("height", "").height());
					if (!isVisible) {
						$(this).hide();
					}
				}).height(maxHeight);
			}
		},

		_activate: function _activate(index) {
			var active = this._findActive(index)[0];

			// Trying to activate the already active panel
			if (active === this.active[0]) {
				return;
			}

			// Trying to collapse, simulate a click on the currently active header
			active = active || this.active[0];

			this._eventHandler({
				target: active,
				currentTarget: active,
				preventDefault: $.noop
			});
		},

		_findActive: function _findActive(selector) {
			return typeof selector === "number" ? this.headers.eq(selector) : $();
		},

		_setupEvents: function _setupEvents(event) {
			var events = {
				keydown: "_keydown"
			};
			if (event) {
				$.each(event.split(" "), function (index, eventName) {
					events[eventName] = "_eventHandler";
				});
			}

			this._off(this.headers.add(this.headers.next()));
			this._on(this.headers, events);
			this._on(this.headers.next(), { keydown: "_panelKeyDown" });
			this._hoverable(this.headers);
			this._focusable(this.headers);
		},

		_eventHandler: function _eventHandler(event) {
			var activeChildren,
			    clickedChildren,
			    options = this.options,
			    active = this.active,
			    clicked = $(event.currentTarget),
			    clickedIsActive = clicked[0] === active[0],
			    collapsing = clickedIsActive && options.collapsible,
			    toShow = collapsing ? $() : clicked.next(),
			    toHide = active.next(),
			    eventData = {
				oldHeader: active,
				oldPanel: toHide,
				newHeader: collapsing ? $() : clicked,
				newPanel: toShow
			};

			event.preventDefault();

			if (

			// click on active header, but not collapsible
			clickedIsActive && !options.collapsible ||

			// allow canceling activation
			this._trigger("beforeActivate", event, eventData) === false) {
				return;
			}

			options.active = collapsing ? false : this.headers.index(clicked);

			// When the call to ._toggle() comes after the class changes
			// it causes a very odd bug in IE 8 (see #6720)
			this.active = clickedIsActive ? $() : clicked;
			this._toggle(eventData);

			// Switch classes
			// corner classes on the previously active header stay after the animation
			this._removeClass(active, "ui-accordion-header-active", "ui-state-active");
			if (options.icons) {
				activeChildren = active.children(".ui-accordion-header-icon");
				this._removeClass(activeChildren, null, options.icons.activeHeader)._addClass(activeChildren, null, options.icons.header);
			}

			if (!clickedIsActive) {
				this._removeClass(clicked, "ui-accordion-header-collapsed")._addClass(clicked, "ui-accordion-header-active", "ui-state-active");
				if (options.icons) {
					clickedChildren = clicked.children(".ui-accordion-header-icon");
					this._removeClass(clickedChildren, null, options.icons.header)._addClass(clickedChildren, null, options.icons.activeHeader);
				}

				this._addClass(clicked.next(), "ui-accordion-content-active");
			}
		},

		_toggle: function _toggle(data) {
			var toShow = data.newPanel,
			    toHide = this.prevShow.length ? this.prevShow : data.oldPanel;

			// Handle activating a panel during the animation for another activation
			this.prevShow.add(this.prevHide).stop(true, true);
			this.prevShow = toShow;
			this.prevHide = toHide;

			if (this.options.animate) {
				this._animate(toShow, toHide, data);
			} else {
				toHide.hide();
				toShow.show();
				this._toggleComplete(data);
			}

			toHide.attr({
				"aria-hidden": "true"
			});
			toHide.prev().attr({
				"aria-selected": "false",
				"aria-expanded": "false"
			});

			// if we're switching panels, remove the old header from the tab order
			// if we're opening from collapsed state, remove the previous header from the tab order
			// if we're collapsing, then keep the collapsing header in the tab order
			if (toShow.length && toHide.length) {
				toHide.prev().attr({
					"tabIndex": -1,
					"aria-expanded": "false"
				});
			} else if (toShow.length) {
				this.headers.filter(function () {
					return parseInt($(this).attr("tabIndex"), 10) === 0;
				}).attr("tabIndex", -1);
			}

			toShow.attr("aria-hidden", "false").prev().attr({
				"aria-selected": "true",
				"aria-expanded": "true",
				tabIndex: 0
			});
		},

		_animate: function _animate(toShow, toHide, data) {
			var total,
			    easing,
			    duration,
			    that = this,
			    adjust = 0,
			    boxSizing = toShow.css("box-sizing"),
			    down = toShow.length && (!toHide.length || toShow.index() < toHide.index()),
			    animate = this.options.animate || {},
			    options = down && animate.down || animate,
			    complete = function complete() {
				that._toggleComplete(data);
			};

			if (typeof options === "number") {
				duration = options;
			}
			if (typeof options === "string") {
				easing = options;
			}

			// fall back from options to animation in case of partial down settings
			easing = easing || options.easing || animate.easing;
			duration = duration || options.duration || animate.duration;

			if (!toHide.length) {
				return toShow.animate(this.showProps, duration, easing, complete);
			}
			if (!toShow.length) {
				return toHide.animate(this.hideProps, duration, easing, complete);
			}

			total = toShow.show().outerHeight();
			toHide.animate(this.hideProps, {
				duration: duration,
				easing: easing,
				step: function step(now, fx) {
					fx.now = Math.round(now);
				}
			});
			toShow.hide().animate(this.showProps, {
				duration: duration,
				easing: easing,
				complete: complete,
				step: function step(now, fx) {
					fx.now = Math.round(now);
					if (fx.prop !== "height") {
						if (boxSizing === "content-box") {
							adjust += fx.now;
						}
					} else if (that.options.heightStyle !== "content") {
						fx.now = Math.round(total - toHide.outerHeight() - adjust);
						adjust = 0;
					}
				}
			});
		},

		_toggleComplete: function _toggleComplete(data) {
			var toHide = data.oldPanel,
			    prev = toHide.prev();

			this._removeClass(toHide, "ui-accordion-content-active");
			this._removeClass(prev, "ui-accordion-header-active")._addClass(prev, "ui-accordion-header-collapsed");

			// Work around for rendering bug in IE (#5421)
			if (toHide.length) {
				toHide.parent()[0].className = toHide.parent()[0].className;
			}
			this._trigger("activate", null, data);
		}
	});

	var safeActiveElement = $.ui.safeActiveElement = function (document) {
		var activeElement;

		// Support: IE 9 only
		// IE9 throws an "Unspecified error" accessing document.activeElement from an <iframe>
		try {
			activeElement = document.activeElement;
		} catch (error) {
			activeElement = document.body;
		}

		// Support: IE 9 - 11 only
		// IE may return null instead of an element
		// Interestingly, this only seems to occur when NOT in an iframe
		if (!activeElement) {
			activeElement = document.body;
		}

		// Support: IE 11 only
		// IE11 returns a seemingly empty object in some cases when accessing
		// document.activeElement from an <iframe>
		if (!activeElement.nodeName) {
			activeElement = document.body;
		}

		return activeElement;
	};

	/*!
  * jQuery UI Menu 1.12.1
  * http://jqueryui.com
  *
  * Copyright jQuery Foundation and other contributors
  * Released under the MIT license.
  * http://jquery.org/license
  */

	//>>label: Menu
	//>>group: Widgets
	//>>description: Creates nestable menus.
	//>>docs: http://api.jqueryui.com/menu/
	//>>demos: http://jqueryui.com/menu/
	//>>css.structure: ../../themes/base/core.css
	//>>css.structure: ../../themes/base/menu.css
	//>>css.theme: ../../themes/base/theme.css


	var widgetsMenu = $.widget("ui.menu", {
		version: "1.12.1",
		defaultElement: "<ul>",
		delay: 300,
		options: {
			icons: {
				submenu: "ui-icon-caret-1-e"
			},
			items: "> *",
			menus: "ul",
			position: {
				my: "left top",
				at: "right top"
			},
			role: "menu",

			// Callbacks
			blur: null,
			focus: null,
			select: null
		},

		_create: function _create() {
			this.activeMenu = this.element;

			// Flag used to prevent firing of the click handler
			// as the event bubbles up through nested menus
			this.mouseHandled = false;
			this.element.uniqueId().attr({
				role: this.options.role,
				tabIndex: 0
			});

			this._addClass("ui-menu", "ui-widget ui-widget-content");
			this._on({

				// Prevent focus from sticking to links inside menu after clicking
				// them (focus should always stay on UL during navigation).
				"mousedown .ui-menu-item": function mousedownUiMenuItem(event) {
					event.preventDefault();
				},
				"click .ui-menu-item": function clickUiMenuItem(event) {
					var target = $(event.target);
					var active = $($.ui.safeActiveElement(this.document[0]));
					if (!this.mouseHandled && target.not(".ui-state-disabled").length) {
						this.select(event);

						// Only set the mouseHandled flag if the event will bubble, see #9469.
						if (!event.isPropagationStopped()) {
							this.mouseHandled = true;
						}

						// Open submenu on click
						if (target.has(".ui-menu").length) {
							this.expand(event);
						} else if (!this.element.is(":focus") && active.closest(".ui-menu").length) {

							// Redirect focus to the menu
							this.element.trigger("focus", [true]);

							// If the active item is on the top level, let it stay active.
							// Otherwise, blur the active item since it is no longer visible.
							if (this.active && this.active.parents(".ui-menu").length === 1) {
								clearTimeout(this.timer);
							}
						}
					}
				},
				"mouseenter .ui-menu-item": function mouseenterUiMenuItem(event) {

					// Ignore mouse events while typeahead is active, see #10458.
					// Prevents focusing the wrong item when typeahead causes a scroll while the mouse
					// is over an item in the menu
					if (this.previousFilter) {
						return;
					}

					var actualTarget = $(event.target).closest(".ui-menu-item"),
					    target = $(event.currentTarget);

					// Ignore bubbled events on parent items, see #11641
					if (actualTarget[0] !== target[0]) {
						return;
					}

					// Remove ui-state-active class from siblings of the newly focused menu item
					// to avoid a jump caused by adjacent elements both having a class with a border
					this._removeClass(target.siblings().children(".ui-state-active"), null, "ui-state-active");
					this.focus(event, target);
				},
				mouseleave: "collapseAll",
				"mouseleave .ui-menu": "collapseAll",
				focus: function focus(event, keepActiveItem) {

					// If there's already an active item, keep it active
					// If not, activate the first item
					var item = this.active || this.element.find(this.options.items).eq(0);

					if (!keepActiveItem) {
						this.focus(event, item);
					}
				},
				blur: function blur(event) {
					this._delay(function () {
						var notContained = !$.contains(this.element[0], $.ui.safeActiveElement(this.document[0]));
						if (notContained) {
							this.collapseAll(event);
						}
					});
				},
				keydown: "_keydown"
			});

			this.refresh();

			// Clicks outside of a menu collapse any open menus
			this._on(this.document, {
				click: function click(event) {
					if (this._closeOnDocumentClick(event)) {
						this.collapseAll(event);
					}

					// Reset the mouseHandled flag
					this.mouseHandled = false;
				}
			});
		},

		_destroy: function _destroy() {
			var items = this.element.find(".ui-menu-item").removeAttr("role aria-disabled"),
			    submenus = items.children(".ui-menu-item-wrapper").removeUniqueId().removeAttr("tabIndex role aria-haspopup");

			// Destroy (sub)menus
			this.element.removeAttr("aria-activedescendant").find(".ui-menu").addBack().removeAttr("role aria-labelledby aria-expanded aria-hidden aria-disabled " + "tabIndex").removeUniqueId().show();

			submenus.children().each(function () {
				var elem = $(this);
				if (elem.data("ui-menu-submenu-caret")) {
					elem.remove();
				}
			});
		},

		_keydown: function _keydown(event) {
			var match,
			    prev,
			    character,
			    skip,
			    preventDefault = true;

			switch (event.keyCode) {
				case $.ui.keyCode.PAGE_UP:
					this.previousPage(event);
					break;
				case $.ui.keyCode.PAGE_DOWN:
					this.nextPage(event);
					break;
				case $.ui.keyCode.HOME:
					this._move("first", "first", event);
					break;
				case $.ui.keyCode.END:
					this._move("last", "last", event);
					break;
				case $.ui.keyCode.UP:
					this.previous(event);
					break;
				case $.ui.keyCode.DOWN:
					this.next(event);
					break;
				case $.ui.keyCode.LEFT:
					this.collapse(event);
					break;
				case $.ui.keyCode.RIGHT:
					if (this.active && !this.active.is(".ui-state-disabled")) {
						this.expand(event);
					}
					break;
				case $.ui.keyCode.ENTER:
				case $.ui.keyCode.SPACE:
					this._activate(event);
					break;
				case $.ui.keyCode.ESCAPE:
					this.collapse(event);
					break;
				default:
					preventDefault = false;
					prev = this.previousFilter || "";
					skip = false;

					// Support number pad values
					character = event.keyCode >= 96 && event.keyCode <= 105 ? (event.keyCode - 96).toString() : String.fromCharCode(event.keyCode);

					clearTimeout(this.filterTimer);

					if (character === prev) {
						skip = true;
					} else {
						character = prev + character;
					}

					match = this._filterMenuItems(character);
					match = skip && match.index(this.active.next()) !== -1 ? this.active.nextAll(".ui-menu-item") : match;

					// If no matches on the current filter, reset to the last character pressed
					// to move down the menu to the first item that starts with that character
					if (!match.length) {
						character = String.fromCharCode(event.keyCode);
						match = this._filterMenuItems(character);
					}

					if (match.length) {
						this.focus(event, match);
						this.previousFilter = character;
						this.filterTimer = this._delay(function () {
							delete this.previousFilter;
						}, 1000);
					} else {
						delete this.previousFilter;
					}
			}

			if (preventDefault) {
				event.preventDefault();
			}
		},

		_activate: function _activate(event) {
			if (this.active && !this.active.is(".ui-state-disabled")) {
				if (this.active.children("[aria-haspopup='true']").length) {
					this.expand(event);
				} else {
					this.select(event);
				}
			}
		},

		refresh: function refresh() {
			var menus,
			    items,
			    newSubmenus,
			    newItems,
			    newWrappers,
			    that = this,
			    icon = this.options.icons.submenu,
			    submenus = this.element.find(this.options.menus);

			this._toggleClass("ui-menu-icons", null, !!this.element.find(".ui-icon").length);

			// Initialize nested menus
			newSubmenus = submenus.filter(":not(.ui-menu)").hide().attr({
				role: this.options.role,
				"aria-hidden": "true",
				"aria-expanded": "false"
			}).each(function () {
				var menu = $(this),
				    item = menu.prev(),
				    submenuCaret = $("<span>").data("ui-menu-submenu-caret", true);

				that._addClass(submenuCaret, "ui-menu-icon", "ui-icon " + icon);
				item.attr("aria-haspopup", "true").prepend(submenuCaret);
				menu.attr("aria-labelledby", item.attr("id"));
			});

			this._addClass(newSubmenus, "ui-menu", "ui-widget ui-widget-content ui-front");

			menus = submenus.add(this.element);
			items = menus.find(this.options.items);

			// Initialize menu-items containing spaces and/or dashes only as dividers
			items.not(".ui-menu-item").each(function () {
				var item = $(this);
				if (that._isDivider(item)) {
					that._addClass(item, "ui-menu-divider", "ui-widget-content");
				}
			});

			// Don't refresh list items that are already adapted
			newItems = items.not(".ui-menu-item, .ui-menu-divider");
			newWrappers = newItems.children().not(".ui-menu").uniqueId().attr({
				tabIndex: -1,
				role: this._itemRole()
			});
			this._addClass(newItems, "ui-menu-item")._addClass(newWrappers, "ui-menu-item-wrapper");

			// Add aria-disabled attribute to any disabled menu item
			items.filter(".ui-state-disabled").attr("aria-disabled", "true");

			// If the active item has been removed, blur the menu
			if (this.active && !$.contains(this.element[0], this.active[0])) {
				this.blur();
			}
		},

		_itemRole: function _itemRole() {
			return {
				menu: "menuitem",
				listbox: "option"
			}[this.options.role];
		},

		_setOption: function _setOption(key, value) {
			if (key === "icons") {
				var icons = this.element.find(".ui-menu-icon");
				this._removeClass(icons, null, this.options.icons.submenu)._addClass(icons, null, value.submenu);
			}
			this._super(key, value);
		},

		_setOptionDisabled: function _setOptionDisabled(value) {
			this._super(value);

			this.element.attr("aria-disabled", String(value));
			this._toggleClass(null, "ui-state-disabled", !!value);
		},

		focus: function focus(event, item) {
			var nested, focused, activeParent;
			this.blur(event, event && event.type === "focus");

			this._scrollIntoView(item);

			this.active = item.first();

			focused = this.active.children(".ui-menu-item-wrapper");
			this._addClass(focused, null, "ui-state-active");

			// Only update aria-activedescendant if there's a role
			// otherwise we assume focus is managed elsewhere
			if (this.options.role) {
				this.element.attr("aria-activedescendant", focused.attr("id"));
			}

			// Highlight active parent menu item, if any
			activeParent = this.active.parent().closest(".ui-menu-item").children(".ui-menu-item-wrapper");
			this._addClass(activeParent, null, "ui-state-active");

			if (event && event.type === "keydown") {
				this._close();
			} else {
				this.timer = this._delay(function () {
					this._close();
				}, this.delay);
			}

			nested = item.children(".ui-menu");
			if (nested.length && event && /^mouse/.test(event.type)) {
				this._startOpening(nested);
			}
			this.activeMenu = item.parent();

			this._trigger("focus", event, { item: item });
		},

		_scrollIntoView: function _scrollIntoView(item) {
			var borderTop, paddingTop, offset, scroll, elementHeight, itemHeight;
			if (this._hasScroll()) {
				borderTop = parseFloat($.css(this.activeMenu[0], "borderTopWidth")) || 0;
				paddingTop = parseFloat($.css(this.activeMenu[0], "paddingTop")) || 0;
				offset = item.offset().top - this.activeMenu.offset().top - borderTop - paddingTop;
				scroll = this.activeMenu.scrollTop();
				elementHeight = this.activeMenu.height();
				itemHeight = item.outerHeight();

				if (offset < 0) {
					this.activeMenu.scrollTop(scroll + offset);
				} else if (offset + itemHeight > elementHeight) {
					this.activeMenu.scrollTop(scroll + offset - elementHeight + itemHeight);
				}
			}
		},

		blur: function blur(event, fromFocus) {
			if (!fromFocus) {
				clearTimeout(this.timer);
			}

			if (!this.active) {
				return;
			}

			this._removeClass(this.active.children(".ui-menu-item-wrapper"), null, "ui-state-active");

			this._trigger("blur", event, { item: this.active });
			this.active = null;
		},

		_startOpening: function _startOpening(submenu) {
			clearTimeout(this.timer);

			// Don't open if already open fixes a Firefox bug that caused a .5 pixel
			// shift in the submenu position when mousing over the caret icon
			if (submenu.attr("aria-hidden") !== "true") {
				return;
			}

			this.timer = this._delay(function () {
				this._close();
				this._open(submenu);
			}, this.delay);
		},

		_open: function _open(submenu) {
			var position = $.extend({
				of: this.active
			}, this.options.position);

			clearTimeout(this.timer);
			this.element.find(".ui-menu").not(submenu.parents(".ui-menu")).hide().attr("aria-hidden", "true");

			submenu.show().removeAttr("aria-hidden").attr("aria-expanded", "true").position(position);
		},

		collapseAll: function collapseAll(event, all) {
			clearTimeout(this.timer);
			this.timer = this._delay(function () {

				// If we were passed an event, look for the submenu that contains the event
				var currentMenu = all ? this.element : $(event && event.target).closest(this.element.find(".ui-menu"));

				// If we found no valid submenu ancestor, use the main menu to close all
				// sub menus anyway
				if (!currentMenu.length) {
					currentMenu = this.element;
				}

				this._close(currentMenu);

				this.blur(event);

				// Work around active item staying active after menu is blurred
				this._removeClass(currentMenu.find(".ui-state-active"), null, "ui-state-active");

				this.activeMenu = currentMenu;
			}, this.delay);
		},

		// With no arguments, closes the currently active menu - if nothing is active
		// it closes all menus.  If passed an argument, it will search for menus BELOW
		_close: function _close(startMenu) {
			if (!startMenu) {
				startMenu = this.active ? this.active.parent() : this.element;
			}

			startMenu.find(".ui-menu").hide().attr("aria-hidden", "true").attr("aria-expanded", "false");
		},

		_closeOnDocumentClick: function _closeOnDocumentClick(event) {
			return !$(event.target).closest(".ui-menu").length;
		},

		_isDivider: function _isDivider(item) {

			// Match hyphen, em dash, en dash
			return !/[^\-\u2014\u2013\s]/.test(item.text());
		},

		collapse: function collapse(event) {
			var newItem = this.active && this.active.parent().closest(".ui-menu-item", this.element);
			if (newItem && newItem.length) {
				this._close();
				this.focus(event, newItem);
			}
		},

		expand: function expand(event) {
			var newItem = this.active && this.active.children(".ui-menu ").find(this.options.items).first();

			if (newItem && newItem.length) {
				this._open(newItem.parent());

				// Delay so Firefox will not hide activedescendant change in expanding submenu from AT
				this._delay(function () {
					this.focus(event, newItem);
				});
			}
		},

		next: function next(event) {
			this._move("next", "first", event);
		},

		previous: function previous(event) {
			this._move("prev", "last", event);
		},

		isFirstItem: function isFirstItem() {
			return this.active && !this.active.prevAll(".ui-menu-item").length;
		},

		isLastItem: function isLastItem() {
			return this.active && !this.active.nextAll(".ui-menu-item").length;
		},

		_move: function _move(direction, filter, event) {
			var next;
			if (this.active) {
				if (direction === "first" || direction === "last") {
					next = this.active[direction === "first" ? "prevAll" : "nextAll"](".ui-menu-item").eq(-1);
				} else {
					next = this.active[direction + "All"](".ui-menu-item").eq(0);
				}
			}
			if (!next || !next.length || !this.active) {
				next = this.activeMenu.find(this.options.items)[filter]();
			}

			this.focus(event, next);
		},

		nextPage: function nextPage(event) {
			var item, base, height;

			if (!this.active) {
				this.next(event);
				return;
			}
			if (this.isLastItem()) {
				return;
			}
			if (this._hasScroll()) {
				base = this.active.offset().top;
				height = this.element.height();
				this.active.nextAll(".ui-menu-item").each(function () {
					item = $(this);
					return item.offset().top - base - height < 0;
				});

				this.focus(event, item);
			} else {
				this.focus(event, this.activeMenu.find(this.options.items)[!this.active ? "first" : "last"]());
			}
		},

		previousPage: function previousPage(event) {
			var item, base, height;
			if (!this.active) {
				this.next(event);
				return;
			}
			if (this.isFirstItem()) {
				return;
			}
			if (this._hasScroll()) {
				base = this.active.offset().top;
				height = this.element.height();
				this.active.prevAll(".ui-menu-item").each(function () {
					item = $(this);
					return item.offset().top - base + height > 0;
				});

				this.focus(event, item);
			} else {
				this.focus(event, this.activeMenu.find(this.options.items).first());
			}
		},

		_hasScroll: function _hasScroll() {
			return this.element.outerHeight() < this.element.prop("scrollHeight");
		},

		select: function select(event) {

			// TODO: It should never be possible to not have an active item at this
			// point, but the tests don't trigger mouseenter before click.
			this.active = this.active || $(event.target).closest(".ui-menu-item");
			var ui = { item: this.active };
			if (!this.active.has(".ui-menu").length) {
				this.collapseAll(event, true);
			}
			this._trigger("select", event, ui);
		},

		_filterMenuItems: function _filterMenuItems(character) {
			var escapedCharacter = character.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&"),
			    regex = new RegExp("^" + escapedCharacter, "i");

			return this.activeMenu.find(this.options.items)

			// Only match on items, not dividers or other content (#10571)
			.filter(".ui-menu-item").filter(function () {
				return regex.test($.trim($(this).children(".ui-menu-item-wrapper").text()));
			});
		}
	});

	// This file is deprecated
	var ie = $.ui.ie = !!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase());

	/*!
  * jQuery UI Mouse 1.12.1
  * http://jqueryui.com
  *
  * Copyright jQuery Foundation and other contributors
  * Released under the MIT license.
  * http://jquery.org/license
  */

	//>>label: Mouse
	//>>group: Widgets
	//>>description: Abstracts mouse-based interactions to assist in creating certain widgets.
	//>>docs: http://api.jqueryui.com/mouse/


	var mouseHandled = false;
	$(document).on("mouseup", function () {
		mouseHandled = false;
	});

	var widgetsMouse = $.widget("ui.mouse", {
		version: "1.12.1",
		options: {
			cancel: "input, textarea, button, select, option",
			distance: 1,
			delay: 0
		},
		_mouseInit: function _mouseInit() {
			var that = this;

			this.element.on("mousedown." + this.widgetName, function (event) {
				return that._mouseDown(event);
			}).on("click." + this.widgetName, function (event) {
				if (true === $.data(event.target, that.widgetName + ".preventClickEvent")) {
					$.removeData(event.target, that.widgetName + ".preventClickEvent");
					event.stopImmediatePropagation();
					return false;
				}
			});

			this.started = false;
		},

		// TODO: make sure destroying one instance of mouse doesn't mess with
		// other instances of mouse
		_mouseDestroy: function _mouseDestroy() {
			this.element.off("." + this.widgetName);
			if (this._mouseMoveDelegate) {
				this.document.off("mousemove." + this.widgetName, this._mouseMoveDelegate).off("mouseup." + this.widgetName, this._mouseUpDelegate);
			}
		},

		_mouseDown: function _mouseDown(event) {

			// don't let more than one widget handle mouseStart
			if (mouseHandled) {
				return;
			}

			this._mouseMoved = false;

			// We may have missed mouseup (out of window)
			this._mouseStarted && this._mouseUp(event);

			this._mouseDownEvent = event;

			var that = this,
			    btnIsLeft = event.which === 1,


			// event.target.nodeName works around a bug in IE 8 with
			// disabled inputs (#7620)
			elIsCancel = typeof this.options.cancel === "string" && event.target.nodeName ? $(event.target).closest(this.options.cancel).length : false;
			if (!btnIsLeft || elIsCancel || !this._mouseCapture(event)) {
				return true;
			}

			this.mouseDelayMet = !this.options.delay;
			if (!this.mouseDelayMet) {
				this._mouseDelayTimer = setTimeout(function () {
					that.mouseDelayMet = true;
				}, this.options.delay);
			}

			if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
				this._mouseStarted = this._mouseStart(event) !== false;
				if (!this._mouseStarted) {
					event.preventDefault();
					return true;
				}
			}

			// Click event may never have fired (Gecko & Opera)
			if (true === $.data(event.target, this.widgetName + ".preventClickEvent")) {
				$.removeData(event.target, this.widgetName + ".preventClickEvent");
			}

			// These delegates are required to keep context
			this._mouseMoveDelegate = function (event) {
				return that._mouseMove(event);
			};
			this._mouseUpDelegate = function (event) {
				return that._mouseUp(event);
			};

			this.document.on("mousemove." + this.widgetName, this._mouseMoveDelegate).on("mouseup." + this.widgetName, this._mouseUpDelegate);

			event.preventDefault();

			mouseHandled = true;
			return true;
		},

		_mouseMove: function _mouseMove(event) {

			// Only check for mouseups outside the document if you've moved inside the document
			// at least once. This prevents the firing of mouseup in the case of IE<9, which will
			// fire a mousemove event if content is placed under the cursor. See #7778
			// Support: IE <9
			if (this._mouseMoved) {

				// IE mouseup check - mouseup happened when mouse was out of window
				if ($.ui.ie && (!document.documentMode || document.documentMode < 9) && !event.button) {
					return this._mouseUp(event);

					// Iframe mouseup check - mouseup occurred in another document
				} else if (!event.which) {

					// Support: Safari <=8 - 9
					// Safari sets which to 0 if you press any of the following keys
					// during a drag (#14461)
					if (event.originalEvent.altKey || event.originalEvent.ctrlKey || event.originalEvent.metaKey || event.originalEvent.shiftKey) {
						this.ignoreMissingWhich = true;
					} else if (!this.ignoreMissingWhich) {
						return this._mouseUp(event);
					}
				}
			}

			if (event.which || event.button) {
				this._mouseMoved = true;
			}

			if (this._mouseStarted) {
				this._mouseDrag(event);
				return event.preventDefault();
			}

			if (this._mouseDistanceMet(event) && this._mouseDelayMet(event)) {
				this._mouseStarted = this._mouseStart(this._mouseDownEvent, event) !== false;
				this._mouseStarted ? this._mouseDrag(event) : this._mouseUp(event);
			}

			return !this._mouseStarted;
		},

		_mouseUp: function _mouseUp(event) {
			this.document.off("mousemove." + this.widgetName, this._mouseMoveDelegate).off("mouseup." + this.widgetName, this._mouseUpDelegate);

			if (this._mouseStarted) {
				this._mouseStarted = false;

				if (event.target === this._mouseDownEvent.target) {
					$.data(event.target, this.widgetName + ".preventClickEvent", true);
				}

				this._mouseStop(event);
			}

			if (this._mouseDelayTimer) {
				clearTimeout(this._mouseDelayTimer);
				delete this._mouseDelayTimer;
			}

			this.ignoreMissingWhich = false;
			mouseHandled = false;
			event.preventDefault();
		},

		_mouseDistanceMet: function _mouseDistanceMet(event) {
			return Math.max(Math.abs(this._mouseDownEvent.pageX - event.pageX), Math.abs(this._mouseDownEvent.pageY - event.pageY)) >= this.options.distance;
		},

		_mouseDelayMet: function _mouseDelayMet() /* event */{
			return this.mouseDelayMet;
		},

		// These are placeholder methods, to be overriden by extending plugin
		_mouseStart: function _mouseStart() /* event */{},
		_mouseDrag: function _mouseDrag() /* event */{},
		_mouseStop: function _mouseStop() /* event */{},
		_mouseCapture: function _mouseCapture() /* event */{
			return true;
		}
	});

	/*!
  * jQuery UI Selectmenu 1.12.1
  * http://jqueryui.com
  *
  * Copyright jQuery Foundation and other contributors
  * Released under the MIT license.
  * http://jquery.org/license
  */

	//>>label: Selectmenu
	//>>group: Widgets
	// jscs:disable maximumLineLength
	//>>description: Duplicates and extends the functionality of a native HTML select element, allowing it to be customizable in behavior and appearance far beyond the limitations of a native select.
	// jscs:enable maximumLineLength
	//>>docs: http://api.jqueryui.com/selectmenu/
	//>>demos: http://jqueryui.com/selectmenu/
	//>>css.structure: ../../themes/base/core.css
	//>>css.structure: ../../themes/base/selectmenu.css, ../../themes/base/button.css
	//>>css.theme: ../../themes/base/theme.css


	var widgetsSelectmenu = $.widget("ui.selectmenu", [$.ui.formResetMixin, {
		version: "1.12.1",
		defaultElement: "<select>",
		options: {
			appendTo: null,
			classes: {
				"ui-selectmenu-button-open": "ui-corner-top",
				"ui-selectmenu-button-closed": "ui-corner-all"
			},
			disabled: null,
			icons: {
				button: "ui-icon-triangle-1-s"
			},
			position: {
				my: "left top",
				at: "left bottom",
				collision: "none"
			},
			width: false,

			// Callbacks
			change: null,
			close: null,
			focus: null,
			open: null,
			select: null
		},

		_create: function _create() {
			var selectmenuId = this.element.uniqueId().attr("id");
			this.ids = {
				element: selectmenuId,
				button: selectmenuId + "-button",
				menu: selectmenuId + "-menu"
			};

			this._drawButton();
			this._drawMenu();
			this._bindFormResetHandler();

			this._rendered = false;
			this.menuItems = $();
		},

		_drawButton: function _drawButton() {
			var icon,
			    that = this,
			    item = this._parseOption(this.element.find("option:selected"), this.element[0].selectedIndex);

			// Associate existing label with the new button
			this.labels = this.element.labels().attr("for", this.ids.button);
			this._on(this.labels, {
				click: function click(event) {
					this.button.focus();
					event.preventDefault();
				}
			});

			// Hide original select element
			this.element.hide();

			// Create button
			this.button = $("<span>", {
				tabindex: this.options.disabled ? -1 : 0,
				id: this.ids.button,
				role: "combobox",
				"aria-expanded": "false",
				"aria-autocomplete": "list",
				"aria-owns": this.ids.menu,
				"aria-haspopup": "true",
				title: this.element.attr("title")
			}).insertAfter(this.element);

			this._addClass(this.button, "ui-selectmenu-button ui-selectmenu-button-closed", "ui-button ui-widget");

			icon = $("<span>").appendTo(this.button);
			this._addClass(icon, "ui-selectmenu-icon", "ui-icon " + this.options.icons.button);
			this.buttonItem = this._renderButtonItem(item).appendTo(this.button);

			if (this.options.width !== false) {
				this._resizeButton();
			}

			this._on(this.button, this._buttonEvents);
			this.button.one("focusin", function () {

				// Delay rendering the menu items until the button receives focus.
				// The menu may have already been rendered via a programmatic open.
				if (!that._rendered) {
					that._refreshMenu();
				}
			});
		},

		_drawMenu: function _drawMenu() {
			var that = this;

			// Create menu
			this.menu = $("<ul>", {
				"aria-hidden": "true",
				"aria-labelledby": this.ids.button,
				id: this.ids.menu
			});

			// Wrap menu
			this.menuWrap = $("<div>").append(this.menu);
			this._addClass(this.menuWrap, "ui-selectmenu-menu", "ui-front");
			this.menuWrap.appendTo(this._appendTo());

			// Initialize menu widget
			this.menuInstance = this.menu.menu({
				classes: {
					"ui-menu": "ui-corner-bottom"
				},
				role: "listbox",
				select: function select(event, ui) {
					event.preventDefault();

					// Support: IE8
					// If the item was selected via a click, the text selection
					// will be destroyed in IE
					that._setSelection();

					that._select(ui.item.data("ui-selectmenu-item"), event);
				},
				focus: function focus(event, ui) {
					var item = ui.item.data("ui-selectmenu-item");

					// Prevent inital focus from firing and check if its a newly focused item
					if (that.focusIndex != null && item.index !== that.focusIndex) {
						that._trigger("focus", event, { item: item });
						if (!that.isOpen) {
							that._select(item, event);
						}
					}
					that.focusIndex = item.index;

					that.button.attr("aria-activedescendant", that.menuItems.eq(item.index).attr("id"));
				}
			}).menu("instance");

			// Don't close the menu on mouseleave
			this.menuInstance._off(this.menu, "mouseleave");

			// Cancel the menu's collapseAll on document click
			this.menuInstance._closeOnDocumentClick = function () {
				return false;
			};

			// Selects often contain empty items, but never contain dividers
			this.menuInstance._isDivider = function () {
				return false;
			};
		},

		refresh: function refresh() {
			this._refreshMenu();
			this.buttonItem.replaceWith(this.buttonItem = this._renderButtonItem(

			// Fall back to an empty object in case there are no options
			this._getSelectedItem().data("ui-selectmenu-item") || {}));
			if (this.options.width === null) {
				this._resizeButton();
			}
		},

		_refreshMenu: function _refreshMenu() {
			var item,
			    options = this.element.find("option");

			this.menu.empty();

			this._parseOptions(options);
			this._renderMenu(this.menu, this.items);

			this.menuInstance.refresh();
			this.menuItems = this.menu.find("li").not(".ui-selectmenu-optgroup").find(".ui-menu-item-wrapper");

			this._rendered = true;

			if (!options.length) {
				return;
			}

			item = this._getSelectedItem();

			// Update the menu to have the correct item focused
			this.menuInstance.focus(null, item);
			this._setAria(item.data("ui-selectmenu-item"));

			// Set disabled state
			this._setOption("disabled", this.element.prop("disabled"));
		},

		open: function open(event) {
			if (this.options.disabled) {
				return;
			}

			// If this is the first time the menu is being opened, render the items
			if (!this._rendered) {
				this._refreshMenu();
			} else {

				// Menu clears focus on close, reset focus to selected item
				this._removeClass(this.menu.find(".ui-state-active"), null, "ui-state-active");
				this.menuInstance.focus(null, this._getSelectedItem());
			}

			// If there are no options, don't open the menu
			if (!this.menuItems.length) {
				return;
			}

			this.isOpen = true;
			this._toggleAttr();
			this._resizeMenu();
			this._position();

			this._on(this.document, this._documentClick);

			this._trigger("open", event);
		},

		_position: function _position() {
			this.menuWrap.position($.extend({ of: this.button }, this.options.position));
		},

		close: function close(event) {
			if (!this.isOpen) {
				return;
			}

			this.isOpen = false;
			this._toggleAttr();

			this.range = null;
			this._off(this.document);

			this._trigger("close", event);
		},

		widget: function widget() {
			return this.button;
		},

		menuWidget: function menuWidget() {
			return this.menu;
		},

		_renderButtonItem: function _renderButtonItem(item) {
			var buttonItem = $("<span>");

			this._setText(buttonItem, item.label);
			this._addClass(buttonItem, "ui-selectmenu-text");

			return buttonItem;
		},

		_renderMenu: function _renderMenu(ul, items) {
			var that = this,
			    currentOptgroup = "";

			$.each(items, function (index, item) {
				var li;

				if (item.optgroup !== currentOptgroup) {
					li = $("<li>", {
						text: item.optgroup
					});
					that._addClass(li, "ui-selectmenu-optgroup", "ui-menu-divider" + (item.element.parent("optgroup").prop("disabled") ? " ui-state-disabled" : ""));

					li.appendTo(ul);

					currentOptgroup = item.optgroup;
				}

				that._renderItemData(ul, item);
			});
		},

		_renderItemData: function _renderItemData(ul, item) {
			return this._renderItem(ul, item).data("ui-selectmenu-item", item);
		},

		_renderItem: function _renderItem(ul, item) {
			var li = $("<li>"),
			    wrapper = $("<div>", {
				title: item.element.attr("title")
			});

			if (item.disabled) {
				this._addClass(li, null, "ui-state-disabled");
			}
			this._setText(wrapper, item.label);

			return li.append(wrapper).appendTo(ul);
		},

		_setText: function _setText(element, value) {
			if (value) {
				element.text(value);
			} else {
				element.html("&#160;");
			}
		},

		_move: function _move(direction, event) {
			var item,
			    next,
			    filter = ".ui-menu-item";

			if (this.isOpen) {
				item = this.menuItems.eq(this.focusIndex).parent("li");
			} else {
				item = this.menuItems.eq(this.element[0].selectedIndex).parent("li");
				filter += ":not(.ui-state-disabled)";
			}

			if (direction === "first" || direction === "last") {
				next = item[direction === "first" ? "prevAll" : "nextAll"](filter).eq(-1);
			} else {
				next = item[direction + "All"](filter).eq(0);
			}

			if (next.length) {
				this.menuInstance.focus(event, next);
			}
		},

		_getSelectedItem: function _getSelectedItem() {
			return this.menuItems.eq(this.element[0].selectedIndex).parent("li");
		},

		_toggle: function _toggle(event) {
			this[this.isOpen ? "close" : "open"](event);
		},

		_setSelection: function _setSelection() {
			var selection;

			if (!this.range) {
				return;
			}

			if (window.getSelection) {
				selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange(this.range);

				// Support: IE8
			} else {
				this.range.select();
			}

			// Support: IE
			// Setting the text selection kills the button focus in IE, but
			// restoring the focus doesn't kill the selection.
			this.button.focus();
		},

		_documentClick: {
			mousedown: function mousedown(event) {
				if (!this.isOpen) {
					return;
				}

				if (!$(event.target).closest(".ui-selectmenu-menu, #" + $.ui.escapeSelector(this.ids.button)).length) {
					this.close(event);
				}
			}
		},

		_buttonEvents: {

			// Prevent text selection from being reset when interacting with the selectmenu (#10144)
			mousedown: function mousedown() {
				var selection;

				if (window.getSelection) {
					selection = window.getSelection();
					if (selection.rangeCount) {
						this.range = selection.getRangeAt(0);
					}

					// Support: IE8
				} else {
					this.range = document.selection.createRange();
				}
			},

			click: function click(event) {
				this._setSelection();
				this._toggle(event);
			},

			keydown: function keydown(event) {
				var preventDefault = true;
				switch (event.keyCode) {
					case $.ui.keyCode.TAB:
					case $.ui.keyCode.ESCAPE:
						this.close(event);
						preventDefault = false;
						break;
					case $.ui.keyCode.ENTER:
						if (this.isOpen) {
							this._selectFocusedItem(event);
						}
						break;
					case $.ui.keyCode.UP:
						if (event.altKey) {
							this._toggle(event);
						} else {
							this._move("prev", event);
						}
						break;
					case $.ui.keyCode.DOWN:
						if (event.altKey) {
							this._toggle(event);
						} else {
							this._move("next", event);
						}
						break;
					case $.ui.keyCode.SPACE:
						if (this.isOpen) {
							this._selectFocusedItem(event);
						} else {
							this._toggle(event);
						}
						break;
					case $.ui.keyCode.LEFT:
						this._move("prev", event);
						break;
					case $.ui.keyCode.RIGHT:
						this._move("next", event);
						break;
					case $.ui.keyCode.HOME:
					case $.ui.keyCode.PAGE_UP:
						this._move("first", event);
						break;
					case $.ui.keyCode.END:
					case $.ui.keyCode.PAGE_DOWN:
						this._move("last", event);
						break;
					default:
						this.menu.trigger(event);
						preventDefault = false;
				}

				if (preventDefault) {
					event.preventDefault();
				}
			}
		},

		_selectFocusedItem: function _selectFocusedItem(event) {
			var item = this.menuItems.eq(this.focusIndex).parent("li");
			if (!item.hasClass("ui-state-disabled")) {
				this._select(item.data("ui-selectmenu-item"), event);
			}
		},

		_select: function _select(item, event) {
			var oldIndex = this.element[0].selectedIndex;

			// Change native select element
			this.element[0].selectedIndex = item.index;
			this.buttonItem.replaceWith(this.buttonItem = this._renderButtonItem(item));
			this._setAria(item);
			this._trigger("select", event, { item: item });

			if (item.index !== oldIndex) {
				this._trigger("change", event, { item: item });
			}

			this.close(event);
		},

		_setAria: function _setAria(item) {
			var id = this.menuItems.eq(item.index).attr("id");

			this.button.attr({
				"aria-labelledby": id,
				"aria-activedescendant": id
			});
			this.menu.attr("aria-activedescendant", id);
		},

		_setOption: function _setOption(key, value) {
			if (key === "icons") {
				var icon = this.button.find("span.ui-icon");
				this._removeClass(icon, null, this.options.icons.button)._addClass(icon, null, value.button);
			}

			this._super(key, value);

			if (key === "appendTo") {
				this.menuWrap.appendTo(this._appendTo());
			}

			if (key === "width") {
				this._resizeButton();
			}
		},

		_setOptionDisabled: function _setOptionDisabled(value) {
			this._super(value);

			this.menuInstance.option("disabled", value);
			this.button.attr("aria-disabled", value);
			this._toggleClass(this.button, null, "ui-state-disabled", value);

			this.element.prop("disabled", value);
			if (value) {
				this.button.attr("tabindex", -1);
				this.close();
			} else {
				this.button.attr("tabindex", 0);
			}
		},

		_appendTo: function _appendTo() {
			var element = this.options.appendTo;

			if (element) {
				element = element.jquery || element.nodeType ? $(element) : this.document.find(element).eq(0);
			}

			if (!element || !element[0]) {
				element = this.element.closest(".ui-front, dialog");
			}

			if (!element.length) {
				element = this.document[0].body;
			}

			return element;
		},

		_toggleAttr: function _toggleAttr() {
			this.button.attr("aria-expanded", this.isOpen);

			// We can't use two _toggleClass() calls here, because we need to make sure
			// we always remove classes first and add them second, otherwise if both classes have the
			// same theme class, it will be removed after we add it.
			this._removeClass(this.button, "ui-selectmenu-button-" + (this.isOpen ? "closed" : "open"))._addClass(this.button, "ui-selectmenu-button-" + (this.isOpen ? "open" : "closed"))._toggleClass(this.menuWrap, "ui-selectmenu-open", null, this.isOpen);

			this.menu.attr("aria-hidden", !this.isOpen);
		},

		_resizeButton: function _resizeButton() {
			var width = this.options.width;

			// For `width: false`, just remove inline style and stop
			if (width === false) {
				this.button.css("width", "");
				return;
			}

			// For `width: null`, match the width of the original element
			if (width === null) {
				width = this.element.show().outerWidth();
				this.element.hide();
			}

			this.button.outerWidth(width);
		},

		_resizeMenu: function _resizeMenu() {
			this.menu.outerWidth(Math.max(this.button.outerWidth(),

			// Support: IE10
			// IE10 wraps long text (possibly a rounding bug)
			// so we add 1px to avoid the wrapping
			this.menu.width("").outerWidth() + 1));
		},

		_getCreateOptions: function _getCreateOptions() {
			var options = this._super();

			options.disabled = this.element.prop("disabled");

			return options;
		},

		_parseOptions: function _parseOptions(options) {
			var that = this,
			    data = [];
			options.each(function (index, item) {
				data.push(that._parseOption($(item), index));
			});
			this.items = data;
		},

		_parseOption: function _parseOption(option, index) {
			var optgroup = option.parent("optgroup");

			return {
				element: option,
				index: index,
				value: option.val(),
				label: option.text(),
				optgroup: optgroup.attr("label") || "",
				disabled: optgroup.prop("disabled") || option.prop("disabled")
			};
		},

		_destroy: function _destroy() {
			this._unbindFormResetHandler();
			this.menuWrap.remove();
			this.button.remove();
			this.element.show();
			this.element.removeUniqueId();
			this.labels.attr("for", this.ids.element);
		}
	}]);

	/*!
  * jQuery UI Slider 1.12.1
  * http://jqueryui.com
  *
  * Copyright jQuery Foundation and other contributors
  * Released under the MIT license.
  * http://jquery.org/license
  */

	//>>label: Slider
	//>>group: Widgets
	//>>description: Displays a flexible slider with ranges and accessibility via keyboard.
	//>>docs: http://api.jqueryui.com/slider/
	//>>demos: http://jqueryui.com/slider/
	//>>css.structure: ../../themes/base/core.css
	//>>css.structure: ../../themes/base/slider.css
	//>>css.theme: ../../themes/base/theme.css


	var widgetsSlider = $.widget("ui.slider", $.ui.mouse, {
		version: "1.12.1",
		widgetEventPrefix: "slide",

		options: {
			animate: false,
			classes: {
				"ui-slider": "ui-corner-all",
				"ui-slider-handle": "ui-corner-all",

				// Note: ui-widget-header isn't the most fittingly semantic framework class for this
				// element, but worked best visually with a variety of themes
				"ui-slider-range": "ui-corner-all ui-widget-header"
			},
			distance: 0,
			max: 100,
			min: 0,
			orientation: "horizontal",
			range: false,
			step: 1,
			value: 0,
			values: null,

			// Callbacks
			change: null,
			slide: null,
			start: null,
			stop: null
		},

		// Number of pages in a slider
		// (how many times can you page up/down to go through the whole range)
		numPages: 5,

		_create: function _create() {
			this._keySliding = false;
			this._mouseSliding = false;
			this._animateOff = true;
			this._handleIndex = null;
			this._detectOrientation();
			this._mouseInit();
			this._calculateNewMax();

			this._addClass("ui-slider ui-slider-" + this.orientation, "ui-widget ui-widget-content");

			this._refresh();

			this._animateOff = false;
		},

		_refresh: function _refresh() {
			this._createRange();
			this._createHandles();
			this._setupEvents();
			this._refreshValue();
		},

		_createHandles: function _createHandles() {
			var i,
			    handleCount,
			    options = this.options,
			    existingHandles = this.element.find(".ui-slider-handle"),
			    handle = "<span tabindex='0'></span>",
			    handles = [];

			handleCount = options.values && options.values.length || 1;

			if (existingHandles.length > handleCount) {
				existingHandles.slice(handleCount).remove();
				existingHandles = existingHandles.slice(0, handleCount);
			}

			for (i = existingHandles.length; i < handleCount; i++) {
				handles.push(handle);
			}

			this.handles = existingHandles.add($(handles.join("")).appendTo(this.element));

			this._addClass(this.handles, "ui-slider-handle", "ui-state-default");

			this.handle = this.handles.eq(0);

			this.handles.each(function (i) {
				$(this).data("ui-slider-handle-index", i).attr("tabIndex", 0);
			});
		},

		_createRange: function _createRange() {
			var options = this.options;

			if (options.range) {
				if (options.range === true) {
					if (!options.values) {
						options.values = [this._valueMin(), this._valueMin()];
					} else if (options.values.length && options.values.length !== 2) {
						options.values = [options.values[0], options.values[0]];
					} else if ($.isArray(options.values)) {
						options.values = options.values.slice(0);
					}
				}

				if (!this.range || !this.range.length) {
					this.range = $("<div>").appendTo(this.element);

					this._addClass(this.range, "ui-slider-range");
				} else {
					this._removeClass(this.range, "ui-slider-range-min ui-slider-range-max");

					// Handle range switching from true to min/max
					this.range.css({
						"left": "",
						"bottom": ""
					});
				}
				if (options.range === "min" || options.range === "max") {
					this._addClass(this.range, "ui-slider-range-" + options.range);
				}
			} else {
				if (this.range) {
					this.range.remove();
				}
				this.range = null;
			}
		},

		_setupEvents: function _setupEvents() {
			this._off(this.handles);
			this._on(this.handles, this._handleEvents);
			this._hoverable(this.handles);
			this._focusable(this.handles);
		},

		_destroy: function _destroy() {
			this.handles.remove();
			if (this.range) {
				this.range.remove();
			}

			this._mouseDestroy();
		},

		_mouseCapture: function _mouseCapture(event) {
			var position,
			    normValue,
			    distance,
			    closestHandle,
			    index,
			    allowed,
			    offset,
			    mouseOverHandle,
			    that = this,
			    o = this.options;

			if (o.disabled) {
				return false;
			}

			this.elementSize = {
				width: this.element.outerWidth(),
				height: this.element.outerHeight()
			};
			this.elementOffset = this.element.offset();

			position = { x: event.pageX, y: event.pageY };
			normValue = this._normValueFromMouse(position);
			distance = this._valueMax() - this._valueMin() + 1;
			this.handles.each(function (i) {
				var thisDistance = Math.abs(normValue - that.values(i));
				if (distance > thisDistance || distance === thisDistance && (i === that._lastChangedValue || that.values(i) === o.min)) {
					distance = thisDistance;
					closestHandle = $(this);
					index = i;
				}
			});

			allowed = this._start(event, index);
			if (allowed === false) {
				return false;
			}
			this._mouseSliding = true;

			this._handleIndex = index;

			this._addClass(closestHandle, null, "ui-state-active");
			closestHandle.trigger("focus");

			offset = closestHandle.offset();
			mouseOverHandle = !$(event.target).parents().addBack().is(".ui-slider-handle");
			this._clickOffset = mouseOverHandle ? { left: 0, top: 0 } : {
				left: event.pageX - offset.left - closestHandle.width() / 2,
				top: event.pageY - offset.top - closestHandle.height() / 2 - (parseInt(closestHandle.css("borderTopWidth"), 10) || 0) - (parseInt(closestHandle.css("borderBottomWidth"), 10) || 0) + (parseInt(closestHandle.css("marginTop"), 10) || 0)
			};

			if (!this.handles.hasClass("ui-state-hover")) {
				this._slide(event, index, normValue);
			}
			this._animateOff = true;
			return true;
		},

		_mouseStart: function _mouseStart() {
			return true;
		},

		_mouseDrag: function _mouseDrag(event) {
			var position = { x: event.pageX, y: event.pageY },
			    normValue = this._normValueFromMouse(position);

			this._slide(event, this._handleIndex, normValue);

			return false;
		},

		_mouseStop: function _mouseStop(event) {
			this._removeClass(this.handles, null, "ui-state-active");
			this._mouseSliding = false;

			this._stop(event, this._handleIndex);
			this._change(event, this._handleIndex);

			this._handleIndex = null;
			this._clickOffset = null;
			this._animateOff = false;

			return false;
		},

		_detectOrientation: function _detectOrientation() {
			this.orientation = this.options.orientation === "vertical" ? "vertical" : "horizontal";
		},

		_normValueFromMouse: function _normValueFromMouse(position) {
			var pixelTotal, pixelMouse, percentMouse, valueTotal, valueMouse;

			if (this.orientation === "horizontal") {
				pixelTotal = this.elementSize.width;
				pixelMouse = position.x - this.elementOffset.left - (this._clickOffset ? this._clickOffset.left : 0);
			} else {
				pixelTotal = this.elementSize.height;
				pixelMouse = position.y - this.elementOffset.top - (this._clickOffset ? this._clickOffset.top : 0);
			}

			percentMouse = pixelMouse / pixelTotal;
			if (percentMouse > 1) {
				percentMouse = 1;
			}
			if (percentMouse < 0) {
				percentMouse = 0;
			}
			if (this.orientation === "vertical") {
				percentMouse = 1 - percentMouse;
			}

			valueTotal = this._valueMax() - this._valueMin();
			valueMouse = this._valueMin() + percentMouse * valueTotal;

			return this._trimAlignValue(valueMouse);
		},

		_uiHash: function _uiHash(index, value, values) {
			var uiHash = {
				handle: this.handles[index],
				handleIndex: index,
				value: value !== undefined ? value : this.value()
			};

			if (this._hasMultipleValues()) {
				uiHash.value = value !== undefined ? value : this.values(index);
				uiHash.values = values || this.values();
			}

			return uiHash;
		},

		_hasMultipleValues: function _hasMultipleValues() {
			return this.options.values && this.options.values.length;
		},

		_start: function _start(event, index) {
			return this._trigger("start", event, this._uiHash(index));
		},

		_slide: function _slide(event, index, newVal) {
			var allowed,
			    otherVal,
			    currentValue = this.value(),
			    newValues = this.values();

			if (this._hasMultipleValues()) {
				otherVal = this.values(index ? 0 : 1);
				currentValue = this.values(index);

				if (this.options.values.length === 2 && this.options.range === true) {
					newVal = index === 0 ? Math.min(otherVal, newVal) : Math.max(otherVal, newVal);
				}

				newValues[index] = newVal;
			}

			if (newVal === currentValue) {
				return;
			}

			allowed = this._trigger("slide", event, this._uiHash(index, newVal, newValues));

			// A slide can be canceled by returning false from the slide callback
			if (allowed === false) {
				return;
			}

			if (this._hasMultipleValues()) {
				this.values(index, newVal);
			} else {
				this.value(newVal);
			}
		},

		_stop: function _stop(event, index) {
			this._trigger("stop", event, this._uiHash(index));
		},

		_change: function _change(event, index) {
			if (!this._keySliding && !this._mouseSliding) {

				//store the last changed value index for reference when handles overlap
				this._lastChangedValue = index;
				this._trigger("change", event, this._uiHash(index));
			}
		},

		value: function value(newValue) {
			if (arguments.length) {
				this.options.value = this._trimAlignValue(newValue);
				this._refreshValue();
				this._change(null, 0);
				return;
			}

			return this._value();
		},

		values: function values(index, newValue) {
			var vals, newValues, i;

			if (arguments.length > 1) {
				this.options.values[index] = this._trimAlignValue(newValue);
				this._refreshValue();
				this._change(null, index);
				return;
			}

			if (arguments.length) {
				if ($.isArray(arguments[0])) {
					vals = this.options.values;
					newValues = arguments[0];
					for (i = 0; i < vals.length; i += 1) {
						vals[i] = this._trimAlignValue(newValues[i]);
						this._change(null, i);
					}
					this._refreshValue();
				} else {
					if (this._hasMultipleValues()) {
						return this._values(index);
					} else {
						return this.value();
					}
				}
			} else {
				return this._values();
			}
		},

		_setOption: function _setOption(key, value) {
			var i,
			    valsLength = 0;

			if (key === "range" && this.options.range === true) {
				if (value === "min") {
					this.options.value = this._values(0);
					this.options.values = null;
				} else if (value === "max") {
					this.options.value = this._values(this.options.values.length - 1);
					this.options.values = null;
				}
			}

			if ($.isArray(this.options.values)) {
				valsLength = this.options.values.length;
			}

			this._super(key, value);

			switch (key) {
				case "orientation":
					this._detectOrientation();
					this._removeClass("ui-slider-horizontal ui-slider-vertical")._addClass("ui-slider-" + this.orientation);
					this._refreshValue();
					if (this.options.range) {
						this._refreshRange(value);
					}

					// Reset positioning from previous orientation
					this.handles.css(value === "horizontal" ? "bottom" : "left", "");
					break;
				case "value":
					this._animateOff = true;
					this._refreshValue();
					this._change(null, 0);
					this._animateOff = false;
					break;
				case "values":
					this._animateOff = true;
					this._refreshValue();

					// Start from the last handle to prevent unreachable handles (#9046)
					for (i = valsLength - 1; i >= 0; i--) {
						this._change(null, i);
					}
					this._animateOff = false;
					break;
				case "step":
				case "min":
				case "max":
					this._animateOff = true;
					this._calculateNewMax();
					this._refreshValue();
					this._animateOff = false;
					break;
				case "range":
					this._animateOff = true;
					this._refresh();
					this._animateOff = false;
					break;
			}
		},

		_setOptionDisabled: function _setOptionDisabled(value) {
			this._super(value);

			this._toggleClass(null, "ui-state-disabled", !!value);
		},

		//internal value getter
		// _value() returns value trimmed by min and max, aligned by step
		_value: function _value() {
			var val = this.options.value;
			val = this._trimAlignValue(val);

			return val;
		},

		//internal values getter
		// _values() returns array of values trimmed by min and max, aligned by step
		// _values( index ) returns single value trimmed by min and max, aligned by step
		_values: function _values(index) {
			var val, vals, i;

			if (arguments.length) {
				val = this.options.values[index];
				val = this._trimAlignValue(val);

				return val;
			} else if (this._hasMultipleValues()) {

				// .slice() creates a copy of the array
				// this copy gets trimmed by min and max and then returned
				vals = this.options.values.slice();
				for (i = 0; i < vals.length; i += 1) {
					vals[i] = this._trimAlignValue(vals[i]);
				}

				return vals;
			} else {
				return [];
			}
		},

		// Returns the step-aligned value that val is closest to, between (inclusive) min and max
		_trimAlignValue: function _trimAlignValue(val) {
			if (val <= this._valueMin()) {
				return this._valueMin();
			}
			if (val >= this._valueMax()) {
				return this._valueMax();
			}
			var step = this.options.step > 0 ? this.options.step : 1,
			    valModStep = (val - this._valueMin()) % step,
			    alignValue = val - valModStep;

			if (Math.abs(valModStep) * 2 >= step) {
				alignValue += valModStep > 0 ? step : -step;
			}

			// Since JavaScript has problems with large floats, round
			// the final value to 5 digits after the decimal point (see #4124)
			return parseFloat(alignValue.toFixed(5));
		},

		_calculateNewMax: function _calculateNewMax() {
			var max = this.options.max,
			    min = this._valueMin(),
			    step = this.options.step,
			    aboveMin = Math.round((max - min) / step) * step;
			max = aboveMin + min;
			if (max > this.options.max) {

				//If max is not divisible by step, rounding off may increase its value
				max -= step;
			}
			this.max = parseFloat(max.toFixed(this._precision()));
		},

		_precision: function _precision() {
			var precision = this._precisionOf(this.options.step);
			if (this.options.min !== null) {
				precision = Math.max(precision, this._precisionOf(this.options.min));
			}
			return precision;
		},

		_precisionOf: function _precisionOf(num) {
			var str = num.toString(),
			    decimal = str.indexOf(".");
			return decimal === -1 ? 0 : str.length - decimal - 1;
		},

		_valueMin: function _valueMin() {
			return this.options.min;
		},

		_valueMax: function _valueMax() {
			return this.max;
		},

		_refreshRange: function _refreshRange(orientation) {
			if (orientation === "vertical") {
				this.range.css({ "width": "", "left": "" });
			}
			if (orientation === "horizontal") {
				this.range.css({ "height": "", "bottom": "" });
			}
		},

		_refreshValue: function _refreshValue() {
			var lastValPercent,
			    valPercent,
			    value,
			    valueMin,
			    valueMax,
			    oRange = this.options.range,
			    o = this.options,
			    that = this,
			    animate = !this._animateOff ? o.animate : false,
			    _set = {};

			if (this._hasMultipleValues()) {
				this.handles.each(function (i) {
					valPercent = (that.values(i) - that._valueMin()) / (that._valueMax() - that._valueMin()) * 100;
					_set[that.orientation === "horizontal" ? "left" : "bottom"] = valPercent + "%";
					$(this).stop(1, 1)[animate ? "animate" : "css"](_set, o.animate);
					if (that.options.range === true) {
						if (that.orientation === "horizontal") {
							if (i === 0) {
								that.range.stop(1, 1)[animate ? "animate" : "css"]({
									left: valPercent + "%"
								}, o.animate);
							}
							if (i === 1) {
								that.range[animate ? "animate" : "css"]({
									width: valPercent - lastValPercent + "%"
								}, {
									queue: false,
									duration: o.animate
								});
							}
						} else {
							if (i === 0) {
								that.range.stop(1, 1)[animate ? "animate" : "css"]({
									bottom: valPercent + "%"
								}, o.animate);
							}
							if (i === 1) {
								that.range[animate ? "animate" : "css"]({
									height: valPercent - lastValPercent + "%"
								}, {
									queue: false,
									duration: o.animate
								});
							}
						}
					}
					lastValPercent = valPercent;
				});
			} else {
				value = this.value();
				valueMin = this._valueMin();
				valueMax = this._valueMax();
				valPercent = valueMax !== valueMin ? (value - valueMin) / (valueMax - valueMin) * 100 : 0;
				_set[this.orientation === "horizontal" ? "left" : "bottom"] = valPercent + "%";
				this.handle.stop(1, 1)[animate ? "animate" : "css"](_set, o.animate);

				if (oRange === "min" && this.orientation === "horizontal") {
					this.range.stop(1, 1)[animate ? "animate" : "css"]({
						width: valPercent + "%"
					}, o.animate);
				}
				if (oRange === "max" && this.orientation === "horizontal") {
					this.range.stop(1, 1)[animate ? "animate" : "css"]({
						width: 100 - valPercent + "%"
					}, o.animate);
				}
				if (oRange === "min" && this.orientation === "vertical") {
					this.range.stop(1, 1)[animate ? "animate" : "css"]({
						height: valPercent + "%"
					}, o.animate);
				}
				if (oRange === "max" && this.orientation === "vertical") {
					this.range.stop(1, 1)[animate ? "animate" : "css"]({
						height: 100 - valPercent + "%"
					}, o.animate);
				}
			}
		},

		_handleEvents: {
			keydown: function keydown(event) {
				var allowed,
				    curVal,
				    newVal,
				    step,
				    index = $(event.target).data("ui-slider-handle-index");

				switch (event.keyCode) {
					case $.ui.keyCode.HOME:
					case $.ui.keyCode.END:
					case $.ui.keyCode.PAGE_UP:
					case $.ui.keyCode.PAGE_DOWN:
					case $.ui.keyCode.UP:
					case $.ui.keyCode.RIGHT:
					case $.ui.keyCode.DOWN:
					case $.ui.keyCode.LEFT:
						event.preventDefault();
						if (!this._keySliding) {
							this._keySliding = true;
							this._addClass($(event.target), null, "ui-state-active");
							allowed = this._start(event, index);
							if (allowed === false) {
								return;
							}
						}
						break;
				}

				step = this.options.step;
				if (this._hasMultipleValues()) {
					curVal = newVal = this.values(index);
				} else {
					curVal = newVal = this.value();
				}

				switch (event.keyCode) {
					case $.ui.keyCode.HOME:
						newVal = this._valueMin();
						break;
					case $.ui.keyCode.END:
						newVal = this._valueMax();
						break;
					case $.ui.keyCode.PAGE_UP:
						newVal = this._trimAlignValue(curVal + (this._valueMax() - this._valueMin()) / this.numPages);
						break;
					case $.ui.keyCode.PAGE_DOWN:
						newVal = this._trimAlignValue(curVal - (this._valueMax() - this._valueMin()) / this.numPages);
						break;
					case $.ui.keyCode.UP:
					case $.ui.keyCode.RIGHT:
						if (curVal === this._valueMax()) {
							return;
						}
						newVal = this._trimAlignValue(curVal + step);
						break;
					case $.ui.keyCode.DOWN:
					case $.ui.keyCode.LEFT:
						if (curVal === this._valueMin()) {
							return;
						}
						newVal = this._trimAlignValue(curVal - step);
						break;
				}

				this._slide(event, index, newVal);
			},
			keyup: function keyup(event) {
				var index = $(event.target).data("ui-slider-handle-index");

				if (this._keySliding) {
					this._keySliding = false;
					this._stop(event, index);
					this._change(event, index);
					this._removeClass($(event.target), null, "ui-state-active");
				}
			}
		}
	});
});

'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * qTip2 - Pretty powerful tooltips - v3.0.3
 * http://qtip2.com
 *
 * Copyright (c) 2017 
 * Released under the MIT licenses
 * http://jquery.org/license
 *
 * Date: Wed Jan 4 2017 06:41 EST-0500
 * Plugins: tips viewport
 * Styles: core basic css3
 */
/*global window: false, jQuery: false, console: false, define: false */

/* Cache window, document, undefined */
(function (window, document, undefined) {

	// Uses AMD or browser globals to create a jQuery plugin.
	(function (factory) {
		"use strict";

		if (typeof define === 'function' && define.amd) {
			define(['jquery'], factory);
		} else if (jQuery && !jQuery.fn.qtip) {
			factory(jQuery);
		}
	})(function ($) {
		"use strict"; // Enable ECMAScript "strict" operation for this function. See more: http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/

		; // Munge the primitives - Paul Irish tip
		var TRUE = true,
		    FALSE = false,
		    NULL = null,


		// Common variables
		X = 'x',
		    Y = 'y',
		    WIDTH = 'width',
		    HEIGHT = 'height',


		// Positioning sides
		TOP = 'top',
		    LEFT = 'left',
		    BOTTOM = 'bottom',
		    RIGHT = 'right',
		    CENTER = 'center',


		// Position adjustment types
		FLIP = 'flip',
		    FLIPINVERT = 'flipinvert',
		    SHIFT = 'shift',


		// Shortcut vars
		QTIP,
		    PROTOTYPE,
		    CORNER,
		    CHECKS,
		    PLUGINS = {},
		    NAMESPACE = 'qtip',
		    ATTR_HAS = 'data-hasqtip',
		    ATTR_ID = 'data-qtip-id',
		    WIDGET = ['ui-widget', 'ui-tooltip'],
		    SELECTOR = '.' + NAMESPACE,
		    INACTIVE_EVENTS = 'click dblclick mousedown mouseup mousemove mouseleave mouseenter'.split(' '),
		    CLASS_FIXED = NAMESPACE + '-fixed',
		    CLASS_DEFAULT = NAMESPACE + '-default',
		    CLASS_FOCUS = NAMESPACE + '-focus',
		    CLASS_HOVER = NAMESPACE + '-hover',
		    CLASS_DISABLED = NAMESPACE + '-disabled',
		    replaceSuffix = '_replacedByqTip',
		    oldtitle = 'oldtitle',
		    trackingBound,


		// Browser detection
		BROWSER = {
			/*
    * IE version detection
    *
    * Adapted from: http://ajaxian.com/archives/attack-of-the-ie-conditional-comment
    * Credit to James Padolsey for the original implemntation!
    */
			ie: function () {
				/* eslint-disable no-empty */
				var v, i;
				for (v = 4, i = document.createElement('div'); (i.innerHTML = '<!--[if gt IE ' + v + ']><i></i><![endif]-->') && i.getElementsByTagName('i')[0]; v += 1) {}
				return v > 4 ? v : NaN;
				/* eslint-enable no-empty */
			}(),

			/*
    * iOS version detection
    */
			iOS: parseFloat(('' + (/CPU.*OS ([0-9_]{1,5})|(CPU like).*AppleWebKit.*Mobile/i.exec(navigator.userAgent) || [0, ''])[1]).replace('undefined', '3_2').replace('_', '.').replace('_', '')) || FALSE
		};
		;function QTip(target, options, id, attr) {
			// Elements and ID
			this.id = id;
			this.target = target;
			this.tooltip = NULL;
			this.elements = { target: target };

			// Internal constructs
			this._id = NAMESPACE + '-' + id;
			this.timers = { img: {} };
			this.options = options;
			this.plugins = {};

			// Cache object
			this.cache = {
				event: {},
				target: $(),
				disabled: FALSE,
				attr: attr,
				onTooltip: FALSE,
				lastClass: ''
			};

			// Set the initial flags
			this.rendered = this.destroyed = this.disabled = this.waiting = this.hiddenDuringWait = this.positioning = this.triggering = FALSE;
		}
		PROTOTYPE = QTip.prototype;

		PROTOTYPE._when = function (deferreds) {
			return $.when.apply($, deferreds);
		};

		PROTOTYPE.render = function (show) {
			if (this.rendered || this.destroyed) {
				return this;
			} // If tooltip has already been rendered, exit

			var self = this,
			    options = this.options,
			    cache = this.cache,
			    elements = this.elements,
			    text = options.content.text,
			    title = options.content.title,
			    button = options.content.button,
			    posOptions = options.position,
			    deferreds = [];

			// Add ARIA attributes to target
			$.attr(this.target[0], 'aria-describedby', this._id);

			// Create public position object that tracks current position corners
			cache.posClass = this._createPosClass((this.position = { my: posOptions.my, at: posOptions.at }).my);

			// Create tooltip element
			this.tooltip = elements.tooltip = $('<div/>', {
				'id': this._id,
				'class': [NAMESPACE, CLASS_DEFAULT, options.style.classes, cache.posClass].join(' '),
				'width': options.style.width || '',
				'height': options.style.height || '',
				'tracking': posOptions.target === 'mouse' && posOptions.adjust.mouse,

				/* ARIA specific attributes */
				'role': 'alert',
				'aria-live': 'polite',
				'aria-atomic': FALSE,
				'aria-describedby': this._id + '-content',
				'aria-hidden': TRUE
			}).toggleClass(CLASS_DISABLED, this.disabled).attr(ATTR_ID, this.id).data(NAMESPACE, this).appendTo(posOptions.container).append(
			// Create content element
			elements.content = $('<div />', {
				'class': NAMESPACE + '-content',
				'id': this._id + '-content',
				'aria-atomic': TRUE
			}));

			// Set rendered flag and prevent redundant reposition calls for now
			this.rendered = -1;
			this.positioning = TRUE;

			// Create title...
			if (title) {
				this._createTitle();

				// Update title only if its not a callback (called in toggle if so)
				if (!$.isFunction(title)) {
					deferreds.push(this._updateTitle(title, FALSE));
				}
			}

			// Create button
			if (button) {
				this._createButton();
			}

			// Set proper rendered flag and update content if not a callback function (called in toggle)
			if (!$.isFunction(text)) {
				deferreds.push(this._updateContent(text, FALSE));
			}
			this.rendered = TRUE;

			// Setup widget classes
			this._setWidget();

			// Initialize 'render' plugins
			$.each(PLUGINS, function (name) {
				var instance;
				if (this.initialize === 'render' && (instance = this(self))) {
					self.plugins[name] = instance;
				}
			});

			// Unassign initial events and assign proper events
			this._unassignEvents();
			this._assignEvents();

			// When deferreds have completed
			this._when(deferreds).then(function () {
				// tooltiprender event
				self._trigger('render');

				// Reset flags
				self.positioning = FALSE;

				// Show tooltip if not hidden during wait period
				if (!self.hiddenDuringWait && (options.show.ready || show)) {
					self.toggle(TRUE, cache.event, FALSE);
				}
				self.hiddenDuringWait = FALSE;
			});

			// Expose API
			QTIP.api[this.id] = this;

			return this;
		};

		PROTOTYPE.destroy = function (immediate) {
			// Set flag the signify destroy is taking place to plugins
			// and ensure it only gets destroyed once!
			if (this.destroyed) {
				return this.target;
			}

			function process() {
				if (this.destroyed) {
					return;
				}
				this.destroyed = TRUE;

				var target = this.target,
				    title = target.attr(oldtitle),
				    timer;

				// Destroy tooltip if rendered
				if (this.rendered) {
					this.tooltip.stop(1, 0).find('*').remove().end().remove();
				}

				// Destroy all plugins
				$.each(this.plugins, function () {
					this.destroy && this.destroy();
				});

				// Clear timers
				for (timer in this.timers) {
					if (this.timers.hasOwnProperty(timer)) {
						clearTimeout(this.timers[timer]);
					}
				}

				// Remove api object and ARIA attributes
				target.removeData(NAMESPACE).removeAttr(ATTR_ID).removeAttr(ATTR_HAS).removeAttr('aria-describedby');

				// Reset old title attribute if removed
				if (this.options.suppress && title) {
					target.attr('title', title).removeAttr(oldtitle);
				}

				// Remove qTip events associated with this API
				this._unassignEvents();

				// Remove ID from used id objects, and delete object references
				// for better garbage collection and leak protection
				this.options = this.elements = this.cache = this.timers = this.plugins = this.mouse = NULL;

				// Delete epoxsed API object
				delete QTIP.api[this.id];
			}

			// If an immediate destroy is needed
			if ((immediate !== TRUE || this.triggering === 'hide') && this.rendered) {
				this.tooltip.one('tooltiphidden', $.proxy(process, this));
				!this.triggering && this.hide();
			}

			// If we're not in the process of hiding... process
			else {
					process.call(this);
				}

			return this.target;
		};
		;function invalidOpt(a) {
			return a === NULL || $.type(a) !== 'object';
		}

		function invalidContent(c) {
			return !($.isFunction(c) || c && c.attr || c.length || $.type(c) === 'object' && (c.jquery || c.then));
		}

		// Option object sanitizer
		function sanitizeOptions(opts) {
			var content, text, ajax, once;

			if (invalidOpt(opts)) {
				return FALSE;
			}

			if (invalidOpt(opts.metadata)) {
				opts.metadata = { type: opts.metadata };
			}

			if ('content' in opts) {
				content = opts.content;

				if (invalidOpt(content) || content.jquery || content.done) {
					text = invalidContent(content) ? FALSE : content;
					content = opts.content = {
						text: text
					};
				} else {
					text = content.text;
				}

				// DEPRECATED - Old content.ajax plugin functionality
				// Converts it into the proper Deferred syntax
				if ('ajax' in content) {
					ajax = content.ajax;
					once = ajax && ajax.once !== FALSE;
					delete content.ajax;

					content.text = function (event, api) {
						var loading = text || $(this).attr(api.options.content.attr) || 'Loading...',
						    deferred = $.ajax($.extend({}, ajax, { context: api })).then(ajax.success, NULL, ajax.error).then(function (newContent) {
							if (newContent && once) {
								api.set('content.text', newContent);
							}
							return newContent;
						}, function (xhr, status, error) {
							if (api.destroyed || xhr.status === 0) {
								return;
							}
							api.set('content.text', status + ': ' + error);
						});

						return !once ? (api.set('content.text', loading), deferred) : loading;
					};
				}

				if ('title' in content) {
					if ($.isPlainObject(content.title)) {
						content.button = content.title.button;
						content.title = content.title.text;
					}

					if (invalidContent(content.title || FALSE)) {
						content.title = FALSE;
					}
				}
			}

			if ('position' in opts && invalidOpt(opts.position)) {
				opts.position = { my: opts.position, at: opts.position };
			}

			if ('show' in opts && invalidOpt(opts.show)) {
				opts.show = opts.show.jquery ? { target: opts.show } : opts.show === TRUE ? { ready: TRUE } : { event: opts.show };
			}

			if ('hide' in opts && invalidOpt(opts.hide)) {
				opts.hide = opts.hide.jquery ? { target: opts.hide } : { event: opts.hide };
			}

			if ('style' in opts && invalidOpt(opts.style)) {
				opts.style = { classes: opts.style };
			}

			// Sanitize plugin options
			$.each(PLUGINS, function () {
				this.sanitize && this.sanitize(opts);
			});

			return opts;
		}

		// Setup builtin .set() option checks
		CHECKS = PROTOTYPE.checks = {
			builtin: {
				// Core checks
				'^id$': function id$(obj, o, v, prev) {
					var id = v === TRUE ? QTIP.nextid : v,
					    newId = NAMESPACE + '-' + id;

					if (id !== FALSE && id.length > 0 && !$('#' + newId).length) {
						this._id = newId;

						if (this.rendered) {
							this.tooltip[0].id = this._id;
							this.elements.content[0].id = this._id + '-content';
							this.elements.title[0].id = this._id + '-title';
						}
					} else {
						obj[o] = prev;
					}
				},
				'^prerender': function prerender(obj, o, v) {
					v && !this.rendered && this.render(this.options.show.ready);
				},

				// Content checks
				'^content.text$': function contentText$(obj, o, v) {
					this._updateContent(v);
				},
				'^content.attr$': function contentAttr$(obj, o, v, prev) {
					if (this.options.content.text === this.target.attr(prev)) {
						this._updateContent(this.target.attr(v));
					}
				},
				'^content.title$': function contentTitle$(obj, o, v) {
					// Remove title if content is null
					if (!v) {
						return this._removeTitle();
					}

					// If title isn't already created, create it now and update
					v && !this.elements.title && this._createTitle();
					this._updateTitle(v);
				},
				'^content.button$': function contentButton$(obj, o, v) {
					this._updateButton(v);
				},
				'^content.title.(text|button)$': function contentTitleTextButton$(obj, o, v) {
					this.set('content.' + o, v); // Backwards title.text/button compat
				},

				// Position checks
				'^position.(my|at)$': function positionMyAt$(obj, o, v) {
					if ('string' === typeof v) {
						this.position[o] = obj[o] = new CORNER(v, o === 'at');
					}
				},
				'^position.container$': function positionContainer$(obj, o, v) {
					this.rendered && this.tooltip.appendTo(v);
				},

				// Show checks
				'^show.ready$': function showReady$(obj, o, v) {
					v && (!this.rendered && this.render(TRUE) || this.toggle(TRUE));
				},

				// Style checks
				'^style.classes$': function styleClasses$(obj, o, v, p) {
					this.rendered && this.tooltip.removeClass(p).addClass(v);
				},
				'^style.(width|height)': function styleWidthHeight(obj, o, v) {
					this.rendered && this.tooltip.css(o, v);
				},
				'^style.widget|content.title': function styleWidgetContentTitle() {
					this.rendered && this._setWidget();
				},
				'^style.def': function styleDef(obj, o, v) {
					this.rendered && this.tooltip.toggleClass(CLASS_DEFAULT, !!v);
				},

				// Events check
				'^events.(render|show|move|hide|focus|blur)$': function eventsRenderShowMoveHideFocusBlur$(obj, o, v) {
					this.rendered && this.tooltip[($.isFunction(v) ? '' : 'un') + 'bind']('tooltip' + o, v);
				},

				// Properties which require event reassignment
				'^(show|hide|position).(event|target|fixed|inactive|leave|distance|viewport|adjust)': function showHidePositionEventTargetFixedInactiveLeaveDistanceViewportAdjust() {
					if (!this.rendered) {
						return;
					}

					// Set tracking flag
					var posOptions = this.options.position;
					this.tooltip.attr('tracking', posOptions.target === 'mouse' && posOptions.adjust.mouse);

					// Reassign events
					this._unassignEvents();
					this._assignEvents();
				}
			}
		};

		// Dot notation converter
		function convertNotation(options, notation) {
			var i = 0,
			    obj,
			    option = options,


			// Split notation into array
			levels = notation.split('.');

			// Loop through
			while (option = option[levels[i++]]) {
				if (i < levels.length) {
					obj = option;
				}
			}

			return [obj || options, levels.pop()];
		}

		PROTOTYPE.get = function (notation) {
			if (this.destroyed) {
				return this;
			}

			var o = convertNotation(this.options, notation.toLowerCase()),
			    result = o[0][o[1]];

			return result.precedance ? result.string() : result;
		};

		function setCallback(notation, args) {
			var category, rule, match;

			for (category in this.checks) {
				if (!this.checks.hasOwnProperty(category)) {
					continue;
				}

				for (rule in this.checks[category]) {
					if (!this.checks[category].hasOwnProperty(rule)) {
						continue;
					}

					if (match = new RegExp(rule, 'i').exec(notation)) {
						args.push(match);

						if (category === 'builtin' || this.plugins[category]) {
							this.checks[category][rule].apply(this.plugins[category] || this, args);
						}
					}
				}
			}
		}

		var rmove = /^position\.(my|at|adjust|target|container|viewport)|style|content|show\.ready/i,
		    rrender = /^prerender|show\.ready/i;

		PROTOTYPE.set = function (option, value) {
			if (this.destroyed) {
				return this;
			}

			var rendered = this.rendered,
			    reposition = FALSE,
			    options = this.options,
			    name;

			// Convert singular option/value pair into object form
			if ('string' === typeof option) {
				name = option;option = {};option[name] = value;
			} else {
				option = $.extend({}, option);
			}

			// Set all of the defined options to their new values
			$.each(option, function (notation, val) {
				if (rendered && rrender.test(notation)) {
					delete option[notation];return;
				}

				// Set new obj value
				var obj = convertNotation(options, notation.toLowerCase()),
				    previous;
				previous = obj[0][obj[1]];
				obj[0][obj[1]] = val && val.nodeType ? $(val) : val;

				// Also check if we need to reposition
				reposition = rmove.test(notation) || reposition;

				// Set the new params for the callback
				option[notation] = [obj[0], obj[1], val, previous];
			});

			// Re-sanitize options
			sanitizeOptions(options);

			/*
    * Execute any valid callbacks for the set options
    * Also set positioning flag so we don't get loads of redundant repositioning calls.
    */
			this.positioning = TRUE;
			$.each(option, $.proxy(setCallback, this));
			this.positioning = FALSE;

			// Update position if needed
			if (this.rendered && this.tooltip[0].offsetWidth > 0 && reposition) {
				this.reposition(options.position.target === 'mouse' ? NULL : this.cache.event);
			}

			return this;
		};
		;PROTOTYPE._update = function (content, element) {
			var self = this,
			    cache = this.cache;

			// Make sure tooltip is rendered and content is defined. If not return
			if (!this.rendered || !content) {
				return FALSE;
			}

			// Use function to parse content
			if ($.isFunction(content)) {
				content = content.call(this.elements.target, cache.event, this) || '';
			}

			// Handle deferred content
			if ($.isFunction(content.then)) {
				cache.waiting = TRUE;
				return content.then(function (c) {
					cache.waiting = FALSE;
					return self._update(c, element);
				}, NULL, function (e) {
					return self._update(e, element);
				});
			}

			// If content is null... return false
			if (content === FALSE || !content && content !== '') {
				return FALSE;
			}

			// Append new content if its a DOM array and show it if hidden
			if (content.jquery && content.length > 0) {
				element.empty().append(content.css({ display: 'block', visibility: 'visible' }));
			}

			// Content is a regular string, insert the new content
			else {
					element.html(content);
				}

			// Wait for content to be loaded, and reposition
			return this._waitForContent(element).then(function (images) {
				if (self.rendered && self.tooltip[0].offsetWidth > 0) {
					self.reposition(cache.event, !images.length);
				}
			});
		};

		PROTOTYPE._waitForContent = function (element) {
			var cache = this.cache;

			// Set flag
			cache.waiting = TRUE;

			// If imagesLoaded is included, ensure images have loaded and return promise
			return ($.fn.imagesLoaded ? element.imagesLoaded() : new $.Deferred().resolve([])).done(function () {
				cache.waiting = FALSE;
			}).promise();
		};

		PROTOTYPE._updateContent = function (content, reposition) {
			this._update(content, this.elements.content, reposition);
		};

		PROTOTYPE._updateTitle = function (content, reposition) {
			if (this._update(content, this.elements.title, reposition) === FALSE) {
				this._removeTitle(FALSE);
			}
		};

		PROTOTYPE._createTitle = function () {
			var elements = this.elements,
			    id = this._id + '-title';

			// Destroy previous title element, if present
			if (elements.titlebar) {
				this._removeTitle();
			}

			// Create title bar and title elements
			elements.titlebar = $('<div />', {
				'class': NAMESPACE + '-titlebar ' + (this.options.style.widget ? createWidgetClass('header') : '')
			}).append(elements.title = $('<div />', {
				'id': id,
				'class': NAMESPACE + '-title',
				'aria-atomic': TRUE
			})).insertBefore(elements.content)

			// Button-specific events
			.delegate('.qtip-close', 'mousedown keydown mouseup keyup mouseout', function (event) {
				$(this).toggleClass('ui-state-active ui-state-focus', event.type.substr(-4) === 'down');
			}).delegate('.qtip-close', 'mouseover mouseout', function (event) {
				$(this).toggleClass('ui-state-hover', event.type === 'mouseover');
			});

			// Create button if enabled
			if (this.options.content.button) {
				this._createButton();
			}
		};

		PROTOTYPE._removeTitle = function (reposition) {
			var elements = this.elements;

			if (elements.title) {
				elements.titlebar.remove();
				elements.titlebar = elements.title = elements.button = NULL;

				// Reposition if enabled
				if (reposition !== FALSE) {
					this.reposition();
				}
			}
		};
		;PROTOTYPE._createPosClass = function (my) {
			return NAMESPACE + '-pos-' + (my || this.options.position.my).abbrev();
		};

		PROTOTYPE.reposition = function (event, effect) {
			if (!this.rendered || this.positioning || this.destroyed) {
				return this;
			}

			// Set positioning flag
			this.positioning = TRUE;

			var cache = this.cache,
			    tooltip = this.tooltip,
			    posOptions = this.options.position,
			    target = posOptions.target,
			    my = posOptions.my,
			    at = posOptions.at,
			    viewport = posOptions.viewport,
			    container = posOptions.container,
			    adjust = posOptions.adjust,
			    method = adjust.method.split(' '),
			    tooltipWidth = tooltip.outerWidth(FALSE),
			    tooltipHeight = tooltip.outerHeight(FALSE),
			    targetWidth = 0,
			    targetHeight = 0,
			    type = tooltip.css('position'),
			    position = { left: 0, top: 0 },
			    visible = tooltip[0].offsetWidth > 0,
			    isScroll = event && event.type === 'scroll',
			    win = $(window),
			    doc = container[0].ownerDocument,
			    mouse = this.mouse,
			    pluginCalculations,
			    offset,
			    adjusted,
			    newClass;

			// Check if absolute position was passed
			if ($.isArray(target) && target.length === 2) {
				// Force left top and set position
				at = { x: LEFT, y: TOP };
				position = { left: target[0], top: target[1] };
			}

			// Check if mouse was the target
			else if (target === 'mouse') {
					// Force left top to allow flipping
					at = { x: LEFT, y: TOP };

					// Use the mouse origin that caused the show event, if distance hiding is enabled
					if ((!adjust.mouse || this.options.hide.distance) && cache.origin && cache.origin.pageX) {
						event = cache.origin;
					}

					// Use cached event for resize/scroll events
					else if (!event || event && (event.type === 'resize' || event.type === 'scroll')) {
							event = cache.event;
						}

						// Otherwise, use the cached mouse coordinates if available
						else if (mouse && mouse.pageX) {
								event = mouse;
							}

					// Calculate body and container offset and take them into account below
					if (type !== 'static') {
						position = container.offset();
					}
					if (doc.body.offsetWidth !== (window.innerWidth || doc.documentElement.clientWidth)) {
						offset = $(document.body).offset();
					}

					// Use event coordinates for position
					position = {
						left: event.pageX - position.left + (offset && offset.left || 0),
						top: event.pageY - position.top + (offset && offset.top || 0)
					};

					// Scroll events are a pain, some browsers
					if (adjust.mouse && isScroll && mouse) {
						position.left -= (mouse.scrollX || 0) - win.scrollLeft();
						position.top -= (mouse.scrollY || 0) - win.scrollTop();
					}
				}

				// Target wasn't mouse or absolute...
				else {
						// Check if event targetting is being used
						if (target === 'event') {
							if (event && event.target && event.type !== 'scroll' && event.type !== 'resize') {
								cache.target = $(event.target);
							} else if (!event.target) {
								cache.target = this.elements.target;
							}
						} else if (target !== 'event') {
							cache.target = $(target.jquery ? target : this.elements.target);
						}
						target = cache.target;

						// Parse the target into a jQuery object and make sure there's an element present
						target = $(target).eq(0);
						if (target.length === 0) {
							return this;
						}

						// Check if window or document is the target
						else if (target[0] === document || target[0] === window) {
								targetWidth = BROWSER.iOS ? window.innerWidth : target.width();
								targetHeight = BROWSER.iOS ? window.innerHeight : target.height();

								if (target[0] === window) {
									position = {
										top: (viewport || target).scrollTop(),
										left: (viewport || target).scrollLeft()
									};
								}
							}

							// Check if the target is an <AREA> element
							else if (PLUGINS.imagemap && target.is('area')) {
									pluginCalculations = PLUGINS.imagemap(this, target, at, PLUGINS.viewport ? method : FALSE);
								}

								// Check if the target is an SVG element
								else if (PLUGINS.svg && target && target[0].ownerSVGElement) {
										pluginCalculations = PLUGINS.svg(this, target, at, PLUGINS.viewport ? method : FALSE);
									}

									// Otherwise use regular jQuery methods
									else {
											targetWidth = target.outerWidth(FALSE);
											targetHeight = target.outerHeight(FALSE);
											position = target.offset();
										}

						// Parse returned plugin values into proper variables
						if (pluginCalculations) {
							targetWidth = pluginCalculations.width;
							targetHeight = pluginCalculations.height;
							offset = pluginCalculations.offset;
							position = pluginCalculations.position;
						}

						// Adjust position to take into account offset parents
						position = this.reposition.offset(target, position, container);

						// Adjust for position.fixed tooltips (and also iOS scroll bug in v3.2-4.0 & v4.3-4.3.2)
						if (BROWSER.iOS > 3.1 && BROWSER.iOS < 4.1 || BROWSER.iOS >= 4.3 && BROWSER.iOS < 4.33 || !BROWSER.iOS && type === 'fixed') {
							position.left -= win.scrollLeft();
							position.top -= win.scrollTop();
						}

						// Adjust position relative to target
						if (!pluginCalculations || pluginCalculations && pluginCalculations.adjustable !== FALSE) {
							position.left += at.x === RIGHT ? targetWidth : at.x === CENTER ? targetWidth / 2 : 0;
							position.top += at.y === BOTTOM ? targetHeight : at.y === CENTER ? targetHeight / 2 : 0;
						}
					}

			// Adjust position relative to tooltip
			position.left += adjust.x + (my.x === RIGHT ? -tooltipWidth : my.x === CENTER ? -tooltipWidth / 2 : 0);
			position.top += adjust.y + (my.y === BOTTOM ? -tooltipHeight : my.y === CENTER ? -tooltipHeight / 2 : 0);

			// Use viewport adjustment plugin if enabled
			if (PLUGINS.viewport) {
				adjusted = position.adjusted = PLUGINS.viewport(this, position, posOptions, targetWidth, targetHeight, tooltipWidth, tooltipHeight);

				// Apply offsets supplied by positioning plugin (if used)
				if (offset && adjusted.left) {
					position.left += offset.left;
				}
				if (offset && adjusted.top) {
					position.top += offset.top;
				}

				// Apply any new 'my' position
				if (adjusted.my) {
					this.position.my = adjusted.my;
				}
			}

			// Viewport adjustment is disabled, set values to zero
			else {
					position.adjusted = { left: 0, top: 0 };
				}

			// Set tooltip position class if it's changed
			if (cache.posClass !== (newClass = this._createPosClass(this.position.my))) {
				cache.posClass = newClass;
				tooltip.removeClass(cache.posClass).addClass(newClass);
			}

			// tooltipmove event
			if (!this._trigger('move', [position, viewport.elem || viewport], event)) {
				return this;
			}
			delete position.adjusted;

			// If effect is disabled, target it mouse, no animation is defined or positioning gives NaN out, set CSS directly
			if (effect === FALSE || !visible || isNaN(position.left) || isNaN(position.top) || target === 'mouse' || !$.isFunction(posOptions.effect)) {
				tooltip.css(position);
			}

			// Use custom function if provided
			else if ($.isFunction(posOptions.effect)) {
					posOptions.effect.call(tooltip, this, $.extend({}, position));
					tooltip.queue(function (next) {
						// Reset attributes to avoid cross-browser rendering bugs
						$(this).css({ opacity: '', height: '' });
						if (BROWSER.ie) {
							this.style.removeAttribute('filter');
						}

						next();
					});
				}

			// Set positioning flag
			this.positioning = FALSE;

			return this;
		};

		// Custom (more correct for qTip!) offset calculator
		PROTOTYPE.reposition.offset = function (elem, pos, container) {
			if (!container[0]) {
				return pos;
			}

			var ownerDocument = $(elem[0].ownerDocument),
			    quirks = !!BROWSER.ie && document.compatMode !== 'CSS1Compat',
			    parent = container[0],
			    scrolled,
			    position,
			    parentOffset,
			    overflow;

			function scroll(e, i) {
				pos.left += i * e.scrollLeft();
				pos.top += i * e.scrollTop();
			}

			// Compensate for non-static containers offset
			do {
				if ((position = $.css(parent, 'position')) !== 'static') {
					if (position === 'fixed') {
						parentOffset = parent.getBoundingClientRect();
						scroll(ownerDocument, -1);
					} else {
						parentOffset = $(parent).position();
						parentOffset.left += parseFloat($.css(parent, 'borderLeftWidth')) || 0;
						parentOffset.top += parseFloat($.css(parent, 'borderTopWidth')) || 0;
					}

					pos.left -= parentOffset.left + (parseFloat($.css(parent, 'marginLeft')) || 0);
					pos.top -= parentOffset.top + (parseFloat($.css(parent, 'marginTop')) || 0);

					// If this is the first parent element with an overflow of "scroll" or "auto", store it
					if (!scrolled && (overflow = $.css(parent, 'overflow')) !== 'hidden' && overflow !== 'visible') {
						scrolled = $(parent);
					}
				}
			} while (parent = parent.offsetParent);

			// Compensate for containers scroll if it also has an offsetParent (or in IE quirks mode)
			if (scrolled && (scrolled[0] !== ownerDocument[0] || quirks)) {
				scroll(scrolled, 1);
			}

			return pos;
		};

		// Corner class
		var C = (CORNER = PROTOTYPE.reposition.Corner = function (corner, forceY) {
			corner = ('' + corner).replace(/([A-Z])/, ' $1').replace(/middle/gi, CENTER).toLowerCase();
			this.x = (corner.match(/left|right/i) || corner.match(/center/) || ['inherit'])[0].toLowerCase();
			this.y = (corner.match(/top|bottom|center/i) || ['inherit'])[0].toLowerCase();
			this.forceY = !!forceY;

			var f = corner.charAt(0);
			this.precedance = f === 't' || f === 'b' ? Y : X;
		}).prototype;

		C.invert = function (z, center) {
			this[z] = this[z] === LEFT ? RIGHT : this[z] === RIGHT ? LEFT : center || this[z];
		};

		C.string = function (join) {
			var x = this.x,
			    y = this.y;

			var result = x !== y ? x === 'center' || y !== 'center' && (this.precedance === Y || this.forceY) ? [y, x] : [x, y] : [x];

			return join !== false ? result.join(' ') : result;
		};

		C.abbrev = function () {
			var result = this.string(false);
			return result[0].charAt(0) + (result[1] && result[1].charAt(0) || '');
		};

		C.clone = function () {
			return new CORNER(this.string(), this.forceY);
		};

		;
		PROTOTYPE.toggle = function (state, event) {
			var cache = this.cache,
			    options = this.options,
			    tooltip = this.tooltip;

			// Try to prevent flickering when tooltip overlaps show element
			if (event) {
				if (/over|enter/.test(event.type) && cache.event && /out|leave/.test(cache.event.type) && options.show.target.add(event.target).length === options.show.target.length && tooltip.has(event.relatedTarget).length) {
					return this;
				}

				// Cache event
				cache.event = $.event.fix(event);
			}

			// If we're currently waiting and we've just hidden... stop it
			this.waiting && !state && (this.hiddenDuringWait = TRUE);

			// Render the tooltip if showing and it isn't already
			if (!this.rendered) {
				return state ? this.render(1) : this;
			} else if (this.destroyed || this.disabled) {
				return this;
			}

			var type = state ? 'show' : 'hide',
			    opts = this.options[type],
			    posOptions = this.options.position,
			    contentOptions = this.options.content,
			    width = this.tooltip.css('width'),
			    visible = this.tooltip.is(':visible'),
			    animate = state || opts.target.length === 1,
			    sameTarget = !event || opts.target.length < 2 || cache.target[0] === event.target,
			    identicalState,
			    allow,
			    after;

			// Detect state if valid one isn't provided
			if ((typeof state === 'undefined' ? 'undefined' : _typeof(state)).search('boolean|number')) {
				state = !visible;
			}

			// Check if the tooltip is in an identical state to the new would-be state
			identicalState = !tooltip.is(':animated') && visible === state && sameTarget;

			// Fire tooltip(show/hide) event and check if destroyed
			allow = !identicalState ? !!this._trigger(type, [90]) : NULL;

			// Check to make sure the tooltip wasn't destroyed in the callback
			if (this.destroyed) {
				return this;
			}

			// If the user didn't stop the method prematurely and we're showing the tooltip, focus it
			if (allow !== FALSE && state) {
				this.focus(event);
			}

			// If the state hasn't changed or the user stopped it, return early
			if (!allow || identicalState) {
				return this;
			}

			// Set ARIA hidden attribute
			$.attr(tooltip[0], 'aria-hidden', !!!state);

			// Execute state specific properties
			if (state) {
				// Store show origin coordinates
				this.mouse && (cache.origin = $.event.fix(this.mouse));

				// Update tooltip content & title if it's a dynamic function
				if ($.isFunction(contentOptions.text)) {
					this._updateContent(contentOptions.text, FALSE);
				}
				if ($.isFunction(contentOptions.title)) {
					this._updateTitle(contentOptions.title, FALSE);
				}

				// Cache mousemove events for positioning purposes (if not already tracking)
				if (!trackingBound && posOptions.target === 'mouse' && posOptions.adjust.mouse) {
					$(document).bind('mousemove.' + NAMESPACE, this._storeMouse);
					trackingBound = TRUE;
				}

				// Update the tooltip position (set width first to prevent viewport/max-width issues)
				if (!width) {
					tooltip.css('width', tooltip.outerWidth(FALSE));
				}
				this.reposition(event, arguments[2]);
				if (!width) {
					tooltip.css('width', '');
				}

				// Hide other tooltips if tooltip is solo
				if (!!opts.solo) {
					(typeof opts.solo === 'string' ? $(opts.solo) : $(SELECTOR, opts.solo)).not(tooltip).not(opts.target).qtip('hide', new $.Event('tooltipsolo'));
				}
			} else {
				// Clear show timer if we're hiding
				clearTimeout(this.timers.show);

				// Remove cached origin on hide
				delete cache.origin;

				// Remove mouse tracking event if not needed (all tracking qTips are hidden)
				if (trackingBound && !$(SELECTOR + '[tracking="true"]:visible', opts.solo).not(tooltip).length) {
					$(document).unbind('mousemove.' + NAMESPACE);
					trackingBound = FALSE;
				}

				// Blur the tooltip
				this.blur(event);
			}

			// Define post-animation, state specific properties
			after = $.proxy(function () {
				if (state) {
					// Prevent antialias from disappearing in IE by removing filter
					if (BROWSER.ie) {
						tooltip[0].style.removeAttribute('filter');
					}

					// Remove overflow setting to prevent tip bugs
					tooltip.css('overflow', '');

					// Autofocus elements if enabled
					if ('string' === typeof opts.autofocus) {
						$(this.options.show.autofocus, tooltip).focus();
					}

					// If set, hide tooltip when inactive for delay period
					this.options.show.target.trigger('qtip-' + this.id + '-inactive');
				} else {
					// Reset CSS states
					tooltip.css({
						display: '',
						visibility: '',
						opacity: '',
						left: '',
						top: ''
					});
				}

				// tooltipvisible/tooltiphidden events
				this._trigger(state ? 'visible' : 'hidden');
			}, this);

			// If no effect type is supplied, use a simple toggle
			if (opts.effect === FALSE || animate === FALSE) {
				tooltip[type]();
				after();
			}

			// Use custom function if provided
			else if ($.isFunction(opts.effect)) {
					tooltip.stop(1, 1);
					opts.effect.call(tooltip, this);
					tooltip.queue('fx', function (n) {
						after();n();
					});
				}

				// Use basic fade function by default
				else {
						tooltip.fadeTo(90, state ? 1 : 0, after);
					}

			// If inactive hide method is set, active it
			if (state) {
				opts.target.trigger('qtip-' + this.id + '-inactive');
			}

			return this;
		};

		PROTOTYPE.show = function (event) {
			return this.toggle(TRUE, event);
		};

		PROTOTYPE.hide = function (event) {
			return this.toggle(FALSE, event);
		};
		;PROTOTYPE.focus = function (event) {
			if (!this.rendered || this.destroyed) {
				return this;
			}

			var qtips = $(SELECTOR),
			    tooltip = this.tooltip,
			    curIndex = parseInt(tooltip[0].style.zIndex, 10),
			    newIndex = QTIP.zindex + qtips.length;

			// Only update the z-index if it has changed and tooltip is not already focused
			if (!tooltip.hasClass(CLASS_FOCUS)) {
				// tooltipfocus event
				if (this._trigger('focus', [newIndex], event)) {
					// Only update z-index's if they've changed
					if (curIndex !== newIndex) {
						// Reduce our z-index's and keep them properly ordered
						qtips.each(function () {
							if (this.style.zIndex > curIndex) {
								this.style.zIndex = this.style.zIndex - 1;
							}
						});

						// Fire blur event for focused tooltip
						qtips.filter('.' + CLASS_FOCUS).qtip('blur', event);
					}

					// Set the new z-index
					tooltip.addClass(CLASS_FOCUS)[0].style.zIndex = newIndex;
				}
			}

			return this;
		};

		PROTOTYPE.blur = function (event) {
			if (!this.rendered || this.destroyed) {
				return this;
			}

			// Set focused status to FALSE
			this.tooltip.removeClass(CLASS_FOCUS);

			// tooltipblur event
			this._trigger('blur', [this.tooltip.css('zIndex')], event);

			return this;
		};
		;PROTOTYPE.disable = function (state) {
			if (this.destroyed) {
				return this;
			}

			// If 'toggle' is passed, toggle the current state
			if (state === 'toggle') {
				state = !(this.rendered ? this.tooltip.hasClass(CLASS_DISABLED) : this.disabled);
			}

			// Disable if no state passed
			else if ('boolean' !== typeof state) {
					state = TRUE;
				}

			if (this.rendered) {
				this.tooltip.toggleClass(CLASS_DISABLED, state).attr('aria-disabled', state);
			}

			this.disabled = !!state;

			return this;
		};

		PROTOTYPE.enable = function () {
			return this.disable(FALSE);
		};
		;PROTOTYPE._createButton = function () {
			var self = this,
			    elements = this.elements,
			    tooltip = elements.tooltip,
			    button = this.options.content.button,
			    isString = typeof button === 'string',
			    close = isString ? button : 'Close tooltip';

			if (elements.button) {
				elements.button.remove();
			}

			// Use custom button if one was supplied by user, else use default
			if (button.jquery) {
				elements.button = button;
			} else {
				elements.button = $('<a />', {
					'class': 'qtip-close ' + (this.options.style.widget ? '' : NAMESPACE + '-icon'),
					'title': close,
					'aria-label': close
				}).prepend($('<span />', {
					'class': 'ui-icon ui-icon-close',
					'html': '&times;'
				}));
			}

			// Create button and setup attributes
			elements.button.appendTo(elements.titlebar || tooltip).attr('role', 'button').click(function (event) {
				if (!tooltip.hasClass(CLASS_DISABLED)) {
					self.hide(event);
				}
				return FALSE;
			});
		};

		PROTOTYPE._updateButton = function (button) {
			// Make sure tooltip is rendered and if not, return
			if (!this.rendered) {
				return FALSE;
			}

			var elem = this.elements.button;
			if (button) {
				this._createButton();
			} else {
				elem.remove();
			}
		};
		; // Widget class creator
		function createWidgetClass(cls) {
			return WIDGET.concat('').join(cls ? '-' + cls + ' ' : ' ');
		}

		// Widget class setter method
		PROTOTYPE._setWidget = function () {
			var on = this.options.style.widget,
			    elements = this.elements,
			    tooltip = elements.tooltip,
			    disabled = tooltip.hasClass(CLASS_DISABLED);

			tooltip.removeClass(CLASS_DISABLED);
			CLASS_DISABLED = on ? 'ui-state-disabled' : 'qtip-disabled';
			tooltip.toggleClass(CLASS_DISABLED, disabled);

			tooltip.toggleClass('ui-helper-reset ' + createWidgetClass(), on).toggleClass(CLASS_DEFAULT, this.options.style.def && !on);

			if (elements.content) {
				elements.content.toggleClass(createWidgetClass('content'), on);
			}
			if (elements.titlebar) {
				elements.titlebar.toggleClass(createWidgetClass('header'), on);
			}
			if (elements.button) {
				elements.button.toggleClass(NAMESPACE + '-icon', !on);
			}
		};
		;function delay(callback, duration) {
			// If tooltip has displayed, start hide timer
			if (duration > 0) {
				return setTimeout($.proxy(callback, this), duration);
			} else {
				callback.call(this);
			}
		}

		function showMethod(event) {
			if (this.tooltip.hasClass(CLASS_DISABLED)) {
				return;
			}

			// Clear hide timers
			clearTimeout(this.timers.show);
			clearTimeout(this.timers.hide);

			// Start show timer
			this.timers.show = delay.call(this, function () {
				this.toggle(TRUE, event);
			}, this.options.show.delay);
		}

		function hideMethod(event) {
			if (this.tooltip.hasClass(CLASS_DISABLED) || this.destroyed) {
				return;
			}

			// Check if new target was actually the tooltip element
			var relatedTarget = $(event.relatedTarget),
			    ontoTooltip = relatedTarget.closest(SELECTOR)[0] === this.tooltip[0],
			    ontoTarget = relatedTarget[0] === this.options.show.target[0];

			// Clear timers and stop animation queue
			clearTimeout(this.timers.show);
			clearTimeout(this.timers.hide);

			// Prevent hiding if tooltip is fixed and event target is the tooltip.
			// Or if mouse positioning is enabled and cursor momentarily overlaps
			if (this !== relatedTarget[0] && this.options.position.target === 'mouse' && ontoTooltip || this.options.hide.fixed && /mouse(out|leave|move)/.test(event.type) && (ontoTooltip || ontoTarget)) {
				/* eslint-disable no-empty */
				try {
					event.preventDefault();
					event.stopImmediatePropagation();
				} catch (e) {}
				/* eslint-enable no-empty */

				return;
			}

			// If tooltip has displayed, start hide timer
			this.timers.hide = delay.call(this, function () {
				this.toggle(FALSE, event);
			}, this.options.hide.delay, this);
		}

		function inactiveMethod(event) {
			if (this.tooltip.hasClass(CLASS_DISABLED) || !this.options.hide.inactive) {
				return;
			}

			// Clear timer
			clearTimeout(this.timers.inactive);

			this.timers.inactive = delay.call(this, function () {
				this.hide(event);
			}, this.options.hide.inactive);
		}

		function repositionMethod(event) {
			if (this.rendered && this.tooltip[0].offsetWidth > 0) {
				this.reposition(event);
			}
		}

		// Store mouse coordinates
		PROTOTYPE._storeMouse = function (event) {
			(this.mouse = $.event.fix(event)).type = 'mousemove';
			return this;
		};

		// Bind events
		PROTOTYPE._bind = function (targets, events, method, suffix, context) {
			if (!targets || !method || !events.length) {
				return;
			}
			var ns = '.' + this._id + (suffix ? '-' + suffix : '');
			$(targets).bind((events.split ? events : events.join(ns + ' ')) + ns, $.proxy(method, context || this));
			return this;
		};
		PROTOTYPE._unbind = function (targets, suffix) {
			targets && $(targets).unbind('.' + this._id + (suffix ? '-' + suffix : ''));
			return this;
		};

		// Global delegation helper
		function delegate(selector, events, method) {
			$(document.body).delegate(selector, (events.split ? events : events.join('.' + NAMESPACE + ' ')) + '.' + NAMESPACE, function () {
				var api = QTIP.api[$.attr(this, ATTR_ID)];
				api && !api.disabled && method.apply(api, arguments);
			});
		}
		// Event trigger
		PROTOTYPE._trigger = function (type, args, event) {
			var callback = new $.Event('tooltip' + type);
			callback.originalEvent = event && $.extend({}, event) || this.cache.event || NULL;

			this.triggering = type;
			this.tooltip.trigger(callback, [this].concat(args || []));
			this.triggering = FALSE;

			return !callback.isDefaultPrevented();
		};

		PROTOTYPE._bindEvents = function (showEvents, hideEvents, showTargets, hideTargets, showCallback, hideCallback) {
			// Get tasrgets that lye within both
			var similarTargets = showTargets.filter(hideTargets).add(hideTargets.filter(showTargets)),
			    toggleEvents = [];

			// If hide and show targets are the same...
			if (similarTargets.length) {

				// Filter identical show/hide events
				$.each(hideEvents, function (i, type) {
					var showIndex = $.inArray(type, showEvents);

					// Both events are identical, remove from both hide and show events
					// and append to toggleEvents
					showIndex > -1 && toggleEvents.push(showEvents.splice(showIndex, 1)[0]);
				});

				// Toggle events are special case of identical show/hide events, which happen in sequence
				if (toggleEvents.length) {
					// Bind toggle events to the similar targets
					this._bind(similarTargets, toggleEvents, function (event) {
						var state = this.rendered ? this.tooltip[0].offsetWidth > 0 : false;
						(state ? hideCallback : showCallback).call(this, event);
					});

					// Remove the similar targets from the regular show/hide bindings
					showTargets = showTargets.not(similarTargets);
					hideTargets = hideTargets.not(similarTargets);
				}
			}

			// Apply show/hide/toggle events
			this._bind(showTargets, showEvents, showCallback);
			this._bind(hideTargets, hideEvents, hideCallback);
		};

		PROTOTYPE._assignInitialEvents = function (event) {
			var options = this.options,
			    showTarget = options.show.target,
			    hideTarget = options.hide.target,
			    showEvents = options.show.event ? $.trim('' + options.show.event).split(' ') : [],
			    hideEvents = options.hide.event ? $.trim('' + options.hide.event).split(' ') : [];

			// Catch remove/removeqtip events on target element to destroy redundant tooltips
			this._bind(this.elements.target, ['remove', 'removeqtip'], function () {
				this.destroy(true);
			}, 'destroy');

			/*
    * Make sure hoverIntent functions properly by using mouseleave as a hide event if
    * mouseenter/mouseout is used for show.event, even if it isn't in the users options.
    */
			if (/mouse(over|enter)/i.test(options.show.event) && !/mouse(out|leave)/i.test(options.hide.event)) {
				hideEvents.push('mouseleave');
			}

			/*
    * Also make sure initial mouse targetting works correctly by caching mousemove coords
    * on show targets before the tooltip has rendered. Also set onTarget when triggered to
    * keep mouse tracking working.
    */
			this._bind(showTarget, 'mousemove', function (moveEvent) {
				this._storeMouse(moveEvent);
				this.cache.onTarget = TRUE;
			});

			// Define hoverIntent function
			function hoverIntent(hoverEvent) {
				// Only continue if tooltip isn't disabled
				if (this.disabled || this.destroyed) {
					return FALSE;
				}

				// Cache the event data
				this.cache.event = hoverEvent && $.event.fix(hoverEvent);
				this.cache.target = hoverEvent && $(hoverEvent.target);

				// Start the event sequence
				clearTimeout(this.timers.show);
				this.timers.show = delay.call(this, function () {
					this.render((typeof hoverEvent === 'undefined' ? 'undefined' : _typeof(hoverEvent)) === 'object' || options.show.ready);
				}, options.prerender ? 0 : options.show.delay);
			}

			// Filter and bind events
			this._bindEvents(showEvents, hideEvents, showTarget, hideTarget, hoverIntent, function () {
				if (!this.timers) {
					return FALSE;
				}
				clearTimeout(this.timers.show);
			});

			// Prerendering is enabled, create tooltip now
			if (options.show.ready || options.prerender) {
				hoverIntent.call(this, event);
			}
		};

		// Event assignment method
		PROTOTYPE._assignEvents = function () {
			var self = this,
			    options = this.options,
			    posOptions = options.position,
			    tooltip = this.tooltip,
			    showTarget = options.show.target,
			    hideTarget = options.hide.target,
			    containerTarget = posOptions.container,
			    viewportTarget = posOptions.viewport,
			    documentTarget = $(document),
			    windowTarget = $(window),
			    showEvents = options.show.event ? $.trim('' + options.show.event).split(' ') : [],
			    hideEvents = options.hide.event ? $.trim('' + options.hide.event).split(' ') : [];

			// Assign passed event callbacks
			$.each(options.events, function (name, callback) {
				self._bind(tooltip, name === 'toggle' ? ['tooltipshow', 'tooltiphide'] : ['tooltip' + name], callback, null, tooltip);
			});

			// Hide tooltips when leaving current window/frame (but not select/option elements)
			if (/mouse(out|leave)/i.test(options.hide.event) && options.hide.leave === 'window') {
				this._bind(documentTarget, ['mouseout', 'blur'], function (event) {
					if (!/select|option/.test(event.target.nodeName) && !event.relatedTarget) {
						this.hide(event);
					}
				});
			}

			// Enable hide.fixed by adding appropriate class
			if (options.hide.fixed) {
				hideTarget = hideTarget.add(tooltip.addClass(CLASS_FIXED));
			}

			/*
    * Make sure hoverIntent functions properly by using mouseleave to clear show timer if
    * mouseenter/mouseout is used for show.event, even if it isn't in the users options.
    */
			else if (/mouse(over|enter)/i.test(options.show.event)) {
					this._bind(hideTarget, 'mouseleave', function () {
						clearTimeout(this.timers.show);
					});
				}

			// Hide tooltip on document mousedown if unfocus events are enabled
			if (('' + options.hide.event).indexOf('unfocus') > -1) {
				this._bind(containerTarget.closest('html'), ['mousedown', 'touchstart'], function (event) {
					var elem = $(event.target),
					    enabled = this.rendered && !this.tooltip.hasClass(CLASS_DISABLED) && this.tooltip[0].offsetWidth > 0,
					    isAncestor = elem.parents(SELECTOR).filter(this.tooltip[0]).length > 0;

					if (elem[0] !== this.target[0] && elem[0] !== this.tooltip[0] && !isAncestor && !this.target.has(elem[0]).length && enabled) {
						this.hide(event);
					}
				});
			}

			// Check if the tooltip hides when inactive
			if ('number' === typeof options.hide.inactive) {
				// Bind inactive method to show target(s) as a custom event
				this._bind(showTarget, 'qtip-' + this.id + '-inactive', inactiveMethod, 'inactive');

				// Define events which reset the 'inactive' event handler
				this._bind(hideTarget.add(tooltip), QTIP.inactiveEvents, inactiveMethod);
			}

			// Filter and bind events
			this._bindEvents(showEvents, hideEvents, showTarget, hideTarget, showMethod, hideMethod);

			// Mouse movement bindings
			this._bind(showTarget.add(tooltip), 'mousemove', function (event) {
				// Check if the tooltip hides when mouse is moved a certain distance
				if ('number' === typeof options.hide.distance) {
					var origin = this.cache.origin || {},
					    limit = this.options.hide.distance,
					    abs = Math.abs;

					// Check if the movement has gone beyond the limit, and hide it if so
					if (abs(event.pageX - origin.pageX) >= limit || abs(event.pageY - origin.pageY) >= limit) {
						this.hide(event);
					}
				}

				// Cache mousemove coords on show targets
				this._storeMouse(event);
			});

			// Mouse positioning events
			if (posOptions.target === 'mouse') {
				// If mouse adjustment is on...
				if (posOptions.adjust.mouse) {
					// Apply a mouseleave event so we don't get problems with overlapping
					if (options.hide.event) {
						// Track if we're on the target or not
						this._bind(showTarget, ['mouseenter', 'mouseleave'], function (event) {
							if (!this.cache) {
								return FALSE;
							}
							this.cache.onTarget = event.type === 'mouseenter';
						});
					}

					// Update tooltip position on mousemove
					this._bind(documentTarget, 'mousemove', function (event) {
						// Update the tooltip position only if the tooltip is visible and adjustment is enabled
						if (this.rendered && this.cache.onTarget && !this.tooltip.hasClass(CLASS_DISABLED) && this.tooltip[0].offsetWidth > 0) {
							this.reposition(event);
						}
					});
				}
			}

			// Adjust positions of the tooltip on window resize if enabled
			if (posOptions.adjust.resize || viewportTarget.length) {
				this._bind($.event.special.resize ? viewportTarget : windowTarget, 'resize', repositionMethod);
			}

			// Adjust tooltip position on scroll of the window or viewport element if present
			if (posOptions.adjust.scroll) {
				this._bind(windowTarget.add(posOptions.container), 'scroll', repositionMethod);
			}
		};

		// Un-assignment method
		PROTOTYPE._unassignEvents = function () {
			var options = this.options,
			    showTargets = options.show.target,
			    hideTargets = options.hide.target,
			    targets = $.grep([this.elements.target[0], this.rendered && this.tooltip[0], options.position.container[0], options.position.viewport[0], options.position.container.closest('html')[0], // unfocus
			window, document], function (i) {
				return (typeof i === 'undefined' ? 'undefined' : _typeof(i)) === 'object';
			});

			// Add show and hide targets if they're valid
			if (showTargets && showTargets.toArray) {
				targets = targets.concat(showTargets.toArray());
			}
			if (hideTargets && hideTargets.toArray) {
				targets = targets.concat(hideTargets.toArray());
			}

			// Unbind the events
			this._unbind(targets)._unbind(targets, 'destroy')._unbind(targets, 'inactive');
		};

		// Apply common event handlers using delegate (avoids excessive .bind calls!)
		$(function () {
			delegate(SELECTOR, ['mouseenter', 'mouseleave'], function (event) {
				var state = event.type === 'mouseenter',
				    tooltip = $(event.currentTarget),
				    target = $(event.relatedTarget || event.target),
				    options = this.options;

				// On mouseenter...
				if (state) {
					// Focus the tooltip on mouseenter (z-index stacking)
					this.focus(event);

					// Clear hide timer on tooltip hover to prevent it from closing
					tooltip.hasClass(CLASS_FIXED) && !tooltip.hasClass(CLASS_DISABLED) && clearTimeout(this.timers.hide);
				}

				// On mouseleave...
				else {
						// When mouse tracking is enabled, hide when we leave the tooltip and not onto the show target (if a hide event is set)
						if (options.position.target === 'mouse' && options.position.adjust.mouse && options.hide.event && options.show.target && !target.closest(options.show.target[0]).length) {
							this.hide(event);
						}
					}

				// Add hover class
				tooltip.toggleClass(CLASS_HOVER, state);
			});

			// Define events which reset the 'inactive' event handler
			delegate('[' + ATTR_ID + ']', INACTIVE_EVENTS, inactiveMethod);
		});
		; // Initialization method
		function init(elem, id, opts) {
			var obj,
			    posOptions,
			    attr,
			    config,
			    title,


			// Setup element references
			docBody = $(document.body),


			// Use document body instead of document element if needed
			newTarget = elem[0] === document ? docBody : elem,


			// Grab metadata from element if plugin is present
			metadata = elem.metadata ? elem.metadata(opts.metadata) : NULL,


			// If metadata type if HTML5, grab 'name' from the object instead, or use the regular data object otherwise
			metadata5 = opts.metadata.type === 'html5' && metadata ? metadata[opts.metadata.name] : NULL,


			// Grab data from metadata.name (or data-qtipopts as fallback) using .data() method,
			html5 = elem.data(opts.metadata.name || 'qtipopts');

			// If we don't get an object returned attempt to parse it manualyl without parseJSON
			/* eslint-disable no-empty */
			try {
				html5 = typeof html5 === 'string' ? $.parseJSON(html5) : html5;
			} catch (e) {}
			/* eslint-enable no-empty */

			// Merge in and sanitize metadata
			config = $.extend(TRUE, {}, QTIP.defaults, opts, (typeof html5 === 'undefined' ? 'undefined' : _typeof(html5)) === 'object' ? sanitizeOptions(html5) : NULL, sanitizeOptions(metadata5 || metadata));

			// Re-grab our positioning options now we've merged our metadata and set id to passed value
			posOptions = config.position;
			config.id = id;

			// Setup missing content if none is detected
			if ('boolean' === typeof config.content.text) {
				attr = elem.attr(config.content.attr);

				// Grab from supplied attribute if available
				if (config.content.attr !== FALSE && attr) {
					config.content.text = attr;
				}

				// No valid content was found, abort render
				else {
						return FALSE;
					}
			}

			// Setup target options
			if (!posOptions.container.length) {
				posOptions.container = docBody;
			}
			if (posOptions.target === FALSE) {
				posOptions.target = newTarget;
			}
			if (config.show.target === FALSE) {
				config.show.target = newTarget;
			}
			if (config.show.solo === TRUE) {
				config.show.solo = posOptions.container.closest('body');
			}
			if (config.hide.target === FALSE) {
				config.hide.target = newTarget;
			}
			if (config.position.viewport === TRUE) {
				config.position.viewport = posOptions.container;
			}

			// Ensure we only use a single container
			posOptions.container = posOptions.container.eq(0);

			// Convert position corner values into x and y strings
			posOptions.at = new CORNER(posOptions.at, TRUE);
			posOptions.my = new CORNER(posOptions.my);

			// Destroy previous tooltip if overwrite is enabled, or skip element if not
			if (elem.data(NAMESPACE)) {
				if (config.overwrite) {
					elem.qtip('destroy', true);
				} else if (config.overwrite === FALSE) {
					return FALSE;
				}
			}

			// Add has-qtip attribute
			elem.attr(ATTR_HAS, id);

			// Remove title attribute and store it if present
			if (config.suppress && (title = elem.attr('title'))) {
				// Final attr call fixes event delegatiom and IE default tooltip showing problem
				elem.removeAttr('title').attr(oldtitle, title).attr('title', '');
			}

			// Initialize the tooltip and add API reference
			obj = new QTip(elem, config, id, !!attr);
			elem.data(NAMESPACE, obj);

			return obj;
		}

		// jQuery $.fn extension method
		QTIP = $.fn.qtip = function (options, notation, newValue) {
			var command = ('' + options).toLowerCase(),
			    // Parse command
			returned = NULL,
			    args = $.makeArray(arguments).slice(1),
			    event = args[args.length - 1],
			    opts = this[0] ? $.data(this[0], NAMESPACE) : NULL;

			// Check for API request
			if (!arguments.length && opts || command === 'api') {
				return opts;
			}

			// Execute API command if present
			else if ('string' === typeof options) {
					this.each(function () {
						var api = $.data(this, NAMESPACE);
						if (!api) {
							return TRUE;
						}

						// Cache the event if possible
						if (event && event.timeStamp) {
							api.cache.event = event;
						}

						// Check for specific API commands
						if (notation && (command === 'option' || command === 'options')) {
							if (newValue !== undefined || $.isPlainObject(notation)) {
								api.set(notation, newValue);
							} else {
								returned = api.get(notation);
								return FALSE;
							}
						}

						// Execute API command
						else if (api[command]) {
								api[command].apply(api, args);
							}
					});

					return returned !== NULL ? returned : this;
				}

				// No API commands. validate provided options and setup qTips
				else if ('object' === (typeof options === 'undefined' ? 'undefined' : _typeof(options)) || !arguments.length) {
						// Sanitize options first
						opts = sanitizeOptions($.extend(TRUE, {}, options));

						return this.each(function (i) {
							var api, id;

							// Find next available ID, or use custom ID if provided
							id = $.isArray(opts.id) ? opts.id[i] : opts.id;
							id = !id || id === FALSE || id.length < 1 || QTIP.api[id] ? QTIP.nextid++ : id;

							// Initialize the qTip and re-grab newly sanitized options
							api = init($(this), id, opts);
							if (api === FALSE) {
								return TRUE;
							} else {
								QTIP.api[id] = api;
							}

							// Initialize plugins
							$.each(PLUGINS, function () {
								if (this.initialize === 'initialize') {
									this(api);
								}
							});

							// Assign initial pre-render events
							api._assignInitialEvents(event);
						});
					}
		};

		// Expose class
		$.qtip = QTip;

		// Populated in render method
		QTIP.api = {};
		;$.each({
			/* Allow other plugins to successfully retrieve the title of an element with a qTip applied */
			attr: function attr(_attr, val) {
				if (this.length) {
					var self = this[0],
					    title = 'title',
					    api = $.data(self, 'qtip');

					if (_attr === title && api && api.options && 'object' === (typeof api === 'undefined' ? 'undefined' : _typeof(api)) && 'object' === _typeof(api.options) && api.options.suppress) {
						if (arguments.length < 2) {
							return $.attr(self, oldtitle);
						}

						// If qTip is rendered and title was originally used as content, update it
						if (api && api.options.content.attr === title && api.cache.attr) {
							api.set('content.text', val);
						}

						// Use the regular attr method to set, then cache the result
						return this.attr(oldtitle, val);
					}
				}

				return $.fn['attr' + replaceSuffix].apply(this, arguments);
			},

			/* Allow clone to correctly retrieve cached title attributes */
			clone: function clone(keepData) {
				// Clone our element using the real clone method
				var elems = $.fn['clone' + replaceSuffix].apply(this, arguments);

				// Grab all elements with an oldtitle set, and change it to regular title attribute, if keepData is false
				if (!keepData) {
					elems.filter('[' + oldtitle + ']').attr('title', function () {
						return $.attr(this, oldtitle);
					}).removeAttr(oldtitle);
				}

				return elems;
			}
		}, function (name, func) {
			if (!func || $.fn[name + replaceSuffix]) {
				return TRUE;
			}

			var old = $.fn[name + replaceSuffix] = $.fn[name];
			$.fn[name] = function () {
				return func.apply(this, arguments) || old.apply(this, arguments);
			};
		});

		/* Fire off 'removeqtip' handler in $.cleanData if jQuery UI not present (it already does similar).
   * This snippet is taken directly from jQuery UI source code found here:
   *     http://code.jquery.com/ui/jquery-ui-git.js
   */
		if (!$.ui) {
			$['cleanData' + replaceSuffix] = $.cleanData;
			$.cleanData = function (elems) {
				for (var i = 0, elem; (elem = $(elems[i])).length; i++) {
					if (elem.attr(ATTR_HAS)) {
						/* eslint-disable no-empty */
						try {
							elem.triggerHandler('removeqtip');
						} catch (e) {}
						/* eslint-enable no-empty */
					}
				}
				$['cleanData' + replaceSuffix].apply(this, arguments);
			};
		}
		; // qTip version
		QTIP.version = '3.0.3';

		// Base ID for all qTips
		QTIP.nextid = 0;

		// Inactive events array
		QTIP.inactiveEvents = INACTIVE_EVENTS;

		// Base z-index for all qTips
		QTIP.zindex = 15000;

		// Define configuration defaults
		QTIP.defaults = {
			prerender: FALSE,
			id: FALSE,
			overwrite: TRUE,
			suppress: TRUE,
			content: {
				text: TRUE,
				attr: 'title',
				title: FALSE,
				button: FALSE
			},
			position: {
				my: 'top left',
				at: 'bottom right',
				target: FALSE,
				container: FALSE,
				viewport: FALSE,
				adjust: {
					x: 0, y: 0,
					mouse: TRUE,
					scroll: TRUE,
					resize: TRUE,
					method: 'flipinvert flipinvert'
				},
				effect: function effect(api, pos) {
					$(this).animate(pos, {
						duration: 200,
						queue: FALSE
					});
				}
			},
			show: {
				target: FALSE,
				event: 'mouseenter',
				effect: TRUE,
				delay: 90,
				solo: FALSE,
				ready: FALSE,
				autofocus: FALSE
			},
			hide: {
				target: FALSE,
				event: 'mouseleave',
				effect: TRUE,
				delay: 0,
				fixed: FALSE,
				inactive: FALSE,
				leave: 'window',
				distance: FALSE
			},
			style: {
				classes: '',
				widget: FALSE,
				width: FALSE,
				height: FALSE,
				def: TRUE
			},
			events: {
				render: NULL,
				move: NULL,
				show: NULL,
				hide: NULL,
				toggle: NULL,
				visible: NULL,
				hidden: NULL,
				focus: NULL,
				blur: NULL
			}
		};
		;var TIP,
		    createVML,
		    SCALE,
		    PIXEL_RATIO,
		    BACKING_STORE_RATIO,


		// Common CSS strings
		MARGIN = 'margin',
		    BORDER = 'border',
		    COLOR = 'color',
		    BG_COLOR = 'background-color',
		    TRANSPARENT = 'transparent',
		    IMPORTANT = ' !important',


		// Check if the browser supports <canvas/> elements
		HASCANVAS = !!document.createElement('canvas').getContext,


		// Invalid colour values used in parseColours()
		INVALID = /rgba?\(0, 0, 0(, 0)?\)|transparent|#123456/i;

		// Camel-case method, taken from jQuery source
		// http://code.jquery.com/jquery-1.8.0.js
		function camel(s) {
			return s.charAt(0).toUpperCase() + s.slice(1);
		}

		/*
   * Modified from Modernizr's testPropsAll()
   * http://modernizr.com/downloads/modernizr-latest.js
   */
		var cssProps = {},
		    cssPrefixes = ['Webkit', 'O', 'Moz', 'ms'];
		function vendorCss(elem, prop) {
			var ucProp = prop.charAt(0).toUpperCase() + prop.slice(1),
			    props = (prop + ' ' + cssPrefixes.join(ucProp + ' ') + ucProp).split(' '),
			    cur,
			    val,
			    i = 0;

			// If the property has already been mapped...
			if (cssProps[prop]) {
				return elem.css(cssProps[prop]);
			}

			while (cur = props[i++]) {
				if ((val = elem.css(cur)) !== undefined) {
					cssProps[prop] = cur;
					return val;
				}
			}
		}

		// Parse a given elements CSS property into an int
		function intCss(elem, prop) {
			return Math.ceil(parseFloat(vendorCss(elem, prop)));
		}

		// VML creation (for IE only)
		if (!HASCANVAS) {
			createVML = function createVML(tag, props, style) {
				return '<qtipvml:' + tag + ' xmlns="urn:schemas-microsoft.com:vml" class="qtip-vml" ' + (props || '') + ' style="behavior: url(#default#VML); ' + (style || '') + '" />';
			};
		}

		// Canvas only definitions
		else {
				PIXEL_RATIO = window.devicePixelRatio || 1;
				BACKING_STORE_RATIO = function () {
					var context = document.createElement('canvas').getContext('2d');
					return context.backingStorePixelRatio || context.webkitBackingStorePixelRatio || context.mozBackingStorePixelRatio || context.msBackingStorePixelRatio || context.oBackingStorePixelRatio || 1;
				}();
				SCALE = PIXEL_RATIO / BACKING_STORE_RATIO;
			}

		function Tip(qtip, options) {
			this._ns = 'tip';
			this.options = options;
			this.offset = options.offset;
			this.size = [options.width, options.height];

			// Initialize
			this.qtip = qtip;
			this.init(qtip);
		}

		$.extend(Tip.prototype, {
			init: function init(qtip) {
				var context, tip;

				// Create tip element and prepend to the tooltip
				tip = this.element = qtip.elements.tip = $('<div />', { 'class': NAMESPACE + '-tip' }).prependTo(qtip.tooltip);

				// Create tip drawing element(s)
				if (HASCANVAS) {
					// save() as soon as we create the canvas element so FF2 doesn't bork on our first restore()!
					context = $('<canvas />').appendTo(this.element)[0].getContext('2d');

					// Setup constant parameters
					context.lineJoin = 'miter';
					context.miterLimit = 100000;
					context.save();
				} else {
					context = createVML('shape', 'coordorigin="0,0"', 'position:absolute;');
					this.element.html(context + context);

					// Prevent mousing down on the tip since it causes problems with .live() handling in IE due to VML
					qtip._bind($('*', tip).add(tip), ['click', 'mousedown'], function (event) {
						event.stopPropagation();
					}, this._ns);
				}

				// Bind update events
				qtip._bind(qtip.tooltip, 'tooltipmove', this.reposition, this._ns, this);

				// Create it
				this.create();
			},

			_swapDimensions: function _swapDimensions() {
				this.size[0] = this.options.height;
				this.size[1] = this.options.width;
			},
			_resetDimensions: function _resetDimensions() {
				this.size[0] = this.options.width;
				this.size[1] = this.options.height;
			},

			_useTitle: function _useTitle(corner) {
				var titlebar = this.qtip.elements.titlebar;
				return titlebar && (corner.y === TOP || corner.y === CENTER && this.element.position().top + this.size[1] / 2 + this.options.offset < titlebar.outerHeight(TRUE));
			},

			_parseCorner: function _parseCorner(corner) {
				var my = this.qtip.options.position.my;

				// Detect corner and mimic properties
				if (corner === FALSE || my === FALSE) {
					corner = FALSE;
				} else if (corner === TRUE) {
					corner = new CORNER(my.string());
				} else if (!corner.string) {
					corner = new CORNER(corner);
					corner.fixed = TRUE;
				}

				return corner;
			},

			_parseWidth: function _parseWidth(corner, side, use) {
				var elements = this.qtip.elements,
				    prop = BORDER + camel(side) + 'Width';

				return (use ? intCss(use, prop) : intCss(elements.content, prop) || intCss(this._useTitle(corner) && elements.titlebar || elements.content, prop) || intCss(elements.tooltip, prop)) || 0;
			},

			_parseRadius: function _parseRadius(corner) {
				var elements = this.qtip.elements,
				    prop = BORDER + camel(corner.y) + camel(corner.x) + 'Radius';

				return BROWSER.ie < 9 ? 0 : intCss(this._useTitle(corner) && elements.titlebar || elements.content, prop) || intCss(elements.tooltip, prop) || 0;
			},

			_invalidColour: function _invalidColour(elem, prop, compare) {
				var val = elem.css(prop);
				return !val || compare && val === elem.css(compare) || INVALID.test(val) ? FALSE : val;
			},

			_parseColours: function _parseColours(corner) {
				var elements = this.qtip.elements,
				    tip = this.element.css('cssText', ''),
				    borderSide = BORDER + camel(corner[corner.precedance]) + camel(COLOR),
				    colorElem = this._useTitle(corner) && elements.titlebar || elements.content,
				    css = this._invalidColour,
				    color = [];

				// Attempt to detect the background colour from various elements, left-to-right precedance
				color[0] = css(tip, BG_COLOR) || css(colorElem, BG_COLOR) || css(elements.content, BG_COLOR) || css(elements.tooltip, BG_COLOR) || tip.css(BG_COLOR);

				// Attempt to detect the correct border side colour from various elements, left-to-right precedance
				color[1] = css(tip, borderSide, COLOR) || css(colorElem, borderSide, COLOR) || css(elements.content, borderSide, COLOR) || css(elements.tooltip, borderSide, COLOR) || elements.tooltip.css(borderSide);

				// Reset background and border colours
				$('*', tip).add(tip).css('cssText', BG_COLOR + ':' + TRANSPARENT + IMPORTANT + ';' + BORDER + ':0' + IMPORTANT + ';');

				return color;
			},

			_calculateSize: function _calculateSize(corner) {
				var y = corner.precedance === Y,
				    width = this.options.width,
				    height = this.options.height,
				    isCenter = corner.abbrev() === 'c',
				    base = (y ? width : height) * (isCenter ? 0.5 : 1),
				    pow = Math.pow,
				    round = Math.round,
				    bigHyp,
				    ratio,
				    result,
				    smallHyp = Math.sqrt(pow(base, 2) + pow(height, 2)),
				    hyp = [this.border / base * smallHyp, this.border / height * smallHyp];

				hyp[2] = Math.sqrt(pow(hyp[0], 2) - pow(this.border, 2));
				hyp[3] = Math.sqrt(pow(hyp[1], 2) - pow(this.border, 2));

				bigHyp = smallHyp + hyp[2] + hyp[3] + (isCenter ? 0 : hyp[0]);
				ratio = bigHyp / smallHyp;

				result = [round(ratio * width), round(ratio * height)];
				return y ? result : result.reverse();
			},

			// Tip coordinates calculator
			_calculateTip: function _calculateTip(corner, size, scale) {
				scale = scale || 1;
				size = size || this.size;

				var width = size[0] * scale,
				    height = size[1] * scale,
				    width2 = Math.ceil(width / 2),
				    height2 = Math.ceil(height / 2),


				// Define tip coordinates in terms of height and width values
				tips = {
					br: [0, 0, width, height, width, 0],
					bl: [0, 0, width, 0, 0, height],
					tr: [0, height, width, 0, width, height],
					tl: [0, 0, 0, height, width, height],
					tc: [0, height, width2, 0, width, height],
					bc: [0, 0, width, 0, width2, height],
					rc: [0, 0, width, height2, 0, height],
					lc: [width, 0, width, height, 0, height2]
				};

				// Set common side shapes
				tips.lt = tips.br;tips.rt = tips.bl;
				tips.lb = tips.tr;tips.rb = tips.tl;

				return tips[corner.abbrev()];
			},

			// Tip coordinates drawer (canvas)
			_drawCoords: function _drawCoords(context, coords) {
				context.beginPath();
				context.moveTo(coords[0], coords[1]);
				context.lineTo(coords[2], coords[3]);
				context.lineTo(coords[4], coords[5]);
				context.closePath();
			},

			create: function create() {
				// Determine tip corner
				var c = this.corner = (HASCANVAS || BROWSER.ie) && this._parseCorner(this.options.corner);

				// If we have a tip corner...
				this.enabled = !!this.corner && this.corner.abbrev() !== 'c';
				if (this.enabled) {
					// Cache it
					this.qtip.cache.corner = c.clone();

					// Create it
					this.update();
				}

				// Toggle tip element
				this.element.toggle(this.enabled);

				return this.corner;
			},

			update: function update(corner, position) {
				if (!this.enabled) {
					return this;
				}

				var elements = this.qtip.elements,
				    tip = this.element,
				    inner = tip.children(),
				    options = this.options,
				    curSize = this.size,
				    mimic = options.mimic,
				    round = Math.round,
				    color,
				    precedance,
				    context,
				    coords,
				    bigCoords,
				    translate,
				    newSize,
				    border;

				// Re-determine tip if not already set
				if (!corner) {
					corner = this.qtip.cache.corner || this.corner;
				}

				// Use corner property if we detect an invalid mimic value
				if (mimic === FALSE) {
					mimic = corner;
				}

				// Otherwise inherit mimic properties from the corner object as necessary
				else {
						mimic = new CORNER(mimic);
						mimic.precedance = corner.precedance;

						if (mimic.x === 'inherit') {
							mimic.x = corner.x;
						} else if (mimic.y === 'inherit') {
							mimic.y = corner.y;
						} else if (mimic.x === mimic.y) {
							mimic[corner.precedance] = corner[corner.precedance];
						}
					}
				precedance = mimic.precedance;

				// Ensure the tip width.height are relative to the tip position
				if (corner.precedance === X) {
					this._swapDimensions();
				} else {
					this._resetDimensions();
				}

				// Update our colours
				color = this.color = this._parseColours(corner);

				// Detect border width, taking into account colours
				if (color[1] !== TRANSPARENT) {
					// Grab border width
					border = this.border = this._parseWidth(corner, corner[corner.precedance]);

					// If border width isn't zero, use border color as fill if it's not invalid (1.0 style tips)
					if (options.border && border < 1 && !INVALID.test(color[1])) {
						color[0] = color[1];
					}

					// Set border width (use detected border width if options.border is true)
					this.border = border = options.border !== TRUE ? options.border : border;
				}

				// Border colour was invalid, set border to zero
				else {
						this.border = border = 0;
					}

				// Determine tip size
				newSize = this.size = this._calculateSize(corner);
				tip.css({
					width: newSize[0],
					height: newSize[1],
					lineHeight: newSize[1] + 'px'
				});

				// Calculate tip translation
				if (corner.precedance === Y) {
					translate = [round(mimic.x === LEFT ? border : mimic.x === RIGHT ? newSize[0] - curSize[0] - border : (newSize[0] - curSize[0]) / 2), round(mimic.y === TOP ? newSize[1] - curSize[1] : 0)];
				} else {
					translate = [round(mimic.x === LEFT ? newSize[0] - curSize[0] : 0), round(mimic.y === TOP ? border : mimic.y === BOTTOM ? newSize[1] - curSize[1] - border : (newSize[1] - curSize[1]) / 2)];
				}

				// Canvas drawing implementation
				if (HASCANVAS) {
					// Grab canvas context and clear/save it
					context = inner[0].getContext('2d');
					context.restore();context.save();
					context.clearRect(0, 0, 6000, 6000);

					// Calculate coordinates
					coords = this._calculateTip(mimic, curSize, SCALE);
					bigCoords = this._calculateTip(mimic, this.size, SCALE);

					// Set the canvas size using calculated size
					inner.attr(WIDTH, newSize[0] * SCALE).attr(HEIGHT, newSize[1] * SCALE);
					inner.css(WIDTH, newSize[0]).css(HEIGHT, newSize[1]);

					// Draw the outer-stroke tip
					this._drawCoords(context, bigCoords);
					context.fillStyle = color[1];
					context.fill();

					// Draw the actual tip
					context.translate(translate[0] * SCALE, translate[1] * SCALE);
					this._drawCoords(context, coords);
					context.fillStyle = color[0];
					context.fill();
				}

				// VML (IE Proprietary implementation)
				else {
						// Calculate coordinates
						coords = this._calculateTip(mimic);

						// Setup coordinates string
						coords = 'm' + coords[0] + ',' + coords[1] + ' l' + coords[2] + ',' + coords[3] + ' ' + coords[4] + ',' + coords[5] + ' xe';

						// Setup VML-specific offset for pixel-perfection
						translate[2] = border && /^(r|b)/i.test(corner.string()) ? BROWSER.ie === 8 ? 2 : 1 : 0;

						// Set initial CSS
						inner.css({
							coordsize: newSize[0] + border + ' ' + newSize[1] + border,
							antialias: '' + (mimic.string().indexOf(CENTER) > -1),
							left: translate[0] - translate[2] * Number(precedance === X),
							top: translate[1] - translate[2] * Number(precedance === Y),
							width: newSize[0] + border,
							height: newSize[1] + border
						}).each(function (i) {
							var $this = $(this);

							// Set shape specific attributes
							$this[$this.prop ? 'prop' : 'attr']({
								coordsize: newSize[0] + border + ' ' + newSize[1] + border,
								path: coords,
								fillcolor: color[0],
								filled: !!i,
								stroked: !i
							}).toggle(!!(border || i));

							// Check if border is enabled and add stroke element
							!i && $this.html(createVML('stroke', 'weight="' + border * 2 + 'px" color="' + color[1] + '" miterlimit="1000" joinstyle="miter"'));
						});
					}

				// Opera bug #357 - Incorrect tip position
				// https://github.com/Craga89/qTip2/issues/367
				window.opera && setTimeout(function () {
					elements.tip.css({
						display: 'inline-block',
						visibility: 'visible'
					});
				}, 1);

				// Position if needed
				if (position !== FALSE) {
					this.calculate(corner, newSize);
				}
			},

			calculate: function calculate(corner, size) {
				if (!this.enabled) {
					return FALSE;
				}

				var self = this,
				    elements = this.qtip.elements,
				    tip = this.element,
				    userOffset = this.options.offset,
				    position = {},
				    precedance,
				    corners;

				// Inherit corner if not provided
				corner = corner || this.corner;
				precedance = corner.precedance;

				// Determine which tip dimension to use for adjustment
				size = size || this._calculateSize(corner);

				// Setup corners and offset array
				corners = [corner.x, corner.y];
				if (precedance === X) {
					corners.reverse();
				}

				// Calculate tip position
				$.each(corners, function (i, side) {
					var b, bc, br;

					if (side === CENTER) {
						b = precedance === Y ? LEFT : TOP;
						position[b] = '50%';
						position[MARGIN + '-' + b] = -Math.round(size[precedance === Y ? 0 : 1] / 2) + userOffset;
					} else {
						b = self._parseWidth(corner, side, elements.tooltip);
						bc = self._parseWidth(corner, side, elements.content);
						br = self._parseRadius(corner);

						position[side] = Math.max(-self.border, i ? bc : userOffset + (br > b ? br : -b));
					}
				});

				// Adjust for tip size
				position[corner[precedance]] -= size[precedance === X ? 0 : 1];

				// Set and return new position
				tip.css({ margin: '', top: '', bottom: '', left: '', right: '' }).css(position);
				return position;
			},

			reposition: function reposition(event, api, pos) {
				if (!this.enabled) {
					return;
				}

				var cache = api.cache,
				    newCorner = this.corner.clone(),
				    adjust = pos.adjusted,
				    method = api.options.position.adjust.method.split(' '),
				    horizontal = method[0],
				    vertical = method[1] || method[0],
				    shift = { left: FALSE, top: FALSE, x: 0, y: 0 },
				    offset,
				    css = {},
				    props;

				function shiftflip(direction, precedance, popposite, side, opposite) {
					// Horizontal - Shift or flip method
					if (direction === SHIFT && newCorner.precedance === precedance && adjust[side] && newCorner[popposite] !== CENTER) {
						newCorner.precedance = newCorner.precedance === X ? Y : X;
					} else if (direction !== SHIFT && adjust[side]) {
						newCorner[precedance] = newCorner[precedance] === CENTER ? adjust[side] > 0 ? side : opposite : newCorner[precedance] === side ? opposite : side;
					}
				}

				function shiftonly(xy, side, opposite) {
					if (newCorner[xy] === CENTER) {
						css[MARGIN + '-' + side] = shift[xy] = offset[MARGIN + '-' + side] - adjust[side];
					} else {
						props = offset[opposite] !== undefined ? [adjust[side], -offset[side]] : [-adjust[side], offset[side]];

						if ((shift[xy] = Math.max(props[0], props[1])) > props[0]) {
							pos[side] -= adjust[side];
							shift[side] = FALSE;
						}

						css[offset[opposite] !== undefined ? opposite : side] = shift[xy];
					}
				}

				// If our tip position isn't fixed e.g. doesn't adjust with viewport...
				if (this.corner.fixed !== TRUE) {
					// Perform shift/flip adjustments
					shiftflip(horizontal, X, Y, LEFT, RIGHT);
					shiftflip(vertical, Y, X, TOP, BOTTOM);

					// Update and redraw the tip if needed (check cached details of last drawn tip)
					if (newCorner.string() !== cache.corner.string() || cache.cornerTop !== adjust.top || cache.cornerLeft !== adjust.left) {
						this.update(newCorner, FALSE);
					}
				}

				// Setup tip offset properties
				offset = this.calculate(newCorner);

				// Readjust offset object to make it left/top
				if (offset.right !== undefined) {
					offset.left = -offset.right;
				}
				if (offset.bottom !== undefined) {
					offset.top = -offset.bottom;
				}
				offset.user = this.offset;

				// Perform shift adjustments
				shift.left = horizontal === SHIFT && !!adjust.left;
				if (shift.left) {
					shiftonly(X, LEFT, RIGHT);
				}
				shift.top = vertical === SHIFT && !!adjust.top;
				if (shift.top) {
					shiftonly(Y, TOP, BOTTOM);
				}

				/*
    * If the tip is adjusted in both dimensions, or in a
    * direction that would cause it to be anywhere but the
    * outer border, hide it!
    */
				this.element.css(css).toggle(!(shift.x && shift.y || newCorner.x === CENTER && shift.y || newCorner.y === CENTER && shift.x));

				// Adjust position to accomodate tip dimensions
				pos.left -= offset.left.charAt ? offset.user : horizontal !== SHIFT || shift.top || !shift.left && !shift.top ? offset.left + this.border : 0;
				pos.top -= offset.top.charAt ? offset.user : vertical !== SHIFT || shift.left || !shift.left && !shift.top ? offset.top + this.border : 0;

				// Cache details
				cache.cornerLeft = adjust.left;cache.cornerTop = adjust.top;
				cache.corner = newCorner.clone();
			},

			destroy: function destroy() {
				// Unbind events
				this.qtip._unbind(this.qtip.tooltip, this._ns);

				// Remove the tip element(s)
				if (this.qtip.elements.tip) {
					this.qtip.elements.tip.find('*').remove().end().remove();
				}
			}
		});

		TIP = PLUGINS.tip = function (api) {
			return new Tip(api, api.options.style.tip);
		};

		// Initialize tip on render
		TIP.initialize = 'render';

		// Setup plugin sanitization options
		TIP.sanitize = function (options) {
			if (options.style && 'tip' in options.style) {
				var opts = options.style.tip;
				if ((typeof opts === 'undefined' ? 'undefined' : _typeof(opts)) !== 'object') {
					opts = options.style.tip = { corner: opts };
				}
				if (!/string|boolean/i.test(_typeof(opts.corner))) {
					opts.corner = TRUE;
				}
			}
		};

		// Add new option checks for the plugin
		CHECKS.tip = {
			'^position.my|style.tip.(corner|mimic|border)$': function positionMyStyleTipCornerMimicBorder$() {
				// Make sure a tip can be drawn
				this.create();

				// Reposition the tooltip
				this.qtip.reposition();
			},
			'^style.tip.(height|width)$': function styleTipHeightWidth$(obj) {
				// Re-set dimensions and redraw the tip
				this.size = [obj.width, obj.height];
				this.update();

				// Reposition the tooltip
				this.qtip.reposition();
			},
			'^content.title|style.(classes|widget)$': function contentTitleStyleClassesWidget$() {
				this.update();
			}
		};

		// Extend original qTip defaults
		$.extend(TRUE, QTIP.defaults, {
			style: {
				tip: {
					corner: TRUE,
					mimic: FALSE,
					width: 6,
					height: 6,
					border: TRUE,
					offset: 0
				}
			}
		});
		;PLUGINS.viewport = function (api, position, posOptions, targetWidth, targetHeight, elemWidth, elemHeight) {
			var target = posOptions.target,
			    tooltip = api.elements.tooltip,
			    my = posOptions.my,
			    at = posOptions.at,
			    adjust = posOptions.adjust,
			    method = adjust.method.split(' '),
			    methodX = method[0],
			    methodY = method[1] || method[0],
			    viewport = posOptions.viewport,
			    container = posOptions.container,
			    adjusted = { left: 0, top: 0 },
			    fixed,
			    newMy,
			    containerOffset,
			    containerStatic,
			    viewportWidth,
			    viewportHeight,
			    viewportScroll,
			    viewportOffset;

			// If viewport is not a jQuery element, or it's the window/document, or no adjustment method is used... return
			if (!viewport.jquery || target[0] === window || target[0] === document.body || adjust.method === 'none') {
				return adjusted;
			}

			// Cach container details
			containerOffset = container.offset() || adjusted;
			containerStatic = container.css('position') === 'static';

			// Cache our viewport details
			fixed = tooltip.css('position') === 'fixed';
			viewportWidth = viewport[0] === window ? viewport.width() : viewport.outerWidth(FALSE);
			viewportHeight = viewport[0] === window ? viewport.height() : viewport.outerHeight(FALSE);
			viewportScroll = { left: fixed ? 0 : viewport.scrollLeft(), top: fixed ? 0 : viewport.scrollTop() };
			viewportOffset = viewport.offset() || adjusted;

			// Generic calculation method
			function calculate(side, otherSide, type, adjustment, side1, side2, lengthName, targetLength, elemLength) {
				var initialPos = position[side1],
				    mySide = my[side],
				    atSide = at[side],
				    isShift = type === SHIFT,
				    myLength = mySide === side1 ? elemLength : mySide === side2 ? -elemLength : -elemLength / 2,
				    atLength = atSide === side1 ? targetLength : atSide === side2 ? -targetLength : -targetLength / 2,
				    sideOffset = viewportScroll[side1] + viewportOffset[side1] - (containerStatic ? 0 : containerOffset[side1]),
				    overflow1 = sideOffset - initialPos,
				    overflow2 = initialPos + elemLength - (lengthName === WIDTH ? viewportWidth : viewportHeight) - sideOffset,
				    offset = myLength - (my.precedance === side || mySide === my[otherSide] ? atLength : 0) - (atSide === CENTER ? targetLength / 2 : 0);

				// shift
				if (isShift) {
					offset = (mySide === side1 ? 1 : -1) * myLength;

					// Adjust position but keep it within viewport dimensions
					position[side1] += overflow1 > 0 ? overflow1 : overflow2 > 0 ? -overflow2 : 0;
					position[side1] = Math.max(-containerOffset[side1] + viewportOffset[side1], initialPos - offset, Math.min(Math.max(-containerOffset[side1] + viewportOffset[side1] + (lengthName === WIDTH ? viewportWidth : viewportHeight), initialPos + offset), position[side1],

					// Make sure we don't adjust complete off the element when using 'center'
					mySide === 'center' ? initialPos - myLength : 1E9));
				}

				// flip/flipinvert
				else {
						// Update adjustment amount depending on if using flipinvert or flip
						adjustment *= type === FLIPINVERT ? 2 : 0;

						// Check for overflow on the left/top
						if (overflow1 > 0 && (mySide !== side1 || overflow2 > 0)) {
							position[side1] -= offset + adjustment;
							newMy.invert(side, side1);
						}

						// Check for overflow on the bottom/right
						else if (overflow2 > 0 && (mySide !== side2 || overflow1 > 0)) {
								position[side1] -= (mySide === CENTER ? -offset : offset) + adjustment;
								newMy.invert(side, side2);
							}

						// Make sure we haven't made things worse with the adjustment and reset if so
						if (position[side1] < viewportScroll[side1] && -position[side1] > overflow2) {
							position[side1] = initialPos;newMy = my.clone();
						}
					}

				return position[side1] - initialPos;
			}

			// Set newMy if using flip or flipinvert methods
			if (methodX !== 'shift' || methodY !== 'shift') {
				newMy = my.clone();
			}

			// Adjust position based onviewport and adjustment options
			adjusted = {
				left: methodX !== 'none' ? calculate(X, Y, methodX, adjust.x, LEFT, RIGHT, WIDTH, targetWidth, elemWidth) : 0,
				top: methodY !== 'none' ? calculate(Y, X, methodY, adjust.y, TOP, BOTTOM, HEIGHT, targetHeight, elemHeight) : 0,
				my: newMy
			};

			return adjusted;
		};
		;
	});
})(window, document);
"use strict";

(function ($) {

	// JQUERY
	$(document).ready(function () {

		// Параллакс
		// if($('.parallax-window').length){
		// 	$('.parallax-window').parallax({imageSrc: '../assets/images/main-bg.png'});
		// }

		// Подклчаем брейкпоинты
		Breakpoints();
		// Подключаем локализация для форматирования чисел
		numeral.locale('ru');
		// Получаем подарок для главной и квиза
		// getGift();

		// Выбор подарка
		$(document).on('click', '.gifts-slider .item-slider', function (event) {
			event.preventDefault();
			$(this).addClass('active').siblings().removeClass('active');
			// Устанавливаем имя выбранного подарка
			$('.guaranteed-gift-name').text($(this).data('gift-name'));
			// Сохраняем подарок в LS
			localStorage.setItem('giftId', $(this).data('gift-id'));
		});

		// Настройка модальных окон
		$.fancybox.defaults.touch = false;
		// $.fancybox.defaults.modal = true;

		// Анимация при скроллинге для десктопной версии
		Breakpoints.on('md lg', 'enter', function () {
			new WOW({ offset: 0 }).init();
		});

		// Тултипы
		$('[title!=""], [data-qtip!=""]').qtip({
			position: {
				my: 'top center',
				at: 'bottom center',
				viewport: true,
				adjust: {
					y: 10
				}
			},
			style: {
				classes: 'tooltip-default',
				tip: {
					width: 10,
					height: 5,
					border: 0
				}
			}
		});

		// Маска для телефона
		$('input[name=PHONE]').inputmask({
			mask: "+7 (999) 999-9999",
			clearIncomplete: true,
			showMaskOnHover: false,
			onKeyDown: function onKeyDown(event, buffer, caretPos, opts) {
				if (event.originalEvent.keyCode == 13) {
					if (!$(this).inputmask("isComplete")) event.preventDefault();
				}
				return true;
			}
		});

		// Анимация объектов
		$.fn.extend({
			animateCss: function animateCss(animationName) {
				var animationEnd = 'webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend';
				this.addClass('animated ' + animationName).one(animationEnd, function () {
					$(this).removeClass('animated ' + animationName);
				});
				return this;
			}
		});

		// AJAX Форма
		$('.form-std').ajaxForm({
			resetForm: false, // Сбросить форму после заявки
			dataType: 'json',
			beforeSubmit: function beforeSubmit(formData, $form, options) {
				for (var i = 0; i < formData.length; i++) {
					if (!formData[i].value && formData[i].required == true && navigator.userAgent.search(/Safari/) > -1) {
						alert('Пожалуйста, заполните необходимые поля');
						return false;
					}
				}
				beforeSubmitAction($form);
				yaCounter45639600.reachGoal('SMARTO_SEND');
				yaglaaction('SMARTO_SEND');
				return true;
			},
			success: function success(json, statusText, xhr, $form) {
				console.log(json);

				// Выполнение цели
				var goal_form = $form.find('input[name=GOAL_FORM]').val();
				try {
					// Триггер Google Tag Manager
					dataLayer.push({'event': goal_form});
					yaCounter45639600.reachGoal('SMARTO_END');
					yaglaaction('SMARTO_END');
				} catch (e) {};
				
				if (json.status != 'error') {
					var event = jQuery.Event( "form:success", { 'json': json } );
					$form.trigger(event);
					if (!event.isDefaultPrevented()) swal(json.title, json.message, "success");
				} else {
					swal(json.title, json.message, "error");
				}
				successAction($form);
				return false;
			}
		});
	});
})(jQuery);

function beforeSubmitAction($form) {
	$form = $form || null;

	if ($form) {
		var $btn = $form.find('*[type="submit"]');
		$btn.prop('disabled', true).addClass('btn_loading');
		$('<div class="loader"><div class="spinner"></div></div>').appendTo($btn).fadeIn(600);
	}
	return true;
};

function successAction($form) {
	$form.find('*[type="submit"]').hide();
	$.fancybox.close();
	swal("Спасибо за заявку!", "", "success");
	return true;
}

// Функция для запроса к БД
function ajaxRequest(data_filter, handleData) {
	$.ajax({
		type: 'POST',
		url: '/assets/helpers/calc/',
		tryCount: 0,
		retryLimit: 3,
		data: data_filter,
		dataType: 'json',
		success: function success(json) {
			handleData(json);
		},
		error: function error(xhr, textStatus, errorThrown) {
			if (textStatus == 'timeout' || textStatus == 'error') {
				this.tryCount++;
				if (this.tryCount <= this.retryLimit) {
					//try again
					setTimeout(function (obj) {
						return function () {
							$.ajax(obj);
						};
					}(this), 1500);
					return;
				} else {
					alert('Произошла ошибка! Обратитесь к администратору');
				}
				return;
			}
		}
	});
}

// Загрузка подарка
function getGift() {
	try {
		var giftId = localStorage.getItem('giftId');
		if (typeof giftId == 'undefined' || giftId == null) giftId = 0;
	} catch (e) {
		giftId = 0;
	}

	ajaxRequest({ 'method': 'gift', 'gift_id': giftId }, function (json) {
		// Установка активного поадрка в модальном окне
		$('.gifts-slider').find('.item-slider[data-gift-id="' + json.data.response.id + '"]').addClass('active');
		// $('.guaranteed-gift-name').html(json.data.response.short_name);
		$(document).trigger('gift:get', [json]);
	});
};