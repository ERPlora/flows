var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key2, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key2) : target;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = (kind ? decorator(target, key2, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key2, result);
  return result;
};

// @lit-labs/ssr-dom-shim/lib/element-internals.js
var ElementInternalsShim = class ElementInternals {
  get shadowRoot() {
    return this.__host.__shadowRoot;
  }
  constructor(_host) {
    this.ariaActiveDescendantElement = null;
    this.ariaAtomic = "";
    this.ariaAutoComplete = "";
    this.ariaBrailleLabel = "";
    this.ariaBrailleRoleDescription = "";
    this.ariaBusy = "";
    this.ariaChecked = "";
    this.ariaColCount = "";
    this.ariaColIndex = "";
    this.ariaColIndexText = "";
    this.ariaColSpan = "";
    this.ariaControlsElements = null;
    this.ariaCurrent = "";
    this.ariaDescribedByElements = null;
    this.ariaDescription = "";
    this.ariaDetailsElements = null;
    this.ariaDisabled = "";
    this.ariaErrorMessageElements = null;
    this.ariaExpanded = "";
    this.ariaFlowToElements = null;
    this.ariaHasPopup = "";
    this.ariaHidden = "";
    this.ariaInvalid = "";
    this.ariaKeyShortcuts = "";
    this.ariaLabel = "";
    this.ariaLabelledByElements = null;
    this.ariaLevel = "";
    this.ariaLive = "";
    this.ariaModal = "";
    this.ariaMultiLine = "";
    this.ariaMultiSelectable = "";
    this.ariaOrientation = "";
    this.ariaOwnsElements = null;
    this.ariaPlaceholder = "";
    this.ariaPosInSet = "";
    this.ariaPressed = "";
    this.ariaReadOnly = "";
    this.ariaRelevant = "";
    this.ariaRequired = "";
    this.ariaRoleDescription = "";
    this.ariaRowCount = "";
    this.ariaRowIndex = "";
    this.ariaRowIndexText = "";
    this.ariaRowSpan = "";
    this.ariaSelected = "";
    this.ariaSetSize = "";
    this.ariaSort = "";
    this.ariaValueMax = "";
    this.ariaValueMin = "";
    this.ariaValueNow = "";
    this.ariaValueText = "";
    this.role = "";
    this.form = null;
    this.labels = [];
    this.states = /* @__PURE__ */ new Set();
    this.validationMessage = "";
    this.validity = {};
    this.willValidate = true;
    this.__host = _host;
  }
  checkValidity() {
    console.warn("`ElementInternals.checkValidity()` was called on the server.This method always returns true.");
    return true;
  }
  reportValidity() {
    return true;
  }
  setFormValue() {
  }
  setValidity() {
  }
};

// @lit-labs/ssr-dom-shim/lib/events.js
var __classPrivateFieldSet = function(receiver, state, value, kind, f3) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f3) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f3 : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f3.call(receiver, value) : f3 ? f3.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet = function(receiver, state, kind, f3) {
  if (kind === "a" && !f3) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f3 : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f3 : kind === "a" ? f3.call(receiver) : f3 ? f3.value : state.get(receiver);
};
var _Event_cancelable;
var _Event_bubbles;
var _Event_composed;
var _Event_defaultPrevented;
var _Event_timestamp;
var _Event_propagationStopped;
var _Event_type;
var _Event_target;
var _Event_isBeingDispatched;
var _a;
var _CustomEvent_detail;
var _b;
var NONE = 0;
var CAPTURING_PHASE = 1;
var AT_TARGET = 2;
var BUBBLING_PHASE = 3;
var enumerableProperty = { __proto__: null };
enumerableProperty.enumerable = true;
Object.freeze(enumerableProperty);
var EventShim = (_a = class Event {
  constructor(type, options = {}) {
    _Event_cancelable.set(this, false);
    _Event_bubbles.set(this, false);
    _Event_composed.set(this, false);
    _Event_defaultPrevented.set(this, false);
    _Event_timestamp.set(this, Date.now());
    _Event_propagationStopped.set(this, false);
    _Event_type.set(this, void 0);
    _Event_target.set(this, void 0);
    _Event_isBeingDispatched.set(this, void 0);
    this.NONE = NONE;
    this.CAPTURING_PHASE = CAPTURING_PHASE;
    this.AT_TARGET = AT_TARGET;
    this.BUBBLING_PHASE = BUBBLING_PHASE;
    if (arguments.length === 0)
      throw new Error(`The type argument must be specified`);
    if (typeof options !== "object" || !options) {
      throw new Error(`The "options" argument must be an object`);
    }
    const { bubbles, cancelable, composed } = options;
    __classPrivateFieldSet(this, _Event_cancelable, !!cancelable, "f");
    __classPrivateFieldSet(this, _Event_bubbles, !!bubbles, "f");
    __classPrivateFieldSet(this, _Event_composed, !!composed, "f");
    __classPrivateFieldSet(this, _Event_type, `${type}`, "f");
    __classPrivateFieldSet(this, _Event_target, null, "f");
    __classPrivateFieldSet(this, _Event_isBeingDispatched, false, "f");
  }
  initEvent(_type, _bubbles, _cancelable) {
    throw new Error("Method not implemented.");
  }
  stopImmediatePropagation() {
    this.stopPropagation();
  }
  preventDefault() {
    __classPrivateFieldSet(this, _Event_defaultPrevented, true, "f");
  }
  get target() {
    return __classPrivateFieldGet(this, _Event_target, "f");
  }
  get currentTarget() {
    return __classPrivateFieldGet(this, _Event_target, "f");
  }
  get srcElement() {
    return __classPrivateFieldGet(this, _Event_target, "f");
  }
  get type() {
    return __classPrivateFieldGet(this, _Event_type, "f");
  }
  get cancelable() {
    return __classPrivateFieldGet(this, _Event_cancelable, "f");
  }
  get defaultPrevented() {
    return __classPrivateFieldGet(this, _Event_cancelable, "f") && __classPrivateFieldGet(this, _Event_defaultPrevented, "f");
  }
  get timeStamp() {
    return __classPrivateFieldGet(this, _Event_timestamp, "f");
  }
  composedPath() {
    return __classPrivateFieldGet(this, _Event_isBeingDispatched, "f") ? [__classPrivateFieldGet(this, _Event_target, "f")] : [];
  }
  get returnValue() {
    return !__classPrivateFieldGet(this, _Event_cancelable, "f") || !__classPrivateFieldGet(this, _Event_defaultPrevented, "f");
  }
  get bubbles() {
    return __classPrivateFieldGet(this, _Event_bubbles, "f");
  }
  get composed() {
    return __classPrivateFieldGet(this, _Event_composed, "f");
  }
  get eventPhase() {
    return __classPrivateFieldGet(this, _Event_isBeingDispatched, "f") ? _a.AT_TARGET : _a.NONE;
  }
  get cancelBubble() {
    return __classPrivateFieldGet(this, _Event_propagationStopped, "f");
  }
  set cancelBubble(value) {
    if (value) {
      __classPrivateFieldSet(this, _Event_propagationStopped, true, "f");
    }
  }
  stopPropagation() {
    __classPrivateFieldSet(this, _Event_propagationStopped, true, "f");
  }
  get isTrusted() {
    return false;
  }
}, _Event_cancelable = /* @__PURE__ */ new WeakMap(), _Event_bubbles = /* @__PURE__ */ new WeakMap(), _Event_composed = /* @__PURE__ */ new WeakMap(), _Event_defaultPrevented = /* @__PURE__ */ new WeakMap(), _Event_timestamp = /* @__PURE__ */ new WeakMap(), _Event_propagationStopped = /* @__PURE__ */ new WeakMap(), _Event_type = /* @__PURE__ */ new WeakMap(), _Event_target = /* @__PURE__ */ new WeakMap(), _Event_isBeingDispatched = /* @__PURE__ */ new WeakMap(), _a.NONE = NONE, _a.CAPTURING_PHASE = CAPTURING_PHASE, _a.AT_TARGET = AT_TARGET, _a.BUBBLING_PHASE = BUBBLING_PHASE, _a);
Object.defineProperties(EventShim.prototype, {
  initEvent: enumerableProperty,
  stopImmediatePropagation: enumerableProperty,
  preventDefault: enumerableProperty,
  target: enumerableProperty,
  currentTarget: enumerableProperty,
  srcElement: enumerableProperty,
  type: enumerableProperty,
  cancelable: enumerableProperty,
  defaultPrevented: enumerableProperty,
  timeStamp: enumerableProperty,
  composedPath: enumerableProperty,
  returnValue: enumerableProperty,
  bubbles: enumerableProperty,
  composed: enumerableProperty,
  eventPhase: enumerableProperty,
  cancelBubble: enumerableProperty,
  stopPropagation: enumerableProperty,
  isTrusted: enumerableProperty
});
var CustomEventShim = (_b = class CustomEvent2 extends EventShim {
  constructor(type, options = {}) {
    super(type, options);
    _CustomEvent_detail.set(this, void 0);
    __classPrivateFieldSet(this, _CustomEvent_detail, options?.detail ?? null, "f");
  }
  initCustomEvent(_type, _bubbles, _cancelable, _detail) {
    throw new Error("Method not implemented.");
  }
  get detail() {
    return __classPrivateFieldGet(this, _CustomEvent_detail, "f");
  }
}, _CustomEvent_detail = /* @__PURE__ */ new WeakMap(), _b);
Object.defineProperties(CustomEventShim.prototype, {
  detail: enumerableProperty
});
var EventShimWithRealType = EventShim;
var CustomEventShimWithRealType = CustomEventShim;

// @lit-labs/ssr-dom-shim/lib/css.js
var _a2;
var CSSRuleShim = (_a2 = class CSSRule {
  constructor() {
    this.STYLE_RULE = 1;
    this.CHARSET_RULE = 2;
    this.IMPORT_RULE = 3;
    this.MEDIA_RULE = 4;
    this.FONT_FACE_RULE = 5;
    this.PAGE_RULE = 6;
    this.NAMESPACE_RULE = 10;
    this.KEYFRAMES_RULE = 7;
    this.KEYFRAME_RULE = 8;
    this.SUPPORTS_RULE = 12;
    this.COUNTER_STYLE_RULE = 11;
    this.FONT_FEATURE_VALUES_RULE = 14;
    this.MARGIN_RULE = 9;
    this.__parentStyleSheet = null;
    this.cssText = "";
  }
  get parentRule() {
    return null;
  }
  get parentStyleSheet() {
    return this.__parentStyleSheet;
  }
  get type() {
    return 0;
  }
}, _a2.STYLE_RULE = 1, _a2.CHARSET_RULE = 2, _a2.IMPORT_RULE = 3, _a2.MEDIA_RULE = 4, _a2.FONT_FACE_RULE = 5, _a2.PAGE_RULE = 6, _a2.NAMESPACE_RULE = 10, _a2.KEYFRAMES_RULE = 7, _a2.KEYFRAME_RULE = 8, _a2.SUPPORTS_RULE = 12, _a2.COUNTER_STYLE_RULE = 11, _a2.FONT_FEATURE_VALUES_RULE = 14, _a2.MARGIN_RULE = 9, _a2);

// @lit-labs/ssr-dom-shim/index.js
globalThis.Event ??= EventShimWithRealType;
globalThis.CustomEvent ??= CustomEventShimWithRealType;
var constructionToken = Symbol();
var isCaptureEventListener = (options) => typeof options === "boolean" ? options : options?.capture ?? false;
var enumerableProperty2 = { __proto__: null };
enumerableProperty2.enumerable = true;
Object.freeze(enumerableProperty2);
var EventTarget = class {
  constructor() {
    this.__eventListeners = /* @__PURE__ */ new Map();
    this.__captureEventListeners = /* @__PURE__ */ new Map();
  }
  addEventListener(type, callback, options) {
    if (callback === void 0 || callback === null) {
      return;
    }
    const eventListenersMap = isCaptureEventListener(options) ? this.__captureEventListeners : this.__eventListeners;
    let eventListeners = eventListenersMap.get(type);
    if (eventListeners === void 0) {
      eventListeners = /* @__PURE__ */ new Map();
      eventListenersMap.set(type, eventListeners);
    } else if (eventListeners.has(callback)) {
      return;
    }
    const normalizedOptions = typeof options === "object" && options ? options : {};
    normalizedOptions.signal?.addEventListener("abort", () => this.removeEventListener(type, callback, options));
    eventListeners.set(callback, normalizedOptions ?? {});
  }
  removeEventListener(type, callback, options) {
    if (callback === void 0 || callback === null) {
      return;
    }
    const eventListenersMap = isCaptureEventListener(options) ? this.__captureEventListeners : this.__eventListeners;
    const eventListeners = eventListenersMap.get(type);
    if (eventListeners !== void 0) {
      eventListeners.delete(callback);
      if (!eventListeners.size) {
        eventListenersMap.delete(type);
      }
    }
  }
  dispatchEvent(event) {
    let composedPath = this.__resolveFullEventPath();
    if (!event.composed && this.__host) {
      composedPath = composedPath.slice(0, composedPath.indexOf(this.__host));
    }
    let stopPropagation = false;
    let stopImmediatePropagation = false;
    let eventPhase = EventShimWithRealType.NONE;
    let target = null;
    let tmpTarget = null;
    let currentTarget = null;
    const originalStopPropagation = event.stopPropagation;
    const originalStopImmediatePropagation = event.stopImmediatePropagation;
    Object.defineProperties(event, {
      target: {
        get() {
          return target ?? tmpTarget;
        },
        ...enumerableProperty2
      },
      srcElement: {
        get() {
          return event.target;
        },
        ...enumerableProperty2
      },
      currentTarget: {
        get() {
          return currentTarget;
        },
        ...enumerableProperty2
      },
      eventPhase: {
        get() {
          return eventPhase;
        },
        ...enumerableProperty2
      },
      composedPath: {
        value: () => composedPath,
        ...enumerableProperty2
      },
      stopPropagation: {
        value: () => {
          stopPropagation = true;
          originalStopPropagation.call(event);
        },
        ...enumerableProperty2
      },
      stopImmediatePropagation: {
        value: () => {
          stopImmediatePropagation = true;
          originalStopImmediatePropagation.call(event);
        },
        ...enumerableProperty2
      }
    });
    const invokeEventListener = (listener, options, eventListenerMap) => {
      if (typeof listener === "function") {
        listener(event);
      } else if (typeof listener?.handleEvent === "function") {
        listener.handleEvent(event);
      }
      if (options.once) {
        eventListenerMap.delete(listener);
      }
    };
    const finishDispatch = () => {
      currentTarget = null;
      eventPhase = EventShimWithRealType.NONE;
      return !event.defaultPrevented;
    };
    const captureEventPath = composedPath.slice().reverse();
    target = !this.__host || !event.composed ? this : null;
    const retarget = (eventTargets) => {
      tmpTarget = this;
      while (tmpTarget.__host && eventTargets.includes(tmpTarget.__host)) {
        tmpTarget = tmpTarget.__host;
      }
    };
    for (const eventTarget of captureEventPath) {
      if (!target && (!tmpTarget || tmpTarget === eventTarget.__host)) {
        retarget(captureEventPath.slice(captureEventPath.indexOf(eventTarget)));
      }
      currentTarget = eventTarget;
      eventPhase = eventTarget === event.target ? EventShimWithRealType.AT_TARGET : EventShimWithRealType.CAPTURING_PHASE;
      const captureEventListeners = eventTarget.__captureEventListeners.get(event.type);
      if (captureEventListeners) {
        for (const [listener, options] of captureEventListeners) {
          invokeEventListener(listener, options, captureEventListeners);
          if (stopImmediatePropagation) {
            return finishDispatch();
          }
        }
      }
      if (stopPropagation) {
        return finishDispatch();
      }
    }
    const bubbleEventPath = event.bubbles ? composedPath : [this];
    tmpTarget = null;
    for (const eventTarget of bubbleEventPath) {
      if (!target && (!tmpTarget || eventTarget === tmpTarget.__host)) {
        retarget(bubbleEventPath.slice(0, bubbleEventPath.indexOf(eventTarget) + 1));
      }
      currentTarget = eventTarget;
      eventPhase = eventTarget === event.target ? EventShimWithRealType.AT_TARGET : EventShimWithRealType.BUBBLING_PHASE;
      const eventListeners = eventTarget.__eventListeners.get(event.type);
      if (eventListeners) {
        for (const [listener, options] of eventListeners) {
          invokeEventListener(listener, options, eventListeners);
          if (stopImmediatePropagation) {
            return finishDispatch();
          }
        }
      }
      if (stopPropagation) {
        return finishDispatch();
      }
    }
    return finishDispatch();
  }
  __resolveFullEventPath() {
    if (this.__eventPathCache) {
      return this.__eventPathCache;
    } else if (!this.__eventTargetParent) {
      return this.__eventPathCache = [this, documentShim, windowShim];
    } else {
      return this.__eventPathCache = [
        this,
        ...this.__eventTargetParent.__resolveFullEventPath()
      ];
    }
  }
};
var attributes = /* @__PURE__ */ new WeakMap();
var attributesForElement = (element) => {
  let attrs = attributes.get(element);
  if (attrs === void 0) {
    attributes.set(element, attrs = /* @__PURE__ */ new Map());
  }
  return attrs;
};
var NodeShim = class Node extends EventTarget {
  getRootNode(options) {
    if (options?.composed) {
      return document2;
    }
    const host = this.__host;
    return host?.__shadowRoot ?? document2;
  }
};
var DocumentShim = class Document2 extends NodeShim {
  get adoptedStyleSheets() {
    return [];
  }
  createTreeWalker() {
    return {};
  }
  createTextNode() {
    return {};
  }
  createElement() {
    return {};
  }
};
var documentShim = new DocumentShim();
var document2 = documentShim;
var WindowShim = class Window extends NodeShim {
  constructor(token) {
    super();
    if (token !== constructionToken) {
      throw new TypeError("Illegal constructor");
    }
    Object.assign(this, globalThis, {
      CustomElementRegistry,
      customElements: customElements2,
      document: document2,
      Document: DocumentShim,
      Element: ElementShim,
      EventTarget,
      HTMLElement: HTMLElementShim,
      Node: NodeShim,
      ShadowRoot: ShadowRootShim,
      window: this,
      Window: WindowShim
    });
  }
};
var ElementShim = class Element extends NodeShim {
  constructor() {
    super(...arguments);
    this.__shadowRootMode = null;
    this.__shadowRoot = null;
    this.__internals = null;
  }
  get attributes() {
    return Array.from(attributesForElement(this)).map(([name, value]) => ({
      name,
      value
    }));
  }
  get shadowRoot() {
    if (this.__shadowRootMode === "closed") {
      return null;
    }
    return this.__shadowRoot;
  }
  get localName() {
    return this.constructor.__localName;
  }
  get tagName() {
    return this.localName?.toUpperCase();
  }
  setAttribute(name, value) {
    attributesForElement(this).set(name, String(value));
  }
  removeAttribute(name) {
    attributesForElement(this).delete(name);
  }
  toggleAttribute(name, force) {
    if (this.hasAttribute(name)) {
      if (force === void 0 || !force) {
        this.removeAttribute(name);
        return false;
      }
    } else {
      if (force === void 0 || force) {
        this.setAttribute(name, "");
        return true;
      } else {
        return false;
      }
    }
    return true;
  }
  hasAttribute(name) {
    return attributesForElement(this).has(name);
  }
  attachShadow(init) {
    this.__shadowRootMode = init.mode;
    const shadowRoot = new ShadowRootShim(constructionToken, init);
    shadowRoot.__eventTargetParent = this;
    shadowRoot.__host = this;
    return this.__shadowRoot = shadowRoot;
  }
  attachInternals() {
    if (this.__internals !== null) {
      throw new Error(`Failed to execute 'attachInternals' on 'HTMLElement': ElementInternals for the specified element was already attached.`);
    }
    const internals = new ElementInternalsShim(this);
    this.__internals = internals;
    return internals;
  }
  getAttribute(name) {
    const value = attributesForElement(this).get(name);
    return value ?? null;
  }
};
var HTMLElementShim = class HTMLElement extends ElementShim {
};
var HTMLElementShimWithRealType = HTMLElementShim;
var ShadowRootShim = class ShadowRoot extends NodeShim {
  get host() {
    return this.__host;
  }
  constructor(constructionToken2, init) {
    super();
    if (constructionToken2 !== constructionToken2) {
      throw new TypeError("Illegal constructor");
    }
    this.mode = init.mode;
  }
};
globalThis.litServerRoot ??= Object.defineProperty(new HTMLElementShimWithRealType(), "localName", {
  // Patch localName (and tagName) to return a unique name.
  get() {
    return "lit-server-root";
  }
});
function promiseWithResolvers() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
var CustomElementRegistry = class {
  constructor() {
    this.__definitions = /* @__PURE__ */ new Map();
    this.__reverseDefinitions = /* @__PURE__ */ new Map();
    this.__pendingWhenDefineds = /* @__PURE__ */ new Map();
  }
  define(name, ctor) {
    if (this.__definitions.has(name)) {
      if (true) {
        console.warn(`'CustomElementRegistry' already has "${name}" defined. This may have been caused by live reload or hot module replacement in which case it can be safely ignored.
Make sure to test your application with a production build as repeat registrations will throw in production.`);
      } else {
        throw new Error(`Failed to execute 'define' on 'CustomElementRegistry': the name "${name}" has already been used with this registry`);
      }
    }
    if (this.__reverseDefinitions.has(ctor)) {
      throw new Error(`Failed to execute 'define' on 'CustomElementRegistry': the constructor has already been used with this registry for the tag name ${this.__reverseDefinitions.get(ctor)}`);
    }
    ctor.__localName = name;
    this.__definitions.set(name, {
      ctor,
      // Note it's important we read `observedAttributes` in case it is a getter
      // with side-effects, as is the case in Lit, where it triggers class
      // finalization.
      //
      // TODO(aomarks) To be spec compliant, we should also capture the
      // registration-time lifecycle methods like `connectedCallback`. For them
      // to be actually accessible to e.g. the Lit SSR element renderer, though,
      // we'd need to introduce a new API for accessing them (since `get` only
      // returns the constructor).
      observedAttributes: ctor.observedAttributes ?? []
    });
    this.__reverseDefinitions.set(ctor, name);
    this.__pendingWhenDefineds.get(name)?.resolve(ctor);
    this.__pendingWhenDefineds.delete(name);
  }
  get(name) {
    const definition = this.__definitions.get(name);
    return definition?.ctor;
  }
  getName(ctor) {
    return this.__reverseDefinitions.get(ctor) ?? null;
  }
  initialize(_root) {
    throw new Error(`customElements.initialize is not currently supported in SSR. Please file a bug if you need it.`);
  }
  upgrade(_element) {
    throw new Error(`customElements.upgrade is not currently supported in SSR. Please file a bug if you need it.`);
  }
  async whenDefined(name) {
    const definition = this.__definitions.get(name);
    if (definition) {
      return definition.ctor;
    }
    let withResolvers = this.__pendingWhenDefineds.get(name);
    if (!withResolvers) {
      withResolvers = promiseWithResolvers();
      this.__pendingWhenDefineds.set(name, withResolvers);
    }
    return withResolvers.promise;
  }
};
var CustomElementRegistryShimWithRealType = CustomElementRegistry;
var customElements2 = new CustomElementRegistryShimWithRealType();
var windowShim = new WindowShim(constructionToken);

// @lit/reactive-element/node/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t3, e4, o6) {
    if (this._$cssResult$ = true, o6 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t3, this.t = e4;
  }
  get styleSheet() {
    let t3 = this.o;
    const s4 = this.t;
    if (e && void 0 === t3) {
      const e4 = void 0 !== s4 && 1 === s4.length;
      e4 && (t3 = o.get(s4)), void 0 === t3 && ((this.o = t3 = new CSSStyleSheet()).replaceSync(this.cssText), e4 && o.set(s4, t3));
    }
    return t3;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t3) => new n("string" == typeof t3 ? t3 : t3 + "", void 0, s);
var i = (t3, ...e4) => {
  const o6 = 1 === t3.length ? t3[0] : e4.reduce((e5, s4, o7) => e5 + ((t4) => {
    if (true === t4._$cssResult$) return t4.cssText;
    if ("number" == typeof t4) return t4;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t4 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s4) + t3[o7 + 1], t3[0]);
  return new n(o6, t3, s);
};
var S = (s4, o6) => {
  if (e) s4.adoptedStyleSheets = o6.map((t3) => t3 instanceof CSSStyleSheet ? t3 : t3.styleSheet);
  else for (const e4 of o6) {
    const o7 = document.createElement("style"), n5 = t.litNonce;
    void 0 !== n5 && o7.setAttribute("nonce", n5), o7.textContent = e4.cssText, s4.appendChild(o7);
  }
};
var c = e || void 0 === t.CSSStyleSheet ? (t3) => t3 : (t3) => t3 instanceof CSSStyleSheet ? ((t4) => {
  let e4 = "";
  for (const s4 of t4.cssRules) e4 += s4.cssText;
  return r(e4);
})(t3) : t3;

// @lit/reactive-element/node/reactive-element.js
var { is: h, defineProperty: r2, getOwnPropertyDescriptor: o2, getOwnPropertyNames: n2, getOwnPropertySymbols: a, getPrototypeOf: c2 } = Object;
var l = globalThis;
l.customElements ??= customElements2;
var p = l.trustedTypes;
var d = p ? p.emptyScript : "";
var u = l.reactiveElementPolyfillSupport;
var f = (t3, s4) => t3;
var b = { toAttribute(t3, s4) {
  switch (s4) {
    case Boolean:
      t3 = t3 ? d : null;
      break;
    case Object:
    case Array:
      t3 = null == t3 ? t3 : JSON.stringify(t3);
  }
  return t3;
}, fromAttribute(t3, s4) {
  let i4 = t3;
  switch (s4) {
    case Boolean:
      i4 = null !== t3;
      break;
    case Number:
      i4 = null === t3 ? null : Number(t3);
      break;
    case Object:
    case Array:
      try {
        i4 = JSON.parse(t3);
      } catch (t4) {
        i4 = null;
      }
  }
  return i4;
} };
var m = (t3, s4) => !h(t3, s4);
var y = { attribute: true, type: String, converter: b, reflect: false, useDefault: false, hasChanged: m };
Symbol.metadata ??= Symbol("metadata"), l.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var g = class extends (globalThis.HTMLElement ?? HTMLElementShimWithRealType) {
  static addInitializer(t3) {
    this._$Ei(), (this.l ??= []).push(t3);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t3, s4 = y) {
    if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t3) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t3, s4), !s4.noAccessor) {
      const i4 = Symbol(), e4 = this.getPropertyDescriptor(t3, i4, s4);
      void 0 !== e4 && r2(this.prototype, t3, e4);
    }
  }
  static getPropertyDescriptor(t3, s4, i4) {
    const { get: e4, set: h3 } = o2(this.prototype, t3) ?? { get() {
      return this[s4];
    }, set(t4) {
      this[s4] = t4;
    } };
    return { get: e4, set(s5) {
      const r6 = e4?.call(this);
      h3?.call(this, s5), this.requestUpdate(t3, r6, i4);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t3) {
    return this.elementProperties.get(t3) ?? y;
  }
  static _$Ei() {
    if (this.hasOwnProperty(f("elementProperties"))) return;
    const t3 = c2(this);
    t3.finalize(), void 0 !== t3.l && (this.l = [...t3.l]), this.elementProperties = new Map(t3.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(f("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(f("properties"))) {
      const t4 = this.properties, s4 = [...n2(t4), ...a(t4)];
      for (const i4 of s4) this.createProperty(i4, t4[i4]);
    }
    const t3 = this[Symbol.metadata];
    if (null !== t3) {
      const s4 = litPropertyMetadata.get(t3);
      if (void 0 !== s4) for (const [t4, i4] of s4) this.elementProperties.set(t4, i4);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t4, s4] of this.elementProperties) {
      const i4 = this._$Eu(t4, s4);
      void 0 !== i4 && this._$Eh.set(i4, t4);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t3) {
    const s4 = [];
    if (Array.isArray(t3)) {
      const e4 = new Set(t3.flat(1 / 0).reverse());
      for (const t4 of e4) s4.unshift(c(t4));
    } else void 0 !== t3 && s4.push(c(t3));
    return s4;
  }
  static _$Eu(t3, s4) {
    const i4 = s4.attribute;
    return false === i4 ? void 0 : "string" == typeof i4 ? i4 : "string" == typeof t3 ? t3.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t3) => this.enableUpdating = t3), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t3) => t3(this));
  }
  addController(t3) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t3), void 0 !== this.renderRoot && this.isConnected && t3.hostConnected?.();
  }
  removeController(t3) {
    this._$EO?.delete(t3);
  }
  _$E_() {
    const t3 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
    for (const i4 of s4.keys()) this.hasOwnProperty(i4) && (t3.set(i4, this[i4]), delete this[i4]);
    t3.size > 0 && (this._$Ep = t3);
  }
  createRenderRoot() {
    const t3 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t3, this.constructor.elementStyles), t3;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t3) => t3.hostConnected?.());
  }
  enableUpdating(t3) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t3) => t3.hostDisconnected?.());
  }
  attributeChangedCallback(t3, s4, i4) {
    this._$AK(t3, i4);
  }
  _$ET(t3, s4) {
    const i4 = this.constructor.elementProperties.get(t3), e4 = this.constructor._$Eu(t3, i4);
    if (void 0 !== e4 && true === i4.reflect) {
      const h3 = (void 0 !== i4.converter?.toAttribute ? i4.converter : b).toAttribute(s4, i4.type);
      this._$Em = t3, null == h3 ? this.removeAttribute(e4) : this.setAttribute(e4, h3), this._$Em = null;
    }
  }
  _$AK(t3, s4) {
    const i4 = this.constructor, e4 = i4._$Eh.get(t3);
    if (void 0 !== e4 && this._$Em !== e4) {
      const t4 = i4.getPropertyOptions(e4), h3 = "function" == typeof t4.converter ? { fromAttribute: t4.converter } : void 0 !== t4.converter?.fromAttribute ? t4.converter : b;
      this._$Em = e4;
      const r6 = h3.fromAttribute(s4, t4.type);
      this[e4] = r6 ?? this._$Ej?.get(e4) ?? r6, this._$Em = null;
    }
  }
  requestUpdate(t3, s4, i4, e4 = false, h3) {
    if (void 0 !== t3) {
      const r6 = this.constructor;
      if (false === e4 && (h3 = this[t3]), i4 ??= r6.getPropertyOptions(t3), !((i4.hasChanged ?? m)(h3, s4) || i4.useDefault && i4.reflect && h3 === this._$Ej?.get(t3) && !this.hasAttribute(r6._$Eu(t3, i4)))) return;
      this.C(t3, s4, i4);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t3, s4, { useDefault: i4, reflect: e4, wrapped: h3 }, r6) {
    i4 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t3) && (this._$Ej.set(t3, r6 ?? s4 ?? this[t3]), true !== h3 || void 0 !== r6) || (this._$AL.has(t3) || (this.hasUpdated || i4 || (s4 = void 0), this._$AL.set(t3, s4)), true === e4 && this._$Em !== t3 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t3));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t4) {
      Promise.reject(t4);
    }
    const t3 = this.scheduleUpdate();
    return null != t3 && await t3, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t5, s5] of this._$Ep) this[t5] = s5;
        this._$Ep = void 0;
      }
      const t4 = this.constructor.elementProperties;
      if (t4.size > 0) for (const [s5, i4] of t4) {
        const { wrapped: t5 } = i4, e4 = this[s5];
        true !== t5 || this._$AL.has(s5) || void 0 === e4 || this.C(s5, void 0, i4, e4);
      }
    }
    let t3 = false;
    const s4 = this._$AL;
    try {
      t3 = this.shouldUpdate(s4), t3 ? (this.willUpdate(s4), this._$EO?.forEach((t4) => t4.hostUpdate?.()), this.update(s4)) : this._$EM();
    } catch (s5) {
      throw t3 = false, this._$EM(), s5;
    }
    t3 && this._$AE(s4);
  }
  willUpdate(t3) {
  }
  _$AE(t3) {
    this._$EO?.forEach((t4) => t4.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t3)), this.updated(t3);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t3) {
    return true;
  }
  update(t3) {
    this._$Eq &&= this._$Eq.forEach((t4) => this._$ET(t4, this[t4])), this._$EM();
  }
  updated(t3) {
  }
  firstUpdated(t3) {
  }
};
g.elementStyles = [], g.shadowRootOptions = { mode: "open" }, g[f("elementProperties")] = /* @__PURE__ */ new Map(), g[f("finalized")] = /* @__PURE__ */ new Map(), u?.({ ReactiveElement: g }), (l.reactiveElementVersions ??= []).push("2.1.2");

// lit-html/lit-html.js
var t2 = globalThis;
var i2 = (t3) => t3;
var s2 = t2.trustedTypes;
var e2 = s2 ? s2.createPolicy("lit-html", { createHTML: (t3) => t3 }) : void 0;
var h2 = "$lit$";
var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n3 = "?" + o3;
var r3 = `<${n3}>`;
var l2 = document;
var c3 = () => l2.createComment("");
var a2 = (t3) => null === t3 || "object" != typeof t3 && "function" != typeof t3;
var u2 = Array.isArray;
var d2 = (t3) => u2(t3) || "function" == typeof t3?.[Symbol.iterator];
var f2 = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m2 = />/g;
var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g2 = /'/g;
var $ = /"/g;
var y2 = /^(?:script|style|textarea|title)$/i;
var x = (t3) => (i4, ...s4) => ({ _$litType$: t3, strings: i4, values: s4 });
var b2 = x(1);
var w = x(2);
var T = x(3);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l2.createTreeWalker(l2, 129);
function V(t3, i4) {
  if (!u2(t3) || !t3.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e2 ? e2.createHTML(i4) : i4;
}
var N = (t3, i4) => {
  const s4 = t3.length - 1, e4 = [];
  let n5, l3 = 2 === i4 ? "<svg>" : 3 === i4 ? "<math>" : "", c4 = v;
  for (let i5 = 0; i5 < s4; i5++) {
    const s5 = t3[i5];
    let a3, u3, d3 = -1, f3 = 0;
    for (; f3 < s5.length && (c4.lastIndex = f3, u3 = c4.exec(s5), null !== u3); ) f3 = c4.lastIndex, c4 === v ? "!--" === u3[1] ? c4 = _ : void 0 !== u3[1] ? c4 = m2 : void 0 !== u3[2] ? (y2.test(u3[2]) && (n5 = RegExp("</" + u3[2], "g")), c4 = p2) : void 0 !== u3[3] && (c4 = p2) : c4 === p2 ? ">" === u3[0] ? (c4 = n5 ?? v, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? p2 : '"' === u3[3] ? $ : g2) : c4 === $ || c4 === g2 ? c4 = p2 : c4 === _ || c4 === m2 ? c4 = v : (c4 = p2, n5 = void 0);
    const x2 = c4 === p2 && t3[i5 + 1].startsWith("/>") ? " " : "";
    l3 += c4 === v ? s5 + r3 : d3 >= 0 ? (e4.push(a3), s5.slice(0, d3) + h2 + s5.slice(d3) + o3 + x2) : s5 + o3 + (-2 === d3 ? i5 : x2);
  }
  return [V(t3, l3 + (t3[s4] || "<?>") + (2 === i4 ? "</svg>" : 3 === i4 ? "</math>" : "")), e4];
};
var S2 = class _S {
  constructor({ strings: t3, _$litType$: i4 }, e4) {
    let r6;
    this.parts = [];
    let l3 = 0, a3 = 0;
    const u3 = t3.length - 1, d3 = this.parts, [f3, v2] = N(t3, i4);
    if (this.el = _S.createElement(f3, e4), P.currentNode = this.el.content, 2 === i4 || 3 === i4) {
      const t4 = this.el.content.firstChild;
      t4.replaceWith(...t4.childNodes);
    }
    for (; null !== (r6 = P.nextNode()) && d3.length < u3; ) {
      if (1 === r6.nodeType) {
        if (r6.hasAttributes()) for (const t4 of r6.getAttributeNames()) if (t4.endsWith(h2)) {
          const i5 = v2[a3++], s4 = r6.getAttribute(t4).split(o3), e5 = /([.?@])?(.*)/.exec(i5);
          d3.push({ type: 1, index: l3, name: e5[2], strings: s4, ctor: "." === e5[1] ? I : "?" === e5[1] ? L : "@" === e5[1] ? z : H }), r6.removeAttribute(t4);
        } else t4.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r6.removeAttribute(t4));
        if (y2.test(r6.tagName)) {
          const t4 = r6.textContent.split(o3), i5 = t4.length - 1;
          if (i5 > 0) {
            r6.textContent = s2 ? s2.emptyScript : "";
            for (let s4 = 0; s4 < i5; s4++) r6.append(t4[s4], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
            r6.append(t4[i5], c3());
          }
        }
      } else if (8 === r6.nodeType) if (r6.data === n3) d3.push({ type: 2, index: l3 });
      else {
        let t4 = -1;
        for (; -1 !== (t4 = r6.data.indexOf(o3, t4 + 1)); ) d3.push({ type: 7, index: l3 }), t4 += o3.length - 1;
      }
      l3++;
    }
  }
  static createElement(t3, i4) {
    const s4 = l2.createElement("template");
    return s4.innerHTML = t3, s4;
  }
};
function M(t3, i4, s4 = t3, e4) {
  if (i4 === E) return i4;
  let h3 = void 0 !== e4 ? s4._$Co?.[e4] : s4._$Cl;
  const o6 = a2(i4) ? void 0 : i4._$litDirective$;
  return h3?.constructor !== o6 && (h3?._$AO?.(false), void 0 === o6 ? h3 = void 0 : (h3 = new o6(t3), h3._$AT(t3, s4, e4)), void 0 !== e4 ? (s4._$Co ??= [])[e4] = h3 : s4._$Cl = h3), void 0 !== h3 && (i4 = M(t3, h3._$AS(t3, i4.values), h3, e4)), i4;
}
var R = class {
  constructor(t3, i4) {
    this._$AV = [], this._$AN = void 0, this._$AD = t3, this._$AM = i4;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t3) {
    const { el: { content: i4 }, parts: s4 } = this._$AD, e4 = (t3?.creationScope ?? l2).importNode(i4, true);
    P.currentNode = e4;
    let h3 = P.nextNode(), o6 = 0, n5 = 0, r6 = s4[0];
    for (; void 0 !== r6; ) {
      if (o6 === r6.index) {
        let i5;
        2 === r6.type ? i5 = new k(h3, h3.nextSibling, this, t3) : 1 === r6.type ? i5 = new r6.ctor(h3, r6.name, r6.strings, this, t3) : 6 === r6.type && (i5 = new Z(h3, this, t3)), this._$AV.push(i5), r6 = s4[++n5];
      }
      o6 !== r6?.index && (h3 = P.nextNode(), o6++);
    }
    return P.currentNode = l2, e4;
  }
  p(t3) {
    let i4 = 0;
    for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t3, s4, i4), i4 += s4.strings.length - 2) : s4._$AI(t3[i4])), i4++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t3, i4, s4, e4) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t3, this._$AB = i4, this._$AM = s4, this.options = e4, this._$Cv = e4?.isConnected ?? true;
  }
  get parentNode() {
    let t3 = this._$AA.parentNode;
    const i4 = this._$AM;
    return void 0 !== i4 && 11 === t3?.nodeType && (t3 = i4.parentNode), t3;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t3, i4 = this) {
    t3 = M(this, t3, i4), a2(t3) ? t3 === A || null == t3 || "" === t3 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t3 !== this._$AH && t3 !== E && this._(t3) : void 0 !== t3._$litType$ ? this.$(t3) : void 0 !== t3.nodeType ? this.T(t3) : d2(t3) ? this.k(t3) : this._(t3);
  }
  O(t3) {
    return this._$AA.parentNode.insertBefore(t3, this._$AB);
  }
  T(t3) {
    this._$AH !== t3 && (this._$AR(), this._$AH = this.O(t3));
  }
  _(t3) {
    this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t3 : this.T(l2.createTextNode(t3)), this._$AH = t3;
  }
  $(t3) {
    const { values: i4, _$litType$: s4 } = t3, e4 = "number" == typeof s4 ? this._$AC(t3) : (void 0 === s4.el && (s4.el = S2.createElement(V(s4.h, s4.h[0]), this.options)), s4);
    if (this._$AH?._$AD === e4) this._$AH.p(i4);
    else {
      const t4 = new R(e4, this), s5 = t4.u(this.options);
      t4.p(i4), this.T(s5), this._$AH = t4;
    }
  }
  _$AC(t3) {
    let i4 = C.get(t3.strings);
    return void 0 === i4 && C.set(t3.strings, i4 = new S2(t3)), i4;
  }
  k(t3) {
    u2(this._$AH) || (this._$AH = [], this._$AR());
    const i4 = this._$AH;
    let s4, e4 = 0;
    for (const h3 of t3) e4 === i4.length ? i4.push(s4 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s4 = i4[e4], s4._$AI(h3), e4++;
    e4 < i4.length && (this._$AR(s4 && s4._$AB.nextSibling, e4), i4.length = e4);
  }
  _$AR(t3 = this._$AA.nextSibling, s4) {
    for (this._$AP?.(false, true, s4); t3 !== this._$AB; ) {
      const s5 = i2(t3).nextSibling;
      i2(t3).remove(), t3 = s5;
    }
  }
  setConnected(t3) {
    void 0 === this._$AM && (this._$Cv = t3, this._$AP?.(t3));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t3, i4, s4, e4, h3) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t3, this.name = i4, this._$AM = e4, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = A;
  }
  _$AI(t3, i4 = this, s4, e4) {
    const h3 = this.strings;
    let o6 = false;
    if (void 0 === h3) t3 = M(this, t3, i4, 0), o6 = !a2(t3) || t3 !== this._$AH && t3 !== E, o6 && (this._$AH = t3);
    else {
      const e5 = t3;
      let n5, r6;
      for (t3 = h3[0], n5 = 0; n5 < h3.length - 1; n5++) r6 = M(this, e5[s4 + n5], i4, n5), r6 === E && (r6 = this._$AH[n5]), o6 ||= !a2(r6) || r6 !== this._$AH[n5], r6 === A ? t3 = A : t3 !== A && (t3 += (r6 ?? "") + h3[n5 + 1]), this._$AH[n5] = r6;
    }
    o6 && !e4 && this.j(t3);
  }
  j(t3) {
    t3 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t3 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t3) {
    this.element[this.name] = t3 === A ? void 0 : t3;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t3) {
    this.element.toggleAttribute(this.name, !!t3 && t3 !== A);
  }
};
var z = class extends H {
  constructor(t3, i4, s4, e4, h3) {
    super(t3, i4, s4, e4, h3), this.type = 5;
  }
  _$AI(t3, i4 = this) {
    if ((t3 = M(this, t3, i4, 0) ?? A) === E) return;
    const s4 = this._$AH, e4 = t3 === A && s4 !== A || t3.capture !== s4.capture || t3.once !== s4.once || t3.passive !== s4.passive, h3 = t3 !== A && (s4 === A || e4);
    e4 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t3), this._$AH = t3;
  }
  handleEvent(t3) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t3) : this._$AH.handleEvent(t3);
  }
};
var Z = class {
  constructor(t3, i4, s4) {
    this.element = t3, this.type = 6, this._$AN = void 0, this._$AM = i4, this.options = s4;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t3) {
    M(this, t3);
  }
};
var B = t2.litHtmlPolyfillSupport;
B?.(S2, k), (t2.litHtmlVersions ??= []).push("3.3.3");
var D = (t3, i4, s4) => {
  const e4 = s4?.renderBefore ?? i4;
  let h3 = e4._$litPart$;
  if (void 0 === h3) {
    const t4 = s4?.renderBefore ?? null;
    e4._$litPart$ = h3 = new k(i4.insertBefore(c3(), t4), t4, void 0, s4 ?? {});
  }
  return h3._$AI(t3), h3;
};

// lit-element/lit-element.js
var s3 = globalThis;
var i3 = class extends g {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t3 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t3.firstChild, t3;
  }
  update(t3) {
    const r6 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t3), this._$Do = D(r6, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i3._$litElement$ = true, i3["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i3 });
var o4 = s3.litElementPolyfillSupport;
o4?.({ LitElement: i3 });
(s3.litElementVersions ??= []).push("4.2.2");

// @lit/reactive-element/node/decorators/property.js
var o5 = { attribute: true, type: String, converter: b, reflect: false, hasChanged: m };
var r4 = (t3 = o5, e4, r6) => {
  const { kind: n5, metadata: i4 } = r6;
  let s4 = globalThis.litPropertyMetadata.get(i4);
  if (void 0 === s4 && globalThis.litPropertyMetadata.set(i4, s4 = /* @__PURE__ */ new Map()), "setter" === n5 && ((t3 = Object.create(t3)).wrapped = true), s4.set(r6.name, t3), "accessor" === n5) {
    const { name: o6 } = r6;
    return { set(r7) {
      const n6 = e4.get.call(this);
      e4.set.call(this, r7), this.requestUpdate(o6, n6, t3, true, r7);
    }, init(e5) {
      return void 0 !== e5 && this.C(o6, void 0, t3, e5), e5;
    } };
  }
  if ("setter" === n5) {
    const { name: o6 } = r6;
    return function(r7) {
      const n6 = this[o6];
      e4.call(this, r7), this.requestUpdate(o6, n6, t3, true, r7);
    };
  }
  throw Error("Unsupported decorator location: " + n5);
};
function n4(t3) {
  return (e4, o6) => "object" == typeof o6 ? r4(t3, e4, o6) : ((t4, e5, o7) => {
    const r6 = e5.hasOwnProperty(o7);
    return e5.constructor.createProperty(o7, t4), r6 ? Object.getOwnPropertyDescriptor(e5, o7) : void 0;
  })(t3, e4, o6);
}

// @lit/reactive-element/node/decorators/state.js
function r5(r6) {
  return n4({ ...r6, state: true, attribute: false });
}

// @erplora/outfitkit/dist/define.js
function define(tag, ctor) {
  if (typeof customElements !== "undefined" && !customElements.get(tag)) {
    customElements.define(tag, ctor);
  }
}

// @erplora/outfitkit/dist/shared/icons.js
var rawAdd = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 112v288m144-144H112"/></svg>';
var rawAlertCircle = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="currentColor" d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208s208-93.31 208-208S370.69 48 256 48m0 319.91a20 20 0 1 1 20-20a20 20 0 0 1-20 20m21.72-201.15l-5.74 122a16 16 0 0 1-32 0l-5.74-121.94v-.05a21.74 21.74 0 1 1 43.44 0Z"/></svg>';
var rawAlertCircleOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192s192-86 192-192Z"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M250.26 166.05L256 288l5.73-121.95a5.74 5.74 0 0 0-5.79-6h0a5.74 5.74 0 0 0-5.68 6"/><path fill="currentColor" d="M256 367.91a20 20 0 1 1 20-20a20 20 0 0 1-20 20"/></svg>';
var rawAppsOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><rect width="80" height="80" x="64" y="64" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" rx="40" ry="40"/><rect width="80" height="80" x="216" y="64" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" rx="40" ry="40"/><rect width="80" height="80" x="368" y="64" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" rx="40" ry="40"/><rect width="80" height="80" x="64" y="216" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" rx="40" ry="40"/><rect width="80" height="80" x="216" y="216" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" rx="40" ry="40"/><rect width="80" height="80" x="368" y="216" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" rx="40" ry="40"/><rect width="80" height="80" x="64" y="368" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" rx="40" ry="40"/><rect width="80" height="80" x="216" y="368" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" rx="40" ry="40"/><rect width="80" height="80" x="368" y="368" fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" rx="40" ry="40"/></svg>';
var rawArchiveOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M80 152v256a40.12 40.12 0 0 0 40 40h272a40.12 40.12 0 0 0 40-40V152"/><rect width="416" height="80" x="48" y="64" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32" rx="28" ry="28"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="m320 304l-64 64l-64-64m64 41.89V224"/></svg>';
var rawArrowRedoOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32" d="M448 256L272 88v96C103.57 184 64 304.77 64 424c48.61-62.24 91.6-96 208-96v96Z"/></svg>';
var rawArrowUndoOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32" d="M240 424v-96c116.4 0 159.39 33.76 208 96c0-119.23-39.57-240-208-240V88L64 256Z"/></svg>';
var rawBackspaceOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32" d="M135.19 390.14a28.8 28.8 0 0 0 21.68 9.86h246.26A29 29 0 0 0 432 371.13V140.87A29 29 0 0 0 403.13 112H156.87a28.84 28.84 0 0 0-21.67 9.84L46.33 256l88.86 134.11Z"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M336.67 192.33L206.66 322.34m130.01 0L206.66 192.33m130.01 0L206.66 322.34m130.01 0L206.66 192.33"/></svg>';
var rawCalendarOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><rect width="416" height="384" x="48" y="80" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32" rx="48"/><circle cx="296" cy="232" r="24" fill="currentColor"/><circle cx="376" cy="232" r="24" fill="currentColor"/><circle cx="296" cy="312" r="24" fill="currentColor"/><circle cx="376" cy="312" r="24" fill="currentColor"/><circle cx="136" cy="312" r="24" fill="currentColor"/><circle cx="216" cy="312" r="24" fill="currentColor"/><circle cx="136" cy="392" r="24" fill="currentColor"/><circle cx="216" cy="392" r="24" fill="currentColor"/><circle cx="296" cy="392" r="24" fill="currentColor"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M128 48v32m256-32v32"/><path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32" d="M464 160H48"/></svg>';
var rawCheckmarkCircle = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="currentColor" d="M256 48C141.31 48 48 141.31 48 256s93.31 208 208 208s208-93.31 208-208S370.69 48 256 48m108.25 138.29l-134.4 160a16 16 0 0 1-12 5.71h-.27a16 16 0 0 1-11.89-5.3l-57.6-64a16 16 0 1 1 23.78-21.4l45.29 50.32l122.59-145.91a16 16 0 0 1 24.5 20.58"/></svg>';
var rawCheckmarkOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M416 128L192 384l-96-96"/></svg>';
var rawChevronBack = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M328 112L184 256l144 144"/></svg>';
var rawChevronBackOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="M328 112L184 256l144 144"/></svg>';
var rawChevronDownOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="m112 184l144 144l144-144"/></svg>';
var rawChevronForward = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="m184 112l144 144l-144 144"/></svg>';
var rawChevronForwardOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="m184 112l144 144l-144 144"/></svg>';
var rawChevronUpOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="48" d="m112 328l144-144l144 144"/></svg>';
var rawClose = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="currentColor" d="m289.94 256l95-95A24 24 0 0 0 351 127l-95 95l-95-95a24 24 0 0 0-34 34l95 95l-95 95a24 24 0 1 0 34 34l95-95l95 95a24 24 0 0 0 34-34Z"/></svg>';
var rawCloseOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M368 368L144 144m224 0L144 368"/></svg>';
var rawCloudUploadOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M320 367.79h76c55 0 100-29.21 100-83.6s-53-81.47-96-83.6c-8.89-85.06-71-136.8-144-136.8c-69 0-113.44 45.79-128 91.2c-60 5.7-112 43.88-112 106.4s54 106.4 120 106.4h56"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="m320 255.79l-64-64l-64 64m64 192.42V207.79"/></svg>';
var rawCreateOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M384 224v184a40 40 0 0 1-40 40H104a40 40 0 0 1-40-40V168a40 40 0 0 1 40-40h167.48"/><path fill="currentColor" d="M459.94 53.25a16.06 16.06 0 0 0-23.22-.56L424.35 65a8 8 0 0 0 0 11.31l11.34 11.32a8 8 0 0 0 11.34 0l12.06-12c6.1-6.09 6.67-16.01.85-22.38M399.34 90L218.82 270.2a9 9 0 0 0-2.31 3.93L208.16 299a3.91 3.91 0 0 0 4.86 4.86l24.85-8.35a9 9 0 0 0 3.93-2.31L422 112.66a9 9 0 0 0 0-12.66l-9.95-10a9 9 0 0 0-12.71 0"/></svg>';
var rawDocumentAttachOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M208 64h66.75a32 32 0 0 1 22.62 9.37l141.26 141.26a32 32 0 0 1 9.37 22.62V432a48 48 0 0 1-48 48H192a48 48 0 0 1-48-48V304"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M288 72v120a32 32 0 0 0 32 32h120"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M160 80v152a23.69 23.69 0 0 1-24 24c-12 0-24-9.1-24-24V88c0-30.59 16.57-56 48-56s48 24.8 48 55.38v138.75c0 43-27.82 77.87-72 77.87s-72-34.86-72-77.87V144"/></svg>';
var rawDocumentOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32" d="M416 221.25V416a48 48 0 0 1-48 48H144a48 48 0 0 1-48-48V96a48 48 0 0 1 48-48h98.75a32 32 0 0 1 22.62 9.37l141.26 141.26a32 32 0 0 1 9.37 22.62Z"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 56v120a32 32 0 0 0 32 32h120"/></svg>';
var rawDocumentTextOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32" d="M416 221.25V416a48 48 0 0 1-48 48H144a48 48 0 0 1-48-48V96a48 48 0 0 1 48-48h98.75a32 32 0 0 1 22.62 9.37l141.26 141.26a32 32 0 0 1 9.37 22.62Z"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M256 56v120a32 32 0 0 0 32 32h120m-232 80h160m-160 80h160"/></svg>';
var rawDownloadOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M336 176h40a40 40 0 0 1 40 40v208a40 40 0 0 1-40 40H136a40 40 0 0 1-40-40V216a40 40 0 0 1 40-40h40"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="m176 272l80 80l80-80M256 48v288"/></svg>';
var rawEllipsisVertical = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><circle cx="256" cy="256" r="48" fill="currentColor"/><circle cx="256" cy="416" r="48" fill="currentColor"/><circle cx="256" cy="96" r="48" fill="currentColor"/></svg>';
var rawExpandOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M432 320v112H320m101.8-10.23L304 304M80 192V80h112M90.2 90.23L208 208M320 80h112v112M421.77 90.2L304 208M192 432H80V320m10.23 101.8L208 304"/></svg>';
var rawFileTrayOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32" d="M384 80H128c-26 0-43 14-48 40L48 272v112a48.14 48.14 0 0 0 48 48h320a48.14 48.14 0 0 0 48-48V272l-32-152c-5-27-23-40-48-40Z"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M48 272h144m128 0h144m-272 0a64 64 0 0 0 128 0"/></svg>';
var rawFolderOpenOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M64 192v-72a40 40 0 0 1 40-40h75.89a40 40 0 0 1 22.19 6.72l27.84 18.56a40 40 0 0 0 22.19 6.72H408a40 40 0 0 1 40 40v40"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M479.9 226.55L463.68 392a40 40 0 0 1-39.93 40H88.25a40 40 0 0 1-39.93-40L32.1 226.55A32 32 0 0 1 64 192h384.1a32 32 0 0 1 31.8 34.55"/></svg>';
var rawInformationCircle = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="currentColor" d="M256 56C145.72 56 56 145.72 56 256s89.72 200 200 200s200-89.72 200-200S366.28 56 256 56m0 82a26 26 0 1 1-26 26a26 26 0 0 1 26-26m48 226h-88a16 16 0 0 1 0-32h28v-88h-16a16 16 0 0 1 0-32h32a16 16 0 0 1 16 16v104h28a16 16 0 0 1 0 32"/></svg>';
var rawMenuOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M80 160h352M80 256h352M80 352h352"/></svg>';
var rawNotificationsOffOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M128.51 204.59q-.37 6.15-.37 12.76C128.14 304 110 320 84.33 351.43C73.69 364.45 83 384 101.62 384H320m94.5-48.7c-18.48-23.45-30.62-47.05-30.62-118c0-79.3-40.52-107.57-73.88-121.3c-4.43-1.82-8.6-6-9.95-10.55C294.21 65.54 277.82 48 256 48s-38.2 17.55-44 37.47c-1.35 4.6-5.52 8.71-10 10.53a150 150 0 0 0-18 8.79M320 384v16a64 64 0 0 1-128 0v-16"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M448 448L64 64"/></svg>';
var rawOpenOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M384 224v184a40 40 0 0 1-40 40H104a40 40 0 0 1-40-40V168a40 40 0 0 1 40-40h167.48M336 64h112v112M224 288L440 72"/></svg>';
var rawPlayOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" d="M112 111v290c0 17.44 17 28.52 31 20.16l247.9-148.37c12.12-7.25 12.12-26.33 0-33.58L143 90.84c-14-8.36-31 2.72-31 20.16Z"/></svg>';
var rawRemove = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M400 256H112"/></svg>';
var rawSearchOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-miterlimit="10" stroke-width="32" d="M221.09 64a157.09 157.09 0 1 0 157.09 157.09A157.1 157.1 0 0 0 221.09 64Z"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M338.29 338.29L448 448"/></svg>';
var rawSend = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="currentColor" d="m476.59 227.05l-.16-.07L49.35 49.84A23.56 23.56 0 0 0 27.14 52A24.65 24.65 0 0 0 16 72.59v113.29a24 24 0 0 0 19.52 23.57l232.93 43.07a4 4 0 0 1 0 7.86L35.53 303.45A24 24 0 0 0 16 327v113.31A23.57 23.57 0 0 0 26.59 460a23.94 23.94 0 0 0 13.22 4a24.55 24.55 0 0 0 9.52-1.93L476.4 285.94l.19-.09a32 32 0 0 0 0-58.8"/></svg>';
var rawSwapVerticalOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M464 208L352 96L240 208m112-94.87V416M48 304l112 112l112-112m-112 94V96"/></svg>';
var rawTrashOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="m112 112l20 320c.95 18.49 14.4 32 32 32h184c17.67 0 30.87-13.51 32-32l20-320"/><path fill="currentColor" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M80 112h352"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M192 112V72h0a23.93 23.93 0 0 1 24-24h80a23.93 23.93 0 0 1 24 24h0v40m-64 64v224m-72-224l8 224m136-224l-8 224"/></svg>';
var rawTrendingDown = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M352 368h112V256"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="m48 144l121.37 121.37a32 32 0 0 0 45.26 0l50.74-50.74a32 32 0 0 1 45.26 0L448 352"/></svg>';
var rawTrendingUp = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M352 144h112v112"/><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="m48 368l121.37-121.37a32 32 0 0 1 45.26 0l50.74 50.74a32 32 0 0 0 45.26 0L448 160"/></svg>';
var rawVolumeHighOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M126 192H56a8 8 0 0 0-8 8v112a8 8 0 0 0 8 8h69.65a15.93 15.93 0 0 1 10.14 3.54l91.47 74.89A8 8 0 0 0 240 392V120a8 8 0 0 0-12.74-6.43l-91.47 74.89A15 15 0 0 1 126 192m194 128c9.74-19.38 16-40.84 16-64c0-23.48-6-44.42-16-64m48 176c19.48-33.92 32-64.06 32-112s-12-77.74-32-112m48 272c30-46 48-91.43 48-160s-18-113-48-160"/></svg>';
var rawVolumeLowOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M189.65 192H120a8 8 0 0 0-8 8v112a8 8 0 0 0 8 8h69.65a16 16 0 0 1 10.14 3.63l91.47 75a8 8 0 0 0 12.74-6.46V119.83a8 8 0 0 0-12.74-6.44l-91.47 75a16 16 0 0 1-10.14 3.61M384 320c9.74-19.41 16-40.81 16-64c0-23.51-6-44.4-16-64"/></svg>';
var rawVolumeMuteOutline = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M416 432L64 80"/><path fill="currentColor" d="M224 136.92v33.8a4 4 0 0 0 1.17 2.82l24 24a4 4 0 0 0 6.83-2.82v-74.15a24.53 24.53 0 0 0-12.67-21.72a23.91 23.91 0 0 0-25.55 1.83a8 8 0 0 0-.66.51l-31.94 26.15a4 4 0 0 0-.29 5.92l17.05 17.06a4 4 0 0 0 5.37.26Zm0 238.16l-78.07-63.92a32 32 0 0 0-20.28-7.16H64v-96h50.72a4 4 0 0 0 2.82-6.83l-24-24a4 4 0 0 0-2.82-1.17H56a24 24 0 0 0-24 24v112a24 24 0 0 0 24 24h69.76l91.36 74.8a8 8 0 0 0 .66.51a23.93 23.93 0 0 0 25.85 1.69A24.49 24.49 0 0 0 256 391.45v-50.17a4 4 0 0 0-1.17-2.82l-24-24a4 4 0 0 0-6.83 2.82ZM352 256c0-24.56-5.81-47.88-17.75-71.27a16 16 0 0 0-28.5 14.54C315.34 218.06 320 236.62 320 256q0 4-.31 8.13a8 8 0 0 0 2.32 6.25l19.66 19.67a4 4 0 0 0 6.75-2A147 147 0 0 0 352 256m64 0c0-51.19-13.08-83.89-34.18-120.06a16 16 0 0 0-27.64 16.12C373.07 184.44 384 211.83 384 256c0 23.83-3.29 42.88-9.37 60.65a8 8 0 0 0 1.9 8.26l16.77 16.76a4 4 0 0 0 6.52-1.27C410.09 315.88 416 289.91 416 256"/><path fill="currentColor" d="M480 256c0-74.26-20.19-121.11-50.51-168.61a16 16 0 1 0-27 17.22C429.82 147.38 448 189.5 448 256c0 47.45-8.9 82.12-23.59 113a4 4 0 0 0 .77 4.55L443 391.39a4 4 0 0 0 6.4-1C470.88 348.22 480 307 480 256"/></svg>';
var rawWarning = '<svg viewBox="0 0 512 512" width="1.2em" height="1.2em" ><path fill="currentColor" d="M449.07 399.08L278.64 82.58c-12.08-22.44-44.26-22.44-56.35 0L51.87 399.08A32 32 0 0 0 80 446.25h340.89a32 32 0 0 0 28.18-47.17m-198.6-1.83a20 20 0 1 1 20-20a20 20 0 0 1-20 20m21.72-201.15l-5.74 122a16 16 0 0 1-32 0l-5.74-121.95a21.73 21.73 0 0 1 21.5-22.69h.21a21.74 21.74 0 0 1 21.73 22.7Z"/></svg>';
function bake(svg) {
  return `data:image/svg+xml;utf8,${svg}`;
}
var iconAdd = bake(rawAdd);
var iconAlertCircle = bake(rawAlertCircle);
var iconAlertCircleOutline = bake(rawAlertCircleOutline);
var iconAppsOutline = bake(rawAppsOutline);
var iconArchiveOutline = bake(rawArchiveOutline);
var iconArrowRedoOutline = bake(rawArrowRedoOutline);
var iconArrowUndoOutline = bake(rawArrowUndoOutline);
var iconBackspaceOutline = bake(rawBackspaceOutline);
var iconCalendarOutline = bake(rawCalendarOutline);
var iconCheckmarkCircle = bake(rawCheckmarkCircle);
var iconCheckmarkOutline = bake(rawCheckmarkOutline);
var iconChevronBack = bake(rawChevronBack);
var iconChevronBackOutline = bake(rawChevronBackOutline);
var iconChevronDownOutline = bake(rawChevronDownOutline);
var iconChevronForward = bake(rawChevronForward);
var iconChevronForwardOutline = bake(rawChevronForwardOutline);
var iconChevronUpOutline = bake(rawChevronUpOutline);
var iconClose = bake(rawClose);
var iconCloseOutline = bake(rawCloseOutline);
var iconCloudUploadOutline = bake(rawCloudUploadOutline);
var iconCreateOutline = bake(rawCreateOutline);
var iconDocumentAttachOutline = bake(rawDocumentAttachOutline);
var iconDocumentOutline = bake(rawDocumentOutline);
var iconDocumentTextOutline = bake(rawDocumentTextOutline);
var iconDownloadOutline = bake(rawDownloadOutline);
var iconEllipsisVertical = bake(rawEllipsisVertical);
var iconExpandOutline = bake(rawExpandOutline);
var iconFileTrayOutline = bake(rawFileTrayOutline);
var iconFolderOpenOutline = bake(rawFolderOpenOutline);
var iconInformationCircle = bake(rawInformationCircle);
var iconMenuOutline = bake(rawMenuOutline);
var iconNotificationsOffOutline = bake(rawNotificationsOffOutline);
var iconOpenOutline = bake(rawOpenOutline);
var iconPlayOutline = bake(rawPlayOutline);
var iconRemove = bake(rawRemove);
var iconSearchOutline = bake(rawSearchOutline);
var iconSend = bake(rawSend);
var iconSwapVerticalOutline = bake(rawSwapVerticalOutline);
var iconTrashOutline = bake(rawTrashOutline);
var iconTrendingDown = bake(rawTrendingDown);
var iconTrendingUp = bake(rawTrendingUp);
var iconVolumeHighOutline = bake(rawVolumeHighOutline);
var iconVolumeLowOutline = bake(rawVolumeLowOutline);
var iconVolumeMuteOutline = bake(rawVolumeMuteOutline);
var iconWarning = bake(rawWarning);
var BY_NAME = {
  "add": iconAdd,
  "alert-circle": iconAlertCircle,
  "alert-circle-outline": iconAlertCircleOutline,
  "apps-outline": iconAppsOutline,
  "archive-outline": iconArchiveOutline,
  "arrow-redo-outline": iconArrowRedoOutline,
  "arrow-undo-outline": iconArrowUndoOutline,
  "backspace-outline": iconBackspaceOutline,
  "calendar-outline": iconCalendarOutline,
  "checkmark-circle": iconCheckmarkCircle,
  "checkmark-outline": iconCheckmarkOutline,
  "chevron-back": iconChevronBack,
  "chevron-back-outline": iconChevronBackOutline,
  "chevron-down-outline": iconChevronDownOutline,
  "chevron-forward": iconChevronForward,
  "chevron-forward-outline": iconChevronForwardOutline,
  "chevron-up-outline": iconChevronUpOutline,
  "close": iconClose,
  "close-outline": iconCloseOutline,
  "cloud-upload-outline": iconCloudUploadOutline,
  "create-outline": iconCreateOutline,
  "document-attach-outline": iconDocumentAttachOutline,
  "document-outline": iconDocumentOutline,
  "document-text-outline": iconDocumentTextOutline,
  "download-outline": iconDownloadOutline,
  "ellipsis-vertical": iconEllipsisVertical,
  "expand-outline": iconExpandOutline,
  "file-tray-outline": iconFileTrayOutline,
  "folder-open-outline": iconFolderOpenOutline,
  "information-circle": iconInformationCircle,
  "menu-outline": iconMenuOutline,
  "notifications-off-outline": iconNotificationsOffOutline,
  "open-outline": iconOpenOutline,
  "play-outline": iconPlayOutline,
  "remove": iconRemove,
  "search-outline": iconSearchOutline,
  "send": iconSend,
  "swap-vertical-outline": iconSwapVerticalOutline,
  "trash-outline": iconTrashOutline,
  "trending-down": iconTrendingDown,
  "trending-up": iconTrendingUp,
  "volume-high-outline": iconVolumeHighOutline,
  "volume-low-outline": iconVolumeLowOutline,
  "volume-mute-outline": iconVolumeMuteOutline,
  "warning": iconWarning
};
function okIcon(value) {
  if (!value) return void 0;
  const trimmed = value.trimStart();
  if (trimmed.startsWith("<svg")) return bake(trimmed);
  return BY_NAME[value] ?? value;
}

// @erplora/outfitkit/dist/ok-empty-state.js
var __defProp2 = Object.defineProperty;
var __decorateClass2 = (decorators, target, key2, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key2, result) || result;
  if (result) __defProp2(target, key2, result);
  return result;
};
var OkEmptyState = class extends i3 {
  constructor() {
    super(...arguments);
    this.icon = "file-tray-outline";
  }
  static {
    this.styles = i`
    /* Ancho máximo del contenedor; bloque a 100%. */
    :host {
      display: block;
      width: 100%;
      /* Tokens propios estilo Ionic (overridables): --ok-* → --ion-* → hex. */
      --icon-color: var(--ok-color-medium, var(--ion-color-medium, #92949c));
      --heading-color: var(--ok-text-color, var(--ion-text-color, #1f2933));
      --message-color: var(--ok-color-medium, var(--ion-color-medium, #92949c));
      --icon-size: 64px;
      --padding: 2.5rem 1.25rem;
    }

    /* Centrado vertical y horizontal del contenido. */
    .wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 0.5rem;
      padding: var(--padding);
      box-sizing: border-box;
      width: 100%;
    }

    ion-icon {
      font-size: var(--icon-size);
      color: var(--icon-color);
      opacity: 0.5; /* atenuado */
      margin-bottom: 0.25rem;
    }

    .heading {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--heading-color);
    }

    .message {
      margin: 0;
      font-size: 0.9375rem;
      color: var(--message-color);
      max-width: 38ch;
    }

    /* Acción debajo del texto. */
    .action {
      margin-top: 1rem;
    }

    /* Oculta los wrappers si no hay contenido. */
    .heading:empty,
    .message:empty {
      display: none;
    }
  `;
  }
  render() {
    return b2`
      <div class="wrap">
        <ion-icon .icon=${okIcon(this.icon)} aria-hidden="true"></ion-icon>
        ${this.heading ? b2`<h2 class="heading">${this.heading}</h2>` : null}
        ${this.message ? b2`<p class="message">${this.message}</p>` : null}
        <slot></slot>
        <div class="action">
          <slot name="action"></slot>
        </div>
      </div>
    `;
  }
};
__decorateClass2([
  n4()
], OkEmptyState.prototype, "icon");
__decorateClass2([
  n4()
], OkEmptyState.prototype, "heading");
__decorateClass2([
  n4()
], OkEmptyState.prototype, "message");
define("ok-empty-state", OkEmptyState);

// @erplora/outfitkit/dist/ok-inline-feedback.js
var __defProp3 = Object.defineProperty;
var __decorateClass3 = (decorators, target, key2, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key2, result) || result;
  if (result) __defProp3(target, key2, result);
  return result;
};
var DEFAULT_LABELS = {
  dismiss: "Dismiss"
};
var OkInlineFeedback = class extends i3 {
  constructor() {
    super(...arguments);
    this.tone = "info";
    this.dismissible = false;
    this.hidden = false;
    this.labels = {};
    this.hasActions = false;
    this.onActionsSlotChange = (e4) => {
      const slot = e4.target;
      this.hasActions = slot.assignedNodes({ flatten: true }).length > 0;
    };
  }
  static {
    this.styles = i`
    :host {
      /* Vars overridable (estilo Ionic), default = cadena --ok-* → --ion-* → hex.
         --tone-color y --tone-icon se reasignan por tone abajo. */
      --tone-color: var(--ok-primary, var(--ion-color-primary, #3880ff));
      --background-opacity: 0.1;
      --color: var(--ok-text, var(--ion-text-color, #1c1b17));
      --border-radius: var(--ok-radius, var(--ion-border-radius, 8px));
      --padding: var(--ok-spacing, var(--ion-padding, 16px));
      --accent-width: 4px;
      --font: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);

      /* Responsive: el banner ocupa el ancho del contenedor. */
      display: block;
      width: 100%;
      font-family: var(--font);
      box-sizing: border-box;
    }
    :host([hidden]) { display: none; }

    /* Mapa de tonos → color Ionic + icono por defecto. */
    :host([tone='success']) { --tone-color: var(--ok-success, var(--ion-color-success, #2dd55b)); }
    :host([tone='warning']) { --tone-color: var(--ok-warning, var(--ion-color-warning, #ffc409)); }
    :host([tone='danger'])  { --tone-color: var(--ok-danger, var(--ion-color-danger, #c5000f)); }
    :host([tone='neutral']) { --tone-color: var(--ok-medium, var(--ion-color-medium, #5f5f5f)); }
    /* info / sin tono → primary (default ya aplicado en :host). */

    .box {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: var(--padding);
      border-radius: var(--border-radius);
      border-inline-start: var(--accent-width) solid var(--tone-color);
      /* Fondo tonal: el color del tono con baja opacidad (color-mix con fallback al borde fino). */
      background: color-mix(in srgb, var(--tone-color) calc(var(--background-opacity) * 100%), transparent);
      color: var(--color);
    }

    .icon {
      flex: 0 0 auto;
      font-size: 1.4rem;
      line-height: 1;
      color: var(--tone-color);
      margin-top: 0.05rem;
    }

    .content {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .row {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    .text {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .heading {
      font-weight: 700;
      font-size: 0.98rem;
      line-height: 1.3;
    }
    .body {
      font-size: 0.92rem;
      line-height: 1.45;
    }
    .actions {
      flex: 0 0 auto;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    /* Si no hay actions, el slot queda vacío y no ocupa espacio. */
    .actions.empty { display: none; }

    .close {
      flex: 0 0 auto;
      background: none;
      border: 0;
      cursor: pointer;
      padding: 0.15rem;
      margin: -0.15rem -0.15rem 0 0;
      color: inherit;
      opacity: 0.6;
      font-size: 1.2rem;
      line-height: 1;
      border-radius: 4px;
      transition: background-color var(--ok-transition, 150ms ease), color var(--ok-transition, 150ms ease),
        border-color var(--ok-transition, 150ms ease), box-shadow var(--ok-transition, 150ms ease),
        opacity 0.15s ease, transform 120ms ease;
    }
    @media (hover: hover) {
      .close:hover { opacity: 1; background: rgba(var(--ion-text-color-rgb, 24, 24, 27), 0.07); }
    }
    .close:active { transform: scale(var(--ok-press-scale, 0.97)); }

    /* Móvil: las actions bajan bajo el texto (apiladas a ancho completo). */
    @media (max-width: 640px) {
      .row { flex-direction: column; align-items: stretch; }
      .actions { width: 100%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .close:hover,
      .close:active { transform: none; }
    }
  `;
  }
  // Textos efectivos: defaults en inglés + overrides del consumidor.
  get t() {
    return { ...DEFAULT_LABELS, ...this.labels };
  }
  // Icono por defecto según el tono (overridable por la prop `icon`).
  defaultIcon() {
    switch (this.tone) {
      case "success":
        return iconCheckmarkCircle;
      case "warning":
        return iconWarning;
      case "danger":
        return iconAlertCircle;
      case "neutral":
        return iconInformationCircle;
      case "info":
      default:
        return iconInformationCircle;
    }
  }
  // Oculta el banner y avisa al consumidor; éste puede revertir restaurando `hidden=false`.
  dismiss() {
    this.hidden = true;
    this.dispatchEvent(new CustomEvent("ok-dismiss", { bubbles: true, composed: true }));
  }
  render() {
    const iconName = this.icon ?? this.defaultIcon();
    return b2`
      <div class="box" role="status">
        <ion-icon class="icon" .icon=${okIcon(iconName)} aria-hidden="true"></ion-icon>
        <div class="content">
          <div class="row">
            <div class="text">
              ${this.heading ? b2`<div class="heading">${this.heading}</div>` : null}
              <div class="body"><slot></slot></div>
            </div>
            <div class="actions ${this.hasActions ? "" : "empty"}">
              <slot name="actions" @slotchange=${this.onActionsSlotChange}></slot>
            </div>
          </div>
        </div>
        ${this.dismissible ? b2`
              <button class="close" aria-label=${this.t.dismiss} @click=${this.dismiss}>
                <ion-icon .icon=${iconClose} aria-hidden="true"></ion-icon>
              </button>
            ` : null}
      </div>
    `;
  }
};
__decorateClass3([
  n4({ type: String, reflect: true })
], OkInlineFeedback.prototype, "tone");
__decorateClass3([
  n4({ type: String })
], OkInlineFeedback.prototype, "heading");
__decorateClass3([
  n4({ type: String })
], OkInlineFeedback.prototype, "icon");
__decorateClass3([
  n4({ type: Boolean, reflect: true })
], OkInlineFeedback.prototype, "dismissible");
__decorateClass3([
  n4({ type: Boolean, reflect: true })
], OkInlineFeedback.prototype, "hidden");
__decorateClass3([
  n4({ attribute: false })
], OkInlineFeedback.prototype, "labels");
__decorateClass3([
  r5()
], OkInlineFeedback.prototype, "hasActions");
define("ok-inline-feedback", OkInlineFeedback);

// @erplora/outfitkit/dist/ok-status-pill.js
var __defProp4 = Object.defineProperty;
var __decorateClass4 = (decorators, target, key2, kind) => {
  var result = void 0;
  for (var i4 = decorators.length - 1, decorator; i4 >= 0; i4--)
    if (decorator = decorators[i4])
      result = decorator(target, key2, result) || result;
  if (result) __defProp4(target, key2, result);
  return result;
};
var OkStatusPill = class extends i3 {
  constructor() {
    super(...arguments);
    this.tone = "neutral";
    this.dot = false;
    this.size = "md";
  }
  static {
    this.styles = i`
    :host {
      /* Vars overridable (estilo Ionic), default = cadena --ok-* → --ion-* → hex.
         --tone-color (base: fondo/punto/icono) y --tone-shade (texto) se reasignan por tone abajo. */
      --tone-color: var(--ok-medium, var(--ion-color-medium, #5f5f5f));
      --tone-shade: var(--ok-medium, var(--ion-color-medium-shade, #545454));
      --background-opacity: var(--ok-pill-bg-opacity, 0.14);
      --border-radius: var(--ok-pill-radius, 999px);
      --font: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);

      /* Inline: el pill vive en celdas de tabla, cabeceras y listados. */
      display: inline-flex;
      vertical-align: middle;
      font-family: var(--font);
      box-sizing: border-box;
    }

    /* Mapa de tonos → color Ionic (base + shade para el texto). */
    :host([tone='success']) {
      --tone-color: var(--ok-success, var(--ion-color-success, #2dd55b));
      --tone-shade: var(--ok-success, var(--ion-color-success-shade, #28bb50));
    }
    :host([tone='warning']) {
      --tone-color: var(--ok-warning, var(--ion-color-warning, #ffc409));
      --tone-shade: var(--ok-warning-shade, var(--ion-color-warning-shade, #e0ac08));
    }
    :host([tone='danger']) {
      --tone-color: var(--ok-danger, var(--ion-color-danger, #c5000f));
      --tone-shade: var(--ok-danger, var(--ion-color-danger-shade, #ad000d));
    }
    :host([tone='info']) {
      --tone-color: var(--ok-info, var(--ion-color-secondary, #0163aa));
      --tone-shade: var(--ok-info, var(--ion-color-secondary-shade, #015896));
    }
    :host([tone='primary']) {
      --tone-color: var(--ok-primary, var(--ion-color-primary, #3880ff));
      --tone-shade: var(--ok-primary, var(--ion-color-primary-shade, #3171e0));
    }
    /* neutral / sin tono → medium (default ya aplicado en :host). */

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.25em 0.7em;
      border-radius: var(--border-radius);
      /* Fondo tonal: el color del tono con baja opacidad. */
      background: color-mix(in srgb, var(--tone-color) calc(var(--background-opacity) * 100%), transparent);
      color: var(--ok-pill-color, var(--tone-shade));
      font-size: 0.8125rem;
      font-weight: 600;
      line-height: 1.4;
      white-space: nowrap;
    }
    :host([size='sm']) .pill {
      font-size: 0.72rem;
      padding: 0.2em 0.6em;
    }

    ion-icon {
      flex: 0 0 auto;
      font-size: 1.05em;
      pointer-events: none;
    }

    /* Punto de color (estilo Linear) en vez de icono. */
    .dot {
      flex: 0 0 auto;
      width: 0.5em;
      height: 0.5em;
      border-radius: 50%;
      background: var(--tone-color);
    }
  `;
  }
  render() {
    return b2`
      <span class="pill" part="pill">
        ${this.dot ? b2`<span class="dot" part="dot" aria-hidden="true"></span>` : this.icon ? b2`<ion-icon .icon=${okIcon(this.icon)} aria-hidden="true"></ion-icon>` : null}
        <slot>${this.label ?? ""}</slot>
      </span>
    `;
  }
};
__decorateClass4([
  n4({ type: String, reflect: true })
], OkStatusPill.prototype, "tone");
__decorateClass4([
  n4({ type: String })
], OkStatusPill.prototype, "label");
__decorateClass4([
  n4({ type: String })
], OkStatusPill.prototype, "icon");
__decorateClass4([
  n4({ type: Boolean, reflect: true })
], OkStatusPill.prototype, "dot");
__decorateClass4([
  n4({ type: String, reflect: true })
], OkStatusPill.prototype, "size");
define("ok-status-pill", OkStatusPill);

// ui/components/erp-flows-value/erp-flows-value.ts
var ErpFlowsValue = class extends i3 {
  constructor() {
    super(...arguments);
    this.parts = [];
    this.fieldLabel = (p3) => p3;
    this.label = "";
    this.placeholder = "";
    this.insertLabel = "+";
    this.removeLabel = "Remove";
    this.canPickFields = true;
    this.name = "";
  }
  static {
    this.styles = i`
    :host {
      display: block;
    }
    .label {
      font-size: 0.78rem;
      color: var(--ok-muted, var(--ion-color-medium, #6b6a63));
      margin-bottom: 0.25rem;
    }
    .box {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.3rem;
      min-height: 2.4rem;
      padding: 0.3rem 0.45rem;
      border: 1px solid var(--ok-border, var(--ion-border-color, #d7d5cc));
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, var(--ion-card-background, #fff));
    }
    .box:focus-within {
      border-color: var(--ok-primary, var(--ion-color-primary, #3880ff));
    }
    input {
      /* A generous basis so a text segment WRAPS to its own line instead of being squeezed into
         three visible characters between two pills. */
      flex: 1 1 10rem;
      min-width: 6rem;
      border: 0;
      outline: none;
      background: transparent;
      font: inherit;
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
      padding: 0.25rem 0;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.15rem 0.2rem 0.15rem 0.55rem;
      border-radius: var(--ok-radius-pill, 999px);
      background: var(--ok-chip-bg, rgba(56, 128, 255, 0.14));
      color: var(--ok-chip-color, var(--ion-color-primary, #3880ff));
      font-size: 0.85rem;
      font-weight: 600;
      white-space: nowrap;
      max-width: 100%;
    }
    .pill span {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pill button {
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      padding: 0.1rem 0.35rem;
      border-radius: 999px;
      min-width: 1.75rem;
      min-height: 1.75rem;
    }
    .insert {
      border: 1px dashed var(--ok-border, #d7d5cc);
      background: transparent;
      color: var(--ok-muted, #6b6a63);
      border-radius: var(--ok-radius-pill, 999px);
      cursor: pointer;
      font: inherit;
      font-size: 0.8rem;
      /* 44px: this editor is used on a tablet at the counter, with a finger. */
      min-height: 2.1rem;
      padding: 0 0.7rem;
      white-space: nowrap;
    }
  `;
  }
  /** Empty text is dropped and neighbours are joined, so removing a pill does not leave holes. */
  normalise(parts) {
    const out = [];
    for (const part of parts) {
      const last = out[out.length - 1];
      if (part.kind === "text") {
        if (part.text === "") continue;
        if (last && last.kind === "text") {
          out[out.length - 1] = { kind: "text", text: last.text + part.text };
          continue;
        }
      }
      out.push(part);
    }
    return out;
  }
  emit(parts) {
    const next = this.normalise(parts);
    this.parts = next;
    this.dispatchEvent(
      new CustomEvent("flows-value-change", {
        detail: { parts: next, ...this.name ? { name: this.name } : {} },
        bubbles: true,
        composed: true
      })
    );
  }
  onText(index, text) {
    const parts = [...this.slots];
    parts[index] = { kind: "text", text };
    this.emit(parts);
  }
  removeAt(index) {
    this.emit(this.slots.filter((_2, i4) => i4 !== index));
  }
  /**
   * What is actually drawn: the parts, normalised, always ending in a text box so there is
   * somewhere to keep typing. Normalising here and not only on the way out matters — two adjacent
   * text parts arriving from a stored document would otherwise draw as two boxes with an
   * invisible seam between them, and typing in the first would rebuild the value in the wrong
   * order.
   */
  get slots() {
    const parts = this.normalise(this.parts);
    const last = parts[parts.length - 1];
    if (!last || last.kind !== "text") parts.push({ kind: "text", text: "" });
    return parts;
  }
  render() {
    return b2`
      ${this.label ? b2`<div class="label">${this.label}</div>` : A}
      <div class="box">
        ${this.slots.map(
      (part, i4) => part.kind === "field" ? b2`<span class="pill"
                ><span>${this.fieldLabel(part.path)}</span
                ><button
                  type="button"
                  aria-label=${this.removeLabel}
                  @click=${() => this.removeAt(i4)}
                >
                  ×
                </button></span
              >` : b2`<input
                type="text"
                .value=${part.text}
                placeholder=${i4 === 0 ? this.placeholder : ""}
                @input=${(e4) => this.onText(i4, e4.target.value)}
              />`
    )}
        ${this.canPickFields ? b2`<button
              type="button"
              class="insert"
              @click=${() => this.dispatchEvent(
      new CustomEvent("flows-pick-field", {
        detail: { name: this.name },
        bubbles: true,
        composed: true
      })
    )}
            >
              ${this.insertLabel}
            </button>` : A}
      </div>
    `;
  }
  /** Appends a field the editor's picker resolved. Called by the editor, not by a template. */
  appendField(path) {
    this.emit([...this.parts, { kind: "field", path }]);
  }
};
__decorateClass([
  n4({ attribute: false })
], ErpFlowsValue.prototype, "parts", 2);
__decorateClass([
  n4({ attribute: false })
], ErpFlowsValue.prototype, "fieldLabel", 2);
__decorateClass([
  n4({ type: String })
], ErpFlowsValue.prototype, "label", 2);
__decorateClass([
  n4({ type: String })
], ErpFlowsValue.prototype, "placeholder", 2);
__decorateClass([
  n4({ type: String })
], ErpFlowsValue.prototype, "insertLabel", 2);
__decorateClass([
  n4({ type: String })
], ErpFlowsValue.prototype, "removeLabel", 2);
__decorateClass([
  n4({ type: Boolean })
], ErpFlowsValue.prototype, "canPickFields", 2);
__decorateClass([
  n4({ type: String })
], ErpFlowsValue.prototype, "name", 2);
define("erp-flows-value", ErpFlowsValue);

// ui/lib/plain-language.ts
var MINUTE = 60;
var HOUR = 3600;
var DAY = 86400;
function describeDelay(seconds, t3) {
  const s4 = Math.max(0, Math.floor(Number(seconds) || 0));
  if (s4 === 0) return t3("ui.delayNone");
  if (s4 % DAY === 0) return plural(t3, "ui.delayDays", s4 / DAY);
  if (s4 % HOUR === 0) return plural(t3, "ui.delayHours", s4 / HOUR);
  if (s4 % MINUTE === 0) return plural(t3, "ui.delayMinutes", s4 / MINUTE);
  return plural(t3, "ui.delaySeconds", s4);
}
function plural(t3, base, count) {
  return t3(count === 1 ? `${base}One` : base, { count });
}
function dailyCron(time) {
  const [h3, m3] = time.split(":");
  return `${Number(m3)} ${Number(h3)} * * *`;
}
function readDailyCron(cron) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [m3, h3, dom, mon, dow] = parts;
  if (dom !== "*" || mon !== "*" || dow !== "*") return null;
  if (!/^\d{1,2}$/.test(m3) || !/^\d{1,2}$/.test(h3)) return null;
  const mi = Number(m3);
  const hi = Number(h3);
  if (mi > 59 || hi > 23) return null;
  return `${String(hi).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}
function describeTrigger(trigger, t3, label) {
  switch (trigger.kind) {
    case "event":
      return t3("ui.triggerEvent", { event: label || trigger.event || "" });
    case "cron": {
      const time = readDailyCron(trigger.cron ?? "");
      return time ? t3("ui.triggerDaily", { time }) : t3("ui.triggerCron", { cron: trigger.cron ?? "" });
    }
    case "at":
      return t3("ui.triggerAt", { when: trigger.at ?? "" });
    default:
      return t3("ui.triggerManual");
  }
}
function describeStep(step, t3) {
  switch (step.kind) {
    case "command": {
      const command = typeof step.command === "string" ? step.command.trim() : "";
      return command ? t3("ui.stepCommand", { command }) : t3("ui.stepCommandEmpty");
    }
    case "condition": {
      const count = Object.keys(step.when ?? {}).length;
      return count === 0 ? t3("ui.stepGuardEmpty") : plural(t3, "ui.stepGuard", count);
    }
    case "delay":
      return describeDelay(Number(step.seconds ?? 0), t3);
    case "http": {
      const url = typeof step.url === "string" ? step.url.trim() : "";
      const method = String(step.method ?? "GET");
      if (!url) return t3("ui.stepHttpEmpty");
      const host = hostOf(url);
      return host ? t3("ui.stepHttp", { method, host }) : t3("ui.stepHttpTemplatedHost", { method });
    }
    case "ai": {
      const prompt = typeof step.prompt === "string" ? step.prompt.trim() : "";
      if (!prompt) return t3("ui.stepAiEmpty");
      const key2 = step.policy === "auto" ? "ui.stepAiAuto" : "ui.stepAiManual";
      return t3(key2, { prompt: shorten(inWords(prompt)) });
    }
    case "notify": {
      const field = step.to?.field;
      if (!step.to?.query || !field) return t3("ui.stepNotifyEmpty");
      const key2 = step.channel === "whatsapp" ? "ui.stepNotifyWhatsapp" : "ui.stepNotifyEmail";
      return t3(key2, { field: humaniseField(String(field)) });
    }
    case "query": {
      const query = typeof step.query === "string" ? step.query.trim() : "";
      if (!query) return t3("ui.stepQueryEmpty");
      return t3(step.result === "count" ? "ui.stepQueryCount" : "ui.stepQuery", { query });
    }
    case "approval": {
      const title = typeof step.title === "string" ? step.title.trim() : "";
      if (!title) return t3("ui.stepApprovalEmpty");
      const role = step.assignee?.role?.trim() ?? "";
      const question = shorten(inWords(title));
      return role ? t3("ui.stepApproval", { title: question, role }) : t3("ui.stepApprovalAdmins", { title: question });
    }
    default:
      return t3("ui.stepUnsupported", { kind: step.kind });
  }
}
function hostOf(url) {
  const stable = url.indexOf("{{") < 0 ? url : url.slice(0, url.indexOf("{{"));
  try {
    const parsed = new URL(stable);
    return /[{}]/.test(parsed.host) ? "" : parsed.host;
  } catch {
    return "";
  }
}
function inWords(text) {
  return text.replace(
    /\{\{\s*([^}]+?)\s*\}\}/g,
    (_all, path) => humaniseField(String(path).replace(/^(input|event|steps|secret)\./, ""))
  );
}
function shorten(text, max = 70) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const space = cut.lastIndexOf(" ");
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}\u2026`;
}
function runOutcome(run2, t3) {
  switch (run2.status) {
    case "done":
      return { label: t3("ui.runDone"), tone: "success" };
    case "failed":
      return { label: t3("ui.runFailed"), tone: "danger" };
    case "sleeping":
      return { label: t3("ui.runSleeping"), tone: "warning" };
    case "waiting_approval":
      return { label: t3("ui.runWaitingApproval"), tone: "warning" };
    case "cancelled":
      return { label: t3("ui.runCancelled"), tone: "neutral" };
    default:
      return { label: t3("ui.runRunning"), tone: "neutral" };
  }
}
function describeRunStep(row, t3, spec) {
  if (row.status === "failed") {
    return t3("ui.ranFailed", { reason: row.error || t3("ui.ranFailedUnknown") });
  }
  if (row.kind === "condition") {
    const matched = row.output?.matched;
    return matched === false ? t3("ui.ranGuardStopped") : t3("ui.ranGuardPassed");
  }
  if (row.kind === "delay") {
    const wake = row.output?.wake_at;
    return row.status === "sleeping" && wake ? t3("ui.ranWaitingUntil", { when: wake }) : t3("ui.ranWaited");
  }
  if (row.kind === "command") {
    const command = typeof spec?.command === "string" ? spec.command : "";
    return command ? t3("ui.ranCommand", { command }) : t3("ui.ranCommandUnnamed");
  }
  if (row.kind === "query") {
    const output = row.output;
    return output?.found ? t3("ui.ranQueryFound", { count: output.count ?? 0 }) : t3("ui.ranQueryNothing");
  }
  if (row.kind === "approval") {
    const decision = row.output?.decision;
    if (decision === "approved") return t3("ui.ranApprovalApproved");
    if (decision === "rejected") return t3("ui.ranApprovalRejected");
    if (decision === "expired") return t3("ui.ranApprovalExpired");
    return t3("ui.ranApprovalWaiting");
  }
  return t3("ui.ranStep", { kind: row.kind ?? "" });
}
function humaniseField(path) {
  if (!path) return "";
  return path.split(".").map((segment) => {
    const words = segment.replace(/_/g, " ").trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
  }).join(" \u203A ");
}
function describeSample(field, t3) {
  if (field.redacted) return t3("ui.pickFieldRedacted");
  if (field.type === "object" || field.type === "array") return "";
  if (field.sample === void 0 || field.sample === null) return "";
  const text = typeof field.sample === "string" ? field.sample : JSON.stringify(field.sample);
  return field.truncated ? `${text}\u2026` : text;
}

// ui/components/erp-flows-field-picker/erp-flows-field-picker.ts
var ErpFlowsFieldPicker = class extends i3 {
  constructor() {
    super(...arguments);
    this.shape = null;
    this.open = false;
    this.loading = false;
    this.root = "input";
    this.eventLabel = "";
    this.query = "";
    this.t = (k2) => k2;
  }
  static {
    this.styles = i`
    :host {
      display: contents;
    }
    .scrim {
      position: fixed;
      inset: 0;
      z-index: 40;
      background: var(--ok-scrim, rgba(0, 0, 0, 0.35));
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    @media (min-width: 768px) {
      .scrim {
        align-items: center;
      }
    }
    .panel {
      display: flex;
      flex-direction: column;
      width: min(30rem, 100%);
      max-height: min(80vh, 34rem);
      background: var(--ok-surface, var(--ion-card-background, #fff));
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
      border-radius: var(--ok-radius, 14px) var(--ok-radius, 14px) 0 0;
      box-shadow: var(--ok-shadow-md, 0 12px 40px rgba(0, 0, 0, 0.25));
      overflow: hidden;
    }
    @media (min-width: 768px) {
      .panel {
        border-radius: var(--ok-radius, 14px);
      }
    }
    header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.9rem 1rem 0.5rem;
    }
    header h2 {
      margin: 0;
      font-size: 1rem;
      flex: 1 1 auto;
    }
    header button {
      border: 0;
      background: transparent;
      font-size: 1.3rem;
      cursor: pointer;
      color: var(--ok-muted, #6b6a63);
      min-width: 2.5rem;
      min-height: 2.5rem;
      border-radius: 999px;
    }
    .from,
    .notice {
      padding: 0 1rem 0.5rem;
      font-size: 0.8rem;
      color: var(--ok-muted, #6b6a63);
    }
    .search {
      padding: 0 1rem 0.6rem;
    }
    .search input {
      width: 100%;
      box-sizing: border-box;
      font: inherit;
      padding: 0.6rem 0.7rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-bg, transparent);
      color: inherit;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0 0 0.5rem;
      overflow-y: auto;
      flex: 1 1 auto;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      width: 100%;
      text-align: left;
      background: transparent;
      border: 0;
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      /* A finger, not a mouse: this editor is used on the counter tablet. */
      padding: 0.7rem 1rem;
      min-height: 3rem;
      cursor: pointer;
      font: inherit;
      color: inherit;
    }
    .field:hover {
      background: var(--ok-hover, rgba(0, 0, 0, 0.04));
    }
    .field[aria-disabled='true'] {
      cursor: not-allowed;
      opacity: 0.55;
    }
    .field[aria-disabled='true']:hover {
      background: transparent;
    }
    .name {
      font-weight: 600;
    }
    .meta {
      font-size: 0.8rem;
      color: var(--ok-muted, #6b6a63);
    }
    .empty {
      padding: 1.5rem 1rem;
      text-align: center;
      color: var(--ok-muted, #6b6a63);
    }
  `;
  }
  /**
   * Why a field cannot be dropped into a value, or `''` when it can.
   *
   * The only real constraint in v1 is the mapping language itself: `resolve_path` walks `a.b.c`
   * and has no array indexing, so an array is a dead end, and a whole object would render as raw
   * JSON in a message. Both stay VISIBLE with this reason attached.
   */
  skipReason(field) {
    if (field.type === "array") return this.t("ui.pickFieldSkipArray");
    if (field.type === "object") return this.t("ui.pickFieldSkipObject");
    return "";
  }
  get matches() {
    const fields = this.shape?.fields ?? [];
    const q = this.query.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter((f3) => {
      const label = humaniseField(f3.path).toLowerCase();
      const sample = describeSample(f3, this.t).toLowerCase();
      return label.includes(q) || f3.path.toLowerCase().includes(q) || sample.includes(q);
    });
  }
  pick(field) {
    if (this.skipReason(field)) return;
    this.dispatchEvent(
      new CustomEvent("flows-field-picked", {
        detail: { path: `${this.root}.${field.path}` },
        bubbles: true,
        composed: true
      })
    );
  }
  close() {
    this.dispatchEvent(new CustomEvent("flows-picker-close", { bubbles: true, composed: true }));
  }
  renderField(field) {
    const skipped = this.skipReason(field);
    const sample = describeSample(field, this.t);
    const optional = this.shape && field.seen_in < this.shape.samples ? this.t("ui.pickFieldOptional") : "";
    const meta = [skipped || sample, optional].filter(Boolean).join(" \xB7 ");
    return b2`<li>
      <button
        type="button"
        class="field"
        aria-disabled=${skipped ? "true" : "false"}
        @click=${() => this.pick(field)}
      >
        <span class="name">${humaniseField(field.path)}</span>
        ${meta ? b2`<span class="meta">${meta}</span>` : A}
      </button>
    </li>`;
  }
  render() {
    if (!this.open) return A;
    const fields = this.matches;
    return b2`<div
      class="scrim"
      @click=${(e4) => {
      if (e4.target === e4.currentTarget) this.close();
    }}
    >
      <div class="panel" role="dialog" aria-label=${this.t("ui.pickFieldTitle")}>
        <header>
          <h2>${this.t("ui.pickFieldTitle")}</h2>
          <button type="button" aria-label=${this.t("ui.close")} @click=${() => this.close()}>×</button>
        </header>
        ${this.eventLabel ? b2`<div class="from">${this.t("ui.pickFieldFrom", { event: this.eventLabel })}</div>` : A}
        ${this.shape && this.shape.samples === 0 ? b2`<div class="notice">${this.t("ui.pickFieldNoSamples")}</div>` : A}
        ${this.shape && (this.shape.fields?.length ?? 0) > 0 ? b2`<div class="search">
                <input
                  type="search"
                  .value=${this.query}
                  placeholder=${this.t("ui.pickFieldSearch")}
                  @input=${(e4) => {
      this.query = e4.target.value;
    }}
                />
              </div>
              <ul>
                ${fields.map((f3) => this.renderField(f3))}
              </ul>` : b2`<div class="empty">
              ${this.loading ? this.t("ui.loading") : this.t("ui.pickFieldEmpty")}
            </div>`}
      </div>
    </div>`;
  }
};
__decorateClass([
  n4({ attribute: false })
], ErpFlowsFieldPicker.prototype, "shape", 2);
__decorateClass([
  n4({ type: Boolean, reflect: true })
], ErpFlowsFieldPicker.prototype, "open", 2);
__decorateClass([
  n4({ type: Boolean })
], ErpFlowsFieldPicker.prototype, "loading", 2);
__decorateClass([
  n4({ type: String })
], ErpFlowsFieldPicker.prototype, "root", 2);
__decorateClass([
  n4({ type: String })
], ErpFlowsFieldPicker.prototype, "eventLabel", 2);
__decorateClass([
  n4({ type: String })
], ErpFlowsFieldPicker.prototype, "query", 2);
__decorateClass([
  n4({ attribute: false })
], ErpFlowsFieldPicker.prototype, "t", 2);
define("erp-flows-field-picker", ErpFlowsFieldPicker);

// ui/lib/flow-doc.ts
var SCHEMA_VERSION = 1;
var PATH_ROOTS = ["input", "steps", "event", "secret"];
var OPERATORS = [
  "eq",
  "neq",
  "in",
  "exists",
  "contains",
  "gt",
  "gte",
  "lt",
  "lte"
];
var STEP_KEYS = {
  command: ["id", "kind", "command", "params"],
  condition: ["id", "kind", "when"],
  delay: ["id", "kind", "seconds", "until"],
  http: ["id", "kind", "method", "url", "headers", "body", "timeout"],
  ai: ["id", "kind", "prompt", "tools", "policy", "max_iters"],
  notify: ["id", "kind", "channel", "to", "template", "vars"],
  query: ["id", "kind", "query", "params", "result", "limit"],
  approval: ["id", "kind", "title", "summary", "assignee", "expires_in", "on_expire", "on_reject"]
};
var EXPIRY_POLICIES = ["reject", "cancel", "continue"];
var REJECT_POLICIES = ["cancel", "continue"];
var DEFAULT_APPROVAL_TTL_SECONDS = 259200;
var MAX_APPROVAL_TTL_SECONDS = 2592e3;
var QUERY_RESULTS = ["first", "count"];
var MAX_QUERY_ROWS = 200;
var HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
var NOTIFY_CHANNELS = ["email", "whatsapp"];
var MAX_ITERS_CAP = 10;
var MAX_TIMEOUT_SECONDS = 30;
function emptyDoc() {
  return { schema_version: SCHEMA_VERSION, triggers: [{ kind: "manual" }], steps: [] };
}
function readDoc(raw) {
  const src = raw ?? {};
  const triggers = Array.isArray(src.triggers) ? src.triggers : [];
  const steps = Array.isArray(src.steps) ? src.steps : [];
  return {
    schema_version: typeof src.schema_version === "number" ? src.schema_version : SCHEMA_VERSION,
    ...typeof src.name === "string" ? { name: src.name } : {},
    triggers,
    steps
  };
}
function isSpineKind(kind) {
  return Object.prototype.hasOwnProperty.call(STEP_KEYS, kind);
}
function newStepId(doc) {
  const taken = new Set(doc.steps.map((s4) => s4.id));
  for (let i4 = 0; i4 < 50; i4 += 1) {
    const id = `s${Math.random().toString(36).slice(2, 8)}`;
    if (!taken.has(id)) return id;
  }
  return `s${Date.now().toString(36)}`;
}
function blankStep(id, kind) {
  if (kind === "condition") return { id, kind, when: {} };
  if (kind === "delay") return { id, kind, seconds: 3600 };
  if (kind === "http") return { id, kind, method: "GET", url: "", headers: {} };
  if (kind === "ai") {
    return { id, kind, prompt: "", tools: { queries: [], commands: [] }, policy: "manual", max_iters: 6 };
  }
  if (kind === "notify") {
    return { id, kind, channel: "email", to: { query: "", params: {}, field: "" }, vars: {} };
  }
  if (kind === "query") {
    return { id, kind, query: "", params: {}, result: "first", limit: MAX_QUERY_ROWS };
  }
  if (kind === "approval") {
    return {
      id,
      kind,
      title: "",
      summary: "",
      expires_in: DEFAULT_APPROVAL_TTL_SECONDS,
      on_expire: "reject",
      on_reject: "cancel"
    };
  }
  return { id, kind, command: "", params: {} };
}
function addStep(doc, kind, at2) {
  const step = blankStep(newStepId(doc), kind);
  const steps = [...doc.steps];
  steps.splice(at2 ?? steps.length, 0, step);
  return { ...doc, steps };
}
function removeStep(doc, index) {
  return { ...doc, steps: doc.steps.filter((_2, i4) => i4 !== index) };
}
function moveStep(doc, from, to) {
  const steps = [...doc.steps];
  const [moved] = steps.splice(from, 1);
  if (!moved) return doc;
  steps.splice(to, 0, moved);
  return { ...doc, steps };
}
function patchStep(doc, index, patch) {
  return {
    ...doc,
    steps: doc.steps.map((s4, i4) => i4 === index ? { ...s4, ...patch } : s4)
  };
}
function patchTrigger(doc, trigger) {
  return { ...doc, triggers: [trigger] };
}
function isPath(s4) {
  const root = s4.split(".")[0];
  return PATH_ROOTS.includes(root) && s4.length > root.length + 1 && s4[root.length] === ".";
}
function scalar(text) {
  if (text === "true") return true;
  if (text === "false") return false;
  if (text !== "" && String(Number(text)) === text) return Number(text);
  return text;
}
function partsToValue(parts) {
  if (parts.length === 0) return "";
  if (parts.length === 1 && !parts.some(isSecretPart)) {
    const only = parts[0];
    if (only.kind === "field") return only.path;
    return scalar(only.text);
  }
  return partsToTemplate(parts);
}
function isSecretPart(part) {
  return part.kind === "field" && part.path.startsWith("secret.");
}
function partsToTemplate(parts) {
  return parts.map((p3) => p3.kind === "field" ? `{{${p3.path}}}` : p3.text).join("");
}
function valueToParts(value) {
  if (typeof value !== "string") {
    return value === void 0 || value === null ? [] : [{ kind: "text", text: String(value) }];
  }
  if (isPath(value)) return [{ kind: "field", path: value }];
  const parts = [];
  let rest = value;
  for (; ; ) {
    const start = rest.indexOf("{{");
    if (start < 0) break;
    const end = rest.indexOf("}}", start + 2);
    if (end < 0) break;
    if (start > 0) parts.push({ kind: "text", text: rest.slice(0, start) });
    parts.push({ kind: "field", path: rest.slice(start + 2, end).trim() });
    rest = rest.slice(end + 2);
  }
  if (rest !== "") parts.push({ kind: "text", text: rest });
  return parts;
}
function requiredGrants(doc) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const need = (kind, value) => {
    const text = typeof value === "string" ? value.trim() : "";
    if (!text) return;
    const k2 = `${kind} ${text}`;
    if (seen.has(k2)) return;
    seen.add(k2);
    out.push({ kind, value: text });
  };
  for (const step of doc.steps) {
    switch (step.kind) {
      case "command":
        need("command", step.command);
        break;
      // The URL is authorised as a PATTERN, not as itself: the grant is compared against the
      // TEMPLATED url at run time, so what has to be allowed is everything the template can become.
      case "http":
        need("http", httpPatternFor(typeof step.url === "string" ? step.url : ""));
        break;
      // Offering a tool is not authorising it (`assemble_tools` ∩ step ∩ live grants). Each side of
      // `tools` is a different grant kind because a read and a write are different decisions.
      case "ai":
        for (const query of step.tools?.queries ?? []) need("query", query);
        for (const command of step.tools?.commands ?? []) need("command", command);
        break;
      // The SAME grant kind an ai tool asks for (hub#954 added no permission surface): what
      // changed is that reading no longer needs a model in between, not who may read.
      case "query":
        need("query", step.query);
        break;
      // TWO grants, never one. The channel is what it costs (Meta bills every WhatsApp, an email is
      // free); the recipient is who gets written to. Allowing one says nothing about the other.
      case "notify": {
        need("notify", step.channel);
        const to = step.to;
        if (to?.query?.trim() && to?.field?.trim()) {
          need("recipient_query", `${to.query.trim()}#${to.field.trim()}`);
        }
        break;
      }
      default:
        break;
    }
  }
  return out;
}
function grantsForStep(step) {
  return requiredGrants({ schema_version: SCHEMA_VERSION, triggers: [], steps: [step] }).map(
    (g3) => `${g3.kind} ${g3.value}`
  );
}
function httpPatternFor(url) {
  const raw = (url ?? "").trim();
  if (!raw) return "";
  const templated = raw.indexOf("{{");
  const stable = templated < 0 ? raw : raw.slice(0, templated);
  let parsed;
  try {
    parsed = new URL(stable);
  } catch {
    return "";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
  if (/[{}]/.test(parsed.host) || !parsed.host) return "";
  let path = parsed.pathname || "/";
  if (templated >= 0 && !path.endsWith("/")) path = path.slice(0, path.lastIndexOf("/") + 1);
  return `${parsed.origin}${path}*`;
}
var key = (g3) => `${g3.kind}\0${g3.value}`;
function missingGrants(doc, live) {
  const held = new Set(live.map(key));
  return requiredGrants(doc).filter((g3) => !held.has(key(g3)));
}
function mergeGrants(live, add, revoke) {
  const revoked = new Set(revoke.map(key));
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const g3 of [...live, ...add]) {
    const k2 = key(g3);
    if (revoked.has(k2) || seen.has(k2)) continue;
    seen.add(k2);
    out.push(withPin(g3, grantPin(g3)));
  }
  return out;
}
function canPinPayload(kind) {
  return kind === "command";
}
function grantPin(grant) {
  const raw = grant.payload;
  if (!canPinPayload(grant.kind) || !raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return { ...raw };
}
function withPin(grant, pin) {
  const kept = canPinPayload(grant.kind) ? pin : {};
  return Object.keys(kept).length ? { kind: grant.kind, value: grant.value, payload: kept } : { kind: grant.kind, value: grant.value };
}
function setGrantPin(live, target, pin) {
  const wanted = key(target);
  return live.map((g3) => withPin(g3, key(g3) === wanted ? pin : grantPin(g3)));
}
function readPinRows(rows) {
  const out = {};
  for (const [rawField, rawValue] of rows) {
    const field = rawField.trim();
    if (!field) continue;
    out[field] = pinValue(rawValue);
  }
  return out;
}
function pinRows(grant) {
  return Object.entries(grantPin(grant)).map(([field, value]) => [field, pinText(value)]);
}
function pinValue(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
    }
  }
  return scalar(text);
}
function pinText(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value);
}
function queryOutputs(step) {
  const base = [`steps.${step.id}.found`, `steps.${step.id}.count`];
  return step.result === "count" ? base : [...base, `steps.${step.id}.<field>`];
}
function approvalOutputs(step) {
  return ["decision", "decided_by", "decided_at", "comment"].map((f3) => `steps.${step.id}.${f3}`);
}

// ui/lib/trigger-catalog.ts
var TRIGGER_CATALOG = [
  { event: "sale.completed", labelKey: "ui.evSaleCompleted", module: "sales" },
  { event: "sale.voided", labelKey: "ui.evSaleVoided", module: "sales" },
  { event: "order.completed", labelKey: "ui.evOrderCompleted", module: "sales" },
  { event: "invoice.created", labelKey: "ui.evInvoiceCreated", module: "invoice" },
  { event: "payments.payment.completed", labelKey: "ui.evPaymentCompleted", module: "payments" },
  { event: "customer.created", labelKey: "ui.evCustomerCreated", module: "customers" },
  {
    event: "appointments.appointment.created",
    labelKey: "ui.evAppointmentCreated",
    module: "appointments"
  },
  {
    event: "appointments.appointment.cancelled",
    labelKey: "ui.evAppointmentCancelled",
    module: "appointments"
  },
  {
    event: "appointments.appointment.rescheduled",
    labelKey: "ui.evAppointmentRescheduled",
    module: "appointments"
  },
  {
    event: "appointments.appointment.completed",
    labelKey: "ui.evAppointmentCompleted",
    module: "appointments"
  },
  {
    event: "appointments.appointment.no_show",
    labelKey: "ui.evAppointmentNoShow",
    module: "appointments"
  },
  {
    event: "online_booking.booking.created",
    labelKey: "ui.evBookingCreated",
    module: "online_booking"
  },
  {
    event: "online_booking.booking.cancelled",
    labelKey: "ui.evBookingCancelled",
    module: "online_booking"
  },
  {
    event: "reservations.reservation.created",
    labelKey: "ui.evReservationCreated",
    module: "reservations"
  },
  { event: "tables.session.opened", labelKey: "ui.evTableOpened", module: "tables" },
  { event: "tables.session.closed", labelKey: "ui.evTableClosed", module: "tables" },
  { event: "kitchen.order.ready", labelKey: "ui.evKitchenOrderReady", module: "kitchen" },
  { event: "inventory.stock_changed", labelKey: "ui.evStockChanged", module: "inventory" },
  { event: "cash_register.session_closed", labelKey: "ui.evCashClosed", module: "cash_register" },
  { event: "cash_register.session_opened", labelKey: "ui.evCashOpened", module: "cash_register" },
  {
    event: "whatsapp_inbox.message.received",
    labelKey: "ui.evWhatsappReceived",
    module: "whatsapp_inbox"
  },
  { event: "tickets.ticket.created", labelKey: "ui.evTicketCreated", module: "tickets" },
  { event: "tasks.task.completed", labelKey: "ui.evTaskCompleted", module: "tasks" },
  { event: "staff.time_off.created", labelKey: "ui.evStaffTimeOff", module: "staff" },
  // Everything below is here because the phrase a composition would assemble is not the phrase a
  // shop owner says (`event-phrasing.ts`, layer 1). «se completa una venta» is grammatical and
  // nobody talks like that; «se cobra una venta» is what happens. The flagship of flows#41 —
  // `inventory.low_stock_crossed` — is the first of them.
  { event: "inventory.low_stock_crossed", labelKey: "ui.evLowStockCrossed", module: "inventory" },
  {
    event: "inventory.product.uncategorized",
    labelKey: "ui.evProductUncategorized",
    module: "inventory"
  },
  { event: "cash_register.movement_added", labelKey: "ui.evCashMovement", module: "cash_register" },
  {
    event: "cash_register.settings_updated",
    labelKey: "ui.evCashSettings",
    module: "cash_register"
  },
  { event: "kitchen.order.created", labelKey: "ui.evKitchenOrderCreated", module: "kitchen" },
  { event: "kitchen.order.fired", labelKey: "ui.evOrderFired", module: "kitchen" },
  { event: "order.fired", labelKey: "ui.evOrderFired", module: "sales" },
  { event: "staff.member.deactivated", labelKey: "ui.evStaffDeactivated", module: "staff" },
  { event: "kitchen.order.recalled", labelKey: "ui.evKitchenOrderRecalled", module: "kitchen" },
  { event: "kitchen.item.recalled", labelKey: "ui.evKitchenItemRecalled", module: "kitchen" },
  { event: "printing.print.due", labelKey: "ui.evPrintDue", module: "printing" },
  // The two the hub's own runtime puts through the outbox: no module brings them, so `module` is
  // the namespace they travel under. The «it comes with the X module» hint they would feed is only
  // ever rendered for an event this hub does NOT have, which cannot happen for a core one.
  { event: "flow.reminder.due", labelKey: "ui.evReminderDue", module: "flow" },
  { event: "flow.release_revoked", labelKey: "ui.evFlowReleaseRevoked", module: "flow" },
  { event: "host.notify", labelKey: "ui.evHostNotify", module: "host" },
  { event: "host.print", labelKey: "ui.evHostPrint", module: "host" },
  {
    event: "reservations.reservations.unconfirmed_released",
    labelKey: "ui.evUnconfirmedReleased",
    module: "reservations"
  },
  { event: "taxes.rules.bulk_create.report", labelKey: "ui.evTaxRulesBulk", module: "taxes" },
  {
    event: "sales.sale.created_from_appointment",
    labelKey: "ui.evSaleFromAppointment",
    module: "sales"
  },
  { event: "staff.member.created", labelKey: "ui.evStaffMemberCreated", module: "staff" },
  {
    event: "verifactu.record.transmitted",
    labelKey: "ui.evRecordTransmitted",
    module: "verifactu"
  },
  { event: "verifactu.record.rejected", labelKey: "ui.evRecordRejected", module: "verifactu" },
  {
    event: "verifactu.record.accepted_with_errors",
    labelKey: "ui.evRecordAcceptedWithErrors",
    module: "verifactu"
  },
  {
    event: "invoice_series.series.default_changed",
    labelKey: "ui.evSeriesDefaultChanged",
    module: "invoice_series"
  },
  { event: "modifiers.link.attached", labelKey: "ui.evModifierAttached", module: "modifiers" },
  { event: "modifiers.link.detached", labelKey: "ui.evModifierDetached", module: "modifiers" },
  { event: "tables.session.merged", labelKey: "ui.evTablesMerged", module: "tables" },
  { event: "tables.session.split", labelKey: "ui.evTablesSplit", module: "tables" },
  { event: "tables.session.transferred", labelKey: "ui.evTableTransferred", module: "tables" },
  {
    event: "online_booking.booking.no_show",
    labelKey: "ui.evOnlineNoShow",
    module: "online_booking"
  },
  { event: "customer.consent_granted", labelKey: "ui.evConsentGranted", module: "customers" },
  { event: "customer.consent_withdrawn", labelKey: "ui.evConsentWithdrawn", module: "customers" }
];
function catalogEntry(event) {
  return TRIGGER_CATALOG.find((e4) => e4.event === event);
}

// ui/lib/event-phrasing.ts
var EVENT_FAMILIES = {
  appointments: "ui.evfAppointments",
  cart_checkout: "ui.evfCartCheckout",
  cash_register: "ui.evfCashRegister",
  combos: "ui.evfCombos",
  customer: "ui.evfCustomers",
  customers: "ui.evfCustomers",
  flow: "ui.evfFlows",
  flows: "ui.evfFlows",
  host: "ui.evfHost",
  inventory: "ui.evfInventory",
  invoice: "ui.evfInvoice",
  invoice_series: "ui.evfInvoiceSeries",
  kitchen: "ui.evfKitchen",
  modifiers: "ui.evfModifiers",
  online_booking: "ui.evfOnlineBooking",
  order: "ui.evfSales",
  payment_gateways: "ui.evfPaymentGateways",
  payments: "ui.evfPayments",
  pricing: "ui.evfPricing",
  printing: "ui.evfPrinting",
  reservations: "ui.evfReservations",
  sale: "ui.evfSales",
  sales: "ui.evfSales",
  schedules: "ui.evfSchedules",
  services: "ui.evfServices",
  staff: "ui.evfStaff",
  tables: "ui.evfTables",
  tasks: "ui.evfTasks",
  taxes: "ui.evfTaxes",
  tickets: "ui.evfTickets",
  verifactu: "ui.evfVerifactu",
  whatsapp_inbox: "ui.evfWhatsapp"
};
var EVENT_SUBJECTS = {
  aeat: { key: "ui.evsAeat" },
  alias: { key: "ui.evsTaxAlias" },
  appointment: { key: "ui.evsAppointment" },
  blocked_date: { key: "ui.evsBlockedDate" },
  blocked_time: { key: "ui.evsBlockedTime" },
  booking: { key: "ui.evsBooking" },
  booking_request: { key: "ui.evsBookingRequest" },
  business_hours: { key: "ui.evsBusinessHours", plural: true },
  cart: { key: "ui.evsCart" },
  carts: { key: "ui.evsCarts", plural: true },
  chain: { key: "ui.evsChain" },
  checkout: { key: "ui.evsCheckout" },
  choice_group: { key: "ui.evsChoiceGroup" },
  choice_option: { key: "ui.evsChoiceOption" },
  combo: { key: "ui.evsCombo" },
  comment: { key: "ui.evsComment" },
  config: { key: "ui.evsConfig" },
  contingency: { key: "ui.evsContingency" },
  conversation: { key: "ui.evsConversation" },
  customer: { key: "ui.evsCustomer" },
  diagnostic: { key: "ui.evsDiagnostic" },
  draft: { key: "ui.evsDraft" },
  gateway: { key: "ui.evsGateway" },
  group: { key: "ui.evsModifierGroup" },
  invoice: { key: "ui.evsInvoice" },
  item: { key: "ui.evsLine" },
  member: { key: "ui.evsStaffMember" },
  message: { key: "ui.evsMessage" },
  number: { key: "ui.evsInvoiceNumber" },
  option: { key: "ui.evsModifier" },
  order: { key: "ui.evsOrder" },
  override: { key: "ui.evsScheduleOverride" },
  package: { key: "ui.evsPackage" },
  payment: { key: "ui.evsPayment" },
  price_item: { key: "ui.evsPrice" },
  price_list: { key: "ui.evsPriceList" },
  product: { key: "ui.evsProduct" },
  project: { key: "ui.evsProject" },
  record: { key: "ui.evsRecord" },
  recurring: { key: "ui.evsRecurring" },
  reminder: { key: "ui.evsReminder" },
  request: { key: "ui.evsRequest" },
  reservation: { key: "ui.evsReservation" },
  role: { key: "ui.evsRole" },
  routing: { key: "ui.evsRouting" },
  rule: { key: "ui.evsRule" },
  sale: { key: "ui.evsSale" },
  schedule: { key: "ui.evsSchedule" },
  series: { key: "ui.evsSeries" },
  service: { key: "ui.evsService" },
  session: { key: "ui.evsOpenTable" },
  settings: { key: "ui.evsSettings", plural: true },
  sla: { key: "ui.evsSla" },
  slot: { key: "ui.evsSlot" },
  special_day: { key: "ui.evsSpecialDay" },
  station: { key: "ui.evsStation" },
  table: { key: "ui.evsTable" },
  task: { key: "ui.evsTask" },
  template: { key: "ui.evsTemplate" },
  ticket: { key: "ui.evsTicket" },
  time_off: { key: "ui.evsTimeOff" },
  timeslot: { key: "ui.evsTimeslot" },
  transaction: { key: "ui.evsTransaction" },
  waitlist: { key: "ui.evsWaitlist" },
  zone: { key: "ui.evsZone" },
  // Same word, different business object.
  "cart_checkout.item": { key: "ui.evsCartLine" },
  "cart_checkout.order": { key: "ui.evsOnlineOrder" },
  "taxes.category": { key: "ui.evsTaxCategory" }
};
var EVENT_ACTIONS = {
  abandoned: { key: "ui.evaAbandoned" },
  added: { key: "ui.evaAdded" },
  allocated: { key: "ui.evaAllocated" },
  anonymized: { key: "ui.evaAnonymized" },
  approved: { key: "ui.evaApproved" },
  assigned: { key: "ui.evaAssigned" },
  breached: { key: "ui.evaBreached" },
  bumped: { key: "ui.evaBumped" },
  cancelled: { key: "ui.evaCancelled" },
  categorized: { key: "ui.evaCategorized" },
  changed: { key: "ui.evaChanged" },
  cleared: { key: "ui.evaCleared" },
  closed: { key: "ui.evaClosed" },
  completed: { key: "ui.evaCompleted" },
  confirmed: { key: "ui.evaConfirmed" },
  created: { key: "ui.evaCreated" },
  deactivated: { key: "ui.evaDeactivated" },
  deleted: { key: "ui.evaDeleted" },
  due: { key: "ui.evaDue" },
  expired: { key: "ui.evaExpired", pluralKey: "ui.evaExpiredPl" },
  failed: { key: "ui.evaFailed" },
  fired: { key: "ui.evaFired" },
  fulfilled: { key: "ui.evaFulfilled" },
  granted: { key: "ui.evaGranted" },
  held: { key: "ui.evaHeld" },
  hold_released: { key: "ui.evaHoldReleased" },
  initiated: { key: "ui.evaInitiated" },
  opened: { key: "ui.evaOpened" },
  paid: { key: "ui.evaPaid" },
  parked: { key: "ui.evaParked" },
  processed: { key: "ui.evaProcessed" },
  proposed: { key: "ui.evaProposed" },
  queried: { key: "ui.evaQueried" },
  received: { key: "ui.evaReceived" },
  rectified: { key: "ui.evaRectified" },
  recovered: { key: "ui.evaRecovered" },
  redeemed: { key: "ui.evaRedeemed" },
  refunded: { key: "ui.evaRefunded" },
  rejected: { key: "ui.evaRejected" },
  removed: { key: "ui.evaRemoved" },
  reopened: { key: "ui.evaReopened" },
  rescheduled: { key: "ui.evaRescheduled" },
  resolved: { key: "ui.evaResolved" },
  restored: { key: "ui.evaRestored" },
  retried: { key: "ui.evaRetried" },
  run: { key: "ui.evaRun" },
  saved: { key: "ui.evaSaved", pluralKey: "ui.evaSavedPl" },
  sent: { key: "ui.evaSent" },
  served: { key: "ui.evaServed" },
  settled: { key: "ui.evaSettled" },
  started: { key: "ui.evaStarted" },
  status_changed: { key: "ui.evaStatusChanged" },
  succeeded: { key: "ui.evaSucceeded" },
  terminated: { key: "ui.evaTerminated" },
  transferred: { key: "ui.evaTransferred" },
  uncategorized: { key: "ui.evaUncategorized" },
  updated: { key: "ui.evaUpdated", pluralKey: "ui.evaUpdatedPl" },
  validated: { key: "ui.evaValidated" }
};
var PHRASE_TEMPLATE = "ui.evtPhrase";
function humanizeToken(token) {
  const words = token.replace(/[._]+/g, " ").trim();
  return words ? words[0].toUpperCase() + words.slice(1) : "";
}
function splitEventName(event) {
  const parts = event.split(".").filter(Boolean);
  if (parts.length < 2) return null;
  if (parts.length === 2) return { family: parts[0], subject: parts[0], action: parts[1] };
  return { family: parts[0], subject: parts[1], action: parts.slice(2).join(".") };
}
function subjectOf(parts) {
  return EVENT_SUBJECTS[`${parts.family}.${parts.subject}`] ?? EVENT_SUBJECTS[parts.subject];
}
function eventFamily(event, t3) {
  const parts = splitEventName(event);
  if (!parts) return "";
  const key2 = EVENT_FAMILIES[parts.family];
  return key2 ? t3(key2) : humanizeToken(parts.family);
}
function eventPhrase(event, t3) {
  const curated = catalogEntry(event);
  if (curated) return t3(curated.labelKey);
  const parts = splitEventName(event);
  if (!parts) return event ? humanizeToken(event) : "";
  const subject = subjectOf(parts);
  const action = EVENT_ACTIONS[parts.action];
  if (subject && action) {
    const verbKey = subject.plural ? action.pluralKey ?? action.key : action.key;
    return t3(PHRASE_TEMPLATE, { subject: t3(subject.key), action: t3(verbKey) });
  }
  const tail = `${parts.subject} ${parts.action}`;
  return humanizeToken(tail).toLowerCase();
}

// ui/lib/event-catalog.ts
var BAD_CATALOG = "flows.bad_catalog";
function toOption(row) {
  const event = typeof row?.name === "string" ? row.name.trim() : "";
  if (!event) return null;
  const entry = catalogEntry(event);
  return {
    event,
    ...entry ? { labelKey: entry.labelKey } : {},
    declaredBy: Array.isArray(row.declared_by) ? row.declared_by : [],
    ...typeof row.last_seen_at === "string" ? { lastSeenAt: row.last_seen_at } : {}
  };
}
async function loadEventCatalog(client) {
  const list = client?.events?.list;
  if (typeof list !== "function") return { status: "unsupported" };
  let rows;
  try {
    rows = await list.call(client.events);
  } catch (e4) {
    const code = e4?.code;
    return { status: "failed", code: typeof code === "string" && code ? code : BAD_CATALOG };
  }
  if (!Array.isArray(rows)) return { status: "failed", code: BAD_CATALOG };
  const options = rows.map((row) => toOption(row)).filter((o6) => o6 !== null);
  return options.length ? { status: "ready", options } : { status: "empty" };
}
function groupByFamily(options, t3) {
  const groups = [];
  const byFamily = /* @__PURE__ */ new Map();
  for (const option2 of options) {
    const family = eventFamily(option2.event, t3);
    let group = byFamily.get(family);
    if (!group) {
      group = { family, options: [] };
      byFamily.set(family, group);
      groups.push(group);
    }
    group.options.push(option2);
  }
  return groups;
}

// ui/lib/simulate.ts
var REDACTED = "\0redacted\0";
var REDACTED_MARK = "\u2022\u2022\u2022\u2022";
var UNKNOWN = "\0unknown\0";
var UNKNOWN_MARK = "\u2026";
function inputFromShape(shape) {
  const input = {};
  const redactedPaths = [];
  if (!shape || !shape.samples || !Array.isArray(shape.fields)) {
    return { input, redactedPaths, hasRealData: false };
  }
  for (const field of shape.fields) {
    if (!field?.path) continue;
    if (field.redacted) {
      redactedPaths.push(field.path);
      place(input, field.path, REDACTED);
      continue;
    }
    if (field.type === "array") {
      place(input, field.path, new Array(field.items ?? 0).fill(null));
      continue;
    }
    if (field.type === "object") continue;
    place(input, field.path, field.sample === void 0 ? null : field.sample);
  }
  return { input, redactedPaths, hasRealData: true };
}
function place(root, path, value) {
  const parts = path.split(".");
  let cursor = root;
  for (let i4 = 0; i4 < parts.length - 1; i4 += 1) {
    const key2 = parts[i4];
    if (typeof cursor[key2] !== "object" || cursor[key2] === null || Array.isArray(cursor[key2])) {
      cursor[key2] = {};
    }
    cursor = cursor[key2];
  }
  cursor[parts[parts.length - 1]] = value;
}
function resolvePath(path, scope) {
  let cursor = scope;
  for (const segment of path.split(".")) {
    if (typeof cursor !== "object" || cursor === null) return void 0;
    cursor = cursor[segment];
    if (cursor === void 0) return void 0;
  }
  return cursor;
}
var PATH_ROOTS2 = ["input", "steps", "event", "secret"];
function isPath2(s4) {
  const root = s4.split(".")[0];
  return PATH_ROOTS2.includes(root) && s4.length > root.length + 1 && s4[root.length] === ".";
}
function stringify(value) {
  if (value === null || value === void 0) return "";
  if (value === REDACTED) return REDACTED_MARK;
  if (value === UNKNOWN) return UNKNOWN_MARK;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return String(value);
  }
}
function renderTemplate(text, scope) {
  let out = "";
  let rest = text;
  for (; ; ) {
    const start = rest.indexOf("{{");
    if (start < 0) break;
    out += rest.slice(0, start);
    const after = rest.slice(start + 2);
    const end = after.indexOf("}}");
    if (end < 0) return out + rest.slice(start);
    out += stringify(lookup(after.slice(0, end).trim(), scope));
    rest = after.slice(end + 2);
  }
  return out + rest;
}
function lookup(path, scope) {
  if (path.startsWith("secret.")) return REDACTED;
  if (path.startsWith("steps.")) {
    const found2 = resolvePath(path, scope);
    return found2 === void 0 ? UNKNOWN : found2;
  }
  const found = resolvePath(path, scope);
  return found === void 0 ? null : found;
}
function resolveExpr(expr, scope) {
  if (typeof expr === "string") {
    if (isPath2(expr)) return lookup(expr, scope);
    if (expr.includes("{{")) return renderTemplate(expr, scope);
    return expr;
  }
  if (Array.isArray(expr)) return expr.map((v2) => resolveExpr(v2, scope));
  if (typeof expr === "object" && expr !== null) {
    return Object.fromEntries(
      Object.entries(expr).map(([k2, v2]) => [k2, resolveExpr(v2, scope)])
    );
  }
  return expr;
}
function asNumber(v2) {
  if (typeof v2 === "number") return Number.isFinite(v2) ? v2 : null;
  if (typeof v2 === "string") {
    const text = v2.trim();
    if (text === "") return null;
    const n5 = Number(text);
    return Number.isFinite(n5) ? n5 : null;
  }
  return null;
}
function asText(v2) {
  if (typeof v2 === "string") return v2;
  if (typeof v2 === "number" || typeof v2 === "boolean") return String(v2);
  return null;
}
function jsonEq(a3, b3) {
  if (a3 === b3) return true;
  if (a3 === null || b3 === null || a3 === void 0 || b3 === void 0) return false;
  const [x2, y3] = [asNumber(a3), asNumber(b3)];
  if (x2 !== null && y3 !== null) return x2 === y3;
  const [s4, t3] = [asText(a3), asText(b3)];
  return s4 !== null && t3 !== null && s4 === t3;
}
function compare(a3, b3) {
  if (a3 === null || b3 === null || a3 === void 0 || b3 === void 0) return null;
  const [x2, y3] = [asNumber(a3), asNumber(b3)];
  if (x2 !== null && y3 !== null) return x2 === y3 ? 0 : x2 < y3 ? -1 : 1;
  const [s4, t3] = [asText(a3), asText(b3)];
  if (s4 === null || t3 === null) return null;
  return s4 === t3 ? 0 : s4 < t3 ? -1 : 1;
}
function evalOp(op, actual, expected) {
  switch (op) {
    case "eq":
      return jsonEq(actual, expected);
    case "neq":
      return !jsonEq(actual, expected);
    case "exists": {
      const present = actual !== null && actual !== void 0;
      return (typeof expected === "boolean" ? expected : true) === present;
    }
    case "in":
      return Array.isArray(expected) && expected.some((item) => jsonEq(actual, item));
    case "contains":
      if (Array.isArray(actual)) return actual.some((item) => jsonEq(item, expected));
      if (typeof actual === "string") {
        const needle = asText(expected);
        return needle !== null && actual.includes(needle);
      }
      return false;
    default: {
      const ordering = compare(actual, expected);
      if (ordering === null) return false;
      if (op === "gt") return ordering > 0;
      if (op === "gte") return ordering >= 0;
      if (op === "lt") return ordering < 0;
      return ordering <= 0;
    }
  }
}
function conditionResult(when, scope) {
  const failed = [];
  let uncertain = false;
  for (const [path, ops] of Object.entries(when ?? {})) {
    const actual = lookup(path, scope);
    for (const [op, expected] of Object.entries(ops ?? {})) {
      const operator = op;
      if (actual === REDACTED && operator !== "exists") {
        uncertain = true;
        continue;
      }
      if (actual === UNKNOWN) {
        uncertain = true;
        continue;
      }
      if (!evalOp(operator, actual, expected)) failed.push({ path, op: operator, expected });
    }
  }
  return { matched: failed.length === 0 && !uncertain, failed, uncertain };
}
function pathsIn(expr, out = []) {
  if (typeof expr === "string") {
    if (isPath2(expr)) {
      out.push(expr);
      return out;
    }
    let rest = expr;
    for (; ; ) {
      const start = rest.indexOf("{{");
      if (start < 0) break;
      const after = rest.slice(start + 2);
      const end = after.indexOf("}}");
      if (end < 0) break;
      out.push(after.slice(0, end).trim());
      rest = after.slice(end + 2);
    }
    return out;
  }
  if (Array.isArray(expr)) {
    for (const item of expr) pathsIn(item, out);
  } else if (typeof expr === "object" && expr !== null) {
    for (const value of Object.values(expr)) pathsIn(value, out);
  }
  return out;
}
function stepValues(step, scope) {
  const out = [];
  const add = (label, expr) => {
    const text = stringify(resolveExpr(expr, scope));
    let blank = false;
    let redacted = false;
    let unknown = false;
    for (const path of pathsIn(expr)) {
      const value = lookup(path, scope);
      if (value === REDACTED) redacted = true;
      else if (value === UNKNOWN) unknown = true;
      else if (value === null || value === void 0) blank = true;
    }
    out.push({ label, text, blank, redacted, ...unknown ? { unknown } : {} });
  };
  if (step.kind === "command" || step.kind === "query") {
    for (const [key2, value] of Object.entries(step.params ?? {})) add(key2, value);
  } else if (step.kind === "http") {
    add("url", step.url ?? "");
    for (const [key2, value] of Object.entries(step.headers ?? {})) add(key2, value);
    if (step.body !== void 0 && step.body !== "") add("body", step.body);
  } else if (step.kind === "ai") {
    add("prompt", step.prompt ?? "");
  } else if (step.kind === "notify") {
    for (const [key2, value] of Object.entries(step.vars ?? {})) add(key2, value);
  } else if (step.kind === "approval") {
    add("title", step.title ?? "");
    if (typeof step.summary === "string" && step.summary !== "") add("summary", step.summary);
  }
  return out;
}
function simulate(doc, input) {
  const scope = { input, event: input, steps: {} };
  const trigger = doc.triggers?.[0];
  const triggerCondition = trigger?.kind === "event" && trigger.filter ? conditionResult(trigger.filter, scope) : void 0;
  const triggerMatched = triggerCondition ? triggerCondition.matched : true;
  const steps = [];
  let stopped = !triggerMatched;
  let stoppedAt;
  for (const step of doc.steps ?? []) {
    if (stopped) {
      steps.push({ id: step.id, kind: step.kind, outcome: "not-reached", values: [] });
      continue;
    }
    if (step.kind === "condition") {
      const condition = conditionResult(step.when, scope);
      const passes = condition.matched || condition.uncertain;
      steps.push({
        id: step.id,
        kind: step.kind,
        outcome: passes ? "would-run" : "stops-here",
        values: [],
        condition
      });
      if (!passes) {
        stopped = true;
        stoppedAt = step.id;
      }
      continue;
    }
    steps.push({
      id: step.id,
      kind: step.kind,
      outcome: "would-run",
      values: stepValues(step, scope),
      ...step.kind === "approval" ? { pauses: true } : {}
    });
  }
  return {
    triggerMatched,
    ...triggerCondition ? { triggerCondition } : {},
    steps,
    ...stoppedAt ? { stoppedAt } : {},
    blanks: steps.reduce((n5, s4) => n5 + s4.values.filter((v2) => v2.blank).length, 0),
    failed: false
  };
}

// ui/lib/run-trouble.ts
var TABLE = {
  "flow.grant_denied": "permission",
  "flow.grant_kind_not_available": "permission",
  "flow.unknown_grant_kind": "permission",
  "flow.invalid_notify_grant": "permission",
  "flow.invalid_recipient_grant": "permission",
  "flow.internal_command": "permission",
  "flow.secret_not_found": "secret",
  "flow.secret_not_available": "secret",
  "flow.secret_unreadable": "secret",
  "flow.secrets_key_missing": "secret",
  "flow.invalid_secret_name": "secret",
  "flow.recipient_not_found": "recipient",
  "flow.recipient_ambiguous": "recipient",
  "flow.recipient_invalid": "recipient",
  "flow.http_url_invalid": "reach",
  "flow.invalid_http_pattern": "reach",
  "flow.invalid_cron": "setup",
  "flow.invalid_at": "setup",
  "flow.invalid_definition": "setup",
  "flow.unknown_operator": "setup",
  "flow.unknown_schema_version": "setup",
  "flow.step_kind_not_available": "setup",
  "flow.flow_deleted": "gone",
  "flow.definition_gone": "gone",
  "flow.not_found": "gone",
  "flow.io_step_gone": "gone",
  "flow.step_output_lost": "gone",
  "flow.agent_step_not_in_flight": "gone",
  "flow.approval_expired": "approval",
  "flow.approval_not_found": "approval",
  "flow.approval_already_decided": "approval"
};
var KERNEL_ERRORS = Object.keys(TABLE);
function classify(lastError) {
  const technical = (lastError ?? "").trim();
  if (!technical) return { kind: "none", messageKey: "", actionKey: "", technical: "" };
  const code = KERNEL_ERRORS.slice().sort((a3, b3) => b3.length - a3.length).find((candidate) => technical.includes(candidate));
  if (!code) return { kind: "unknown", messageKey: "", actionKey: "", technical };
  const kind = TABLE[code];
  const suffix = kind.charAt(0).toUpperCase() + kind.slice(1);
  return {
    kind,
    messageKey: `ui.trouble${suffix}`,
    actionKey: `ui.troubleDo${suffix}`,
    technical
  };
}
function needsAttention(run2) {
  return run2.status === "failed";
}

// ui/lib/hub-flows.ts
var CAPABILITY_DENIED = "capability_denied";
var APPROVAL_EXPIRED = "flow.approval_expired";
var APPROVAL_ALREADY_DECIDED = "flow.approval_already_decided";
var APPROVAL_NOT_YOURS = "flow.approval_not_yours";
var EVENT_APPROVAL_CREATED = "flow.approval.created";
var EVENT_APPROVAL_EXPIRED = "flow.approval.expired";
function hasFlows(candidate) {
  const c4 = candidate;
  return !!c4 && typeof c4 === "object" && !!c4.flows && !!c4.events;
}
function resolveClient(host, global) {
  if (hasFlows(host?.client)) return host.client;
  const scoped = typeof global?.forModule === "function" ? global.forModule("flows") : void 0;
  return hasFlows(scoped) ? scoped : null;
}
function errorCode(e4) {
  const code = e4?.code;
  return typeof code === "string" ? code : "";
}

// ui/components/erp-flows-editor/erp-flows-editor.ts
var TABS = ["editor", "test", "permissions", "history"];
function stepSeconds(step) {
  const from = Date.parse(String(step.started_at ?? ""));
  const to = Date.parse(String(step.finished_at ?? ""));
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return void 0;
  return Math.round((to - from) / 1e3);
}
function guardRows(when) {
  const rows = [];
  for (const [path, ops] of Object.entries(when ?? {})) {
    for (const [op, value] of Object.entries(ops ?? {})) {
      rows.push({
        path,
        op,
        value: Array.isArray(value) ? value.join(", ") : String(value ?? "")
      });
    }
  }
  return rows;
}
var BASE_ROLES = ["admin", "manager", "employee"];
var grantKey = (g3) => `${g3.kind} ${g3.value}`;
function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}
function option(value, label, current) {
  return b2`<option value=${value} ?selected=${value === current}>${label}</option>`;
}
function eventOption(value, label, current) {
  return b2`<option value=${value} title=${value} ?selected=${value === current}>${label}</option>`;
}
function rowsToWhen(rows) {
  const out = {};
  for (const row of rows) {
    if (!row.path) continue;
    const value = row.op === "in" ? row.value.split(",").map((v2) => v2.trim()).filter(Boolean) : row.op === "exists" ? row.value !== "false" : partsToValue([{ kind: "text", text: row.value }]);
    out[row.path] = { ...out[row.path] ?? {}, [row.op]: value };
  }
  return out;
}
var ErpFlowsEditor = class extends i3 {
  constructor() {
    super(...arguments);
    this.client = null;
    this.flow = null;
    this.t = (k2) => k2;
    this.draft = null;
    this.document = emptyDoc();
    this.name = "";
    this.enabled = false;
    this.tested = false;
    this.enableWarning = "";
    this.tab = "editor";
    this.openStep = null;
    this.grants = [];
    this.limitsOpen = [];
    this.pinDrafts = {};
    this.savingLimits = "";
    this.runs = [];
    this.runSteps = {};
    this.shape = null;
    this.eventCatalog = { status: "loading" };
    /** One round trip per editor, not one per re-render of a panel that toggles open and shut. */
    this.catalogAsked = false;
    this.secrets = [];
    this.secretName = "";
    this.secretValue = "";
    this.error = "";
    this.notice = "";
    this.saving = false;
    this.pickerOpen = false;
    this.pickerFor = null;
    this.pickerRoot = "input";
    /** The words a pill shows: `input.customer.name` → «Customer › Name». */
    this.fieldLabel = (path) => humaniseField(path.replace(/^(input|event|steps)\./, ""));
  }
  static {
    this.styles = i`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
    }
    .head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      /* Both bars refuse to shrink. They are flex children of a full-height column whose body
         takes the rest, so without this the tab strip gets squeezed to 18px of its 44 the moment
         the header wraps to two lines — which is what a 390px screen does, and what adding the
         «Probar» button made happen sooner. */
      flex: 0 0 auto;
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
    }
    .head .name {
      flex: 1 1 12rem;
      min-width: 8rem;
      font: inherit;
      font-size: 1.05rem;
      font-weight: 600;
      border: 0;
      border-bottom: 1px dashed transparent;
      background: transparent;
      color: inherit;
      padding: 0.35rem 0;
    }
    .head .name:hover,
    .head .name:focus {
      border-bottom-color: var(--ok-border, #d7d5cc);
      outline: none;
    }
    .body {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 0.75rem;
    }
    /* ── The spine ───────────────────────────────────────────────────────────────────────────
       One column. The max-width keeps a card readable on a 1440px screen; the column itself is
       fluid, which is what survives the assistant taking a third of the width. */
    .spine {
      max-width: 44rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
    }
    .node {
      position: relative;
      padding-left: 1.6rem;
    }
    /* The connector, drawn as ok-timeline draws it: an absolute rule behind every node but the
       last, punched through by the dot. */
    .node::before {
      content: '';
      position: absolute;
      left: 0.42rem;
      top: 0;
      bottom: -0.1rem;
      width: 2px;
      background: var(--ok-border-soft, rgba(0, 0, 0, 0.12));
    }
    .node:last-child::before {
      bottom: auto;
      height: 1.1rem;
    }
    .node::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0.85rem;
      width: 0.9rem;
      height: 0.9rem;
      border-radius: 50%;
      background: var(--ok-border, #d7d5cc);
      box-shadow: 0 0 0 3px var(--ok-bg, var(--ion-background-color, #fff));
    }
    .node.trigger::after {
      background: var(--ok-primary, var(--ion-color-primary, #3880ff));
    }
    .card {
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      margin: 0.35rem 0;
      overflow: hidden;
    }
    .card > .row {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 0.7rem;
      width: 100%;
      box-sizing: border-box;
    }
    .row .grow {
      flex: 1 1 auto;
      min-width: 0;
      text-align: left;
    }
    .eyebrow {
      display: block;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
    }
    .title {
      display: block;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .open,
    .icon-btn {
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      min-width: 2.6rem;
      min-height: 2.6rem;
      border-radius: var(--ok-radius-sm, 10px);
    }
    .icon-btn:hover {
      background: var(--ok-hover, rgba(0, 0, 0, 0.06));
    }
    .open {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex: 1 1 auto;
      min-width: 0;
      text-align: left;
      padding: 0.6rem 0.7rem;
    }
    .panel {
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      padding: 0.7rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.02));
    }
    /* ── A guard is a chip that NARROWS the spine, not a card and never a diamond ─────────── */
    .guard {
      margin: 0.15rem 0;
    }
    .guard .chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      width: calc(100% - 1.5rem);
      margin-left: 0.75rem;
      box-sizing: border-box;
      background: var(--ok-surface-2, rgba(0, 0, 0, 0.04));
      border: 1px dashed var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0.35rem 0.5rem;
    }
    .guard .panel {
      border-radius: var(--ok-radius-sm, 10px);
      border: 1px solid var(--ok-border, #d7d5cc);
      margin-top: 0.35rem;
    }
    /* ── A wait is a label ON the line ────────────────────────────────────────────────────── */
    .segment .chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.1rem 0;
      color: var(--ok-muted, #6b6a63);
      font-size: 0.85rem;
      font-style: italic;
    }
    .segment .panel {
      border-radius: var(--ok-radius-sm, 10px);
      border: 1px solid var(--ok-border, #d7d5cc);
      margin: 0.3rem 0;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .field > label {
      font-size: 0.78rem;
      color: var(--ok-muted, #6b6a63);
    }
    .field input,
    .field select {
      font: inherit;
      padding: 0.55rem 0.6rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      color: inherit;
      min-height: 2.6rem;
      box-sizing: border-box;
      width: 100%;
    }
    .hint {
      font-size: 0.78rem;
      color: var(--ok-muted, #6b6a63);
    }
    .guard-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.4rem;
      align-items: end;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.06));
    }
    @media (min-width: 560px) {
      .guard-row {
        grid-template-columns: 1.2fr 0.9fr 1.2fr auto;
      }
    }
    .param-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.4rem;
      align-items: end;
    }
    @media (min-width: 560px) {
      .param-row {
        grid-template-columns: 0.7fr 1.6fr auto;
      }
    }
    /* A composed value and, inside an http step, the secret picker beside it. The select is a
       sibling and not a child of erp-flows-value on purpose: a control inside another element's
       shadow root cannot be reached from here, and this one has to drive the box next to it. */
    .value-row {
      display: flex;
      align-items: flex-end;
      /* Wraps on a phone: without it the secret picker and the box's own «insert a field» button
         end up on the same line and overlap, which is what a 390px screen showed. */
      flex-wrap: wrap;
      gap: 0.4rem;
      min-width: 0;
    }
    .value-row erp-flows-value {
      /* A 12rem basis, not auto: with auto the box shrinks to its longest unbreakable word while
         the select keeps its own width, and the address ends up three characters wide next to a
         full-size dropdown. */
      flex: 1 1 12rem;
      min-width: 0;
    }
    .value-row select {
      font: inherit;
      font-size: 0.8rem;
      padding: 0 0.5rem;
      min-height: 2.4rem;
      max-width: 100%;
      border: 1px dashed var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      background: transparent;
      color: var(--ok-muted, #6b6a63);
    }
    /* The method sits BESIDE the address only when there is room for both. Below that it stacks —
       and it has to be a class, because an inline grid-template-columns would win over the media
       query at every width and crush the address on a phone. */
    .method-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.4rem;
      align-items: end;
    }
    @media (min-width: 560px) {
      .method-row {
        grid-template-columns: auto 1fr;
      }
    }
    /* ── The preview ──────────────────────────────────────────────────────────────────────── */
    .preview {
      max-width: 44rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .pstep {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-left: 3px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      padding: 0.6rem 0.7rem;
    }
    .pstep[data-outcome='would-run'] {
      border-left-color: var(--ok-success, #2dd36f);
    }
    /* A guard that stops the run is the flow WORKING, so it is not painted as an error. */
    .pstep[data-outcome='stops-here'],
    .pstep[data-outcome='trigger-blocked'] {
      border-left-color: var(--ok-warning, #ffc409);
    }
    .pstep[data-outcome='not-reached'] {
      opacity: 0.6;
    }
    .pvalue {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      font-size: 0.88rem;
      padding: 0.15rem 0;
    }
    .pkey {
      color: var(--ok-muted, #6b6a63);
      min-width: 6rem;
    }
    .pval {
      overflow-wrap: anywhere;
    }
    .pvalue[data-blank='true'] {
      background: var(--ok-danger-soft, rgba(235, 68, 90, 0.08));
      border-radius: var(--ok-radius-sm, 10px);
      padding: 0.15rem 0.35rem;
    }
    .bad {
      color: var(--ok-danger, var(--ion-color-danger, #eb445a));
      font-size: 0.85rem;
    }
    .verdict {
      font-size: 0.85rem;
    }
    .clauses {
      margin: 0.1rem 0 0;
      padding-left: 1rem;
      font-size: 0.85rem;
      color: var(--ok-muted, #6b6a63);
    }
    .secrets {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding-top: 0.6rem;
      margin-top: 0.3rem;
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
    }
    .adders {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin: 0.6rem 0 0 1.6rem;
    }
    .adders button {
      font: inherit;
      font-size: 0.85rem;
      cursor: pointer;
      background: var(--ok-surface, #fff);
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0 0.9rem;
      min-height: 2.5rem;
      color: inherit;
    }
    .tabs {
      display: flex;
      gap: 0.25rem;
      flex: 0 0 auto;
      padding: 0 0.75rem;
      border-bottom: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      overflow-x: auto;
    }
    .tabs button {
      font: inherit;
      background: transparent;
      border: 0;
      border-bottom: 2px solid transparent;
      color: var(--ok-muted, #6b6a63);
      cursor: pointer;
      padding: 0.6rem 0.7rem;
      min-height: 2.75rem;
      white-space: nowrap;
    }
    .tabs button[aria-selected='true'] {
      color: var(--ok-text, inherit);
      border-bottom-color: var(--ok-primary, #3880ff);
      font-weight: 600;
    }
    .list {
      max-width: 44rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .grant {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.7rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
    }
    .grant .grow {
      flex: 1 1 auto;
      min-width: 0;
      overflow-wrap: anywhere;
    }
    /* One permission and its limits, as a single block: the fold has to read as belonging to the
       row above it and not as another permission of its own. */
    .grant-block {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .grant .pinned {
      font-style: normal;
      color: var(--ok-text-muted, #6b675c);
      overflow-wrap: anywhere;
    }
    .limits {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      /* Indented under its own permission on a desktop; flush on a phone, where 1.25rem of the
         390px it has left is a column of text that wraps every other word. */
      padding: 0 0 0.2rem 0;
      border-left: 2px solid var(--ok-border, #d7d5cc);
      margin-left: 0.4rem;
      padding-left: 0.6rem;
    }
    @media (min-width: 560px) {
      .limits {
        margin-left: 1.25rem;
      }
    }
    .run {
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      padding: 0.6rem 0.7rem;
    }
    /* What went wrong, and what to do — the two lines that matter, at full size. The kernel's own
       wording is folded away underneath: it is for support, not for the person reading this. */
    .trouble {
      margin-top: 0.4rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      font-size: 0.9rem;
    }
    .trouble .why {
      font-weight: 600;
    }
    .trouble .do {
      color: var(--ok-muted, #6b6a63);
    }
    .trouble details {
      margin-top: 0.2rem;
    }
    .trouble summary {
      cursor: pointer;
      font-size: 0.82rem;
      color: var(--ok-muted, #6b6a63);
      min-height: 1.75rem;
    }
    .trouble code {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.8rem;
      overflow-wrap: anywhere;
      color: var(--ok-muted, #6b6a63);
    }
    h4.section {
      margin: 0 0 0.15rem;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      font-weight: 600;
    }
    [data-attention] {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      padding: 0.6rem;
      border: 1px solid var(--ok-danger, var(--ion-color-danger, #c0392b));
      border-radius: var(--ok-radius, 14px);
      margin-bottom: 0.5rem;
    }
    .run ul {
      margin: 0.5rem 0 0;
      padding-left: 1rem;
      font-size: 0.88rem;
      color: var(--ok-muted, #6b6a63);
    }
    .muted {
      color: var(--ok-muted, #6b6a63);
    }
    /* ── A proposal nobody has accepted yet (flows#4) ──────────────────────────────────────────
       The marker is on the NODE, so the sentence in the banner and the card it is about are the
       same thing on screen. A list of complaints with nothing to point at is how «check the
       parameters» becomes «which parameters». */
    [data-gap] > .card,
    [data-gap] > .chip {
      border-color: var(--ok-warning, var(--ion-color-warning, #c98a00));
      border-style: dashed;
    }
    .draft-notes {
      margin: 0.4rem 0 0;
      padding-left: 1.1rem;
    }
    .draft-notes li {
      margin: 0.15rem 0;
    }
  `;
  }
  willUpdate(changed) {
    if (changed.has("flow")) {
      this.document = this.flow ? readDoc(this.flow.definition) : emptyDoc();
      this.name = this.flow?.name ?? "";
      this.enabled = this.flow?.enabled ?? false;
      this.error = "";
      this.notice = "";
      this.enableWarning = "";
      this.tested = false;
      this.runs = [];
      this.grants = [];
      void this.loadGrants();
      void this.loadShape();
    }
  }
  /**
   * The arrow keys along the tab strip (WAI-ARIA's tabs pattern).
   *
   * The strip is ONE stop for the tab key — the selected tab holds `tabindex="0"` and the rest
   * `-1` — so without this the other three panels are simply unreachable from a keyboard. Which is
   * the same defect as a dead button, arriving through a different door: the history is five key
   * presses away, or none at all.
   *
   * It wraps, because the pattern's own answer to «what is to the left of the first one» is «the
   * last one», and a strip that stops dead at both ends teaches people to reach for the mouse.
   */
  onTabKey(e4) {
    const step = { ArrowRight: 1, ArrowLeft: -1 };
    let next;
    if (e4.key in step) {
      const at2 = TABS.indexOf(this.tab);
      next = TABS[(at2 + step[e4.key] + TABS.length) % TABS.length];
    } else if (e4.key === "Home") next = TABS[0];
    else if (e4.key === "End") next = TABS[TABS.length - 1];
    if (!next) return;
    e4.preventDefault();
    this.tab = next;
    void this.updateComplete.then(() => {
      this.renderRoot.querySelector(`#tab-${this.tab}`)?.focus();
    });
  }
  updated(changed) {
    if (changed.has("tab") && this.tab === "history") void this.loadRuns();
    if (changed.has("tab") && this.tab === "test") this.tested = true;
    if (this.openStep === "trigger") void this.ensureEventCatalog();
    this.pinEventSelect();
  }
  /**
   * Put the saved event back into the trigger `<select>` once its `<option>` children exist.
   *
   * The `?selected` attribute of `option()` fixes the FIRST paint, and it is not enough here: this
   * dropdown's options arrive from the network a round trip later, and Lit **dirty-checks `.value`**
   * — the binding was already committed with this same string while the list was empty, so on the
   * re-render that finally adds the options Lit skips it, the browser keeps the selectedness it
   * computed from an empty list, and the control sits on the first option. Then the change handler
   * writes back what the box says.
   *
   * That is the v0.1.6 bug with a wider window, and it is why this is done in `updated()` — after
   * the children are in the DOM — instead of trusting the binding. Only when they actually differ,
   * so it can never fight a person mid-choice.
   */
  pinEventSelect() {
    const select = this.renderRoot.querySelector(
      'select[data-field="trigger-event"]'
    );
    if (!select) return;
    const chosen = this.trigger.kind === "event" ? this.trigger.event ?? "" : "";
    if (select.value !== chosen) select.value = chosen;
  }
  // ── Loading ─────────────────────────────────────────────────────────────────────────────────
  get trigger() {
    return this.document.triggers[0] ?? { kind: "manual" };
  }
  async loadGrants() {
    if (!this.flow?.id || !this.client) return;
    try {
      const grants = await this.client.flows.grants(this.flow.id);
      this.grants = Array.isArray(grants) ? grants : [];
    } catch {
      this.grants = [];
    }
  }
  /**
   * The events this hub can fire, asked when the trigger panel first opens and not on mount.
   *
   * Not on mount because most of this screen is steps, and this is a third admin-only round trip
   * on the first paint. Not per open because the answer is a property of the HUB, not of the panel.
   */
  async ensureEventCatalog() {
    if (this.catalogAsked) return;
    this.catalogAsked = true;
    this.eventCatalog = await loadEventCatalog(this.client);
  }
  async loadShape() {
    const event = this.trigger.kind === "event" ? this.trigger.event : "";
    if (!event || !this.client) {
      this.shape = null;
      return;
    }
    try {
      this.shape = await this.client.events.shape(event);
    } catch {
      this.shape = null;
    }
  }
  /**
   * The secret names, asked for when an `http` panel opens and not before.
   *
   * Not on mount: most flows have no `http` step at all, and this is one more admin-only round
   * trip on the first paint of a screen that already makes two.
   */
  async loadSecrets() {
    if (!this.client?.flows.secrets) return;
    try {
      const list = await this.client.flows.secrets();
      this.secrets = Array.isArray(list) ? list : [];
    } catch {
      this.secrets = [];
    }
  }
  async saveSecret() {
    const name = this.secretName.trim();
    const value = this.secretValue;
    if (!name || !value || !this.client?.flows.putSecret) return;
    this.error = "";
    try {
      await this.client.flows.putSecret(name, value);
      this.secretValue = "";
      this.secretName = "";
      await this.loadSecrets();
      this.notice = this.t("ui.secretSaved", { name });
    } catch (e4) {
      this.secretValue = "";
      this.error = e4?.message || this.t("ui.errGeneric");
    }
  }
  async deleteSecret(name) {
    if (!this.client?.flows.deleteSecret) return;
    try {
      await this.client.flows.deleteSecret(name);
      await this.loadSecrets();
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
    }
  }
  async loadRuns() {
    if (!this.flow?.id || !this.client) return;
    try {
      const page = await this.client.flows.runs(this.flow.id, { limit: 20 });
      this.runs = Array.isArray(page) ? page : page?.data ?? [];
    } catch (e4) {
      this.error = e4?.message ?? this.t("ui.errGeneric");
    }
  }
  // ── Saving ──────────────────────────────────────────────────────────────────────────────────
  /** Public so the app shell (and the tests) can drive it without reaching into the template. */
  async save() {
    if (!this.client) return;
    this.saving = true;
    this.error = "";
    this.notice = "";
    const body = {
      name: this.name.trim() || this.t("ui.unnamed"),
      enabled: this.enabled,
      definition: this.document
    };
    try {
      const saved = this.flow?.id ? await this.client.flows.update(this.flow.id, body) : await this.client.flows.create(body);
      this.flow = saved;
      this.notice = this.t("ui.grantsSaved");
      this.dispatchEvent(
        new CustomEvent("flows-saved", { detail: { flow: saved }, bubbles: true, composed: true })
      );
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
    } finally {
      this.saving = false;
    }
  }
  /** Grants everything the document needs, keeping every grant this editor did not put there. */
  async grantAll() {
    if (!this.client || !this.flow?.id) return;
    const missing = missingGrants(this.document, this.grants);
    if (!missing.length) return;
    this.error = "";
    try {
      const next = await this.client.flows.replaceGrants(
        this.flow.id,
        mergeGrants(this.grants, missing, [])
      );
      this.grants = Array.isArray(next) ? next : [];
      this.notice = this.t("ui.grantsSaved");
    } catch (e4) {
      this.error = errorCode(e4).includes("not_found") ? this.t("ui.grantCommandNotFound", { command: missing.map((g3) => g3.value).join(", ") }) : e4?.message || this.t("ui.errGeneric");
    }
  }
  async revoke(grant) {
    if (!this.client || !this.flow?.id) return;
    try {
      const next = await this.client.flows.replaceGrants(
        this.flow.id,
        mergeGrants(this.grants, [], [grant])
      );
      this.grants = Array.isArray(next) ? next : [];
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
    }
  }
  /**
   * **Writes the limits of ONE granted action** (hub#1623, flows#66).
   *
   * `PUT …/grants` is a complete replace, so this sends every grant this flow holds and not just
   * the one that changed — {@link setGrantPin} is what keeps the other pins on their way through.
   * What comes back is what the hub really stored, and that is what the screen shows from then on:
   * changing a limit is a revocation plus a fresh grant on the other side, so the row the owner
   * was looking at does not survive it and nothing here may pretend it did.
   */
  async saveLimits(grant) {
    if (!this.client || !this.flow?.id) return;
    const k2 = grantKey(grant);
    this.error = "";
    this.notice = "";
    this.savingLimits = k2;
    try {
      const next = await this.client.flows.replaceGrants(
        this.flow.id,
        setGrantPin(this.grants, grant, readPinRows(this.limitRows(grant)))
      );
      this.grants = Array.isArray(next) ? next : [];
      const rest = { ...this.pinDrafts };
      delete rest[k2];
      this.pinDrafts = rest;
      this.notice = this.t("ui.grantsSaved");
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
    } finally {
      this.savingLimits = "";
    }
  }
  /** The rows the owner is editing, or the stored limit, or one empty pair to start from. */
  limitRows(grant) {
    const draft = this.pinDrafts[grantKey(grant)];
    if (draft) return draft;
    const stored = pinRows(grant);
    return stored.length ? stored : [["", ""]];
  }
  setLimitRows(grant, rows) {
    this.pinDrafts = { ...this.pinDrafts, [grantKey(grant)]: rows };
  }
  toggleLimits(grant) {
    const k2 = grantKey(grant);
    this.limitsOpen = this.limitsOpen.includes(k2) ? this.limitsOpen.filter((x2) => x2 !== k2) : [...this.limitsOpen, k2];
  }
  // ── Editing ─────────────────────────────────────────────────────────────────────────────────
  setDoc(doc) {
    this.document = doc;
  }
  onReorder(e4) {
    const { from, to, complete } = e4.detail;
    this.setDoc(moveStep(this.document, from, to));
    complete();
  }
  add(kind) {
    const next = addStep(this.document, kind);
    this.setDoc(next);
    this.openStep = next.steps[next.steps.length - 1].id;
  }
  setTrigger(patch) {
    this.setDoc(patchTrigger(this.document, { ...this.trigger, ...patch }));
    void this.loadShape();
  }
  /**
   * The switch is an explicit yes, and it deserves to be an INFORMED one (flows#39).
   *
   * Nothing is blocked: the owner can flip a flow on with holes in it if that is what they want.
   * What the switch does is say, in the same breath, the two things that make «on» not mean
   * «working»: permissions it asks for and does not hold, and the fact that nobody has looked at
   * what it would do yet. A flow with no grants does nothing at all — silently — which is the one
   * outcome this screen must not let read as success.
   */
  onEnable(on) {
    this.enabled = on;
    if (!on) {
      this.enableWarning = "";
      return;
    }
    const missing = missingGrants(this.document, this.grants);
    const warnings = [];
    if (missing.length)
      warnings.push(
        this.t("ui.enableNoGrants", { commands: missing.map((g3) => g3.value).join(", ") })
      );
    if (!this.tested) warnings.push(this.t("ui.enableUntested"));
    this.enableWarning = warnings.join(" ");
  }
  openPicker(target, root) {
    this.pickerFor = target;
    this.pickerRoot = root;
    this.pickerOpen = true;
  }
  onFieldPicked(e4) {
    this.pickerFor?.appendField(e4.detail.path);
    this.pickerOpen = false;
    this.pickerFor = null;
  }
  /** What the owner reads for an event: the hand-written phrase, or the composed one (flows#41). */
  eventLabel(event) {
    return event ? eventPhrase(event, this.t) : "";
  }
  // ── Rendering ───────────────────────────────────────────────────────────────────────────────
  /** `true` when the assistant left something unresolved on this node (`trigger`, or a step id). */
  hasGap(id) {
    return !!this.draft?.gaps.some((g3) => g3.stepId === id);
  }
  /**
   * The banner over a proposal: what it IS, what the assistant could not decide, and what to check.
   *
   * The first sentence is the load-bearing one — «it is off, it has no permissions, nothing happens
   * until you turn it on». An owner reading a screen full of their own business's words needs to
   * know, before anything else, whether it is already doing something.
   */
  renderDraftBanner() {
    const draft = this.draft;
    if (!draft) return A;
    return b2`<div class="list" style="margin-bottom:.75rem">
      <ok-inline-feedback tone="warning" icon="sparkles-outline" data-draft-banner>
        ${this.t("draft.unconfirmed")}
      </ok-inline-feedback>
      ${draft.gaps.length ? b2`<div>
            <span class="eyebrow">${this.t("draft.gapsTitle")}</span>
            <ul class="draft-notes">
              ${draft.gaps.map((g3) => b2`<li>${this.t(g3.key, g3.params)}</li>`)}
            </ul>
          </div>` : A}
      ${draft.notes.length ? b2`<div>
            <span class="eyebrow">${this.t("draft.notesTitle")}</span>
            <ul class="draft-notes">
              ${draft.notes.map((n5) => b2`<li>${n5}</li>`)}
            </ul>
          </div>` : A}
    </div>`;
  }
  renderTriggerNode() {
    const trigger = this.trigger;
    const open = this.openStep === "trigger";
    return b2`<div class="node trigger" data-node="trigger" ?data-gap=${this.hasGap("trigger")}>
      <div class="card">
        <div class="row" style="padding:0">
          <button
            type="button"
            class="open"
            aria-expanded=${open ? "true" : "false"}
            @click=${() => {
      this.openStep = open ? null : "trigger";
    }}
          >
            <span class="grow">
              <span class="eyebrow">${this.t("ui.whenThisHappens")}</span>
              <span class="title"
                >${trigger.kind === "event" ? this.t("ui.triggerEvent", { event: this.eventLabel(trigger.event) }) : trigger.kind === "cron" ? readDailyCron(trigger.cron ?? "") ? this.t("ui.triggerDaily", { time: readDailyCron(trigger.cron ?? "") }) : this.t("ui.triggerCron", { cron: trigger.cron ?? "" }) : trigger.kind === "at" ? this.t("ui.triggerAt", { when: trigger.at ?? "" }) : this.t("ui.triggerManual")}</span
              >
            </span>
          </button>
        </div>
        ${open ? b2`<div class="panel">${this.renderTriggerPanel(trigger)}</div>` : A}
      </div>
    </div>`;
  }
  renderTriggerPanel(trigger) {
    return b2`
      <div class="field">
        <label for="trigger-kind">${this.t("ui.whenThisHappens")}</label>
        <select
          id="trigger-kind"
          data-field="trigger-kind"
          .value=${trigger.kind}
          @change=${(e4) => this.setTrigger({ kind: e4.target.value })}
        >
          ${option("event", this.t("ui.triggerKindEvent"), trigger.kind)}
          ${option("cron", this.t("ui.triggerKindCron"), trigger.kind)}
          ${option("at", this.t("ui.triggerKindAt"), trigger.kind)}
          ${option("manual", this.t("ui.triggerKindManual"), trigger.kind)}
        </select>
      </div>
      ${trigger.kind === "event" ? this.renderEventChoice(trigger) : A}
      ${trigger.kind === "cron" ? b2`<div class="field">
            <label for="trigger-time">${this.t("ui.timeLabel")}</label>
            <input
              id="trigger-time"
              type="time"
              .value=${readDailyCron(trigger.cron ?? "") ?? ""}
              @change=${(e4) => this.setTrigger({ cron: dailyCron(e4.target.value || "09:00") })}
            />
            <span class="hint">${this.t("ui.cronLabel")}: ${trigger.cron ?? ""}</span>
          </div>` : A}
      ${trigger.kind === "at" ? b2`<div class="field">
            <label for="trigger-at">${this.t("ui.atLabel")}</label>
            <input
              id="trigger-at"
              type="datetime-local"
              @change=${(e4) => {
      const raw = e4.target.value;
      this.setTrigger({ at: raw ? new Date(raw).toISOString() : "" });
    }}
            />
          </div>` : A}
    `;
  }
  /**
   * Why the dropdown is not the dropdown — said on screen, never papered over.
   *
   * Each of these is a different thing for the owner to do: wait, update the hub, grant a
   * permission, install a module, or type the name in the box below. Rendering the module's own
   * hand-written list here instead would be flows#8 again in disguise.
   */
  renderCatalogState() {
    const catalog = this.eventCatalog;
    if (catalog.status === "ready") return A;
    if (catalog.status === "loading") {
      return b2`<span class="hint" data-catalog="loading">${this.t("ui.eventCatalogLoading")}</span>`;
    }
    const message = catalog.status === "unsupported" ? this.t("ui.eventCatalogUnsupported") : catalog.status === "empty" ? this.t("ui.eventCatalogEmpty") : catalog.code === CAPABILITY_DENIED ? this.t("ui.eventCatalogDenied") : this.t("ui.eventCatalogFailed", { code: catalog.code });
    return b2`<ok-inline-feedback
      tone="warning"
      icon="alert-circle-outline"
      data-catalog=${catalog.status}
      >${message}</ok-inline-feedback
    >`;
  }
  renderEventChoice(trigger) {
    const chosen = trigger.event ?? "";
    const catalog = this.eventCatalog;
    const options = catalog.status === "ready" ? catalog.options : [];
    const listed = options.some((o6) => o6.event === chosen);
    return b2`
      <div class="field">
        <label for="trigger-event">${this.t("ui.eventPick")}</label>
        <select
          id="trigger-event"
          data-field="trigger-event"
          .value=${chosen}
          @change=${(e4) => this.setTrigger({ event: e4.target.value })}
        >
          <option value="">—</option>
          <!--
            Grouped by the module the event comes from (flows#41): a hub with everything installed
            offers 196 of these, and «Cocina → llega un pedido a cocina» is how Zapier, Power
            Automate and Odoo all let somebody find one. The order inside each group is still the
            hub's.
          -->
          ${groupByFamily(options, this.t).map(
      (group) => b2`<optgroup label=${group.family}>
              ${group.options.map(
        (entry) => eventOption(entry.event, this.eventLabel(entry.event), chosen)
      )}
            </optgroup>`
    )}
          <!--
            The saved event, kept on offer even when the catalogue has not arrived, or arrived
            without it (the module that emitted it was uninstalled). Dropping it would leave the
            control on «—» and the next change handler would save that emptiness over a working
            trigger — the exact shape of the bug fixed in v0.1.6, only now with a network round trip
            widening the window.
          -->
          ${chosen && !listed ? eventOption(chosen, this.eventLabel(chosen), chosen) : A}
        </select>
        ${this.renderCatalogState()}
        <span class="hint">
          ${!chosen ? this.t("ui.eventOtherHint") : this.shape ? this.shape.samples === 0 ? this.t("ui.eventNoSamples") : this.t("ui.eventSamples", { count: this.shape.samples }) : this.t("ui.eventNotInHub", {
      module: catalogEntry(chosen)?.module ?? "\u2014"
    })}
        </span>
      </div>
      <div class="field">
        <label for="trigger-event-other">${this.t("ui.eventOther")}</label>
        <input
          id="trigger-event-other"
          type="text"
          .value=${chosen}
          @change=${(e4) => this.setTrigger({ event: e4.target.value.trim() })}
        />
      </div>
    `;
  }
  renderStepNode(step, index) {
    const open = this.openStep === step.id;
    const removeBtn = b2`<button
      type="button"
      class="icon-btn"
      data-act="remove"
      aria-label=${this.t("ui.removeStep")}
      @click=${() => this.setDoc(removeStep(this.document, index))}
    >
      ×
    </button>`;
    const handle = b2`<ion-reorder aria-label=${this.t("ui.reorderHint")}>⠿</ion-reorder>`;
    if (step.kind === "delay") {
      return b2`<div class="node segment" data-node=${step.id} ?data-gap=${this.hasGap(step.id)}>
        <div class="chip">
          ${handle}
          <button
            type="button"
            class="open"
            style="padding:.2rem .3rem"
            aria-expanded=${open ? "true" : "false"}
            @click=${() => {
        this.openStep = open ? null : step.id;
      }}
          >
            <span class="grow">${describeDelay(Number(step.seconds ?? 0), this.t)}</span>
          </button>
          ${removeBtn}
        </div>
        ${open ? b2`<div class="panel">${this.renderDelayPanel(step, index)}</div>` : A}
      </div>`;
    }
    if (step.kind === "condition") {
      return b2`<div class="node guard" data-node=${step.id} ?data-gap=${this.hasGap(step.id)}>
        <div class="chip">
          ${handle}
          <button
            type="button"
            class="open"
            style="padding:.2rem .3rem"
            aria-expanded=${open ? "true" : "false"}
            @click=${() => {
        this.openStep = open ? null : step.id;
      }}
          >
            <span class="grow"
              ><strong>${this.t("ui.guardTitle")}</strong>
              ${describeStep(step, this.t)}</span
            >
          </button>
          ${removeBtn}
        </div>
        ${open ? b2`<div class="panel">${this.renderGuardPanel(step, index)}</div>` : A}
      </div>`;
    }
    return b2`<div class="node" data-node=${step.id} ?data-gap=${this.hasGap(step.id)}>
      <div class="card">
        <div class="row" style="padding:0">
          ${handle}
          <button
            type="button"
            class="open"
            aria-expanded=${open ? "true" : "false"}
            @click=${() => {
      this.openStep = open ? null : step.id;
      if (this.openStep === step.id && step.kind === "http") void this.loadSecrets();
    }}
          >
            <!-- No eyebrow here on purpose: «…haz esto» is what the SPINE says once, and repeating
                 it above every card turns the one line that carries meaning into wallpaper. -->
            <span class="grow">
              <span class="title">${describeStep(step, this.t)}</span>
            </span>
          </button>
          ${removeBtn}
        </div>
        ${open ? b2`<div class="panel">${this.renderStepPanel(step, index)}</div>` : A}
      </div>
    </div>`;
  }
  /** The right form for this kind — or the honest sentence for a kind from a newer editor. */
  renderStepPanel(step, index) {
    if (!isSpineKind(step.kind)) return b2`<span class="hint">${this.t("ui.readOnlyStep")}</span>`;
    if (step.kind === "http") return this.renderHttpPanel(step, index);
    if (step.kind === "ai") return this.renderAiPanel(step, index);
    if (step.kind === "notify") return this.renderNotifyPanel(step, index);
    if (step.kind === "query") return this.renderQueryPanel(step, index);
    if (step.kind === "approval") return this.renderApprovalPanel(step, index);
    return this.renderCommandPanel(step, index);
  }
  /**
   * One composed value, wired to the shared field picker — and, inside an `http` step, to the
   * secrets this hub holds.
   *
   * `template` forces `{{…}}` even for a lone field: `url` is a string in the schema, so the
   * type-preserving rule that is right everywhere else is wrong there.
   */
  renderValue(opts) {
    const write = (parts) => opts.onChange(opts.template ? partsToTemplate(parts) : partsToValue(parts));
    return b2`<div class="value-row">
      <erp-flows-value
        data-field=${opts.field}
        .label=${opts.label}
        .parts=${valueToParts(opts.value)}
        .fieldLabel=${this.fieldLabel}
        .insertLabel=${this.t("ui.insertField")}
        .removeLabel=${this.t("ui.removePart")}
        .canPickFields=${!!this.shape}
        @flows-value-change=${(e4) => write(e4.detail.parts)}
        @flows-pick-field=${(e4) => this.openPicker(e4.target, "input")}
      ></erp-flows-value>
      <!-- The secret picker lives in THIS shadow root, next to the box, and only inside an http
           step: a secret path anywhere else is refused at save, so offering it elsewhere would
           teach a syntax that makes the document unsavable. -->
      ${opts.secrets && this.secrets.length ? b2`<select
            data-act="insert-secret"
            aria-label=${this.t("ui.insertSecret")}
            .value=${""}
            @change=${(e4) => {
      const select = e4.target;
      const name = select.value;
      select.value = "";
      if (!name) return;
      const box = e4.currentTarget.closest(".value-row")?.querySelector("erp-flows-value");
      box?.appendField(`secret.${name}`);
    }}
          >
            <option value="">${this.t("ui.insertSecret")}</option>
            ${this.secrets.map((s4) => b2`<option value=${s4.name}>${s4.name}</option>`)}
          </select>` : A}
    </div>`;
  }
  /**
   * **The `http` step**: where an automation leaves the building.
   *
   * Everything on this panel is a thing the hub checks and refuses: the method set is closed, the
   * timeout is capped, the URL is matched against a grant PATTERN after templating, and a secret is
   * only legal here. Clamping in the form rather than letting the save fail is the difference
   * between «30 is the most it will wait» and a red box with an error code in it.
   */
  renderHttpPanel(step, index) {
    const headers = Object.entries(step.headers ?? {});
    const setHeaders = (entries) => this.setDoc(patchStep(this.document, index, { headers: Object.fromEntries(entries) }));
    const pattern = httpPatternFor(String(step.url ?? ""));
    return b2`
      <div class="method-row">
        <div class="field">
          <label for="m-${step.id}">${this.t("ui.httpMethod")}</label>
          <select
            id="m-${step.id}"
            data-field="method"
            .value=${String(step.method ?? "GET")}
            @change=${(e4) => this.setDoc(
      patchStep(this.document, index, { method: e4.target.value })
    )}
          >
            ${HTTP_METHODS.map((m3) => option(m3, m3, String(step.method ?? "GET")))}
          </select>
        </div>
        ${this.renderValue({
      field: "url",
      label: this.t("ui.httpUrl"),
      value: step.url ?? "",
      template: true,
      secrets: true,
      onChange: (url) => this.setDoc(patchStep(this.document, index, { url }))
    })}
      </div>
      <!-- The grant this step will need, spelled the way the hub compares it. Showing it HERE and
           not only on the Permissions tab is what connects «I typed an address» to «and this is
           what I am about to allow». -->
      <span class="hint"
        >${pattern ? this.t("ui.httpGrantHint", { pattern }) : this.t("ui.httpGrantUnknown")}</span
      >

      <span class="eyebrow">${this.t("ui.httpHeaders")}</span>
      <span class="hint">${this.t("ui.httpHeadersHint")}</span>
      ${headers.map(
      ([key2, value], i4) => b2`<div class="param-row">
          <div class="field">
            <label>${this.t("ui.paramName")}</label>
            <input
              type="text"
              .value=${key2}
              @change=${(e4) => setHeaders(
        headers.map(
          (h3, j) => j === i4 ? [e4.target.value.trim(), h3[1]] : h3
        )
      )}
            />
          </div>
          ${this.renderValue({
        field: `header-${i4}`,
        label: this.t("ui.paramValue"),
        value,
        secrets: true,
        onChange: (v2) => setHeaders(headers.map((h3, j) => j === i4 ? [h3[0], v2] : h3))
      })}
          <button
            type="button"
            class="icon-btn"
            aria-label=${this.t("ui.removePart", { label: key2 })}
            @click=${() => setHeaders(headers.filter((_2, j) => j !== i4))}
          >
            ×
          </button>
        </div>`
    )}
      <div class="adders" style="margin-left:0">
        <button type="button" data-act="add-header" @click=${() => setHeaders([...headers, ["", ""]])}>
          ${this.t("ui.httpAddHeader")}
        </button>
      </div>

      ${this.renderValue({
      field: "body",
      label: this.t("ui.httpBody"),
      value: step.body ?? "",
      secrets: true,
      onChange: (body) => this.setDoc(patchStep(this.document, index, { body }))
    })}

      <div class="field">
        <label for="t-${step.id}">${this.t("ui.httpTimeout")}</label>
        <input
          id="t-${step.id}"
          data-field="timeout"
          type="number"
          min="1"
          max=${MAX_TIMEOUT_SECONDS}
          .value=${String(step.timeout ?? 10)}
          @change=${(e4) => this.setDoc(
      patchStep(this.document, index, {
        // Clamped here rather than refused at save: the hub caps this at 30 and the run
        // holds its lease the whole time, so this number is also what an error costs.
        timeout: clamp(Number(e4.target.value), 1, MAX_TIMEOUT_SECONDS, 10)
      })
    )}
        />
        <span class="hint">${this.t("ui.httpTimeoutHint", { max: MAX_TIMEOUT_SECONDS })}</span>
      </div>

      ${this.renderSecrets()}
    `;
  }
  /**
   * **The secrets this hub holds** — names in, names out, and no way back.
   *
   * There is no endpoint that returns a value and there is no «reveal» button here, because there
   * would be nothing behind it. The screen says so rather than leaving the owner wondering where
   * the key they typed went.
   */
  renderSecrets() {
    if (!this.client?.flows.secrets) return A;
    return b2`<div class="secrets">
      <span class="eyebrow">${this.t("ui.secretsTitle")}</span>
      <span class="hint">${this.t("ui.secretsIntro")}</span>
      ${this.secrets.map(
      (s4) => b2`<div class="grant">
          <span class="grow">${s4.name}</span>
          <button
            type="button"
            class="icon-btn"
            data-act="delete-secret"
            aria-label=${this.t("ui.secretDelete", { name: s4.name })}
            @click=${() => void this.deleteSecret(s4.name)}
          >
            ×
          </button>
        </div>`
    )}
      <div class="param-row">
        <div class="field">
          <label for="sn-${this.flow?.id ?? "new"}">${this.t("ui.secretName")}</label>
          <input
            id="sn-${this.flow?.id ?? "new"}"
            data-field="secret-name"
            type="text"
            .value=${this.secretName}
            placeholder="STRIPE_KEY"
            @input=${(e4) => {
      this.secretName = e4.target.value;
    }}
          />
        </div>
        <div class="field">
          <label for="sv-${this.flow?.id ?? "new"}">${this.t("ui.secretValue")}</label>
          <input
            id="sv-${this.flow?.id ?? "new"}"
            data-field="secret-value"
            type="password"
            autocomplete="off"
            .value=${this.secretValue}
            @input=${(e4) => {
      this.secretValue = e4.target.value;
    }}
          />
        </div>
        <button
          type="button"
          class="icon-btn"
          data-act="save-secret"
          @click=${() => void this.saveSecret()}
        >
          ${this.t("ui.save")}
        </button>
      </div>
    </div>`;
  }
  /**
   * **The `ai` step.** One question decides everything on this panel: does a person see the write
   * before it happens? `manual` is the kernel's default and it is written out loud here, because
   * the permissive option is the one nobody types and everybody assumes.
   */
  renderAiPanel(step, index) {
    const tools = step.tools ?? {};
    const queries = tools.queries ?? [];
    const commands = tools.commands ?? [];
    const setTools = (next) => this.setDoc(
      patchStep(this.document, index, {
        tools: { queries: next.queries ?? queries, commands: next.commands ?? commands }
      })
    );
    const auto = step.policy === "auto";
    return b2`
      ${this.renderValue({
      field: "prompt",
      label: this.t("ui.aiPrompt"),
      value: step.prompt ?? "",
      template: true,
      onChange: (prompt) => this.setDoc(patchStep(this.document, index, { prompt }))
    })}
      <!-- No secret picker on a prompt, and that is not an omission: a secret path here is
           refused at save, because the prompt is sent to the model. -->
      <span class="hint">${this.t("ui.aiPromptHint")}</span>

      <span class="eyebrow">${this.t("ui.aiToolsTitle")}</span>
      <span class="hint">${this.t("ui.aiToolsHint")}</span>
      ${this.renderToolList(
      this.t("ui.aiToolsQueries"),
      queries,
      "query",
      (next) => setTools({ queries: next })
    )}
      ${this.renderToolList(
      this.t("ui.aiToolsCommands"),
      commands,
      "command",
      (next) => setTools({ commands: next })
    )}

      <div class="field">
        <label for="p-${step.id}">${this.t("ui.aiPolicy")}</label>
        <select
          id="p-${step.id}"
          data-field="policy"
          .value=${String(step.policy ?? "manual")}
          @change=${(e4) => this.setDoc(
      patchStep(this.document, index, {
        policy: e4.target.value
      })
    )}
        >
          ${option("manual", this.t("ui.aiPolicyManual"), String(step.policy ?? "manual"))}
          ${option("auto", this.t("ui.aiPolicyAuto"), String(step.policy ?? "manual"))}
        </select>
      </div>
      ${auto ? b2`<ok-inline-feedback tone="warning" icon="alert-circle-outline"
            >${this.t("ui.aiPolicyAutoWarning")}</ok-inline-feedback
          >` : b2`<span class="hint">${this.t("ui.aiPolicyManualHint")}</span>`}

      <div class="field">
        <label for="i-${step.id}">${this.t("ui.aiMaxIters")}</label>
        <input
          id="i-${step.id}"
          data-field="max-iters"
          type="number"
          min="1"
          max=${MAX_ITERS_CAP}
          .value=${String(step.max_iters ?? 6)}
          @change=${(e4) => this.setDoc(
      patchStep(this.document, index, {
        // The kernel REFUSES above the cap rather than trimming, so a document saying 50
        // would simply not save. Clamping here keeps the refusal off the owner's screen.
        max_iters: clamp(Number(e4.target.value), 1, MAX_ITERS_CAP, 6)
      })
    )}
        />
        <span class="hint">${this.t("ui.aiMaxItersHint", { max: MAX_ITERS_CAP })}</span>
      </div>
    `;
  }
  renderToolList(label, names, what, update) {
    return b2`
      <span class="hint">${label}</span>
      ${names.map(
      (name, i4) => b2`<div class="param-row" style="grid-template-columns:1fr auto">
          <div class="field">
            <input
              type="text"
              .value=${name}
              @change=${(e4) => update(
        names.map((n5, j) => j === i4 ? e4.target.value.trim() : n5)
      )}
            />
          </div>
          <button
            type="button"
            class="icon-btn"
            aria-label=${this.t("ui.removePart", { label: name })}
            @click=${() => update(names.filter((_2, j) => j !== i4))}
          >
            ×
          </button>
        </div>`
    )}
      <div class="adders" style="margin-left:0">
        <button type="button" data-act="add-${what}" @click=${() => update([...names, ""])}>
          ${this.t(what === "query" ? "ui.aiAddQuery" : "ui.aiAddCommand")}
        </button>
      </div>
    `;
  }
  /**
   * **The `notify` step.** The recipient is a query and a column, and there is **no box to type an
   * address into** — that absence is the whole guarantee. Without it, an author (or a marketplace
   * template) writes `to: "{{input.email}}"` and the message goes wherever the event payload said.
   */
  renderNotifyPanel(step, index) {
    const to = step.to ?? { query: "", params: {}, field: "" };
    const vars = step.vars ?? {};
    const setTo = (patch) => this.setDoc(
      patchStep(this.document, index, { to: { params: {}, ...to, ...patch } })
    );
    const setVar = (key2, value) => this.setDoc(patchStep(this.document, index, { vars: { ...vars, [key2]: value } }));
    return b2`
      <div class="field">
        <label for="ch-${step.id}">${this.t("ui.notifyChannel")}</label>
        <select
          id="ch-${step.id}"
          data-field="channel"
          .value=${String(step.channel ?? "email")}
          @change=${(e4) => this.setDoc(
      patchStep(this.document, index, {
        channel: e4.target.value
      })
    )}
        >
          <!-- Two options, and sms is not one of them: it has no transport anywhere and is
               refused by name at save AND at grant time. A third option here would be a step that
               can never be delivered, picked from a list that looked complete. -->
          ${NOTIFY_CHANNELS.map(
      (c4) => option(c4, this.t(`ui.notifyChannel_${c4}`), String(step.channel ?? "email"))
    )}
        </select>
      </div>
      ${step.channel === "whatsapp" ? b2`<ok-inline-feedback tone="warning" icon="cash-outline"
            >${this.t("ui.notifyWhatsappCost")}</ok-inline-feedback
          >` : A}

      <span class="eyebrow">${this.t("ui.notifyTo")}</span>
      <span class="hint">${this.t("ui.notifyToHint")}</span>
      <div class="param-row">
        <div class="field">
          <label for="tq-${step.id}">${this.t("ui.notifyToQuery")}</label>
          <input
            id="tq-${step.id}"
            data-field="to-query"
            type="text"
            .value=${to.query ?? ""}
            @change=${(e4) => setTo({ query: e4.target.value.trim() })}
          />
        </div>
        <div class="field">
          <label for="tf-${step.id}">${this.t("ui.notifyToField")}</label>
          <input
            id="tf-${step.id}"
            data-field="to-field"
            type="text"
            .value=${to.field ?? ""}
            @change=${(e4) => setTo({ field: e4.target.value.trim() })}
          />
        </div>
      </div>

      <div class="field">
        <label for="tp-${step.id}">${this.t("ui.notifyTemplate")}</label>
        <input
          id="tp-${step.id}"
          data-field="template"
          type="text"
          .value=${String(step.template ?? "")}
          @change=${(e4) => this.setDoc(
      patchStep(this.document, index, { template: e4.target.value })
    )}
        />
        <span class="hint">${this.t("ui.notifyTemplateHint")}</span>
      </div>

      ${this.renderValue({
      field: "var-text",
      label: this.t("ui.notifyText"),
      value: vars.text ?? "",
      onChange: (text) => setVar("text", text)
    })}
    `;
  }
  renderDelayPanel(step, index) {
    const seconds = Number(step.seconds ?? 0);
    const unit = seconds % 86400 === 0 && seconds !== 0 ? 86400 : seconds % 3600 === 0 && seconds !== 0 ? 3600 : 60;
    return b2`<div class="param-row">
      <div class="field">
        <label for="d-${step.id}">${this.t("ui.delayAmount")}</label>
        <input
          id="d-${step.id}"
          type="number"
          min="0"
          .value=${String(Math.round(seconds / unit))}
          @change=${(e4) => this.setDoc(
      patchStep(this.document, index, {
        seconds: Math.max(0, Number(e4.target.value) || 0) * unit
      })
    )}
        />
      </div>
      <div class="field">
        <label for="du-${step.id}">${this.t("ui.value")}</label>
        <select
          id="du-${step.id}"
          .value=${String(unit)}
          @change=${(e4) => this.setDoc(
      patchStep(this.document, index, {
        seconds: Math.round(seconds / unit) * Number(e4.target.value)
      })
    )}
        >
          ${option("60", this.t("ui.unitMinutes"), String(unit))}
          ${option("3600", this.t("ui.unitHours"), String(unit))}
          ${option("86400", this.t("ui.unitDays"), String(unit))}
        </select>
      </div>
    </div>`;
  }
  renderGuardPanel(step, index) {
    const rows = guardRows(step.when);
    const update = (next) => this.setDoc(patchStep(this.document, index, { when: rowsToWhen(next) }));
    return b2`
      <span class="hint">${this.t("ui.guardExplain")}</span>
      ${rows.map(
      (row, i4) => b2`<div class="guard-row">
          <div class="field">
            <label>${this.t("ui.field")}</label>
            <input
              type="text"
              .value=${this.fieldLabel(row.path) || ""}
              readonly
              @click=${(e4) => {
        const host = e4.target.closest(".guard-row");
        const box = host?.querySelector("erp-flows-value");
        if (box) this.openPicker(box, "input");
      }}
            />
            <erp-flows-value
              hidden
              .parts=${row.path ? [{ kind: "field", path: row.path }] : []}
              @flows-value-change=${(e4) => {
        const picked = e4.detail.parts.find((p3) => p3.path)?.path ?? "";
        update(rows.map((r6, j) => j === i4 ? { ...r6, path: picked } : r6));
      }}
            ></erp-flows-value>
          </div>
          <div class="field">
            <label>${this.t("ui.operator")}</label>
            <select
              data-field="operator"
              .value=${row.op}
              @change=${(e4) => update(
        rows.map(
          (r6, j) => j === i4 ? { ...r6, op: e4.target.value } : r6
        )
      )}
            >
              ${OPERATORS.map(
        (op) => option(op, this.t(`ui.op${op.charAt(0).toUpperCase()}${op.slice(1)}`), row.op)
      )}
            </select>
          </div>
          <div class="field">
            <label>${this.t("ui.value")}</label>
            <input
              type="text"
              .value=${row.value}
              @change=${(e4) => update(
        rows.map(
          (r6, j) => j === i4 ? { ...r6, value: e4.target.value } : r6
        )
      )}
            />
            ${row.op === "in" ? b2`<span class="hint">${this.t("ui.opInHint")}</span>` : A}
          </div>
          <button
            type="button"
            class="icon-btn"
            aria-label=${this.t("ui.removeCondition")}
            @click=${() => update(rows.filter((_2, j) => j !== i4))}
          >
            ×
          </button>
        </div>`
    )}
      <div class="adders" style="margin-left:0">
        <button
          type="button"
          @click=${() => update([...rows, { path: "", op: "eq", value: "" }])}
        >
          ${this.t("ui.addCondition")}
        </button>
      </div>
    `;
  }
  renderCommandPanel(step, index) {
    return b2`
      <div class="field">
        <label for="c-${step.id}">${this.t("ui.commandLabel")}</label>
        <input
          id="c-${step.id}"
          type="text"
          .value=${String(step.command ?? "")}
          @change=${(e4) => this.setDoc(
      patchStep(this.document, index, { command: e4.target.value.trim() })
    )}
        />
        <span class="hint">${this.t("ui.commandHint")}</span>
      </div>
      ${this.renderParams(step, index)}
    `;
  }
  /**
   * **The `query` step** — the deterministic read (hub#954, flows#30). Until it existed a flow
   * could only read by putting an `ai` step in the way: a metered, non-deterministic call to a
   * model to answer «is there any stock left». Now it reads without one.
   *
   * Three things the hub checks and refuses are drawn here so the refusal never reaches the
   * owner as an error code: the read must EXIST (404 at save — typed here, because there is no
   * door in the module SDK that lists a hub's queries, exactly as `command` is typed), `result`
   * is `first`/`count` and never `rows`, and `limit` is 1..200 — clamped in the box, since the
   * kernel refuses above the ceiling rather than trimming.
   */
  renderQueryPanel(step, index) {
    const result = String(step.result ?? "first");
    return b2`
      <div class="field">
        <label for="q-${step.id}">${this.t("ui.queryLabel")}</label>
        <input
          id="q-${step.id}"
          data-field="query"
          type="text"
          .value=${String(step.query ?? "")}
          @change=${(e4) => this.setDoc(
      patchStep(this.document, index, { query: e4.target.value.trim() })
    )}
        />
        <span class="hint">${this.t("ui.queryHint")}</span>
      </div>
      ${this.renderParams(step, index)}

      <div class="param-row">
        <div class="field">
          <label for="qr-${step.id}">${this.t("ui.queryResult")}</label>
          <select
            id="qr-${step.id}"
            data-field="result"
            .value=${result}
            @change=${(e4) => this.setDoc(
      patchStep(this.document, index, {
        result: e4.target.value
      })
    )}
          >
            <!-- Two options and no "rows": the mapping language cannot index an array, so a
                 step that kept a list would leave behind something no later step could read. -->
            ${QUERY_RESULTS.map((r6) => option(r6, this.t(`ui.queryResult_${r6}`), result))}
          </select>
        </div>
        <div class="field">
          <label for="ql-${step.id}">${this.t("ui.queryLimit")}</label>
          <input
            id="ql-${step.id}"
            data-field="limit"
            type="number"
            min="1"
            max=${MAX_QUERY_ROWS}
            .value=${String(step.limit ?? MAX_QUERY_ROWS)}
            @change=${(e4) => this.setDoc(
      patchStep(this.document, index, {
        // The kernel REFUSES above the ceiling rather than trimming
        // (flow.limit_out_of_range). Clamping here keeps that refusal off the owner's screen.
        limit: clamp(Number(e4.target.value), 1, MAX_QUERY_ROWS, MAX_QUERY_ROWS)
      })
    )}
          />
          <span class="hint">${this.t("ui.queryLimitHint", { max: MAX_QUERY_ROWS })}</span>
        </div>
      </div>
      <!-- What the NEXT step can read. Zero rows is not a failure: the run carries on with
           found = false, and a guard on it is how «warn me IF there is low stock» is written. -->
      <span class="hint" data-field="query-outputs"
        >${this.t("ui.queryOutputsHint", { paths: queryOutputs(step).join(", ") })}</span
      >
    `;
  }
  /**
   * **The `approval` step** — the pause (hub#950, flows#31). Until it existed a flow could only
   * stop and wait for a person by putting an `ai` step in the way: a metered, non-deterministic
   * call to a model to resolve a yes/no. Now it asks without one.
   *
   * What this panel has to get right is what the market got wrong. Power Automate's *Start and
   * wait for an approval* kills the run at ~30 days and leaves the approval orphaned in the
   * Action Center — the #1 complaint of its forums — so the wait here is EXPLICIT and capped, and
   * what happens when it runs out is a choice the owner makes on this screen. And v1 is linear:
   * the two policies are what replaces branching, so they are explained where they are set.
   */
  renderApprovalPanel(step, index) {
    const role = step.assignee?.role ?? "";
    const expiresIn = Number(step.expires_in ?? DEFAULT_APPROVAL_TTL_SECONDS);
    const presets = [3600, 14400, 86400, 259200, 604800, 1209600, MAX_APPROVAL_TTL_SECONDS];
    const waits = presets.includes(expiresIn) ? presets : [...presets, expiresIn].sort((a3, b3) => a3 - b3);
    const onReject = String(step.on_reject ?? "cancel");
    const onExpire = String(step.on_expire ?? "reject");
    const continues = onReject === "continue" || onExpire === "continue";
    return b2`
      ${this.renderValue({
      field: "title",
      label: this.t("ui.approvalTitle"),
      value: step.title ?? "",
      template: true,
      onChange: (title) => this.setDoc(patchStep(this.document, index, { title: String(title) }))
    })}
      <!-- Templated when the request is CREATED, not when the tray is read: editing the flow
           later does not change a question already asked. Said here, where the text is typed. -->
      <span class="hint">${this.t("ui.approvalTitleHint")}</span>
      ${this.renderValue({
      field: "summary",
      label: this.t("ui.approvalSummary"),
      value: step.summary ?? "",
      template: true,
      onChange: (summary) => this.setDoc(patchStep(this.document, index, { summary: String(summary) }))
    })}

      <div class="field">
        <label for="ar-${step.id}">${this.t("ui.approvalAssignee")}</label>
        <!-- A ROLE, and there is no box in which a person can be named — that absence is the
             guarantee (hub#950): a document that could say «Marta» stops working the day Marta
             leaves. The base roles are offered; a role a module declares can still be typed. -->
        <input
          id="ar-${step.id}"
          data-field="assignee-role"
          type="text"
          list="roles-${step.id}"
          placeholder=${this.t("ui.approvalAssigneeAdmins")}
          .value=${role}
          @change=${(e4) => {
      const next = e4.target.value.trim();
      const { assignee: _dropped, ...rest } = this.document.steps[index];
      const patched = next ? { ...rest, assignee: { role: next } } : rest;
      this.setDoc({
        ...this.document,
        steps: this.document.steps.map((s4, i4) => i4 === index ? patched : s4)
      });
    }}
        />
        <datalist id="roles-${step.id}" data-field="roles">
          ${BASE_ROLES.map((r6) => b2`<option value=${r6}></option>`)}
        </datalist>
        <span class="hint">${this.t("ui.approvalAssigneeHint")}</span>
      </div>

      <div class="field">
        <label for="ae-${step.id}">${this.t("ui.approvalExpiresIn")}</label>
        <select
          id="ae-${step.id}"
          data-field="expires-in"
          .value=${String(expiresIn)}
          @change=${(e4) => this.setDoc(
      patchStep(this.document, index, {
        expires_in: clamp(
          Number(e4.target.value),
          1,
          MAX_APPROVAL_TTL_SECONDS,
          DEFAULT_APPROVAL_TTL_SECONDS
        )
      })
    )}
        >
          ${waits.map((w2) => option(String(w2), describeDelay(w2, this.t), String(expiresIn)))}
        </select>
        <span class="hint">${this.t("ui.approvalExpiresInHint")}</span>
      </div>

      <div class="param-row">
        <div class="field">
          <label for="aj-${step.id}">${this.t("ui.approvalOnReject")}</label>
          <select
            id="aj-${step.id}"
            data-field="on-reject"
            .value=${onReject}
            @change=${(e4) => this.setDoc(
      patchStep(this.document, index, {
        on_reject: e4.target.value
      })
    )}
          >
            ${REJECT_POLICIES.map((p3) => option(p3, this.t(`ui.approvalOnReject_${p3}`), onReject))}
          </select>
        </div>
        <div class="field">
          <label for="ax-${step.id}">${this.t("ui.approvalOnExpire")}</label>
          <select
            id="ax-${step.id}"
            data-field="on-expire"
            .value=${onExpire}
            @change=${(e4) => this.setDoc(
      patchStep(this.document, index, {
        on_expire: e4.target.value
      })
    )}
          >
            ${EXPIRY_POLICIES.map((p3) => option(p3, this.t(`ui.approvalOnExpire_${p3}`), onExpire))}
          </select>
        </div>
      </div>
      <!-- v1 is LINEAR and this pair is what replaces branching: continue + a guard on the
           decision composes approved / rejected / expired without a fork. It is said the moment
           «continue» is picked, which is when it becomes true. -->
      ${continues ? b2`<ok-inline-feedback tone="info" icon="git-branch-outline"
            >${this.t("ui.approvalContinueHint", { path: `steps.${step.id}.decision` })}</ok-inline-feedback
          >` : A}
      <span class="hint" data-field="approval-outputs"
        >${this.t("ui.approvalOutputsHint", { paths: approvalOutputs(step).join(", ") })}</span
      >
    `;
  }
  /** The `params` of a `command` or a `query` step: a name and a composed value per row. */
  renderParams(step, index) {
    const params = Object.entries(step.params ?? {});
    const setParams = (entries) => this.setDoc(patchStep(this.document, index, { params: Object.fromEntries(entries) }));
    return b2`
      <span class="eyebrow">${this.t("ui.paramsTitle")}</span>
      ${params.map(
      ([key2, value], i4) => b2`<div class="param-row">
          <div class="field">
            <label>${this.t("ui.paramName")}</label>
            <input
              type="text"
              .value=${key2}
              @change=${(e4) => setParams(
        params.map(
          (p3, j) => j === i4 ? [e4.target.value.trim(), p3[1]] : p3
        )
      )}
            />
          </div>
          <erp-flows-value
            .label=${this.t("ui.paramValue")}
            .parts=${valueToParts(value)}
            .fieldLabel=${this.fieldLabel}
            .insertLabel=${this.t("ui.insertField")}
            .removeLabel=${this.t("ui.removePart")}
            .canPickFields=${!!this.shape}
            @flows-value-change=${(e4) => setParams(params.map((p3, j) => j === i4 ? [p3[0], partsToValue(e4.detail.parts)] : p3))}
            @flows-pick-field=${(e4) => this.openPicker(e4.target, "input")}
          ></erp-flows-value>
          <button
            type="button"
            class="icon-btn"
            aria-label=${this.t("ui.removePart", { label: key2 })}
            @click=${() => setParams(params.filter((_2, j) => j !== i4))}
          >
            ×
          </button>
        </div>`
    )}
      <div class="adders" style="margin-left:0">
        <button type="button" data-act="add-param" @click=${() => setParams([...params, ["", ""]])}>
          ${this.t("ui.addParam")}
        </button>
      </div>
    `;
  }
  renderSpine() {
    return b2`<div class="spine">
        ${this.renderTriggerNode()}
        <ion-reorder-group
          .disabled=${false}
          @ionItemReorder=${(e4) => this.onReorder(e4)}
        >
          ${this.document.steps.map((step, i4) => this.renderStepNode(step, i4))}
        </ion-reorder-group>
        ${this.document.steps.length === 0 ? b2`<div class="node"><span class="hint">${this.t("ui.noSteps")}</span></div>` : A}
        <!-- Order is by how often a shop owner reaches for one, not by the kernel's enum. The read
             sits right before the guard because that is the pair it is used in (query → condition
             on found); the ai one is last because it is the one that costs money and the one that
             needs the most reading. -->
        <div class="adders">
          ${[
      ["command", "ui.addCommand"],
      ["query", "ui.addQuery"],
      ["condition", "ui.addGuard"],
      ["approval", "ui.addApproval"],
      ["delay", "ui.addDelay"],
      ["notify", "ui.addNotify"],
      ["http", "ui.addHttp"],
      ["ai", "ui.addAi"]
    ].map(
      ([kind, label]) => b2`<button
              type="button"
              data-add=${kind}
              @click=${() => this.add(kind)}
            >
              ${this.t(label)}
            </button>`
    )}
        </div>
      </div>`;
  }
  renderPermissions() {
    const missing = missingGrants(this.document, this.grants);
    return b2`<div class="list">
      <span class="hint">${this.t("ui.grantsIntro")}</span>
      ${missing.map(
      (g3) => b2`<div class="grant">
          <ok-status-pill tone="warning" label=${this.t("ui.grantsMissing")}></ok-status-pill>
          <span class="grow">${g3.value}</span>
        </div>`
    )}
      ${this.grants.map((g3) => this.renderGrant(g3))}
      ${!missing.length && !this.grants.length ? b2`<span class="muted">${this.t("ui.grantsNone")}</span>` : A}
      ${missing.length ? b2`<div class="adders" style="margin-left:0">
            <button type="button" @click=${() => void this.grantAll()}>${this.t("ui.grantAll")}</button>
          </div>` : A}
    </div>`;
  }
  /**
   * One permission this flow HOLDS, and what it is limited to.
   *
   * The limit reads on the row itself, not only inside the fold: an owner who granted «may cancel
   * appointments AS THE CUSTOMER» has to be able to read that back without opening anything, or
   * the screen describes a wider permission than the one that was given (hub#1623, flows#66).
   */
  renderGrant(g3) {
    const k2 = grantKey(g3);
    const limits = pinRows(g3).map(([field, value]) => `${field} = ${value}`).join(", ");
    const open = this.limitsOpen.includes(k2);
    return b2`<div class="grant-block" data-grant=${k2}>
      <div class="grant">
        <ok-status-pill tone="success" label=${this.t("ui.grantsGranted")}></ok-status-pill>
        <span class="grow"
          >${g3.kind === "command" ? g3.value : this.t("ui.grantOther", g3)}${limits ? b2` <em class="pinned">${this.t("ui.grantPinned", { limits })}</em>` : A}</span
        >
        <!-- Only a command grant carries a payload. Offered on any other kind the hub answers
             flow.invalid_grant_payload — and this endpoint replaces the WHOLE list, so it would
             not lose that row, it would lose every permission on the screen. -->
        ${canPinPayload(g3.kind) ? b2`<button
              type="button"
              class="icon-btn"
              data-act="limits"
              aria-expanded=${open ? "true" : "false"}
              @click=${() => this.toggleLimits(g3)}
            >
              ${this.t("ui.grantLimits")}
            </button>` : A}
        <button type="button" class="icon-btn" data-act="revoke" @click=${() => void this.revoke(g3)}>
          ${this.t("ui.revoke")}
        </button>
      </div>
      ${open ? this.renderLimits(g3) : A}
    </div>`;
  }
  /** The `field = value` pairs a granted action is pinned to — folded away until it is asked for. */
  renderLimits(g3) {
    const k2 = grantKey(g3);
    const id = k2.replace(/[^A-Za-z0-9]+/g, "-");
    const rows = this.limitRows(g3);
    const saving = this.savingLimits === k2;
    return b2`<div class="limits">
      <span class="hint">${this.t("ui.grantLimitsIntro")}</span>
      ${rows.length ? A : b2`<span class="muted">${this.t("ui.grantLimitsNone")}</span>`}
      ${rows.map(
      ([field, value], i4) => b2`<div class="param-row">
          <div class="field">
            <label for="pf-${id}-${i4}">${this.t("ui.grantLimitField")}</label>
            <input
              id="pf-${id}-${i4}"
              data-field="pin-name"
              type="text"
              .value=${field}
              @change=${(e4) => this.setLimitRows(
        g3,
        rows.map(
          (r6, j) => j === i4 ? [e4.target.value.trim(), r6[1]] : r6
        )
      )}
            />
          </div>
          <div class="field">
            <label for="pv-${id}-${i4}">${this.t("ui.grantLimitValue")}</label>
            <input
              id="pv-${id}-${i4}"
              data-field="pin-value"
              type="text"
              .value=${value}
              @change=${(e4) => this.setLimitRows(
        g3,
        rows.map((r6, j) => j === i4 ? [r6[0], e4.target.value] : r6)
      )}
            />
          </div>
          <button
            type="button"
            class="icon-btn"
            data-act="remove-limit"
            aria-label=${this.t("ui.grantLimitRemove", { field: field || this.t("ui.grantLimitField") })}
            @click=${() => this.setLimitRows(g3, rows.filter((_2, j) => j !== i4))}
          >
            ×
          </button>
        </div>`
    )}
      <div class="adders" style="margin-left:0">
        <button
          type="button"
          data-act="add-limit"
          @click=${() => this.setLimitRows(g3, [...rows, ["", ""]])}
        >
          ${this.t("ui.grantLimitAdd")}
        </button>
        <button
          type="button"
          data-act="save-limits"
          ?disabled=${saving}
          @click=${() => void this.saveLimits(g3)}
        >
          ${saving ? this.t("ui.saving") : this.t("ui.grantLimitsSave")}
        </button>
      </div>
    </div>`;
  }
  /**
   * **«Probar»: what this flow would do with the owner's own data — and it does none of it.**
   *
   * The two things flows#2 originally asked for were changes to the KERNEL, and the kernel is
   * frozen (ADR-0283). Checked against the code, not assumed: `POST …/flows/{id}/run` executes for
   * real (a «probar» that charged a test sale is worse than no button at all) and there is no
   * dry-run parameter anywhere in the runtime or the server. Nor is there any endpoint that
   * returns a real event payload — ADR-0312 refuses that on purpose, because handing a marketplace
   * module the last N payloads of any event is exporting the customer book with an editor on top.
   *
   * So this screen asks the hub for NOTHING beyond the event shape the picker already loads, and
   * runs the walk in {@link simulate}. Every sentence on it is about what WOULD happen.
   */
  renderPreview() {
    const built = inputFromShape(this.shape);
    const run2 = simulate(this.document, built.input);
    const missing = missingGrants(this.document, this.grants);
    const byId = new Map(this.document.steps.map((s4) => [s4.id, s4]));
    return b2`<div class="preview">
      <!-- First thing on the screen, and it stays there while it is read. Every other automation
           tool's «test» button runs the automation; an owner has every reason to assume this one
           does too, and the assumption is only expensive in one direction. -->
      <ok-inline-feedback tone="info" icon="eye-outline"
        >${this.t("ui.testNothingHappened")}</ok-inline-feedback
      >
      ${!built.hasRealData ? b2`<ok-inline-feedback tone="warning" icon="help-circle-outline"
            >${this.t("ui.testNoRealData")}</ok-inline-feedback
          >` : b2`<span class="hint"
            >${this.t("ui.testUsingReal", {
      event: this.eventLabel(this.trigger.event),
      count: this.shape?.samples ?? 0
    })}</span
          >`}
      ${run2.blanks ? b2`<ok-inline-feedback tone="warning" icon="alert-circle-outline"
            >${this.t(
      run2.blanks === 1 ? "ui.testBlanksFoundOne" : "ui.testBlanksFound",
      { count: run2.blanks }
    )}</ok-inline-feedback
          >` : A}
      ${!run2.triggerMatched ? b2`<div class="pstep" data-outcome="trigger-blocked">
            <span class="title">${this.t("ui.testTriggerBlocked")}</span>
            ${this.renderFailedClauses(run2.triggerCondition)}
          </div>` : A}
      ${run2.steps.map((step) => {
      const spec = byId.get(step.id);
      const refused = step.outcome === "would-run" && spec ? missing.filter((g3) => grantsForStep(spec).some((need) => need === `${g3.kind} ${g3.value}`)) : [];
      return b2`<div
          class="pstep"
          data-node-outcome=${step.id}
          data-outcome=${step.outcome}
        >
          <span class="title">${spec ? describeStep(spec, this.t) : step.kind}</span>
          ${step.outcome === "stops-here" ? b2`<span class="verdict">${this.t("ui.testStoppedIsWorking")}</span>` : A}
          ${step.outcome === "not-reached" ? b2`<span class="muted">${this.t("ui.testNotReached")}</span>` : A}
          ${step.pauses ? b2`<span class="verdict">${this.t("ui.testPausesHere")}</span>` : A}
          ${step.condition?.uncertain ? b2`<span class="verdict">${this.t("ui.testUncertain")}</span>` : A}
          ${step.outcome === "stops-here" ? this.renderFailedClauses(step.condition) : A}
          ${step.values.map(
        (value) => b2`<div class="pvalue" data-blank=${value.blank ? "true" : "false"}>
              <span class="pkey">${value.label}</span>
              <!-- The rendered line comes FIRST, even with a hole in it. «Gracias, Marta Ruiz. Te
                   esperamos en ␣» is what makes the fault obvious at a glance; replacing the whole
                   value with the words «would arrive empty» hides WHICH half went missing, which
                   is the only part the owner can act on. -->
              ${value.text ? b2`<span class="pval">${value.text}</span>` : A}
              ${value.blank ? b2`<span class="bad">${this.t("ui.testBlank")}</span>` : value.redacted ? b2`<span class="muted">${this.t("ui.testHidden")}</span>` : value.unknown ? b2`<span class="muted">${this.t("ui.testUnknown")}</span>` : A}
            </div>`
      )}
          ${refused.length ? b2`<span class="bad"
                >${this.t("ui.testWouldBeRefused", {
        what: refused.map((g3) => g3.value).join(", ")
      })}</span
              >` : A}
        </div>`;
    })}
    </div>`;
  }
  renderFailedClauses(condition) {
    if (!condition?.failed.length) return A;
    return b2`<ul class="clauses">
      ${condition.failed.map(
      (clause) => b2`<li>
          ${this.t("ui.testClauseFailed", {
        field: this.fieldLabel(clause.path),
        op: this.t(`ui.op${clause.op.charAt(0).toUpperCase()}${clause.op.slice(1)}`),
        expected: String(clause.expected)
      })}
        </li>`
    )}
    </ul>`;
  }
  async toggleRun(runId) {
    if (this.runSteps[runId] || !this.client) return;
    try {
      const detail = await this.client.flows.getRun(runId);
      this.runSteps = { ...this.runSteps, [runId]: detail?.steps ?? [] };
    } catch {
      this.runSteps = { ...this.runSteps, [runId]: [] };
    }
  }
  when(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return String(iso);
    return date.toLocaleString(this.client?.locale || "es", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  /**
   * What went wrong, said in the owner's words, with the next thing to do — and the kernel's own
   * sentence folded away underneath.
   *
   * The order is the whole point of flows#20: `step s2 failed: flow.grant_denied` is accurate and
   * useless to the person reading it hours later. A code as the headline is what makes somebody
   * phone support about a problem they could have fixed in two taps.
   */
  renderTrouble(run2) {
    const trouble = classify(run2.last_error);
    if (trouble.kind === "none") return A;
    return b2`<div class="trouble" data-trouble=${trouble.kind}>
      <!-- An unclassified error is a refusal from the module whose command ran («no hay stock
           suficiente»). That sentence is the actionable one, so it stays as the headline rather
           than being replaced by a generic story about a problem we do not understand. -->
      <span class="why"
        >${trouble.messageKey ? this.t(trouble.messageKey) : this.t("ui.ranFailed", { reason: trouble.technical })}</span
      >
      ${trouble.actionKey ? b2`<span class="do">${this.t(trouble.actionKey)}</span>` : A}
      ${trouble.messageKey ? b2`<details>
            <summary>${this.t("ui.troubleTechnical")}</summary>
            <code>${trouble.technical}</code>
          </details>` : A}
    </div>`;
  }
  renderRun(run2) {
    const outcome = runOutcome(run2, this.t);
    const steps = this.runSteps[String(run2.id)];
    const byId = new Map(this.document.steps.map((s4) => [s4.id, s4]));
    return b2`<div class="run" data-run=${String(run2.id ?? "")}>
      <div class="row" style="padding:0;gap:.5rem">
        <ok-status-pill tone=${outcome.tone} label=${outcome.label}></ok-status-pill>
        <span class="grow muted">${this.when(run2.started_at ?? run2.created_at)}</span>
        <!-- The reference, one tap away. It is the only thread that ties what the owner saw to
             what a log holds, and reading a uuid down a telephone is not a support channel. -->
        <button
          type="button"
          class="icon-btn"
          data-act="copy-run"
          aria-label=${this.t("ui.runCopyId")}
          title=${this.t("ui.runCopyId")}
          @click=${() => void this.copyRunId(String(run2.id ?? ""))}
        >
          ⧉
        </button>
        <button
          type="button"
          class="icon-btn"
          data-act="open-run"
          aria-expanded=${steps ? "true" : "false"}
          @click=${() => void this.toggleRun(String(run2.id))}
        >
          ▾
        </button>
      </div>
      ${this.renderTrouble(run2)}
      ${steps ? b2`<ul>
            ${steps.map(
      (s4) => b2`<li>
                ${describeRunStep(s4, this.t, byId.get(String(s4.step_id)))}
                ${stepSeconds(s4) !== void 0 ? b2`<span class="muted"> · ${this.t("ui.runTook", { seconds: stepSeconds(s4) })}</span>` : A}
              </li>`
    )}
          </ul>` : A}
    </div>`;
  }
  /**
   * The history, with **what is asking for somebody at the top**.
   *
   * A failure four rows down a list ordered by time is a failure nobody sees: the runs that worked
   * are the majority and they push it off the screen. Splitting the list is the cheapest version of
   * the tray flows#20 asks for that this module can actually build — the kernel's dead-letter has
   * no method on the flows surface at all (no retry, no discard, nothing to call), so a tray with
   * buttons would be a drawing of one.
   */
  renderHistory() {
    if (!this.runs.length) {
      return b2`<div class="list"><span class="muted">${this.t("ui.historyEmpty")}</span></div>`;
    }
    const broken = this.runs.filter(needsAttention);
    const rest = this.runs.filter((run2) => !needsAttention(run2));
    return b2`<div class="list">
      ${broken.length ? b2`<div data-attention>
            <h4 class="section">${this.t("ui.attentionTitle")}</h4>
            <span class="muted">${this.t("ui.attentionCount", { count: broken.length })}</span>
            ${broken.map((run2) => this.renderRun(run2))}
          </div>` : A}
      ${rest.map((run2) => this.renderRun(run2))}
    </div>`;
  }
  /** Puts the run's reference on the clipboard. A refusal costs the copy, never the screen. */
  async copyRunId(id) {
    if (!id) return;
    try {
      await navigator.clipboard?.writeText(id);
      this.notice = this.t("ui.runCopied");
    } catch {
    }
  }
  render() {
    return b2`
      <div class="head">
        <button
          type="button"
          class="icon-btn"
          aria-label=${this.t("ui.back")}
          @click=${() => this.dispatchEvent(new CustomEvent("flows-back", { bubbles: true, composed: true }))}
        >
          ←
        </button>
        <input
          class="name"
          type="text"
          .value=${this.name}
          placeholder=${this.t("ui.unnamed")}
          @input=${(e4) => {
      this.name = e4.target.value;
    }}
        />
        <ok-status-pill
          tone=${this.enabled ? "success" : "neutral"}
          label=${this.enabled ? this.t("ui.active") : this.t("ui.paused")}
        ></ok-status-pill>
        <ion-toggle
          .checked=${this.enabled}
          @ionChange=${(e4) => this.onEnable(!!e4.target.checked)}
        ></ion-toggle>
        <!-- «Probar» sits with the switch on purpose: it is the thing to press BEFORE turning an
             automation on, and a button on another tab is one nobody presses first. -->
        <ion-button
          size="small"
          fill="outline"
          data-act="test"
          @click=${() => {
      this.tab = "test";
    }}
        >
          ${this.t("ui.testRun")}
        </ion-button>
        <ion-button size="small" ?disabled=${this.saving} @click=${() => void this.save()}>
          ${this.saving ? this.t("ui.saving") : this.t("ui.save")}
        </ion-button>
      </div>

      <div class="tabs" role="tablist" @keydown=${(e4) => this.onTabKey(e4)}>
        ${TABS.map(
      (tab) => b2`<button
            type="button"
            role="tab"
            id=${`tab-${tab}`}
            aria-controls="tabpanel"
            aria-selected=${this.tab === tab ? "true" : "false"}
            tabindex=${this.tab === tab ? "0" : "-1"}
            @click=${() => {
        this.tab = tab;
      }}
          >
            ${this.t(`ui.tab${tab.charAt(0).toUpperCase()}${tab.slice(1)}`)}
          </button>`
    )}
      </div>

      <div class="body" role="tabpanel" id="tabpanel" aria-labelledby=${`tab-${this.tab}`}>
        ${this.error ? b2`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
              >${this.error}</ok-inline-feedback
            >` : A}
        ${this.notice ? b2`<ok-inline-feedback tone="success" icon="checkmark-circle-outline"
              >${this.notice}</ok-inline-feedback
            >` : A}
        ${this.enableWarning ? b2`<ok-inline-feedback tone="warning" icon="alert-circle-outline" data-enable-warning
              >${this.enableWarning}</ok-inline-feedback
            >` : A}
        ${this.renderDraftBanner()}
        ${this.tab === "editor" ? this.renderSpine() : this.tab === "test" ? this.renderPreview() : this.tab === "permissions" ? this.renderPermissions() : this.renderHistory()}
      </div>

      <erp-flows-field-picker
        .open=${this.pickerOpen}
        .shape=${this.shape}
        .root=${this.pickerRoot}
        .eventLabel=${this.eventLabel(this.trigger.event)}
        .t=${this.t}
        @flows-field-picked=${(e4) => this.onFieldPicked(e4)}
        @flows-picker-close=${() => {
      this.pickerOpen = false;
    }}
      ></erp-flows-field-picker>
    `;
  }
};
__decorateClass([
  n4({ attribute: false })
], ErpFlowsEditor.prototype, "client", 2);
__decorateClass([
  n4({ attribute: false })
], ErpFlowsEditor.prototype, "flow", 2);
__decorateClass([
  n4({ attribute: false })
], ErpFlowsEditor.prototype, "t", 2);
__decorateClass([
  n4({ attribute: false })
], ErpFlowsEditor.prototype, "draft", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "document", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "name", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "enabled", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "tested", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "enableWarning", 2);
__decorateClass([
  n4({ attribute: false })
], ErpFlowsEditor.prototype, "tab", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "openStep", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "grants", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "limitsOpen", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "pinDrafts", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "savingLimits", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "runs", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "runSteps", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "shape", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "eventCatalog", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "secrets", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "secretName", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "secretValue", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "error", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "notice", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "saving", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "pickerOpen", 2);
__decorateClass([
  r5()
], ErpFlowsEditor.prototype, "pickerRoot", 2);
define("erp-flows-editor", ErpFlowsEditor);

// ui/lib/templates.ts
var SECTORS = ["any", "beauty", "food"];
var SCHEMA_VERSION2 = 1;
function run(id, command, params) {
  return { id, kind: "command", command, params };
}
var TEMPLATES = [
  // ── Any business ────────────────────────────────────────────────────────────────────────────
  {
    id: "welcome-new-customer",
    sector: "any",
    icon: "happy-outline",
    nameKey: "tpl.welcome.name",
    summaryKey: "tpl.welcome.summary",
    plainKey: "tpl.welcome.plain",
    blanks: [{ labelKey: "tpl.welcome.blankWait", hintKey: "tpl.welcome.blankWaitHint" }],
    witnesses: [
      { event: "customer.created", module: "customers" },
      { event: "tasks.task.created", module: "tasks" }
    ],
    grantReasons: { "tasks.tasks.create": "tpl.grant.tasksCreate" },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [{ kind: "event", event: "customer.created" }],
      steps: [
        // A day, not a minute: the welcome call that lands while the customer is still walking out
        // of the door is the one nobody makes. The owner can change it — that is the blank.
        { id: "s1", kind: "delay", seconds: 86400 },
        run("s2", "tasks.tasks.create", {
          // `input.name` is the customer's name: `customer.created` carries the whole card at the
          // root (verified against a hub — there is no `customer.` prefix in this payload).
          title: t3("tpl.welcome.taskTitle"),
          priority: "medium"
        })
      ]
    })
  },
  {
    id: "note-big-sale",
    sector: "any",
    icon: "create-outline",
    nameKey: "tpl.bigSale.name",
    summaryKey: "tpl.bigSale.summary",
    plainKey: "tpl.bigSale.plain",
    blanks: [{ labelKey: "tpl.bigSale.blankAmount", hintKey: "tpl.bigSale.blankAmountHint" }],
    witnesses: [
      { event: "sale.completed", module: "sales" },
      { event: "customer.created", module: "customers" }
    ],
    grantReasons: { "customers.notes.add": "tpl.grant.customersNote" },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [{ kind: "event", event: "sale.completed" }],
      steps: [
        {
          id: "s1",
          kind: "condition",
          when: {
            // Both halves matter. Without a customer there is no card to write on, and the command
            // would fail on every anonymous ticket — which in a bar is most of them.
            "input.customer_id": { exists: true },
            // CENTS. `sale.completed.total` is an integer in cents (ADR-0123): 10000 = 100,00 €.
            // This is the single most likely thing for an owner to get wrong, so the blank says so.
            "input.total": { gte: 1e4 }
          }
        },
        run("s2", "customers.notes.add", {
          customer_id: "input.customer_id",
          content: t3("tpl.bigSale.noteContent"),
          author_name: t3("tpl.author")
        })
      ]
    })
  },
  /**
   * **R0 #7 — somebody joins the team → the checklist gets written** (flows#18).
   *
   * No field mapping, on purpose. `staff.member.created` is emitted by a declarative command and
   * this catalogue has not seen its payload against a real hub, so the task says what to do rather
   * than promising a name it might print as a row of hex. Same rule as `no-show-followup`.
   */
  {
    id: "new-staff-checklist",
    sector: "any",
    icon: "person-add-outline",
    nameKey: "tpl.newStaff.name",
    summaryKey: "tpl.newStaff.summary",
    plainKey: "tpl.newStaff.plain",
    blanks: [{ labelKey: "tpl.newStaff.blankList", hintKey: "tpl.newStaff.blankListHint" }],
    witnesses: [
      { event: "staff.member.created", module: "staff" },
      { event: "tasks.task.created", module: "tasks" }
    ],
    grantReasons: { "tasks.tasks.create": "tpl.grant.tasksCreate" },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [{ kind: "event", event: "staff.member.created" }],
      steps: [
        run("s1", "tasks.tasks.create", {
          title: t3("tpl.newStaff.taskTitle"),
          description: t3("tpl.newStaff.taskDescription"),
          priority: "high"
        })
      ]
    })
  },
  /**
   * **R0 #8 — somebody writes on WhatsApp → it does not sit there unanswered.**
   *
   * What this deliberately does NOT do is reply on its own. A reply costs money every time it is
   * sent, it goes to a person who did not agree to be written to by a machine, and getting it
   * wrong is the one mistake on this whole screen the owner cannot take back. So the automation
   * puts it in front of a human, fast, and the `notify` step is theirs to add if they want one —
   * which is the same line the guide draws about what the assistant will and will not propose.
   */
  {
    id: "whatsapp-answer",
    sector: "any",
    icon: "chatbubble-ellipses-outline",
    nameKey: "tpl.whatsapp.name",
    summaryKey: "tpl.whatsapp.summary",
    plainKey: "tpl.whatsapp.plain",
    blanks: [{ labelKey: "tpl.whatsapp.blankWho", hintKey: "tpl.whatsapp.blankWhoHint" }],
    witnesses: [
      { event: "whatsapp_inbox.message.received", module: "whatsapp_inbox" },
      { event: "tasks.task.created", module: "tasks" }
    ],
    grantReasons: { "tasks.tasks.create": "tpl.grant.tasksCreate" },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [
        {
          kind: "event",
          // The MODULE's event, not the core's — and it inherits the same two problems one hop
          // later (flows#67). `whatsapp_inbox._ingest_inbound_message` is a manifest listener on
          // `hub.whatsapp.message_received`, and a manifest listener has no mapping layer: the
          // relay hands the core payload straight to the command and the command's `emit` writes
          // that same bound payload to the outbox. So from hub#1621 this event carries the OWNER's
          // own replies, echoed back from the WhatsApp Business app on her phone, and the 180 days
          // of backlog Meta delivers the moment the number is connected. Unguarded that is a task
          // per message she types herself and a task per conversation anybody had in March — the
          // list this card exists to keep short, buried on the day the fleet updates.
          //
          // 🔴 `neq` and never `eq`, the SAME reason as the appointment pair below: those two
          // fields reach the event only from hub#1621, which no published tag carries (`v1.1.15`
          // is the newest). In the kernel an absent path is `Null` and `json_eq(Null, x)` is false
          // (`crates/runtime/src/flows/def.rs`), so an affirmative clause matches NOTHING on the
          // fleet as it stands — no run, no error, no log. We EXCLUDE what is bad; we never
          // REQUIRE what is good.
          //
          // No `event.text` clause on purpose. Its neighbour filters an empty body because every
          // reply IT sends is billed by Meta; this card only writes a task, and a customer who
          // sends a photo, a voice note or a location has written to the shop just as much as one
          // who types.
          event: "whatsapp_inbox.message.received",
          filter: {
            "event.direction": { neq: "outbound" },
            "event.source": { neq: "history" }
          }
        }
      ],
      steps: [
        run("s1", "tasks.tasks.create", {
          title: t3("tpl.whatsapp.taskTitle"),
          description: t3("tpl.whatsapp.taskDescription"),
          priority: "urgent"
        })
      ]
    })
  },
  /**
   * **R0 #12 — the till closes → somebody looks at the day before going home.**
   *
   * The version flows#18 asked for waits for the fiscal documents of that session to finish and
   * then sends a summary. The kernel cannot do the waiting: a flow is a straight line with no step
   * that parks until a correlated second event arrives, and `delay` counts from now rather than
   * until something happens. What is left, and what this is, is the part that works: the moment the
   * till closes, the check lands on somebody's list while the shop is still standing there.
   */
  {
    id: "cash-close-review",
    sector: "any",
    icon: "file-tray-full-outline",
    nameKey: "tpl.cashClose.name",
    summaryKey: "tpl.cashClose.summary",
    plainKey: "tpl.cashClose.plain",
    blanks: [{ labelKey: "tpl.cashClose.blankWho", hintKey: "tpl.cashClose.blankWhoHint" }],
    witnesses: [
      { event: "cash_register.session_closed", module: "cash_register" },
      { event: "tasks.task.created", module: "tasks" }
    ],
    grantReasons: { "tasks.tasks.create": "tpl.grant.tasksCreate" },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [{ kind: "event", event: "cash_register.session_closed" }],
      steps: [
        run("s1", "tasks.tasks.create", {
          title: t3("tpl.cashClose.taskTitle"),
          description: t3("tpl.cashClose.taskDescription"),
          priority: "high"
        })
      ]
    })
  },
  /**
   * **R0 #6 — the AEAT said no → somebody finds out without opening a screen** (flows#18).
   *
   * This is the one place in the product where NOT finding out has consequences before the tax
   * agency. Until verifactu#42 the module wrote its refusals into its own audit table and nothing
   * left: a row on a screen somebody has to open, and the bar that closes at two in the morning
   * does not open it. `verifactu.record.rejected` is that outcome leaving the module.
   *
   * **One name, four failures.** The event fires whether the AEAT refused the record, the wire
   * never carried it, the record could not say which tax agency owns it, or the XML failed the
   * schema — `reason` tells them apart. That is deliberate on the emitting side (a trigger picks
   * ONE event, and an owner who only gets the AEAT half has built the silent version of the alarm
   * they asked for), and it is exactly why this card **maps no field and names no cause**: a task
   * that says «la AEAT ha rechazado» would be wrong the day the failure was the connection. The
   * sentence says what is true of all four — an invoice is not registered — and where to look.
   *
   * A task and not a message, like every other card here: `notify` needs a channel grant, a
   * recipient grant and a configured transport, and a recipe that half-works on most hubs is worse
   * than one that works on all of them. It is also the right shape — a rejection needs somebody to
   * DO something, and a task is the thing that survives being read at a bad moment.
   */
  {
    id: "fiscal-rejection-alert",
    sector: "any",
    icon: "alert-circle-outline",
    nameKey: "tpl.fiscalRejected.name",
    summaryKey: "tpl.fiscalRejected.summary",
    plainKey: "tpl.fiscalRejected.plain",
    blanks: [
      { labelKey: "tpl.fiscalRejected.blankWho", hintKey: "tpl.fiscalRejected.blankWhoHint" }
    ],
    witnesses: [
      { event: "verifactu.record.rejected", module: "verifactu" },
      { event: "tasks.task.created", module: "tasks" }
    ],
    grantReasons: { "tasks.tasks.create": "tpl.grant.tasksCreate" },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [{ kind: "event", event: "verifactu.record.rejected" }],
      steps: [
        run("s1", "tasks.tasks.create", {
          title: t3("tpl.fiscalRejected.taskTitle"),
          description: t3("tpl.fiscalRejected.taskDescription"),
          // The one card in this gallery that is `urgent` rather than `high`: everything else here
          // is business that can wait a day, and this is a document the tax agency does not have.
          priority: "urgent"
        })
      ]
    })
  },
  /**
   * **R0 #5 — Friday evening → the week gets looked at.**
   *
   * flows#18 asked for the week's takings IN the message. The engine has no read step: v1 runs
   * commands, guards and waits, and there is no `query` step and no `query` grant, so nothing in a
   * flow can fetch a number to put in a sentence. Sending «here are your sales:» followed by
   * nothing would be worse than not sending it. So this books the review instead, on the evening
   * of the day the owner picks, and the figures are one tap away where they already live.
   */
  {
    id: "friday-week-review",
    sector: "any",
    icon: "stats-chart-outline",
    nameKey: "tpl.weekReview.name",
    summaryKey: "tpl.weekReview.summary",
    plainKey: "tpl.weekReview.plain",
    blanks: [{ labelKey: "tpl.weekReview.blankWhen", hintKey: "tpl.weekReview.blankWhenHint" }],
    witnesses: [{ event: "tasks.task.created", module: "tasks" }],
    grantReasons: { "tasks.tasks.create": "tpl.grant.tasksCreate" },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      // 18:00 on day 5 — Friday. Five-field cron, drawn as a clock by the editor: nobody types it.
      triggers: [{ kind: "cron", cron: "0 18 * * 5" }],
      steps: [
        run("s1", "tasks.tasks.create", {
          title: t3("tpl.weekReview.taskTitle"),
          description: t3("tpl.weekReview.taskDescription"),
          priority: "medium"
        })
      ]
    })
  },
  // ── Hair and beauty ─────────────────────────────────────────────────────────────────────────
  {
    id: "morning-agenda-check",
    sector: "beauty",
    icon: "sunny-outline",
    nameKey: "tpl.morning.name",
    summaryKey: "tpl.morning.summary",
    plainKey: "tpl.morning.plain",
    blanks: [{ labelKey: "tpl.morning.blankTime", hintKey: "tpl.morning.blankTimeHint" }],
    witnesses: [{ event: "tasks.task.created", module: "tasks" }],
    grantReasons: { "tasks.tasks.create": "tpl.grant.tasksCreate" },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      // 09:00 every day. The kernel reads five-field cron; the editor shows it as a clock.
      triggers: [{ kind: "cron", cron: "0 9 * * *" }],
      steps: [run("s1", "tasks.tasks.create", { title: t3("tpl.morning.taskTitle"), priority: "high" })]
    })
  },
  {
    id: "no-show-followup",
    sector: "beauty",
    icon: "call-outline",
    nameKey: "tpl.noShow.name",
    summaryKey: "tpl.noShow.summary",
    plainKey: "tpl.noShow.plain",
    blanks: [],
    witnesses: [
      { event: "appointments.appointment.no_show", module: "appointments" },
      { event: "tasks.task.created", module: "tasks" }
    ],
    grantReasons: { "tasks.tasks.create": "tpl.grant.tasksCreate" },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [{ kind: "event", event: "appointments.appointment.no_show" }],
      steps: [
        // No name in the title on purpose: this event carries `{appointment_id}` and nothing else
        // (verified against a hub). Promising «call Marta» and printing a row of hex would be worse
        // than a task that sends somebody to the diary.
        run("s1", "tasks.tasks.create", { title: t3("tpl.noShow.taskTitle"), priority: "urgent" })
      ]
    })
  },
  /**
   * **flows#52 — the message becomes a booking, which is the case the product is sold on.**
   *
   * This is the automation `whatsapp_inbox` has shipped since it learned to book
   * (`flows/appointment-from-whatsapp.{es,en}.flow.json`), brought into the gallery so that
   * somebody can actually pick it. Until now nothing installed it: the hub reads no `*.flow.json`
   * anywhere, so the only thing that ever created it was the module's own end-to-end test, and a
   * salon that connected its number and opened Automations found «make a task» and nothing else.
   *
   * ⚠️ **It is a MIRROR, and mirrors go stale.** The document below is
   * `whatsapp_inbox@89f8d02` (PR #69, the first half of whatsapp_inbox#58, on top of PR #63's
   * one-turn rewrite of #55), copied because
   * the two repositories cannot read each other and the hub has no route that serves a module's
   * own templates (the manifest has no `flows` key and `erplora pack` does not put the folder in
   * the zip — hub#1611 and module-toolkit#209). Retiring this copy — the runtime serving each
   * installed module's templates, and this gallery merging them — is the real fix. Until then the
   * copy is pinned in `templates.test.ts` by COMMIT (the module's version does not move on a
   * template change: v2.1.31 named both the old and the new document) and by a hash of the whole
   * document in both languages, so it cannot word a prompt differently, ask for a different
   * permission, or drift one iteration without going red. The commit is the thing to move when
   * whatsapp_inbox#58's second half and #61 rewrite it again — and they will: the template moves
   * every time the flow does. It went stale TWICE on the day it was written.
   *
   * **Why it needs five modules.** It reads the catalogue (`services`), the diary
   * (`appointments`), who works when (`staff`), the customer's card (`customers`), and it answers
   * through the conversation (`whatsapp_inbox`). A hub short of any of them cannot run it, which
   * is why the gallery hides it rather than offering it greyed out: a salon with no Reservations
   * has no use for whatsapp_inbox#60's table-booking twin either.
   */
  {
    id: "whatsapp-appointment",
    sector: "beauty",
    icon: "calendar-number-outline",
    nameKey: "tpl.waAppointment.name",
    summaryKey: "tpl.waAppointment.summary",
    plainKey: "tpl.waAppointment.plain",
    blanks: [
      { labelKey: "tpl.waAppointment.blankReply", hintKey: "tpl.waAppointment.blankReplyHint" }
    ],
    witnesses: [
      { event: "whatsapp_inbox.message.received", module: "whatsapp_inbox" },
      { event: "appointments.appointment.created", module: "appointments" },
      { event: "customer.created", module: "customers" },
      { event: "services.service.created", module: "services" },
      { event: "staff.member.created", module: "staff" }
    ],
    grantReasons: {
      whatsapp: "tpl.grant.notifyWhatsapp",
      "whatsapp_inbox.conversations.list#contact_phone": "tpl.grant.recipientWhatsapp",
      "customers.list": "tpl.grant.customersList",
      "customers.create": "tpl.grant.customersCreate",
      "services.services.list": "tpl.grant.servicesList",
      "staff.members.list": "tpl.grant.staffList",
      "staff.schedules.list_for_member": "tpl.grant.staffSchedules",
      "appointments.availability.day_opening": "tpl.grant.dayOpening",
      "appointments.availability.slots": "tpl.grant.availabilitySlots",
      "appointments.availability.check": "tpl.grant.availabilityCheck",
      "appointments.appointments.create": "tpl.grant.appointmentsCreate",
      "appointments.appointments.list_for_customer": "tpl.grant.appointmentsListForCustomer",
      "appointments.appointments.cancel": "tpl.grant.appointmentsCancel",
      "appointments.appointments.reschedule": "tpl.grant.appointmentsReschedule"
    },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [
        {
          kind: "event",
          // The CORE's own event (`crates/server/src/inbound_poll.rs`), not the module's: it is
          // what the published document waits for, and it carries the message itself. An empty
          // body is a sticker or a photo — there is nothing for a model to read, and every reply
          // this automation sends is billed by Meta.
          //
          // The other two clauses are what stop the automation answering things no customer ever
          // wrote (whatsapp_inbox#90). The poller asks the core for `?direction=all&source=all`, so
          // the event carries the owner's OWN replies echoed back from her phone — answered, the
          // salon is confirmed an appointment on its own number — and the 180 days of backlog Meta
          // hands over the moment the number is connected: everybody who wrote in March is
          // confirmed today.
          //
          // `neq` and not `eq`/`in` on purpose, and it is the SAME reason on both sides of this
          // mirror: `direction`, `source` and `contact` reach the event only from hub#1621, which
          // no published hub tag carries — `v1.1.15` is the newest, and it is the floor
          // whatsapp_inbox declares. In the kernel an absent path resolves to `Null` and
          // `json_eq(Null, x)` is false, so a filter written affirmatively matches NOTHING on a hub
          // at that floor: no run, no error, no log. Written as `neq`, `Null` passes — which is
          // exactly what such a core can serve (inbound only, live only). The affirmative form is
          // whatsapp_inbox#95, for when the floor rises.
          event: "hub.whatsapp.message_received",
          filter: {
            "event.text": { neq: "" },
            "event.direction": { neq: "outbound" },
            "event.source": { neq: "history" }
          },
          input: {
            from: "event.from",
            text: "event.text",
            wa_message_id: "event.wa_message_id",
            received_at: "event.received_at"
          }
        }
      ],
      steps: [
        // Answered in seconds, before anybody has read anything: the wait is what makes a customer
        // write to the salon next door. The recipient is resolved through the conversation, never
        // written into the document — a template that carried a phone number would text the wrong
        // person on every hub that installed it.
        {
          id: "acknowledge",
          kind: "notify",
          channel: "whatsapp",
          to: {
            query: "whatsapp_inbox.conversations.list",
            params: { f_wa_contact_id: "input.from" },
            field: "contact_phone"
          },
          template: "",
          vars: { text: t3("tpl.waAppointment.ackText") }
        },
        // whatsapp_inbox#103. The address book is searchable by NAME, so a model holding
        // `customers.list` resolves whoever a stranger's message names — «what has María got
        // booked?» → her id → her diary, written back to whoever asked. A `query` grant cannot pin
        // its params the way hub#1632 pins a command's, so the lookup LEAVES the model instead: a
        // `kind: query` step (hub#954) whose params the DOCUMENT maps, keyed on the one identity
        // WhatsApp vouched for. The only `customer_id` in the run is the number's own.
        {
          id: "find_customer",
          kind: "query",
          query: "customers.list",
          params: { f_phone: "+{{input.from}}" },
          result: "first",
          limit: 1
        },
        // `manual`: creating a customer card is a write, and it waits for a person. It no longer
        // SEARCHES — the step above already did, and its answer is in the prompt.
        {
          id: "know_the_customer",
          kind: "ai",
          prompt: t3("tpl.waAppointment.knowPrompt"),
          tools: { commands: ["customers.create"] },
          policy: "manual",
          max_iters: 4
        },
        // Resolved a second time because the step before it may have just CREATED the customer:
        // the first read answers «is she on file», this one carries the id that exists afterwards.
        {
          id: "resolve_customer",
          kind: "query",
          query: "customers.list",
          params: { f_phone: "+{{input.from}}" },
          result: "first",
          limit: 1
        },
        // `manual` again, and this is the one that matters: what it proposes waits in the tray
        // until somebody at the salon says yes. ONE turn asks the diary and proposes — the
        // availability operations only answer, and a `manual` step may read since hub#1595
        // (whatsapp_inbox#55 collapsed the former «gather, then propose» pair).
        //
        // It also CANCELS and MOVES (whatsapp_inbox#61, #74): the prompt decides first what the
        // message is asking for, and books, cancels or moves. Two steps would have cost either an
        // extra billed model turn or a second flow routed by keyword — and `Op::Contains` is
        // case-sensitive, ANDed and unnegatable, so «Cancela mi cita» would miss while the booking
        // flow fired anyway. The branches EXCLUDE each other, so the budget below is untouched:
        // booking chains up to nine calls, moving six and cancelling three.
        //
        // Moving is ONE call — `appointments.appointments.reschedule` — and never cancel-then-book:
        // that spends the cancellation the salon allows the customer, drops the appointment the
        // salon had in front of it, and leaves whoever wrote in order to KEEP their hour with
        // nothing when the second half fails. The id always comes out of
        // `appointments.appointments.list_for_customer`, because unlike cancelling this command
        // carries no `channel` and no `customer_id` (appointments 1.1.72), so nothing below it can
        // tell whose appointment it was handed.
        //
        // `max_iters` sits at the kernel's cap on purpose: the hub refuses a document above it, so
        // there is no margin — whoever lengthens the BOOKING chain adds a step instead.
        {
          id: "propose_appointment",
          kind: "ai",
          prompt: t3("tpl.waAppointment.proposePrompt"),
          tools: {
            queries: [
              "services.services.list",
              "staff.members.list",
              "staff.schedules.list_for_member",
              "appointments.appointments.list_for_customer"
            ],
            commands: [
              "appointments.availability.day_opening",
              "appointments.availability.slots",
              "appointments.availability.check",
              "appointments.appointments.create",
              "appointments.appointments.cancel",
              "appointments.appointments.reschedule"
            ]
          },
          policy: "manual",
          max_iters: 10,
          // whatsapp_inbox#67. Without this the kernel CANCELS the run at the rejection, and the
          // notify below — the only thing that ever speaks to the customer — is dead code: she was
          // told «we will confirm as soon as the salon opens» and then nothing came, forever.
          // `continue` hands the refusal to the step after it instead of ending the run.
          //
          // 🔴 Needs hub#1622 DEPLOYED. An `ai` step carrying `on_reject` on an older hub is not
          // degraded, it is refused whole (`flow.invalid_definition`), so this card would fail to
          // install rather than install without the reply.
          on_reject: "continue"
        },
        // whatsapp_inbox#67: the one step that knows how it ENDED, and the only author of what she
        // reads. It carries no tools on purpose — it cannot book, cancel or look anything up, so
        // there is nothing here for the salon to approve and nothing a customer's message could
        // talk it into doing. `approved` or nothing refused, it forwards the proposing step's
        // words untouched (the day, the hour and the professional live only there); `rejected`, it
        // writes a new message that says the time cannot be AND what she does next — answer here
        // with another day. A «no» with nothing after it is where she stops writing.
        {
          id: "reply_to_customer",
          kind: "ai",
          prompt: t3("tpl.waAppointment.replyPrompt"),
          policy: "manual",
          max_iters: 1
        },
        // whatsapp_inbox#58, first half: once the salon has decided, the customer hears about it —
        // on WhatsApp, in the words the step above wrote FOR them. Same recipient resolution as the
        // acknowledgement, so the two notifies cost one channel grant and one recipient grant, not
        // two of each. Not a text of ours to translate: it is the model's reply.
        {
          id: "confirm_to_customer",
          kind: "notify",
          channel: "whatsapp",
          to: {
            query: "whatsapp_inbox.conversations.list",
            params: { f_wa_contact_id: "input.from" },
            field: "contact_phone"
          },
          template: "",
          vars: { text: "{{steps.reply_to_customer.text}}" }
        }
      ]
    })
  },
  /**
   * **The same automation, with nobody watching** (whatsapp_inbox#58).
   *
   * The twin above proposes and waits: both model steps are `manual`, so every appointment sits in
   * the approval tray until somebody at the salon says yes. That is right for a shop with a person
   * at the counter and wrong for the one this card is for — a single hairdresser with both hands
   * busy, whose WhatsApp nobody reads until closing. For them the tray is not a safety net, it is
   * where appointments go to expire.
   *
   * So the two model steps are `auto`: the hub runs the write inside the turn
   * (`agent_runner.rs`), the appointment is in the diary before anyone reads the message, and the
   * customer is told so in the same breath. `approval_mode` in the module's own settings does NOT
   * do this — a request born `confirmed` can never be approved and nothing books it — which is why
   * the unattended mode is a second FAMILY and not a switch.
   *
   * **What does not change, and is the whole reason this is safe enough to ship:** the model never
   * chooses the hour. It may only book a start the customer asked for; if the message does not pin
   * down both a day and an hour it books nothing and answers with the slots that are really free.
   * With no person to catch it, a bot that picks the hour books people into times they cannot make.
   * That rule lives in the prompt — the kernel cannot tell «the hour they asked for» from «the hour
   * I chose» — and `whatsapp_inbox/tests/flow_templates.test.py::hour_choice_problems` is what
   * keeps it there, in both languages.
   *
   * **Install ONE of the two, never both.** They wait on the same event with the same filter, so a
   * hub with both books every incoming message twice. Neither the name nor the summary leaves that
   * to a README: the gallery says it on the card, and warns before it creates the second one.
   */
  {
    id: "whatsapp-appointment-unattended",
    sector: "beauty",
    // A calendar with a tick, against the twin's numbered calendar: this one is already booked.
    icon: "calendar-clear-outline",
    nameKey: "tpl.waAppointmentUnattended.name",
    summaryKey: "tpl.waAppointmentUnattended.summary",
    plainKey: "tpl.waAppointmentUnattended.plain",
    blanks: [
      {
        labelKey: "tpl.waAppointmentUnattended.blankReply",
        hintKey: "tpl.waAppointmentUnattended.blankReplyHint"
      }
    ],
    // The same five modules as the twin: it reads the catalogue, the diary, who works when and the
    // customer's card, and answers through the conversation.
    witnesses: [
      { event: "whatsapp_inbox.message.received", module: "whatsapp_inbox" },
      { event: "appointments.appointment.created", module: "appointments" },
      { event: "customer.created", module: "customers" },
      { event: "services.service.created", module: "services" },
      { event: "staff.member.created", module: "staff" }
    ],
    // The same thirteen, and deliberately not one more: running unattended is a reason to skip the
    // tray, never a reason to ask for a permission the attended twin does without.
    grantReasons: {
      whatsapp: "tpl.grant.notifyWhatsapp",
      "whatsapp_inbox.conversations.list#contact_phone": "tpl.grant.recipientWhatsapp",
      "customers.list": "tpl.grant.customersList",
      "customers.create": "tpl.grant.customersCreate",
      "services.services.list": "tpl.grant.servicesList",
      "staff.members.list": "tpl.grant.staffList",
      "staff.schedules.list_for_member": "tpl.grant.staffSchedules",
      "appointments.availability.day_opening": "tpl.grant.dayOpening",
      "appointments.availability.slots": "tpl.grant.availabilitySlots",
      "appointments.availability.check": "tpl.grant.availabilityCheck",
      "appointments.appointments.create": "tpl.grant.appointmentsCreate",
      "appointments.appointments.list_for_customer": "tpl.grant.appointmentsListForCustomer",
      "appointments.appointments.cancel": "tpl.grant.appointmentsCancel"
    },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [
        {
          kind: "event",
          // Same event and same filter as the twin — which is exactly why a hub must not run both,
          // the echo and the backlog included (whatsapp_inbox#90; the twin above carries the why).
          // This family matters most for it: it books without asking anybody, so an echo answered
          // here is an appointment in the diary, not just a message.
          event: "hub.whatsapp.message_received",
          filter: {
            "event.text": { neq: "" },
            "event.direction": { neq: "outbound" },
            "event.source": { neq: "history" }
          },
          input: {
            from: "event.from",
            text: "event.text",
            wa_message_id: "event.wa_message_id",
            received_at: "event.received_at"
          }
        }
      ],
      steps: [
        // Answered in seconds, and here it is the only thing that happens before the diary is
        // touched. Its wording promises no person: with this family there is not one.
        {
          id: "acknowledge",
          kind: "notify",
          channel: "whatsapp",
          to: {
            query: "whatsapp_inbox.conversations.list",
            params: { f_wa_contact_id: "input.from" },
            field: "contact_phone"
          },
          template: "",
          vars: { text: t3("tpl.waAppointmentUnattended.ackText") }
        },
        // whatsapp_inbox#103, and the family it was opened against: with `policy: "auto"` nothing
        // reads the model's work before the customer does, so «what has María got booked?» was one
        // name-search away from a stranger's diary being read out on WhatsApp. The lookup is a
        // deterministic `query` step now, keyed on the phone the message came from.
        {
          id: "find_customer",
          kind: "query",
          query: "customers.list",
          params: { f_phone: "+{{input.from}}" },
          result: "first",
          limit: 1
        },
        // `auto`: the customer card is created inside the turn, on the salon's real customer list.
        // The prompt says so in as many words — nobody checks this afterwards. It is handed the
        // answer of the read above and no way to run another.
        {
          id: "know_the_customer",
          kind: "ai",
          prompt: t3("tpl.waAppointmentUnattended.knowPrompt"),
          tools: { commands: ["customers.create"] },
          policy: "auto",
          max_iters: 4
        },
        // Read again after the create: this is the id the booking step is given.
        {
          id: "resolve_customer",
          kind: "query",
          query: "customers.list",
          params: { f_phone: "+{{input.from}}" },
          result: "first",
          limit: 1
        },
        // `auto`, and this is the step the whole family exists for: it books. Named
        // `book_appointment` and not `propose_appointment` because that is what it does — there is
        // no proposal and no tray. Same budget as the twin (the cap: booking chains up to nine
        // calls), same «decide first what they are asking for» branch that cancels instead of
        // booking when that is what the message says.
        //
        // 🔴 ONE tool fewer than the twin, on purpose: this family CANNOT MOVE an appointment
        // (13 grants, not 14 — whatsapp_inbox#74's scope cut). Cancelling can be bound to the
        // customer who is asking — `channel: "customer"` makes the handler compare the
        // appointment's `customer_id` with the one passed — but `appointments.appointments.reschedule`
        // has no such field (`additionalProperties: false` over `appointment_id`,
        // `start_datetime`, `duration_minutes`) and its handler never checks whose appointment it
        // is. `customers.list` searches by name, `list_for_customer` takes any `customer_id`: with
        // `policy: "auto"` the only thing between a customer and a stranger's hour is a paragraph
        // of prompt, which is exactly what hub#1623 says is NOT a control. The twin is `manual`,
        // so a person sees the move before it happens. Reopening this is appointments#142 (give
        // `reschedule` its `channel` + `customer_id`) and then whatsapp_inbox#103, in that order.
        {
          id: "book_appointment",
          kind: "ai",
          prompt: t3("tpl.waAppointmentUnattended.bookPrompt"),
          tools: {
            queries: [
              "services.services.list",
              "staff.members.list",
              "staff.schedules.list_for_member",
              "appointments.appointments.list_for_customer"
            ],
            commands: [
              "appointments.availability.day_opening",
              "appointments.availability.slots",
              "appointments.availability.check",
              "appointments.appointments.create",
              "appointments.appointments.cancel"
            ]
          },
          policy: "auto",
          max_iters: 10
        },
        // What the booking step wrote, sent as it is. With no approval in the middle this is the
        // customer's ONLY notice that the appointment exists, which is why the prompt ends by
        // demanding the words come in the same reply as the booking.
        {
          id: "confirm_to_customer",
          kind: "notify",
          channel: "whatsapp",
          to: {
            query: "whatsapp_inbox.conversations.list",
            params: { f_wa_contact_id: "input.from" },
            field: "contact_phone"
          },
          template: "",
          vars: { text: "{{steps.book_appointment.text}}" }
        }
      ]
    })
  },
  // ── Bars and restaurants ────────────────────────────────────────────────────────────────────
  /**
   * **The same automation the salon has, one module over: a table instead of a chair**
   * (whatsapp_inbox#60).
   *
   * A restaurant that connected its WhatsApp found the two cards of a hairdresser and nothing it
   * could use — «mesa para cuatro mañana a las nueve» was answered by nobody. The module has
   * published the recipe since whatsapp_inbox#60; this is that recipe, in the only catalogue a hub
   * reads, because `erplora pack` leaves `flows/` out of the zip (module-toolkit#209) and the hub
   * reads no `.flow.json` from an installed module (hub#1611). Without a card here the automation
   * is written, reviewed, merged, published — and unreachable.
   *
   * **What is NOT a second design.** The trigger, the four steps, the prompts and the nine
   * permissions are pinned against the ones the module publishes, by commit and by a hash of the
   * whole document in both languages, exactly like the appointment pair above.
   *
   * **One step fewer than the appointment twin, on purpose.** There is no `know_the_customer`:
   * `customer_id` is optional on a reservation, so the booking step looks the guest up with
   * `customers.list` and, when the restaurant does not have them, books the table on the name and
   * the phone they gave and creates NOBODY. One turn less, one write less, one permission less
   * than the salon's — an automation has no business adding people to a customer list at 3 AM.
   *
   * 🔴 **And it cannot change or cancel a table that already exists** — the reason the prompts say
   * «somebody from the restaurant will take care of it» instead of doing it.
   * `reservations.reservations.set_status` and `.update` are `additionalProperties: false` over
   * `{reservation_id, …}` with no `channel` and no `customer_id`, and the handler only validates
   * the state machine, never whose row it is; `reservations.reservations.list` filters
   * `guest_phone` with `like`, so any `reservation_id` is one query away. Handing those tools to a
   * model that answers a phone number would let a stranger move somebody else's table. It reopens
   * with ERPlora/reservations#50, the twin of appointments#140.
   */
  {
    id: "whatsapp-reservation",
    sector: "food",
    icon: "restaurant-outline",
    nameKey: "tpl.waReservation.name",
    summaryKey: "tpl.waReservation.summary",
    plainKey: "tpl.waReservation.plain",
    blanks: [
      { labelKey: "tpl.waReservation.blankReply", hintKey: "tpl.waReservation.blankReplyHint" }
    ],
    // Three modules, not five: it answers through the conversation (`whatsapp_inbox`), it writes
    // into the book (`reservations`) and it looks the guest up on the customer list
    // (`customers`). A restaurant without Reservations cannot run it, which is why the gallery
    // hides the card rather than offering it greyed out — the same rule that keeps the
    // hairdresser's appointment cards away from a bar.
    witnesses: [
      { event: "whatsapp_inbox.message.received", module: "whatsapp_inbox" },
      { event: "reservations.reservation.created", module: "reservations" },
      { event: "customer.created", module: "customers" }
    ],
    grantReasons: {
      whatsapp: "tpl.grant.notifyWhatsapp",
      "whatsapp_inbox.conversations.list#contact_phone": "tpl.grant.recipientWhatsapp",
      "customers.list": "tpl.grant.customersList",
      "reservations.settings.get": "tpl.grant.reservationsSettings",
      "reservations.timeslots.list": "tpl.grant.reservationsTimeslots",
      "reservations.slots.count_for": "tpl.grant.reservationsSlotsCount",
      "reservations.blocked_dates.on_date": "tpl.grant.reservationsBlockedDates",
      "reservations.reservations.create": "tpl.grant.reservationsCreate",
      "reservations.waitlist.create": "tpl.grant.reservationsWaitlistCreate"
    },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [
        {
          kind: "event",
          // The same event, the same filter and the same three `neq` as the appointment pair
          // above, copied rather than reinvented: `direction` and `source` only reach the event
          // from hub#1621, which no published hub tag carries, and in the kernel an absent path is
          // `Null` — so an affirmative filter matches NOTHING on a hub at the module's declared
          // floor, silently. The twin's card carries the long version of the why.
          event: "hub.whatsapp.message_received",
          filter: {
            "event.text": { neq: "" },
            "event.direction": { neq: "outbound" },
            "event.source": { neq: "history" }
          },
          input: {
            from: "event.from",
            text: "event.text",
            wa_message_id: "event.wa_message_id",
            received_at: "event.received_at"
          }
        }
      ],
      steps: [
        // Answered in seconds, before anybody at the restaurant has read anything. The recipient is
        // resolved through the conversation and never written into the document: a template
        // carrying a phone number would text the wrong person on every hub that installed it.
        {
          id: "acknowledge",
          kind: "notify",
          channel: "whatsapp",
          to: {
            query: "whatsapp_inbox.conversations.list",
            params: { f_wa_contact_id: "input.from" },
            field: "contact_phone"
          },
          template: "",
          vars: { text: t3("tpl.waReservation.ackText") }
        },
        // `manual`: it works out what is free and PROPOSES the table, and the write waits in the
        // approval tray until somebody at the restaurant says yes.
        //
        // `on_reject: "continue"` is not a detail — without it a «no» ends the run where it stands
        // and the guest, already told to expect an answer, never gets one (the twin's
        // whatsapp_inbox#67).
        // whatsapp_inbox#103, in the table families too: the guest is resolved from the number
        // the message came from, deterministically, before the model is asked anything. The
        // booking step no longer holds the address book, so it cannot look a stranger up by name.
        {
          id: "find_customer",
          kind: "query",
          query: "customers.list",
          params: { f_phone: "+{{input.from}}" },
          result: "first",
          limit: 1
        },
        {
          id: "book_table",
          kind: "ai",
          prompt: t3("tpl.waReservation.bookPrompt"),
          tools: {
            queries: [
              "reservations.settings.get",
              "reservations.timeslots.list",
              "reservations.slots.count_for",
              "reservations.blocked_dates.on_date"
            ],
            commands: ["reservations.reservations.create", "reservations.waitlist.create"]
          },
          policy: "manual",
          max_iters: 10,
          on_reject: "continue"
        },
        // The step that knows HOW the restaurant decided and writes what the guest actually reads.
        // No tools at all, and one iteration: it may only put the outcome of the step before it
        // into words — the booking words when nothing was refused, and a real «that table cannot
        // be, tell me another day» when it was.
        {
          id: "reply_to_customer",
          kind: "ai",
          prompt: t3("tpl.waReservation.replyPrompt"),
          policy: "manual",
          max_iters: 1
        },
        // What that step wrote, sent as it is.
        {
          id: "confirm_to_customer",
          kind: "notify",
          channel: "whatsapp",
          to: {
            query: "whatsapp_inbox.conversations.list",
            params: { f_wa_contact_id: "input.from" },
            field: "contact_phone"
          },
          template: "",
          vars: { text: "{{steps.reply_to_customer.text}}" }
        }
      ]
    })
  },
  /**
   * **The same table booking, with nobody watching** (whatsapp_inbox#60).
   *
   * The twin above proposes and waits: the write sits in the approval tray until somebody at the
   * restaurant says yes. That is right for a place with somebody at the pass and wrong for the one
   * this card is for — the bar whose WhatsApp nobody reads until service is over, where the tray is
   * not a safety net but where bookings go to expire.
   *
   * So the booking step is `auto`: the table is in the book inside the turn and the guest is told
   * so in the same breath.
   *
   * **What does not change, and is the whole reason this is safe enough to ship:** the model never
   * chooses the hour NOR how many people are coming. It may only book a time the guest asked for,
   * for the number they said; if the message does not pin down the day, the time AND the party
   * size, it books nothing and answers with what is really free. With no person to catch it, a bot
   * that picks the hour seats people while the kitchen is shut, and one that guesses the party size
   * seats four at a table for two — both found out at the door, in front of the other guests. That
   * rule lives in the prompt, in both languages, and
   * `whatsapp_inbox/tests/flow_templates.test.py::hour_choice_problems` is what keeps it there.
   *
   * **Install ONE of the two, never both.** They wait on the same event with the same filter, so a
   * hub running both books every incoming message twice — and the gallery warns before it creates
   * the second one.
   */
  {
    id: "whatsapp-reservation-unattended",
    sector: "food",
    // A bookmark against the twin's table setting: this one is already held.
    icon: "bookmark-outline",
    nameKey: "tpl.waReservationUnattended.name",
    summaryKey: "tpl.waReservationUnattended.summary",
    plainKey: "tpl.waReservationUnattended.plain",
    blanks: [
      {
        labelKey: "tpl.waReservationUnattended.blankReply",
        hintKey: "tpl.waReservationUnattended.blankReplyHint"
      }
    ],
    // Three modules, not five: it answers through the conversation (`whatsapp_inbox`), it writes
    // into the book (`reservations`) and it looks the guest up on the customer list
    // (`customers`). A restaurant without Reservations cannot run it, which is why the gallery
    // hides the card rather than offering it greyed out — the same rule that keeps the
    // hairdresser's appointment cards away from a bar.
    witnesses: [
      { event: "whatsapp_inbox.message.received", module: "whatsapp_inbox" },
      { event: "reservations.reservation.created", module: "reservations" },
      { event: "customer.created", module: "customers" }
    ],
    // The same nine as the twin, and deliberately not one more: running unattended is a reason to
    // skip the tray, never a reason to ask for a permission the attended twin does without.
    grantReasons: {
      whatsapp: "tpl.grant.notifyWhatsapp",
      "whatsapp_inbox.conversations.list#contact_phone": "tpl.grant.recipientWhatsapp",
      "customers.list": "tpl.grant.customersList",
      "reservations.settings.get": "tpl.grant.reservationsSettings",
      "reservations.timeslots.list": "tpl.grant.reservationsTimeslots",
      "reservations.slots.count_for": "tpl.grant.reservationsSlotsCount",
      "reservations.blocked_dates.on_date": "tpl.grant.reservationsBlockedDates",
      "reservations.reservations.create": "tpl.grant.reservationsCreate",
      "reservations.waitlist.create": "tpl.grant.reservationsWaitlistCreate"
    },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [
        {
          kind: "event",
          // The same event, the same filter and the same three `neq` as the appointment pair
          // above, copied rather than reinvented: `direction` and `source` only reach the event
          // from hub#1621, which no published hub tag carries, and in the kernel an absent path is
          // `Null` — so an affirmative filter matches NOTHING on a hub at the module's declared
          // floor, silently. The twin's card carries the long version of the why.
          event: "hub.whatsapp.message_received",
          filter: {
            "event.text": { neq: "" },
            "event.direction": { neq: "outbound" },
            "event.source": { neq: "history" }
          },
          input: {
            from: "event.from",
            text: "event.text",
            wa_message_id: "event.wa_message_id",
            received_at: "event.received_at"
          }
        }
      ],
      steps: [
        // Answered in seconds, and here it is the only thing that happens before the book is
        // touched. Its wording promises no person: with this family there is not one.
        {
          id: "acknowledge",
          kind: "notify",
          channel: "whatsapp",
          to: {
            query: "whatsapp_inbox.conversations.list",
            params: { f_wa_contact_id: "input.from" },
            field: "contact_phone"
          },
          template: "",
          vars: { text: t3("tpl.waReservationUnattended.ackText") }
        },
        // `auto`, and this is the step the whole family exists for: it books. Same tools and same
        // budget as the twin, and no `on_reject` because there is nobody to reject anything.
        //
        // There is no `reply_to_customer` after it either — with no approval in the middle there is
        // no outcome to translate, so the booking step writes the guest's words itself and the
        // prompt ends by demanding they come in the SAME reply as the booking: a table booked with
        // no words leaves the guest with nothing.
        // whatsapp_inbox#103. Same deterministic resolution as the twin, and here it is the only
        // one there is: with `policy: "auto"` the step's answer goes straight to the guest, so a
        // model that could search by name could read a stranger's booking out loud.
        {
          id: "find_customer",
          kind: "query",
          query: "customers.list",
          params: { f_phone: "+{{input.from}}" },
          result: "first",
          limit: 1
        },
        {
          id: "book_table",
          kind: "ai",
          prompt: t3("tpl.waReservationUnattended.bookPrompt"),
          tools: {
            queries: [
              "reservations.settings.get",
              "reservations.timeslots.list",
              "reservations.slots.count_for",
              "reservations.blocked_dates.on_date"
            ],
            commands: ["reservations.reservations.create", "reservations.waitlist.create"]
          },
          policy: "auto",
          max_iters: 10
        },
        // What the booking step wrote, sent as it is: with no approval in the middle this is the
        // guest's ONLY notice that the table exists.
        {
          id: "confirm_to_customer",
          kind: "notify",
          channel: "whatsapp",
          to: {
            query: "whatsapp_inbox.conversations.list",
            params: { f_wa_contact_id: "input.from" },
            field: "contact_phone"
          },
          template: "",
          vars: { text: "{{steps.book_table.text}}" }
        }
      ]
    })
  },
  {
    id: "big-party-reservation",
    sector: "food",
    icon: "people-outline",
    nameKey: "tpl.bigParty.name",
    summaryKey: "tpl.bigParty.summary",
    plainKey: "tpl.bigParty.plain",
    blanks: [{ labelKey: "tpl.bigParty.blankSize", hintKey: "tpl.bigParty.blankSizeHint" }],
    witnesses: [
      { event: "reservations.reservation.created", module: "reservations" },
      { event: "tasks.task.created", module: "tasks" }
    ],
    grantReasons: { "tasks.tasks.create": "tpl.grant.tasksCreate" },
    build: (t3) => ({
      schema_version: SCHEMA_VERSION2,
      triggers: [{ kind: "event", event: "reservations.reservation.created" }],
      steps: [
        { id: "s1", kind: "condition", when: { "input.party_size": { gte: 6 } } },
        // `guest_name`, `party_size`, `date` and `time` all travel in this event — checked against
        // a real payload, not guessed from the create schema.
        run("s2", "tasks.tasks.create", {
          title: t3("tpl.bigParty.taskTitle"),
          description: t3("tpl.bigParty.taskDescription"),
          priority: "high"
        })
      ]
    })
  }
];
function templateTriggerEvent(template, t3) {
  const trigger = template.build(t3).triggers[0];
  return trigger?.kind === "event" && typeof trigger.event === "string" ? trigger.event : null;
}
function triggerEventsOf(definition) {
  const triggers = definition?.triggers;
  if (!Array.isArray(triggers)) return [];
  return triggers.map((trigger) => trigger?.event).filter((event) => typeof event === "string");
}
function readsAsCron(cron) {
  if (typeof cron !== "string") return false;
  const fields = cron.trim().split(/\s+/).filter(Boolean);
  return fields.length === 5 && fields.every((field) => CRON_FIELD.test(field));
}
function hasSchedule(definition) {
  const triggers = definition?.triggers;
  if (!Array.isArray(triggers)) return false;
  return triggers.some((raw) => {
    const trigger = raw;
    return trigger?.kind === "cron" && readsAsCron(trigger.cron);
  });
}
function templateIsScheduled(template, t3) {
  const trigger = template.build(t3).triggers[0];
  return trigger?.kind === "cron" && readsAsCron(trigger.cron);
}
function sameValue(a3, b3) {
  if (a3 === b3) return true;
  if (a3 === null || b3 === null || typeof a3 !== "object" || typeof b3 !== "object") return false;
  if (Array.isArray(a3) !== Array.isArray(b3)) return false;
  const keys = Object.keys(a3);
  if (keys.length !== Object.keys(b3).length) return false;
  return keys.every(
    (key2) => Object.prototype.hasOwnProperty.call(b3, key2) && sameValue(a3[key2], b3[key2])
  );
}
function seededSteps(template, t3) {
  return template.build(t3).steps.filter((step) => step.kind === "command" && typeof step.command === "string").map((step) => ({
    command: step.command,
    params: step.params ?? {}
  }));
}
function carriesSeededSteps(definition, seeded) {
  if (!seeded.length) return false;
  const steps = definition?.steps;
  if (!Array.isArray(steps)) return false;
  return seeded.every(
    (want) => steps.some((raw) => {
      const step = raw;
      if (step?.kind !== "command" || step.command !== want.command) return false;
      const params = step.params ?? {};
      return Object.entries(want.params).every(([key2, value]) => sameValue(params[key2], value));
    })
  );
}
function isCandidateFor(template, t3, flow) {
  const definition = flow.definition ?? {};
  const event = templateTriggerEvent(template, t3);
  if (event) return triggerEventsOf(definition).includes(event);
  if (!templateIsScheduled(template, t3)) return false;
  return hasSchedule(definition) && carriesSeededSteps(definition, seededSteps(template, t3));
}
function flowsOnSameTrigger(template, t3, flows) {
  const event = templateTriggerEvent(template, t3);
  if (!event) return [];
  return flows.filter((flow) => flow.enabled !== false && triggerEventsOf(flow.definition ?? {}).includes(event)).map((flow) => flow.name);
}
function templateCommands(template, t3) {
  return templateGrants(template, t3).filter((grant) => grant.kind === "command").map((grant) => grant.value);
}
var CRON_FIELD = /^[*\d,\-/]+$/;
function templateInstallation(template, t3, flows) {
  const listening = flows.filter((flow) => isCandidateFor(template, t3, flow));
  const commands = templateCommands(template, t3);
  const mine = listening.filter((flow) => flow.commands?.some((held) => commands.includes(held)));
  if (mine.length) {
    const running = mine.find((flow) => flow.enabled !== false);
    return running ? { state: "active", flow: running } : { state: "paused", flow: mine[0] };
  }
  const halfBuilt = listening.find((flow) => flow.commands?.length === 0);
  return halfBuilt ? { state: "unfinished", flow: halfBuilt } : { state: "absent" };
}
function flowsWorthAsking(flows, t3) {
  return flows.filter((flow) => TEMPLATES.some((template) => isCandidateFor(template, t3, flow)));
}
function templateById(id) {
  return TEMPLATES.find((tpl) => tpl.id === id);
}
function templatesOf(sector) {
  return TEMPLATES.filter((tpl) => tpl.sector === sector);
}
function buildTemplate(template, t3) {
  return template.build(t3);
}
function templateGrants(template, t3) {
  return requiredGrants(buildTemplate(template, t3));
}
function missingModules(template, known) {
  const out = [];
  for (const witness of template.witnesses) {
    if (known[witness.event] === false && !out.includes(witness.module)) out.push(witness.module);
  }
  return out;
}
function availableTemplates(sector, known) {
  return templatesOf(sector).filter((tpl) => missingModules(tpl, known).length === 0);
}
function unavailableModules(known) {
  const out = [];
  for (const template of TEMPLATES) {
    for (const id of missingModules(template, known)) {
      if (!out.includes(id)) out.push(id);
    }
  }
  return out;
}
var MODULE_LABELS = {
  appointments: "ui.mod_appointments",
  cash_register: "ui.mod_cash_register",
  customers: "ui.mod_customers",
  reservations: "ui.mod_reservations",
  sales: "ui.mod_sales",
  services: "ui.mod_services",
  staff: "ui.mod_staff",
  tasks: "ui.mod_tasks",
  verifactu: "ui.mod_verifactu",
  whatsapp_inbox: "ui.mod_whatsapp_inbox"
};
function moduleName(id, t3) {
  const key2 = MODULE_LABELS[id];
  return key2 ? t3(key2) : id;
}

// ui/components/erp-flows-gallery/erp-flows-gallery.ts
function templateFromSearch(search) {
  const id = new URLSearchParams(search).get("template") ?? "";
  return templateById(id) ? id : "";
}
var isCommandGrant = (row) => typeof row === "object" && row !== null && row.kind === "command" && typeof row.value === "string";
var ErpFlowsGallery = class extends i3 {
  constructor() {
    super(...arguments);
    this.client = null;
    this.t = (k2) => k2;
    this.picked = null;
    this.known = {};
    this.existing = [];
    this.busy = false;
    this.error = "";
    /**
     * The card the last shortcut named, so {@link reveal} knows what to bring on screen once it
     * exists.
     *
     * A shortcut is served on every NAVIGATION that names it — mount and `popstate` — and never on a
     * render: the URL says where the owner was sent, not what the screen must keep showing, and
     * re-reading it on every render is how a card becomes impossible to close. It is served again on
     * the same address on purpose: the shell keeps this element alive when the owner leaves the
     * module (`ModuleView.vue`, hub#1099) and only re-creates it when `route.fullPath` changes, so
     * the second tap on the same «Set it up» reaches this same instance through `popstate`, with
     * the same URL. Ignoring it would be the original complaint again.
     */
    this.linked = "";
    /** The linked card, once it has been brought on screen. Reset each time a shortcut is served. */
    this.revealed = "";
    /**
     * The client this screen has already asked, so it is not asked the same thing twice (flows#69).
     *
     * Opening Automations used to cost two of everything — the flow list, the shape of every witness
     * event, and one grants call per candidate — because the load runs on connect AND on the first
     * render, where `client` going from nothing to the shell's client counts as a change. Both are
     * needed: the shell may hand the client over before this element is on screen or after, and
     * dropping either half leaves one of those two orders never loading at all.
     *
     * So the guard is «have I already asked THIS client», not «did the property change». It also
     * covers the other way a parent re-render reaches here: lit calls `updated` for a property set
     * to the very same object again.
     */
    this.asked = null;
    this.onPopState = () => this.followShortcut();
  }
  static {
    this.styles = i`
    :host {
      display: block;
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
    }
    /* Fluid, not capped: the gallery fills the box the screen hands it — the same box the
       «Nueva automatización» bar sits in — so the cards and the CTA read as one screen. The old
       44rem cap spent 704px of a 1144px host, 220px dead on each side (flows#40). */
    .wrap {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .lede {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .lede p {
      flex: 1 1 16rem;
      /* The wrap is fluid now; a sentence still reads best under ~70 characters, so the lede
         keeps a reading measure even on a 1440px screen. */
      max-width: 46rem;
      margin: 0;
      color: var(--ok-muted, #6b6a63);
      font-size: 0.92rem;
      line-height: 1.5;
    }
    .link {
      font: inherit;
      font-size: 0.9rem;
      background: transparent;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      color: inherit;
      cursor: pointer;
      padding: 0 0.9rem;
      min-height: 2.5rem;
    }
    h3 {
      margin: 0.5rem 0 0;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
      font-weight: 600;
    }
    /* The workspace's own card recipe (kitchen's tickets, customers' cards): auto-fill with a
       card minimum. 3 columns at 1440, 2 at 834, 1 at 390 — the cards get wider, never a wider
       margin. */
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
      gap: 0.75rem;
    }
    /* Below 480px the 20rem minimum no longer fits the container (a 320px screen leaves ~290px),
       and an auto-fill that cannot fit pushes its track off the edge instead of wrapping. One
       column is what a phone showed before this grid existed — the 390px design stays put. */
    @media (max-width: 480px) {
      .cards {
        grid-template-columns: 1fr;
      }
    }
    .card {
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      overflow: hidden;
    }
    .card > button.pick {
      display: flex;
      align-items: flex-start;
      gap: 0.7rem;
      width: 100%;
      box-sizing: border-box;
      text-align: left;
      background: transparent;
      border: 0;
      color: inherit;
      font: inherit;
      cursor: pointer;
      /* A finger on the counter tablet, not a mouse. */
      padding: 0.8rem 0.75rem;
      min-height: 3.5rem;
    }
    .card ion-icon {
      font-size: 1.4rem;
      flex: 0 0 auto;
      margin-top: 0.1rem;
      color: var(--ok-primary, var(--ion-color-primary, #3880ff));
    }
    .grow {
      flex: 1 1 auto;
      min-width: 0;
    }
    /* «Active» / «Paused» / «Unfinished» on a card this hub already runs (flows#60): beside the
       name, never squeezing it — the summary is what the owner reads to recognise the card. */
    .card ok-status-pill {
      flex: 0 0 auto;
      margin-top: 0.1rem;
    }
    .name {
      display: block;
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .summary {
      display: block;
      margin-top: 0.15rem;
      font-size: 0.88rem;
      line-height: 1.45;
      color: var(--ok-muted, #6b6a63);
      overflow-wrap: anywhere;
    }
    .panel {
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.02));
    }
    .panel .plain {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .block > .head {
      display: block;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
      margin-bottom: 0.3rem;
    }
    .item {
      display: flex;
      gap: 0.5rem;
      padding: 0.45rem 0;
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.06));
    }
    .item:first-of-type {
      border-top: 0;
    }
    .item .label {
      display: block;
      font-weight: 600;
      font-size: 0.9rem;
      overflow-wrap: anywhere;
    }
    .item .hint {
      display: block;
      font-size: 0.85rem;
      line-height: 1.45;
      color: var(--ok-muted, #6b6a63);
      overflow-wrap: anywhere;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
    }
    .muted {
      color: var(--ok-muted, #6b6a63);
      font-size: 0.88rem;
      line-height: 1.45;
    }
    /* The one line that replaced the grey cards (flows#52): under everything, because it is about
       what is NOT on the screen. */
    .missing {
      margin: 0;
      color: var(--ok-muted, #6b6a63);
      font-size: 0.88rem;
      line-height: 1.45;
    }
  `;
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("popstate", this.onPopState);
    this.followShortcut();
    this.load();
  }
  /** Everything this screen asks the hub when it opens, asked once per client. */
  load() {
    const client = this.client;
    if (!client || client === this.asked) return;
    this.asked = client;
    void this.probe();
    void this.loadExisting();
  }
  disconnectedCallback() {
    window.removeEventListener("popstate", this.onPopState);
    super.disconnectedCallback();
  }
  updated(changed) {
    if (changed.has("client")) this.load();
    this.reveal();
  }
  /**
   * Opens the card a shortcut named (flows#56).
   *
   * Everything that is not a card of this catalogue — no parameter, an id that was retired, a hub
   * whose shell hands out no URL at all — leaves the gallery exactly as it was. That is the whole
   * error handling this deserves, and it is deliberate: the fallback IS the screen the owner
   * expected before shortcuts existed.
   */
  followShortcut() {
    let id = "";
    try {
      id = templateFromSearch(window.location.search);
    } catch {
      return;
    }
    if (!id) return;
    this.linked = id;
    this.revealed = "";
    this.picked = id;
    this.error = "";
    this.requestUpdate();
  }
  /**
   * Scrolls the linked card into view once it is actually rendered.
   *
   * It is not on screen at mount time: the gallery hides every card whose modules this hub cannot
   * prove it has, and that answer arrives one round trip later (`probe`). And «opened» is not
   * «found» — the gallery sits under however many automations the business already has, so a card
   * opened below the fold looks like a screen that ignored the tap, which is the complaint this
   * whole change answers. If the probe ends up hiding the card, there is nothing to scroll to and
   * the plain gallery is the answer.
   */
  reveal() {
    if (!this.linked || this.revealed === this.linked) return;
    const card = this.renderRoot.querySelector(`[data-template="${this.linked}"]`);
    if (!card) return;
    this.revealed = this.linked;
    card.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }
  /**
   * The hub's own flows, read once, only to warn about a trigger that is already taken.
   *
   * Swallowed on failure ON PURPOSE, and this is the whole of the error handling: the warning is a
   * courtesy, the catalogue is the screen. A hub that cannot answer `flows.list()` — offline, a
   * blip, an older core — must still show every card. What it must never do is turn a missing
   * warning into an error message, because that reads as «the gallery is broken» for a feature the
   * owner did not ask for.
   */
  async loadExisting() {
    const client = this.client;
    if (!client?.flows?.list) return;
    let flows;
    try {
      flows = await client.flows.list();
    } catch {
      return;
    }
    this.existing = flows.map((flow) => ({
      ...flow,
      // Carried through on purpose: a paused flow does not fire, so it is not a collision.
      definition: flow.definition ?? {}
    }));
    await this.loadGrants(flows);
  }
  /**
   * What each candidate flow is ALLOWED to do — the other half of «is this card already installed»
   * (flows#60).
   *
   * Asked only about the flows that could be one of these cards — waiting on a catalogue event,
   * or coming round on a catalogue cadence (flows#68) — so a hub with
   * nothing automated pays nothing and a busy one pays for a handful, instead of a question per
   * card on every visit. Swallowed on failure, one flow at a time: an unanswered flow stays
   * `undefined` — «not asked» — and its card keeps the invitation it had before this existed,
   * which is the behaviour to fall back to and never an error on the catalogue.
   */
  async loadGrants(flows) {
    const read = this.client?.flows?.grants;
    if (typeof read !== "function") return;
    const candidates = flowsWorthAsking(flows, this.t);
    if (!candidates.length) return;
    const held = await Promise.all(
      candidates.map(async (flow) => {
        try {
          const grants = await read.call(this.client?.flows, flow.id);
          if (!Array.isArray(grants)) return null;
          return [flow.id, grants.filter(isCommandGrant).map((g3) => g3.value)];
        } catch {
          return null;
        }
      })
    );
    const byId = new Map(held.filter((row) => row !== null));
    if (!byId.size) return;
    this.existing = this.existing.map(
      (flow) => byId.has(flow.id) ? { ...flow, commands: byId.get(flow.id) } : flow
    );
  }
  /** How far this hub has got with one card, and the flow to hand over when it has one. */
  installationOf(template) {
    return templateInstallation(template, this.t, this.existing);
  }
  /**
   * Hands the owner the automation they already have, instead of making them a second one.
   *
   * The screen that owns the editor does the opening: this element is the catalogue, and the flow
   * it points at is a flow like any other — the one difference is where it lands, and a half-built
   * one lands on Permissions, which is the only thing it is missing.
   */
  view(template) {
    const installed = this.installationOf(template);
    if (!installed.flow) return;
    this.dispatchEvent(
      new CustomEvent("flows-open-flow", {
        detail: { flow: installed.flow, needsGrants: installed.state === "unfinished" },
        bubbles: true,
        composed: true
      })
    );
  }
  /**
   * Asks the hub, once per distinct event, whether it has ever heard of it.
   *
   * A `not_found` is the only answer that means «this module is not installed». Anything else —
   * a network blip, a hub that refused for another reason — leaves the event unknown, because
   * greying a card out on a transient error tells the owner their hub is missing something it has.
   */
  async probe() {
    const client = this.client;
    if (!client?.events) return;
    const events = [...new Set(SECTORS.flatMap((s4) => templatesOf(s4)).flatMap((tpl) => tpl.witnesses.map((w2) => w2.event)))];
    await Promise.all(
      events.filter((event) => this.known[event] === void 0).map(async (event) => {
        try {
          await client.events.shape(event);
          this.known = { ...this.known, [event]: true };
        } catch (e4) {
          if (errorCode(e4) === "not_found") this.known = { ...this.known, [event]: false };
        }
      })
    );
  }
  /** Expands one template's panel. Public so the shell (and the tests) can drive it. */
  open(id) {
    this.picked = this.picked === id ? null : id;
    this.error = "";
  }
  /**
   * Creates the picked template as a **paused** flow and hands it over.
   *
   * `needsGrants` travels with it because a flow with no grants does nothing at all, and does it
   * silently: the screen to land on is Permissions, not the step list.
   */
  async use() {
    const template = this.picked ? templateById(this.picked) : void 0;
    if (!template || !this.client || this.busy) return;
    this.busy = true;
    this.error = "";
    try {
      const flow = await this.client.flows.create({
        name: this.t(template.nameKey),
        enabled: false,
        definition: buildTemplate(template, this.t)
      });
      this.dispatchEvent(
        new CustomEvent("flows-template-used", {
          detail: { flow, needsGrants: templateGrants(template, this.t).length > 0 },
          bubbles: true,
          composed: true
        })
      );
      this.picked = null;
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
    } finally {
      this.busy = false;
    }
  }
  renderPanel(template) {
    const grants = templateGrants(template, this.t);
    return b2`<div class="panel" id=${`panel-${template.id}`}>
      <p class="plain">${this.t(template.plainKey)}</p>

      <div class="block">
        <span class="head">${this.t("ui.tplBlanksTitle")}</span>
        ${template.blanks.length ? template.blanks.map(
      (blank) => b2`<div class="item" data-blank>
                <span class="grow">
                  <span class="label">${this.t(blank.labelKey)}</span>
                  <span class="hint">${this.t(blank.hintKey)}</span>
                </span>
              </div>`
    ) : b2`<span class="muted">${this.t("ui.tplNoBlanks")}</span>`}
      </div>

      <div class="block">
        <span class="head">${this.t("ui.tplGrantsTitle")}</span>
        <span class="muted">${this.t("ui.tplGrantsIntro")}</span>
        ${grants.map(
      (grant) => b2`<div class="item" data-grant=${grant.value}>
            <span class="grow">
              <span class="label">${this.t(template.grantReasons[grant.value] ?? grant.value)}</span>
              <span class="hint">${grant.value}</span>
            </span>
          </div>`
    )}
      </div>

      ${this.renderSameTrigger(template)}
      ${this.error ? b2`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
            >${this.error}</ok-inline-feedback
          >` : A}

      ${this.renderActions(template)}
    </div>`;
  }
  /**
   * **What the button offers, once the hub already runs this card** (flows#60).
   *
   * On a card this hub does not have, the offer is the one it always was. On one it does, the lead
   * action becomes «View it» — because tapping «Use this one» is exactly how the owner ended up
   * with two automations answering the same message.
   *
   * «Use this one» stays, second and quieter, and that is deliberate. Two flows on one event is a
   * legitimate thing to build, it is the owner's hub, and the switch-over the WhatsApp twins need
   * — pause the attended one, install the unattended one — goes through a card that is badged.
   * Warn and step aside, the same stance this panel already takes on a shared trigger
   * (whatsapp_inbox#58); refusing would be us deciding for them.
   */
  renderActions(template) {
    const installed = this.installationOf(template);
    const use = b2`<ion-button
      size="small"
      fill=${installed.state === "absent" ? A : "outline"}
      data-act="use"
      ?disabled=${this.busy}
      @click=${() => void this.use()}
    >
      ${this.busy ? this.t("ui.saving") : this.t("ui.tplUse")}
    </ion-button>`;
    if (installed.state === "absent") {
      return b2`<div class="actions">
        ${use}<span class="muted">${this.t("ui.tplCreatedPaused")}</span>
      </div>`;
    }
    return b2`<div class="actions">
      <ion-button size="small" data-act="view" @click=${() => this.view(template)}>
        ${this.t("ui.tplView")}
      </ion-button>
      ${use}
      <span class="muted"
        >${this.t(
      installed.state === "unfinished" ? "ui.tplUnfinishedHint" : "ui.tplHaveItAlready"
    )}</span
      >
    </div>`;
  }
  /** The four words of {@link InstalledState}, in the vocabulary the WhatsApp card already uses. */
  renderInstalledPill(state) {
    if (state === "absent") return A;
    const tone = state === "active" ? "success" : state === "unfinished" ? "warning" : "neutral";
    const label = state === "active" ? "ui.active" : state === "paused" ? "ui.paused" : "ui.tplUnfinished";
    return b2`<ok-status-pill tone=${tone} label=${this.t(label)}></ok-status-pill>`;
  }
  /**
   * **«You already have one of these»** (whatsapp_inbox#58).
   *
   * Two flows on one event both fire. For most pairs that is wanted; for the two WhatsApp
   * appointment families it books every message twice and sends the customer two confirmations.
   * The owner is the one who can tell those apart, so this NAMES the flow already waiting on that
   * event and leaves the button alone — warn, do not refuse, which is what Zapier does with a
   * duplicate Zap. It sits immediately above the button, because a warning further up the panel is
   * a warning nobody reads.
   */
  renderSameTrigger(template) {
    const clashing = flowsOnSameTrigger(template, this.t, this.existing);
    if (!clashing.length) return A;
    return b2`<ok-inline-feedback
      tone="warning"
      icon="alert-circle-outline"
      data-same-trigger
      >${this.t(clashing.length === 1 ? "ui.tplSameTrigger" : "ui.tplSameTriggerMany", {
      flows: clashing.join(", ")
    })}</ok-inline-feedback
    >`;
  }
  renderCard(template) {
    const open = this.picked === template.id;
    const { state } = this.installationOf(template);
    return b2`<div
      class="card"
      data-template=${template.id}
      data-installed=${state === "absent" ? A : state}
    >
      <button
        type="button"
        class="pick"
        aria-expanded=${open ? "true" : "false"}
        aria-controls=${`panel-${template.id}`}
        @click=${() => this.open(template.id)}
      >
        <ion-icon name=${template.icon} aria-hidden="true"></ion-icon>
        <span class="grow">
          <span class="name">${this.t(template.nameKey)}</span>
          <span class="summary">${this.t(template.summaryKey)}</span>
        </span>
        ${this.renderInstalledPill(state)}
      </button>
      ${open ? this.renderPanel(template) : A}
    </div>`;
  }
  renderSector(sector) {
    const templates = availableTemplates(sector, this.known);
    if (!templates.length) return A;
    return b2`<section data-sector=${sector}>
      <h3>${this.t(`ui.sector_${sector}`)}</h3>
      <div class="cards">${templates.map((template) => this.renderCard(template))}</div>
    </section>`;
  }
  /**
   * The one line that replaced the grey cards (flows#52, keeping what flows#38 protected).
   *
   * Sorted by the name the owner reads, not by the order the catalogue happens to have: this is a
   * shopping list, and «Tasks, Appointments» sends somebody looking for a list that is not sorted.
   */
  renderMissing() {
    const ids = unavailableModules(this.known);
    if (!ids.length) return A;
    const names = ids.map((id) => moduleName(id, this.t)).sort((a3, b3) => a3.localeCompare(b3)).join(", ");
    return b2`<p class="missing" data-missing-modules>${this.t(
      ids.length === 1 ? "ui.tplHiddenModule" : "ui.tplHiddenModules",
      { modules: names }
    )}</p>`;
  }
  render() {
    return b2`<div class="wrap">
      <div class="lede">
        <p>${this.t("ui.tplLede")}</p>
        <button
          type="button"
          class="link"
          data-act="guide"
          @click=${() => this.dispatchEvent(
      new CustomEvent("flows-open-guide", { bubbles: true, composed: true })
    )}
        >
          ${this.t("ui.guideOpen")}
        </button>
      </div>
      ${SECTORS.map((sector) => this.renderSector(sector))} ${this.renderMissing()}
    </div>`;
  }
};
__decorateClass([
  n4({ attribute: false })
], ErpFlowsGallery.prototype, "client", 2);
__decorateClass([
  n4({ attribute: false })
], ErpFlowsGallery.prototype, "t", 2);
__decorateClass([
  r5()
], ErpFlowsGallery.prototype, "picked", 2);
__decorateClass([
  r5()
], ErpFlowsGallery.prototype, "known", 2);
__decorateClass([
  r5()
], ErpFlowsGallery.prototype, "existing", 2);
__decorateClass([
  r5()
], ErpFlowsGallery.prototype, "busy", 2);
__decorateClass([
  r5()
], ErpFlowsGallery.prototype, "error", 2);
define("erp-flows-gallery", ErpFlowsGallery);

// ui/components/erp-flows-guide/erp-flows-guide.ts
var FIRST_STEPS = [
  "guide.firstPick",
  "guide.firstUse",
  "guide.firstFill",
  "guide.firstAllow",
  "guide.firstTest",
  "guide.firstEnable"
];
var ErpFlowsGuide = class extends i3 {
  constructor() {
    super(...arguments);
    this.t = (k2) => k2;
  }
  static {
    this.styles = i`
    :host {
      display: block;
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
    }
    .wrap {
      max-width: 44rem;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    h2 {
      margin: 0;
      flex: 1 1 12rem;
      font-size: 1.15rem;
    }
    .back {
      font: inherit;
      font-size: 0.9rem;
      background: transparent;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      color: inherit;
      cursor: pointer;
      padding: 0 0.9rem;
      min-height: 2.5rem;
    }
    h3 {
      margin: 0 0 0.35rem;
      font-size: 1rem;
    }
    p {
      margin: 0 0 0.5rem;
      line-height: 1.55;
      font-size: 0.95rem;
    }
    ol {
      margin: 0.2rem 0 0.6rem;
      padding-left: 1.2rem;
    }
    li {
      line-height: 1.55;
      font-size: 0.95rem;
      margin-bottom: 0.35rem;
    }
    .muted {
      color: var(--ok-muted, #6b6a63);
    }
    /* ── The drawings ────────────────────────────────────────────────────────────────────────
       The editor's own shapes: one column, a card for the trigger, a dashed chip for the guard,
       a card for the action. Same vocabulary, same geometry, no image bytes. */
    .shot {
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.02));
      padding: 0.7rem;
      margin: 0.4rem 0 0.8rem;
      overflow-x: auto;
    }
    .node {
      position: relative;
      padding-left: 1.4rem;
    }
    .node::before {
      content: '';
      position: absolute;
      left: 0.36rem;
      top: 0;
      bottom: -0.1rem;
      width: 2px;
      background: var(--ok-border-soft, rgba(0, 0, 0, 0.12));
    }
    .node:last-child::before {
      bottom: auto;
      height: 1rem;
    }
    .node::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0.75rem;
      width: 0.8rem;
      height: 0.8rem;
      border-radius: 50%;
      background: var(--ok-border, #d7d5cc);
      box-shadow: 0 0 0 3px var(--ok-bg, var(--ion-background-color, #fff));
    }
    .node.trigger::after {
      background: var(--ok-primary, var(--ion-color-primary, #3880ff));
    }
    .mini-card {
      background: var(--ok-surface, #fff);
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      padding: 0.5rem 0.6rem;
      margin: 0.3rem 0;
    }
    .eyebrow {
      display: block;
      font-size: 0.7rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
    }
    .title {
      display: block;
      font-weight: 600;
      font-size: 0.92rem;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      margin: 0.3rem 0 0.3rem 0.6rem;
      background: var(--ok-surface-2, rgba(0, 0, 0, 0.04));
      border: 1px dashed var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0.3rem 0.6rem;
      font-size: 0.88rem;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.6rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      margin-bottom: 0.35rem;
      font-size: 0.9rem;
    }
    .row .grow {
      flex: 1 1 auto;
      min-width: 0;
      overflow-wrap: anywhere;
    }
  `;
  }
  heading(section) {
    return b2`<h3 data-key=${`guide.${section}Title`}>${this.t(`guide.${section}Title`)}</h3>`;
  }
  /** The spine as the editor draws it: «When this happens…» → «Only continue if» → the action. */
  spineShot() {
    return b2`<div class="shot" data-shot="spine">
      <div class="node trigger">
        <div class="mini-card">
          <span class="eyebrow">${this.t("ui.whenThisHappens")}</span>
          <span class="title">${this.t("ui.triggerEvent", { event: this.t("ui.evSaleCompleted") })}</span>
        </div>
      </div>
      <div class="node">
        <span class="chip"
          ><strong>${this.t("ui.guardTitle")}</strong> ${this.t("guide.shotGuard")}</span
        >
      </div>
      <div class="node">
        <div class="mini-card">
          <span class="title">${this.t("guide.shotAction")}</span>
        </div>
      </div>
    </div>`;
  }
  permissionsShot() {
    return b2`<div class="shot" data-shot="permissions">
      <div class="row">
        <ok-status-pill tone="warning" label=${this.t("ui.grantsMissing")}></ok-status-pill>
        <span class="grow">${this.t("guide.shotGrant")}</span>
      </div>
      <div class="row">
        <ok-status-pill tone="success" label=${this.t("ui.grantsGranted")}></ok-status-pill>
        <span class="grow">${this.t("guide.shotGrantDone")}</span>
      </div>
    </div>`;
  }
  historyShot() {
    return b2`<div class="shot" data-shot="history">
      <div class="row">
        <ok-status-pill tone="success" label=${this.t("ui.runDone")}></ok-status-pill>
        <span class="grow muted">${this.t("guide.shotWhen")}</span>
      </div>
      <div class="row">
        <ok-status-pill tone="neutral" label=${this.t("ui.runDone")}></ok-status-pill>
        <span class="grow muted">${this.t("ui.ranGuardStopped")}</span>
      </div>
    </div>`;
  }
  render() {
    return b2`<div class="wrap">
      <div class="head">
        <h2>${this.t("guide.title")}</h2>
        <button
          type="button"
          class="back"
          data-act="back"
          @click=${() => this.dispatchEvent(
      new CustomEvent("flows-guide-close", { bubbles: true, composed: true })
    )}
        >
          ${this.t("ui.guideBack")}
        </button>
      </div>

      <section data-section="what">
        ${this.heading("what")}
        <p>${this.t("guide.whatBody")}</p>
        <p class="muted">${this.t("guide.whatExample")}</p>
        ${this.spineShot()}
        <p>${this.t("guide.whatCan")}</p>
      </section>

      <section data-section="first">
        ${this.heading("first")}
        <p>${this.t("guide.firstBody")}</p>
        <ol>
          ${FIRST_STEPS.map((key2) => b2`<li>${this.t(key2)}</li>`)}
        </ol>
      </section>

      <section data-section="permissions">
        ${this.heading("permissions")}
        <p>${this.t("guide.permissionsBody")}</p>
        <p>${this.t("guide.permissionsWhere")}</p>
        ${this.permissionsShot()}
        <p>${this.t("guide.permissionsNothing")}</p>
      </section>

      <section data-section="history">
        ${this.heading("history")}
        <p>${this.t("guide.historyBody")}</p>
        ${this.historyShot()}
        <p>${this.t("guide.historyGuard")}</p>
      </section>

      <!-- Two engine limits and one the assistant imposes on itself. What is NOT here any more is
           «there is no screen for the message, assistant and http steps»: flows#3 built all three,
           and a guide that keeps saying otherwise is the product talking somebody out of the
           feature that takes their automation outside the building (flows#16). -->
      <section data-section="limits">
        ${this.heading("limits")}
        <p>${this.t("guide.limitsBranches")}</p>
        <p>${this.t("guide.limitsDates")}</p>
        <p class="muted">${this.t("guide.limitsAssistant")}</p>
      </section>
    </div>`;
  }
};
__decorateClass([
  n4({ attribute: false })
], ErpFlowsGuide.prototype, "t", 2);
define("erp-flows-guide", ErpFlowsGuide);

// ui/components/erp-flows-approvals/erp-flows-approvals.ts
var ErpFlowsApprovals = class extends i3 {
  constructor() {
    super(...arguments);
    this.client = null;
    this.t = (k2) => k2;
    this.rows = [];
    this.error = "";
    this.busy = [];
    this.comments = {};
    this.unsubscribes = [];
  }
  static {
    this.styles = i`
    :host {
      display: block;
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
    }
    .list {
      max-width: 44rem;
      margin: 0 auto 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    h3.section {
      margin: 0;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
      font-weight: 600;
    }
    .card {
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, var(--ion-border-color, #d7d5cc));
      border-radius: var(--ok-radius, 14px);
      padding: 0.7rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .what {
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .why {
      font-size: 0.9rem;
      overflow-wrap: anywhere;
    }
    /* The payload is the thing being judged, so it is readable and it is COMPLETE — but it is a
       machine's words, so it is set apart and it scrolls inside its own box instead of pushing the
       two buttons off the bottom of a phone. */
    pre {
      margin: 0;
      padding: 0.5rem 0.6rem;
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.04));
      border-radius: var(--ok-radius-sm, 10px);
      font-size: 0.82rem;
      max-height: 12rem;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .meta {
      font-size: 0.8rem;
      color: var(--ok-muted, #6b6a63);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .actions button {
      font: inherit;
      cursor: pointer;
      border-radius: var(--ok-radius-pill, 999px);
      /* A finger on the counter tablet, not a mouse. */
      min-height: 2.75rem;
      padding: 0 1rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      background: var(--ok-surface, #fff);
      color: inherit;
    }
    .actions button[data-act='approve'] {
      border-color: var(--ok-primary, #3880ff);
      color: var(--ok-primary, #3880ff);
      font-weight: 600;
    }
    .muted {
      color: var(--ok-muted, #6b6a63);
    }
    .question {
      font-weight: 600;
      font-size: 1rem;
      overflow-wrap: anywhere;
    }
    textarea {
      font: inherit;
      width: 100%;
      box-sizing: border-box;
      min-height: 2.75rem;
      padding: 0.45rem 0.6rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      color: inherit;
      resize: vertical;
    }
  `;
  }
  connectedCallback() {
    super.connectedCallback();
    void this.load();
    const subscribe = this.client?.subscribe;
    if (typeof subscribe === "function") {
      for (const event of [EVENT_APPROVAL_CREATED, EVENT_APPROVAL_EXPIRED]) {
        this.unsubscribes.push(subscribe.call(this.client, event, () => void this.load()));
      }
    }
  }
  disconnectedCallback() {
    for (const off of this.unsubscribes) off();
    this.unsubscribes = [];
    super.disconnectedCallback();
  }
  /** Public so the shell can refresh the tray after a run without remounting it. */
  async load() {
    if (!this.client?.flows.approvals) {
      this.rows = [];
      this.announce();
      return;
    }
    try {
      const rows = await this.client.flows.approvals("pending");
      this.rows = Array.isArray(rows) ? rows : [];
      this.error = "";
    } catch (e4) {
      this.rows = [];
      this.error = e4?.message || this.t("ui.errGeneric");
    }
    this.announce();
  }
  announce() {
    this.dispatchEvent(
      new CustomEvent("flows-approvals-count", {
        detail: { count: this.rows.length },
        bubbles: true,
        composed: true
      })
    );
  }
  async decide(row, verdict) {
    const call = verdict === "approve" ? this.client?.flows.approve : this.client?.flows.reject;
    if (!call || this.busy.includes(row.id)) return;
    this.busy = [...this.busy, row.id];
    this.error = "";
    try {
      const comment = (this.comments[row.id] ?? "").trim();
      if (comment) await call.call(this.client?.flows, row.id, { comment });
      else await call.call(this.client?.flows, row.id);
      this.rows = this.rows.filter((r6) => r6.id !== row.id);
      const { [row.id]: _sent, ...rest } = this.comments;
      this.comments = rest;
      this.announce();
    } catch (e4) {
      this.error = this.refusal(e4);
    } finally {
      this.busy = this.busy.filter((id) => id !== row.id);
    }
  }
  when(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return String(iso);
    return date.toLocaleString(this.client?.locale || "es", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  /** The hub's refusal, in words the person can act on; its raw message when it is none of ours. */
  refusal(e4) {
    switch (errorCode(e4)) {
      case APPROVAL_EXPIRED:
        return this.t("ui.approvalErrExpired");
      case APPROVAL_ALREADY_DECIDED:
        return this.t("ui.approvalErrAlreadyDecided");
      case APPROVAL_NOT_YOURS:
        return this.t("ui.approvalErrNotYours");
      default:
        return e4?.message || this.t("ui.errGeneric");
    }
  }
  /** `command` unless the row says `decision`: a row older than hub#950 is a model's proposal. */
  kindOf(row) {
    return row.kind === "decision" ? "decision" : "command";
  }
  /** The payload, as the thing that is about to be written — never trimmed to fit. */
  payload(row) {
    try {
      return JSON.stringify(row.payload ?? {}, null, 2);
    } catch {
      return String(row.payload ?? "");
    }
  }
  render() {
    return b2`<div class="list">
      <h3 class="section">${this.t("ui.approvalsTitle")}</h3>
      ${this.error ? b2`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
            >${this.error}</ok-inline-feedback
          >` : A}
      ${!this.rows.length ? b2`<span class="muted">${this.t("ui.approvalsEmpty")}</span>` : b2`<span class="muted">${this.t("ui.approvalsIntro")}</span>`}
      ${this.rows.map((row) => {
      const kind = this.kindOf(row);
      const when = this.when(row.expires_at);
      return b2`<div class="card" data-approval=${row.id} data-kind=${kind}>
          ${kind === "decision" ? b2`<span class="question">${row.title ?? ""}</span>
                ${row.summary ? b2`<span class="why">${row.summary}</span>` : A}
                <span class="meta"
                  >${row.assignee_role ? this.t("ui.approvalAskedRole", { role: row.assignee_role }) : this.t("ui.approvalAskedAdmins")}</span
                >` : b2`<span class="what">${this.t("ui.approvalWould", { command: row.command ?? "" })}</span>
                ${row.reason ? b2`<span class="why">${row.reason}</span>` : A}
                <pre>${this.payload(row)}</pre>`}
          <!-- What waiting costs, and what a no costs — in the words of the policies the flow
               chose. A model's proposal has neither: expiring it simply never runs it. -->
          ${kind === "decision" ? b2`<span class="meta"
                  >${this.t(`ui.approvalExpires_${policy(row.on_expire, "reject")}`, { when })}</span
                >
                <span class="meta"
                  >${this.t(`ui.approvalOnReject_${policy(row.on_reject, "cancel")}`)}</span
                >` : b2`<span class="meta">${this.t("ui.approvalExpires", { when })}</span>`}
          <textarea
            data-field="comment"
            rows="1"
            aria-label=${this.t("ui.approvalComment")}
            placeholder=${this.t("ui.approvalComment")}
            .value=${this.comments[row.id] ?? ""}
            @input=${(e4) => {
        this.comments = { ...this.comments, [row.id]: e4.target.value };
      }}
          ></textarea>
          <div class="actions">
            <button
              type="button"
              data-act="approve"
              ?disabled=${this.busy.includes(row.id)}
              @click=${() => void this.decide(row, "approve")}
            >
              ${this.t("ui.approvalApprove")}
            </button>
            <!-- Rejecting asks nothing back: it is the answer that leaves the business exactly as
                 it was, and a confirmation dialog on the safe choice only trains people to tap
                 through the one on the other button. -->
            <button
              type="button"
              data-act="reject"
              ?disabled=${this.busy.includes(row.id)}
              @click=${() => void this.decide(row, "reject")}
            >
              ${this.t("ui.approvalReject")}
            </button>
          </div>
        </div>`;
    })}
    </div>`;
  }
};
__decorateClass([
  n4({ attribute: false })
], ErpFlowsApprovals.prototype, "client", 2);
__decorateClass([
  n4({ attribute: false })
], ErpFlowsApprovals.prototype, "t", 2);
__decorateClass([
  r5()
], ErpFlowsApprovals.prototype, "rows", 2);
__decorateClass([
  r5()
], ErpFlowsApprovals.prototype, "error", 2);
__decorateClass([
  r5()
], ErpFlowsApprovals.prototype, "busy", 2);
__decorateClass([
  r5()
], ErpFlowsApprovals.prototype, "comments", 2);
function policy(value, fallback) {
  return value && /^[a-z_]+$/.test(value) ? value : fallback;
}
define("erp-flows-approvals", ErpFlowsApprovals);

// ui/components/erp-flows-dead-letter/erp-flows-dead-letter.ts
var MAX_REASON = 500;
var REASON_PRESETS = ["ui.deadReasonDuplicate", "ui.deadReasonHandled", "ui.deadReasonObsolete"];
var ErpFlowsDeadLetter = class extends i3 {
  constructor() {
    super(...arguments);
    this.client = null;
    this.t = (k2) => k2;
    this.rows = [];
    this.status = "ready";
    this.error = "";
    this.confirming = "";
    this.reason = "";
    this.closed = [];
    this.busy = [];
    this.notice = "";
  }
  static {
    this.styles = i`
    :host {
      display: block;
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
    }
    .list {
      max-width: 44rem;
      margin: 0 auto 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .head {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    h3.section {
      margin: 0;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
      font-weight: 600;
    }
    .grow {
      flex: 1;
    }
    .card {
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, var(--ion-border-color, #d7d5cc));
      border-radius: var(--ok-radius, 14px);
      padding: 0.7rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .what {
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .why {
      font-size: 0.9rem;
      overflow-wrap: anywhere;
    }
    .meta {
      font-size: 0.8rem;
      color: var(--ok-muted, #6b6a63);
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
    }
    code {
      font-size: 0.8rem;
      overflow-wrap: anywhere;
    }
    /* The payload is the evidence, so it is complete — but it is a machine's words, so it is set
       apart and scrolls inside its own box instead of pushing the buttons off a phone. */
    pre {
      margin: 0;
      padding: 0.5rem 0.6rem;
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.04));
      border-radius: var(--ok-radius-sm, 10px);
      font-size: 0.82rem;
      max-height: 12rem;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
    }
    details summary {
      cursor: pointer;
      font-size: 0.8rem;
      color: var(--ok-muted, #6b6a63);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
    }
    button {
      font: inherit;
      cursor: pointer;
      border-radius: var(--ok-radius-pill, 999px);
      /* A finger on the counter tablet, not a mouse. */
      min-height: 2.75rem;
      padding: 0 1rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      background: var(--ok-surface, #fff);
      color: inherit;
    }
    button[data-act='retry'],
    button[data-act='retry-all'] {
      border-color: var(--ok-primary, #3880ff);
      color: var(--ok-primary, #3880ff);
      font-weight: 600;
    }
    button[data-act='discard-confirm'] {
      border-color: var(--ok-danger, #eb445a);
      color: var(--ok-danger, #eb445a);
      font-weight: 600;
    }
    button[data-act='copy'] {
      min-height: 2rem;
      padding: 0 0.6rem;
      font-size: 0.8rem;
    }
    .muted {
      color: var(--ok-muted, #6b6a63);
    }
    /* The confirmation grows a field, so it stops being a row of buttons and becomes a block. */
    .confirm {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .presets {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    /* One tap, and still a finger-sized target: these are the reason, not decoration. */
    button[data-act='reason-preset'] {
      font-size: 0.85rem;
      padding: 0 0.75rem;
    }
    input[data-field='discard-reason'] {
      font: inherit;
      min-height: 2.75rem;
      padding: 0 0.75rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      color: inherit;
      width: 100%;
      box-sizing: border-box;
    }
    .closed {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-top: 0.75rem;
    }
  `;
  }
  connectedCallback() {
    super.connectedCallback();
    void this.load();
  }
  /** Public so the screen around it can refresh the tray after a run without remounting it. */
  async load() {
    const events = this.client?.events;
    if (typeof events?.dead !== "function") {
      this.rows = [];
      this.status = "unsupported";
      this.announce();
      return;
    }
    try {
      const rows = await events.dead();
      this.rows = Array.isArray(rows) ? rows : [];
      this.status = "ready";
      this.error = "";
    } catch (e4) {
      this.rows = [];
      this.status = errorCode(e4) === "capability_denied" ? "denied" : "failed";
      this.error = e4?.message || this.t("ui.errGeneric");
    }
    this.announce();
  }
  announce() {
    this.dispatchEvent(
      new CustomEvent("flows-dead-count", {
        detail: { count: this.rows.length },
        bubbles: true,
        composed: true
      })
    );
  }
  /** The rows a retry can actually move — the runtime's verdict, never this screen's guess. */
  get retryable() {
    return this.rows.filter((row) => row.retryable !== false);
  }
  async retry(row) {
    const call = this.client?.events?.retry;
    if (typeof call !== "function" || this.busy.includes(row.id)) return;
    this.busy = [...this.busy, row.id];
    this.error = "";
    try {
      await call.call(this.client?.events, row.id);
      this.rows = this.rows.filter((r6) => r6.id !== row.id);
      this.announce();
    } catch (e4) {
      this.error = this.refusal(e4);
    } finally {
      this.busy = this.busy.filter((id) => id !== row.id);
    }
  }
  /**
   * Closes the row for good, with the reason if one was written.
   *
   * The empty box sends **no reason argument at all**, so an unexplained discard is the same single
   * call it always was: demanding an essay to close a row is how a recovery queue stops being
   * drained, and a queue nobody drains hides the next real failure.
   */
  async discard(row) {
    const call = this.client?.events?.discard;
    if (typeof call !== "function" || this.busy.includes(row.id)) return;
    const written = this.reason.trim();
    this.busy = [...this.busy, row.id];
    this.error = "";
    try {
      const stamp = written ? await call.call(this.client?.events, row.id, written) : await call.call(this.client?.events, row.id);
      const kept = typeof stamp?.discard_reason === "string" || !written;
      this.closed = [
        {
          id: row.id,
          event: row.event_name,
          reason: kept ? stamp?.discard_reason ?? "" : "",
          kept
        },
        ...this.closed
      ];
      this.rows = this.rows.filter((r6) => r6.id !== row.id);
      this.confirming = "";
      this.reason = "";
      this.announce();
    } catch (e4) {
      this.error = this.refusal(e4);
    } finally {
      this.busy = this.busy.filter((id) => id !== row.id);
    }
  }
  /**
   * Every dead-letter of this hub, back in front of the relay at once — the gesture for the case
   * that produced a queue in the first place: something transient broke (the database blinked, a
   * module was deactivated mid-flight) and killed several at the same time.
   *
   * Offered only when more than one row can actually move, because the endpoint SKIPS the ones that
   * cannot (hub#827) — a sweep advertised over a queue of one retryable row would promise a
   * clean-up it does not perform.
   */
  async retryAll() {
    const call = this.client?.events?.retryAll;
    if (typeof call !== "function" || this.busy.includes("*")) return;
    this.busy = [...this.busy, "*"];
    this.error = "";
    try {
      const moved = await call.call(this.client?.events);
      this.notice = this.t("ui.deadRetriedAll", { count: moved?.retried ?? 0 });
      await this.load();
    } catch (e4) {
      this.error = this.refusal(e4);
    } finally {
      this.busy = this.busy.filter((id) => id !== "*");
    }
  }
  /** A refusal in words. The revoked release has its own, because its remedy is a different one. */
  refusal(e4) {
    if (errorCode(e4) === "flow.release_revoked") return this.t("ui.deadRevoked");
    if (errorCode(e4) === "capability_denied") return this.t("ui.deadDenied");
    return e4?.message || this.t("ui.errGeneric");
  }
  async copy(id) {
    if (!id) return;
    try {
      await navigator.clipboard?.writeText(id);
      this.notice = this.t("ui.runCopied");
    } catch {
    }
  }
  when(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return String(iso);
    return date.toLocaleString(this.client?.locale || "es", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  /** The payload as evidence — never trimmed to fit. It is what tells an invoice from noise. */
  payload(row) {
    try {
      return JSON.stringify(row.payload ?? {}, null, 2);
    } catch {
      return String(row.payload ?? "");
    }
  }
  renderRow(row) {
    const trouble = classify(row.last_error);
    const canRetry = row.retryable !== false;
    const busy = this.busy.includes(row.id);
    return b2`<div class="card" data-dead=${row.id}>
      <span class="what">${this.t("ui.deadWhat", { event: row.event_name })}</span>
      <span class="why">
        ${canRetry ? trouble.messageKey ? this.t(trouble.messageKey) : this.t("ui.deadUnexplained") : this.t("ui.deadRevoked")}
      </span>
      <!-- What to do next, and for the revoked row that is deliberately NOT «press retry». -->
      <span class="why muted">
        ${canRetry ? trouble.actionKey ? this.t(trouble.actionKey) : this.t("ui.deadDoRetry") : this.t("ui.deadDoRevoked")}
      </span>
      <pre>${this.payload(row)}</pre>
      <span class="meta">
        ${this.t("ui.deadFrom", { module: row.module_id || "\u2014" })} ·
        ${this.t(row.attempts === 1 ? "ui.deadAttemptsOne" : "ui.deadAttempts", {
      count: row.attempts ?? 0
    })}
        · ${this.when(row.created_at)} ·
        <code>${row.id}</code>
        <button type="button" data-act="copy" @click=${() => void this.copy(row.id)}>
          ${this.t("ui.runCopyId")}
        </button>
      </span>
      ${trouble.technical ? b2`<details>
            <summary>${this.t("ui.troubleTechnical")}</summary>
            <pre>${trouble.technical}</pre>
          </details>` : A}
      ${this.confirming === row.id ? b2`<div class="confirm" data-confirm=${row.id}>
            <span class="why">${this.t("ui.deadDiscardConfirm")}</span>
            <!-- Said out loud, because it is what the hub really keeps (hub#955): who and when come
                 from inside, the reason is the only half a person has to supply — and it is
                 optional, because a queue that demands an essay to close a row is not drained. -->
            <span class="why muted">${this.t("ui.deadDiscardReasonHint")}</span>
            <div class="presets">
              ${REASON_PRESETS.map(
      (key2) => b2`<button
                  type="button"
                  data-act="reason-preset"
                  @click=${() => {
        this.reason = this.t(key2);
      }}
                >
                  ${this.t(key2)}
                </button>`
    )}
            </div>
            <input
              type="text"
              data-field="discard-reason"
              maxlength=${MAX_REASON}
              .value=${this.reason}
              aria-label=${this.t("ui.deadDiscardReasonLabel")}
              placeholder=${this.t("ui.deadDiscardReasonPlaceholder")}
              @input=${(e4) => {
      this.reason = e4.target.value;
    }}
            />
            <div class="actions">
              <button
                type="button"
                data-act="discard-confirm"
                ?disabled=${busy}
                @click=${() => void this.discard(row)}
              >
                ${this.t("ui.deadDiscardDo")}
              </button>
              <button
                type="button"
                data-act="discard-cancel"
                @click=${() => {
      this.confirming = "";
      this.reason = "";
    }}
              >
                ${this.t("ui.cancel")}
              </button>
            </div>
          </div>` : b2`<div class="actions">
            ${canRetry ? b2`<button
                  type="button"
                  data-act="retry"
                  ?disabled=${busy}
                  @click=${() => void this.retry(row)}
                >
                  ${this.t("ui.deadRetry")}
                </button>` : A}
            <button
              type="button"
              data-act="discard"
              @click=${() => {
      this.confirming = row.id;
    }}
            >
              ${this.t("ui.deadDiscard")}
            </button>
          </div>`}
    </div>`;
  }
  /**
   * **What was closed here, and why the row now says so** — the record that used to disappear.
   *
   * A discarded event leaves the tray at once (it is no longer something to decide), and until this
   * the only trace left on screen was the row's absence. The hub keeps the whole stamp for ninety
   * days and there is no read that lists discarded rows, so this is the one place the decision is
   * visible right after it is taken — with the reason **as the hub stored it**, and with a plain
   * sentence when the hub is too old to have stored anything.
   */
  renderClosed() {
    if (!this.closed.length) return A;
    return b2`<div class="closed">
      <h3 class="section">${this.t("ui.deadClosedTitle")}</h3>
      <span class="muted">${this.t("ui.deadClosedIntro")}</span>
      ${this.closed.map(
      (row) => b2`<span class="why muted" data-discarded=${row.id}>
          ${!row.kept ? this.t("ui.deadDiscardReasonNotKept", { event: row.event }) : row.reason ? this.t("ui.deadClosedWith", { event: row.event, reason: row.reason }) : this.t("ui.deadClosedNoReason", { event: row.event })}
        </span>`
    )}
    </div>`;
  }
  render() {
    if (this.status === "unsupported") {
      return b2`<div class="list">
        <h3 class="section">${this.t("ui.deadTitle")}</h3>
        <span class="muted">${this.t("ui.deadUnsupported")}</span>
      </div>`;
    }
    if (this.status === "denied") {
      return b2`<div class="list">
        <h3 class="section">${this.t("ui.deadTitle")}</h3>
        <ok-inline-feedback tone="warning" icon="lock-closed-outline"
          >${this.t("ui.deadDenied")}</ok-inline-feedback
        >
      </div>`;
    }
    return b2`<div class="list">
      <div class="head">
        <h3 class="section">${this.t("ui.deadTitle")}</h3>
        <span class="grow"></span>
        ${this.retryable.length > 1 ? b2`<button
              type="button"
              data-act="retry-all"
              ?disabled=${this.busy.includes("*")}
              @click=${() => void this.retryAll()}
            >
              ${this.t("ui.deadRetryAll", { count: this.retryable.length })}
            </button>` : A}
      </div>
      ${this.error ? b2`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
            >${this.error}</ok-inline-feedback
          >` : A}
      ${this.notice ? b2`<span class="muted">${this.notice}</span>` : A}
      ${this.rows.length ? b2`<span class="muted">${this.t("ui.deadIntro")}</span>` : b2`<span class="muted">${this.t("ui.deadEmpty")}</span>`}
      ${this.rows.map((row) => this.renderRow(row))} ${this.renderClosed()}
    </div>`;
  }
};
__decorateClass([
  n4({ attribute: false })
], ErpFlowsDeadLetter.prototype, "client", 2);
__decorateClass([
  n4({ attribute: false })
], ErpFlowsDeadLetter.prototype, "t", 2);
__decorateClass([
  r5()
], ErpFlowsDeadLetter.prototype, "rows", 2);
__decorateClass([
  r5()
], ErpFlowsDeadLetter.prototype, "status", 2);
__decorateClass([
  r5()
], ErpFlowsDeadLetter.prototype, "error", 2);
__decorateClass([
  r5()
], ErpFlowsDeadLetter.prototype, "confirming", 2);
__decorateClass([
  r5()
], ErpFlowsDeadLetter.prototype, "reason", 2);
__decorateClass([
  r5()
], ErpFlowsDeadLetter.prototype, "closed", 2);
__decorateClass([
  r5()
], ErpFlowsDeadLetter.prototype, "busy", 2);
__decorateClass([
  r5()
], ErpFlowsDeadLetter.prototype, "notice", 2);
define("erp-flows-dead-letter", ErpFlowsDeadLetter);

// ui/lib/flow-list.ts
var EMPTY_VIEW = { q: "", state: "all", trigger: "all", sort: "updated" };
function triggerKindOf(flow) {
  return readDoc(flow.definition).triggers[0]?.kind ?? "manual";
}
function searchIndex(flow) {
  const doc = readDoc(flow.definition);
  const words = [flow.name ?? ""];
  for (const trigger of doc.triggers) if (trigger.event) words.push(trigger.event);
  for (const step of doc.steps) if (step.command) words.push(String(step.command));
  return words.join(" ").toLowerCase();
}
function secretRefs(doc) {
  const found = /* @__PURE__ */ new Set();
  const scan = (node) => {
    if (typeof node === "string") {
      for (const m3 of node.matchAll(/\{\{\s*secret\.([A-Za-z0-9_-]+)\s*\}\}/g)) found.add(m3[1]);
      return;
    }
    if (Array.isArray(node)) return void node.forEach(scan);
    if (node && typeof node === "object") return void Object.values(node).forEach(scan);
  };
  scan(doc.steps);
  return [...found];
}
var byName = (a3, b3) => (a3.name ?? "").localeCompare(b3.name ?? "");
var byUpdated = (a3, b3) => {
  const at2 = a3.updated_at ?? "";
  const bt = b3.updated_at ?? "";
  if (!at2 && !bt) return byName(a3, b3);
  if (!at2) return 1;
  if (!bt) return -1;
  return bt.localeCompare(at2);
};
function applyView(flows, view) {
  const q = view.q.trim().toLowerCase();
  const rows = flows.filter((flow) => {
    if (view.state === "active" && !flow.enabled) return false;
    if (view.state === "paused" && flow.enabled) return false;
    if (view.trigger !== "all" && triggerKindOf(flow) !== view.trigger) return false;
    return !q || searchIndex(flow).includes(q);
  });
  return rows.sort(view.sort === "name" ? byName : byUpdated);
}
function duplicateOf(flow, name) {
  return {
    name,
    enabled: false,
    definition: structuredClone(flow.definition ?? {})
  };
}
function copyName(name, taken, t3) {
  const base = t3("ui.copyOf", { name });
  if (!taken.includes(base)) return base;
  for (let n5 = 2; n5 < 100; n5 += 1) {
    const candidate = `${base} (${n5})`;
    if (!taken.includes(candidate)) return candidate;
  }
  return base;
}

// ui/lib/flow-checkup.ts
var WHATSAPP_MESSAGE_EVENT = "hub.whatsapp.message_received";
var WHATSAPP_MODULE_MESSAGE_EVENT = "whatsapp_inbox.message.received";
var WHATSAPP_MESSAGE_EVENTS = [
  WHATSAPP_MESSAGE_EVENT,
  WHATSAPP_MODULE_MESSAGE_EVENT
];
var ECHO_AND_BACKLOG = "whatsapp_echo_and_backlog";
var ECHO_GUARDS = [
  ["event.direction", "outbound"],
  ["event.source", "history"]
];
var isRecord = (value) => !!value && typeof value === "object" && !Array.isArray(value);
function isGuarded(filter, path) {
  const clause = filter?.[path];
  return isRecord(clause) && Object.keys(clause).length > 0;
}
var isWhatsappTrigger = (trigger) => trigger?.kind === "event" && WHATSAPP_MESSAGE_EVENTS.includes(trigger?.event);
var answersEchoAndBacklog = (trigger) => isWhatsappTrigger(trigger) && ECHO_GUARDS.some(([path]) => !isGuarded(trigger.filter, path));
function flowProblems(definition) {
  const doc = readDoc(definition);
  if (!doc.triggers.some((trigger) => answersEchoAndBacklog(trigger))) return [];
  return [
    {
      id: ECHO_AND_BACKLOG,
      titleKey: "ui.checkupEchoTitle",
      bodyKey: "ui.checkupEchoBody",
      fixKey: "ui.checkupEchoFix"
    }
  ];
}
function repairedDefinition(definition, problemId) {
  if (problemId !== ECHO_AND_BACKLOG) return null;
  if (!isRecord(definition)) return null;
  if (!flowProblems(definition).some((problem) => problem.id === ECHO_AND_BACKLOG)) return null;
  const repaired = structuredClone(definition);
  const triggers = repaired.triggers;
  if (!Array.isArray(triggers)) return null;
  for (const raw of triggers) {
    const trigger = raw;
    if (!answersEchoAndBacklog(trigger)) continue;
    const filter = isRecord(trigger.filter) ? trigger.filter : {};
    for (const [path, unwanted] of ECHO_GUARDS) {
      if (!isGuarded(filter, path)) filter[path] = { neq: unwanted };
    }
    trigger.filter = filter;
  }
  return repaired;
}

// ui/lib/ai-draft.ts
var DRAFT_STEP_KINDS = ["command", "condition", "delay"];
function readNotes(raw) {
  const value = typeof raw === "string" ? safeParse(raw) : raw;
  if (!Array.isArray(value)) return [];
  return value.filter((n5) => typeof n5 === "string" && n5.trim() !== "");
}
function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return void 0;
  }
}
function readDraft(row) {
  const id = String(row?.id ?? "");
  const name = typeof row?.name === "string" ? row.name : "";
  const raw = typeof row?.definition === "string" ? safeParse(row.definition) : row?.definition;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, problem: { key: "draft.errUnreadable", params: { name } } };
  }
  return {
    ok: true,
    draft: {
      id,
      name,
      doc: readDoc(raw),
      notes: readNotes(row?.notes),
      createdAt: typeof row?.created_at === "string" ? row.created_at : ""
    }
  };
}
function at(root, path) {
  let cur = root;
  for (const key2 of path) {
    if (!cur || typeof cur !== "object") return void 0;
    cur = cur[key2];
  }
  return cur;
}
function enumAt(root, path) {
  const value = at(root, path);
  if (!Array.isArray(value)) return void 0;
  const names = value.filter((v2) => typeof v2 === "string");
  return names.length ? names : void 0;
}
function schemaFacts(schema) {
  const operators = Object.keys(
    at(schema, ["$defs", "condition", "additionalProperties", "properties"]) ?? {}
  );
  const version = at(schema, ["properties", "schema_version", "const"]);
  return {
    schemaVersion: typeof version === "number" ? version : SCHEMA_VERSION,
    stepKinds: enumAt(schema, ["$defs", "step", "properties", "kind", "enum"]) ?? [
      "command",
      "condition",
      "delay",
      "http",
      "ai",
      "notify",
      "query",
      "approval"
    ],
    triggerKinds: enumAt(schema, ["$defs", "trigger", "properties", "kind", "enum"]) ?? [
      "event",
      "cron",
      "at",
      "manual"
    ],
    operators: operators.length ? operators : [...OPERATORS],
    // `false` only when the hub explicitly says something else. A schema this module could not
    // read must not turn the hub#786 check off: absence of proof is not proof of an array.
    toolsIsObject: at(schema, ["$defs", "step", "properties", "tools", "type"]) !== "array"
  };
}
var TRIGGER_FIELD = {
  event: "event",
  cron: "cron",
  at: "at"
};
function contractProblems(doc, facts) {
  const out = [];
  if (doc.schema_version !== facts.schemaVersion) {
    out.push({
      key: "draft.errVersion",
      params: { got: doc.schema_version, want: facts.schemaVersion }
    });
  }
  for (const trigger of doc.triggers ?? []) {
    const kind = String(trigger?.kind ?? "");
    if (!facts.triggerKinds.includes(kind)) {
      out.push({ key: "draft.errTriggerKind", params: { kind } });
      continue;
    }
    const field = TRIGGER_FIELD[kind];
    if (field && !String(trigger[field] ?? "").trim()) {
      out.push({ key: "draft.errTriggerField", params: { kind, field } });
    }
  }
  const steps = Array.isArray(doc.steps) ? doc.steps : [];
  if (!steps.length) {
    out.push({ key: "draft.errNoSteps" });
  }
  const seen = /* @__PURE__ */ new Set();
  for (const step of steps) {
    const id = String(step?.id ?? "").trim();
    if (!id) {
      out.push({ key: "draft.errStepId" });
    } else if (seen.has(id)) {
      out.push({ key: "draft.errDuplicateId", params: { id } });
    } else {
      seen.add(id);
    }
    const kind = String(step?.kind ?? "");
    if (!facts.stepKinds.includes(kind)) {
      out.push({ key: "draft.errStepKind", params: { id, kind } });
      continue;
    }
    if (kind === "condition") out.push(...operatorProblems(step, facts));
    if (kind === "ai" && facts.toolsIsObject && step.tools !== void 0 && step.tools !== null) {
      if (Array.isArray(step.tools) || typeof step.tools !== "object") {
        out.push({ key: "draft.errToolsShape", params: { id } });
      }
    }
  }
  return out;
}
function operatorProblems(step, facts) {
  const out = [];
  for (const ops of Object.values(step.when ?? {})) {
    for (const op of Object.keys(ops ?? {})) {
      if (!facts.operators.includes(op)) {
        out.push({ key: "draft.errOperator", params: { id: step.id, operator: op } });
      }
    }
  }
  return out;
}
function isBlank(value) {
  if (value === null || value === void 0) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
function danglingRoot(value) {
  if (typeof value !== "string") return false;
  const root = value.split(".")[0];
  return PATH_ROOTS.includes(root) && value.length <= root.length + 1;
}
function draftGaps(doc, known) {
  const out = [];
  for (const trigger of doc.triggers ?? []) {
    if (trigger?.kind !== "event") continue;
    const event = String(trigger.event ?? "").trim();
    if (!event) {
      out.push({ stepId: "trigger", key: "draft.gapEventMissing" });
    } else if (known[event] === false) {
      out.push({ stepId: "trigger", key: "draft.gapEventUnknown", params: { event } });
    }
  }
  for (const step of Array.isArray(doc.steps) ? doc.steps : []) {
    const stepId = String(step?.id ?? "");
    const kind = String(step?.kind ?? "");
    if (!DRAFT_STEP_KINDS.includes(kind)) {
      out.push({ stepId, key: "draft.gapNotEditable", params: { kind } });
      continue;
    }
    if (kind === "command") {
      if (isBlank(step.command)) {
        out.push({ stepId, key: "draft.gapCommandMissing" });
      }
      for (const [name, value] of Object.entries(step.params ?? {})) {
        if (isBlank(value) || danglingRoot(value)) {
          out.push({ stepId, key: "draft.gapParamEmpty", params: { name } });
        }
      }
    }
    if (kind === "condition") {
      const entries = Object.entries(step.when ?? {});
      if (!entries.length) out.push({ stepId, key: "draft.gapGuardEmpty" });
      for (const [path, ops] of entries) {
        if (!path.trim()) {
          out.push({ stepId, key: "draft.gapGuardField" });
          continue;
        }
        for (const [op, value] of Object.entries(ops ?? {})) {
          if (op !== "exists" && isBlank(value)) {
            out.push({ stepId, key: "draft.gapGuardValue", params: { field: path } });
          }
        }
      }
    }
  }
  return out;
}

// locales/es.json
var es_default = {
  name: "Automatizaciones",
  description: "Automatiza el trabajo repetitivo sin programar: recordatorios de citas, avisos de stock bajo y mensajes a clientes que salen solos.",
  navigation: {
    automations: {
      label: "Automatizaciones"
    }
  },
  ui: {
    loading: "Cargando\u2026",
    save: "Guardar",
    saving: "Guardando\u2026",
    cancel: "Cancelar",
    close: "Cerrar",
    delete: "Borrar",
    back: "Volver",
    retry: "Reintentar",
    unnamed: "Automatizaci\xF3n sin nombre",
    errGeneric: "Algo ha fallado. No se ha guardado nada.",
    listTitle: "Automatizaciones",
    newAutomation: "Nueva automatizaci\xF3n",
    emptyTitle: "Todav\xEDa no hay nada automatizado",
    emptyMessage: "Una automatizaci\xF3n vigila algo que pasa en tu negocio y act\xFAa en consecuencia \u2014 sola, cada vez.",
    deleteTitle: "\xBFBorrar esta automatizaci\xF3n?",
    deleteMessage: "Deja de funcionar al instante. Su historial se conserva como prueba de que existi\xF3.",
    deleteConfirm: "\xBFBorrar \xAB{name}\xBB? Esto no se puede deshacer.",
    deleteYes: "S\xED, b\xF3rrala",
    deleteNo: "D\xE9jala",
    listSearch: "Busca por nombre, por lo que la arranca o por lo que hace",
    filterState: "Ver",
    stateAll: "Encendidas y en pausa",
    stateActive: "Solo las encendidas",
    statePaused: "Solo las que est\xE1n en pausa",
    filterTrigger: "Arranca con",
    triggerAny: "Cualquier cosa",
    filterEvent: "Algo que pasa",
    filterCron: "El reloj",
    filterAt: "Una fecha",
    filterManual: "T\xFA, a mano",
    sortBy: "Orden",
    sortUpdated: "Tocadas al final",
    sortName: "Nombre",
    listCount: "Se ven {shown} de {total}",
    listNoMatch: "Aqu\xED no hay nada que encaje con eso.",
    listClear: "Volver a verlas todas",
    selectOne: "Elegir \xAB{name}\xBB",
    selectedCount: "{count} elegidas",
    selectionClear: "Soltarlas",
    bulkEnable: "Encenderlas",
    bulkPause: "Ponerlas en pausa",
    duplicate: "Hacer una copia",
    copyOf: "Copia de {name}",
    copyMade: "Copiada, y la copia est\xE1 en pausa. No lleva ninguno de los permisos de la original: conc\xE9dele lo que necesite antes de encenderla.",
    copySecrets: "Sale fuera usando: {names}. Comprueba que son los correctos para la copia.",
    checkupEchoTitle: "Esta automatizaci\xF3n tambi\xE9n salta con tus propios mensajes",
    checkupEchoBody: "Se mont\xF3 antes de que lo corrigi\xE9ramos, as\xED que tambi\xE9n salta con lo que escribes t\xFA desde tu m\xF3vil y con conversaciones de hace meses. Actual\xEDzala y solo saltar\xE1 con lo que escriba un cliente ahora. No cambia nada m\xE1s de ella.",
    checkupEchoFix: "Actualizarla",
    checkupFixed: "\xAB{name}\xBB ya solo salta con lo que escribe un cliente.",
    checkupNotFixed: "No hemos podido actualizar esta automatizaci\xF3n: el hub la ha guardado sin el cambio. Vuelve a intentarlo en un momento y avisa a soporte si sigue pasando.",
    active: "Activa",
    paused: "En pausa",
    activate: "Activar",
    pause: "Pausar",
    enableNoGrants: "Encendida, pero a\xFAn no tiene los permisos que pide ({commands}): no har\xE1 nada hasta que se los concedas en la pesta\xF1a Permisos.",
    enableUntested: "Todav\xEDa no la has probado: en la pesta\xF1a Probar puedes ver qu\xE9 har\xEDa antes de que se dispare sola.",
    neverRun: "No se ha ejecutado nunca",
    lastRun: "\xDAltima vez: {when}",
    noAccessTitle: "Este editor necesita tu permiso",
    noAccessMessage: "Una automatizaci\xF3n puede ejecutar comandos sin que nadie mire, as\xED que este m\xF3dulo solo llega a ellas si t\xFA lo autorizas. Ve a Ajustes \u2192 Permisos y activa \xABAdministrar automatizaciones\xBB para Automatizaciones.",
    unsupportedTitle: "Este hub todav\xEDa no sabe automatizar",
    unsupportedMessage: "El motor de automatizaciones lleg\xF3 en una versi\xF3n posterior del hub. Actualiza el hub y este editor lo encontrar\xE1.",
    notAdminTitle: "Solo el due\xF1o o un administrador puede editar automatizaciones",
    notAdminMessage: "Una automatizaci\xF3n act\xFAa en nombre del negocio sin que nadie mire, as\xED que decidir qu\xE9 puede hacer no es algo que apruebe una sesi\xF3n de turno.",
    whenThisHappens: "Cuando pase esto\u2026",
    thenDo: "\u2026haz esto",
    triggerEvent: "Cuando {event}",
    triggerDaily: "Todos los d\xEDas a las {time}",
    triggerCron: "Con la programaci\xF3n {cron}",
    triggerAt: "Una vez, el {when}",
    triggerManual: "Solo cuando pulses Ejecutar",
    triggerKindEvent: "Pasa algo",
    triggerKindCron: "Todos los d\xEDas, a una hora",
    triggerKindAt: "Una vez, en una fecha y hora",
    triggerKindManual: "Solo a mano",
    eventPick: "Elige qu\xE9 pasa",
    eventChecking: "Consultando a este hub\u2026",
    eventCatalogLoading: "Preguntando a este hub qu\xE9 eventos puede lanzar\u2026",
    eventCatalogUnsupported: "Este hub es demasiado antiguo para listar sus eventos. Actual\xEDzalo para elegir de una lista \u2014 mientras tanto, escribe el nombre exacto abajo.",
    eventCatalogEmpty: "Este hub todav\xEDa no tiene ning\xFAn evento. Instala un m\xF3dulo que los produzca \u2014 mientras tanto, escribe el nombre exacto abajo.",
    eventCatalogDenied: "Automatizaciones a\xFAn no puede leer los eventos de este hub. Conc\xE9deselo en Ajustes \u2192 Permisos y vuelve a abrir el flujo.",
    eventCatalogFailed: "Este hub no ha podido listar sus eventos ({code}). Escribe el nombre exacto abajo.",
    eventNotInHub: "Este hub no lo tiene \u2014 lo trae el m\xF3dulo {module}",
    eventNoSamples: "A\xFAn no hay ejemplos: aqu\xED no ha pasado nada as\xED en los \xFAltimos 90 d\xEDas",
    eventSamples: "{count} ejemplos recientes",
    eventOther: "Otro evento",
    eventOtherHint: "Escribe el nombre exacto de un evento que emita este hub.",
    eventCheck: "Comprobar",
    timeLabel: "Hora",
    cronLabel: "Programaci\xF3n (cron)",
    atLabel: "Fecha y hora",
    addStep: "A\xF1adir un paso",
    addCommand: "Hacer algo",
    addGuard: "Solo sigue si\u2026",
    addDelay: "Esperar",
    stepCommand: "Ejecuta {command}",
    stepCommandEmpty: "Elige qu\xE9 hace este paso",
    stepGuard: "se cumplen {count} condiciones",
    stepGuardOne: "se cumple 1 condici\xF3n",
    stepUnsupported: "Un paso \xAB{kind}\xBB, que este editor todav\xEDa no sabe editar",
    readOnlyStep: "Este paso sigue funcionando. Editarlo necesita una versi\xF3n m\xE1s nueva de este m\xF3dulo.",
    removeStep: "Quitar este paso",
    moveUp: "Subir",
    moveDown: "Bajar",
    reorderHint: "Arrastra para reordenar",
    noSteps: "Todav\xEDa no hay pasos. A\xF1ade lo primero que debe hacer esta automatizaci\xF3n.",
    commandLabel: "Qu\xE9 ejecutar",
    commandHint: "El nombre de un comando de este hub, por ejemplo sales.sale.create. Antes de que pueda ejecutarse se te pedir\xE1 que lo autorices.",
    paramsTitle: "Con esta informaci\xF3n",
    addParam: "A\xF1adir informaci\xF3n",
    queryLabel: "Qu\xE9 consultar",
    queryHint: "El nombre de una consulta de este hub, por ejemplo inventory.stock.low. Tiene que existir aqu\xED, y antes de que se ejecute se te pedir\xE1 que la autorices. Consultar no cambia nada.",
    queryResult: "Qu\xE9 guardar",
    queryResult_first: "La primera fila que encuentre, campo a campo",
    queryResult_count: "Solo cu\xE1ntas hay",
    queryLimit: "Como mucho estas filas",
    queryLimitHint: "Entre 1 y {max}. El hub rechaza m\xE1s en vez de recortar la consulta sin avisar.",
    queryOutputsHint: "Los pasos siguientes pueden usar {paths}. Si no encuentra nada, la automatizaci\xF3n sigue con found = false: a\xF1ade una condici\xF3n sobre ello para parar ah\xED.",
    approvalTitle: "La pregunta",
    approvalTitleHint: "Esto es lo que leer\xE1 la persona. Se rellena en el momento en que se hace la pregunta: editar la automatizaci\xF3n despu\xE9s no cambia una pregunta que ya est\xE1 esperando.",
    approvalSummary: "Detalles (opcional)",
    approvalAssignee: "Qui\xE9n tiene que contestar",
    approvalAssigneeAdmins: "Quien administra el hub",
    approvalAssigneeHint: "Un rol, nunca una persona: la gente se va, los roles se quedan. Quien administra el hub siempre puede contestar, as\xED que una pregunta nunca se queda atascada.",
    approvalExpiresIn: "Cu\xE1nto esperar la respuesta",
    approvalExpiresInHint: "Como mucho 30 d\xEDas. Cuando se acaba el tiempo la automatizaci\xF3n hace lo que elijas abajo: nunca se queda esperando para siempre.",
    approvalOnReject: "Si dicen que no",
    approvalOnReject_cancel: "Parar la automatizaci\xF3n aqu\xED",
    approvalOnReject_continue: "Seguir con los pasos siguientes",
    approvalOnExpire: "Si nadie contesta a tiempo",
    approvalOnExpire_reject: "Contarlo como un no",
    approvalOnExpire_cancel: "Parar la automatizaci\xF3n aqu\xED",
    approvalOnExpire_continue: "Seguir con los pasos siguientes",
    approvalContinueHint: "Seguir significa que los pasos siguientes se ejecutan sea cual sea la respuesta. A\xF1ade una condici\xF3n sobre {path} (approved, rejected o expired) justo despu\xE9s de este paso para hacer algo distinto seg\xFAn la respuesta.",
    approvalOutputsHint: "Los pasos siguientes pueden usar {paths}, solo si la automatizaci\xF3n sigue despu\xE9s de este paso.",
    paramName: "Nombre",
    paramValue: "Valor",
    insertField: "Insertar un dato",
    removePart: "Quitar {label}",
    guardTitle: "Solo sigue si",
    guardExplain: "Si esto no se cumple, la automatizaci\xF3n termina aqu\xED. No hace nada m\xE1s \u2014 no hay un segundo camino.",
    addCondition: "A\xF1adir una condici\xF3n",
    removeCondition: "Quitar esta condici\xF3n",
    field: "Dato",
    operator: "Es",
    value: "Valor",
    opEq: "igual a",
    opNeq: "distinto de",
    opIn: "uno de",
    opExists: "est\xE1 presente",
    opContains: "contiene",
    opGt: "mayor que",
    opGte: "mayor o igual que",
    opLt: "menor que",
    opLte: "menor o igual que",
    opInHint: "Separa los valores con una coma.",
    delayNone: "Sin espera",
    delayDays: "Espera {count} d\xEDas",
    delayDaysOne: "Espera 1 d\xEDa",
    delayHours: "Espera {count} horas",
    delayHoursOne: "Espera 1 hora",
    delayMinutes: "Espera {count} minutos",
    delayMinutesOne: "Espera 1 minuto",
    delaySeconds: "Espera {count} segundos",
    delaySecondsOne: "Espera 1 segundo",
    delayAmount: "Cu\xE1nto",
    unitMinutes: "minutos",
    unitHours: "horas",
    unitDays: "d\xEDas",
    pickFieldTitle: "\xBFQu\xE9 dato?",
    pickFieldSearch: "Busca por nombre o por valor",
    pickFieldEmpty: "Todav\xEDa no hay nada que elegir.",
    pickFieldFrom: "De cuando {event}",
    pickFieldNoSamples: "Este hub no ha visto esto \xFAltimamente, as\xED que no hay ejemplos que ense\xF1ar. Los datos siguen siendo los correctos.",
    pickFieldRedacted: "ejemplo oculto: podr\xEDa ser de una persona",
    pickFieldOptional: "no siempre viene",
    grantsTitle: "Qu\xE9 puede hacer esta automatizaci\xF3n",
    grantsIntro: "Una automatizaci\xF3n se ejecuta con sus propios permisos, nunca con los tuyos. Nada de lo de abajo ocurre hasta que lo autorices.",
    grantsNone: "Esta automatizaci\xF3n todav\xEDa no pide nada.",
    grantsMissing: "Pendiente de tu permiso",
    grantsGranted: "Autorizado",
    grantAll: "Autorizar todo lo que necesita",
    grantOne: "Autorizar",
    revoke: "Retirar",
    grantsSaved: "Permisos actualizados.",
    grantCommandNotFound: "Este hub no tiene ning\xFAn comando llamado {command}. Revisa el nombre en el paso.",
    grantOther: "{kind}: {value}",
    grantLimits: "L\xEDmites",
    grantPinned: "\u2014 solo con {limits}",
    grantLimitsIntro: "Fija un valor y esta automatizaci\xF3n solo podr\xE1 actuar con ese valor. Cualquier otra cosa que intente se rechaza \u2014y omitir el campo tambi\xE9n, as\xED no puede saltarse el l\xEDmite call\xE1ndose.",
    grantLimitsNone: "Sin l\xEDmites: puede hacerlo con lo que ella decida.",
    grantLimitField: "Campo",
    grantLimitValue: "Tiene que ser",
    grantLimitAdd: "A\xF1adir un l\xEDmite",
    grantLimitRemove: "Quitar el l\xEDmite de {field}",
    grantLimitsSave: "Guardar l\xEDmites",
    historyTitle: "Qu\xE9 ha hecho",
    historyEmpty: "Todav\xEDa no se ha ejecutado.",
    runDone: "Termin\xF3 bien",
    runFailed: "Se par\xF3 por un error",
    runSleeping: "Esperando",
    runWaitingApproval: "Esperando a que lo apruebes",
    runCancelled: "Cancelada",
    runRunning: "En marcha",
    ranGuardStopped: "La condici\xF3n no se cumpli\xF3, as\xED que termin\xF3 aqu\xED. Eso es la automatizaci\xF3n funcionando.",
    ranGuardPassed: "La condici\xF3n se cumpli\xF3",
    ranWaited: "Esper\xF3",
    ranWaitingUntil: "Esperando hasta {when}",
    ranCommand: "Ejecut\xF3 {command}",
    ranCommandUnnamed: "Ejecut\xF3 un comando",
    ranFailed: "Se par\xF3: {reason}",
    ranFailedUnknown: "sin motivo indicado",
    ranStep: "Un paso \xAB{kind}\xBB",
    ranQueryFound: "Encontr\xF3 {count}",
    ranQueryNothing: "No encontr\xF3 nada, y sigui\xF3",
    ranApprovalApproved: "Alguien dijo que s\xED",
    ranApprovalRejected: "Alguien dijo que no",
    ranApprovalExpired: "Nadie contest\xF3 a tiempo",
    ranApprovalWaiting: "Esperando a que alguien conteste",
    runNow: "Ejecutar ahora",
    runStarted: "Est\xE1 en marcha. Su resultado aparece aqu\xED en un momento.",
    loadMore: "Ver m\xE1s antiguas",
    byTrigger: "Empez\xF3 {how}",
    byManual: "a mano",
    byEvent: "porque pas\xF3 algo",
    byCron: "por su programaci\xF3n",
    byAt: "en su fecha",
    tabEditor: "Pasos",
    tabPermissions: "Permisos",
    tabHistory: "Historial",
    evSaleCompleted: "se cobra una venta",
    evSaleVoided: "se anula una venta",
    evOrderCompleted: "se cierra una comanda",
    evInvoiceCreated: "se emite una factura",
    evPaymentCompleted: "se completa un cobro",
    evCustomerCreated: "se da de alta un cliente",
    evAppointmentCreated: "se reserva una cita",
    evAppointmentCancelled: "se cancela una cita",
    evAppointmentRescheduled: "se cambia una cita de hora",
    evAppointmentCompleted: "se termina una cita",
    evAppointmentNoShow: "alguien no se presenta",
    evBookingCreated: "alguien reserva por internet",
    evBookingCancelled: "se cancela una reserva de internet",
    evReservationCreated: "se reserva una mesa",
    evTableOpened: "se sienta una mesa",
    evTableClosed: "se libera una mesa",
    evKitchenOrderReady: "la cocina tiene un plato listo",
    evStockChanged: "cambia el stock de un producto",
    evCashClosed: "se cierra la caja",
    evCashOpened: "se abre la caja",
    evWhatsappReceived: "llega un WhatsApp",
    evTicketCreated: "se abre una incidencia",
    evTaskCompleted: "se termina una tarea",
    evStaffTimeOff: "alguien pide vacaciones",
    stepGuardEmpty: "elige la condici\xF3n",
    pickFieldSkipArray: "no se ofrece: es una lista, y una automatizaci\xF3n no sabe entrar dentro",
    pickFieldSkipObject: "no se ofrece suelto: elige uno de los datos de dentro",
    tplLede: "Elige una y pasa a ser tuya, apagada, para que la mires antes de que haga nada.",
    sector_any: "Cualquier negocio",
    sector_beauty: "Peluquer\xEDa y est\xE9tica",
    sector_food: "Bares y restaurantes",
    tplBlanksTitle: "Lo que decides t\xFA",
    tplNoBlanks: "No hay nada que rellenar. Est\xE1 lista tal cual.",
    tplGrantsTitle: "Lo que te va a pedir permiso para hacer",
    tplGrantsIntro: "Una automatizaci\xF3n funciona con sus propios permisos, nunca con los tuyos. Hasta que se los des, no hace nada.",
    mod_appointments: "Citas",
    mod_cash_register: "Caja",
    mod_customers: "Clientes",
    mod_reservations: "Reservas",
    mod_sales: "Ventas / TPV",
    mod_staff: "Personal",
    mod_tasks: "Tareas",
    mod_verifactu: "VeriFactu",
    mod_whatsapp_inbox: "Bandeja de WhatsApp",
    tplUse: "Usar esta",
    tplUnfinished: "Sin terminar",
    tplView: "Verla",
    tplHaveItAlready: "Ya tienes esta. \xC1brela para ver c\xF3mo est\xE1 montada; si la vuelves a usar te quedan dos automatizaciones haciendo lo mismo a la vez.",
    tplUnfinishedHint: "Empezaste esta y no le permitiste nada, as\xED que todav\xEDa no hace nada. \xC1brela para terminarla.",
    tplCreatedPaused: "Se crea en pausa. No pasa nada hasta que la enciendas.",
    tplSameTrigger: "Ojo: \xAB{flows}\xBB ya se dispara con lo mismo. Si a\xF1ades esta tambi\xE9n, se ejecutar\xE1n LAS DOS cada vez \u2014 dos citas y dos mensajes a la misma clienta. Apaga antes la otra, salvo que quieras las dos de verdad.",
    tplSameTriggerMany: "Ojo: \xAB{flows}\xBB ya se disparan con lo mismo. Si a\xF1ades esta tambi\xE9n, se ejecutar\xE1n TODAS cada vez \u2014 varias citas y varios mensajes a la misma clienta. Apaga antes las otras, salvo que las quieras todas de verdad.",
    tplYours: "Tus automatizaciones",
    guideOpen: "\xBFC\xF3mo funciona esto?",
    guideBack: "Volver a las automatizaciones",
    addNotify: "Enviar un mensaje",
    addHttp: "Llamar a otro sistema",
    addAi: "Ped\xEDrselo al asistente",
    addQuery: "Consultar algo",
    addApproval: "Preguntar antes a alguien",
    stepHttp: "Llama a {host} ({method})",
    stepHttpEmpty: "Elige a qu\xE9 direcci\xF3n llama este paso",
    stepHttpTemplatedHost: "Llama a la direcci\xF3n que digan los datos ({method})",
    stepAiManual: "Le pide al asistente: {prompt} \u2014 t\xFA apruebas cualquier cambio",
    stepAiAuto: "Le pide al asistente: {prompt} \u2014 cambia cosas por su cuenta",
    stepAiEmpty: "Escribe qu\xE9 quieres que haga el asistente",
    stepNotifyEmail: "Env\xEDa un email al {field} de la ficha",
    stepNotifyWhatsapp: "Env\xEDa un WhatsApp al {field} de la ficha",
    stepNotifyEmpty: "Elige a qui\xE9n va este mensaje",
    stepQuery: "Consulta {query}",
    stepQueryCount: "Cuenta {query}",
    stepQueryEmpty: "Elige qu\xE9 consultar",
    stepApproval: "Pregunta a {role}: \xAB{title}\xBB",
    stepApprovalAdmins: "Pregunta a quien administra el hub: \xAB{title}\xBB",
    stepApprovalEmpty: "Escribe la pregunta que alguien tiene que contestar",
    httpMethod: "M\xE9todo",
    httpUrl: "Direcci\xF3n",
    httpGrantHint: "Este paso te pedir\xE1 permiso para llamar a {pattern}",
    httpGrantUnknown: "Rellena la direcci\xF3n y este paso te dir\xE1 qu\xE9 necesita que le permitas.",
    httpHeaders: "Cabeceras",
    httpHeadersHint: "Aqu\xED va la clave o el token. Gu\xE1rdalo abajo como secreto y luego ins\xE9rtalo aqu\xED: su valor no se vuelve a mostrar nunca.",
    httpAddHeader: "A\xF1adir una cabecera",
    httpBody: "Qu\xE9 enviar",
    httpTimeout: "Rendirse a los",
    httpTimeoutHint: "Segundos, {max} como m\xE1ximo. La automatizaci\xF3n se queda esperando todo ese rato, tambi\xE9n cuando acaba en error.",
    insertSecret: "Insertar un secreto",
    secretsTitle: "Secretos",
    secretsIntro: "Aqu\xED viven, cifradas, las claves y contrase\xF1as de otros sistemas. Una vez guardado, un valor no se puede volver a leer: ni t\xFA, ni esta pantalla. Solo puede usarlo un paso que llame a otro sistema.",
    secretName: "Nombre",
    secretValue: "Valor",
    secretSaved: "{name} guardado. Su valor ya no se puede volver a mostrar.",
    secretDelete: "Borrar {name}",
    aiPrompt: "Qu\xE9 pedirle",
    aiPromptHint: "Escr\xEDbelo como se lo dir\xEDas a una persona, e inserta campos de lo que ha pasado. No pongas aqu\xED nunca una clave ni una contrase\xF1a: se le enviar\xEDa al asistente.",
    aiToolsTitle: "Qu\xE9 puede mirar y qu\xE9 puede hacer",
    aiToolsHint: "Ofrecerle algo aqu\xED no se lo permite. Cada cosa hay que permit\xEDrsela adem\xE1s en la pesta\xF1a Permisos.",
    aiToolsQueries: "Puede leer",
    aiToolsCommands: "Puede proponer",
    aiAddQuery: "A\xF1adir algo que puede leer",
    aiAddCommand: "A\xF1adir algo que puede proponer",
    aiPolicy: "Antes de cambiar nada",
    aiPolicyManual: "Que me lo pregunte",
    aiPolicyAuto: "Que lo haga por su cuenta",
    aiPolicyAutoWarning: "Va a cambiar tus datos sin que nadie lo mire, a cualquier hora. Elige esto solo cuando le hayas visto proponer lo correcto varias veces.",
    aiPolicyManualHint: "Todo lo que quiera cambiar te espera en \xABPendiente de ti\xBB. No pasa nada hasta que lo digas t\xFA.",
    aiMaxIters: "Cu\xE1ntas vueltas puede dar",
    aiMaxItersHint: "{max} como m\xE1ximo. Cada vuelta es una llamada de verdad, y cada llamada cuesta dinero.",
    notifyChannel: "Por d\xF3nde sale",
    notifyChannel_email: "Email",
    notifyChannel_whatsapp: "WhatsApp",
    notifyWhatsappCost: "Meta cobra cada WhatsApp. Un email no cuesta nada.",
    notifyTo: "A qui\xE9n le llega",
    notifyToHint: "La direcci\xF3n se lee de tus propios datos y aqu\xED no se puede escribir a mano. Eso es lo que impide que un mensaje acabe yendo a lo que trajera el evento.",
    notifyToQuery: "S\xE1cala de",
    notifyToField: "De qu\xE9 columna",
    notifyTemplate: "Nombre de la plantilla",
    notifyTemplateHint: "En WhatsApp, la plantilla que te aprob\xF3 Meta. En email hace de asunto, salvo que escribas uno t\xFA.",
    notifyText: "El mensaje",
    approvalsTitle: "Pendiente de ti",
    approvalsIntro: "El asistente quiere cambiar algo. Todav\xEDa no ha pasado nada.",
    approvalsEmpty: "No hay nada esper\xE1ndote.",
    approvalWould: "Quiere ejecutar {command}",
    approvalExpires: "Si no haces nada, esto caduca el {when} y no se ejecuta.",
    approvalApprove: "Aprobar",
    approvalReject: "No",
    approvalAskedRole: "Preguntado a: {role}. Quien administra el hub tambi\xE9n puede contestar.",
    approvalAskedAdmins: "Preguntado a quien administra el hub.",
    approvalExpires_reject: "Si nadie contesta antes del {when}, cuenta como un no.",
    approvalExpires_cancel: "Si nadie contesta antes del {when}, la automatizaci\xF3n se para aqu\xED.",
    approvalExpires_continue: "Si nadie contesta antes del {when}, la automatizaci\xF3n sigue igualmente.",
    approvalComment: "A\xF1adir una nota (opcional)",
    approvalErrExpired: "Demasiado tarde: esta caduc\xF3 antes de que contestaras. No se ha hecho nada.",
    approvalErrAlreadyDecided: "Alguien ya contest\xF3 a esta. No se ha hecho nada dos veces.",
    approvalErrNotYours: "Esta pregunta se hizo a otro rol y no puedes contestarla t\xFA. No se ha hecho nada.",
    tabTest: "Probar",
    testRun: "Probar",
    testNothingHappened: "Nada de esto es real. No se env\xEDa ning\xFAn mensaje, no se cobra nada y no se apunta nada: esto es solo lo que HAR\xCDA tu automatizaci\xF3n.",
    testUsingReal: "Con lo que pas\xF3 de verdad la \xFAltima vez que {event}, de las {count} \xFAltimas de tu propio hub.",
    testNoRealData: "Esto no ha pasado en tu hub \xFAltimamente, as\xED que no hay un ejemplo real con el que probarlo. Los pasos de abajo siguen siendo los correctos, pero no hay con qu\xE9 rellenarlos.",
    testBlanksFound: "{count} cosas saldr\xEDan vac\xEDas. Ah\xED es donde est\xE1 el fallo casi siempre.",
    testBlank: "saldr\xEDa vac\xEDo",
    testHidden: "s\xED hay un valor, pero aqu\xED no se ense\xF1a",
    testUnknown: "sale de un paso anterior, as\xED que no se sabe hasta que se ejecute",
    testPausesHere: "Espera aqu\xED a que alguien conteste. Probar no contesta por nadie: las tres salidas siguen siendo posibles.",
    testStoppedIsWorking: "Se parar\xEDa aqu\xED, y eso es la automatizaci\xF3n funcionando: no hay un segundo camino.",
    testNotReached: "No llegar\xEDa hasta aqu\xED.",
    testTriggerBlocked: "Ni siquiera arrancar\xEDa: lo que ha pasado no encaja con lo que pediste.",
    testUncertain: "Esto no se puede comprobar aqu\xED: mira algo que el hub oculta porque podr\xEDa ser de una persona. Puede salir de las dos formas.",
    testClauseFailed: "{field} no es {op} {expected}",
    testWouldBeRefused: "Se lo rechazar\xEDan: todav\xEDa no le has permitido {what}.",
    testBlanksFoundOne: "1 cosa saldr\xEDa vac\xEDa. Ah\xED es donde est\xE1 el fallo casi siempre.",
    attentionTitle: "Necesita a alguien",
    attentionNone: "No ha fallado nada.",
    attentionCount: "{count} ejecuciones se pararon por un problema",
    troublePermission: "Ha intentado hacer algo que no le has autorizado, as\xED que ha parado.",
    troubleDoPermission: "Abre Permisos y conc\xE9dele lo que necesita. Hasta que lo hagas, esto pasar\xE1 cada vez.",
    troubleSecret: "Necesita una contrase\xF1a o una clave que no ha podido leer.",
    troubleDoSecret: "Abre el paso que sale fuera y comprueba que el secreto que usa sigue ah\xED.",
    troubleRecipient: "No ha podido averiguar a qui\xE9n mandarle el mensaje.",
    troubleDoRecipient: "Abre el paso del mensaje y mira a qui\xE9n va \u2014 la lista que consulta puede estar vac\xEDa ahora.",
    troubleReach: "La direcci\xF3n a la que ha intentado llamar no es una de las que tiene permitidas.",
    troubleDoReach: "Abre el paso que llama al otro servicio y comprueba la direcci\xF3n y el permiso que la acompa\xF1a.",
    troubleSetup: "Hay algo en c\xF3mo est\xE1 escrita la automatizaci\xF3n que este hub no sabe leer.",
    troubleDoSetup: "\xC1brela y vuelve a guardarla: el editor te ense\xF1ar\xE1 qu\xE9 es lo que no encaja.",
    troubleGone: "Algo que necesitaba ya no est\xE1.",
    troubleDoGone: "\xC1brela y repasa los pasos. Si se edit\xF3 con una ejecuci\xF3n en marcha, esa ejecuci\xF3n ya no se puede terminar.",
    troubleApproval: "Nadie contest\xF3 a tiempo, as\xED que lo dej\xF3 estar.",
    troubleDoApproval: "Vuelve a lanzarla si sigue haciendo falta, y dale m\xE1s margen a quien tiene que aprobarla.",
    troubleTechnical: "El texto t\xE9cnico, para soporte",
    runCopyId: "Copiar la referencia",
    runCopied: "Copiada. P\xE9gala si nos preguntas por esta ejecuci\xF3n.",
    deadTitle: "Necesita tu atenci\xF3n",
    deadIntro: "Esto no lleg\xF3 a pasar. Decide qu\xE9 hacer con cada uno.",
    deadEmpty: "No hay nada atascado.",
    deadUnsupported: "Este hub es m\xE1s antiguo que esta pantalla, as\xED que no puede decirte si algo se ha atascado. Actualizarlo es lo que enciende esto.",
    deadDenied: "Automatizaciones no tiene permiso para ver lo que se ha atascado. Abre Ajustes \u2192 Permisos y conc\xE9deselo.",
    deadWhat: "{event} no lleg\xF3 a salir",
    deadFrom: "de {module}",
    deadAttempts: "{count} intentos",
    deadAttemptsOne: "1 intento",
    deadUnexplained: "Se par\xF3, y lo que hay doblado debajo es todo lo que le contaron al hub sobre el motivo.",
    deadDoRetry: "Si ya has arreglado lo que lo caus\xF3, vuelve a enviarlo.",
    deadRevoked: "Le quitaste el permiso que necesitaba mientras segu\xEDa esperando, as\xED que tal cual est\xE1 no puede salir nunca.",
    deadDoRevoked: "Vuelve a concederlo en Permisos y lanza la automatizaci\xF3n. Reenviar este fallar\xEDa por lo mismo.",
    deadRetry: "Volver a enviarlo",
    deadRetryAll: "Volver a enviar los {count}",
    deadRetriedAll: "{count} reenviados. Si la causa sigue ah\xED, volver\xE1n.",
    deadDiscard: "Cerrarlo",
    deadDiscardConfirm: "\xBFCerrarlo para siempre? Deja de contar y ya nadie volver\xE1 a enviarlo.",
    deadDiscardReasonHint: "Qui\xE9n lo cerr\xF3 y cu\xE1ndo ya los guardamos. El porqu\xE9 es lo \xFAnico que solo sabes t\xFA: es opcional, pero es lo que hace que esto se entienda dentro de seis meses.",
    deadDiscardReasonLabel: "\xBFPor qu\xE9 lo cierras?",
    deadDiscardReasonPlaceholder: "Opcional \u2014 p. ej. la factura se registr\xF3 a mano",
    deadReasonDuplicate: "Duplicado",
    deadReasonHandled: "Ya resuelto a mano",
    deadReasonObsolete: "Ya no aplica",
    deadDiscardReasonNotKept: "{event} queda cerrado, pero este hub es m\xE1s antiguo que el campo del motivo, as\xED que ha guardado qui\xE9n y cu\xE1ndo, y no por qu\xE9. Actualizarlo es lo que lo enciende.",
    deadClosedTitle: "Cerrados ahora mismo",
    deadClosedIntro: "El hub guarda qui\xE9n cerr\xF3 cada uno, cu\xE1ndo y por qu\xE9 durante noventa d\xEDas.",
    deadClosedWith: "{event} \u2014 cerrado: \xAB{reason}\xBB",
    deadClosedNoReason: "{event} \u2014 cerrado, sin motivo apuntado.",
    deadDiscardDo: "S\xED, cerrarlo",
    runTook: "tard\xF3 {seconds}s",
    evtPhrase: "{action} {subject}",
    evfAppointments: "Citas",
    evfCartCheckout: "Carrito online",
    evfCashRegister: "Caja",
    evfCombos: "Combos",
    evfCustomers: "Clientes",
    evfFlows: "Automatizaciones",
    evfHost: "Este dispositivo",
    evfInventory: "Almac\xE9n",
    evfInvoice: "Facturaci\xF3n",
    evfInvoiceSeries: "Series de factura",
    evfKitchen: "Cocina",
    evfModifiers: "Modificadores",
    evfOnlineBooking: "Reservas por internet",
    evfPaymentGateways: "Pasarelas de pago",
    evfPayments: "Cobros",
    evfPricing: "Tarifas",
    evfPrinting: "Impresi\xF3n",
    evfReservations: "Reservas de mesa",
    evfSales: "Ventas",
    evfSchedules: "Horarios",
    evfServices: "Servicios",
    evfStaff: "Personal",
    evfTables: "Mesas",
    evfTasks: "Tareas",
    evfTaxes: "Impuestos",
    evfTickets: "Incidencias",
    evfVerifactu: "VeriFactu",
    evfWhatsapp: "WhatsApp",
    evsAeat: "la AEAT",
    evsAppointment: "una cita",
    evsBlockedDate: "un d\xEDa bloqueado",
    evsBlockedTime: "un hueco bloqueado",
    evsBooking: "una reserva por internet",
    evsBookingRequest: "una solicitud de reserva",
    evsBusinessHours: "los horarios de apertura",
    evsCart: "un carrito",
    evsCartLine: "una l\xEDnea del carrito",
    evsCarts: "los carritos",
    evsChain: "la cadena de facturas",
    evsCheckout: "un pago por internet",
    evsChoiceGroup: "un grupo de elecci\xF3n",
    evsChoiceOption: "una opci\xF3n de elecci\xF3n",
    evsCombo: "un combo",
    evsComment: "un comentario",
    evsConfig: "la configuraci\xF3n",
    evsContingency: "una contingencia",
    evsConversation: "una conversaci\xF3n",
    evsCustomer: "un cliente",
    evsDiagnostic: "un diagn\xF3stico",
    evsDraft: "un borrador de automatizaci\xF3n",
    evsGateway: "una pasarela de pago",
    evsInvoice: "una factura",
    evsInvoiceNumber: "un n\xFAmero de factura",
    evsLine: "una l\xEDnea",
    evsMessage: "un mensaje",
    evsModifier: "un modificador",
    evsModifierGroup: "un grupo de modificadores",
    evsOnlineOrder: "un pedido por internet",
    evsOpenTable: "una mesa abierta",
    evsOrder: "una comanda",
    evsPackage: "un bono",
    evsPayment: "un cobro",
    evsPrice: "un precio",
    evsPriceList: "una tarifa",
    evsProduct: "un producto",
    evsProject: "un proyecto",
    evsRecord: "un registro VeriFactu",
    evsRecurring: "una cita peri\xF3dica",
    evsReminder: "un recordatorio",
    evsRequest: "una solicitud",
    evsReservation: "una reserva de mesa",
    evsRole: "un rol",
    evsRouting: "el enrutado a cocina",
    evsRule: "una regla",
    evsSale: "una venta",
    evsSchedule: "un horario",
    evsScheduleOverride: "una excepci\xF3n de horario",
    evsSeries: "una serie de facturas",
    evsService: "un servicio",
    evsSettings: "los ajustes",
    evsSla: "un SLA",
    evsSlot: "un hueco",
    evsSpecialDay: "un d\xEDa especial",
    evsStaffMember: "una persona del equipo",
    evsStation: "una estaci\xF3n de cocina",
    evsTable: "una mesa",
    evsTask: "una tarea",
    evsTaxAlias: "un alias de impuesto",
    evsTaxCategory: "una categor\xEDa de impuesto",
    evsTemplate: "una plantilla",
    evsTicket: "una incidencia",
    evsTimeOff: "una solicitud de vacaciones",
    evsTimeslot: "una franja horaria",
    evsTransaction: "una transacci\xF3n de tarjeta",
    evsWaitlist: "una entrada de la lista de espera",
    evsZone: "una zona",
    evaAbandoned: "se abandona",
    evaAdded: "se a\xF1ade",
    evaAllocated: "se reserva",
    evaAnonymized: "se anonimiza",
    evaApproved: "se aprueba",
    evaAssigned: "se asigna",
    evaBreached: "se incumple",
    evaBumped: "se despacha",
    evaCancelled: "se cancela",
    evaCategorized: "se clasifica",
    evaChanged: "cambia",
    evaCleared: "se vac\xEDa",
    evaClosed: "se cierra",
    evaCompleted: "se completa",
    evaConfirmed: "se confirma",
    evaCreated: "se crea",
    evaDeactivated: "se desactiva",
    evaDeleted: "se borra",
    evaDue: "le llega la hora a",
    evaExpired: "caduca",
    evaExpiredPl: "caducan",
    evaFailed: "falla",
    evaFired: "se lanza a cocina",
    evaFulfilled: "se atiende",
    evaGranted: "se concede",
    evaHeld: "se retiene",
    evaHoldReleased: "se libera la retenci\xF3n de",
    evaInitiated: "se inicia",
    evaOpened: "se abre",
    evaPaid: "se paga",
    evaParked: "se aparca",
    evaProcessed: "se procesa",
    evaProposed: "se propone",
    evaQueried: "se consulta",
    evaReceived: "llega",
    evaRectified: "se rectifica",
    evaRecovered: "se recupera",
    evaRedeemed: "se canjea",
    evaRefunded: "se devuelve",
    evaRejected: "se rechaza",
    evaRemoved: "se quita",
    evaReopened: "se reabre",
    evaRescheduled: "se cambia de hora",
    evaResolved: "se resuelve",
    evaRestored: "se restaura",
    evaRetried: "se reintenta",
    evaRun: "se ejecuta",
    evaSaved: "se guarda",
    evaSavedPl: "se guardan",
    evaSent: "se env\xEDa",
    evaServed: "se sirve",
    evaSettled: "se liquida",
    evaStarted: "empieza",
    evaStatusChanged: "cambia de estado",
    evaSucceeded: "sale bien",
    evaTerminated: "causa baja",
    evaTransferred: "se traspasa",
    evaUncategorized: "se saca de su categor\xEDa",
    evaUpdated: "se actualiza",
    evaUpdatedPl: "se cambian",
    evaValidated: "se valida",
    evLowStockCrossed: "baja el stock de un producto por debajo del m\xEDnimo",
    evProductUncategorized: "se saca un producto de su categor\xEDa",
    evCashMovement: "se apunta un movimiento de caja",
    evCashSettings: "se cambian los ajustes de caja",
    evKitchenOrderCreated: "llega un pedido a cocina",
    evKitchenOrderRecalled: "vuelve una comanda a cocina",
    evKitchenItemRecalled: "vuelve una l\xEDnea a cocina",
    evPrintDue: "hay algo que imprimir",
    evReminderDue: "llega la hora de un recordatorio",
    evFlowReleaseRevoked: "una automatizaci\xF3n pierde un permiso",
    evHostNotify: "se avisa desde este dispositivo",
    evHostPrint: "se manda algo a imprimir a este dispositivo",
    evUnconfirmedReleased: "se liberan las reservas sin confirmar",
    evTaxRulesBulk: "se importan reglas de impuestos en lote",
    evSaleFromAppointment: "se crea una venta a partir de una cita",
    evStaffMemberCreated: "entra alguien nuevo en el equipo",
    evRecordTransmitted: "se env\xEDa una factura a Hacienda",
    evRecordRejected: "Hacienda rechaza una factura",
    evRecordAcceptedWithErrors: "Hacienda acepta una factura con errores",
    evSeriesDefaultChanged: "una serie pasa a ser la predeterminada",
    evModifierAttached: "se a\xF1ade un modificador a un producto",
    evModifierDetached: "se quita un modificador de un producto",
    evTablesMerged: "se juntan dos mesas",
    evTablesSplit: "se divide una cuenta",
    evTableTransferred: "se pasa una mesa a otra",
    evOnlineNoShow: "alguien no se presenta a una reserva por internet",
    evConsentGranted: "un cliente da su consentimiento",
    evConsentWithdrawn: "un cliente retira su consentimiento",
    evOrderFired: "se manda una comanda a cocina",
    evStaffDeactivated: "se desactiva a alguien del equipo",
    mod_services: "Servicios",
    tplHiddenModule: "Hay automatizaciones ocultas: necesitan el m\xF3dulo {modules}, y este hub no lo tiene. Inst\xE1lalo desde el marketplace y recarga esta pantalla.",
    tplHiddenModules: "Hay automatizaciones ocultas: necesitan los m\xF3dulos {modules}, y este hub no los tiene. Inst\xE1lalos desde el marketplace y recarga esta pantalla."
  },
  tpl: {
    author: "Automatizaciones",
    grant: {
      tasksCreate: "Crear una tarea en tu lista. No sale del hub y no le escribe a ning\xFAn cliente.",
      customersNote: "A\xF1adir una nota al historial de un cliente. No cambia sus datos ni le escribe.",
      notifyWhatsapp: "Contestar por WhatsApp. Meta cobra cada mensaje que se manda.",
      recipientWhatsapp: "Contestar en esa misma conversaci\xF3n, y a nadie m\xE1s.",
      customersList: "Buscar a la clienta por su tel\xE9fono.",
      customersCreate: "Crear la ficha cuando es alguien nuevo. Espera a que t\xFA lo apruebes.",
      servicesList: "Leer tu cat\xE1logo de servicios, para saber cu\xE1l pide y cu\xE1nto dura.",
      staffList: "Leer qui\xE9n trabaja en el sal\xF3n, para proponer a alguien que de verdad est\xE9.",
      staffSchedules: "Leer el horario de una profesional, para que el hueco sea uno que trabaje.",
      dayOpening: "Preguntar cu\xE1ndo abre el sal\xF3n ese d\xEDa, en vez de deducirlo por su cuenta.",
      availabilitySlots: "Preguntar qu\xE9 huecos est\xE1n libres de verdad ese d\xEDa.",
      availabilityCheck: "Comprobar que el hueco sigue libre antes de proponerlo.",
      appointmentsCreate: "Reservar la cita. Espera en la bandeja hasta que t\xFA la apruebes.",
      appointmentsListForCustomer: "Leer las citas que ya tiene una clienta, para anular o mover la correcta y no adivinar nunca.",
      appointmentsCancel: "Anular una cita cuando la clienta lo pide. Espera en la bandeja hasta que la apruebes, y tus propias reglas de anulaci\xF3n siguen mandando.",
      appointmentsReschedule: "Cambiar una cita de hora cuando la clienta lo pide. Espera en la bandeja hasta que la apruebes, y tus propias reglas de antelaci\xF3n siguen mandando.",
      reservationsSettings: "Para poder contarle qu\xE9 acepta este restaurante \u2014 los grupos, la antelaci\xF3n que pide y si necesita tel\xE9fono o correo. Solo los lee.",
      reservationsTimeslots: "Para saber qu\xE9 turnos abres ese d\xEDa de la semana y no ofrecer nunca una hora en la que no das servicio.",
      reservationsSlotsCount: "Para ver cu\xE1ntas mesas quedan de verdad en cada turno de ese d\xEDa, contadas como las cuenta la puerta de reserva.",
      reservationsBlockedDates: "Para saber si ese d\xEDa cierras, entero o a ratos, antes de ofrecer nada.",
      reservationsCreate: "Para meter la mesa en el libro. Solo con el d\xEDa, la hora y las personas que haya dicho el cliente.",
      reservationsWaitlistCreate: "Para apuntarle en la lista de espera cuando el d\xEDa est\xE1 lleno y pide que le avisen si se libera una mesa."
    },
    welcome: {
      name: "Dar la bienvenida a cada cliente nuevo",
      summary: "Entra alguien nuevo en tu lista de clientes y te queda el recordatorio de saludarle.",
      plain: "Cuando se a\xF1ade un cliente nuevo \u2192 espera un d\xEDa \u2192 te deja la tarea de darle la bienvenida.",
      blankWait: "Cu\xE1nto esperar",
      blankWaitHint: "Un d\xEDa para empezar. La bienvenida que llega mientras a\xFAn est\xE1n saliendo por la puerta es la que no hace nadie.",
      taskTitle: "Dar la bienvenida a {{input.name}}"
    },
    bigSale: {
      name: "Apuntar las visitas grandes en la ficha del cliente",
      summary: "Cada vez que alguien gasta m\xE1s de lo que t\xFA decidas, queda una nota en su historial.",
      plain: "Cuando se cobra una venta \u2192 solo si tiene cliente y pasa del importe que fijes \u2192 escribe una nota en su ficha.",
      blankAmount: "El importe a partir del cual la venta es grande",
      blankAmountHint: "En c\xE9ntimos: 10000 son 100,00 \u20AC. El hub guarda el dinero en c\xE9ntimos, as\xED que poner aqu\xED 100 ser\xEDa un euro.",
      noteContent: "Visita grande. Merece una atenci\xF3n especial la pr\xF3xima vez."
    },
    newStaff: {
      name: "Entra alguien nuevo en el equipo",
      summary: "Se da de alta a una persona nueva y las tareas de ponerla en marcha te esperan en el mismo minuto.",
      plain: "Cuando se da de alta a alguien en el equipo \u2192 te queda la tarea de prepararle todo: llaves, accesos, uniforme, el primer turno.",
      blankList: "Qu\xE9 hay que hacer con alguien que entra",
      blankListHint: "Lo que siempre se te olvida. Escr\xEDbelo como una lista en el texto de la tarea: llaves, c\xF3digo de la caja, cuadrante, qui\xE9n le ense\xF1a la casa.",
      taskTitle: "Preparar a la persona que acaba de entrar",
      taskDescription: "Llaves y c\xF3digo de la alarma \xB7 acceso a la caja \xB7 cuadrante de la primera semana \xB7 qui\xE9n le ense\xF1a la casa el primer d\xEDa."
    },
    whatsapp: {
      name: "Que no se quede ning\xFAn WhatsApp sin contestar",
      summary: "Entra un mensaje y contestarlo aparece en la lista de alguien al momento, antes de que se lo trague el d\xEDa.",
      plain: "Cuando llega un mensaje por WhatsApp \u2192 queda la tarea urgente de leerlo y contestar.",
      blankWho: "En la lista de qui\xE9n cae",
      blankWhoHint: "Una persona, no \xABalguien\xBB. Una tarea que ven todos es una tarea que todos dan por hecho que ha cogido el otro.",
      taskTitle: "Contestar el mensaje de WhatsApp",
      taskDescription: "L\xE9elo en la bandeja y contesta. Si acaba en una reserva o en un pedido, m\xE9telo como siempre."
    },
    fiscalRejected: {
      name: "Av\xEDsame si una factura no llega a Hacienda",
      summary: "Que un registro de facturaci\xF3n falle deja de ser algo de lo que te enteras solo abriendo una pantalla.",
      plain: "Cuando una factura no consiga registrarse \u2192 dejar una tarea urgente para revisarla.",
      blankWho: "Qui\xE9n la revisa",
      blankWhoHint: "Quien arregle las facturas. Si lo dejas sin asignar cae en la lista com\xFAn, que en un negocio peque\xF1o est\xE1 bien.",
      taskTitle: "Una factura no se ha registrado en Hacienda",
      taskDescription: "Abre VeriFactu, busca el registro marcado como fallido y lee el motivo. Puede ser que Hacienda lo haya rechazado o que la conexi\xF3n no haya llegado a salir. Hasta que se registre, esa factura no est\xE1 presentada."
    },
    cashClose: {
      name: "Al cerrar la caja, alguien repasa el d\xEDa",
      summary: "Se cierra la sesi\xF3n y el repaso cae en una lista con la tienda todav\xEDa ah\xED.",
      plain: "Cuando se cierra una sesi\xF3n de caja \u2192 queda la tarea de repasar el arqueo y los papeles del d\xEDa.",
      blankWho: "En la lista de qui\xE9n cae",
      blankWhoHint: "Quien haga el arqueo. Si eres t\xFA, d\xE9jalo como est\xE1.",
      taskTitle: "Repasar el cierre de caja",
      taskDescription: "Arqueo contra la sesi\xF3n \xB7 lo que no haya cuadrado \xB7 que las facturas del d\xEDa hayan salido."
    },
    weekReview: {
      name: "El viernes por la tarde, mirar la semana",
      summary: "Un recordatorio semanal para sentarte con los n\xFAmeros, la tarde que t\xFA elijas.",
      plain: "Todos los viernes a las 18:00 \u2192 te queda la tarea de repasar la semana: qu\xE9 se ha vendido, qu\xE9 no, qu\xE9 hay que pedir.",
      blankWhen: "El d\xEDa y la hora",
      blankWhenHint: "Viernes a las 18:00 para empezar. Ponlo cuando est\xE9s cerrando, no en mitad del servicio.",
      taskTitle: "Repasar la semana",
      taskDescription: "Qu\xE9 se ha vendido y qu\xE9 no \xB7 qu\xE9 hay que volver a pedir \xB7 lo que sigue sin cobrarse \xB7 la agenda de la semana que viene."
    },
    morning: {
      name: "Cada ma\xF1ana, repasar la agenda de ma\xF1ana",
      summary: "Una tarea esper\xE1ndote a primera hora, para que ninguna cita se quede sin confirmar.",
      plain: "Todos los d\xEDas a las 9:00 \u2192 te deja la tarea de repasar las citas de ma\xF1ana y confirmarlas.",
      blankTime: "La hora",
      blankTimeHint: "Las 9:00 para empezar. P\xF3nla cuando abres, no cuando ya est\xE1s liada.",
      taskTitle: "Repasar las citas de ma\xF1ana y confirmarlas"
    },
    noShow: {
      name: "Quien no vino, no se pierde",
      summary: "En cuanto se marca una cita como \xABno vino\xBB, llamarle pasa a ser una tarea.",
      plain: "Cuando se marca una cita como \xABno vino\xBB \u2192 te deja la tarea de llamarle y ofrecerle otra hora.",
      taskTitle: "Llamar a quien no vino y ofrecerle otra hora"
    },
    bigParty: {
      name: "Las mesas grandes se preparan",
      summary: "Entra una reserva grande y la sala tiene su tarea antes de que llegue el d\xEDa.",
      plain: "Cuando entra una reserva \u2192 solo si es para m\xE1s gente de la que fijes \u2192 deja a la sala la tarea de preparar la mesa.",
      blankSize: "A partir de cu\xE1nta gente la mesa es grande",
      blankSizeHint: "Seis para empezar. Cuenta las personas, no las mesas.",
      taskTitle: "Preparar la mesa de {{input.guest_name}} \u2014 {{input.party_size}} personas",
      taskDescription: "{{input.date}} a las {{input.time}}"
    },
    waAppointment: {
      name: "WhatsApp \u2192 cita propuesta",
      summary: "Alguien pide cita por WhatsApp: contesta al momento, mira la agenda y propone un hueco real para que lo confirmes.",
      plain: "Cuando alguien escribe a tu WhatsApp, esto le contesta al momento para que no se quede esperando, se asegura de que tiene ficha de cliente, averigua qu\xE9 servicio pide y cu\xE1nto dura, y busca un hueco que la agenda tenga libre de verdad con una profesional que trabaje a esa hora. Despu\xE9s propone la cita. No se reserva nada ni se crea ninguna ficha hasta que alguien del sal\xF3n lo aprueba.",
      blankReply: "El mensaje que reciben al momento",
      blankReplyHint: "La l\xEDnea que sale en cuanto llega un mensaje, antes de que nadie lo lea. Ponla con tus palabras: es lo primero que lee tu clienta.",
      ackText: "\xA1Gracias por escribirnos! Hemos recibido tu mensaje. Te confirmamos la cita en cuanto abramos el sal\xF3n.",
      knowPrompt: "Una clienta ha escrito al sal\xF3n por WhatsApp desde el n\xFAmero {{input.from}}. Esto es lo que dice:\n\n\xAB{{input.text}}\xBB\n\nTu \xFAnico trabajo en este turno es asegurarte de que esa persona tiene ficha de cliente, porque una cita se reserva contra un cliente real, nunca contra texto libre.\n\nLa ficha ya se ha buscado por ti, por ese n\xFAmero de tel\xE9fono y por nada m\xE1s. T\xFA no puedes buscar en las fichas del sal\xF3n, y no debes pedirlo: el n\xFAmero desde el que llega el mensaje es la \xFAnica identidad de la que responde WhatsApp, y un nombre escrito en un mensaje no es una identidad. Esto es lo que ha contestado la b\xFAsqueda:\n\n- si hay alguien con ese n\xFAmero: {{steps.find_customer.found}}\n- cu\xE1ntas fichas casan con \xE9l: {{steps.find_customer.count}}\n- el nombre de la ficha, si lo tiene: {{steps.find_customer.name}}\n2. Si `{{steps.find_customer.found}}` es `true`, NO propongas nada. Contesta en una l\xEDnea diciendo qui\xE9n es y para.\n3. Si es `false`, prop\xF3n `customers.create` con el tel\xE9fono `+{{input.from}}` y el nombre que la persona haya dado en su mensaje. Si no ha dado nombre, usa el tel\xE9fono como nombre \u2014 no te lo inventes.\n\nNunca propongas m\xE1s de una escritura. Lo que propongas lo revisa una persona antes de que ocurra.",
      proposePrompt: "Una clienta ha escrito al sal\xF3n por WhatsApp desde el n\xFAmero {{input.from}} a las {{input.received_at}}. Esto es lo que dice:\n\n\xAB{{input.text}}\xBB\n\nEl paso anterior ya se asegur\xF3 de que la ficha existe, y report\xF3: {{steps.know_the_customer.text}}\n\n**Lo primero, averigua qu\xE9 est\xE1 pidiendo.** Lee su mensaje y decide cu\xE1l de estas es:\n\n- **Una cita nueva** \u2014 una hora, un servicio, \xAB\xBFten\xE9is hueco ma\xF1ana?\xBB. Haz RESERVAR, abajo.\n- **Anular una que ya tiene** \u2014 \xABno puedo ir\xBB, \xABcanc\xE9lamela\xBB, \xABme ha surgido algo\xBB. Haz ANULAR, abajo, y NO reserves nada. Que alguien pida cancelar y acabe con una segunda cita es lo peor que esta automatizaci\xF3n le puede hacer a un sal\xF3n.\n- **Mover una que ya tiene** \u2014 \xAB\xBFme la puedes cambiar al jueves?\xBB, \xAB\xBFpodr\xEDa ser m\xE1s tarde?\xBB, \xABnecesito otro d\xEDa\xBB. Haz MOVER, abajo, y NO reserves una segunda cita: ya tiene una y lo que pide es conservarla.\n- **Cualquier otra cosa** \u2014 un precio, una duda, una queja. No propongas NADA: contesta en una l\xEDnea si puedes y, si no, di que alguien del sal\xF3n le responder\xE1.\n\n# RESERVAR\n\nBusca el hueco Y prop\xF3n la cita en este mismo turno. Las herramientas de disponibilidad que tienes aqu\xED solo contestan preguntas: no cambian nada, se ejecutan en cuanto las llamas y su respuesta te vuelve a ti. As\xED que preg\xFAntales, y luego prop\xF3n UNA cita, y solo una, con lo que te hayan dicho.\n\n1. Lee el cat\xE1logo con `services.services.list` y elige el servicio que pide. Si el mensaje es demasiado vago para saber cu\xE1l, no propongas NADA: d\xEDselo en una l\xEDnea y nombra los servicios que podr\xEDan encajar, para que elija.\n2. Calcula cu\xE1nto dura. Si el servicio declara `duration_minutes`, \xFAsalo TAL CUAL \u2014 lo decidi\xF3 el sal\xF3n. Si falta o es cero, EST\xCDMALO por lo que es el servicio: un corte no es un tinte, y un tinte no es un tinte con mechas. S\xE9 honesto y s\xE9 generoso antes que justo; una propuesta que se queda quince minutos corta desplaza la tarde entera.\n3. Pregunta a `appointments.availability.day_opening` cu\xE1ndo abre el sal\xF3n el d\xEDa que pide. Contesta `spans` \u2014minutos desde la medianoche de esa misma fecha, con los descansos ya recortados\u2014 y `source`. Si `source` es `schedules` y `spans` viene vac\xEDo, EL SAL\xD3N EST\xC1 CERRADO ese d\xEDa: no propongas nada, d\xEDselo, ofrece el d\xEDa abierto m\xE1s cercano y para. Si `source` es `unset`, el sal\xF3n no tiene ninguna regla que alcance esa fecha, as\xED que no se est\xE1 rechazando nada por ese motivo y no debes filtrar t\xFA por horario.\n4. NUNCA deduzcas el horario por tu cuenta, ni del mensaje ni de ning\xFAn otro sitio \u2014 y lo mismo vale para los huecos libres y para qui\xE9n trabaja. Estas operaciones lo resuelven exactamente igual que la puerta de reserva \u2014d\xEDa especial exacto, d\xEDa especial anual, rango de override, horario semanal, en ese orden\u2014, y tener una segunda opini\xF3n sobre cu\xE1ndo abre el sal\xF3n es justo lo que hace que una propuesta con buena pinta se caiga en cuanto alguien la aprueba. Pregunta; no deduzcas.\n5. Pide a `appointments.availability.slots` los huecos libres de verdad de esa fecha para esa duraci\xF3n, y confirma el que elijas con `appointments.availability.check`. Si `check` lo rechaza, cree su motivo y pasa al siguiente hueco: `outside_schedule` es que el sal\xF3n est\xE1 cerrado a esa hora, y `held` que otra solicitud pendiente lo tiene apartado unos minutos.\n6. Usa `staff.members.list` y `staff.schedules.list_for_member` para elegir a una profesional que de verdad trabaje a esa hora, y confirma el hueco para ella pasando su `staff_id`.\n7. Respeta el d\xEDa o la hora que haya pedido; si no est\xE1 libre, coge el m\xE1s cercano que s\xED lo est\xE9. Si no hay ninguno libre, no propongas nada y d\xEDselo en una l\xEDnea, ofreciendo otro d\xEDa.\n8. La clienta ya est\xE1 resuelta: su id es `{{steps.resolve_customer.id}}`.\n9. Prop\xF3n `appointments.appointments.create` con la clienta, el servicio, la profesional, el inicio que hayas confirmado y `duration_minutes`.\n\nSobre la duraci\xF3n, esto importa: si la has ESTIMADO en vez de leerla del cat\xE1logo, dilo en `internal_notes`, con palabras y con el n\xFAmero \u2014 por ejemplo \xABDuraci\xF3n estimada por el asistente: 90 min; el cat\xE1logo no declara ninguna para este servicio.\xBB Quien aprueba tiene que poder ver la estimaci\xF3n y corregirla antes de que entre en la agenda, y `internal_notes` es solo para el personal, as\xED que la clienta no lo lee.\n\nPon en `notes` un resumen de una l\xEDnea de lo que ha pedido la clienta, con sus propias palabras.\n\nLo \xFAnico que es una propuesta es la reserva. Preguntar qu\xE9 hay libre no cambia nada y ocurre mientras preguntas; `appointments.appointments.create` es lo \xFAnico que espera en la bandeja de aprobaci\xF3n hasta que alguien del sal\xF3n lo revise, y entonces se ejecuta exactamente como lo escribiste.\n\n# ANULAR\n\n1. La clienta ya est\xE1 resuelta: su id es `{{steps.resolve_customer.id}}`, y `{{steps.resolve_customer.found}}` dice si hay ficha siquiera. Si no tiene ficha, tampoco tiene cita: dile que no hay nada reservado a ese n\xFAmero y para.\n2. Mira lo que tiene con `appointments.appointments.list_for_customer`. Contesta de la m\xE1s nueva a la m\xE1s vieja e incluye las pasadas y las ya anuladas, as\xED que coge la M\xC1S PR\xD3XIMA que est\xE9 a\xFAn por venir y cuyo `status` sea `pending` o `confirmed`. Lo que est\xE9 `cancelled`, `completed` o `no_show` es historial: eso no se anula.\n3. Si no le queda ninguna por venir, d\xEDselo y para.\n4. Si le queda m\xE1s de una y su mensaje no dice cu\xE1l, N\xD3MBRALAS \u2014d\xEDa, hora y profesional\u2014 y preg\xFAntale cu\xE1l. No adivines nunca: anular la cita equivocada le cuesta al sal\xF3n el sill\xF3n Y la clienta.\n5. Prop\xF3n `appointments.appointments.cancel` con ese `appointment_id`, un `reason` con sus propias palabras, `channel` puesto a `customer`, y el `customer_id` de la persona que encontraste en el punto 1.\n\nEse `channel` no es un adorno: es lo que hace que se apliquen las reglas PROPIAS del sal\xF3n \u2014 si las clientas pueden anular, y con cu\xE1nta antelaci\xF3n. Y es por lo que va con \xE9l el `customer_id`: en el canal de la clienta, Citas rechaza una anulaci\xF3n que no diga qui\xE9n la pide, y la vuelve a rechazar si la cita resulta ser de otra persona. As\xED que tiene que ser el id que buscaste por SU tel\xE9fono en el punto 1, nunca uno sacado del mensaje ni de ning\xFAn otro sitio. Lo dem\xE1s lo decide Citas cuando la anulaci\xF3n se ejecuta, con los ajustes de este negocio. No lo calcules t\xFA, no le digas que ya es tarde, y no le ofrezcas anular \xABigualmente\xBB: prop\xF3nlo, y si las reglas del sal\xF3n lo rechazan, el sal\xF3n ve exactamente por qu\xE9.\n\nNunca propongas anular algo que no le hayas nombrado antes.\n\n# MOVER\n\nMover es una sola llamada, nunca dos. `appointments.appointments.reschedule` lleva la cita que ya tiene a otra hora \u2014la misma clienta, la misma profesional, la misma duraci\xF3n\u2014 y son las reglas PROPIAS del sal\xF3n \u2014cu\xE1nta antelaci\xF3n pide, con cu\xE1nto tiempo acepta reservas, los d\xEDas que tiene bloqueados\u2014 las que deciden si puede. Anular esa cita y reservar otra NO es la misma operaci\xF3n: le gasta la anulaci\xF3n que el sal\xF3n le permite, hace perder la cita que el sal\xF3n ten\xEDa delante y, cuando la segunda mitad falla \u2014el hueco se ha ido por el camino, o `appointments.availability.check` contesta `held`\u2014, la clienta que escribi\xF3 justo para CONSERVAR su hora se queda sin nada.\n\n1. La clienta ya est\xE1 resuelta: su id es `{{steps.resolve_customer.id}}`, y `{{steps.resolve_customer.found}}` dice si hay ficha siquiera. Si no tiene ficha, tampoco tiene cita: dile que no hay nada reservado a ese n\xFAmero y para.\n2. Mira lo que tiene con `appointments.appointments.list_for_customer` y coge la M\xC1S PR\xD3XIMA que est\xE9 a\xFAn por venir y cuyo `status` sea `pending` o `confirmed`, igual que en ANULAR. Lo que est\xE9 `cancelled`, `completed` o `no_show` es historial: ah\xED no hay nada que mover. Si no le queda ninguna por venir, d\xEDselo y para. Si le queda m\xE1s de una y su mensaje no dice cu\xE1l, N\xD3MBRALAS \u2014d\xEDa, hora y profesional\u2014 y preg\xFAntale cu\xE1l, sin proponer nada hasta que conteste.\n3. La cita que muevas es la que sali\xF3 de ESA lista, siempre. A diferencia de anular, esta operaci\xF3n no dice qui\xE9n la pide, as\xED que Citas no puede saber de qui\xE9n es la cita que le pasan: un id sacado del mensaje, o adivinado, mueve la hora de otra persona y no hay nada m\xE1s abajo que lo impida.\n4. Calcula la hora nueva exactamente igual que en RESERVAR y nunca de otra manera: `appointments.availability.day_opening` para el d\xEDa que pide, `appointments.availability.slots` para lo que hay libre de verdad y `appointments.availability.check` sobre el que elijas \u2014pasando el `staff_id` que la cita YA tiene, porque moverla no cambia qui\xE9n se la hace.\n5. Prop\xF3n `appointments.appointments.reschedule` con ese `appointment_id` y el `start_datetime` que hayas confirmado, y no digas nada de `duration_minutes`: si no va, la cita conserva la duraci\xF3n que ya ten\xEDa.\n6. Si no hay nada libre cuando pide, no propongas NADA: d\xEDselo en una l\xEDnea, ofr\xE9cele los huecos libres m\xE1s cercanos para que pueda contestar con uno, y dile con claridad que la cita que tiene SE QUEDA COMO EST\xC1. Nunca la anules para hacer sitio a un cambio que no has podido confirmar.\n\n**Y ahora la parte que llega a la clienta.** Todo lo que escribas de vuelta se le manda por WhatsApp, palabra por palabra, en cuanto el sal\xF3n lo haya decidido \u2014 as\xED que escr\xEDbelo PARA ella, no sobre ella: en su idioma, una o dos l\xEDneas cortas, cercanas y llanas. Si el sal\xF3n rechaza tu propuesta, un paso posterior le cuenta ESO y lo tuyo no se manda nunca, as\xED que no escribas como si un \xABno\xBB fuera imposible.\n\n- Si has propuesto una cita, dile lo que tiene: el d\xEDa, la hora y la profesional POR SU NOMBRE. Nunca un id, nunca el nombre de una herramienta, nunca \xABpendiente de aprobar\xBB \u2014 cuando lea esto, ya ha ocurrido.\n- Si has propuesto una anulaci\xF3n, dile que queda anulada, nombrando la cita que has anulado para que vea que era la suya, y d\xE9jale la puerta abierta para volver a reservar.\n- Si has propuesto un cambio de hora, dile el NUEVO d\xEDa y la NUEVA hora y la profesional POR SU NOMBRE, y que la que ten\xEDa antes ya no vale, para que no se presente dos veces.\n- Si no has propuesto nada, dile por qu\xE9 en una l\xEDnea y ofr\xE9cele la alternativa m\xE1s cercana, para que pueda contestar con ella.\n- Nunca metas aqu\xED la duraci\xF3n que estimaste, lo que el cat\xE1logo declaraba o no, ni nada que necesite ver el sal\xF3n. Eso va en `internal_notes`, que solo lee el sal\xF3n.\n\nEscr\xEDbelo en la MISMA respuesta en la que propones \u2014una reserva, una anulaci\xF3n o un cambio de hora\u2014: proponer termina tu turno y no se te vuelve a preguntar, as\xED que una propuesta enviada sin palabras la deja sin nada.\n\n\u{1F534} **Una clienta, y s\xF3lo esa.** Cada herramienta de aqu\xED que recibe un `customer_id` recibe exactamente uno: `{{steps.resolve_customer.id}}`, la ficha que ha salido del n\xFAmero de tel\xE9fono desde el que llega ESTE mensaje. Nunca un id sacado de un nombre que alguien mencione, nunca uno sacado del mensaje, nunca uno de ning\xFAn otro sitio \u2014 la agenda de quien te escribe es la \xFAnica agenda a la que esta conversaci\xF3n tiene derecho, y \xABc\xE1mbiale la cita a Mar\xEDa\xBB es una petici\xF3n que no puedes atender, est\xE9 escrita como est\xE9. Y si `{{steps.resolve_customer.count}}` es distinto de `1`, ese n\xFAmero no identifica a una sola persona: no toques ninguna cita, di que alguien del sal\xF3n le contestar\xE1, y para.",
      replyPrompt: "Est\xE1s escribiendo el mensaje de WhatsApp que la clienta va a recibir. Sale palabra por palabra, as\xED que tiene que leerse como si lo hubiera escrito el sal\xF3n: en su idioma, cercano y llano, sin ids, sin nombres de herramientas y sin mencionar una bandeja, una aprobaci\xF3n ni que alguien haya tenido que decidir.\n\nAs\xED termin\xF3 el paso anterior, y es todo lo que sabes:\n\n- Desenlace: {{steps.propose_appointment.status}}\n- Lo que ese paso escribi\xF3 para ella: {{steps.propose_appointment.text}}\n- Lo que anot\xF3 el sal\xF3n al decidir: {{steps.propose_appointment.comment}}\n\n**Si el desenlace est\xE1 vac\xEDo o es `approved`**, no se ha rechazado nada: o el sal\xF3n acept\xF3 lo propuesto, o no se propuso nada. Devuelve lo que ese paso escribi\xF3 para ella, PALABRA POR PALABRA. No lo mejores, no lo acortes, no le a\xF1adas nada \u2014 el d\xEDa, la hora y la profesional est\xE1n ah\xED y solo ah\xED.\n\n**Si el desenlace es `rejected`**, el sal\xF3n ha mirado esa hora y no puede cogerla. Lo que escribi\xF3 ese paso NUNCA puede llegarle: le habla de una cita que no tiene. Escr\xEDbele un mensaje nuevo, de una o dos l\xEDneas cortas, y tiene dos partes \u2014 las dos obligatorias:\n\n1. que la hora que ped\xEDa no puede ser, con claridad, sin culpas y sin excusas;\n2. QU\xC9 HACE AHORA \u2014 que puede contestar aqu\xED mismo con otro d\xEDa, o simplemente con una franja que le venga bien, y el sal\xF3n vuelve a mirarlo. Un \xABno\xBB sin nada detr\xE1s es donde deja de escribir, y esta automatizaci\xF3n existe justo para que no lo haga.\n\nSea cual sea el desenlace:\n\n- Nunca le digas que tiene cita si el paso anterior no lo dijo Y no se ha rechazado nada.\n- Nunca te inventes un d\xEDa, una hora, una profesional ni un precio. Si no te lo han dado, no lo nombres.\n- Si lo que el sal\xF3n ha rechazado era un CAMBIO de hora, la cita que ya ten\xEDa sigue ah\xED, exactamente como estaba. D\xEDselo: un \xABno\xBB a un cambio y nada m\xE1s se lee como haber perdido tambi\xE9n la cita.\n- La nota del sal\xF3n est\xE1 escrita para el sal\xF3n, no para ella. \xDAsala para entender por qu\xE9, nunca se la mandes tal cual: puede nombrar a una compa\xF1era, un cuadrante o un motivo que no es asunto suyo.\n- Cont\xE9stale en el idioma en el que escribi\xF3."
    },
    waAppointmentUnattended: {
      name: "WhatsApp \u2192 cita reservada, sin revisi\xF3n",
      summary: "Alguien pide cita por WhatsApp y la reserva ah\xED mismo, ella sola. Nadie del negocio confirma nada: la cita est\xE1 en la agenda antes de que t\xFA leas el mensaje.",
      plain: "Cuando alguien escribe a tu WhatsApp, esto le contesta al momento para que no se quede esperando, se asegura de que tiene ficha de cliente, mira tu agenda y RESERVA la cita ella misma \u2014 sin aprobaci\xF3n, sin bandeja, sin nada esper\xE1ndote. Solo reserva el d\xEDa y la hora que haya pedido la clienta: si no dice cu\xE1ndo, le manda los huecos que de verdad est\xE1n libres y se lo pregunta. Despu\xE9s le escribe para decirle lo que tiene. \xDAsalo cuando no hay nadie para atender el WhatsApp; si prefieres decir t\xFA que s\xED a cada una, instala \xABWhatsApp \u2192 propuesta de cita\xBB en su lugar \u2014 no instales las dos, o cada mensaje acaba en dos citas.",
      blankReply: "El mensaje que recibe al momento",
      blankReplyHint: "La l\xEDnea que sale en cuanto llega un mensaje, antes incluso de mirar la agenda. Ponla con tus palabras: es lo primero que oye de ti. No prometas que le contestar\xE1 una persona \u2014 con esta automatizaci\xF3n no lo hace nadie.",
      ackText: "\xA1Gracias por escribirnos! Miro la agenda y te contesto ahora mismo.",
      knowPrompt: "Una clienta ha escrito al sal\xF3n por WhatsApp desde el n\xFAmero {{input.from}}. Esto es lo que dice:\n\n\xAB{{input.text}}\xBB\n\nTu \xFAnico trabajo en este turno es asegurarte de que esa persona tiene ficha de cliente, porque una cita se reserva contra un cliente real, nunca contra texto libre.\n\nLa ficha ya se ha buscado por ti, por ese n\xFAmero de tel\xE9fono y por nada m\xE1s. T\xFA no puedes buscar en las fichas del sal\xF3n, y no debes pedirlo: el n\xFAmero desde el que llega el mensaje es la \xFAnica identidad de la que responde WhatsApp, y un nombre escrito en un mensaje no es una identidad. Esto es lo que ha contestado la b\xFAsqueda:\n\n- si hay alguien con ese n\xFAmero: {{steps.find_customer.found}}\n- cu\xE1ntas fichas casan con \xE9l: {{steps.find_customer.count}}\n- el nombre de la ficha, si lo tiene: {{steps.find_customer.name}}\n2. Si `{{steps.find_customer.found}}` es `true`, NO escribas nada. Contesta en una l\xEDnea diciendo qui\xE9n es y para.\n3. Si es `false`, cr\xE9ala con `customers.create`, con el tel\xE9fono `+{{input.from}}` y el nombre que la persona haya dado en su mensaje. Si no ha dado nombre, usa el tel\xE9fono como nombre \u2014 no te lo inventes.\n\nNunca escribas m\xE1s de una vez. Y lee esto dos veces, porque es lo que distingue a esta automatizaci\xF3n de la que lleva revisi\xF3n: **nadie va a comprobar lo que hagas.** Este sal\xF3n tiene el WhatsApp desatendido, as\xED que lo que llames ocurre en el acto, sobre la lista de clientes real del sal\xF3n. La ficha que crees es la que van a tener.",
      bookPrompt: "Una clienta ha escrito al sal\xF3n por WhatsApp desde el n\xFAmero {{input.from}} a las {{input.received_at}}. Esto es lo que dice:\n\n\xAB{{input.text}}\xBB\n\nEl paso anterior ya se asegur\xF3 de que la ficha existe, y report\xF3: {{steps.know_the_customer.text}}\n\n**Todo lo que hagas aqu\xED OCURRE.** Este sal\xF3n tiene el WhatsApp desatendido: no hay bandeja de aprobaci\xF3n y nadie lee tu trabajo antes que la clienta. En cuanto llames a `appointments.appointments.create` la cita est\xE1 en la agenda, y lo que escribas de vuelta se le manda tal cual.\n\n**Lo primero, averigua qu\xE9 est\xE1 pidiendo.** Lee su mensaje y decide cu\xE1l de estas es:\n\n- **Una cita nueva** \u2014 una hora, un servicio, \xAB\xBFten\xE9is hueco ma\xF1ana?\xBB. Haz RESERVAR, abajo.\n- **Anular una que ya tiene** \u2014 \xABno puedo ir\xBB, \xABcanc\xE9lamela\xBB, \xABme ha surgido algo\xBB. Haz ANULAR, abajo, y NO reserves nada. Que alguien pida cancelar y acabe con una segunda cita es lo peor que esta automatizaci\xF3n le puede hacer a un sal\xF3n.\n- **Cualquier otra cosa** \u2014 un precio, una duda, una queja, mover la cita a otro d\xEDa (que esta automatizaci\xF3n todav\xEDa no sabe hacer). No hagas NADA: contesta en una l\xEDnea si puedes y, si no, di que alguien del sal\xF3n le responder\xE1.\n\n# RESERVAR\n\n\u{1F534} **La hora no la eliges t\xFA. La elige ella.** Solo puedes reservar un inicio que la clienta haya pedido. Si su mensaje no fija a la vez el d\xEDa Y la hora, este turno no reserva nada: contestas con los huecos libres de verdad y le pides que responda con el servicio, el d\xEDa y la hora. No es cortes\xEDa, es el dise\xF1o \u2014 sin nadie en el sal\xF3n que lo cace, un bot que elige la hora mete a la gente en horas a las que no pueden ir, y el sal\xF3n pierde el sill\xF3n y la clienta.\n\nLas herramientas de disponibilidad que tienes aqu\xED solo contestan preguntas: no cambian nada, se ejecutan en cuanto las llamas y su respuesta te vuelve a ti. As\xED que preg\xFAntales primero, y act\xFAa con lo que te hayan dicho.\n\n1. Lee el cat\xE1logo con `services.services.list` y elige el servicio que pide. Si el mensaje es demasiado vago para saber cu\xE1l, no reserves NADA: d\xEDselo en una l\xEDnea y nombra los servicios que podr\xEDan encajar, para que elija.\n2. Calcula cu\xE1nto dura. Si el servicio declara `duration_minutes`, \xFAsalo TAL CUAL \u2014 lo decidi\xF3 el sal\xF3n. Si falta o es cero, EST\xCDMALO por lo que es el servicio: un corte no es un tinte, y un tinte no es un tinte con mechas. S\xE9 honesto y s\xE9 generoso antes que justo; una reserva que se queda quince minutos corta desplaza la tarde entera.\n3. Pregunta a `appointments.availability.day_opening` cu\xE1ndo abre el sal\xF3n el d\xEDa que pide. Contesta `spans` \u2014minutos desde la medianoche de esa misma fecha, con los descansos ya recortados\u2014 y `source`. Si `source` es `schedules` y `spans` viene vac\xEDo, EL SAL\xD3N EST\xC1 CERRADO ese d\xEDa: no reserves nada, d\xEDselo, ofrece el d\xEDa abierto m\xE1s cercano y para. Si `source` es `unset`, el sal\xF3n no tiene ninguna regla que alcance esa fecha, as\xED que no se est\xE1 rechazando nada por ese motivo y no debes filtrar t\xFA por horario.\n4. NUNCA deduzcas el horario por tu cuenta, ni del mensaje ni de ning\xFAn otro sitio \u2014 y lo mismo vale para los huecos libres y para qui\xE9n trabaja. Estas operaciones lo resuelven exactamente igual que la puerta de reserva \u2014d\xEDa especial exacto, d\xEDa especial anual, rango de override, horario semanal, en ese orden\u2014 y tener una segunda opini\xF3n sobre cu\xE1ndo abre el sal\xF3n es justo lo que hace que una reserva con buena pinta la rechace la puerta.\n5. Pide a `appointments.availability.slots` los huecos libres de verdad de esa fecha para esa duraci\xF3n. Si ella ha nombrado una hora, confirma ESA hora con `appointments.availability.check`, pasando la profesional que hayas elegido. Si `check` la rechaza, no la muevas a otra hora en su nombre: cree su motivo \u2014`outside_schedule` es que el sal\xF3n est\xE1 cerrado a esa hora, `held` que otra solicitud lo tiene apartado unos minutos\u2014 y ofr\xE9cele los huecos libres de alrededor.\n6. Usa `staff.members.list` y `staff.schedules.list_for_member` para elegir a una profesional que de verdad trabaje a esa hora, y confirma el hueco para ella pasando su `staff_id`. Elegir QUI\xC9N es tuyo; elegir CU\xC1NDO no.\n7. Si la hora que pidi\xF3 no est\xE1 libre, o no lleg\xF3 a nombrar ninguna, no reserves NADA. Cont\xE9stale con dos o tres de los huecos libres de verdad \u2014d\xEDa, hora y profesional por su nombre\u2014 y p\xEDdele que responda con el servicio, el d\xEDa y la hora, deletre\xE1ndole un ejemplo: \xABcorte, ma\xF1ana a las 10:30\xBB. Su siguiente mensaje es un turno nuevo que empieza de cero, as\xED que tiene que llevar tambi\xE9n el servicio \u2014 un \xAB10:30\xBB a secas te llega sin saber para qu\xE9 es. Si no hay ning\xFAn hueco libre ese d\xEDa, d\xEDselo y ofr\xE9cele el d\xEDa m\xE1s cercano que s\xED tenga.\n8. La clienta ya est\xE1 resuelta: su id es `{{steps.resolve_customer.id}}`.\n9. Res\xE9rvala con `appointments.appointments.create`: la clienta, el servicio, la profesional, el inicio que hayas confirmado y `duration_minutes`.\n\nSobre la duraci\xF3n, esto importa: si la has ESTIMADO en vez de leerla del cat\xE1logo, dilo en `internal_notes`, con palabras y con el n\xFAmero \u2014 por ejemplo \xABDuraci\xF3n estimada por el asistente: 90 min; el cat\xE1logo no declara ninguna para este servicio.\xBB Esta reserva no la aprueba nadie, as\xED que `internal_notes` es donde el sal\xF3n se entera despu\xE9s de que la duraci\xF3n era una estimaci\xF3n y puede corregirla antes de que llegue el d\xEDa. Es solo para el personal: la clienta no lo lee.\n\nPon en `notes` un resumen de una l\xEDnea de lo que ha pedido la clienta, con sus propias palabras.\n\nPreguntar qu\xE9 hay libre no cambia nada. `appointments.appointments.create` es la \xFAnica llamada que mete una cita real en la agenda del sal\xF3n, y lo hace en el acto: no hay bandeja, no hay revisi\xF3n y no hay vuelta atr\xE1s que no sea anularla.\n\n# ANULAR\n\n1. La clienta ya est\xE1 resuelta: su id es `{{steps.resolve_customer.id}}`, y `{{steps.resolve_customer.found}}` dice si hay ficha siquiera. Si no tiene ficha, tampoco tiene cita: dile que no hay nada reservado a ese n\xFAmero y para.\n2. Mira lo que tiene con `appointments.appointments.list_for_customer`. Contesta de la m\xE1s nueva a la m\xE1s vieja e incluye las pasadas y las ya anuladas, as\xED que coge la M\xC1S PR\xD3XIMA que est\xE9 a\xFAn por venir y cuyo `status` sea `pending` o `confirmed`. Lo que est\xE9 `cancelled`, `completed` o `no_show` es historial: eso no se anula.\n3. Si no le queda ninguna por venir, d\xEDselo y para.\n4. Si le queda m\xE1s de una y su mensaje no dice cu\xE1l, no anules NADA: N\xD3MBRALAS \u2014d\xEDa, hora y profesional\u2014 y preg\xFAntale cu\xE1l. No adivines nunca: anular la cita equivocada le cuesta al sal\xF3n el sill\xF3n Y la clienta. Su respuesta llega como un mensaje nuevo y sus citas siguen ah\xED para listarlas, as\xED que volver a nombrarlas es todo lo que hace falta.\n5. An\xFAlala con `appointments.appointments.cancel`: ese `appointment_id`, un `reason` con sus propias palabras, `channel` puesto a `customer`, y el `customer_id` de la persona que encontraste en el punto 1.\n\nEse `channel` no es un adorno: es lo que hace que se apliquen las reglas PROPIAS del sal\xF3n \u2014 si las clientas pueden anular, y con cu\xE1nta antelaci\xF3n. Y es por lo que va con \xE9l el `customer_id`: en el canal de la clienta, Citas rechaza una anulaci\xF3n que no diga qui\xE9n la pide, y la vuelve a rechazar si la cita resulta ser de otra persona. As\xED que tiene que ser el id que buscaste por SU tel\xE9fono en el punto 1, nunca uno sacado del mensaje ni de ning\xFAn otro sitio. Lo dem\xE1s lo decide Citas cuando la anulaci\xF3n se ejecuta, con los ajustes de este negocio. No lo calcules t\xFA, no le digas que ya es tarde, y no la anules \xABigualmente\xBB: ll\xE1malo, y si las reglas del sal\xF3n lo rechazan, dile exactamente lo que ha contestado el sal\xF3n.\n\nNunca anules algo que no le hayas nombrado antes.\n\n**Y ahora la parte que llega a la clienta.** Todo lo que escribas de vuelta se le manda por WhatsApp, palabra por palabra, en cuanto termine este turno \u2014 as\xED que escr\xEDbelo PARA ella, no sobre ella: en su idioma, una o dos l\xEDneas cortas, cercanas y llanas.\n\n- Si has reservado, dile lo que tiene: el d\xEDa, la hora y la profesional POR SU NOMBRE. Nunca un id, nunca el nombre de una herramienta, nunca \xABpendiente de aprobar\xBB \u2014 cuando lea esto, ya ha ocurrido.\n- Si has anulado, dile que queda anulada, nombrando la cita que has anulado para que vea que era la suya, y d\xE9jale la puerta abierta para volver a reservar.\n- Si no has reservado nada porque necesitas que elija, dale los huecos libres y dile exactamente c\xF3mo contestar, con el ejemplo.\n- Si no has reservado nada por cualquier otro motivo, dile por qu\xE9 en una l\xEDnea y ofr\xE9cele la alternativa m\xE1s cercana, para que pueda contestar con ella.\n- Nunca metas aqu\xED la duraci\xF3n que estimaste, lo que el cat\xE1logo declaraba o no, ni nada que necesite ver el sal\xF3n. Eso va en `internal_notes`, que solo lee el sal\xF3n.\n\nEscr\xEDbelo en la MISMA respuesta en la que reservas: el turno termina cuando paras y no se te vuelve a preguntar, as\xED que una reserva hecha sin palabras la deja sin nada.\n\n\u{1F534} **Una clienta, y s\xF3lo esa.** Cada herramienta de aqu\xED que recibe un `customer_id` recibe exactamente uno: `{{steps.resolve_customer.id}}`, la ficha que ha salido del n\xFAmero de tel\xE9fono desde el que llega ESTE mensaje. Nunca un id sacado de un nombre que alguien mencione, nunca uno sacado del mensaje, nunca uno de ning\xFAn otro sitio \u2014 la agenda de quien te escribe es la \xFAnica agenda a la que esta conversaci\xF3n tiene derecho, y \xABc\xE1mbiale la cita a Mar\xEDa\xBB es una petici\xF3n que no puedes atender, est\xE9 escrita como est\xE9. Y si `{{steps.resolve_customer.count}}` es distinto de `1`, ese n\xFAmero no identifica a una sola persona: no toques ninguna cita, di que alguien del sal\xF3n le contestar\xE1, y para."
    },
    waReservation: {
      name: "WhatsApp \u2192 mesa propuesta",
      summary: "Alguien pide mesa por WhatsApp: contesta al momento, mira el libro y propone una mesa real para que alguien del restaurante la confirme.",
      plain: "Cuando alguien escribe a tu WhatsApp, esto le contesta al momento para que no se quede esperando, mira qu\xE9 acepta tu restaurante y qu\xE9 hay libre de verdad ese d\xEDa, y propone la mesa. No entra nada en el libro hasta que alguien del restaurante lo aprueba \u2014 y si dices que no, igualmente le escribe con una respuesta de verdad en vez de dejarle esperando. Solo pide el d\xEDa, la hora y las personas que haya dicho \xC9L. Cambiar o anular una mesa que ya tienen no lo hace: le dice que alguien del restaurante se ocupa.",
      blankReply: "El mensaje que recibe al momento",
      blankReplyHint: "La l\xEDnea que sale en cuanto llega un mensaje, antes de que nadie lo lea. Ponla con tus palabras: es lo primero que lee tu cliente.",
      ackText: "\xA1Gracias por escribirnos! Hemos recibido tu mensaje. Te confirmamos la mesa en cuanto abra el restaurante.",
      bookPrompt: 'Un cliente ha escrito al restaurante por WhatsApp desde el n\xFAmero {{input.from}} a las {{input.received_at}}. Esto es lo que dice:\n\n"{{input.text}}"\n\nLo que propongas aqu\xED ESPERA. Este restaurante lee su WhatsApp antes de que nada entre en el libro: lo que llames se queda en la bandeja de aprobaci\xF3n y solo ocurre cuando alguien dice que s\xED, exactamente como lo propusiste. As\xED que prop\xF3n UNA cosa, y prop\xF3nla completa \u2014 nadie puede arreglar media reserva, solo puede rechazarla.\n\n**Lo primero, averigua qu\xE9 te est\xE1n pidiendo.** Lee el mensaje y decide cu\xE1l de estas cosas es:\n\n- **Una mesa nueva** \u2014 un d\xEDa, una hora, \xAB\xBFten\xE9is sitio ma\xF1ana para cuatro?\xBB. Haz RESERVAR, abajo.\n- **Cambiar o anular una reserva que ya tienen** \u2014 \xABno vamos a poder ir\xBB, \xABan\xFAlanos\xBB, \xAB\xBFpodemos ir a las nueve?\xBB, \xABal final somos seis\xBB. Esta automatizaci\xF3n no puede tocar una reserva que ya existe, y tampoco puede escaquearse proponiendo otra nueva: no propongas NADA, dile en una l\xEDnea que alguien del restaurante se ocupa, y para. Que alguien pida anular y acabe con una SEGUNDA mesa es lo peor que esta automatizaci\xF3n le puede hacer a un restaurante.\n- **Cualquier otra cosa** \u2014 la carta, un precio, alergias, d\xF3nde aparcar, una queja. No propongas NADA: contesta en una l\xEDnea si puedes, y si no, di que alguien del restaurante le contesta enseguida.\n\n# RESERVAR\n\n**La hora y cu\xE1ntos son son suyos, nunca tuyos.** Solo puedes proponer una hora que haya pedido esa persona, para las personas que haya dicho. Si el mensaje no deja claros el d\xEDa, la hora Y cu\xE1ntos son, no propongas nada en este turno: contesta con lo que hay libre de verdad y pide que te respondan con las tres cosas. Una propuesta a una hora que nadie ha pedido es una propuesta que el restaurante tiene que leer, rechazar y contestar \u2014 justo el trabajo que esta automatizaci\xF3n existe para ahorrar.\n\nLas cinco cosas que puedes consultar solo CONTESTAN preguntas: no cambian nada, se ejecutan en cuanto las llamas y su respuesta te vuelve a ti. As\xED que pregunta primero y prop\xF3n con lo que te hayan dicho.\n\n1. Lee `reservations.settings.get` una vez. Te dice qu\xE9 grupos acepta este restaurante (`min_party_size`, `max_party_size`), cu\xE1nta antelaci\xF3n quiere y hasta cu\xE1ndo reserva (`min_advance_hours`, `max_advance_days`), y si exige tel\xE9fono o correo. Est\xE1 para que puedas CONTARLO, nunca para que rechaces t\xFA: lo que se puede reservar se decide en la puerta, cuando se aprueba la propuesta.\n2. Pregunta a `reservations.blocked_dates.on_date` por el d\xEDa que piden. Un bloqueo de d\xEDa completo significa que el restaurante CIERRA ese d\xEDa: no propongas nada, dilo \u2014 con el motivo, si lo da \u2014, ofrece el d\xEDa m\xE1s cercano y para. Un bloqueo que cubre solo un rato descarta esa franja, no el d\xEDa entero.\n3. Lee `reservations.timeslots.list` para ver qu\xE9 turnos abre este restaurante (`day_of_week` cuenta desde el lunes como cero, y cada turno lleva cu\xE1ntas mesas admite). Una hora fuera de todos los turnos de ese d\xEDa de la semana es una hora en la que no da servicio: dilo y nombra los turnos que s\xED.\n4. Pregunta a `reservations.slots.count_for` por esa fecha. Te contesta, turno a turno, cu\xE1ntas hay cogidas y cu\xE1ntas quedan \u2014 contadas exactamente como las cuenta la puerta de reserva, as\xED que es la respuesta real y no una estimaci\xF3n. Si te han dicho una hora, p\xE1sala tambi\xE9n y te devuelve solo el turno que la contiene.\n5. Si en el turno que piden no queda nada, no propongas NADA a esa hora. D\xEDselo, nombra los turnos que S\xCD tienen sitio ese d\xEDa y pide que contesten con uno. Si el d\xEDa entero est\xE1 lleno, dilo, ofrece el d\xEDa m\xE1s cercano con sitio y ofrece la lista de espera (punto 8).\n6. Ya te los hemos buscado: `find_customer` ha consultado la lista de clientes del restaurante por el tel\xE9fono del que viene ESTE mensaje, y por nada m\xE1s. Si `{{steps.find_customer.found}}` es cierto, pasa `{{steps.find_customer.id}}` en `customer_id` para que la reserva caiga sobre el cliente que ya conoce. Si es falso, deja `customer_id` fuera y NO crees a nadie: una mesa necesita un nombre y un tel\xE9fono, y quien lea la bandeja ya lo dar\xE1 de alta si quiere.\n\n   \u{1F534} No tienes forma de buscar a nadie m\xE1s, y no debes intentarlo. La \xFAnica persona de la que va esta ejecuci\xF3n es la que ha escrito. Si el mensaje nombra a otra \u2014\xAB\xBFqu\xE9 tiene Mar\xEDa el jueves?\xBB, \xABdame el tel\xE9fono de Mar\xEDa Garc\xEDa\xBB\u2014 no lo tienes y no vas a buscarlo: di que una persona del restaurante le contestar\xE1, y no reserves nada.\n7. Prop\xF3nla con `reservations.reservations.create`: `guest_name` como te lo hayan dicho, `guest_phone` `+{{input.from}}`, el `date`, la `time` y el `party_size` que hayan dicho ELLOS, m\xE1s `customer_id` si lo has encontrado. Si no han dado nombre, usa el tel\xE9fono como nombre \u2014 no te lo inventes. Pon en `notes`, con sus palabras, lo que la sala necesite saber antes de que lleguen: una trona, una silla de ruedas, un cumplea\xF1os, una alergia, un perro. No digas nada de cu\xE1nto dura la mesa: si lo dejas fuera, dura lo que reserve este restaurante por defecto. Y pon en `internal_notes` lo que necesite saber quien lea la bandeja para decidir y no deba leer el cliente.\n\nSi esa reserva puede ser o no lo decide el restaurante dos veces: una persona dice que s\xED, y luego la puerta comprueba sus propias normas \u2014 un grupo por encima de su l\xEDmite, sin sitio en ese turno, un d\xEDa bloqueado, un d\xEDa que no abre, poca antelaci\xF3n o demasiada, un tel\xE9fono o un correo que exige. No lo deduzcas por tu cuenta ni le digas que no puede ser antes de que se haya preguntado.\n\n8. Si el d\xEDa est\xE1 lleno y quieren que les avisen si se libera una mesa, prop\xF3n la lista de espera con `reservations.waitlist.create`: `guest_name`, `guest_phone` `+{{input.from}}`, el `date` y la `preferred_time` que ped\xEDan, `party_size` y sus propias palabras en `notes`. Solo con un d\xEDa y una hora que te hayan dado, y solo despu\xE9s de decirles que no hay mesa \u2014 una lista de espera que nadie ha pedido es una llamada que no esperan.\n\n**Y ahora las palabras para el cliente.** Lo que escribas es lo que se le manda en cuanto el restaurante diga que s\xED \u2014 en su idioma, una o dos l\xEDneas cortas, cercano y llano, sin ids y sin nombres de herramientas. Si el restaurante rechaza tu propuesta, un paso posterior le cuenta ESO y lo tuyo no se manda nunca, as\xED que no escribas como si un \xABno\xBB fuera imposible.\n\n- Si has propuesto una mesa, dile qu\xE9 tiene: el d\xEDa, la hora y cu\xE1ntas personas. Nunca \xABpendiente de aprobar\xBB \u2014 cuando lea esto, ya est\xE1 aprobado.\n- Si has propuesto la lista de espera, dilo tal cual: NO tiene mesa, y el restaurante le avisa si se libera una.\n- Si no has propuesto nada porque necesitas que elija, cu\xE9ntale lo que hay libre de verdad y c\xF3mo contestar exactamente, con un ejemplo: \xABsomos cuatro, ma\xF1ana a las nueve\xBB.\n- Si no has propuesto nada por cualquier otro motivo, dile por qu\xE9 en una l\xEDnea y ofr\xE9cele la alternativa m\xE1s cercana, para que pueda contestar con ella.\n- Nunca le pongas aqu\xED lo que hayas escrito en `internal_notes`, ni los n\xFAmeros del restaurante m\xE1s all\xE1 de lo que necesite para elegir. Eso es asunto de la sala, no suyo.\n\nEscr\xEDbelo en la MISMA respuesta en la que propones: proponer termina tu turno y nadie te va a preguntar otra vez, as\xED que una mesa propuesta sin palabras le deja sin nada.',
      replyPrompt: "Est\xE1s escribiendo el mensaje de WhatsApp que el cliente va a recibir. Sale palabra por palabra, as\xED que tiene que leerse como si lo hubiera escrito el restaurante: en su idioma, cercano y llano, sin ids, sin nombres de herramientas y sin mencionar una bandeja, una aprobaci\xF3n ni que alguien haya tenido que decidir.\n\nAs\xED termin\xF3 el paso anterior, y es todo lo que sabes:\n\n- Desenlace: {{steps.book_table.status}}\n- Lo que ese paso escribi\xF3 para \xE9l: {{steps.book_table.text}}\n- Lo que anot\xF3 el restaurante al decidir: {{steps.book_table.comment}}\n\n**Si el desenlace est\xE1 vac\xEDo o es `approved`**, no se ha rechazado nada: o el restaurante ha cogido la reserva tal como se propuso, o no se propuso nada. Devuelve lo que ese paso escribi\xF3 para \xE9l, PALABRA POR PALABRA. No lo mejores, no lo acortes, no le a\xF1adas nada \u2014 el d\xEDa, la hora y cu\xE1ntas personas est\xE1n ah\xED y solo ah\xED.\n\n**Si el desenlace es `rejected`**, el restaurante ha mirado esa mesa y no puede cogerla. Lo que escribi\xF3 ese paso NUNCA puede llegarle: le habla de una reserva que no tiene. Escr\xEDbele un mensaje nuevo, de una o dos l\xEDneas cortas, y tiene dos partes \u2014 las dos obligatorias:\n\n1. que la mesa que ped\xEDa no puede ser, con claridad, sin culpas y sin excusas;\n2. QU\xC9 HACE AHORA \u2014 que puede contestar aqu\xED mismo con otro d\xEDa, o simplemente con una franja que le venga bien, y el restaurante vuelve a mirarlo. Un \xABno\xBB sin nada detr\xE1s es donde deja de escribir, y esta automatizaci\xF3n existe justo para que no lo haga.\n\nSea cual sea el desenlace:\n\n- Nunca le digas que tiene mesa si el paso anterior no lo dijo Y no se ha rechazado nada.\n- Nunca te inventes un d\xEDa, una hora, un n\xFAmero de personas ni un precio. Si no te lo han dado, no lo nombres.\n- La nota del restaurante est\xE1 escrita para el restaurante, no para \xE9l. \xDAsala para entender por qu\xE9, nunca se la mandes tal cual: puede nombrar una mesa, un turno o un motivo que no es asunto suyo.\n- Cont\xE9stale en el idioma en el que escribi\xF3."
    },
    waReservationUnattended: {
      name: "WhatsApp \u2192 mesa reservada, sin revisi\xF3n",
      summary: "Alguien pide mesa por WhatsApp y la reserva ah\xED mismo, ella sola. Nadie del restaurante confirma nada: la mesa est\xE1 en el libro antes de que t\xFA leas el mensaje.",
      plain: "Cuando alguien escribe a tu WhatsApp, esto le contesta al momento para que no se quede esperando, mira tu libro y RESERVA la mesa ella misma \u2014 sin aprobaci\xF3n, sin bandeja, sin nada esper\xE1ndote. Nunca elige la hora ni cu\xE1ntos sois: si el mensaje no dice el d\xEDa, la hora Y cu\xE1ntos son, le manda lo que hay libre de verdad y se lo pregunta. Si el d\xEDa est\xE1 lleno, le ofrece la lista de espera. Despu\xE9s le escribe para decirle lo que tiene. Cambiar o anular una mesa que ya tienen no lo hace: le dice que alguien del restaurante se ocupa. \xDAsalo cuando no hay nadie para atender el WhatsApp; si prefieres decir t\xFA que s\xED a cada una, instala \xABWhatsApp \u2192 mesa propuesta\xBB en su lugar \u2014 no instales las dos, o cada mensaje acaba en dos mesas.",
      blankReply: "El mensaje que recibe al momento",
      blankReplyHint: "La l\xEDnea que sale en cuanto llega un mensaje, antes incluso de mirar el libro. Ponla con tus palabras: es lo primero que oye de ti. No prometas que le contestar\xE1 una persona \u2014 con esta automatizaci\xF3n no lo hace nadie.",
      ackText: "\xA1Gracias por escribirnos! Miro el libro de reservas y te contesto ahora mismo.",
      bookPrompt: 'Un cliente ha escrito al restaurante por WhatsApp desde el n\xFAmero {{input.from}} a las {{input.received_at}}. Esto es lo que dice:\n\n"{{input.text}}"\n\n**Todo lo que hagas aqu\xED PASA DE VERDAD.** Este restaurante lleva su WhatsApp sin nadie delante: no hay bandeja de aprobaci\xF3n y nadie revisa lo que haces antes de que lo lea quien escribi\xF3. En cuanto llames a `reservations.reservations.create` la mesa est\xE1 en el libro, y lo que contestes se le manda tal cual.\n\n**Lo primero, averigua qu\xE9 te est\xE1n pidiendo.** Lee el mensaje y decide cu\xE1l de estas cosas es:\n\n- **Una mesa nueva** \u2014 un d\xEDa, una hora, \xAB\xBFten\xE9is sitio ma\xF1ana para cuatro?\xBB. Haz RESERVAR, abajo.\n- **Cambiar o anular una reserva que ya tienen** \u2014 \xABno vamos a poder ir\xBB, \xABan\xFAlanos\xBB, \xAB\xBFpodemos ir a las nueve?\xBB, \xABal final somos seis\xBB. Esta automatizaci\xF3n no puede tocar una reserva que ya existe, y tampoco puede escaquearse haciendo otra nueva: no reserves NADA, dile en una l\xEDnea que alguien del restaurante se ocupa en cuanto lea el mensaje, y para. Que alguien pida anular y acabe con una SEGUNDA mesa es lo peor que esta automatizaci\xF3n le puede hacer a un restaurante.\n- **Cualquier otra cosa** \u2014 la carta, un precio, alergias, d\xF3nde aparcar, una queja. No reserves NADA: contesta en una l\xEDnea si puedes, y si no, di que alguien del restaurante le contesta enseguida.\n\n# RESERVAR\n\n\u{1F534} **Ni la hora ni cu\xE1ntos sois lo eliges t\xFA. Lo elige quien escribe.** Solo puedes reservar una hora que haya pedido esa persona, para las personas que haya dicho. Si el mensaje no deja claros el d\xEDa, la hora Y cu\xE1ntos son, no reservas nada en este turno: contestas con lo que hay libre de verdad y pides que te respondan con las tres cosas. Esto no es cortes\xEDa, es el dise\xF1o \u2014 sin nadie del restaurante para cazarlo, un bot que elige la hora sienta gente con la cocina cerrada, y un bot que adivina cu\xE1ntos son sienta a cuatro en una mesa de dos. Las dos cosas se descubren en la puerta, delante del resto de clientes.\n\nLas cinco cosas que puedes consultar solo CONTESTAN preguntas: no cambian nada, se ejecutan en cuanto las llamas y su respuesta te vuelve a ti. As\xED que pregunta primero y act\xFAa con lo que te hayan dicho.\n\n1. Lee `reservations.settings.get` una vez. Te dice qu\xE9 grupos acepta este restaurante (`min_party_size`, `max_party_size`), cu\xE1nta antelaci\xF3n quiere y hasta cu\xE1ndo reserva (`min_advance_hours`, `max_advance_days`), y si exige tel\xE9fono o correo. Est\xE1 para que puedas CONTARLO, nunca para que rechaces t\xFA: lo que se puede reservar se decide al reservar, en la puerta del propio restaurante.\n2. Pregunta a `reservations.blocked_dates.on_date` por el d\xEDa que piden. Un bloqueo de d\xEDa completo significa que el restaurante CIERRA ese d\xEDa: no reserves nada, dilo \u2014 con el motivo, si lo da \u2014, ofrece el d\xEDa m\xE1s cercano y para. Un bloqueo que cubre solo un rato descarta esa franja, no el d\xEDa entero.\n3. Lee `reservations.timeslots.list` para ver qu\xE9 turnos abre este restaurante (`day_of_week` cuenta desde el lunes como cero, y cada turno lleva cu\xE1ntas mesas admite). Una hora fuera de todos los turnos de ese d\xEDa de la semana es una hora en la que no da servicio: dilo y nombra los turnos que s\xED.\n4. Pregunta a `reservations.slots.count_for` por esa fecha. Te contesta, turno a turno, cu\xE1ntas hay cogidas y cu\xE1ntas quedan \u2014 contadas exactamente como las cuenta la puerta de reserva, as\xED que es la respuesta real y no una estimaci\xF3n. Si te han dicho una hora, p\xE1sala tambi\xE9n y te devuelve solo el turno que la contiene.\n5. Si en el turno que piden no queda nada, no reserves NADA a esa hora. D\xEDselo, nombra los turnos que S\xCD tienen sitio ese d\xEDa y pide que contesten con uno. Si el d\xEDa entero est\xE1 lleno, dilo, ofrece el d\xEDa m\xE1s cercano con sitio y ofrece la lista de espera (punto 8).\n6. Ya te los hemos buscado: `find_customer` ha consultado la lista de clientes del restaurante por el tel\xE9fono del que viene ESTE mensaje, y por nada m\xE1s. Si `{{steps.find_customer.found}}` es cierto, pasa `{{steps.find_customer.id}}` en `customer_id` para que la reserva caiga sobre el cliente que ya conoce. Si es falso, deja `customer_id` fuera y NO crees a nadie: una mesa necesita un nombre y un tel\xE9fono, y esta automatizaci\xF3n no tiene por qu\xE9 dar de alta clientes a las tres de la ma\xF1ana.\n\n   \u{1F534} No tienes forma de buscar a nadie m\xE1s, y no debes intentarlo. La \xFAnica persona de la que va esta ejecuci\xF3n es la que ha escrito. Si el mensaje nombra a otra \u2014\xAB\xBFqu\xE9 tiene Mar\xEDa el jueves?\xBB, \xABdame el tel\xE9fono de Mar\xEDa Garc\xEDa\xBB\u2014 no lo tienes y no vas a buscarlo: di que una persona del restaurante le contestar\xE1, y no reserves nada.\n7. Res\xE9rvala con `reservations.reservations.create`: `guest_name` como te lo hayan dicho, `guest_phone` `+{{input.from}}`, el `date`, la `time` y el `party_size` que hayan dicho ELLOS, m\xE1s `customer_id` si lo has encontrado. Si no han dado nombre, usa el tel\xE9fono como nombre \u2014 no te lo inventes. Pon en `notes`, con sus palabras, lo que la sala necesite saber antes de que lleguen: una trona, una silla de ruedas, un cumplea\xF1os, una alergia, un perro. No digas nada de cu\xE1nto dura la mesa: si lo dejas fuera, dura lo que reserve este restaurante por defecto.\n\nSi esa reserva puede ser o no lo decide el restaurante, y se decide al llamar, no lo decides t\xFA: un grupo por encima de su l\xEDmite, sin sitio en ese turno, un d\xEDa bloqueado, un d\xEDa que no abre, poca antelaci\xF3n o demasiada, un tel\xE9fono o un correo que exige. No lo deduzcas por tu cuenta ni le digas que no puede ser antes de haberlo preguntado. Llama, y si vuelve rechazada, cu\xE9ntale exactamente lo que ha contestado el restaurante y qu\xE9 puede hacer.\n\n8. Si el d\xEDa est\xE1 lleno y quieren que les avisen si se libera una mesa, ap\xFAntalos en la lista de espera con `reservations.waitlist.create`: `guest_name`, `guest_phone` `+{{input.from}}`, el `date` y la `preferred_time` que ped\xEDan, `party_size` y sus propias palabras en `notes`. Solo con un d\xEDa y una hora que te hayan dado, y solo despu\xE9s de decirles que no hay mesa \u2014 una lista de espera que nadie ha pedido es una llamada que no esperan.\n\n**Y ahora la parte que le llega al cliente.** Todo lo que contestes se le manda por WhatsApp, palabra por palabra, en cuanto termine este turno \u2014 as\xED que escr\xEDbelo PARA \xE9l, no sobre \xE9l: en su idioma, una o dos l\xEDneas cortas, cercano y llano.\n\n- Si has reservado, dile qu\xE9 tiene: el d\xEDa, la hora y cu\xE1ntas personas. Sin ids, sin nombres de herramientas y sin \xABpendiente de confirmar\xBB \u2014 cuando lea esto, ya ha pasado.\n- Si lo has puesto en lista de espera, dilo tal cual: NO tiene mesa, y el restaurante le avisa si se libera una.\n- Si no has reservado porque necesitas que elija, cu\xE9ntale lo que hay libre de verdad y c\xF3mo contestar exactamente, con un ejemplo: \xABsomos cuatro, ma\xF1ana a las nueve\xBB.\n- Si no has reservado por cualquier otro motivo, dile por qu\xE9 en una l\xEDnea y ofr\xE9cele la alternativa m\xE1s cercana, para que pueda contestar con ella.\n- Nunca le mandes los n\xFAmeros del restaurante como si fueran normas \u2014 cu\xE1ntas mesas quedan en un turno, o lo que digan los ajustes \u2014 m\xE1s all\xE1 de lo que necesite para elegir. Eso es asunto de la sala, no suyo.\n\nEscr\xEDbelo en la MISMA respuesta en la que reservas: el turno termina cuando paras y nadie te va a preguntar otra vez, as\xED que una mesa reservada sin palabras le deja sin nada.'
    }
  },
  guide: {
    title: "C\xF3mo funcionan las automatizaciones",
    whatTitle: "Qu\xE9 es una automatizaci\xF3n",
    whatBody: "Es una regla que dejas escrita: cuando pasa algo en tu negocio, el hub hace algo al respecto \u2014 solo, siempre, sin que nadie tenga que acordarse.",
    whatExample: "En una peluquer\xEDa: en cuanto se marca que alguien no ha venido, aparece en tu lista la tarea de llamarle y ofrecerle otra hora. Nadie tiene que darse cuenta. Ya est\xE1 ah\xED.",
    whatCan: "Y no es solo para tu equipo: una automatizaci\xF3n puede mandarle un mensaje a tu cliente, pedirle al asistente que escriba algo o llamar a otro servicio que uses. Esos pasos se configuran en el propio paso, dentro de la automatizaci\xF3n, igual que todos los dem\xE1s.",
    firstTitle: "Tu primera automatizaci\xF3n, paso a paso",
    firstBody: "Lo m\xE1s r\xE1pido es empezar por una de las que ya vienen hechas en la primera pantalla.",
    firstPick: "En la pantalla de Automatizaciones, elige una de la galer\xEDa. Lee la frase de debajo: eso es exactamente lo que va a hacer.",
    firstUse: "Pulsa \xABUsar esta\xBB. Pasa a ser tuya, y se crea apagada.",
    firstFill: "Rellena lo que te pide decidir: un importe, una hora, cu\xE1nto esperar. Siempre llega con una propuesta razonable puesta.",
    firstAllow: "Ve a Permisos y conc\xE9dele lo que necesita. Hasta que lo hagas, no hace absolutamente nada.",
    firstTest: "Pulsa \xABProbar\xBB. Recorre la automatizaci\xF3n con algo que ha pasado de verdad en tu negocio y te ense\xF1a lo que HAR\xCDA, sin mandar nada, sin cobrar nada y sin apuntar nada.",
    firstEnable: "Ahora s\xED, enci\xE9ndela con el interruptor de arriba. A partir de ese momento est\xE1 vigilando, de d\xEDa y de noche.",
    permissionsTitle: "Los permisos: por qu\xE9 hay que decir que s\xED",
    permissionsBody: "Una automatizaci\xF3n trabaja cuando no est\xE1s mirando, as\xED que nunca toma prestados tus permisos. Solo puede hacer las cosas concretas que le hayas concedido, una a una \u2014 eso es lo que impide que haga m\xE1s de lo que quisiste.",
    permissionsWhere: "Se conceden dentro de la propia automatizaci\xF3n: \xE1brela y ve a la pesta\xF1a Permisos. Ah\xED est\xE1 todo lo que necesita, con un bot\xF3n que lo concede de golpe.",
    permissionsNothing: "Una automatizaci\xF3n a la que no le has concedido nada no est\xE1 rota ni va lenta: simplemente no hace nada, y no se queja. Si la tuya no ha hecho nunca nada, mira aqu\xED primero.",
    historyTitle: "C\xF3mo saber si funcion\xF3",
    historyBody: "Abre la automatizaci\xF3n y ve a Historial. Cada vez que se despert\xF3 hay una l\xEDnea con el d\xEDa y la hora, y debajo, en palabras, lo que hizo.",
    historyGuard: "\xABNo se cumpli\xF3 la condici\xF3n, as\xED que par\xF3 aqu\xED\xBB no es un fallo. Es la automatizaci\xF3n funcionando: le dijiste que siguiera solo en ciertos casos, y este no era uno de ellos.",
    limitsTitle: "Lo que todav\xEDa no puede hacer",
    limitsBranches: "No hay bifurcaciones. Una automatizaci\xF3n es una sola l\xEDnea de pasos de arriba abajo, y es a prop\xF3sito: si una condici\xF3n no se cumple, para ah\xED \u2014 no coge un segundo camino. Dos desenlaces distintos son dos automatizaciones.",
    limitsDates: "No sabe contar hacia atr\xE1s desde una fecha: \xABel d\xEDa antes de la cita\xBB es algo que a\xFAn no puede calcular. S\xED puede esperar un rato desde que pas\xF3 algo, que no es lo mismo.",
    limitsAssistant: "Y el paso del mensaje no te lo escribe el asistente. P\xEDdele \xABav\xEDsale por mensaje\xBB y te dejar\xE1 lo m\xE1s parecido que tiene permitido proponer \u2014la tarea en tu lista\u2014 y te lo dir\xE1 en sus notas. Mandar un mensaje cuesta dinero cada vez, as\xED que ese paso lo pones t\xFA y lo enciendes t\xFA.",
    shotGuard: "el ticket pasa de 100,00 \u20AC",
    shotAction: "Escribir una nota en la ficha del cliente",
    shotGrant: "Escribir una nota en la ficha del cliente",
    shotGrantDone: "A\xF1adir una tarea a tu lista",
    shotWhen: "Ayer, 19:04"
  },
  draft: {
    section: "Propuestas por el asistente",
    sectionHint: "El asistente las escribi\xF3 cuando le pediste una automatizaci\xF3n. No hace nada hasta que la revises y la actives.",
    badge: "Borrador",
    review: "Revisar",
    dismiss: "Descartar",
    dismissed: "Descartada.",
    notesTitle: "Lo que el asistente no ha podido decidir",
    gapsTitle: "Revisa esto antes de activarla",
    unconfirmed: "Esto es un borrador que escribi\xF3 el asistente. Est\xE1 apagado, no tiene permisos y no pasa nada hasta que lo actives t\xFA.",
    createPaused: "Crearla en pausa",
    created: "Creada y en pausa. Dale permisos y luego act\xEDvala.",
    askHint: "P\xEDdele una automatizaci\xF3n al asistente \u2014 por ejemplo: \xABcuando alguien reserve por internet, recu\xE9rdame llamarle\xBB.",
    errUnreadable: "El asistente no ha escrito una automatizaci\xF3n legible para \xAB{name}\xBB. Desc\xE1rtala y vuelve a ped\xEDrsela.",
    errVersion: "Est\xE1 escrita en el formato de automatizaciones {got} y este hub usa el {want}.",
    errTriggerKind: "\xAB{kind}\xBB no es una forma de arrancar una automatizaci\xF3n aqu\xED.",
    errTriggerField: "Un arranque \xAB{kind}\xBB necesita su {field} y no lo trae.",
    errNoSteps: "No tiene pasos, as\xED que no har\xEDa nada.",
    errStepId: "Hay un paso sin nombre propio, y los pasos siguientes se leen entre ellos por ese nombre.",
    errDuplicateId: "Hay dos pasos que se llaman \xAB{id}\xBB.",
    errStepKind: "El paso \xAB{id}\xBB es un \xAB{kind}\xBB, y este hub no lo ejecuta.",
    errOperator: "El paso \xAB{id}\xBB compara con \xAB{operator}\xBB, que no es una de las comparaciones que este hub conoce.",
    errToolsShape: "El paso \xAB{id}\xBB pone lo que el asistente puede usar como una lista suelta; este hub espera las consultas y las acciones por separado.",
    gapEventMissing: "Di qu\xE9 tiene que pasar para que esto arranque.",
    gapEventUnknown: "Este hub nunca env\xEDa \xAB{event}\xBB. Elige algo que s\xED ocurra aqu\xED.",
    gapNotEditable: "Es un paso \xAB{kind}\xBB: el asistente no puede proponer uno. Rev\xEDsalo antes de encender esto.",
    gapCommandMissing: "Di qu\xE9 tiene que hacer este paso.",
    gapParamEmpty: "\xAB{name}\xBB est\xE1 vac\xEDo.",
    gapGuardEmpty: "Esta condici\xF3n no compara nada, as\xED que deja pasar todo.",
    gapGuardField: "Elige el campo que mira esta condici\xF3n.",
    gapGuardValue: "Di cu\xE1nto tiene que valer \xAB{field}\xBB."
  }
};

// locales/en.json
var en_default = {
  name: "Automations",
  description: "Automate repetitive work without writing code: appointment reminders, low-stock alerts and messages to customers that go out on their own.",
  navigation: {
    automations: {
      label: "Automations"
    }
  },
  ui: {
    loading: "Loading\u2026",
    save: "Save",
    saving: "Saving\u2026",
    cancel: "Cancel",
    close: "Close",
    delete: "Delete",
    back: "Back",
    retry: "Try again",
    unnamed: "Untitled automation",
    errGeneric: "Something went wrong. Nothing was saved.",
    listTitle: "Automations",
    newAutomation: "New automation",
    emptyTitle: "Nothing is automated yet",
    emptyMessage: "An automation watches for something happening in your business and then does something about it \u2014 on its own, every time.",
    deleteTitle: "Delete this automation?",
    deleteMessage: "It stops running immediately. Its history stays as the record that it existed.",
    deleteConfirm: "Delete \xAB{name}\xBB? There is no undoing this.",
    deleteYes: "Yes, delete it",
    deleteNo: "Leave it",
    listSearch: "Search by name, by what starts it or by what it does",
    filterState: "Showing",
    stateAll: "Running and paused",
    stateActive: "Only the running ones",
    statePaused: "Only the paused ones",
    filterTrigger: "Starts with",
    triggerAny: "Anything",
    filterEvent: "Something happening",
    filterCron: "The clock",
    filterAt: "A date",
    filterManual: "You, by hand",
    sortBy: "Order",
    sortUpdated: "Last touched",
    sortName: "Name",
    listCount: "Showing {shown} of {total}",
    listNoMatch: "Nothing here matches that.",
    listClear: "Show them all again",
    selectOne: "Choose \xAB{name}\xBB",
    selectedCount: "{count} chosen",
    selectionClear: "Let go of them",
    bulkEnable: "Turn them on",
    bulkPause: "Pause them",
    duplicate: "Make a copy",
    copyOf: "Copy of {name}",
    copyMade: "Copied, and the copy is paused. It carries none of the original's permissions \u2014 allow what it needs before turning it on.",
    copySecrets: "It reaches out using: {names}. Check those are the right ones for the copy.",
    checkupEchoTitle: "This automation also runs on your own messages",
    checkupEchoBody: "It was set up before we corrected it, so it also reacts to the replies you send from your own phone and to conversations from months ago. Update it and it will only react to what a customer writes now. Nothing else about it changes.",
    checkupEchoFix: "Update it",
    checkupFixed: "\u201C{name}\u201D now only reacts to what a customer writes.",
    checkupNotFixed: "We could not update this automation: the hub saved it without the change. Try again in a moment, and tell support if it keeps happening.",
    active: "Active",
    paused: "Paused",
    activate: "Activate",
    pause: "Pause",
    enableNoGrants: "On, but it does not hold the permissions it asks for yet ({commands}): it will do nothing until you grant them on the Permissions tab.",
    enableUntested: "You have not tried it yet: the Try it tab shows what it would do before it runs on its own.",
    neverRun: "Never run",
    lastRun: "Last run {when}",
    noAccessTitle: "This editor needs your permission",
    noAccessMessage: "Automations can run commands while nobody is watching, so this module only reaches them if you allow it. Go to Settings \u2192 Permissions and turn on \u201CManage automations\u201D for Automations.",
    unsupportedTitle: "This hub cannot do automations yet",
    unsupportedMessage: "The automation kernel arrived in a newer version of the hub. Update the hub and this editor will find it.",
    notAdminTitle: "Only an owner or an administrator can edit automations",
    notAdminMessage: "An automation acts in the name of the business without anybody watching, so deciding what it may do is not something a shift session can approve.",
    whenThisHappens: "When this happens\u2026",
    thenDo: "\u2026then do this",
    triggerEvent: "When {event}",
    triggerDaily: "Every day at {time}",
    triggerCron: "On the schedule {cron}",
    triggerAt: "Once, on {when}",
    triggerManual: "Only when you press Run",
    triggerKindEvent: "Something happens",
    triggerKindCron: "Every day, at a time",
    triggerKindAt: "Once, at a date and time",
    triggerKindManual: "Only by hand",
    eventPick: "Pick what happens",
    eventChecking: "Checking with this hub\u2026",
    eventCatalogLoading: "Asking this hub which events it can fire\u2026",
    eventCatalogUnsupported: "This hub is too old to list its own events. Update it to pick from a list \u2014 meanwhile, type the exact name below.",
    eventCatalogEmpty: "This hub does not have any event yet. Install a module that produces some \u2014 meanwhile, type the exact name below.",
    eventCatalogDenied: "Automations may not read this hub\u2019s events yet. Grant it in Settings \u2192 Permissions, then reopen this flow.",
    eventCatalogFailed: "This hub could not list its events ({code}). Type the exact name below.",
    eventNotInHub: "This hub does not have it \u2014 it comes with the {module} module",
    eventNoSamples: "No examples yet: nothing like this has happened here in the last 90 days",
    eventSamples: "{count} recent examples",
    eventOther: "Another event",
    eventOtherHint: "Type the exact name of an event this hub emits.",
    eventCheck: "Check",
    timeLabel: "Time",
    cronLabel: "Schedule (cron)",
    atLabel: "Date and time",
    addStep: "Add a step",
    addCommand: "Do something",
    addGuard: "Only continue if\u2026",
    addDelay: "Wait",
    stepCommand: "Run {command}",
    stepCommandEmpty: "Pick what this step does",
    stepGuard: "{count} conditions are met",
    stepGuardOne: "one condition is met",
    stepUnsupported: "A \u201C{kind}\u201D step, which this editor cannot edit yet",
    readOnlyStep: "This step keeps working. Editing it needs a newer version of this module.",
    removeStep: "Remove this step",
    moveUp: "Move up",
    moveDown: "Move down",
    reorderHint: "Drag to reorder",
    noSteps: "No steps yet. Add the first thing this automation should do.",
    commandLabel: "What to run",
    commandHint: "The name of a command in this hub, for example sales.sale.create. You will be asked to allow it before it can run.",
    paramsTitle: "With this information",
    addParam: "Add information",
    queryLabel: "What to look up",
    queryHint: "The name of a read in this hub, for example inventory.stock.low. It has to exist here, and you will be asked to allow it before it runs. Nothing is changed by looking something up.",
    queryResult: "What to keep",
    queryResult_first: "The first row it finds, field by field",
    queryResult_count: "Only how many there are",
    queryLimit: "At most this many rows",
    queryLimitHint: "Between 1 and {max}. The hub refuses more instead of quietly cutting the read short.",
    queryOutputsHint: "The next steps can use {paths}. If nothing is found the automation carries on with found = false \u2014 add a condition on it to stop there.",
    approvalTitle: "The question",
    approvalTitleHint: "This is what the person will read. It is filled in the moment the question is asked \u2014 editing the automation afterwards does not change a question already waiting.",
    approvalSummary: "Details (optional)",
    approvalAssignee: "Who has to answer",
    approvalAssigneeAdmins: "Whoever manages the hub",
    approvalAssigneeHint: "A role, never a person: people leave, roles stay. Whoever manages the hub can always answer, so a question never gets stuck.",
    approvalExpiresIn: "How long to wait for an answer",
    approvalExpiresInHint: "At most 30 days. When the time runs out the automation does what you choose below \u2014 it never stays waiting forever.",
    approvalOnReject: "If they say no",
    approvalOnReject_cancel: "Stop the automation here",
    approvalOnReject_continue: "Carry on with the next steps",
    approvalOnExpire: "If nobody answers in time",
    approvalOnExpire_reject: "Count it as a no",
    approvalOnExpire_cancel: "Stop the automation here",
    approvalOnExpire_continue: "Carry on with the next steps",
    approvalContinueHint: "Carrying on means the next steps run whatever the answer was. Add a condition on {path} (approved, rejected or expired) right after this step to do different things for each answer.",
    approvalOutputsHint: "The next steps can use {paths} \u2014 only if the automation carries on past this step.",
    paramName: "Name",
    paramValue: "Value",
    insertField: "Insert a field",
    removePart: "Remove {label}",
    guardTitle: "Only continue if",
    guardExplain: "If this is not true the automation stops here. It does not do anything else \u2014 there is no second path.",
    addCondition: "Add a condition",
    removeCondition: "Remove this condition",
    field: "Field",
    operator: "Is",
    value: "Value",
    opEq: "equal to",
    opNeq: "not equal to",
    opIn: "one of",
    opExists: "present",
    opContains: "containing",
    opGt: "greater than",
    opGte: "greater than or equal to",
    opLt: "less than",
    opLte: "less than or equal to",
    opInHint: "Separate the values with a comma.",
    delayNone: "No wait",
    delayDays: "Wait {count} days",
    delayDaysOne: "Wait 1 day",
    delayHours: "Wait {count} hours",
    delayHoursOne: "Wait 1 hour",
    delayMinutes: "Wait {count} minutes",
    delayMinutesOne: "Wait 1 minute",
    delaySeconds: "Wait {count} seconds",
    delaySecondsOne: "Wait 1 second",
    delayAmount: "How long",
    unitMinutes: "minutes",
    unitHours: "hours",
    unitDays: "days",
    pickFieldTitle: "Which information?",
    pickFieldSearch: "Search by name or by value",
    pickFieldEmpty: "Nothing to pick from yet.",
    pickFieldFrom: "From when {event}",
    pickFieldNoSamples: "This hub has not seen this happen recently, so there are no examples to show. The fields are still the right ones.",
    pickFieldRedacted: "example hidden: it could be about a person",
    pickFieldOptional: "not always there",
    grantsTitle: "What this automation may do",
    grantsIntro: "An automation runs with its own permissions, never with yours. Nothing below happens until you allow it.",
    grantsNone: "This automation asks for nothing yet.",
    grantsMissing: "Waiting for your permission",
    grantsGranted: "Allowed",
    grantAll: "Allow everything it needs",
    grantOne: "Allow",
    revoke: "Withdraw",
    grantsSaved: "Permissions updated.",
    grantCommandNotFound: "This hub has no command called {command}. Check the name in the step.",
    grantOther: "{kind}: {value}",
    grantLimits: "Limits",
    grantPinned: "\u2014 only with {limits}",
    grantLimitsIntro: "Fix a value and this automation may only act with that value. Anything else it tries is refused \u2014 and so is leaving the field out, so it cannot get round the limit by staying quiet.",
    grantLimitsNone: "No limits: it may do this with whatever it decides.",
    grantLimitField: "Field",
    grantLimitValue: "Must be",
    grantLimitAdd: "Add a limit",
    grantLimitRemove: "Remove the limit on {field}",
    grantLimitsSave: "Save limits",
    historyTitle: "What it has done",
    historyEmpty: "It has not run yet.",
    runDone: "Completed",
    runFailed: "Stopped by an error",
    runSleeping: "Waiting",
    runWaitingApproval: "Waiting for you to approve it",
    runCancelled: "Cancelled",
    runRunning: "Running",
    ranGuardStopped: "The condition was not met, so it stopped here. That is the automation working.",
    ranGuardPassed: "The condition was met",
    ranWaited: "Waited",
    ranWaitingUntil: "Waiting until {when}",
    ranCommand: "Ran {command}",
    ranCommandUnnamed: "Ran a command",
    ranFailed: "Stopped: {reason}",
    ranFailedUnknown: "no reason given",
    ranStep: "A \u201C{kind}\u201D step",
    ranQueryFound: "Found {count}",
    ranQueryNothing: "Found nothing, and carried on",
    ranApprovalApproved: "Somebody said yes",
    ranApprovalRejected: "Somebody said no",
    ranApprovalExpired: "Nobody answered in time",
    ranApprovalWaiting: "Waiting for somebody to answer",
    runNow: "Run it now",
    runStarted: "It is running. Its result appears here in a moment.",
    loadMore: "Show older",
    byTrigger: "Started {how}",
    byManual: "by hand",
    byEvent: "by something that happened",
    byCron: "by its schedule",
    byAt: "at its date",
    tabEditor: "Steps",
    tabPermissions: "Permissions",
    tabHistory: "History",
    evSaleCompleted: "a sale is charged",
    evSaleVoided: "a sale is voided",
    evOrderCompleted: "an order is closed",
    evInvoiceCreated: "an invoice is issued",
    evPaymentCompleted: "a payment goes through",
    evCustomerCreated: "a new customer is added",
    evAppointmentCreated: "an appointment is booked",
    evAppointmentCancelled: "an appointment is cancelled",
    evAppointmentRescheduled: "an appointment is moved",
    evAppointmentCompleted: "an appointment is finished",
    evAppointmentNoShow: "somebody does not turn up",
    evBookingCreated: "somebody books online",
    evBookingCancelled: "an online booking is cancelled",
    evReservationCreated: "a table is reserved",
    evTableOpened: "a table is seated",
    evTableClosed: "a table is freed",
    evKitchenOrderReady: "the kitchen has an order ready",
    evStockChanged: "the stock of a product changes",
    evCashClosed: "the till is closed",
    evCashOpened: "the till is opened",
    evWhatsappReceived: "a WhatsApp message arrives",
    evTicketCreated: "a support ticket is opened",
    evTaskCompleted: "a task is finished",
    evStaffTimeOff: "somebody asks for time off",
    stepGuardEmpty: "pick the condition",
    pickFieldSkipArray: "not offered: it is a list, and an automation cannot reach inside one",
    pickFieldSkipObject: "not offered on its own: pick one of the fields inside it",
    tplLede: "Pick one of these and it becomes yours, switched off, ready for you to look at before it does anything.",
    sector_any: "Any business",
    sector_beauty: "Hair and beauty",
    sector_food: "Bars and restaurants",
    tplBlanksTitle: "What you decide",
    tplNoBlanks: "Nothing to fill in. It is ready as it is.",
    tplGrantsTitle: "What it will ask you to allow",
    tplGrantsIntro: "An automation runs with its own permissions, never with yours. Until you allow these, it does nothing.",
    mod_appointments: "Appointments",
    mod_cash_register: "Cash Register",
    mod_customers: "Customers",
    mod_reservations: "Reservations",
    mod_sales: "Sales & POS",
    mod_staff: "Staff",
    mod_tasks: "Tasks",
    mod_verifactu: "VeriFactu",
    mod_whatsapp_inbox: "WhatsApp Inbox",
    tplUse: "Use this one",
    tplUnfinished: "Unfinished",
    tplView: "View it",
    tplHaveItAlready: "You already have this one. Open it to see how it is set up \u2014 using it again leaves you with two automations doing the same thing at the same time.",
    tplUnfinishedHint: "You started this one and never allowed it anything, so it does nothing yet. Open it to finish it.",
    tplCreatedPaused: "It is created paused. Nothing happens until you turn it on.",
    tplSameTrigger: "Careful: \xAB{flows}\xBB already runs on the same thing happening. If you add this one too, BOTH will run every time \u2014 two appointments, two messages to the same customer. Turn the other one off first unless you really want both.",
    tplSameTriggerMany: "Careful: \xAB{flows}\xBB already run on the same thing happening. If you add this one too, they will ALL run every time \u2014 several appointments, several messages to the same customer. Turn the others off first unless you really want them all.",
    tplYours: "Your automations",
    guideOpen: "How does this work?",
    guideBack: "Back to the automations",
    addNotify: "Send a message",
    addHttp: "Call another system",
    addAi: "Ask the assistant",
    addQuery: "Look something up",
    addApproval: "Ask somebody first",
    stepHttp: "Calls {host} ({method})",
    stepHttpEmpty: "Pick the address this step calls",
    stepHttpTemplatedHost: "Calls whatever address the data says ({method})",
    stepAiManual: "Asks the assistant: {prompt} \u2014 you approve any change",
    stepAiAuto: "Asks the assistant: {prompt} \u2014 it changes things on its own",
    stepAiEmpty: "Write what you want the assistant to do",
    stepNotifyEmail: "Sends an email to the {field} on file",
    stepNotifyWhatsapp: "Sends a WhatsApp to the {field} on file",
    stepNotifyEmpty: "Pick who this message goes to",
    stepQuery: "Looks up {query}",
    stepQueryCount: "Counts {query}",
    stepQueryEmpty: "Pick what to look up",
    stepApproval: "Asks {role}: \u201C{title}\u201D",
    stepApprovalAdmins: "Asks whoever manages the hub: \u201C{title}\u201D",
    stepApprovalEmpty: "Write the question somebody has to answer",
    httpMethod: "Method",
    httpUrl: "Address",
    httpGrantHint: "This step will ask you to allow calls to {pattern}",
    httpGrantUnknown: "Fill in the address and this step will tell you what it needs you to allow.",
    httpHeaders: "Headers",
    httpHeadersHint: "Where a key or a token goes. Save it as a secret below, then insert it here \u2014 its value is never shown again.",
    httpAddHeader: "Add a header",
    httpBody: "What to send",
    httpTimeout: "Give up after",
    httpTimeoutHint: "Seconds, {max} at most. The automation is held up for the whole wait \u2014 including when it ends in an error.",
    insertSecret: "Insert a secret",
    secretsTitle: "Secrets",
    secretsIntro: "Keys and passwords for other systems live here, encrypted. Once saved, a value can never be read back \u2014 not by you, not by this screen. Only a step that calls another system can use one.",
    secretName: "Name",
    secretValue: "Value",
    secretSaved: "{name} saved. Its value cannot be shown again.",
    secretDelete: "Delete {name}",
    aiPrompt: "What to ask",
    aiPromptHint: "Write it as you would to a person, and insert fields from what happened. Never put a key or a password here: it would be sent to the assistant.",
    aiToolsTitle: "What it may look at and do",
    aiToolsHint: "Offering something here does not allow it. Each one still has to be allowed on the Permissions tab.",
    aiToolsQueries: "It may read",
    aiToolsCommands: "It may propose",
    aiAddQuery: "Add something it may read",
    aiAddCommand: "Add something it may propose",
    aiPolicy: "Before it changes anything",
    aiPolicyManual: "Ask me first",
    aiPolicyAuto: "Let it go ahead on its own",
    aiPolicyAutoWarning: "It will change your data with nobody watching, at any hour. Only choose this once you have seen it propose the right thing several times.",
    aiPolicyManualHint: "Anything it wants to change waits for you under \u201CWaiting for you\u201D. Nothing happens until you say so.",
    aiMaxIters: "How many turns it may take",
    aiMaxItersHint: "{max} at most. Every turn is a real call, and every call costs money.",
    notifyChannel: "How it goes out",
    notifyChannel_email: "Email",
    notifyChannel_whatsapp: "WhatsApp",
    notifyWhatsappCost: "Meta charges for every WhatsApp. An email costs nothing.",
    notifyTo: "Who it goes to",
    notifyToHint: "The address is read from your own data and can never be typed here. That is what stops a message going to whatever arrived with the event.",
    notifyToQuery: "Read it from",
    notifyToField: "Which column",
    notifyTemplate: "Template name",
    notifyTemplateHint: "On WhatsApp, the template Meta approved for you. On email it becomes the subject, unless you write one yourself.",
    notifyText: "The message",
    approvalsTitle: "Waiting for you",
    approvalsIntro: "The assistant wants to change something. Nothing has happened yet.",
    approvalsEmpty: "Nothing is waiting for you.",
    approvalWould: "It wants to run {command}",
    approvalExpires: "If you do nothing, this expires on {when} and never runs.",
    approvalApprove: "Approve",
    approvalReject: "No",
    approvalAskedRole: "Asked of: {role}. Whoever manages the hub can answer too.",
    approvalAskedAdmins: "Asked of whoever manages the hub.",
    approvalExpires_reject: "If nobody answers by {when}, it counts as a no.",
    approvalExpires_cancel: "If nobody answers by {when}, the automation stops here.",
    approvalExpires_continue: "If nobody answers by {when}, the automation carries on anyway.",
    approvalComment: "Add a note (optional)",
    approvalErrExpired: "Too late: this one expired before you answered. Nothing was done.",
    approvalErrAlreadyDecided: "Somebody already answered this one. Nothing was done twice.",
    approvalErrNotYours: "This question was asked of another role, and you cannot answer it. Nothing was done.",
    tabTest: "Try it",
    testRun: "Try it",
    testNothingHappened: "Nothing here is real. No message is sent, nothing is charged and nothing is written down \u2014 this is only what your automation WOULD do.",
    testUsingReal: "Using what really happened the last time {event}, from the last {count} of them in your own hub.",
    testNoRealData: "This has not happened in your hub recently, so there is no real example to try it with. The steps below are still the right ones, but there is nothing to fill them in with.",
    testBlanksFound: "{count} things would come out empty. That is almost always the mistake.",
    testBlank: "would arrive empty",
    testHidden: "there is a value, and it is not shown here",
    testUnknown: "comes from an earlier step, so it is only known once it has run",
    testPausesHere: "Waits here for somebody to answer. Testing does not answer for them: all three outcomes are still possible.",
    testStoppedIsWorking: "It would stop here, and that is the automation working: there is no second path.",
    testNotReached: "It would not get this far.",
    testTriggerBlocked: "It would not even start: what happened does not match what you asked for.",
    testUncertain: "This cannot be checked here: it looks at something the hub hides because it could be about a person. It may go either way.",
    testClauseFailed: "{field} is not {op} {expected}",
    testWouldBeRefused: "It would be refused: you have not allowed {what} yet.",
    testBlanksFoundOne: "1 thing would come out empty. That is almost always the mistake.",
    attentionTitle: "Needs somebody",
    attentionNone: "Nothing has gone wrong.",
    attentionCount: "{count} runs stopped on a problem",
    troublePermission: "It tried to do something you have not allowed it to do, so it stopped.",
    troubleDoPermission: "Open Permissions and allow what it needs. Until you do, this will happen every time.",
    troubleSecret: "It needs a password or a key it could not read.",
    troubleDoSecret: "Open the step that reaches outside and check the secret it uses is still there.",
    troubleRecipient: "It could not work out who to send the message to.",
    troubleDoRecipient: "Open the message step and check who it goes to \u2014 the list it reads may be empty now.",
    troubleReach: "The address it tried to reach is not one it is allowed to reach.",
    troubleDoReach: "Open the step that calls the other service and check the address, and the permission that goes with it.",
    troubleSetup: "There is something this hub cannot read in how the automation is written.",
    troubleDoSetup: "Open it and save it again \u2014 the editor will show what does not fit.",
    troubleGone: "Something it needed is no longer there.",
    troubleDoGone: "Open it and check the steps. If it was edited while a run was in flight, this run cannot be finished.",
    troubleApproval: "Nobody answered in time, so it let go.",
    troubleDoApproval: "Run it again if it still needs doing, and give whoever approves it more room next time.",
    troubleTechnical: "The technical wording, for support",
    runCopyId: "Copy the reference",
    runCopied: "Copied. Paste it if you ask us about this run.",
    deadTitle: "Needs your attention",
    deadIntro: "These never happened. Decide what to do with each one.",
    deadEmpty: "Nothing is stuck.",
    deadUnsupported: "This hub is older than this screen, so it cannot tell you whether anything got stuck. Updating it is what turns this on.",
    deadDenied: "Automations has not been allowed to see what got stuck. Open Settings \u2192 Permissions and allow it.",
    deadWhat: "{event} never went through",
    deadFrom: "from {module}",
    deadAttempts: "{count} tries",
    deadAttemptsOne: "1 try",
    deadUnexplained: "It stopped, and what is folded below is everything the hub was told about why.",
    deadDoRetry: "If you have fixed what caused it, send it again.",
    deadRevoked: "You took away the permission this needed while it was still waiting, so it can never go out as it stands.",
    deadDoRevoked: "Allow it again in Permissions and run the automation. Sending this one again would fail for the same reason.",
    deadRetry: "Send it again",
    deadRetryAll: "Send all {count} again",
    deadRetriedAll: "{count} sent again. If the cause is still there they will come back.",
    deadDiscard: "Close it",
    deadDiscardConfirm: "Close this for good? It stops counting and nothing will ever send it again.",
    deadDiscardReasonHint: "We already record who closed it and when. Why is the part only you know \u2014 it is optional, but it is what makes this readable in six months.",
    deadDiscardReasonLabel: "Why are you closing it?",
    deadDiscardReasonPlaceholder: "Optional \u2014 e.g. the invoice was registered by hand",
    deadReasonDuplicate: "Duplicate",
    deadReasonHandled: "Already sorted out by hand",
    deadReasonObsolete: "No longer applies",
    deadDiscardReasonNotKept: "{event} is closed, but this hub is older than the reason field, so it kept who and when and not why. Updating it is what turns that on.",
    deadClosedTitle: "Closed just now",
    deadClosedIntro: "The hub keeps who closed each one, when and why for ninety days.",
    deadClosedWith: "{event} \u2014 closed: \xAB{reason}\xBB",
    deadClosedNoReason: "{event} \u2014 closed, with no reason written down.",
    deadDiscardDo: "Yes, close it",
    runTook: "took {seconds}s",
    evtPhrase: "{subject} {action}",
    evfAppointments: "Appointments",
    evfCartCheckout: "Online cart",
    evfCashRegister: "Till",
    evfCombos: "Combos",
    evfCustomers: "Customers",
    evfFlows: "Automations",
    evfHost: "This device",
    evfInventory: "Stock",
    evfInvoice: "Invoicing",
    evfInvoiceSeries: "Invoice series",
    evfKitchen: "Kitchen",
    evfModifiers: "Modifiers",
    evfOnlineBooking: "Online booking",
    evfPaymentGateways: "Payment gateways",
    evfPayments: "Payments",
    evfPricing: "Prices",
    evfPrinting: "Printing",
    evfReservations: "Table reservations",
    evfSales: "Sales",
    evfSchedules: "Opening hours",
    evfServices: "Services",
    evfStaff: "Staff",
    evfTables: "Tables",
    evfTasks: "Tasks",
    evfTaxes: "Taxes",
    evfTickets: "Support",
    evfVerifactu: "VeriFactu",
    evfWhatsapp: "WhatsApp",
    evsAeat: "the AEAT",
    evsAppointment: "an appointment",
    evsBlockedDate: "a blocked day",
    evsBlockedTime: "a blocked slot",
    evsBooking: "an online booking",
    evsBookingRequest: "a booking request",
    evsBusinessHours: "the opening hours",
    evsCart: "a cart",
    evsCartLine: "a cart line",
    evsCarts: "the carts",
    evsChain: "the invoice chain",
    evsCheckout: "an online payment",
    evsChoiceGroup: "a choice group",
    evsChoiceOption: "a choice",
    evsCombo: "a combo",
    evsComment: "a comment",
    evsConfig: "the configuration",
    evsContingency: "a contingency",
    evsConversation: "a conversation",
    evsCustomer: "a customer",
    evsDiagnostic: "a diagnostic",
    evsDraft: "a draft automation",
    evsGateway: "a payment gateway",
    evsInvoice: "an invoice",
    evsInvoiceNumber: "an invoice number",
    evsLine: "a line",
    evsMessage: "a message",
    evsModifier: "a modifier",
    evsModifierGroup: "a modifier group",
    evsOnlineOrder: "an online order",
    evsOpenTable: "an open table",
    evsOrder: "an order",
    evsPackage: "a package",
    evsPayment: "a payment",
    evsPrice: "a price",
    evsPriceList: "a price list",
    evsProduct: "a product",
    evsProject: "a project",
    evsRecord: "a VeriFactu record",
    evsRecurring: "a repeating appointment",
    evsReminder: "a reminder",
    evsRequest: "a request",
    evsReservation: "a table reservation",
    evsRole: "a role",
    evsRouting: "the kitchen routing",
    evsRule: "a rule",
    evsSale: "a sale",
    evsSchedule: "a schedule",
    evsScheduleOverride: "an opening-hours exception",
    evsSeries: "an invoice series",
    evsService: "a service",
    evsSettings: "the settings",
    evsSla: "an SLA",
    evsSlot: "a slot",
    evsSpecialDay: "a special day",
    evsStaffMember: "a staff member",
    evsStation: "a kitchen station",
    evsTable: "a table",
    evsTask: "a task",
    evsTaxAlias: "a tax alias",
    evsTaxCategory: "a tax category",
    evsTemplate: "a template",
    evsTicket: "a support ticket",
    evsTimeOff: "a time-off request",
    evsTimeslot: "a time slot",
    evsTransaction: "a card transaction",
    evsWaitlist: "a waiting-list entry",
    evsZone: "a zone",
    evaAbandoned: "is abandoned",
    evaAdded: "is added",
    evaAllocated: "is reserved",
    evaAnonymized: "is anonymised",
    evaApproved: "is approved",
    evaAssigned: "is assigned",
    evaBreached: "is breached",
    evaBumped: "is cleared off the kitchen screen",
    evaCancelled: "is cancelled",
    evaCategorized: "is filed under a category",
    evaChanged: "changes",
    evaCleared: "is emptied",
    evaClosed: "is closed",
    evaCompleted: "is completed",
    evaConfirmed: "is confirmed",
    evaCreated: "is created",
    evaDeactivated: "is switched off",
    evaDeleted: "is deleted",
    evaDue: "falls due",
    evaExpired: "expires",
    evaExpiredPl: "expire",
    evaFailed: "fails",
    evaFired: "is fired to the kitchen",
    evaFulfilled: "is fulfilled",
    evaGranted: "is granted",
    evaHeld: "is put on hold",
    evaHoldReleased: "is released from hold",
    evaInitiated: "is started",
    evaOpened: "is opened",
    evaPaid: "is paid",
    evaParked: "is parked",
    evaProcessed: "is processed",
    evaProposed: "is proposed",
    evaQueried: "is queried",
    evaReceived: "arrives",
    evaRectified: "is corrected",
    evaRecovered: "is recovered",
    evaRedeemed: "is redeemed",
    evaRefunded: "is refunded",
    evaRejected: "is rejected",
    evaRemoved: "is removed",
    evaReopened: "is reopened",
    evaRescheduled: "is moved to another time",
    evaResolved: "is resolved",
    evaRestored: "is restored",
    evaRetried: "is retried",
    evaRun: "is run",
    evaSaved: "is saved",
    evaSavedPl: "are saved",
    evaSent: "is sent",
    evaServed: "is served",
    evaSettled: "is settled",
    evaStarted: "starts",
    evaStatusChanged: "changes status",
    evaSucceeded: "goes through",
    evaTerminated: "leaves the company",
    evaTransferred: "is transferred",
    evaUncategorized: "is taken out of its category",
    evaUpdated: "is updated",
    evaUpdatedPl: "are updated",
    evaValidated: "is validated",
    evLowStockCrossed: "the stock of a product drops below its minimum",
    evProductUncategorized: "a product is taken out of its category",
    evCashMovement: "a till movement is recorded",
    evCashSettings: "the till settings are changed",
    evKitchenOrderCreated: "an order reaches the kitchen",
    evKitchenOrderRecalled: "an order goes back to the kitchen",
    evKitchenItemRecalled: "a line goes back to the kitchen",
    evPrintDue: "there is something to print",
    evReminderDue: "a reminder falls due",
    evFlowReleaseRevoked: "an automation loses a permission",
    evHostNotify: "this device is asked to warn somebody",
    evHostPrint: "this device is asked to print",
    evUnconfirmedReleased: "unconfirmed reservations are released",
    evTaxRulesBulk: "tax rules are imported in bulk",
    evSaleFromAppointment: "a sale is created from an appointment",
    evStaffMemberCreated: "somebody joins the team",
    evRecordTransmitted: "an invoice is sent to the tax office",
    evRecordRejected: "the tax office rejects an invoice",
    evRecordAcceptedWithErrors: "the tax office accepts an invoice with errors",
    evSeriesDefaultChanged: "a series becomes the default one",
    evModifierAttached: "a modifier is attached to a product",
    evModifierDetached: "a modifier is taken off a product",
    evTablesMerged: "two tables are merged",
    evTablesSplit: "a bill is split",
    evTableTransferred: "a table is moved to another one",
    evOnlineNoShow: "somebody does not turn up for an online booking",
    evConsentGranted: "a customer gives their consent",
    evConsentWithdrawn: "a customer withdraws their consent",
    evOrderFired: "an order is fired to the kitchen",
    evStaffDeactivated: "a staff member is deactivated",
    mod_services: "Services",
    tplHiddenModule: "Some automations are hidden: they need the {modules} module, and this hub does not have it. Install it from the marketplace and reload this screen.",
    tplHiddenModules: "Some automations are hidden: they need the {modules} modules, and this hub does not have them. Install them from the marketplace and reload this screen."
  },
  tpl: {
    author: "Automations",
    grant: {
      tasksCreate: "Create a task in your list. It stays inside the hub and never writes to a customer.",
      customersNote: "Add a note to a customer's history. It does not change their details and it does not contact them.",
      notifyWhatsapp: "Answer on WhatsApp. Every message sent is billed by Meta.",
      recipientWhatsapp: "Write back on that same conversation, and to nobody else.",
      customersList: "Look the customer up by their phone number.",
      customersCreate: "Create the card when it is somebody new. It waits for you to approve it.",
      servicesList: "Read your service catalogue, to tell which one they are asking for and how long it takes.",
      staffList: "Read who works at the salon, so it proposes somebody who is really there.",
      staffSchedules: "Read a professional\u2019s hours, so the slot is one they actually work.",
      dayOpening: "Ask when the salon opens that day, instead of working it out on its own.",
      availabilitySlots: "Ask which slots are really free on that date.",
      availabilityCheck: "Check the slot is still free before proposing it.",
      appointmentsCreate: "Book the appointment. It waits in the tray until you approve it.",
      appointmentsListForCustomer: "Read the appointments a customer already has, so it cancels or moves the right one and never guesses.",
      appointmentsCancel: "Cancel an appointment when the customer asks. It waits in the tray until you approve it, and your own cancellation rules still apply.",
      appointmentsReschedule: "Move an appointment to another time when the customer asks. It waits in the tray until you approve it, and your own notice rules still apply.",
      reservationsSettings: "To tell them what this restaurant takes \u2014 the party sizes, the notice it wants and whether it needs a phone or an email. It only reads them.",
      reservationsTimeslots: "To know which service windows you open on that day of the week, so it never offers a time you do not serve.",
      reservationsSlotsCount: "To see how many tables are really left in each window of that day, counted the way the booking gate counts them.",
      reservationsBlockedDates: "To know whether you are closed that day, or part of it, before it offers anything.",
      reservationsCreate: "To put the table in the book. Only with the day, the time and the number of people the guest gave.",
      reservationsWaitlistCreate: "To put them on the waiting list when the day is full and they ask to be called if a table frees up."
    },
    welcome: {
      name: "Welcome every new customer",
      summary: "Somebody new goes into your customer list and you get a reminder to say hello.",
      plain: "When a new customer is added \u2192 wait one day \u2192 leave you the task of welcoming them.",
      blankWait: "How long to wait",
      blankWaitHint: "One day to start with. A welcome that arrives while they are still walking out of the door is the one nobody makes.",
      taskTitle: "Welcome {{input.name}}"
    },
    bigSale: {
      name: "Write the big visits into the customer's card",
      summary: "Every time somebody spends more than the amount you choose, a note lands in their history.",
      plain: "When a sale is charged \u2192 only if it has a customer and comes to more than the amount you set \u2192 write a note in that customer's card.",
      blankAmount: "The amount that makes a sale a big one",
      blankAmountHint: "In cents: 10000 is 100,00 \u20AC. The hub keeps money in cents, so writing 100 here would mean one euro.",
      noteContent: "Big visit. Worth a personal welcome next time."
    },
    newStaff: {
      name: "Somebody joins the team",
      summary: "A new person is added to your staff and the setting-up jobs are waiting for you the same minute.",
      plain: "When somebody new is added to the team \u2192 leave you the task of setting them up: keys, access, uniform, the first shift.",
      blankList: "What has to be done for a new starter",
      blankListHint: "Whatever you always forget. Write it as one list in the task text \u2014 keys, till code, rota, who shows them around.",
      taskTitle: "Set up the new team member",
      taskDescription: "Keys and alarm code \xB7 access to the till \xB7 rota for the first week \xB7 who walks them round on day one."
    },
    whatsapp: {
      name: "Nobody's WhatsApp goes unanswered",
      summary: "A message comes in and answering it lands on somebody's list straight away, before the day swallows it.",
      plain: "When a message arrives on WhatsApp \u2192 leave the urgent task of reading it and answering.",
      blankWho: "Whose list it lands on",
      blankWhoHint: "One person, not \xABsomebody\xBB. A task everybody can see is a task everybody assumes the other one took.",
      taskTitle: "Answer the WhatsApp message",
      taskDescription: "Read it in the inbox and answer. If it turns into a booking or an order, put it through as usual."
    },
    fiscalRejected: {
      name: "Warn me if an invoice does not reach the tax agency",
      summary: "A billing record that is refused stops being something you only find out by opening a screen.",
      plain: "When an invoice fails to register \u2192 leave an urgent task to check it.",
      blankWho: "Who checks it",
      blankWhoHint: "Whoever fixes invoices. Leave it unassigned and it lands in the shared list, which is fine in a small shop.",
      taskTitle: "An invoice has not been registered with the tax agency",
      taskDescription: "Open VeriFactu, find the record marked as failed and read the reason. It can be the agency refusing it, or the connection never reaching it. Until it is registered, that invoice is not filed."
    },
    cashClose: {
      name: "When the till closes, somebody checks the day",
      summary: "The session is closed and the check lands on a list while the shop is still standing there.",
      plain: "When a till session is closed \u2192 leave the task of checking the count and the day's paperwork.",
      blankWho: "Whose list it lands on",
      blankWhoHint: "Whoever cashes up. If that is you, leave it as it is.",
      taskTitle: "Check the till closing",
      taskDescription: "Count against the session \xB7 anything that did not add up \xB7 the day's invoices went out."
    },
    weekReview: {
      name: "Friday evening, look at the week",
      summary: "A weekly reminder to sit down with the numbers, on the evening you choose.",
      plain: "Every Friday at 18:00 \u2192 leave you the task of going through the week: what sold, what did not, what to order.",
      blankWhen: "The day and the time",
      blankWhenHint: "Friday at 18:00 to start with. Put it when you are closing, not in the middle of service.",
      taskTitle: "Go through the week",
      taskDescription: "What sold and what did not \xB7 what to reorder \xB7 anything still unpaid \xB7 next week's diary."
    },
    morning: {
      name: "Every morning, go through tomorrow's diary",
      summary: "A task waiting for you first thing, so nobody's appointment goes unconfirmed.",
      plain: "Every day at 9:00 \u2192 leave you the task of going through tomorrow's appointments and confirming them.",
      blankTime: "The time",
      blankTimeHint: "09:00 to start with. Put it when you open, not when you are already busy.",
      taskTitle: "Go through tomorrow's appointments and confirm them"
    },
    noShow: {
      name: "Whoever did not turn up does not get lost",
      summary: "The moment an appointment is marked as a no-show, calling them back becomes a task.",
      plain: "When an appointment is marked as a no-show \u2192 leave you the task of calling them and offering another time.",
      taskTitle: "Call whoever did not turn up and offer them another time"
    },
    bigParty: {
      name: "Big tables get prepared",
      summary: "A large booking comes in and the room has its task before the day arrives.",
      plain: "When a reservation is taken \u2192 only if it is for more people than you set \u2192 leave the room the task of getting the table ready.",
      blankSize: "How many people make a table a big one",
      blankSizeHint: "Six to start with. Count the people, not the tables.",
      taskTitle: "Prepare the table for {{input.guest_name}} \u2014 {{input.party_size}} people",
      taskDescription: "{{input.date}} at {{input.time}}"
    },
    waAppointment: {
      name: "WhatsApp \u2192 appointment proposal",
      summary: "Somebody asks for an appointment on WhatsApp: it answers at once, reads the diary and proposes a real slot for you to confirm.",
      plain: "When somebody writes to your WhatsApp, this answers them straight away so nobody is left waiting, makes sure they have a customer card, works out which service they are asking for and how long it takes, and finds a slot the diary really has free with a professional who works at that hour. Then it proposes the appointment. Nothing is booked and no card is created until somebody at the salon approves it.",
      blankReply: "The message they get back straight away",
      blankReplyHint: "The line that goes out the moment a message arrives, before anybody has read it. Put it in your own words: it is the first thing your customer reads.",
      ackText: "Thanks for writing! We have your message. We will confirm your appointment as soon as the salon opens.",
      knowPrompt: 'A customer wrote to the salon on WhatsApp from the phone number {{input.from}}. This is what they said:\n\n"{{input.text}}"\n\nYour only job in this turn is to make sure the person has a customer record, because an appointment is booked against a real customer, never against free text.\n\nThe salon\'s records have already been searched for you, by that phone number and by nothing else. You have no way to search them yourself, and you must not ask for one: the number the message came from is the only identity WhatsApp vouched for, and a name written in a message is not an identity. This is what the search answered:\n\n- is somebody on file for that number: {{steps.find_customer.found}}\n- how many records match it: {{steps.find_customer.count}}\n- the name on the record, when there is one: {{steps.find_customer.name}}\n2. If `{{steps.find_customer.found}}` is `true`, propose NOTHING. Answer in one line saying who they are and stop.\n3. If it is `false`, propose `customers.create` with the phone `+{{input.from}}` and the name the person gave in their message. If they gave no name, use the phone number as the name \u2014 do not invent one.\n\nNever propose more than one write. Whatever you propose is reviewed by a person before it happens.',
      proposePrompt: "A customer wrote to the salon on WhatsApp from the phone number {{input.from}} at {{input.received_at}}. This is what they said:\n\n\"{{input.text}}\"\n\nThe previous step already made sure the customer record exists, and reported: {{steps.know_the_customer.text}}\n\n**First, work out what they are asking for.** Read their message and decide which of these it is:\n\n- **A new appointment** \u2014 a time, a service, \xABdo you have room tomorrow\xBB. Do BOOKING below.\n- **Cancelling one they already have** \u2014 \xABI can't make it\xBB, \xABcancel it\xBB, \xABsomething came up\xBB. Do CANCELLING below, and do NOT book anything. Somebody who asks to cancel and ends up with a second appointment is the worst thing this automation can do to a salon.\n- **Moving one they already have** \u2014 \xABcan you change it to Thursday?\xBB, \xABcould we make it later?\xBB, \xABI need another day\xBB. Do MOVING below, and do NOT book a second appointment: they have one already and what they are asking for is to keep it.\n- **Anything else** \u2014 a price, a question, a complaint. Propose NOTHING: answer in one line if you can, and otherwise say somebody from the salon will get back to them.\n\n# BOOKING\n\nFind the slot AND propose the appointment in this same turn. The availability tools you have here only answer questions: they change nothing, they run the moment you call them, and their answers come straight back to you. So ask them, and then propose ONE appointment, and only one, out of what they told you.\n\n1. Read the catalogue with `services.services.list` and pick the service they are asking for. If the message is too vague to tell which one, propose NOTHING: tell them so in one line and name the services that could fit, so they can pick.\n2. Work out how long it takes. If the service declares `duration_minutes`, use it AS IS \u2014 the salon decided it. If it is missing or zero, ESTIMATE it from what the service is: a cut is not a colour, and a colour is not a colour with highlights. Be honest, and be generous rather than exact; a proposal that falls fifteen minutes short pushes the whole afternoon.\n3. Ask `appointments.availability.day_opening` when the salon is open on the date they want. It answers `spans` \u2014 minutes from that date's own midnight, with the breaks already carved out \u2014 and `source`. If `source` is `schedules` and `spans` is empty, THE SALON IS SHUT that day: propose nothing, tell them so, offer the nearest day it is open, and stop. If `source` is `unset` the salon has no rule reaching that date, so nothing is being refused on those grounds and you must not filter by hours yourself.\n4. NEVER work the opening hours out on your own, from the message or from anywhere else \u2014 and the same goes for the free slots and for who is working. These operations resolve them exactly as the booking gate does \u2014 special day, yearly special day, override range, weekly hours, in that order \u2014 and a second opinion about when the salon opens is precisely how a good-looking proposal gets rejected the moment somebody approves it. Ask; never deduce.\n5. Ask `appointments.availability.slots` for the real free slots on that date for that duration, and confirm the one you settle on with `appointments.availability.check`. If `check` refuses it, take its reason at face value and move to the next slot: `outside_schedule` means the salon is shut at that hour, `held` means another pending request has it set aside for a few minutes.\n6. Use `staff.members.list` and `staff.schedules.list_for_member` to pick a professional who actually works at that hour, and confirm the slot for that person by passing their `staff_id`.\n7. Respect the day or the hour they asked for; if it is not free, take the closest one that is. If nothing is free at all, propose nothing and tell them so in one line, offering another day.\n8. The customer is already resolved: their id is `{{steps.resolve_customer.id}}`.\n9. Propose `appointments.appointments.create` with the customer, the service, the professional, the start you confirmed and `duration_minutes`.\n\nAbout the duration, this matters: if you ESTIMATED it instead of reading it from the catalogue, say so in `internal_notes`, in words and with the number \u2014 for example \"Duration estimated by the assistant: 90 min; the catalogue declares none for this service.\" Whoever approves has to be able to see the estimate and correct it before it enters the agenda, and `internal_notes` is for staff only, so the customer never reads it.\n\nPut in `notes` a one-line summary of what the customer asked for, in their own words.\n\nOnly the booking is a proposal. Asking what is free changes nothing and happens as you ask; `appointments.appointments.create` is the one thing that waits in the approval tray until somebody at the salon reviews it, and it then runs exactly as you wrote it.\n\n# CANCELLING\n\n1. The customer is already resolved: their id is `{{steps.resolve_customer.id}}`, and `{{steps.resolve_customer.found}}` says whether there is a record at all. No record means no appointment: tell them there is nothing booked under that number and stop.\n2. List what they have with `appointments.appointments.list_for_customer`. It answers newest first and it includes the past and the already-cancelled ones, so take the SOONEST one still to come whose `status` is `pending` or `confirmed`. Anything `cancelled`, `completed` or `no_show` is history \u2014 it is not theirs to cancel.\n3. If nothing is still to come, tell them there is nothing booked and stop.\n4. If more than one is still to come and their message does not say which, NAME them \u2014 day, hour and professional \u2014 and ask which one. Never guess: cancelling the wrong appointment costs the salon the chair AND the customer.\n5. Propose `appointments.appointments.cancel` with that `appointment_id`, a `reason` in their own words, `channel` set to `customer`, and the `customer_id` of the person you found in point 1.\n\nThat `channel` is not decoration: it is what makes the salon's OWN rules apply \u2014 whether customers may cancel at all, and how much notice they owe. And it is why the `customer_id` goes with it: on the customer channel Citas refuses a cancellation that does not say who is asking, and refuses it again if the appointment turns out to belong to somebody else. So it has to be the id you looked up from THEIR phone number in point 1, never one taken from the message or from anywhere else. Citas decides the rest when the cancellation runs, with the settings of this business. Do not work it out yourself, do not tell them it is too late, and do not offer to cancel \xABanyway\xBB: propose it, and if the salon's rules refuse it, the salon sees exactly why.\n\nNever propose cancelling something you have not named to them first.\n\n# MOVING\n\nMoving is one call, never two. `appointments.appointments.reschedule` takes the appointment they already have to another time \u2014 the same customer, the same professional, the same length \u2014 and the salon's own rules (how much notice it wants, how far ahead it takes bookings, the days it has blocked) decide whether it may. Cancelling that appointment and booking a new one is NOT the same operation: it spends the cancellation the salon allows them, it drops the appointment the salon had in front of it, and when the second half then fails \u2014 the slot went in between, or `appointments.availability.check` answers `held` \u2014 the customer who wrote in order to KEEP their hour is left with nothing at all.\n\n1. The customer is already resolved: their id is `{{steps.resolve_customer.id}}`, and `{{steps.resolve_customer.found}}` says whether there is a record at all. No record means no appointment: tell them there is nothing booked under that number and stop.\n2. List what they have with `appointments.appointments.list_for_customer` and take the SOONEST one still to come whose `status` is `pending` or `confirmed`, exactly as in CANCELLING. Anything `cancelled`, `completed` or `no_show` is history and there is nothing to move. If nothing is still to come, tell them so and stop. If more than one is, and their message does not say which, NAME them \u2014 day, hour and professional \u2014 and ask which one, proposing nothing until they answer.\n3. The appointment you move is the one that came out of THAT list, always. Unlike cancelling, this operation says nothing about who is asking, so Citas cannot tell whose appointment it has been handed: an id taken from the message, or guessed, moves a stranger's hour and nothing further down will stop it.\n4. Work out the new time exactly as BOOKING does and never any other way: `appointments.availability.day_opening` for the day they want, `appointments.availability.slots` for what is really free, and `appointments.availability.check` on the one you settle on \u2014 passing the `staff_id` the appointment ALREADY has, because moving it does not change who does it.\n5. Propose `appointments.appointments.reschedule` with that `appointment_id` and the `start_datetime` you confirmed, and say nothing about `duration_minutes`: left out, the appointment keeps the length it already had.\n6. If nothing is free when they asked for, propose NOTHING: tell them so in one line, offer the nearest free slots so they can answer with one, and say plainly that the appointment they have STAYS AS IT IS. Never cancel it to make room for a move you could not confirm.\n\n**And now the part that reaches the customer.** Everything you write back is sent to them on WhatsApp, word for word, as soon as the salon has decided \u2014 so write it TO them, not about them: their own language, one or two short lines, warm and plain. If the salon turns your proposal down, a later step tells them THAT instead and yours is never sent, so never write as though a \xABno\xBB were impossible.\n\n- If you proposed a booking, tell them what they have: the day, the hour and the professional BY NAME. Never an id, never a tool name, never \xABpending approval\xBB \u2014 by the time they read this, it happened.\n- If you proposed a cancellation, tell them it is cancelled, naming the appointment you cancelled so they can see it was the right one, and leave the door open to book again.\n- If you proposed a move, tell them the NEW day and hour and the professional BY NAME, and that the one they had before no longer stands, so they do not turn up twice.\n- If you proposed nothing, tell them why in one line and offer the nearest alternative, so they can answer with it.\n- Never put in here the duration you estimated, what the catalogue did or did not declare, or anything else the salon needs to see. That goes in `internal_notes`, which only the salon reads.\n\nWrite it in the SAME reply in which you propose \u2014 a booking, a cancellation or a move: proposing ends your turn and you will not be asked again, so a proposal sent with no words leaves her with nothing.\n\n\u{1F534} **One customer, and only that one.** Every tool here that takes a `customer_id` gets exactly one: `{{steps.resolve_customer.id}}`, the record the phone number THIS message came from picked out. Never an id built from a name somebody mentioned, never one taken from the message, never one from anywhere else \u2014 the diary of the person writing to you is the only diary this conversation is entitled to, and \xABchange Mar\xEDa's appointment\xBB is a request you cannot carry out however it is worded. And if `{{steps.resolve_customer.count}}` is anything other than `1`, that number does not pick out one person: touch no appointment at all, say somebody from the salon will get back to them, and stop.",
      replyPrompt: "You are writing the WhatsApp message the customer is about to receive. It goes out word for word, so it has to read as if the salon wrote it: her own language, warm and plain, no ids, no tool names, and no mention of a tray, an approval, or anybody having had to decide.\n\nThis is how the step before you ended, and it is everything you know:\n\n- Outcome: {{steps.propose_appointment.status}}\n- What that step wrote for her: {{steps.propose_appointment.text}}\n- What the salon noted while deciding: {{steps.propose_appointment.comment}}\n\n**If the outcome is empty or `approved`**, nothing was refused: either the salon accepted what was proposed, or nothing was ever proposed. Send back what that step wrote for her, WORD FOR WORD. Do not improve it, do not shorten it, do not add to it \u2014 the day, the hour and the professional are in there and only there.\n\n**If the outcome is `rejected`**, the salon has looked at that time and cannot take it. What that step wrote must NEVER reach her: it describes an appointment she does not have. Write her a new message instead, in one or two short lines, and it has two parts \u2014 both of them required:\n\n1. that the time she asked for cannot be, plainly, without blame and without excuses;\n2. WHAT SHE DOES NOW \u2014 that she can answer right here with another day, or just a time of day that suits her, and the salon will look again. A \xABno\xBB with nothing after it is where she stops writing, and this automation exists so that she does not.\n\nWhatever the outcome:\n\n- Never tell her she has an appointment unless the step before you said so AND nothing was refused.\n- Never invent a day, an hour, a professional or a price. If you were not told one, do not name one.\n- If what the salon turned down was a CHANGE of time, the appointment she already had is still there, exactly as it was. Say so: a \xABno\xBB to a change and nothing else reads as having lost the appointment too.\n- The salon's note is written for the salon, not for her. Use it to understand why, never send it as it is: it may name a colleague, a rota, or a reason that is none of her business.\n- Answer in the language she wrote in."
    },
    waAppointmentUnattended: {
      name: "WhatsApp \u2192 appointment booked, no review",
      summary: "Somebody asks for an appointment on WhatsApp and it books it there and then, on its own. Nobody at the shop confirms anything: the appointment is in the diary before you read the message.",
      plain: "When somebody writes to your WhatsApp, this answers them straight away so nobody is left waiting, makes sure they have a customer card, reads your diary and BOOKS the appointment itself \u2014 no approval, no tray, nothing waiting for you. It only ever books a day and an hour the customer asked for: if they did not say when, it sends them the slots that are really free and asks. Then it writes back to tell them what they have. Use it when there is nobody to watch WhatsApp; if you would rather say yes to each one first, install \xABWhatsApp \u2192 appointment proposal\xBB instead \u2014 do not install both, or every message gets two appointments.",
      blankReply: "The message they get back straight away",
      blankReplyHint: "The line that goes out the moment a message arrives, before the diary has even been read. Put it in your own words: it is the first thing they hear from you. Do not promise a person will reply \u2014 with this automation, nobody does.",
      ackText: "Thanks for writing! Let me check the diary and I will come straight back to you.",
      knowPrompt: "A customer wrote to the salon on WhatsApp from the phone number {{input.from}}. This is what they said:\n\n\"{{input.text}}\"\n\nYour only job in this turn is to make sure the person has a customer record, because an appointment is booked against a real customer, never against free text.\n\nThe salon's records have already been searched for you, by that phone number and by nothing else. You have no way to search them yourself, and you must not ask for one: the number the message came from is the only identity WhatsApp vouched for, and a name written in a message is not an identity. This is what the search answered:\n\n- is somebody on file for that number: {{steps.find_customer.found}}\n- how many records match it: {{steps.find_customer.count}}\n- the name on the record, when there is one: {{steps.find_customer.name}}\n2. If `{{steps.find_customer.found}}` is `true`, write NOTHING. Answer in one line saying who they are and stop.\n3. If it is `false`, create them with `customers.create`, with the phone `+{{input.from}}` and the name the person gave in their message. If they gave no name, use the phone number as the name \u2014 do not invent one.\n\nNever write more than once. And read this twice, because it is what makes this automation different from the one with a review step: **nobody is going to check your work.** This salon runs its WhatsApp unattended, so anything you call happens immediately, on the salon's real customer list. The record you create is the record they will have.",
      bookPrompt: "A customer wrote to the salon on WhatsApp from the phone number {{input.from}} at {{input.received_at}}. This is what they said:\n\n\"{{input.text}}\"\n\nThe previous step already made sure the customer record exists, and reported: {{steps.know_the_customer.text}}\n\n**Everything you do here HAPPENS.** This salon runs its WhatsApp unattended: there is no approval tray, and nobody reads your work before the customer does. The moment you call `appointments.appointments.create` the appointment is in the diary, and what you write back is sent to the customer as it is.\n\n**First, work out what they are asking for.** Read their message and decide which of these it is:\n\n- **A new appointment** \u2014 a time, a service, \xABdo you have room tomorrow\xBB. Do BOOKING below.\n- **Cancelling one they already have** \u2014 \xABI can't make it\xBB, \xABcancel it\xBB, \xABsomething came up\xBB. Do CANCELLING below, and do NOT book anything. Somebody who asks to cancel and ends up with a second appointment is the worst thing this automation can do to a salon.\n- **Anything else** \u2014 a price, a question, a complaint, moving an appointment to another day (which this automation cannot do yet). Do NOTHING: answer in one line if you can, and otherwise say somebody from the salon will get back to them.\n\n# BOOKING\n\n\u{1F534} **You never choose the hour. They do.** You may only book a start the customer asked for themselves. If their message does not pin down BOTH a day and an hour, you book nothing this turn: you answer with the real free slots and ask them to reply with the service, the day and the hour. That is not politeness, it is the design \u2014 with nobody at the salon to catch it, a bot that picks the hour books people into times they cannot make, and the salon loses the chair and the customer both.\n\nThe availability tools you have here only answer questions: they change nothing, they run the moment you call them, and their answers come straight back to you. So ask them first, and act on what they told you.\n\n1. Read the catalogue with `services.services.list` and pick the service they are asking for. If the message is too vague to tell which one, book NOTHING: tell them so in one line and name the services that could fit, so they can pick.\n2. Work out how long it takes. If the service declares `duration_minutes`, use it AS IS \u2014 the salon decided it. If it is missing or zero, ESTIMATE it from what the service is: a cut is not a colour, and a colour is not a colour with highlights. Be honest, and be generous rather than exact; a booking that falls fifteen minutes short pushes the whole afternoon.\n3. Ask `appointments.availability.day_opening` when the salon is open on the date they want. It answers `spans` \u2014 minutes from that date's own midnight, with the breaks already carved out \u2014 and `source`. If `source` is `schedules` and `spans` is empty, THE SALON IS SHUT that day: book nothing, tell them so, offer the nearest day it is open, and stop. If `source` is `unset` the salon has no rule reaching that date, so nothing is being refused on those grounds and you must not filter by hours yourself.\n4. NEVER work the opening hours out on your own, from the message or from anywhere else \u2014 and the same goes for the free slots and for who is working. These operations resolve them exactly as the booking gate does \u2014 special day, yearly special day, override range, weekly hours, in that order \u2014 and a second opinion about when the salon opens is precisely how a booking that looked fine gets refused at the gate.\n5. Ask `appointments.availability.slots` for the real free slots on that date for that duration. If they named an hour, confirm THAT hour with `appointments.availability.check`, passing the professional you settled on. If `check` refuses it, do not slide to a different hour on their behalf: take its reason at face value \u2014 `outside_schedule` means the salon is shut then, `held` means another request has it set aside for a few minutes \u2014 and offer them the free slots around it instead.\n6. Use `staff.members.list` and `staff.schedules.list_for_member` to pick a professional who actually works at that hour, and confirm the slot for that person by passing their `staff_id`. Choosing WHO is yours to make; choosing WHEN is not.\n7. If the hour they asked for is not free, or they never named one, book NOTHING. Reply with two or three of the real free slots \u2014 day, hour and professional by name \u2014 and ask them to answer with the service, the day and the hour, spelling out an example: \xABcut, tomorrow at 10:30\xBB. Their next message is a fresh turn that starts from nothing, so it has to carry the service too \u2014 an answer of \xAB10:30\xBB on its own reaches you with no idea what it is for. If nothing at all is free that day, say so and offer the nearest day that has room.\n8. The customer is already resolved: their id is `{{steps.resolve_customer.id}}`.\n9. Book it with `appointments.appointments.create`: the customer, the service, the professional, the start you confirmed and `duration_minutes`.\n\nAbout the duration, this matters: if you ESTIMATED it instead of reading it from the catalogue, say so in `internal_notes`, in words and with the number \u2014 for example \"Duration estimated by the assistant: 90 min; the catalogue declares none for this service.\" Nobody approves this booking, so `internal_notes` is where the salon finds out afterwards that the length was a guess and can fix it before the day comes. It is for staff only: the customer never reads it.\n\nPut in `notes` a one-line summary of what the customer asked for, in their own words.\n\nAsking what is free changes nothing. `appointments.appointments.create` is the one call that puts a real appointment in the salon's diary, and it does it immediately: there is no tray, no review, and no way back other than cancelling it.\n\n# CANCELLING\n\n1. The customer is already resolved: their id is `{{steps.resolve_customer.id}}`, and `{{steps.resolve_customer.found}}` says whether there is a record at all. No record means no appointment: tell them there is nothing booked under that number and stop.\n2. List what they have with `appointments.appointments.list_for_customer`. It answers newest first and it includes the past and the already-cancelled ones, so take the SOONEST one still to come whose `status` is `pending` or `confirmed`. Anything `cancelled`, `completed` or `no_show` is history \u2014 it is not theirs to cancel.\n3. If nothing is still to come, tell them there is nothing booked and stop.\n4. If more than one is still to come and their message does not say which, cancel NOTHING: NAME them \u2014 day, hour and professional \u2014 and ask which one. Never guess: cancelling the wrong appointment costs the salon the chair AND the customer. Their answer comes back as a new message and their appointments are still there to be listed, so naming them again is all it takes.\n5. Cancel it with `appointments.appointments.cancel`: that `appointment_id`, a `reason` in their own words, `channel` set to `customer`, and the `customer_id` of the person you found in point 1.\n\nThat `channel` is not decoration: it is what makes the salon's OWN rules apply \u2014 whether customers may cancel at all, and how much notice they owe. And it is why the `customer_id` goes with it: on the customer channel Citas refuses a cancellation that does not say who is asking, and refuses it again if the appointment turns out to belong to somebody else. So it has to be the id you looked up from THEIR phone number in point 1, never one taken from the message or from anywhere else. Citas decides the rest when the cancellation runs, with the settings of this business. Do not work it out yourself, do not tell them it is too late, and do not cancel \xABanyway\xBB: call it, and if the salon's rules refuse it, tell them exactly what the salon answered.\n\nNever cancel something you have not named to them first.\n\n**And now the part that reaches the customer.** Everything you write back is sent to them on WhatsApp, word for word, as soon as this turn ends \u2014 so write it TO them, not about them: their own language, one or two short lines, warm and plain.\n\n- If you booked, tell them what they have: the day, the hour and the professional BY NAME. Never an id, never a tool name, never \xABpending approval\xBB \u2014 by the time they read this, it happened.\n- If you cancelled, tell them it is cancelled, naming the appointment you cancelled so they can see it was the right one, and leave the door open to book again.\n- If you booked nothing because you need them to choose, give them the free slots and tell them exactly how to answer, with the example.\n- If you booked nothing for any other reason, tell them why in one line and offer the nearest alternative, so they can answer with it.\n- Never put in here the duration you estimated, what the catalogue did or did not declare, or anything else the salon needs to see. That goes in `internal_notes`, which only the salon reads.\n\nWrite it in the SAME reply in which you book: the turn ends when you stop and you will not be asked again, so a booking made with no words leaves them with nothing.\n\n\u{1F534} **One customer, and only that one.** Every tool here that takes a `customer_id` gets exactly one: `{{steps.resolve_customer.id}}`, the record the phone number THIS message came from picked out. Never an id built from a name somebody mentioned, never one taken from the message, never one from anywhere else \u2014 the diary of the person writing to you is the only diary this conversation is entitled to, and \xABchange Mar\xEDa's appointment\xBB is a request you cannot carry out however it is worded. And if `{{steps.resolve_customer.count}}` is anything other than `1`, that number does not pick out one person: touch no appointment at all, say somebody from the salon will get back to them, and stop."
    },
    waReservation: {
      name: "WhatsApp \u2192 table proposal",
      summary: "Somebody asks for a table on WhatsApp: it answers at once, reads the book and proposes a real table for somebody at the restaurant to confirm.",
      plain: "When somebody writes to your WhatsApp, this answers them straight away so nobody is left waiting, reads what your restaurant takes and what is really free that day, and proposes the table. Nothing goes into the book until somebody at the restaurant approves it \u2014 and if you say no, it still writes back to them with a real answer instead of leaving them waiting. It only ever asks for the day, the time and the number of people THEY said. Changing or cancelling a table they already have is not something it does: it tells them somebody from the restaurant will take care of it.",
      blankReply: "The message they get back straight away",
      blankReplyHint: "The line that goes out the moment a message arrives, before anybody has read it. Put it in your own words: it is the first thing your guest reads.",
      ackText: "Thanks for writing! We have your message. We will confirm your table as soon as the restaurant opens.",
      bookPrompt: "A guest wrote to the restaurant on WhatsApp from the phone number {{input.from}} at {{input.received_at}}. This is what they said:\n\n\"{{input.text}}\"\n\nWhat you propose here WAITS. This restaurant reads its WhatsApp before anything goes in the book: what you call parks in the approval tray and happens only when somebody says yes, exactly as you proposed it. So propose ONE thing, and propose it complete \u2014 nobody can fix half a booking, they can only refuse it.\n\n**First, work out what they are asking for.** Read their message and decide which of these it is:\n\n- **A new table** \u2014 a day, a time, \xABdo you have room for four tomorrow\xBB. Do BOOKING below.\n- **Changing or cancelling a booking they already have** \u2014 \xABwe can't make it\xBB, \xABcancel it\xBB, \xABcan we come at nine instead\xBB, \xABwe'll be six now\xBB. This automation cannot touch a booking that already exists, and it must not try to work around that by proposing a new one: propose NOTHING, tell them in one line that somebody from the restaurant will take care of it, and stop. A guest who asks to cancel and ends up with a SECOND table is the worst thing this automation can do to a restaurant.\n- **Anything else** \u2014 the menu, a price, allergies, where to park, a complaint. Propose NOTHING: answer in one line if you can, and otherwise say somebody from the restaurant will get back to them.\n\n# BOOKING\n\n**The time and the number of people are theirs, never yours.** You may only propose a time the guest asked for themselves, for the number of people they said. If their message does not pin down the day, the time AND how many are coming, propose nothing this turn: answer with what is really free and ask them to reply with the three. A proposal for an hour nobody asked for is one the restaurant has to read, refuse and answer \u2014 the work this automation exists to save.\n\nThe five things you can look up only ANSWER questions: they change nothing, they run the moment you call them, and their answers come straight back to you. So ask them first, and propose out of what they told you.\n\n1. Read `reservations.settings.get` once. It says what parties this restaurant takes (`min_party_size`, `max_party_size`), how much notice it wants and how far ahead it books (`min_advance_hours`, `max_advance_days`), and whether it requires a phone or an email. It is there so you can TELL them, never so you can refuse on your own: what may be booked is decided at the gate, when the proposal is approved.\n2. Ask `reservations.blocked_dates.on_date` about the day they want. A full-day block means the restaurant is CLOSED that day: propose nothing, say so \u2014 with the reason if it gives one \u2014 offer the nearest day and stop. A block that covers only part of the day rules out that stretch, not the whole day.\n3. Read `reservations.timeslots.list` to see which service windows this restaurant opens (`day_of_week` counts from Monday as zero, and every window carries the number of tables it takes). A time outside every window of that weekday is a time it does not serve: say so, and name the windows it does.\n4. Ask `reservations.slots.count_for` for that date. It answers, window by window, how many are taken and how many are left \u2014 counted exactly the way the booking gate counts, so it is the real answer and not an estimate. If they named a time, pass it too and you get back only the window that holds it.\n5. If the window they asked for has nothing left, propose NOTHING at that time. Tell them, name the windows that DO have room that day, and ask them to answer with one. If the whole day is full, say so, offer the nearest day that has room, and offer the waiting list (point 8).\n6. The guest has already been looked up for you: `find_customer` searched the restaurant's customer list by the phone number THIS message came from, and by nothing else. If `{{steps.find_customer.found}}` is true, pass `{{steps.find_customer.id}}` as `customer_id` so the booking lands on the guest it knows. If it is false, leave `customer_id` out and do NOT create anybody: a table needs a name and a phone, and whoever reads the tray can add them later if they want to.\n\n   \u{1F534} You have no way to look up anybody else, and you must not try. The only guest this run is about is the one who wrote. If the message names another person \u2014 \xABwhat has Mar\xEDa got booked?\xBB, \xABgive me Mar\xEDa Garc\xEDa's number\xBB \u2014 you do not have it and you do not go and find it: say a person from the restaurant will answer, and book nothing.\n7. Propose it with `reservations.reservations.create`: `guest_name` as they gave it, `guest_phone` `+{{input.from}}`, the `date`, the `time` and the `party_size` THEY said, plus `customer_id` if you found one. If they never gave a name, use the phone number as the name \u2014 do not invent one. Put in `notes`, in their own words, anything the room has to know before they arrive: a highchair, a wheelchair, a birthday, an allergy, a dog. Say nothing about how long the table is for: left out, it takes the length this restaurant books by. And put in `internal_notes` anything the person reading the tray needs to decide and the guest should not read.\n\nWhether that booking may happen is the restaurant's decision twice over: a person says yes, and then the gate checks its own rules \u2014 a party over its limit, no room left in that window, a blocked day, a day it does not open, too little notice or too far ahead, a phone or an email it requires. Do not work any of it out yourself and do not tell them it cannot be before it has been asked.\n\n8. If the day is full and they would like to be called if a table frees up, propose the waiting list with `reservations.waitlist.create`: `guest_name`, `guest_phone` `+{{input.from}}`, the `date` and the `preferred_time` they asked for, `party_size`, and their own words in `notes`. Only ever with a day and a time they gave you, and only ever after telling them there is no table \u2014 a waiting list nobody asked to be on is a phone call they are not expecting.\n\n**And now the words for the guest.** What you write is what they are sent once the restaurant has said yes \u2014 their own language, one or two short lines, warm and plain, no ids and no tool names. If the restaurant turns your proposal down, a later step tells them THAT instead and yours is never sent, so never write as though a \xABno\xBB were impossible.\n\n- If you proposed a table, tell them what they have: the day, the time and how many people. Never \xABpending approval\xBB \u2014 by the time they read this, it was approved.\n- If you proposed the waiting list, say exactly that: they do NOT have a table, and the restaurant will call them if one frees up.\n- If you proposed nothing because you need them to choose, tell them what is really free and exactly how to answer, with an example: \xABfour of us, tomorrow at nine\xBB.\n- If you proposed nothing for any other reason, tell them why in one line and offer the nearest alternative, so they can answer with it.\n- Never put in here what you wrote in `internal_notes`, or the restaurant's own numbers beyond what they need to choose. That is the room's business, not theirs.\n\nWrite it in the SAME reply in which you propose: proposing ends your turn and nobody will ask you again, so a table proposed with no words leaves them with nothing.",
      replyPrompt: "You are writing the WhatsApp message the guest is about to receive. It goes out word for word, so it has to read as if the restaurant wrote it: their own language, warm and plain, no ids, no tool names, and no mention of a tray, an approval, or anybody having had to decide.\n\nThis is how the step before you ended, and it is everything you know:\n\n- Outcome: {{steps.book_table.status}}\n- What that step wrote for them: {{steps.book_table.text}}\n- What the restaurant noted while deciding: {{steps.book_table.comment}}\n\n**If the outcome is empty or `approved`**, nothing was refused: either the restaurant took the booking as it was proposed, or nothing was ever proposed. Send back what that step wrote for them, WORD FOR WORD. Do not improve it, do not shorten it, do not add to it \u2014 the day, the time and how many people are in there and only there.\n\n**If the outcome is `rejected`**, the restaurant has looked at that table and cannot take it. What that step wrote must NEVER reach them: it describes a booking they do not have. Write them a new message instead, in one or two short lines, and it has two parts \u2014 both of them required:\n\n1. that the table they asked for cannot be, plainly, without blame and without excuses;\n2. WHAT THEY DO NOW \u2014 that they can answer right here with another day, or just a time of day that suits them, and the restaurant will look again. A \xABno\xBB with nothing after it is where they stop writing, and this automation exists so that they do not.\n\nWhatever the outcome:\n\n- Never tell them they have a table unless the step before you said so AND nothing was refused.\n- Never invent a day, a time, a number of people or a price. If you were not told one, do not name one.\n- The restaurant's note is written for the restaurant, not for them. Use it to understand why, never send it as it is: it may name a table, a shift, or a reason that is none of their business.\n- Answer in the language they wrote in."
    },
    waReservationUnattended: {
      name: "WhatsApp \u2192 table booked, no review",
      summary: "Somebody asks for a table on WhatsApp and it books it there and then, on its own. Nobody at the restaurant confirms anything: the table is in the book before you read the message.",
      plain: "When somebody writes to your WhatsApp, this answers them straight away so nobody is left waiting, reads your book and BOOKS the table itself \u2014 no approval, no tray, nothing waiting for you. It never chooses the hour or how many people are coming: if the message does not say the day, the time AND how many, it sends back what is really free and asks. If the day is full it offers the waiting list. Then it writes to tell them what they have. Changing or cancelling a table they already have is not something it does: it tells them somebody from the restaurant will take care of it. Use it when there is nobody to watch WhatsApp; if you would rather say yes to each one first, install \xABWhatsApp \u2192 table proposal\xBB instead \u2014 do not install both, or every message gets two tables.",
      blankReply: "The message they get back straight away",
      blankReplyHint: "The line that goes out the moment a message arrives, before the book has even been read. Put it in your own words: it is the first thing they hear from you. Do not promise a person will reply \u2014 with this automation, nobody does.",
      ackText: "Thanks for writing! Let me look at the book and I will come straight back to you.",
      bookPrompt: "A guest wrote to the restaurant on WhatsApp from the phone number {{input.from}} at {{input.received_at}}. This is what they said:\n\n\"{{input.text}}\"\n\n**Everything you do here HAPPENS.** This restaurant runs its WhatsApp unattended: there is no approval tray, and nobody reads your work before the guest does. The moment you call `reservations.reservations.create` the table is in the book, and what you write back is sent to them as it is.\n\n**First, work out what they are asking for.** Read their message and decide which of these it is:\n\n- **A new table** \u2014 a day, a time, \xABdo you have room for four tomorrow\xBB. Do BOOKING below.\n- **Changing or cancelling a booking they already have** \u2014 \xABwe can't make it\xBB, \xABcancel it\xBB, \xABcan we come at nine instead\xBB, \xABwe'll be six now\xBB. This automation cannot touch a booking that already exists, and it must not try to work around that by making a new one: book NOTHING, tell them in one line that somebody from the restaurant will take care of it as soon as they read the message, and stop. A guest who asks to cancel and ends up with a SECOND table is the worst thing this automation can do to a restaurant.\n- **Anything else** \u2014 the menu, a price, allergies, where to park, a complaint. Book NOTHING: answer in one line if you can, and otherwise say somebody from the restaurant will get back to them.\n\n# BOOKING\n\n\u{1F534} **You never choose the hour or how many people are coming. They do.** You may only book a time the guest asked for themselves, for the number of people they said. If their message does not pin down the day, the time AND how many are coming, you book nothing this turn: you answer with what is really free and ask them to reply with the three. That is not politeness, it is the design \u2014 with nobody at the restaurant to catch it, a bot that picks the hour seats people while the kitchen is shut, and a bot that guesses the party size seats four at a table for two. Both are found out at the door, in front of the other guests.\n\nThe five things you can look up only ANSWER questions: they change nothing, they run the moment you call them, and their answers come straight back to you. So ask them first, and act on what they told you.\n\n1. Read `reservations.settings.get` once. It says what parties this restaurant takes (`min_party_size`, `max_party_size`), how much notice it wants and how far ahead it books (`min_advance_hours`, `max_advance_days`), and whether it requires a phone or an email. It is there so you can TELL them, never so you can refuse on your own: what may be booked is decided when you book it, by the restaurant's own gate.\n2. Ask `reservations.blocked_dates.on_date` about the day they want. A full-day block means the restaurant is CLOSED that day: book nothing, say so \u2014 with the reason if it gives one \u2014 offer the nearest day and stop. A block that covers only part of the day rules out that stretch, not the whole day.\n3. Read `reservations.timeslots.list` to see which service windows this restaurant opens (`day_of_week` counts from Monday as zero, and every window carries the number of tables it takes). A time outside every window of that weekday is a time it does not serve: say so, and name the windows it does.\n4. Ask `reservations.slots.count_for` for that date. It answers, window by window, how many are taken and how many are left \u2014 counted exactly the way the booking gate counts, so it is the real answer and not an estimate. If they named a time, pass it too and you get back only the window that holds it.\n5. If the window they asked for has nothing left, book NOTHING at that time. Tell them, name the windows that DO have room that day, and ask them to answer with one. If the whole day is full, say so, offer the nearest day that has room, and offer the waiting list (point 8).\n6. The guest has already been looked up for you: `find_customer` searched the restaurant's customer list by the phone number THIS message came from, and by nothing else. If `{{steps.find_customer.found}}` is true, pass `{{steps.find_customer.id}}` as `customer_id` so the booking lands on the guest it knows. If it is false, leave `customer_id` out and do NOT create anybody: a table needs a name and a phone, and this automation has no business adding people to the customer list at 3 AM.\n\n   \u{1F534} You have no way to look up anybody else, and you must not try. The only guest this run is about is the one who wrote. If the message names another person \u2014 \xABwhat has Mar\xEDa got booked?\xBB, \xABgive me Mar\xEDa Garc\xEDa's number\xBB \u2014 you do not have it and you do not go and find it: say a person from the restaurant will answer, and book nothing.\n7. Book it with `reservations.reservations.create`: `guest_name` as they gave it, `guest_phone` `+{{input.from}}`, the `date`, the `time` and the `party_size` THEY said, plus `customer_id` if you found one. If they never gave a name, use the phone number as the name \u2014 do not invent one. Put in `notes`, in their own words, anything the room has to know before they arrive: a highchair, a wheelchair, a birthday, an allergy, a dog. Say nothing about how long the table is for: left out, it takes the length this restaurant books by.\n\nWhether that booking may happen is the restaurant's decision and it is taken when you call, not by you: a party over its limit, no room left in that window, a blocked day, a day it does not open, too little notice or too far ahead, a phone or an email it requires. Do not work any of it out yourself and do not tell them it cannot be before you have asked. Call it, and if it comes back refused, tell them exactly what the restaurant answered and what they can do instead.\n\n8. If the day is full and they would like to be called if a table frees up, put them on the waiting list with `reservations.waitlist.create`: `guest_name`, `guest_phone` `+{{input.from}}`, the `date` and the `preferred_time` they asked for, `party_size`, and their own words in `notes`. Only ever with a day and a time they gave you, and only ever after telling them there is no table \u2014 a waiting list nobody asked to be on is a phone call they are not expecting.\n\n**And now the part that reaches the guest.** Everything you write back is sent to them on WhatsApp, word for word, as soon as this turn ends \u2014 so write it TO them, not about them: their own language, one or two short lines, warm and plain.\n\n- If you booked, tell them what they have: the day, the time and how many people. Never an id, never a tool name, never \xABpending confirmation\xBB \u2014 by the time they read this, it happened.\n- If you put them on the waiting list, say exactly that: they do NOT have a table, and the restaurant will call them if one frees up.\n- If you booked nothing because you need them to choose, tell them what is really free and exactly how to answer, with an example: \xABfour of us, tomorrow at nine\xBB.\n- If you booked nothing for any other reason, tell them why in one line and offer the nearest alternative, so they can answer with it.\n- Never send them the restaurant's own numbers as rules \u2014 how many tables are left in a window, or what the settings say \u2014 beyond what they need to choose. That is the room's business, not theirs.\n\nWrite it in the SAME reply in which you book: the turn ends when you stop and nobody will ask you again, so a table booked with no words leaves them with nothing."
    }
  },
  guide: {
    title: "How automations work",
    whatTitle: "What an automation is",
    whatBody: "It is a rule you leave written down: when something happens in your business, the hub does something about it \u2014 on its own, every time, without anybody having to remember.",
    whatExample: "In a salon: the moment somebody is marked as not having turned up, a job appears on your list telling you to ring them and offer another time. Nobody has to notice. It is already there.",
    whatCan: "It is not only for your own team either: an automation can send your customer a message, ask the assistant to write something, or call another service you use. Those steps are set up on the step itself, inside the automation, like every other one.",
    firstTitle: "Your first automation, step by step",
    firstBody: "The quickest way in is one of the ready-made ones on the first screen.",
    firstPick: "On the Automations screen, pick one from the gallery. Read the sentence underneath: that is exactly what it will do.",
    firstUse: "Press \xABUse this one\xBB. It becomes yours, and it is created switched off.",
    firstFill: "Fill in what it asked you to decide \u2014 an amount, a time, how long to wait. It always arrives with a sensible guess in place.",
    firstAllow: "Go to Permissions and allow what it needs. Until you do, it does nothing at all.",
    firstTest: "Press \xABTry it\xBB. It walks the automation against something that really happened in your business and shows you what it WOULD do \u2014 without sending, charging or writing anything down.",
    firstEnable: "Now turn it on with the switch at the top. From that moment it is watching, day and night.",
    permissionsTitle: "Permissions: why you have to say yes",
    permissionsBody: "An automation works while you are not looking, so it never borrows your own permissions. It can only do the exact things you allowed it, one by one \u2014 that is what stops it from ever doing more than you meant.",
    permissionsWhere: "You allow them inside the automation itself: open it and go to the Permissions tab. Everything it needs is listed there, with one button that allows the lot.",
    permissionsNothing: "An automation you never allowed anything is not broken and it is not slow: it simply does nothing, and it will not complain. If yours has never done a thing, look here first.",
    historyTitle: "How to tell it worked",
    historyBody: "Open the automation and go to History. Every time it woke up there is a line with the day and the hour, and underneath it, in words, what it did.",
    historyGuard: "\xABThe condition was not met, so it stopped here\xBB is not a fault. That is the automation working: you told it to carry on only in certain cases, and this was not one of them.",
    limitsTitle: "What it cannot do yet",
    limitsBranches: "There are no forks. An automation is one line of steps from top to bottom, and that is on purpose: if a condition is not met it stops there \u2014 it does not take a second route. Two different outcomes means two automations.",
    limitsDates: "It cannot count backwards from a date: \xABthe day before the appointment\xBB is not something it can work out yet. It can wait a while after something happened, which is not the same thing.",
    limitsAssistant: "And the assistant will not write the message step for you. Ask it for \xABtell them by message\xBB and it leaves the closest thing it is allowed to propose \u2014 the job on your list \u2014 and says so in its own notes. Sending a message costs money every time, so that one is yours to add and yours to turn on.",
    shotGuard: "the ticket comes to more than 100,00 \u20AC",
    shotAction: "Write a note in the customer's card",
    shotGrant: "Write a note in the customer's card",
    shotGrantDone: "Add a job to your list",
    shotWhen: "Yesterday, 19:04"
  },
  draft: {
    section: "Proposed by the assistant",
    sectionHint: "The assistant wrote these after you asked it for an automation. Nothing runs until you check it and turn it on.",
    badge: "Draft",
    review: "Review",
    dismiss: "Discard",
    dismissed: "Discarded.",
    notesTitle: "What the assistant could not work out",
    gapsTitle: "Check these before turning it on",
    unconfirmed: "This is a draft the assistant wrote. It is off, it has no permissions, and nothing happens until you turn it on.",
    createPaused: "Create it, paused",
    created: "Created and paused. Give it permissions, then turn it on.",
    askHint: "Ask the assistant for an automation \u2014 for example: \u201Cwhen someone books online, remind me to call them\u201D.",
    errUnreadable: "The assistant did not write a readable automation for \u201C{name}\u201D. Discard it and ask again.",
    errVersion: "It was written for automation format {got}; this hub uses {want}.",
    errTriggerKind: "\u201C{kind}\u201D is not a way an automation can start here.",
    errTriggerField: "A \u201C{kind}\u201D start needs its {field} and it is missing.",
    errNoSteps: "It has no steps, so there is nothing for it to do.",
    errStepId: "A step has no name of its own, and later steps read each other by that name.",
    errDuplicateId: "Two steps are both called \u201C{id}\u201D.",
    errStepKind: "Step \u201C{id}\u201D is a \u201C{kind}\u201D, which this hub does not run.",
    errOperator: "Step \u201C{id}\u201D compares with \u201C{operator}\u201D, which is not one of the comparisons this hub knows.",
    errToolsShape: "Step \u201C{id}\u201D lists what the assistant may use as a plain list; this hub expects queries and commands named separately.",
    gapEventMissing: "Say what has to happen for this to start.",
    gapEventUnknown: "This hub never sends \u201C{event}\u201D. Pick something that happens here.",
    gapNotEditable: "This is a \u201C{kind}\u201D step: the assistant is not allowed to propose one. Check it before you turn this on.",
    gapCommandMissing: "Say what this step should do.",
    gapParamEmpty: "\u201C{name}\u201D is empty.",
    gapGuardEmpty: "This condition compares nothing, so it lets everything through.",
    gapGuardField: "Pick the field this condition looks at.",
    gapGuardValue: "Say what \u201C{field}\u201D has to be."
  }
};

// ui/components/erp-flows-app/erp-flows-app.ts
var CATALOG = { es: es_default, en: en_default };
var ErpFlowsApp = class extends i3 {
  constructor() {
    super(...arguments);
    this.client = null;
    this.gate = "loading";
    this.flows = [];
    this.editing = null;
    this.isNew = false;
    this.editorTab = "editor";
    this.guideOpen = false;
    this.approvalCount = 0;
    this.deadCount = 0;
    this.deadDenied = false;
    this.deadShown = false;
    this.error = "";
    this.coreVersion = "";
    this.tray = [];
    this.view = EMPTY_VIEW;
    this.chosen = [];
    this.confirmDelete = "";
    this.notice = "";
    this.reviewing = null;
    this.draftReview = null;
    this.repairing = "";
    /** The contract THIS hub serves, read from `GET /api/hub/flows/schema` — never bundled. */
    this.facts = schemaFacts(void 0);
    this.onLocaleChange = () => this.requestUpdate();
    /** The module catalogue, resolved against the shell's active language (ADR-0055). */
    this.t = (key2, params) => {
      const client = this.client;
      if (typeof client?.t === "function") return client.t(CATALOG, key2, params);
      const global = globalThis.erplora;
      if (typeof global?.t === "function") {
        return global.t(CATALOG, key2, params);
      }
      return key2;
    };
  }
  static {
    this.styles = i`
    :host {
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      font-family: var(--ok-font, var(--ion-font-family, system-ui), sans-serif);
      color: var(--ok-text, var(--ion-text-color, #1c1b18));
    }
    .head {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
    }
    .head .grow {
      flex: 1 1 auto;
    }
    .body {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 0 0.75rem 1rem;
    }
    .list {
      max-width: 44rem;
      margin: 0 auto 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    h3.section {
      margin: 0;
      font-size: 0.78rem;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--ok-muted, #6b6a63);
      font-weight: 600;
    }
    .flow {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, var(--ion-border-color, #d7d5cc));
      border-radius: var(--ok-radius, 14px);
      overflow: hidden;
    }
    .flow > button.open {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
      text-align: left;
      background: transparent;
      border: 0;
      color: inherit;
      font: inherit;
      cursor: pointer;
      padding: 0.7rem 0.75rem;
      /* A finger on the counter tablet, not a mouse. */
      min-height: 3.25rem;
    }
    .flow .name {
      font-weight: 600;
      overflow-wrap: anywhere;
    }
    .flow .when {
      font-size: 0.85rem;
      color: var(--ok-muted, #6b6a63);
      overflow-wrap: anywhere;
    }
    .flow .side {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding-right: 0.5rem;
    }
    .icon-btn {
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
      min-width: 2.75rem;
      min-height: 2.75rem;
      border-radius: var(--ok-radius-sm, 10px);
    }
    .icon-btn:hover {
      background: var(--ok-hover, rgba(0, 0, 0, 0.06));
    }
    /* The console (flows#19). One column that wraps: the search box takes the width it can get and
       the three narrow selects sit under it on a phone rather than being squeezed into a strip
       nobody can read. */
    .toolbar {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .toolbar .search {
      width: 100%;
      box-sizing: border-box;
      font: inherit;
      color: inherit;
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      padding: 0 0.7rem;
      /* A finger on the counter tablet, not a mouse. */
      min-height: 2.75rem;
    }
    .toolbar .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem;
    }
    .toolbar select {
      font: inherit;
      font-size: 0.9rem;
      color: inherit;
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0 0.6rem;
      min-height: 2.5rem;
    }
    .toolbar .filters .hint {
      margin-left: auto;
    }
    .selection {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.4rem;
      padding: 0.4rem 0.6rem;
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.03));
    }
    .selection .grow {
      flex: 1 1 auto;
      font-size: 0.9rem;
      font-weight: 600;
    }
    .flow {
      flex-wrap: wrap;
    }
    .flow > input.pick {
      flex: 0 0 auto;
      margin: 0 0 0 0.6rem;
      width: 1.15rem;
      height: 1.15rem;
    }
    /* Full width so it pushes the row apart instead of squeezing in beside the switch — this is a
       question, and a question that has to be hunted for is one people answer without reading. */
    .flow > .confirm {
      flex: 1 0 100%;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.4rem;
      padding: 0.5rem 0.75rem;
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.03));
    }
    /* The question takes its OWN line, at every width. Sharing the line with the two buttons
       pushed «Yes, delete it» off the right edge of the card at 390px — the one control that must
       be read before it is pressed, half off screen. */
    .flow > .confirm .grow {
      flex: 1 1 100%;
      font-size: 0.9rem;
    }
    .flow > .confirm button {
      font: inherit;
      font-size: 0.9rem;
      cursor: pointer;
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0 1rem;
      min-height: 2.5rem;
    }
    .flow > .confirm button.danger {
      border: 1px solid transparent;
      background: var(--ok-danger, var(--ion-color-danger, #c0392b));
      color: var(--ok-danger-contrast, var(--ion-color-danger-contrast, #fff));
      font-weight: 600;
    }
    .flow > .confirm button.quiet {
      border: 1px solid var(--ok-border, #d7d5cc);
      background: transparent;
      color: inherit;
    }
    /* Its own line under the row, like the delete question: what it says has to be READ, and
       sharing the line with the name and the switch is how it gets skipped. */
    .flow > .checkup {
      flex: 1 0 100%;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-top: 1px solid var(--ok-border-soft, rgba(0, 0, 0, 0.08));
      background: var(--ok-warning-soft, rgba(214, 158, 46, 0.12));
    }
    .flow > .checkup .said {
      flex: 1 1 14rem;
      min-width: 0;
      font-size: 0.9rem;
    }
    .flow > .checkup .said strong {
      display: block;
    }
    .flow > .checkup button {
      font: inherit;
      font-size: 0.9rem;
      cursor: pointer;
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0 1rem;
      min-height: 2.5rem;
      border: 1px solid transparent;
      background: var(--ok-primary, var(--ion-color-primary, #3880ff));
      color: var(--ok-primary-contrast, var(--ion-color-primary-contrast, #fff));
      font-weight: 600;
    }
    .flow > .checkup button[disabled] {
      opacity: 0.6;
      cursor: default;
    }
    .empty-filter {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.75rem 0;
    }
    .gate {
      max-width: 34rem;
      margin: 2rem auto;
    }
    .hint {
      font-size: 0.85rem;
      color: var(--ok-muted, #6b6a63);
    }
    /* A proposal's row is NOT a button: the whole card is not tappable, because the two things it
       can do — review, discard — are decisions, and «I tapped it by accident» must not be one of
       them. Same shape as a flow row, without the affordance. */
    .flow > .draft-main {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.15rem;
      padding: 0.7rem 0.75rem;
      min-height: 3.25rem;
      justify-content: center;
    }
  `;
  }
  async connectedCallback() {
    super.connectedCallback();
    window.addEventListener("erplora:locale-changed", this.onLocaleChange);
    await this.open();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener("erplora:locale-changed", this.onLocaleChange);
  }
  /** Resolves the door, checks the contract, loads the list. Every failure has its own screen. */
  async open() {
    const client = resolveClient(this, globalThis.erplora);
    if (!client) {
      this.gate = "unsupported";
      return;
    }
    this.client = client;
    try {
      const schema = await client.flows.schema();
      this.coreVersion = schema?.core_version ?? "";
      this.facts = schemaFacts(schema?.schema);
      if (schema && schema.schema_version !== SCHEMA_VERSION) {
        this.gate = "unsupported";
        return;
      }
    } catch (e4) {
      if (this.setGateFromError(e4)) return;
    }
    await this.reload();
  }
  /** Turns a refusal into the screen that names it. Returns `true` when it handled the error. */
  setGateFromError(e4) {
    const code = errorCode(e4);
    if (code === CAPABILITY_DENIED) {
      this.gate = "denied";
      return true;
    }
    if (code === "forbidden" || code === "unauthorized") {
      this.gate = "not_admin";
      return true;
    }
    this.error = e4?.message || this.t("ui.errGeneric");
    this.gate = "error";
    return true;
  }
  async reload() {
    if (!this.client) return;
    try {
      const flows = await this.client.flows.list();
      this.flows = Array.isArray(flows) ? flows : [];
      this.gate = "ready";
    } catch (e4) {
      this.setGateFromError(e4);
      return;
    }
    await this.countApprovals();
    await this.countDead();
    await this.loadTray();
  }
  /**
   * **Is anything stuck?** — asked with the CHEAP count (`GET …/dead/count`), never by pulling the
   * queue down with its payloads just to decide whether a heading appears.
   *
   * The tray is mounted only when the answer is not zero, for the same reason the approvals one is:
   * a box headed «needs your attention» that is empty every day is furniture, and furniture is what
   * people stop seeing — which is precisely how a lost invoice stays lost.
   *
   * Two exceptions to «zero means silence», and both are about not hiding something the owner can
   * fix or is owed:
   *
   * - `capability_denied` — the queue exists and THIS module has not been allowed to read it. That
   *   is a checkbox in Settings → Permissions, so it gets a line on screen; swallowing it would be
   *   the module quietly concealing its own missing permission.
   * - a hub with no such surface at all (older than hub#953) — deliberately silent. There is
   *   nothing the owner can do, and this module is not published to hubs that old anyway.
   */
  async countDead() {
    const count = this.client?.events?.deadCount;
    if (typeof count !== "function") {
      this.deadCount = 0;
      this.deadDenied = false;
      return;
    }
    try {
      const answer = await count.call(this.client?.events);
      this.deadCount = Number(answer?.count) || 0;
      this.deadDenied = false;
      if (this.deadCount) this.deadShown = true;
    } catch (e4) {
      this.deadCount = 0;
      this.deadDenied = errorCode(e4) === CAPABILITY_DENIED;
      if (this.deadDenied) this.deadShown = true;
    }
  }
  /**
   * How many proposals are waiting on a person.
   *
   * Asked here, and not left to the tray, because the tray is only MOUNTED when the answer is not
   * zero: an empty box headed «waiting for you» is a permanent fixture on a screen whose job is to
   * show automations, and a tray behind a tab nobody opens is the same as no tray at all — which
   * is exactly how a `policy: manual` proposal reaches its 72-hour expiry unseen.
   */
  async countApprovals() {
    if (!this.client?.flows.approvals) {
      this.approvalCount = 0;
      return;
    }
    try {
      const rows = await this.client.flows.approvals("pending");
      this.approvalCount = Array.isArray(rows) ? rows.length : 0;
    } catch {
      this.approvalCount = 0;
    }
  }
  // ── What the assistant proposed (flows#4) ───────────────────────────────────────────────────
  /**
   * The proposals waiting for a person, each already judged against this hub's contract.
   *
   * Every failure here is SWALLOWED on purpose, and it is worth saying why: this query is the
   * module's own, and an older published version of this very module does not declare it. A hub
   * that installed the module last month would answer `query_not_found`, and letting that reach
   * the gate would replace a working automations screen with an error page over a feature that
   * simply is not there yet. No tray is a correct screen; a broken one is not.
   */
  async loadTray() {
    const query = this.client?.query;
    if (typeof query !== "function") return;
    let rows = [];
    try {
      rows = await query.call(this.client, "flows.drafts.list") ?? [];
    } catch {
      this.tray = [];
      return;
    }
    this.tray = (Array.isArray(rows) ? rows : []).map((row) => this.judge(row));
  }
  /** A stored row becomes something the tray can render: either openable, or refused with reasons. */
  judge(row) {
    const read = readDraft(row);
    const id = String(row?.id ?? "");
    const name = typeof row?.name === "string" ? row.name : "";
    if (!read.ok) return { id, name, problems: [read.problem] };
    const problems = contractProblems(read.draft.doc, this.facts);
    return problems.length ? { id, name: read.draft.name, problems } : { id, name: read.draft.name, draft: read.draft, problems: [] };
  }
  /**
   * Opens a proposal in the SAME vertical spine everything else opens in — as an automation that
   * **does not exist yet**.
   *
   * `id: ''` is what carries that: the editor's save creates instead of updating, so up to the
   * moment the owner presses it there is no flow, no trigger and no grant. `enabled: false` is
   * the belt to that braces — if a later change ever made an unsaved draft savable by accident,
   * it would still be born paused.
   */
  async openDraft(item) {
    const draft = item.draft;
    if (!draft) return;
    this.reviewing = item;
    this.editing = {
      id: "",
      name: draft.name,
      enabled: false,
      definition: draft.doc
    };
    this.isNew = false;
    this.editorTab = "editor";
    this.draftReview = { notes: draft.notes, gaps: draftGaps(draft.doc, {}) };
    const event = draft.doc.triggers.find((t3) => t3.kind === "event")?.event ?? "";
    if (!event || !this.client) return;
    let known = true;
    try {
      await this.client.events.shape(event);
    } catch {
      known = false;
    }
    if (this.reviewing?.id !== item.id) return;
    this.draftReview = { notes: draft.notes, gaps: draftGaps(draft.doc, { [event]: known }) };
  }
  /** Records the decision on the proposal. The row survives as the record that it was made. */
  async resolveDraft(item, outcome, flowId = "") {
    this.tray = this.tray.filter((t3) => t3.id !== item.id);
    const command = this.client?.command;
    if (typeof command !== "function") return;
    try {
      await command.call(this.client, "flows.drafts.resolve", {
        id: item.id,
        outcome,
        flow_id: flowId
      });
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
    }
  }
  /**
   * The proposals, above the automations that already exist.
   *
   * The badge says «Draft» and the sentence under the heading says what that means, because the
   * one thing an owner must not have to guess is whether the thing on their screen is already
   * doing something to their business.
   */
  renderTray() {
    if (!this.tray.length) return A;
    return b2`<div class="list">
      <h3 class="section">${this.t("draft.section")}</h3>
      <span class="hint">${this.t("draft.sectionHint")}</span>
      ${this.tray.map(
      (item) => b2`<div class="flow" data-draft=${item.id}>
          <div class="draft-main">
            <span class="name">${item.name || this.t("ui.unnamed")}</span>
            ${item.problems.map(
        (p3) => b2`<span class="when">${this.t(p3.key, p3.params)}</span>`
      )}
          </div>
          <span class="side">
            <ok-status-pill tone="warning" label=${this.t("draft.badge")}></ok-status-pill>
            ${item.draft ? b2`<ion-button
                  size="small"
                  fill="outline"
                  data-act="review"
                  @click=${() => void this.openDraft(item)}
                >
                  ${this.t("draft.review")}
                </ion-button>` : A}
            <button
              type="button"
              class="icon-btn"
              data-act="dismiss"
              aria-label=${this.t("draft.dismiss")}
              @click=${() => void this.resolveDraft(item, "dismissed")}
            >
              ×
            </button>
          </span>
        </div>`
    )}
    </div>`;
  }
  /**
   * Flips the switch, sending the WHOLE flow.
   *
   * `PUT /flows/{id}` revalidates the document and re-seeds the triggers, so a partial body would
   * not be «just the switch» — it would be a rewrite of the automation.
   */
  async setEnabled(flow, enabled) {
    if (!this.client) return;
    try {
      const saved = await this.client.flows.update(flow.id, {
        name: flow.name,
        enabled,
        definition: flow.definition
      });
      this.flows = this.flows.map((f3) => f3.id === flow.id ? { ...f3, ...saved, enabled } : f3);
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
    }
  }
  /**
   * **Put the missing guards on an automation that is already running** (flows#63).
   *
   * A SURGICAL patch and not today's card in place of hers: the owner may have renamed this
   * automation and reworded every prompt in it, and replacing the document would throw that away
   * to fix two lines. Only the trigger's filter grows, so no permission has to be granted again
   * and the switch stays where she left it — an automation that came back PAUSED from a repair
   * would be a WhatsApp that goes quiet without anybody deciding it should.
   *
   * The state is written from what the hub echoed back, not from what we sent: the warning may
   * only leave the row because the save landed.
   */
  async repair(flow, problem) {
    if (!this.client || this.repairing) return;
    const definition = repairedDefinition(flow.definition, problem.id);
    if (!definition) return;
    this.repairing = flow.id;
    this.error = "";
    this.notice = "";
    try {
      const saved = await this.client.flows.update(flow.id, {
        name: flow.name,
        enabled: flow.enabled,
        definition
      });
      const stored = saved && typeof saved.definition === "object" && saved.definition ? saved.definition : definition;
      this.flows = this.flows.map((f3) => f3.id === flow.id ? { ...f3, ...saved, definition: stored } : f3);
      const left = flowProblems(stored).some((p3) => p3.id === problem.id);
      if (left) this.error = this.t("ui.checkupNotFixed");
      else this.notice = this.t("ui.checkupFixed", { name: flow.name || this.t("ui.unnamed") });
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
    } finally {
      this.repairing = "";
    }
  }
  async remove(flow) {
    if (!this.client) return;
    this.confirmDelete = "";
    try {
      await this.client.flows.remove(flow.id);
      this.flows = this.flows.filter((f3) => f3.id !== flow.id);
      this.chosen = this.chosen.filter((id) => id !== flow.id);
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
    }
  }
  // ── The list as a console (flows#19) ────────────────────────────────────────────────────────
  /** The rows on screen right now. Everything else on this screen is derived from this. */
  get shown() {
    return applyView(this.flows, this.view);
  }
  narrow(patch) {
    this.view = { ...this.view, ...patch };
    const visible = new Set(this.shown.map((f3) => f3.id));
    this.chosen = this.chosen.filter((id) => visible.has(id));
    this.confirmDelete = "";
  }
  /**
   * A copy of one automation: **paused, and holding nothing the original earned**.
   *
   * The permissions are the point. A copy that arrived with the original's grants would be a way
   * to get an automation authorised without anybody authorising it — so it comes with none, and
   * the screen SAYS so rather than leaving the owner to notice. If the document reaches outside
   * using a secret, that is named too: a credential the copy points at is a decision, and the
   * value itself is not readable by anyone, this screen included.
   */
  async duplicate(flow) {
    if (!this.client) return;
    this.notice = "";
    this.confirmDelete = "";
    try {
      const name = copyName(flow.name ?? "", this.flows.map((f3) => f3.name ?? ""), this.t);
      await this.client.flows.create(duplicateOf(flow, name));
      const secrets = secretRefs(readDoc(flow.definition));
      this.notice = secrets.length ? `${this.t("ui.copyMade")} ${this.t("ui.copySecrets", { names: secrets.join(", ") })}` : this.t("ui.copyMade");
      await this.reload();
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
    }
  }
  /**
   * Turn several on, or pause several. **Never delete, and never run.**
   *
   * Those two are the reason this is a whitelist of exactly two verbs and not a generic «apply to
   * selection»: deleting is unrecoverable and running has effects on the business, and both are
   * decisions taken a row at a time, looking at the row.
   */
  async bulk(enabled) {
    const targets = this.flows.filter((f3) => this.chosen.includes(f3.id));
    this.chosen = [];
    for (const flow of targets) await this.setEnabled(flow, enabled);
  }
  renderToolbar() {
    const total = this.flows.length;
    const shown = this.shown.length;
    return b2`<div class="toolbar">
      <input
        class="search"
        type="search"
        data-act="search"
        .value=${this.view.q}
        placeholder=${this.t("ui.listSearch")}
        aria-label=${this.t("ui.listSearch")}
        @input=${(e4) => this.narrow({ q: e4.target.value })}
      />
      <div class="filters">
        <select
          data-act="filter-state"
          aria-label=${this.t("ui.filterState")}
          .value=${this.view.state}
          @change=${(e4) => this.narrow({ state: e4.target.value })}
        >
          <option value="all">${this.t("ui.stateAll")}</option>
          <option value="active">${this.t("ui.stateActive")}</option>
          <option value="paused">${this.t("ui.statePaused")}</option>
        </select>
        <select
          data-act="filter-trigger"
          aria-label=${this.t("ui.filterTrigger")}
          .value=${this.view.trigger}
          @change=${(e4) => this.narrow({ trigger: e4.target.value })}
        >
          <option value="all">${this.t("ui.triggerAny")}</option>
          <option value="event">${this.t("ui.filterEvent")}</option>
          <option value="cron">${this.t("ui.filterCron")}</option>
          <option value="at">${this.t("ui.filterAt")}</option>
          <option value="manual">${this.t("ui.filterManual")}</option>
        </select>
        <select
          data-act="sort"
          aria-label=${this.t("ui.sortBy")}
          .value=${this.view.sort}
          @change=${(e4) => this.narrow({ sort: e4.target.value })}
        >
          <option value="updated">${this.t("ui.sortUpdated")}</option>
          <option value="name">${this.t("ui.sortName")}</option>
        </select>
        <!-- «3 of 20» rather than «3»: a short list with a filter on it looks exactly like a hub
             with three automations, and that is how somebody concludes theirs have gone. -->
        <span class="hint" data-count>${this.t("ui.listCount", { shown, total })}</span>
      </div>
    </div>`;
  }
  renderSelection() {
    if (!this.chosen.length) return A;
    return b2`<div class="selection" data-selection>
      <span class="grow">${this.t("ui.selectedCount", { count: this.chosen.length })}</span>
      <ion-button size="small" fill="outline" data-act="bulk-enable" @click=${() => void this.bulk(true)}>
        ${this.t("ui.bulkEnable")}
      </ion-button>
      <ion-button size="small" fill="outline" data-act="bulk-pause" @click=${() => void this.bulk(false)}>
        ${this.t("ui.bulkPause")}
      </ion-button>
      <button
        type="button"
        class="icon-btn"
        data-act="selection-clear"
        aria-label=${this.t("ui.selectionClear")}
        @click=${() => {
      this.chosen = [];
    }}
      >
        ×
      </button>
    </div>`;
  }
  renderRow(flow) {
    const confirming = this.confirmDelete === flow.id;
    return b2`<div class="flow" data-flow=${flow.id}>
      <input
        type="checkbox"
        class="pick"
        data-act="select"
        aria-label=${this.t("ui.selectOne", { name: flow.name || this.t("ui.unnamed") })}
        .checked=${this.chosen.includes(flow.id)}
        @change=${(e4) => {
      const on = e4.target.checked;
      this.chosen = on ? [...this.chosen, flow.id] : this.chosen.filter((id) => id !== flow.id);
    }}
      />
      <button
        type="button"
        class="open"
        @click=${() => {
      this.editing = flow;
      this.isNew = false;
    }}
      >
        <span class="name">${flow.name || this.t("ui.unnamed")}</span>
        <span class="when">${this.startsWhen(flow)}</span>
      </button>
      <span class="side">
        <ok-status-pill
          tone=${flow.enabled ? "success" : "neutral"}
          label=${flow.enabled ? this.t("ui.active") : this.t("ui.paused")}
        ></ok-status-pill>
        <ion-toggle
          .checked=${flow.enabled}
          @ionChange=${(e4) => void this.setEnabled(flow, !!e4.target.checked)}
        ></ion-toggle>
        <button
          type="button"
          class="icon-btn"
          data-act="duplicate"
          aria-label=${this.t("ui.duplicate")}
          title=${this.t("ui.duplicate")}
          @click=${() => void this.duplicate(flow)}
        >
          ⧉
        </button>
        <button
          type="button"
          class="icon-btn"
          data-act="delete"
          aria-label=${this.t("ui.delete")}
          @click=${() => {
      this.confirmDelete = confirming ? "" : flow.id;
    }}
        >
          ×
        </button>
      </span>
      <!-- Asking is the whole point: an automation is the only thing on this screen whose loss
           cannot be undone, and its × sits a fingertip from the switch on a counter tablet. -->
      ${confirming ? b2`<div class="confirm">
            <span class="grow"
              >${this.t("ui.deleteConfirm", { name: flow.name || this.t("ui.unnamed") })}</span
            >
            <!-- Plain buttons and not ion-buttons, for one reason that is worth writing down:
                 Ionic honours the fill only in md mode, so in ios the same markup renders the
                 destructive action as pale text next to an outlined «leave it» — the button you
                 must read before pressing, looking like the disabled one. These carry their own
                 colour out of the OutfitKit tokens and look the same in both modes. -->
            <button type="button" class="danger" data-act="delete-yes" @click=${() => void this.remove(flow)}>
              ${this.t("ui.deleteYes")}
            </button>
            <button
              type="button"
              class="quiet"
              data-act="delete-no"
              @click=${() => {
      this.confirmDelete = "";
    }}
            >
              ${this.t("ui.deleteNo")}
            </button>
          </div>` : A}
      <!-- The gallery hands out a COPY and keeps no link back to the card, so a card we fix
           reaches everybody who taps it from now on and nobody who already did. This row is the
           only place that owner can be told. It warns and offers; it never rewrites her
           automation on its own — which is what Zapier, Shopify Flow, Power Automate and n8n all
           do with a workflow somebody has already built. -->
      ${flowProblems(flow.definition).map(
      (problem) => b2`<div class="checkup" data-checkup=${problem.id}>
          <span class="said">
            <strong>${this.t(problem.titleKey)}</strong>
            ${this.t(problem.bodyKey)}
          </span>
          <!-- Disabled while ANY repair is in flight, not just this row's: the handler
               refuses to start a second save while one is running, so a button left
               pressable on another old automation answers nothing at all — no save, no
               warning, no error. The row being saved says so in its label. -->
          <button
            type="button"
            data-act="checkup-fix"
            ?disabled=${!!this.repairing}
            @click=${() => void this.repair(flow, problem)}
          >
            ${this.repairing === flow.id ? this.t("ui.saving") : this.t(problem.fixKey)}
          </button>
        </div>`
    )}
    </div>`;
  }
  /** «Cuando se reserva una cita» — never the raw event name. */
  startsWhen(flow) {
    const doc = readDoc(flow.definition);
    const trigger = doc.triggers[0] ?? { kind: "manual" };
    const entry = trigger.event ? catalogEntry(trigger.event) : void 0;
    return describeTrigger(trigger, this.t, entry ? this.t(entry.labelKey) : void 0);
  }
  renderGate() {
    const map = {
      unsupported: {
        icon: "construct-outline",
        title: "ui.unsupportedTitle",
        message: "ui.unsupportedMessage"
      },
      denied: { icon: "lock-closed-outline", title: "ui.noAccessTitle", message: "ui.noAccessMessage" },
      not_admin: {
        icon: "person-outline",
        title: "ui.notAdminTitle",
        message: "ui.notAdminMessage"
      }
    };
    const gate = map[this.gate];
    if (!gate) {
      return b2`<div class="gate">
        <ok-inline-feedback tone="danger" icon="alert-circle-outline"
          >${this.error || this.t("ui.errGeneric")}</ok-inline-feedback
        >
      </div>`;
    }
    return b2`<div class="gate">
      <ok-empty-state
        icon=${gate.icon}
        heading=${this.t(gate.title)}
        message=${this.t(gate.message)}
      ></ok-empty-state>
    </div>`;
  }
  /**
   * The automations that already exist, above the gallery. Empty is not an error state any more
   * (flows#1): a hub with nothing automated yet simply has nothing to show HERE, and the gallery
   * underneath is the answer to «and now what».
   */
  renderList() {
    if (!this.flows.length) return A;
    const rows = this.shown;
    return b2`<div class="list">
      <h3 class="section">${this.t("ui.tplYours")}</h3>
      ${this.renderToolbar()} ${this.renderSelection()}
      ${this.notice ? b2`<ok-inline-feedback tone="success" icon="copy-outline" data-notice
            >${this.notice}</ok-inline-feedback
          >` : A}
      ${rows.length ? rows.map((flow) => this.renderRow(flow)) : b2`<div class="empty-filter">
            <span class="hint">${this.t("ui.listNoMatch")}</span>
            <ion-button
              size="small"
              fill="outline"
              data-act="clear-filters"
              @click=${() => this.narrow({ q: "", state: "all", trigger: "all" })}
            >
              ${this.t("ui.listClear")}
            </ion-button>
          </div>`}
    </div>`;
  }
  startNew() {
    this.editing = null;
    this.isNew = true;
    this.editorTab = "editor";
  }
  /**
   * A template just became a flow: open it, **on the screen that makes it work**.
   *
   * A flow with no grants does nothing at all and says nothing about it. Landing the owner on the
   * step list would leave the one action they must take behind a tab they have no reason to open —
   * which is the exact place pm#134 reports people getting stuck.
   */
  onTemplateUsed(e4) {
    this.editing = e4.detail.flow;
    this.isNew = false;
    this.editorTab = e4.detail.needsGrants ? "permissions" : "editor";
    void this.reload();
  }
  /**
   * The gallery says the owner already has this card: open THAT flow (flows#60).
   *
   * Nothing is created, so nothing needs reloading — the flow being opened came out of the list
   * this screen loaded. A half-built one lands on Permissions for the same reason a brand new one
   * does: it is the only thing standing between it and working.
   */
  onOpenExisting(e4) {
    this.editing = e4.detail.flow;
    this.isNew = false;
    this.editorTab = e4.detail.needsGrants ? "permissions" : "editor";
  }
  render() {
    if (this.gate === "loading") {
      return b2`<div class="body"><span>${this.t("ui.loading")}</span></div>`;
    }
    if (this.gate !== "ready") return this.renderGate();
    if (this.editing || this.isNew) {
      return b2`<erp-flows-editor
        .client=${this.client}
        .flow=${this.editing}
        .t=${this.t}
        .tab=${this.editorTab}
        .draft=${this.draftReview}
        @flows-back=${() => {
        this.editing = null;
        this.isNew = false;
        this.editorTab = "editor";
        this.reviewing = null;
        this.draftReview = null;
        void this.reload();
      }}
        @flows-saved=${(e4) => {
        this.editing = e4.detail.flow;
        this.isNew = false;
        const reviewed = this.reviewing;
        this.reviewing = null;
        this.draftReview = null;
        if (reviewed) void this.resolveDraft(reviewed, "used", e4.detail.flow.id);
      }}
      ></erp-flows-editor>`;
    }
    if (this.guideOpen) {
      return b2`<div class="body">
        <erp-flows-guide
          .t=${this.t}
          @flows-guide-close=${() => {
        this.guideOpen = false;
      }}
        ></erp-flows-guide>
      </div>`;
    }
    return b2`
      <div class="head">
        <span class="grow"></span>
        <ion-button size="small" fill="outline" data-act="new" @click=${() => this.startNew()}>
          ${this.t("ui.newAutomation")}
        </ion-button>
      </div>
      <div class="body">
        ${this.error ? b2`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
              >${this.error}</ok-inline-feedback
            >` : A}
        ${this.approvalCount ? b2`<erp-flows-approvals
              .client=${this.client}
              .t=${this.t}
              @flows-approvals-count=${(e4) => {
      this.approvalCount = e4.detail.count;
    }}
            ></erp-flows-approvals>` : A}
        ${this.deadShown ? b2`<erp-flows-dead-letter
              .client=${this.client}
              .t=${this.t}
              @flows-dead-count=${(e4) => {
      this.deadCount = e4.detail.count;
    }}
            ></erp-flows-dead-letter>` : A}
        ${this.renderTray()} ${this.renderList()}
        <erp-flows-gallery
          .client=${this.client}
          .t=${this.t}
          @flows-template-used=${(e4) => this.onTemplateUsed(e4)}
          @flows-open-flow=${(e4) => this.onOpenExisting(e4)}
          @flows-open-guide=${() => {
      this.guideOpen = true;
    }}
        ></erp-flows-gallery>
      </div>
    `;
  }
};
__decorateClass([
  n4({ attribute: false })
], ErpFlowsApp.prototype, "client", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "gate", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "flows", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "editing", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "isNew", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "editorTab", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "guideOpen", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "approvalCount", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "deadCount", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "deadDenied", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "deadShown", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "error", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "coreVersion", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "tray", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "view", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "chosen", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "confirmDelete", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "notice", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "reviewing", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "draftReview", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "repairing", 2);
define("erp-flows-app", ErpFlowsApp);
