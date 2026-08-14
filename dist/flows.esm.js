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

// ../module-toolkit/node_modules/@lit-labs/ssr-dom-shim/lib/element-internals.js
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

// ../module-toolkit/node_modules/@lit-labs/ssr-dom-shim/lib/events.js
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

// ../module-toolkit/node_modules/@lit-labs/ssr-dom-shim/lib/css.js
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

// ../module-toolkit/node_modules/@lit-labs/ssr-dom-shim/index.js
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

// ../module-toolkit/node_modules/@lit/reactive-element/node/css-tag.js
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

// ../module-toolkit/node_modules/@lit/reactive-element/node/reactive-element.js
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

// node_modules/.pnpm/lit-html@3.3.3/node_modules/lit-html/lit-html.js
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

// node_modules/.pnpm/lit-element@4.2.2/node_modules/lit-element/lit-element.js
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

// ../module-toolkit/node_modules/@lit/reactive-element/node/decorators/property.js
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

// ../module-toolkit/node_modules/@lit/reactive-element/node/decorators/state.js
function r5(r6) {
  return n4({ ...r6, state: true, attribute: false });
}

// ../outfitkit/dist/define.js
function define(tag, ctor) {
  if (typeof customElements !== "undefined" && !customElements.get(tag)) {
    customElements.define(tag, ctor);
  }
}

// ../outfitkit/dist/shared/icons.js
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

// ../outfitkit/dist/ok-empty-state.js
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

// ../outfitkit/dist/ok-inline-feedback.js
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

// ../outfitkit/dist/ok-status-pill.js
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

// modules/flows/ui/components/erp-flows-value/erp-flows-value.ts
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

// modules/flows/ui/lib/plain-language.ts
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

// modules/flows/ui/components/erp-flows-field-picker/erp-flows-field-picker.ts
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

// modules/flows/ui/lib/flow-doc.ts
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
  notify: ["id", "kind", "channel", "to", "template", "vars"]
};
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
    out.push({ kind: g3.kind, value: g3.value });
  }
  return out;
}

// modules/flows/ui/lib/trigger-catalog.ts
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
  { event: "staff.time_off.created", labelKey: "ui.evStaffTimeOff", module: "staff" }
];
function catalogEntry(event) {
  return TRIGGER_CATALOG.find((e4) => e4.event === event);
}

// modules/flows/ui/lib/event-catalog.ts
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

// modules/flows/ui/lib/simulate.ts
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
  if (step.kind === "command") {
    for (const [key2, value] of Object.entries(step.params ?? {})) add(key2, value);
  } else if (step.kind === "http") {
    add("url", step.url ?? "");
    for (const [key2, value] of Object.entries(step.headers ?? {})) add(key2, value);
    if (step.body !== void 0 && step.body !== "") add("body", step.body);
  } else if (step.kind === "ai") {
    add("prompt", step.prompt ?? "");
  } else if (step.kind === "notify") {
    for (const [key2, value] of Object.entries(step.vars ?? {})) add(key2, value);
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
      values: stepValues(step, scope)
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

// modules/flows/ui/lib/hub-flows.ts
var CAPABILITY_DENIED = "capability_denied";
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

// modules/flows/ui/components/erp-flows-editor/erp-flows-editor.ts
var TABS = ["editor", "test", "permissions", "history"];
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
function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}
function option(value, label, current) {
  return b2`<option value=${value} ?selected=${value === current}>${label}</option>`;
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
    this.enabled = true;
    this.tab = "editor";
    this.openStep = null;
    this.grants = [];
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
    .run {
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius-sm, 10px);
      background: var(--ok-surface, #fff);
      padding: 0.6rem 0.7rem;
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
      this.enabled = this.flow?.enabled ?? true;
      this.error = "";
      this.notice = "";
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
  eventLabel(event) {
    const entry = event ? catalogEntry(event) : void 0;
    return entry ? this.t(entry.labelKey) : event ?? "";
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
          ${options.map(
      (entry) => option(entry.event, entry.labelKey ? this.t(entry.labelKey) : entry.event, chosen)
    )}
          <!--
            The saved event, kept on offer even when the catalogue has not arrived, or arrived
            without it (the module that emitted it was uninstalled). Dropping it would leave the
            control on «—» and the next change handler would save that emptiness over a working
            trigger — the exact shape of the bug fixed in v0.1.6, only now with a network round trip
            widening the window.
          -->
          ${chosen && !listed ? option(chosen, this.eventLabel(chosen), chosen) : A}
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
    const params = Object.entries(step.params ?? {});
    const setParams = (entries) => this.setDoc(patchStep(this.document, index, { params: Object.fromEntries(entries) }));
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
        <button type="button" @click=${() => setParams([...params, ["", ""]])}>
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
        <!-- Order is by how often a shop owner reaches for one, not by the kernel's enum. The ai one is
             last because it is the one that costs money and the one that needs the most reading. -->
        <div class="adders">
          ${[
      ["command", "ui.addCommand"],
      ["condition", "ui.addGuard"],
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
      ${this.grants.map(
      (g3) => b2`<div class="grant">
          <ok-status-pill tone="success" label=${this.t("ui.grantsGranted")}></ok-status-pill>
          <span class="grow">${g3.kind === "command" ? g3.value : this.t("ui.grantOther", g3)}</span>
          <button type="button" class="icon-btn" @click=${() => void this.revoke(g3)}>
            ${this.t("ui.revoke")}
          </button>
        </div>`
    )}
      ${!missing.length && !this.grants.length ? b2`<span class="muted">${this.t("ui.grantsNone")}</span>` : A}
      ${missing.length ? b2`<div class="adders" style="margin-left:0">
            <button type="button" @click=${() => void this.grantAll()}>${this.t("ui.grantAll")}</button>
          </div>` : A}
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
  renderHistory() {
    if (!this.runs.length) {
      return b2`<div class="list"><span class="muted">${this.t("ui.historyEmpty")}</span></div>`;
    }
    const byId = new Map(this.document.steps.map((s4) => [s4.id, s4]));
    return b2`<div class="list">
      ${this.runs.map((run2) => {
      const outcome = runOutcome(run2, this.t);
      const steps = this.runSteps[String(run2.id)];
      return b2`<div class="run">
          <div class="row" style="padding:0;gap:.5rem">
            <ok-status-pill tone=${outcome.tone} label=${outcome.label}></ok-status-pill>
            <span class="grow muted">${this.when(run2.started_at ?? run2.created_at)}</span>
            <button type="button" class="icon-btn" @click=${() => void this.toggleRun(String(run2.id))}>
              ▾
            </button>
          </div>
          <!-- The reason goes on the ROW, not behind the chevron. «Se paró por un error» with the
               error one click away is the shape of a screen that makes somebody phone support. -->
          ${run2.status === "failed" && run2.last_error ? b2`<div class="muted" style="font-size:.85rem">
                ${this.t("ui.ranFailed", { reason: run2.last_error })}
              </div>` : A}
          ${steps ? b2`<ul>
                ${steps.map(
        (s4) => b2`<li>${describeRunStep(s4, this.t, byId.get(String(s4.step_id)))}</li>`
      )}
              </ul>` : A}
        </div>`;
    })}
    </div>`;
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
          @ionChange=${(e4) => {
      this.enabled = !!e4.target.checked;
    }}
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

// modules/flows/ui/lib/templates.ts
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
  // ── Bars and restaurants ────────────────────────────────────────────────────────────────────
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

// modules/flows/ui/components/erp-flows-gallery/erp-flows-gallery.ts
var ErpFlowsGallery = class extends i3 {
  constructor() {
    super(...arguments);
    this.client = null;
    this.t = (k2) => k2;
    this.picked = null;
    this.known = {};
    this.busy = false;
    this.error = "";
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
    .cards {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .card {
      background: var(--ok-surface, var(--ion-card-background, #fff));
      border: 1px solid var(--ok-border, #d7d5cc);
      border-radius: var(--ok-radius, 14px);
      overflow: hidden;
    }
    .card[data-missing] {
      background: var(--ok-surface-muted, rgba(0, 0, 0, 0.02));
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
  `;
  }
  connectedCallback() {
    super.connectedCallback();
    void this.probe();
  }
  updated(changed) {
    if (changed.has("client")) void this.probe();
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
    const missing = missingModules(template, this.known);
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

      ${missing.length ? b2`<ok-inline-feedback tone="warning" icon="download-outline">
            ${this.t("ui.tplNeedsModule", { modules: missing.join(", ") })}
          </ok-inline-feedback>` : A}
      ${this.error ? b2`<ok-inline-feedback tone="danger" icon="alert-circle-outline"
            >${this.error}</ok-inline-feedback
          >` : A}

      <div class="actions">
        <ion-button
          size="small"
          data-act="use"
          ?disabled=${this.busy || missing.length > 0}
          @click=${() => void this.use()}
        >
          ${this.busy ? this.t("ui.saving") : this.t("ui.tplUse")}
        </ion-button>
        <span class="muted">${this.t("ui.tplCreatedPaused")}</span>
      </div>
    </div>`;
  }
  renderCard(template) {
    const missing = missingModules(template, this.known);
    const open = this.picked === template.id;
    return b2`<div
      class="card"
      data-template=${template.id}
      data-missing=${missing.length ? missing.join(",") : A}
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
        ${missing.length ? b2`<ok-status-pill tone="neutral" label=${this.t("ui.tplUnavailable")}></ok-status-pill>` : A}
      </button>
      ${open ? this.renderPanel(template) : A}
    </div>`;
  }
  renderSector(sector) {
    const templates = templatesOf(sector);
    if (!templates.length) return A;
    return b2`<section data-sector=${sector}>
      <h3>${this.t(`ui.sector_${sector}`)}</h3>
      <div class="cards">${templates.map((template) => this.renderCard(template))}</div>
    </section>`;
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
      ${SECTORS.map((sector) => this.renderSector(sector))}
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
], ErpFlowsGallery.prototype, "busy", 2);
__decorateClass([
  r5()
], ErpFlowsGallery.prototype, "error", 2);
define("erp-flows-gallery", ErpFlowsGallery);

// modules/flows/ui/components/erp-flows-guide/erp-flows-guide.ts
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

// modules/flows/ui/components/erp-flows-approvals/erp-flows-approvals.ts
var ErpFlowsApprovals = class extends i3 {
  constructor() {
    super(...arguments);
    this.client = null;
    this.t = (k2) => k2;
    this.rows = [];
    this.error = "";
    this.busy = [];
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
  `;
  }
  connectedCallback() {
    super.connectedCallback();
    void this.load();
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
      await call.call(this.client?.flows, row.id);
      this.rows = this.rows.filter((r6) => r6.id !== row.id);
      this.announce();
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
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
      ${this.rows.map(
      (row) => b2`<div class="card" data-approval=${row.id}>
          <span class="what">${this.t("ui.approvalWould", { command: row.command ?? "" })}</span>
          ${row.reason ? b2`<span class="why">${row.reason}</span>` : A}
          <pre>${this.payload(row)}</pre>
          <span class="meta"
            >${this.t("ui.approvalExpires", { when: this.when(row.expires_at) })}</span
          >
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
        </div>`
    )}
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
define("erp-flows-approvals", ErpFlowsApprovals);

// modules/flows/ui/lib/ai-draft.ts
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
      "notify"
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

// modules/flows/locales/es.json
var es_default = {
  name: "Automatizaciones",
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
    active: "Activa",
    paused: "En pausa",
    activate: "Activar",
    pause: "Pausar",
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
    tplNeedsModule: "Esta necesita el m\xF3dulo {modules}, y este hub no lo tiene. Inst\xE1lalo desde el marketplace y funcionar\xE1.",
    tplUnavailable: "Falta un m\xF3dulo",
    tplUse: "Usar esta",
    tplCreatedPaused: "Se crea en pausa. No pasa nada hasta que la enciendas.",
    tplYours: "Tus automatizaciones",
    guideOpen: "\xBFC\xF3mo funciona esto?",
    guideBack: "Volver a las automatizaciones",
    addNotify: "Enviar un mensaje",
    addHttp: "Llamar a otro sistema",
    addAi: "Ped\xEDrselo al asistente",
    stepHttp: "Llama a {host} ({method})",
    stepHttpEmpty: "Elige a qu\xE9 direcci\xF3n llama este paso",
    stepHttpTemplatedHost: "Llama a la direcci\xF3n que digan los datos ({method})",
    stepAiManual: "Le pide al asistente: {prompt} \u2014 t\xFA apruebas cualquier cambio",
    stepAiAuto: "Le pide al asistente: {prompt} \u2014 cambia cosas por su cuenta",
    stepAiEmpty: "Escribe qu\xE9 quieres que haga el asistente",
    stepNotifyEmail: "Env\xEDa un email al {field} de la ficha",
    stepNotifyWhatsapp: "Env\xEDa un WhatsApp al {field} de la ficha",
    stepNotifyEmpty: "Elige a qui\xE9n va este mensaje",
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
    tabTest: "Probar",
    testRun: "Probar",
    testNothingHappened: "Nada de esto es real. No se env\xEDa ning\xFAn mensaje, no se cobra nada y no se apunta nada: esto es solo lo que HAR\xCDA tu automatizaci\xF3n.",
    testUsingReal: "Con lo que pas\xF3 de verdad la \xFAltima vez que {event}, de las {count} \xFAltimas de tu propio hub.",
    testNoRealData: "Esto no ha pasado en tu hub \xFAltimamente, as\xED que no hay un ejemplo real con el que probarlo. Los pasos de abajo siguen siendo los correctos, pero no hay con qu\xE9 rellenarlos.",
    testBlanksFound: "{count} cosas saldr\xEDan vac\xEDas. Ah\xED es donde est\xE1 el fallo casi siempre.",
    testBlank: "saldr\xEDa vac\xEDo",
    testHidden: "s\xED hay un valor, pero aqu\xED no se ense\xF1a",
    testUnknown: "sale de un paso anterior, as\xED que no se sabe hasta que se ejecute",
    testStoppedIsWorking: "Se parar\xEDa aqu\xED, y eso es la automatizaci\xF3n funcionando: no hay un segundo camino.",
    testNotReached: "No llegar\xEDa hasta aqu\xED.",
    testTriggerBlocked: "Ni siquiera arrancar\xEDa: lo que ha pasado no encaja con lo que pediste.",
    testUncertain: "Esto no se puede comprobar aqu\xED: mira algo que el hub oculta porque podr\xEDa ser de una persona. Puede salir de las dos formas.",
    testClauseFailed: "{field} no es {op} {expected}",
    testWouldBeRefused: "Se lo rechazar\xEDan: todav\xEDa no le has permitido {what}.",
    testBlanksFoundOne: "1 cosa saldr\xEDa vac\xEDa. Ah\xED es donde est\xE1 el fallo casi siempre."
  },
  tpl: {
    author: "Automatizaciones",
    grant: {
      tasksCreate: "Crear una tarea en tu lista. No sale del hub y no le escribe a ning\xFAn cliente.",
      customersNote: "A\xF1adir una nota al historial de un cliente. No cambia sus datos ni le escribe."
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

// modules/flows/locales/en.json
var en_default = {
  name: "Automations",
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
    active: "Active",
    paused: "Paused",
    activate: "Activate",
    pause: "Pause",
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
    tplNeedsModule: "This one needs the {modules} module, and this hub does not have it. Install it from the marketplace and it will work.",
    tplUnavailable: "Needs a module",
    tplUse: "Use this one",
    tplCreatedPaused: "It is created paused. Nothing happens until you turn it on.",
    tplYours: "Your automations",
    guideOpen: "How does this work?",
    guideBack: "Back to the automations",
    addNotify: "Send a message",
    addHttp: "Call another system",
    addAi: "Ask the assistant",
    stepHttp: "Calls {host} ({method})",
    stepHttpEmpty: "Pick the address this step calls",
    stepHttpTemplatedHost: "Calls whatever address the data says ({method})",
    stepAiManual: "Asks the assistant: {prompt} \u2014 you approve any change",
    stepAiAuto: "Asks the assistant: {prompt} \u2014 it changes things on its own",
    stepAiEmpty: "Write what you want the assistant to do",
    stepNotifyEmail: "Sends an email to the {field} on file",
    stepNotifyWhatsapp: "Sends a WhatsApp to the {field} on file",
    stepNotifyEmpty: "Pick who this message goes to",
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
    tabTest: "Try it",
    testRun: "Try it",
    testNothingHappened: "Nothing here is real. No message is sent, nothing is charged and nothing is written down \u2014 this is only what your automation WOULD do.",
    testUsingReal: "Using what really happened the last time {event}, from the last {count} of them in your own hub.",
    testNoRealData: "This has not happened in your hub recently, so there is no real example to try it with. The steps below are still the right ones, but there is nothing to fill them in with.",
    testBlanksFound: "{count} things would come out empty. That is almost always the mistake.",
    testBlank: "would arrive empty",
    testHidden: "there is a value, and it is not shown here",
    testUnknown: "comes from an earlier step, so it is only known once it has run",
    testStoppedIsWorking: "It would stop here, and that is the automation working: there is no second path.",
    testNotReached: "It would not get this far.",
    testTriggerBlocked: "It would not even start: what happened does not match what you asked for.",
    testUncertain: "This cannot be checked here: it looks at something the hub hides because it could be about a person. It may go either way.",
    testClauseFailed: "{field} is not {op} {expected}",
    testWouldBeRefused: "It would be refused: you have not allowed {what} yet.",
    testBlanksFoundOne: "1 thing would come out empty. That is almost always the mistake."
  },
  tpl: {
    author: "Automations",
    grant: {
      tasksCreate: "Create a task in your list. It stays inside the hub and never writes to a customer.",
      customersNote: "Add a note to a customer's history. It does not change their details and it does not contact them."
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

// modules/flows/ui/components/erp-flows-app/erp-flows-app.ts
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
    this.error = "";
    this.coreVersion = "";
    this.tray = [];
    this.reviewing = null;
    this.draftReview = null;
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
    await this.loadTray();
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
  async remove(flow) {
    if (!this.client) return;
    try {
      await this.client.flows.remove(flow.id);
      this.flows = this.flows.filter((f3) => f3.id !== flow.id);
    } catch (e4) {
      this.error = e4?.message || this.t("ui.errGeneric");
    }
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
    return b2`<div class="list">
      <h3 class="section">${this.t("ui.tplYours")}</h3>
      ${this.flows.map(
      (flow) => b2`<div class="flow" data-flow=${flow.id}>
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
              aria-label=${this.t("ui.delete")}
              @click=${() => void this.remove(flow)}
            >
              ×
            </button>
          </span>
        </div>`
    )}
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
        ${this.renderTray()} ${this.renderList()}
        <erp-flows-gallery
          .client=${this.client}
          .t=${this.t}
          @flows-template-used=${(e4) => this.onTemplateUsed(e4)}
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
], ErpFlowsApp.prototype, "error", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "coreVersion", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "tray", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "reviewing", 2);
__decorateClass([
  r5()
], ErpFlowsApp.prototype, "draftReview", 2);
define("erp-flows-app", ErpFlowsApp);
