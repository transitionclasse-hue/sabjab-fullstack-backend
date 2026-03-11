(function (React, designSystem, adminjs, styled) {
    'use strict';

    function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

    var React__default = /*#__PURE__*/_interopDefault(React);

    /**
     * Custom Category dropdown that filters by the selected SuperCategory.
     */
    const FilteredCategory = props => {
      const {
        property,
        record,
        onChange
      } = props;
      const [options, setOptions] = React.useState([]);
      const [loading, setLoading] = React.useState(false);

      // Get the currently selected superCategory from the record
      const superCategoryId = record?.params?.superCategory;
      // Get the currently selected category
      const currentValue = record?.params?.category;
      React.useEffect(() => {
        if (!superCategoryId) {
          setOptions([]);
          return;
        }
        setLoading(true);

        // Fetch categories filtered by the selected superCategory
        fetch(`/api/supercategories/${superCategoryId}/categories`).then(res => res.json()).then(result => {
          const items = result.data || result || [];
          const opts = (Array.isArray(items) ? items : []).map(cat => ({
            value: cat._id,
            label: cat.name
          }));
          setOptions(opts);
          setLoading(false);
        }).catch(err => {
          console.error('Failed to fetch categories:', err);
          setOptions([]);
          setLoading(false);
        });
      }, [superCategoryId]);
      const selected = options.find(o => o.value === currentValue) || null;
      const handleChange = selectedOption => {
        onChange(property.path, selectedOption ? selectedOption.value : '');
        // Reset category-dependent fields if necessary
        // Here we might want to clear subCategory if category changes, 
        // but that's handled by the subCategory component watching category.
      };
      return /*#__PURE__*/React__default.default.createElement(designSystem.FormGroup, null, /*#__PURE__*/React__default.default.createElement(designSystem.Label, null, "Category"), !superCategoryId ? /*#__PURE__*/React__default.default.createElement(designSystem.FormMessage, null, "Please select a Super Category first") : loading ? /*#__PURE__*/React__default.default.createElement(designSystem.FormMessage, null, "Loading categories...") : options.length === 0 ? /*#__PURE__*/React__default.default.createElement(designSystem.FormMessage, null, "No categories found for this super category") : /*#__PURE__*/React__default.default.createElement(designSystem.Select, {
        value: selected,
        options: options,
        onChange: handleChange,
        isClearable: true,
        placeholder: "Select Category..."
      }));
    };

    /**
     * Custom SubCategory dropdown that filters by the selected Category.
     * Watches the `category` field on the Product form and fetches
     * only subcategories belonging to that category.
     */
    const FilteredSubCategory = props => {
      const {
        property,
        record,
        onChange
      } = props;
      const [options, setOptions] = React.useState([]);
      const [loading, setLoading] = React.useState(false);

      // Get the currently selected category from the record
      const categoryId = record?.params?.category;
      // Get the currently selected subCategory
      const currentValue = record?.params?.subCategory;
      React.useEffect(() => {
        if (!categoryId) {
          setOptions([]);
          return;
        }
        setLoading(true);

        // Use the existing API route to fetch filtered subcategories
        fetch(`/api/categories/${categoryId}/subcategories`).then(res => res.json()).then(result => {
          const items = result.data || result || [];
          const opts = (Array.isArray(items) ? items : []).map(sc => ({
            value: sc._id,
            label: sc.name
          }));
          setOptions(opts);
          setLoading(false);
        }).catch(err => {
          console.error('Failed to fetch subcategories:', err);
          setOptions([]);
          setLoading(false);
        });
      }, [categoryId]);
      const selected = options.find(o => o.value === currentValue) || null;
      const handleChange = selectedOption => {
        onChange(property.path, selectedOption ? selectedOption.value : '');
      };
      return /*#__PURE__*/React__default.default.createElement(designSystem.FormGroup, null, /*#__PURE__*/React__default.default.createElement(designSystem.Label, null, "Sub Category"), !categoryId ? /*#__PURE__*/React__default.default.createElement(designSystem.FormMessage, null, "Please select a Category first") : loading ? /*#__PURE__*/React__default.default.createElement(designSystem.FormMessage, null, "Loading subcategories...") : options.length === 0 ? /*#__PURE__*/React__default.default.createElement(designSystem.FormMessage, null, "No subcategories found for this category") : /*#__PURE__*/React__default.default.createElement(designSystem.Select, {
        value: selected,
        options: options,
        onChange: handleChange,
        isClearable: true,
        placeholder: "Select Sub Category..."
      }));
    };

    const SupportReply = props => {
      const {
        record,
        resource,
        action
      } = props;
      const [message, setMessage] = React.useState('');
      const [loading, setLoading] = React.useState(false);
      const sendNotice = designSystem.useNotice();
      const api = new adminjs.ApiClient();
      const handleSend = async () => {
        if (!message.trim()) return;
        setLoading(true);
        try {
          await api.recordAction({
            resourceId: resource.id,
            recordId: record.id,
            actionName: action.name,
            payload: {
              replyMessage: message
            },
            method: 'post'
          });
          sendNotice({
            message: 'Reply sent successfully!',
            type: 'success'
          });
          setMessage('');
          // Redirect back to list
          window.location.href = `/admin/resources/${resource.id}`;
        } catch (error) {
          console.error('Reply failed:', error);
          sendNotice({
            message: 'Failed to send reply',
            type: 'error'
          });
        } finally {
          setLoading(false);
        }
      };
      return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        variant: "white",
        padding: "xl"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        marginBottom: "xl"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Label, null, "User's Last Message:"), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        padding: "m",
        backgroundColor: "grey20",
        borderRadius: "default"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, null, record.params.message))), /*#__PURE__*/React__default.default.createElement(designSystem.FormGroup, null, /*#__PURE__*/React__default.default.createElement(designSystem.Label, null, "Your Reply:"), /*#__PURE__*/React__default.default.createElement(designSystem.TextArea, {
        value: message,
        onChange: e => setMessage(e.target.value),
        placeholder: "Type your response here...",
        rows: 5
      })), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        marginTop: "xl"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
        variant: "primary",
        onClick: handleSend,
        disabled: loading || !message.trim()
      }, loading ? 'Sending...' : 'Send Reply')));
    };

    const PACKET_TYPES = Object.create(null); // no Map = no polyfill
    PACKET_TYPES["open"] = "0";
    PACKET_TYPES["close"] = "1";
    PACKET_TYPES["ping"] = "2";
    PACKET_TYPES["pong"] = "3";
    PACKET_TYPES["message"] = "4";
    PACKET_TYPES["upgrade"] = "5";
    PACKET_TYPES["noop"] = "6";
    const PACKET_TYPES_REVERSE = Object.create(null);
    Object.keys(PACKET_TYPES).forEach((key) => {
        PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
    });
    const ERROR_PACKET = { type: "error", data: "parser error" };

    const withNativeBlob$1 = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
    const withNativeArrayBuffer$2 = typeof ArrayBuffer === "function";
    // ArrayBuffer.isView method is not defined in IE10
    const isView$1 = (obj) => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj && obj.buffer instanceof ArrayBuffer;
    };
    const encodePacket = ({ type, data }, supportsBinary, callback) => {
        if (withNativeBlob$1 && data instanceof Blob) {
            if (supportsBinary) {
                return callback(data);
            }
            else {
                return encodeBlobAsBase64(data, callback);
            }
        }
        else if (withNativeArrayBuffer$2 &&
            (data instanceof ArrayBuffer || isView$1(data))) {
            if (supportsBinary) {
                return callback(data);
            }
            else {
                return encodeBlobAsBase64(new Blob([data]), callback);
            }
        }
        // plain string
        return callback(PACKET_TYPES[type] + (data || ""));
    };
    const encodeBlobAsBase64 = (data, callback) => {
        const fileReader = new FileReader();
        fileReader.onload = function () {
            const content = fileReader.result.split(",")[1];
            callback("b" + (content || ""));
        };
        return fileReader.readAsDataURL(data);
    };
    function toArray(data) {
        if (data instanceof Uint8Array) {
            return data;
        }
        else if (data instanceof ArrayBuffer) {
            return new Uint8Array(data);
        }
        else {
            return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        }
    }
    let TEXT_ENCODER;
    function encodePacketToBinary(packet, callback) {
        if (withNativeBlob$1 && packet.data instanceof Blob) {
            return packet.data.arrayBuffer().then(toArray).then(callback);
        }
        else if (withNativeArrayBuffer$2 &&
            (packet.data instanceof ArrayBuffer || isView$1(packet.data))) {
            return callback(toArray(packet.data));
        }
        encodePacket(packet, false, (encoded) => {
            if (!TEXT_ENCODER) {
                TEXT_ENCODER = new TextEncoder();
            }
            callback(TEXT_ENCODER.encode(encoded));
        });
    }

    // imported from https://github.com/socketio/base64-arraybuffer
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    // Use a lookup table to find the index.
    const lookup$1 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
        lookup$1[chars.charCodeAt(i)] = i;
    }
    const decode$1 = (base64) => {
        let bufferLength = base64.length * 0.75, len = base64.length, i, p = 0, encoded1, encoded2, encoded3, encoded4;
        if (base64[base64.length - 1] === '=') {
            bufferLength--;
            if (base64[base64.length - 2] === '=') {
                bufferLength--;
            }
        }
        const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer);
        for (i = 0; i < len; i += 4) {
            encoded1 = lookup$1[base64.charCodeAt(i)];
            encoded2 = lookup$1[base64.charCodeAt(i + 1)];
            encoded3 = lookup$1[base64.charCodeAt(i + 2)];
            encoded4 = lookup$1[base64.charCodeAt(i + 3)];
            bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
            bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
            bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }
        return arraybuffer;
    };

    const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";
    const decodePacket = (encodedPacket, binaryType) => {
        if (typeof encodedPacket !== "string") {
            return {
                type: "message",
                data: mapBinary(encodedPacket, binaryType),
            };
        }
        const type = encodedPacket.charAt(0);
        if (type === "b") {
            return {
                type: "message",
                data: decodeBase64Packet(encodedPacket.substring(1), binaryType),
            };
        }
        const packetType = PACKET_TYPES_REVERSE[type];
        if (!packetType) {
            return ERROR_PACKET;
        }
        return encodedPacket.length > 1
            ? {
                type: PACKET_TYPES_REVERSE[type],
                data: encodedPacket.substring(1),
            }
            : {
                type: PACKET_TYPES_REVERSE[type],
            };
    };
    const decodeBase64Packet = (data, binaryType) => {
        if (withNativeArrayBuffer$1) {
            const decoded = decode$1(data);
            return mapBinary(decoded, binaryType);
        }
        else {
            return { base64: true, data }; // fallback for old browsers
        }
    };
    const mapBinary = (data, binaryType) => {
        switch (binaryType) {
            case "blob":
                if (data instanceof Blob) {
                    // from WebSocket + binaryType "blob"
                    return data;
                }
                else {
                    // from HTTP long-polling or WebTransport
                    return new Blob([data]);
                }
            case "arraybuffer":
            default:
                if (data instanceof ArrayBuffer) {
                    // from HTTP long-polling (base64) or WebSocket + binaryType "arraybuffer"
                    return data;
                }
                else {
                    // from WebTransport (Uint8Array)
                    return data.buffer;
                }
        }
    };

    const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text
    const encodePayload = (packets, callback) => {
        // some packets may be added to the array while encoding, so the initial length must be saved
        const length = packets.length;
        const encodedPackets = new Array(length);
        let count = 0;
        packets.forEach((packet, i) => {
            // force base64 encoding for binary packets
            encodePacket(packet, false, (encodedPacket) => {
                encodedPackets[i] = encodedPacket;
                if (++count === length) {
                    callback(encodedPackets.join(SEPARATOR));
                }
            });
        });
    };
    const decodePayload = (encodedPayload, binaryType) => {
        const encodedPackets = encodedPayload.split(SEPARATOR);
        const packets = [];
        for (let i = 0; i < encodedPackets.length; i++) {
            const decodedPacket = decodePacket(encodedPackets[i], binaryType);
            packets.push(decodedPacket);
            if (decodedPacket.type === "error") {
                break;
            }
        }
        return packets;
    };
    function createPacketEncoderStream() {
        return new TransformStream({
            transform(packet, controller) {
                encodePacketToBinary(packet, (encodedPacket) => {
                    const payloadLength = encodedPacket.length;
                    let header;
                    // inspired by the WebSocket format: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#decoding_payload_length
                    if (payloadLength < 126) {
                        header = new Uint8Array(1);
                        new DataView(header.buffer).setUint8(0, payloadLength);
                    }
                    else if (payloadLength < 65536) {
                        header = new Uint8Array(3);
                        const view = new DataView(header.buffer);
                        view.setUint8(0, 126);
                        view.setUint16(1, payloadLength);
                    }
                    else {
                        header = new Uint8Array(9);
                        const view = new DataView(header.buffer);
                        view.setUint8(0, 127);
                        view.setBigUint64(1, BigInt(payloadLength));
                    }
                    // first bit indicates whether the payload is plain text (0) or binary (1)
                    if (packet.data && typeof packet.data !== "string") {
                        header[0] |= 0x80;
                    }
                    controller.enqueue(header);
                    controller.enqueue(encodedPacket);
                });
            },
        });
    }
    let TEXT_DECODER;
    function totalLength(chunks) {
        return chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    }
    function concatChunks(chunks, size) {
        if (chunks[0].length === size) {
            return chunks.shift();
        }
        const buffer = new Uint8Array(size);
        let j = 0;
        for (let i = 0; i < size; i++) {
            buffer[i] = chunks[0][j++];
            if (j === chunks[0].length) {
                chunks.shift();
                j = 0;
            }
        }
        if (chunks.length && j < chunks[0].length) {
            chunks[0] = chunks[0].slice(j);
        }
        return buffer;
    }
    function createPacketDecoderStream(maxPayload, binaryType) {
        if (!TEXT_DECODER) {
            TEXT_DECODER = new TextDecoder();
        }
        const chunks = [];
        let state = 0 /* State.READ_HEADER */;
        let expectedLength = -1;
        let isBinary = false;
        return new TransformStream({
            transform(chunk, controller) {
                chunks.push(chunk);
                while (true) {
                    if (state === 0 /* State.READ_HEADER */) {
                        if (totalLength(chunks) < 1) {
                            break;
                        }
                        const header = concatChunks(chunks, 1);
                        isBinary = (header[0] & 0x80) === 0x80;
                        expectedLength = header[0] & 0x7f;
                        if (expectedLength < 126) {
                            state = 3 /* State.READ_PAYLOAD */;
                        }
                        else if (expectedLength === 126) {
                            state = 1 /* State.READ_EXTENDED_LENGTH_16 */;
                        }
                        else {
                            state = 2 /* State.READ_EXTENDED_LENGTH_64 */;
                        }
                    }
                    else if (state === 1 /* State.READ_EXTENDED_LENGTH_16 */) {
                        if (totalLength(chunks) < 2) {
                            break;
                        }
                        const headerArray = concatChunks(chunks, 2);
                        expectedLength = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length).getUint16(0);
                        state = 3 /* State.READ_PAYLOAD */;
                    }
                    else if (state === 2 /* State.READ_EXTENDED_LENGTH_64 */) {
                        if (totalLength(chunks) < 8) {
                            break;
                        }
                        const headerArray = concatChunks(chunks, 8);
                        const view = new DataView(headerArray.buffer, headerArray.byteOffset, headerArray.length);
                        const n = view.getUint32(0);
                        if (n > Math.pow(2, 53 - 32) - 1) {
                            // the maximum safe integer in JavaScript is 2^53 - 1
                            controller.enqueue(ERROR_PACKET);
                            break;
                        }
                        expectedLength = n * Math.pow(2, 32) + view.getUint32(4);
                        state = 3 /* State.READ_PAYLOAD */;
                    }
                    else {
                        if (totalLength(chunks) < expectedLength) {
                            break;
                        }
                        const data = concatChunks(chunks, expectedLength);
                        controller.enqueue(decodePacket(isBinary ? data : TEXT_DECODER.decode(data), binaryType));
                        state = 0 /* State.READ_HEADER */;
                    }
                    if (expectedLength === 0 || expectedLength > maxPayload) {
                        controller.enqueue(ERROR_PACKET);
                        break;
                    }
                }
            },
        });
    }
    const protocol = 4;

    /**
     * Expose `Emitter`.
     */

    var Emitter_1 = Emitter;

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
      if (obj) return mixin(obj);
    }

    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }
      return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on =
    Emitter.prototype.addEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};
      (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
        .push(fn);
      return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn){
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }

      on.fn = fn;
      this.on(event, on);
      return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off =
    Emitter.prototype.removeListener =
    Emitter.prototype.removeAllListeners =
    Emitter.prototype.removeEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};

      // all
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }

      // specific event
      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this;

      // remove all handlers
      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      }

      // remove specific handler
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }

      // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.
      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event){
      this._callbacks = this._callbacks || {};

      var args = new Array(arguments.length - 1)
        , callbacks = this._callbacks['$' + event];

      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }

      if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }

      return this;
    };

    // alias used for reserved events (protected method)
    Emitter.prototype.emitReserved = Emitter.prototype.emit;

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event){
      this._callbacks = this._callbacks || {};
      return this._callbacks['$' + event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event){
      return !! this.listeners(event).length;
    };

    const nextTick = (() => {
        const isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";
        if (isPromiseAvailable) {
            return (cb) => Promise.resolve().then(cb);
        }
        else {
            return (cb, setTimeoutFn) => setTimeoutFn(cb, 0);
        }
    })();
    const globalThisShim = (() => {
        if (typeof self !== "undefined") {
            return self;
        }
        else if (typeof window !== "undefined") {
            return window;
        }
        else {
            return Function("return this")();
        }
    })();
    const defaultBinaryType = "arraybuffer";
    function createCookieJar() { }

    function pick(obj, ...attr) {
        return attr.reduce((acc, k) => {
            if (obj.hasOwnProperty(k)) {
                acc[k] = obj[k];
            }
            return acc;
        }, {});
    }
    // Keep a reference to the real timeout functions so they can be used when overridden
    const NATIVE_SET_TIMEOUT = globalThisShim.setTimeout;
    const NATIVE_CLEAR_TIMEOUT = globalThisShim.clearTimeout;
    function installTimerFunctions(obj, opts) {
        if (opts.useNativeTimers) {
            obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThisShim);
            obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThisShim);
        }
        else {
            obj.setTimeoutFn = globalThisShim.setTimeout.bind(globalThisShim);
            obj.clearTimeoutFn = globalThisShim.clearTimeout.bind(globalThisShim);
        }
    }
    // base64 encoded buffers are about 33% bigger (https://en.wikipedia.org/wiki/Base64)
    const BASE64_OVERHEAD = 1.33;
    // we could also have used `new Blob([obj]).size`, but it isn't supported in IE9
    function byteLength(obj) {
        if (typeof obj === "string") {
            return utf8Length(obj);
        }
        // arraybuffer or blob
        return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
    }
    function utf8Length(str) {
        let c = 0, length = 0;
        for (let i = 0, l = str.length; i < l; i++) {
            c = str.charCodeAt(i);
            if (c < 0x80) {
                length += 1;
            }
            else if (c < 0x800) {
                length += 2;
            }
            else if (c < 0xd800 || c >= 0xe000) {
                length += 3;
            }
            else {
                i++;
                length += 4;
            }
        }
        return length;
    }
    /**
     * Generates a random 8-characters string.
     */
    function randomString() {
        return (Date.now().toString(36).substring(3) +
            Math.random().toString(36).substring(2, 5));
    }

    // imported from https://github.com/galkn/querystring
    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */
    function encode(obj) {
        let str = '';
        for (let i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (str.length)
                    str += '&';
                str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
            }
        }
        return str;
    }
    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */
    function decode(qs) {
        let qry = {};
        let pairs = qs.split('&');
        for (let i = 0, l = pairs.length; i < l; i++) {
            let pair = pairs[i].split('=');
            qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        }
        return qry;
    }

    class TransportError extends Error {
        constructor(reason, description, context) {
            super(reason);
            this.description = description;
            this.context = context;
            this.type = "TransportError";
        }
    }
    class Transport extends Emitter_1 {
        /**
         * Transport abstract constructor.
         *
         * @param {Object} opts - options
         * @protected
         */
        constructor(opts) {
            super();
            this.writable = false;
            installTimerFunctions(this, opts);
            this.opts = opts;
            this.query = opts.query;
            this.socket = opts.socket;
            this.supportsBinary = !opts.forceBase64;
        }
        /**
         * Emits an error.
         *
         * @param {String} reason
         * @param description
         * @param context - the error context
         * @return {Transport} for chaining
         * @protected
         */
        onError(reason, description, context) {
            super.emitReserved("error", new TransportError(reason, description, context));
            return this;
        }
        /**
         * Opens the transport.
         */
        open() {
            this.readyState = "opening";
            this.doOpen();
            return this;
        }
        /**
         * Closes the transport.
         */
        close() {
            if (this.readyState === "opening" || this.readyState === "open") {
                this.doClose();
                this.onClose();
            }
            return this;
        }
        /**
         * Sends multiple packets.
         *
         * @param {Array} packets
         */
        send(packets) {
            if (this.readyState === "open") {
                this.write(packets);
            }
        }
        /**
         * Called upon open
         *
         * @protected
         */
        onOpen() {
            this.readyState = "open";
            this.writable = true;
            super.emitReserved("open");
        }
        /**
         * Called with data.
         *
         * @param {String} data
         * @protected
         */
        onData(data) {
            const packet = decodePacket(data, this.socket.binaryType);
            this.onPacket(packet);
        }
        /**
         * Called with a decoded packet.
         *
         * @protected
         */
        onPacket(packet) {
            super.emitReserved("packet", packet);
        }
        /**
         * Called upon close.
         *
         * @protected
         */
        onClose(details) {
            this.readyState = "closed";
            super.emitReserved("close", details);
        }
        /**
         * Pauses the transport, in order not to lose packets during an upgrade.
         *
         * @param onPause
         */
        pause(onPause) { }
        createUri(schema, query = {}) {
            return (schema +
                "://" +
                this._hostname() +
                this._port() +
                this.opts.path +
                this._query(query));
        }
        _hostname() {
            const hostname = this.opts.hostname;
            return hostname.indexOf(":") === -1 ? hostname : "[" + hostname + "]";
        }
        _port() {
            if (this.opts.port &&
                ((this.opts.secure && Number(this.opts.port) !== 443) ||
                    (!this.opts.secure && Number(this.opts.port) !== 80))) {
                return ":" + this.opts.port;
            }
            else {
                return "";
            }
        }
        _query(query) {
            const encodedQuery = encode(query);
            return encodedQuery.length ? "?" + encodedQuery : "";
        }
    }

    class Polling extends Transport {
        constructor() {
            super(...arguments);
            this._polling = false;
        }
        get name() {
            return "polling";
        }
        /**
         * Opens the socket (triggers polling). We write a PING message to determine
         * when the transport is open.
         *
         * @protected
         */
        doOpen() {
            this._poll();
        }
        /**
         * Pauses polling.
         *
         * @param {Function} onPause - callback upon buffers are flushed and transport is paused
         * @package
         */
        pause(onPause) {
            this.readyState = "pausing";
            const pause = () => {
                this.readyState = "paused";
                onPause();
            };
            if (this._polling || !this.writable) {
                let total = 0;
                if (this._polling) {
                    total++;
                    this.once("pollComplete", function () {
                        --total || pause();
                    });
                }
                if (!this.writable) {
                    total++;
                    this.once("drain", function () {
                        --total || pause();
                    });
                }
            }
            else {
                pause();
            }
        }
        /**
         * Starts polling cycle.
         *
         * @private
         */
        _poll() {
            this._polling = true;
            this.doPoll();
            this.emitReserved("poll");
        }
        /**
         * Overloads onData to detect payloads.
         *
         * @protected
         */
        onData(data) {
            const callback = (packet) => {
                // if its the first message we consider the transport open
                if ("opening" === this.readyState && packet.type === "open") {
                    this.onOpen();
                }
                // if its a close packet, we close the ongoing requests
                if ("close" === packet.type) {
                    this.onClose({ description: "transport closed by the server" });
                    return false;
                }
                // otherwise bypass onData and handle the message
                this.onPacket(packet);
            };
            // decode payload
            decodePayload(data, this.socket.binaryType).forEach(callback);
            // if an event did not trigger closing
            if ("closed" !== this.readyState) {
                // if we got data we're not polling
                this._polling = false;
                this.emitReserved("pollComplete");
                if ("open" === this.readyState) {
                    this._poll();
                }
            }
        }
        /**
         * For polling, send a close packet.
         *
         * @protected
         */
        doClose() {
            const close = () => {
                this.write([{ type: "close" }]);
            };
            if ("open" === this.readyState) {
                close();
            }
            else {
                // in case we're trying to close while
                // handshaking is in progress (GH-164)
                this.once("open", close);
            }
        }
        /**
         * Writes a packets payload.
         *
         * @param {Array} packets - data packets
         * @protected
         */
        write(packets) {
            this.writable = false;
            encodePayload(packets, (data) => {
                this.doWrite(data, () => {
                    this.writable = true;
                    this.emitReserved("drain");
                });
            });
        }
        /**
         * Generates uri for connection.
         *
         * @private
         */
        uri() {
            const schema = this.opts.secure ? "https" : "http";
            const query = this.query || {};
            // cache busting is forced
            if (false !== this.opts.timestampRequests) {
                query[this.opts.timestampParam] = randomString();
            }
            if (!this.supportsBinary && !query.sid) {
                query.b64 = 1;
            }
            return this.createUri(schema, query);
        }
    }

    // imported from https://github.com/component/has-cors
    let value = false;
    try {
        value = typeof XMLHttpRequest !== 'undefined' &&
            'withCredentials' in new XMLHttpRequest();
    }
    catch (err) {
        // if XMLHttp support is disabled in IE then it will throw
        // when trying to create
    }
    const hasCORS = value;

    function empty() { }
    class BaseXHR extends Polling {
        /**
         * XHR Polling constructor.
         *
         * @param {Object} opts
         * @package
         */
        constructor(opts) {
            super(opts);
            if (typeof location !== "undefined") {
                const isSSL = "https:" === location.protocol;
                let port = location.port;
                // some user agents have empty `location.port`
                if (!port) {
                    port = isSSL ? "443" : "80";
                }
                this.xd =
                    (typeof location !== "undefined" &&
                        opts.hostname !== location.hostname) ||
                        port !== opts.port;
            }
        }
        /**
         * Sends data.
         *
         * @param {String} data to send.
         * @param {Function} called upon flush.
         * @private
         */
        doWrite(data, fn) {
            const req = this.request({
                method: "POST",
                data: data,
            });
            req.on("success", fn);
            req.on("error", (xhrStatus, context) => {
                this.onError("xhr post error", xhrStatus, context);
            });
        }
        /**
         * Starts a poll cycle.
         *
         * @private
         */
        doPoll() {
            const req = this.request();
            req.on("data", this.onData.bind(this));
            req.on("error", (xhrStatus, context) => {
                this.onError("xhr poll error", xhrStatus, context);
            });
            this.pollXhr = req;
        }
    }
    class Request extends Emitter_1 {
        /**
         * Request constructor
         *
         * @param {Object} options
         * @package
         */
        constructor(createRequest, uri, opts) {
            super();
            this.createRequest = createRequest;
            installTimerFunctions(this, opts);
            this._opts = opts;
            this._method = opts.method || "GET";
            this._uri = uri;
            this._data = undefined !== opts.data ? opts.data : null;
            this._create();
        }
        /**
         * Creates the XHR object and sends the request.
         *
         * @private
         */
        _create() {
            var _a;
            const opts = pick(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
            opts.xdomain = !!this._opts.xd;
            const xhr = (this._xhr = this.createRequest(opts));
            try {
                xhr.open(this._method, this._uri, true);
                try {
                    if (this._opts.extraHeaders) {
                        // @ts-ignore
                        xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
                        for (let i in this._opts.extraHeaders) {
                            if (this._opts.extraHeaders.hasOwnProperty(i)) {
                                xhr.setRequestHeader(i, this._opts.extraHeaders[i]);
                            }
                        }
                    }
                }
                catch (e) { }
                if ("POST" === this._method) {
                    try {
                        xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
                    }
                    catch (e) { }
                }
                try {
                    xhr.setRequestHeader("Accept", "*/*");
                }
                catch (e) { }
                (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.addCookies(xhr);
                // ie6 check
                if ("withCredentials" in xhr) {
                    xhr.withCredentials = this._opts.withCredentials;
                }
                if (this._opts.requestTimeout) {
                    xhr.timeout = this._opts.requestTimeout;
                }
                xhr.onreadystatechange = () => {
                    var _a;
                    if (xhr.readyState === 3) {
                        (_a = this._opts.cookieJar) === null || _a === void 0 ? void 0 : _a.parseCookies(
                        // @ts-ignore
                        xhr.getResponseHeader("set-cookie"));
                    }
                    if (4 !== xhr.readyState)
                        return;
                    if (200 === xhr.status || 1223 === xhr.status) {
                        this._onLoad();
                    }
                    else {
                        // make sure the `error` event handler that's user-set
                        // does not throw in the same tick and gets caught here
                        this.setTimeoutFn(() => {
                            this._onError(typeof xhr.status === "number" ? xhr.status : 0);
                        }, 0);
                    }
                };
                xhr.send(this._data);
            }
            catch (e) {
                // Need to defer since .create() is called directly from the constructor
                // and thus the 'error' event can only be only bound *after* this exception
                // occurs.  Therefore, also, we cannot throw here at all.
                this.setTimeoutFn(() => {
                    this._onError(e);
                }, 0);
                return;
            }
            if (typeof document !== "undefined") {
                this._index = Request.requestsCount++;
                Request.requests[this._index] = this;
            }
        }
        /**
         * Called upon error.
         *
         * @private
         */
        _onError(err) {
            this.emitReserved("error", err, this._xhr);
            this._cleanup(true);
        }
        /**
         * Cleans up house.
         *
         * @private
         */
        _cleanup(fromError) {
            if ("undefined" === typeof this._xhr || null === this._xhr) {
                return;
            }
            this._xhr.onreadystatechange = empty;
            if (fromError) {
                try {
                    this._xhr.abort();
                }
                catch (e) { }
            }
            if (typeof document !== "undefined") {
                delete Request.requests[this._index];
            }
            this._xhr = null;
        }
        /**
         * Called upon load.
         *
         * @private
         */
        _onLoad() {
            const data = this._xhr.responseText;
            if (data !== null) {
                this.emitReserved("data", data);
                this.emitReserved("success");
                this._cleanup();
            }
        }
        /**
         * Aborts the request.
         *
         * @package
         */
        abort() {
            this._cleanup();
        }
    }
    Request.requestsCount = 0;
    Request.requests = {};
    /**
     * Aborts pending requests when unloading the window. This is needed to prevent
     * memory leaks (e.g. when using IE) and to ensure that no spurious error is
     * emitted.
     */
    if (typeof document !== "undefined") {
        // @ts-ignore
        if (typeof attachEvent === "function") {
            // @ts-ignore
            attachEvent("onunload", unloadHandler);
        }
        else if (typeof addEventListener === "function") {
            const terminationEvent = "onpagehide" in globalThisShim ? "pagehide" : "unload";
            addEventListener(terminationEvent, unloadHandler, false);
        }
    }
    function unloadHandler() {
        for (let i in Request.requests) {
            if (Request.requests.hasOwnProperty(i)) {
                Request.requests[i].abort();
            }
        }
    }
    const hasXHR2 = (function () {
        const xhr = newRequest({
            xdomain: false,
        });
        return xhr && xhr.responseType !== null;
    })();
    /**
     * HTTP long-polling based on the built-in `XMLHttpRequest` object.
     *
     * Usage: browser
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
     */
    class XHR extends BaseXHR {
        constructor(opts) {
            super(opts);
            const forceBase64 = opts && opts.forceBase64;
            this.supportsBinary = hasXHR2 && !forceBase64;
        }
        request(opts = {}) {
            Object.assign(opts, { xd: this.xd }, this.opts);
            return new Request(newRequest, this.uri(), opts);
        }
    }
    function newRequest(opts) {
        const xdomain = opts.xdomain;
        // XMLHttpRequest can be disabled on IE
        try {
            if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
                return new XMLHttpRequest();
            }
        }
        catch (e) { }
        if (!xdomain) {
            try {
                return new globalThisShim[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
            }
            catch (e) { }
        }
    }

    // detect ReactNative environment
    const isReactNative = typeof navigator !== "undefined" &&
        typeof navigator.product === "string" &&
        navigator.product.toLowerCase() === "reactnative";
    class BaseWS extends Transport {
        get name() {
            return "websocket";
        }
        doOpen() {
            const uri = this.uri();
            const protocols = this.opts.protocols;
            // React Native only supports the 'headers' option, and will print a warning if anything else is passed
            const opts = isReactNative
                ? {}
                : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
            if (this.opts.extraHeaders) {
                opts.headers = this.opts.extraHeaders;
            }
            try {
                this.ws = this.createSocket(uri, protocols, opts);
            }
            catch (err) {
                return this.emitReserved("error", err);
            }
            this.ws.binaryType = this.socket.binaryType;
            this.addEventListeners();
        }
        /**
         * Adds event listeners to the socket
         *
         * @private
         */
        addEventListeners() {
            this.ws.onopen = () => {
                if (this.opts.autoUnref) {
                    this.ws._socket.unref();
                }
                this.onOpen();
            };
            this.ws.onclose = (closeEvent) => this.onClose({
                description: "websocket connection closed",
                context: closeEvent,
            });
            this.ws.onmessage = (ev) => this.onData(ev.data);
            this.ws.onerror = (e) => this.onError("websocket error", e);
        }
        write(packets) {
            this.writable = false;
            // encodePacket efficient as it uses WS framing
            // no need for encodePayload
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];
                const lastPacket = i === packets.length - 1;
                encodePacket(packet, this.supportsBinary, (data) => {
                    // Sometimes the websocket has already been closed but the browser didn't
                    // have a chance of informing us about it yet, in that case send will
                    // throw an error
                    try {
                        this.doWrite(packet, data);
                    }
                    catch (e) {
                    }
                    if (lastPacket) {
                        // fake drain
                        // defer to next tick to allow Socket to clear writeBuffer
                        nextTick(() => {
                            this.writable = true;
                            this.emitReserved("drain");
                        }, this.setTimeoutFn);
                    }
                });
            }
        }
        doClose() {
            if (typeof this.ws !== "undefined") {
                this.ws.onerror = () => { };
                this.ws.close();
                this.ws = null;
            }
        }
        /**
         * Generates uri for connection.
         *
         * @private
         */
        uri() {
            const schema = this.opts.secure ? "wss" : "ws";
            const query = this.query || {};
            // append timestamp to URI
            if (this.opts.timestampRequests) {
                query[this.opts.timestampParam] = randomString();
            }
            // communicate binary support capabilities
            if (!this.supportsBinary) {
                query.b64 = 1;
            }
            return this.createUri(schema, query);
        }
    }
    const WebSocketCtor = globalThisShim.WebSocket || globalThisShim.MozWebSocket;
    /**
     * WebSocket transport based on the built-in `WebSocket` object.
     *
     * Usage: browser, Node.js (since v21), Deno, Bun
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
     * @see https://caniuse.com/mdn-api_websocket
     * @see https://nodejs.org/api/globals.html#websocket
     */
    class WS extends BaseWS {
        createSocket(uri, protocols, opts) {
            return !isReactNative
                ? protocols
                    ? new WebSocketCtor(uri, protocols)
                    : new WebSocketCtor(uri)
                : new WebSocketCtor(uri, protocols, opts);
        }
        doWrite(_packet, data) {
            this.ws.send(data);
        }
    }

    /**
     * WebTransport transport based on the built-in `WebTransport` object.
     *
     * Usage: browser, Node.js (with the `@fails-components/webtransport` package)
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/WebTransport
     * @see https://caniuse.com/webtransport
     */
    class WT extends Transport {
        get name() {
            return "webtransport";
        }
        doOpen() {
            try {
                // @ts-ignore
                this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
            }
            catch (err) {
                return this.emitReserved("error", err);
            }
            this._transport.closed
                .then(() => {
                this.onClose();
            })
                .catch((err) => {
                this.onError("webtransport error", err);
            });
            // note: we could have used async/await, but that would require some additional polyfills
            this._transport.ready.then(() => {
                this._transport.createBidirectionalStream().then((stream) => {
                    const decoderStream = createPacketDecoderStream(Number.MAX_SAFE_INTEGER, this.socket.binaryType);
                    const reader = stream.readable.pipeThrough(decoderStream).getReader();
                    const encoderStream = createPacketEncoderStream();
                    encoderStream.readable.pipeTo(stream.writable);
                    this._writer = encoderStream.writable.getWriter();
                    const read = () => {
                        reader
                            .read()
                            .then(({ done, value }) => {
                            if (done) {
                                return;
                            }
                            this.onPacket(value);
                            read();
                        })
                            .catch((err) => {
                        });
                    };
                    read();
                    const packet = { type: "open" };
                    if (this.query.sid) {
                        packet.data = `{"sid":"${this.query.sid}"}`;
                    }
                    this._writer.write(packet).then(() => this.onOpen());
                });
            });
        }
        write(packets) {
            this.writable = false;
            for (let i = 0; i < packets.length; i++) {
                const packet = packets[i];
                const lastPacket = i === packets.length - 1;
                this._writer.write(packet).then(() => {
                    if (lastPacket) {
                        nextTick(() => {
                            this.writable = true;
                            this.emitReserved("drain");
                        }, this.setTimeoutFn);
                    }
                });
            }
        }
        doClose() {
            var _a;
            (_a = this._transport) === null || _a === void 0 ? void 0 : _a.close();
        }
    }

    const transports = {
        websocket: WS,
        webtransport: WT,
        polling: XHR,
    };

    // imported from https://github.com/galkn/parseuri
    /**
     * Parses a URI
     *
     * Note: we could also have used the built-in URL object, but it isn't supported on all platforms.
     *
     * See:
     * - https://developer.mozilla.org/en-US/docs/Web/API/URL
     * - https://caniuse.com/url
     * - https://www.rfc-editor.org/rfc/rfc3986#appendix-B
     *
     * History of the parse() method:
     * - first commit: https://github.com/socketio/socket.io-client/commit/4ee1d5d94b3906a9c052b459f1a818b15f38f91c
     * - export into its own module: https://github.com/socketio/engine.io-client/commit/de2c561e4564efeb78f1bdb1ba39ef81b2822cb3
     * - reimport: https://github.com/socketio/engine.io-client/commit/df32277c3f6d622eec5ed09f493cae3f3391d242
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */
    const re = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
    const parts = [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
    ];
    function parse(str) {
        if (str.length > 8000) {
            throw "URI too long";
        }
        const src = str, b = str.indexOf('['), e = str.indexOf(']');
        if (b != -1 && e != -1) {
            str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
        }
        let m = re.exec(str || ''), uri = {}, i = 14;
        while (i--) {
            uri[parts[i]] = m[i] || '';
        }
        if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
            uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
            uri.ipv6uri = true;
        }
        uri.pathNames = pathNames(uri, uri['path']);
        uri.queryKey = queryKey(uri, uri['query']);
        return uri;
    }
    function pathNames(obj, path) {
        const regx = /\/{2,9}/g, names = path.replace(regx, "/").split("/");
        if (path.slice(0, 1) == '/' || path.length === 0) {
            names.splice(0, 1);
        }
        if (path.slice(-1) == '/') {
            names.splice(names.length - 1, 1);
        }
        return names;
    }
    function queryKey(uri, query) {
        const data = {};
        query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
            if ($1) {
                data[$1] = $2;
            }
        });
        return data;
    }

    const withEventListeners = typeof addEventListener === "function" &&
        typeof removeEventListener === "function";
    const OFFLINE_EVENT_LISTENERS = [];
    if (withEventListeners) {
        // within a ServiceWorker, any event handler for the 'offline' event must be added on the initial evaluation of the
        // script, so we create one single event listener here which will forward the event to the socket instances
        addEventListener("offline", () => {
            OFFLINE_EVENT_LISTENERS.forEach((listener) => listener());
        }, false);
    }
    /**
     * This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
     * with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
     *
     * This class comes without upgrade mechanism, which means that it will keep the first low-level transport that
     * successfully establishes the connection.
     *
     * In order to allow tree-shaking, there are no transports included, that's why the `transports` option is mandatory.
     *
     * @example
     * import { SocketWithoutUpgrade, WebSocket } from "engine.io-client";
     *
     * const socket = new SocketWithoutUpgrade({
     *   transports: [WebSocket]
     * });
     *
     * socket.on("open", () => {
     *   socket.send("hello");
     * });
     *
     * @see SocketWithUpgrade
     * @see Socket
     */
    class SocketWithoutUpgrade extends Emitter_1 {
        /**
         * Socket constructor.
         *
         * @param {String|Object} uri - uri or options
         * @param {Object} opts - options
         */
        constructor(uri, opts) {
            super();
            this.binaryType = defaultBinaryType;
            this.writeBuffer = [];
            this._prevBufferLen = 0;
            this._pingInterval = -1;
            this._pingTimeout = -1;
            this._maxPayload = -1;
            /**
             * The expiration timestamp of the {@link _pingTimeoutTimer} object is tracked, in case the timer is throttled and the
             * callback is not fired on time. This can happen for example when a laptop is suspended or when a phone is locked.
             */
            this._pingTimeoutTime = Infinity;
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = null;
            }
            if (uri) {
                const parsedUri = parse(uri);
                opts.hostname = parsedUri.host;
                opts.secure =
                    parsedUri.protocol === "https" || parsedUri.protocol === "wss";
                opts.port = parsedUri.port;
                if (parsedUri.query)
                    opts.query = parsedUri.query;
            }
            else if (opts.host) {
                opts.hostname = parse(opts.host).host;
            }
            installTimerFunctions(this, opts);
            this.secure =
                null != opts.secure
                    ? opts.secure
                    : typeof location !== "undefined" && "https:" === location.protocol;
            if (opts.hostname && !opts.port) {
                // if no port is specified manually, use the protocol default
                opts.port = this.secure ? "443" : "80";
            }
            this.hostname =
                opts.hostname ||
                    (typeof location !== "undefined" ? location.hostname : "localhost");
            this.port =
                opts.port ||
                    (typeof location !== "undefined" && location.port
                        ? location.port
                        : this.secure
                            ? "443"
                            : "80");
            this.transports = [];
            this._transportsByName = {};
            opts.transports.forEach((t) => {
                const transportName = t.prototype.name;
                this.transports.push(transportName);
                this._transportsByName[transportName] = t;
            });
            this.opts = Object.assign({
                path: "/engine.io",
                agent: false,
                withCredentials: false,
                upgrade: true,
                timestampParam: "t",
                rememberUpgrade: false,
                addTrailingSlash: true,
                rejectUnauthorized: true,
                perMessageDeflate: {
                    threshold: 1024,
                },
                transportOptions: {},
                closeOnBeforeunload: false,
            }, opts);
            this.opts.path =
                this.opts.path.replace(/\/$/, "") +
                    (this.opts.addTrailingSlash ? "/" : "");
            if (typeof this.opts.query === "string") {
                this.opts.query = decode(this.opts.query);
            }
            if (withEventListeners) {
                if (this.opts.closeOnBeforeunload) {
                    // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
                    // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
                    // closed/reloaded)
                    this._beforeunloadEventListener = () => {
                        if (this.transport) {
                            // silently close the transport
                            this.transport.removeAllListeners();
                            this.transport.close();
                        }
                    };
                    addEventListener("beforeunload", this._beforeunloadEventListener, false);
                }
                if (this.hostname !== "localhost") {
                    this._offlineEventListener = () => {
                        this._onClose("transport close", {
                            description: "network connection lost",
                        });
                    };
                    OFFLINE_EVENT_LISTENERS.push(this._offlineEventListener);
                }
            }
            if (this.opts.withCredentials) {
                this._cookieJar = createCookieJar();
            }
            this._open();
        }
        /**
         * Creates transport of the given type.
         *
         * @param {String} name - transport name
         * @return {Transport}
         * @private
         */
        createTransport(name) {
            const query = Object.assign({}, this.opts.query);
            // append engine.io protocol identifier
            query.EIO = protocol;
            // transport name
            query.transport = name;
            // session id if we already have one
            if (this.id)
                query.sid = this.id;
            const opts = Object.assign({}, this.opts, {
                query,
                socket: this,
                hostname: this.hostname,
                secure: this.secure,
                port: this.port,
            }, this.opts.transportOptions[name]);
            return new this._transportsByName[name](opts);
        }
        /**
         * Initializes transport to use and starts probe.
         *
         * @private
         */
        _open() {
            if (this.transports.length === 0) {
                // Emit error on next tick so it can be listened to
                this.setTimeoutFn(() => {
                    this.emitReserved("error", "No transports available");
                }, 0);
                return;
            }
            const transportName = this.opts.rememberUpgrade &&
                SocketWithoutUpgrade.priorWebsocketSuccess &&
                this.transports.indexOf("websocket") !== -1
                ? "websocket"
                : this.transports[0];
            this.readyState = "opening";
            const transport = this.createTransport(transportName);
            transport.open();
            this.setTransport(transport);
        }
        /**
         * Sets the current transport. Disables the existing one (if any).
         *
         * @private
         */
        setTransport(transport) {
            if (this.transport) {
                this.transport.removeAllListeners();
            }
            // set up transport
            this.transport = transport;
            // set up transport listeners
            transport
                .on("drain", this._onDrain.bind(this))
                .on("packet", this._onPacket.bind(this))
                .on("error", this._onError.bind(this))
                .on("close", (reason) => this._onClose("transport close", reason));
        }
        /**
         * Called when connection is deemed open.
         *
         * @private
         */
        onOpen() {
            this.readyState = "open";
            SocketWithoutUpgrade.priorWebsocketSuccess =
                "websocket" === this.transport.name;
            this.emitReserved("open");
            this.flush();
        }
        /**
         * Handles a packet.
         *
         * @private
         */
        _onPacket(packet) {
            if ("opening" === this.readyState ||
                "open" === this.readyState ||
                "closing" === this.readyState) {
                this.emitReserved("packet", packet);
                // Socket is live - any packet counts
                this.emitReserved("heartbeat");
                switch (packet.type) {
                    case "open":
                        this.onHandshake(JSON.parse(packet.data));
                        break;
                    case "ping":
                        this._sendPacket("pong");
                        this.emitReserved("ping");
                        this.emitReserved("pong");
                        this._resetPingTimeout();
                        break;
                    case "error":
                        const err = new Error("server error");
                        // @ts-ignore
                        err.code = packet.data;
                        this._onError(err);
                        break;
                    case "message":
                        this.emitReserved("data", packet.data);
                        this.emitReserved("message", packet.data);
                        break;
                }
            }
        }
        /**
         * Called upon handshake completion.
         *
         * @param {Object} data - handshake obj
         * @private
         */
        onHandshake(data) {
            this.emitReserved("handshake", data);
            this.id = data.sid;
            this.transport.query.sid = data.sid;
            this._pingInterval = data.pingInterval;
            this._pingTimeout = data.pingTimeout;
            this._maxPayload = data.maxPayload;
            this.onOpen();
            // In case open handler closes socket
            if ("closed" === this.readyState)
                return;
            this._resetPingTimeout();
        }
        /**
         * Sets and resets ping timeout timer based on server pings.
         *
         * @private
         */
        _resetPingTimeout() {
            this.clearTimeoutFn(this._pingTimeoutTimer);
            const delay = this._pingInterval + this._pingTimeout;
            this._pingTimeoutTime = Date.now() + delay;
            this._pingTimeoutTimer = this.setTimeoutFn(() => {
                this._onClose("ping timeout");
            }, delay);
            if (this.opts.autoUnref) {
                this._pingTimeoutTimer.unref();
            }
        }
        /**
         * Called on `drain` event
         *
         * @private
         */
        _onDrain() {
            this.writeBuffer.splice(0, this._prevBufferLen);
            // setting prevBufferLen = 0 is very important
            // for example, when upgrading, upgrade packet is sent over,
            // and a nonzero prevBufferLen could cause problems on `drain`
            this._prevBufferLen = 0;
            if (0 === this.writeBuffer.length) {
                this.emitReserved("drain");
            }
            else {
                this.flush();
            }
        }
        /**
         * Flush write buffers.
         *
         * @private
         */
        flush() {
            if ("closed" !== this.readyState &&
                this.transport.writable &&
                !this.upgrading &&
                this.writeBuffer.length) {
                const packets = this._getWritablePackets();
                this.transport.send(packets);
                // keep track of current length of writeBuffer
                // splice writeBuffer and callbackBuffer on `drain`
                this._prevBufferLen = packets.length;
                this.emitReserved("flush");
            }
        }
        /**
         * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
         * long-polling)
         *
         * @private
         */
        _getWritablePackets() {
            const shouldCheckPayloadSize = this._maxPayload &&
                this.transport.name === "polling" &&
                this.writeBuffer.length > 1;
            if (!shouldCheckPayloadSize) {
                return this.writeBuffer;
            }
            let payloadSize = 1; // first packet type
            for (let i = 0; i < this.writeBuffer.length; i++) {
                const data = this.writeBuffer[i].data;
                if (data) {
                    payloadSize += byteLength(data);
                }
                if (i > 0 && payloadSize > this._maxPayload) {
                    return this.writeBuffer.slice(0, i);
                }
                payloadSize += 2; // separator + packet type
            }
            return this.writeBuffer;
        }
        /**
         * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
         *
         * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
         * `write()` method then the message would not be buffered by the Socket.IO client.
         *
         * @return {boolean}
         * @private
         */
        /* private */ _hasPingExpired() {
            if (!this._pingTimeoutTime)
                return true;
            const hasExpired = Date.now() > this._pingTimeoutTime;
            if (hasExpired) {
                this._pingTimeoutTime = 0;
                nextTick(() => {
                    this._onClose("ping timeout");
                }, this.setTimeoutFn);
            }
            return hasExpired;
        }
        /**
         * Sends a message.
         *
         * @param {String} msg - message.
         * @param {Object} options.
         * @param {Function} fn - callback function.
         * @return {Socket} for chaining.
         */
        write(msg, options, fn) {
            this._sendPacket("message", msg, options, fn);
            return this;
        }
        /**
         * Sends a message. Alias of {@link Socket#write}.
         *
         * @param {String} msg - message.
         * @param {Object} options.
         * @param {Function} fn - callback function.
         * @return {Socket} for chaining.
         */
        send(msg, options, fn) {
            this._sendPacket("message", msg, options, fn);
            return this;
        }
        /**
         * Sends a packet.
         *
         * @param {String} type: packet type.
         * @param {String} data.
         * @param {Object} options.
         * @param {Function} fn - callback function.
         * @private
         */
        _sendPacket(type, data, options, fn) {
            if ("function" === typeof data) {
                fn = data;
                data = undefined;
            }
            if ("function" === typeof options) {
                fn = options;
                options = null;
            }
            if ("closing" === this.readyState || "closed" === this.readyState) {
                return;
            }
            options = options || {};
            options.compress = false !== options.compress;
            const packet = {
                type: type,
                data: data,
                options: options,
            };
            this.emitReserved("packetCreate", packet);
            this.writeBuffer.push(packet);
            if (fn)
                this.once("flush", fn);
            this.flush();
        }
        /**
         * Closes the connection.
         */
        close() {
            const close = () => {
                this._onClose("forced close");
                this.transport.close();
            };
            const cleanupAndClose = () => {
                this.off("upgrade", cleanupAndClose);
                this.off("upgradeError", cleanupAndClose);
                close();
            };
            const waitForUpgrade = () => {
                // wait for upgrade to finish since we can't send packets while pausing a transport
                this.once("upgrade", cleanupAndClose);
                this.once("upgradeError", cleanupAndClose);
            };
            if ("opening" === this.readyState || "open" === this.readyState) {
                this.readyState = "closing";
                if (this.writeBuffer.length) {
                    this.once("drain", () => {
                        if (this.upgrading) {
                            waitForUpgrade();
                        }
                        else {
                            close();
                        }
                    });
                }
                else if (this.upgrading) {
                    waitForUpgrade();
                }
                else {
                    close();
                }
            }
            return this;
        }
        /**
         * Called upon transport error
         *
         * @private
         */
        _onError(err) {
            SocketWithoutUpgrade.priorWebsocketSuccess = false;
            if (this.opts.tryAllTransports &&
                this.transports.length > 1 &&
                this.readyState === "opening") {
                this.transports.shift();
                return this._open();
            }
            this.emitReserved("error", err);
            this._onClose("transport error", err);
        }
        /**
         * Called upon transport close.
         *
         * @private
         */
        _onClose(reason, description) {
            if ("opening" === this.readyState ||
                "open" === this.readyState ||
                "closing" === this.readyState) {
                // clear timers
                this.clearTimeoutFn(this._pingTimeoutTimer);
                // stop event from firing again for transport
                this.transport.removeAllListeners("close");
                // ensure transport won't stay open
                this.transport.close();
                // ignore further transport communication
                this.transport.removeAllListeners();
                if (withEventListeners) {
                    if (this._beforeunloadEventListener) {
                        removeEventListener("beforeunload", this._beforeunloadEventListener, false);
                    }
                    if (this._offlineEventListener) {
                        const i = OFFLINE_EVENT_LISTENERS.indexOf(this._offlineEventListener);
                        if (i !== -1) {
                            OFFLINE_EVENT_LISTENERS.splice(i, 1);
                        }
                    }
                }
                // set ready state
                this.readyState = "closed";
                // clear session id
                this.id = null;
                // emit close event
                this.emitReserved("close", reason, description);
                // clean buffers after, so users can still
                // grab the buffers on `close` event
                this.writeBuffer = [];
                this._prevBufferLen = 0;
            }
        }
    }
    SocketWithoutUpgrade.protocol = protocol;
    /**
     * This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
     * with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
     *
     * This class comes with an upgrade mechanism, which means that once the connection is established with the first
     * low-level transport, it will try to upgrade to a better transport.
     *
     * In order to allow tree-shaking, there are no transports included, that's why the `transports` option is mandatory.
     *
     * @example
     * import { SocketWithUpgrade, WebSocket } from "engine.io-client";
     *
     * const socket = new SocketWithUpgrade({
     *   transports: [WebSocket]
     * });
     *
     * socket.on("open", () => {
     *   socket.send("hello");
     * });
     *
     * @see SocketWithoutUpgrade
     * @see Socket
     */
    class SocketWithUpgrade extends SocketWithoutUpgrade {
        constructor() {
            super(...arguments);
            this._upgrades = [];
        }
        onOpen() {
            super.onOpen();
            if ("open" === this.readyState && this.opts.upgrade) {
                for (let i = 0; i < this._upgrades.length; i++) {
                    this._probe(this._upgrades[i]);
                }
            }
        }
        /**
         * Probes a transport.
         *
         * @param {String} name - transport name
         * @private
         */
        _probe(name) {
            let transport = this.createTransport(name);
            let failed = false;
            SocketWithoutUpgrade.priorWebsocketSuccess = false;
            const onTransportOpen = () => {
                if (failed)
                    return;
                transport.send([{ type: "ping", data: "probe" }]);
                transport.once("packet", (msg) => {
                    if (failed)
                        return;
                    if ("pong" === msg.type && "probe" === msg.data) {
                        this.upgrading = true;
                        this.emitReserved("upgrading", transport);
                        if (!transport)
                            return;
                        SocketWithoutUpgrade.priorWebsocketSuccess =
                            "websocket" === transport.name;
                        this.transport.pause(() => {
                            if (failed)
                                return;
                            if ("closed" === this.readyState)
                                return;
                            cleanup();
                            this.setTransport(transport);
                            transport.send([{ type: "upgrade" }]);
                            this.emitReserved("upgrade", transport);
                            transport = null;
                            this.upgrading = false;
                            this.flush();
                        });
                    }
                    else {
                        const err = new Error("probe error");
                        // @ts-ignore
                        err.transport = transport.name;
                        this.emitReserved("upgradeError", err);
                    }
                });
            };
            function freezeTransport() {
                if (failed)
                    return;
                // Any callback called by transport should be ignored since now
                failed = true;
                cleanup();
                transport.close();
                transport = null;
            }
            // Handle any error that happens while probing
            const onerror = (err) => {
                const error = new Error("probe error: " + err);
                // @ts-ignore
                error.transport = transport.name;
                freezeTransport();
                this.emitReserved("upgradeError", error);
            };
            function onTransportClose() {
                onerror("transport closed");
            }
            // When the socket is closed while we're probing
            function onclose() {
                onerror("socket closed");
            }
            // When the socket is upgraded while we're probing
            function onupgrade(to) {
                if (transport && to.name !== transport.name) {
                    freezeTransport();
                }
            }
            // Remove all listeners on the transport and on self
            const cleanup = () => {
                transport.removeListener("open", onTransportOpen);
                transport.removeListener("error", onerror);
                transport.removeListener("close", onTransportClose);
                this.off("close", onclose);
                this.off("upgrading", onupgrade);
            };
            transport.once("open", onTransportOpen);
            transport.once("error", onerror);
            transport.once("close", onTransportClose);
            this.once("close", onclose);
            this.once("upgrading", onupgrade);
            if (this._upgrades.indexOf("webtransport") !== -1 &&
                name !== "webtransport") {
                // favor WebTransport
                this.setTimeoutFn(() => {
                    if (!failed) {
                        transport.open();
                    }
                }, 200);
            }
            else {
                transport.open();
            }
        }
        onHandshake(data) {
            this._upgrades = this._filterUpgrades(data.upgrades);
            super.onHandshake(data);
        }
        /**
         * Filters upgrades, returning only those matching client transports.
         *
         * @param {Array} upgrades - server upgrades
         * @private
         */
        _filterUpgrades(upgrades) {
            const filteredUpgrades = [];
            for (let i = 0; i < upgrades.length; i++) {
                if (~this.transports.indexOf(upgrades[i]))
                    filteredUpgrades.push(upgrades[i]);
            }
            return filteredUpgrades;
        }
    }
    /**
     * This class provides a WebSocket-like interface to connect to an Engine.IO server. The connection will be established
     * with one of the available low-level transports, like HTTP long-polling, WebSocket or WebTransport.
     *
     * This class comes with an upgrade mechanism, which means that once the connection is established with the first
     * low-level transport, it will try to upgrade to a better transport.
     *
     * @example
     * import { Socket } from "engine.io-client";
     *
     * const socket = new Socket();
     *
     * socket.on("open", () => {
     *   socket.send("hello");
     * });
     *
     * @see SocketWithoutUpgrade
     * @see SocketWithUpgrade
     */
    let Socket$1 = class Socket extends SocketWithUpgrade {
        constructor(uri, opts = {}) {
            const o = typeof uri === "object" ? uri : opts;
            if (!o.transports ||
                (o.transports && typeof o.transports[0] === "string")) {
                o.transports = (o.transports || ["polling", "websocket", "webtransport"])
                    .map((transportName) => transports[transportName])
                    .filter((t) => !!t);
            }
            super(uri, o);
        }
    };

    Socket$1.protocol;

    /**
     * URL parser.
     *
     * @param uri - url
     * @param path - the request path of the connection
     * @param loc - An object meant to mimic window.location.
     *        Defaults to window.location.
     * @public
     */
    function url(uri, path = "", loc) {
        let obj = uri;
        // default to window.location
        loc = loc || (typeof location !== "undefined" && location);
        if (null == uri)
            uri = loc.protocol + "//" + loc.host;
        // relative path support
        if (typeof uri === "string") {
            if ("/" === uri.charAt(0)) {
                if ("/" === uri.charAt(1)) {
                    uri = loc.protocol + uri;
                }
                else {
                    uri = loc.host + uri;
                }
            }
            if (!/^(https?|wss?):\/\//.test(uri)) {
                if ("undefined" !== typeof loc) {
                    uri = loc.protocol + "//" + uri;
                }
                else {
                    uri = "https://" + uri;
                }
            }
            // parse
            obj = parse(uri);
        }
        // make sure we treat `localhost:80` and `localhost` equally
        if (!obj.port) {
            if (/^(http|ws)$/.test(obj.protocol)) {
                obj.port = "80";
            }
            else if (/^(http|ws)s$/.test(obj.protocol)) {
                obj.port = "443";
            }
        }
        obj.path = obj.path || "/";
        const ipv6 = obj.host.indexOf(":") !== -1;
        const host = ipv6 ? "[" + obj.host + "]" : obj.host;
        // define unique id
        obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
        // define href
        obj.href =
            obj.protocol +
                "://" +
                host +
                (loc && loc.port === obj.port ? "" : ":" + obj.port);
        return obj;
    }

    const withNativeArrayBuffer = typeof ArrayBuffer === "function";
    const isView = (obj) => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj.buffer instanceof ArrayBuffer;
    };
    const toString = Object.prototype.toString;
    const withNativeBlob = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            toString.call(Blob) === "[object BlobConstructor]");
    const withNativeFile = typeof File === "function" ||
        (typeof File !== "undefined" &&
            toString.call(File) === "[object FileConstructor]");
    /**
     * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
     *
     * @private
     */
    function isBinary(obj) {
        return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
            (withNativeBlob && obj instanceof Blob) ||
            (withNativeFile && obj instanceof File));
    }
    function hasBinary(obj, toJSON) {
        if (!obj || typeof obj !== "object") {
            return false;
        }
        if (Array.isArray(obj)) {
            for (let i = 0, l = obj.length; i < l; i++) {
                if (hasBinary(obj[i])) {
                    return true;
                }
            }
            return false;
        }
        if (isBinary(obj)) {
            return true;
        }
        if (obj.toJSON &&
            typeof obj.toJSON === "function" &&
            arguments.length === 1) {
            return hasBinary(obj.toJSON(), true);
        }
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
     *
     * @param {Object} packet - socket.io event packet
     * @return {Object} with deconstructed packet and list of buffers
     * @public
     */
    function deconstructPacket(packet) {
        const buffers = [];
        const packetData = packet.data;
        const pack = packet;
        pack.data = _deconstructPacket(packetData, buffers);
        pack.attachments = buffers.length; // number of binary 'attachments'
        return { packet: pack, buffers: buffers };
    }
    function _deconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (isBinary(data)) {
            const placeholder = { _placeholder: true, num: buffers.length };
            buffers.push(data);
            return placeholder;
        }
        else if (Array.isArray(data)) {
            const newData = new Array(data.length);
            for (let i = 0; i < data.length; i++) {
                newData[i] = _deconstructPacket(data[i], buffers);
            }
            return newData;
        }
        else if (typeof data === "object" && !(data instanceof Date)) {
            const newData = {};
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    newData[key] = _deconstructPacket(data[key], buffers);
                }
            }
            return newData;
        }
        return data;
    }
    /**
     * Reconstructs a binary packet from its placeholder packet and buffers
     *
     * @param {Object} packet - event packet with placeholders
     * @param {Array} buffers - binary buffers to put in placeholder positions
     * @return {Object} reconstructed packet
     * @public
     */
    function reconstructPacket(packet, buffers) {
        packet.data = _reconstructPacket(packet.data, buffers);
        delete packet.attachments; // no longer useful
        return packet;
    }
    function _reconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (data && data._placeholder === true) {
            const isIndexValid = typeof data.num === "number" &&
                data.num >= 0 &&
                data.num < buffers.length;
            if (isIndexValid) {
                return buffers[data.num]; // appropriate buffer (should be natural order anyway)
            }
            else {
                throw new Error("illegal attachments");
            }
        }
        else if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                data[i] = _reconstructPacket(data[i], buffers);
            }
        }
        else if (typeof data === "object") {
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    data[key] = _reconstructPacket(data[key], buffers);
                }
            }
        }
        return data;
    }

    /**
     * These strings must not be used as event names, as they have a special meaning.
     */
    const RESERVED_EVENTS$1 = [
        "connect", // used on the client side
        "connect_error", // used on the client side
        "disconnect", // used on both sides
        "disconnecting", // used on the server side
        "newListener", // used by the Node.js EventEmitter
        "removeListener", // used by the Node.js EventEmitter
    ];
    var PacketType;
    (function (PacketType) {
        PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
        PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
        PacketType[PacketType["EVENT"] = 2] = "EVENT";
        PacketType[PacketType["ACK"] = 3] = "ACK";
        PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
        PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
        PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
    })(PacketType || (PacketType = {}));
    /**
     * A socket.io Encoder instance
     */
    class Encoder {
        /**
         * Encoder constructor
         *
         * @param {function} replacer - custom replacer to pass down to JSON.parse
         */
        constructor(replacer) {
            this.replacer = replacer;
        }
        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        encode(obj) {
            if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
                if (hasBinary(obj)) {
                    return this.encodeAsBinary({
                        type: obj.type === PacketType.EVENT
                            ? PacketType.BINARY_EVENT
                            : PacketType.BINARY_ACK,
                        nsp: obj.nsp,
                        data: obj.data,
                        id: obj.id,
                    });
                }
            }
            return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */
        encodeAsString(obj) {
            // first is type
            let str = "" + obj.type;
            // attachments if we have them
            if (obj.type === PacketType.BINARY_EVENT ||
                obj.type === PacketType.BINARY_ACK) {
                str += obj.attachments + "-";
            }
            // if we have a namespace other than `/`
            // we append it followed by a comma `,`
            if (obj.nsp && "/" !== obj.nsp) {
                str += obj.nsp + ",";
            }
            // immediately followed by the id
            if (null != obj.id) {
                str += obj.id;
            }
            // json data
            if (null != obj.data) {
                str += JSON.stringify(obj.data, this.replacer);
            }
            return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */
        encodeAsBinary(obj) {
            const deconstruction = deconstructPacket(obj);
            const pack = this.encodeAsString(deconstruction.packet);
            const buffers = deconstruction.buffers;
            buffers.unshift(pack); // add packet info to beginning of data list
            return buffers; // write all the buffers
        }
    }
    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     */
    class Decoder extends Emitter_1 {
        /**
         * Decoder constructor
         *
         * @param {function} reviver - custom reviver to pass down to JSON.stringify
         */
        constructor(reviver) {
            super();
            this.reviver = reviver;
        }
        /**
         * Decodes an encoded packet string into packet JSON.
         *
         * @param {String} obj - encoded packet
         */
        add(obj) {
            let packet;
            if (typeof obj === "string") {
                if (this.reconstructor) {
                    throw new Error("got plaintext data when reconstructing a packet");
                }
                packet = this.decodeString(obj);
                const isBinaryEvent = packet.type === PacketType.BINARY_EVENT;
                if (isBinaryEvent || packet.type === PacketType.BINARY_ACK) {
                    packet.type = isBinaryEvent ? PacketType.EVENT : PacketType.ACK;
                    // binary packet's json
                    this.reconstructor = new BinaryReconstructor(packet);
                    // no attachments, labeled binary but no binary data to follow
                    if (packet.attachments === 0) {
                        super.emitReserved("decoded", packet);
                    }
                }
                else {
                    // non-binary full packet
                    super.emitReserved("decoded", packet);
                }
            }
            else if (isBinary(obj) || obj.base64) {
                // raw binary data
                if (!this.reconstructor) {
                    throw new Error("got binary data when not reconstructing a packet");
                }
                else {
                    packet = this.reconstructor.takeBinaryData(obj);
                    if (packet) {
                        // received final buffer
                        this.reconstructor = null;
                        super.emitReserved("decoded", packet);
                    }
                }
            }
            else {
                throw new Error("Unknown type: " + obj);
            }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */
        decodeString(str) {
            let i = 0;
            // look up type
            const p = {
                type: Number(str.charAt(0)),
            };
            if (PacketType[p.type] === undefined) {
                throw new Error("unknown packet type " + p.type);
            }
            // look up attachments if type binary
            if (p.type === PacketType.BINARY_EVENT ||
                p.type === PacketType.BINARY_ACK) {
                const start = i + 1;
                while (str.charAt(++i) !== "-" && i != str.length) { }
                const buf = str.substring(start, i);
                if (buf != Number(buf) || str.charAt(i) !== "-") {
                    throw new Error("Illegal attachments");
                }
                p.attachments = Number(buf);
            }
            // look up namespace (if any)
            if ("/" === str.charAt(i + 1)) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if ("," === c)
                        break;
                    if (i === str.length)
                        break;
                }
                p.nsp = str.substring(start, i);
            }
            else {
                p.nsp = "/";
            }
            // look up id
            const next = str.charAt(i + 1);
            if ("" !== next && Number(next) == next) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if (null == c || Number(c) != c) {
                        --i;
                        break;
                    }
                    if (i === str.length)
                        break;
                }
                p.id = Number(str.substring(start, i + 1));
            }
            // look up json data
            if (str.charAt(++i)) {
                const payload = this.tryParse(str.substr(i));
                if (Decoder.isPayloadValid(p.type, payload)) {
                    p.data = payload;
                }
                else {
                    throw new Error("invalid payload");
                }
            }
            return p;
        }
        tryParse(str) {
            try {
                return JSON.parse(str, this.reviver);
            }
            catch (e) {
                return false;
            }
        }
        static isPayloadValid(type, payload) {
            switch (type) {
                case PacketType.CONNECT:
                    return isObject(payload);
                case PacketType.DISCONNECT:
                    return payload === undefined;
                case PacketType.CONNECT_ERROR:
                    return typeof payload === "string" || isObject(payload);
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    return (Array.isArray(payload) &&
                        (typeof payload[0] === "number" ||
                            (typeof payload[0] === "string" &&
                                RESERVED_EVENTS$1.indexOf(payload[0]) === -1)));
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    return Array.isArray(payload);
            }
        }
        /**
         * Deallocates a parser's resources
         */
        destroy() {
            if (this.reconstructor) {
                this.reconstructor.finishedReconstruction();
                this.reconstructor = null;
            }
        }
    }
    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     */
    class BinaryReconstructor {
        constructor(packet) {
            this.packet = packet;
            this.buffers = [];
            this.reconPack = packet;
        }
        /**
         * Method to be called when binary data received from connection
         * after a BINARY_EVENT packet.
         *
         * @param {Buffer | ArrayBuffer} binData - the raw binary data received
         * @return {null | Object} returns null if more binary data is expected or
         *   a reconstructed packet object if all buffers have been received.
         */
        takeBinaryData(binData) {
            this.buffers.push(binData);
            if (this.buffers.length === this.reconPack.attachments) {
                // done with buffer list
                const packet = reconstructPacket(this.reconPack, this.buffers);
                this.finishedReconstruction();
                return packet;
            }
            return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */
        finishedReconstruction() {
            this.reconPack = null;
            this.buffers = [];
        }
    }
    // see https://stackoverflow.com/questions/8511281/check-if-a-value-is-an-object-in-javascript
    function isObject(value) {
        return Object.prototype.toString.call(value) === "[object Object]";
    }

    var parser = /*#__PURE__*/Object.freeze({
        __proto__: null,
        Decoder: Decoder,
        Encoder: Encoder,
        get PacketType () { return PacketType; }
    });

    function on(obj, ev, fn) {
        obj.on(ev, fn);
        return function subDestroy() {
            obj.off(ev, fn);
        };
    }

    /**
     * Internal events.
     * These events can't be emitted by the user.
     */
    const RESERVED_EVENTS = Object.freeze({
        connect: 1,
        connect_error: 1,
        disconnect: 1,
        disconnecting: 1,
        // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
        newListener: 1,
        removeListener: 1,
    });
    /**
     * A Socket is the fundamental class for interacting with the server.
     *
     * A Socket belongs to a certain Namespace (by default /) and uses an underlying {@link Manager} to communicate.
     *
     * @example
     * const socket = io();
     *
     * socket.on("connect", () => {
     *   console.log("connected");
     * });
     *
     * // send an event to the server
     * socket.emit("foo", "bar");
     *
     * socket.on("foobar", () => {
     *   // an event was received from the server
     * });
     *
     * // upon disconnection
     * socket.on("disconnect", (reason) => {
     *   console.log(`disconnected due to ${reason}`);
     * });
     */
    class Socket extends Emitter_1 {
        /**
         * `Socket` constructor.
         */
        constructor(io, nsp, opts) {
            super();
            /**
             * Whether the socket is currently connected to the server.
             *
             * @example
             * const socket = io();
             *
             * socket.on("connect", () => {
             *   console.log(socket.connected); // true
             * });
             *
             * socket.on("disconnect", () => {
             *   console.log(socket.connected); // false
             * });
             */
            this.connected = false;
            /**
             * Whether the connection state was recovered after a temporary disconnection. In that case, any missed packets will
             * be transmitted by the server.
             */
            this.recovered = false;
            /**
             * Buffer for packets received before the CONNECT packet
             */
            this.receiveBuffer = [];
            /**
             * Buffer for packets that will be sent once the socket is connected
             */
            this.sendBuffer = [];
            /**
             * The queue of packets to be sent with retry in case of failure.
             *
             * Packets are sent one by one, each waiting for the server acknowledgement, in order to guarantee the delivery order.
             * @private
             */
            this._queue = [];
            /**
             * A sequence to generate the ID of the {@link QueuedPacket}.
             * @private
             */
            this._queueSeq = 0;
            this.ids = 0;
            /**
             * A map containing acknowledgement handlers.
             *
             * The `withError` attribute is used to differentiate handlers that accept an error as first argument:
             *
             * - `socket.emit("test", (err, value) => { ... })` with `ackTimeout` option
             * - `socket.timeout(5000).emit("test", (err, value) => { ... })`
             * - `const value = await socket.emitWithAck("test")`
             *
             * From those that don't:
             *
             * - `socket.emit("test", (value) => { ... });`
             *
             * In the first case, the handlers will be called with an error when:
             *
             * - the timeout is reached
             * - the socket gets disconnected
             *
             * In the second case, the handlers will be simply discarded upon disconnection, since the client will never receive
             * an acknowledgement from the server.
             *
             * @private
             */
            this.acks = {};
            this.flags = {};
            this.io = io;
            this.nsp = nsp;
            if (opts && opts.auth) {
                this.auth = opts.auth;
            }
            this._opts = Object.assign({}, opts);
            if (this.io._autoConnect)
                this.open();
        }
        /**
         * Whether the socket is currently disconnected
         *
         * @example
         * const socket = io();
         *
         * socket.on("connect", () => {
         *   console.log(socket.disconnected); // false
         * });
         *
         * socket.on("disconnect", () => {
         *   console.log(socket.disconnected); // true
         * });
         */
        get disconnected() {
            return !this.connected;
        }
        /**
         * Subscribe to open, close and packet events
         *
         * @private
         */
        subEvents() {
            if (this.subs)
                return;
            const io = this.io;
            this.subs = [
                on(io, "open", this.onopen.bind(this)),
                on(io, "packet", this.onpacket.bind(this)),
                on(io, "error", this.onerror.bind(this)),
                on(io, "close", this.onclose.bind(this)),
            ];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects.
         *
         * @example
         * const socket = io();
         *
         * console.log(socket.active); // true
         *
         * socket.on("disconnect", (reason) => {
         *   if (reason === "io server disconnect") {
         *     // the disconnection was initiated by the server, you need to manually reconnect
         *     console.log(socket.active); // false
         *   }
         *   // else the socket will automatically try to reconnect
         *   console.log(socket.active); // true
         * });
         */
        get active() {
            return !!this.subs;
        }
        /**
         * "Opens" the socket.
         *
         * @example
         * const socket = io({
         *   autoConnect: false
         * });
         *
         * socket.connect();
         */
        connect() {
            if (this.connected)
                return this;
            this.subEvents();
            if (!this.io["_reconnecting"])
                this.io.open(); // ensure open
            if ("open" === this.io._readyState)
                this.onopen();
            return this;
        }
        /**
         * Alias for {@link connect()}.
         */
        open() {
            return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * This method mimics the WebSocket.send() method.
         *
         * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
         *
         * @example
         * socket.send("hello");
         *
         * // this is equivalent to
         * socket.emit("message", "hello");
         *
         * @return self
         */
        send(...args) {
            args.unshift("message");
            this.emit.apply(this, args);
            return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @example
         * socket.emit("hello", "world");
         *
         * // all serializable datastructures are supported (no need to call JSON.stringify)
         * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
         *
         * // with an acknowledgement from the server
         * socket.emit("hello", "world", (val) => {
         *   // ...
         * });
         *
         * @return self
         */
        emit(ev, ...args) {
            var _a, _b, _c;
            if (RESERVED_EVENTS.hasOwnProperty(ev)) {
                throw new Error('"' + ev.toString() + '" is a reserved event name');
            }
            args.unshift(ev);
            if (this._opts.retries && !this.flags.fromQueue && !this.flags.volatile) {
                this._addToQueue(args);
                return this;
            }
            const packet = {
                type: PacketType.EVENT,
                data: args,
            };
            packet.options = {};
            packet.options.compress = this.flags.compress !== false;
            // event ack callback
            if ("function" === typeof args[args.length - 1]) {
                const id = this.ids++;
                const ack = args.pop();
                this._registerAckCallback(id, ack);
                packet.id = id;
            }
            const isTransportWritable = (_b = (_a = this.io.engine) === null || _a === void 0 ? void 0 : _a.transport) === null || _b === void 0 ? void 0 : _b.writable;
            const isConnected = this.connected && !((_c = this.io.engine) === null || _c === void 0 ? void 0 : _c._hasPingExpired());
            const discardPacket = this.flags.volatile && !isTransportWritable;
            if (discardPacket) ;
            else if (isConnected) {
                this.notifyOutgoingListeners(packet);
                this.packet(packet);
            }
            else {
                this.sendBuffer.push(packet);
            }
            this.flags = {};
            return this;
        }
        /**
         * @private
         */
        _registerAckCallback(id, ack) {
            var _a;
            const timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;
            if (timeout === undefined) {
                this.acks[id] = ack;
                return;
            }
            // @ts-ignore
            const timer = this.io.setTimeoutFn(() => {
                delete this.acks[id];
                for (let i = 0; i < this.sendBuffer.length; i++) {
                    if (this.sendBuffer[i].id === id) {
                        this.sendBuffer.splice(i, 1);
                    }
                }
                ack.call(this, new Error("operation has timed out"));
            }, timeout);
            const fn = (...args) => {
                // @ts-ignore
                this.io.clearTimeoutFn(timer);
                ack.apply(this, args);
            };
            fn.withError = true;
            this.acks[id] = fn;
        }
        /**
         * Emits an event and waits for an acknowledgement
         *
         * @example
         * // without timeout
         * const response = await socket.emitWithAck("hello", "world");
         *
         * // with a specific timeout
         * try {
         *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
         * } catch (err) {
         *   // the server did not acknowledge the event in the given delay
         * }
         *
         * @return a Promise that will be fulfilled when the server acknowledges the event
         */
        emitWithAck(ev, ...args) {
            return new Promise((resolve, reject) => {
                const fn = (arg1, arg2) => {
                    return arg1 ? reject(arg1) : resolve(arg2);
                };
                fn.withError = true;
                args.push(fn);
                this.emit(ev, ...args);
            });
        }
        /**
         * Add the packet to the queue.
         * @param args
         * @private
         */
        _addToQueue(args) {
            let ack;
            if (typeof args[args.length - 1] === "function") {
                ack = args.pop();
            }
            const packet = {
                id: this._queueSeq++,
                tryCount: 0,
                pending: false,
                args,
                flags: Object.assign({ fromQueue: true }, this.flags),
            };
            args.push((err, ...responseArgs) => {
                if (packet !== this._queue[0]) ;
                const hasError = err !== null;
                if (hasError) {
                    if (packet.tryCount > this._opts.retries) {
                        this._queue.shift();
                        if (ack) {
                            ack(err);
                        }
                    }
                }
                else {
                    this._queue.shift();
                    if (ack) {
                        ack(null, ...responseArgs);
                    }
                }
                packet.pending = false;
                return this._drainQueue();
            });
            this._queue.push(packet);
            this._drainQueue();
        }
        /**
         * Send the first packet of the queue, and wait for an acknowledgement from the server.
         * @param force - whether to resend a packet that has not been acknowledged yet
         *
         * @private
         */
        _drainQueue(force = false) {
            if (!this.connected || this._queue.length === 0) {
                return;
            }
            const packet = this._queue[0];
            if (packet.pending && !force) {
                return;
            }
            packet.pending = true;
            packet.tryCount++;
            this.flags = packet.flags;
            this.emit.apply(this, packet.args);
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */
        packet(packet) {
            packet.nsp = this.nsp;
            this.io._packet(packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */
        onopen() {
            if (typeof this.auth == "function") {
                this.auth((data) => {
                    this._sendConnectPacket(data);
                });
            }
            else {
                this._sendConnectPacket(this.auth);
            }
        }
        /**
         * Sends a CONNECT packet to initiate the Socket.IO session.
         *
         * @param data
         * @private
         */
        _sendConnectPacket(data) {
            this.packet({
                type: PacketType.CONNECT,
                data: this._pid
                    ? Object.assign({ pid: this._pid, offset: this._lastOffset }, data)
                    : data,
            });
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */
        onerror(err) {
            if (!this.connected) {
                this.emitReserved("connect_error", err);
            }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @param description
         * @private
         */
        onclose(reason, description) {
            this.connected = false;
            delete this.id;
            this.emitReserved("disconnect", reason, description);
            this._clearAcks();
        }
        /**
         * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
         * the server.
         *
         * @private
         */
        _clearAcks() {
            Object.keys(this.acks).forEach((id) => {
                const isBuffered = this.sendBuffer.some((packet) => String(packet.id) === id);
                if (!isBuffered) {
                    // note: handlers that do not accept an error as first argument are ignored here
                    const ack = this.acks[id];
                    delete this.acks[id];
                    if (ack.withError) {
                        ack.call(this, new Error("socket has been disconnected"));
                    }
                }
            });
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */
        onpacket(packet) {
            const sameNamespace = packet.nsp === this.nsp;
            if (!sameNamespace)
                return;
            switch (packet.type) {
                case PacketType.CONNECT:
                    if (packet.data && packet.data.sid) {
                        this.onconnect(packet.data.sid, packet.data.pid);
                    }
                    else {
                        this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                    }
                    break;
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    this.onevent(packet);
                    break;
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    this.onack(packet);
                    break;
                case PacketType.DISCONNECT:
                    this.ondisconnect();
                    break;
                case PacketType.CONNECT_ERROR:
                    this.destroy();
                    const err = new Error(packet.data.message);
                    // @ts-ignore
                    err.data = packet.data.data;
                    this.emitReserved("connect_error", err);
                    break;
            }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */
        onevent(packet) {
            const args = packet.data || [];
            if (null != packet.id) {
                args.push(this.ack(packet.id));
            }
            if (this.connected) {
                this.emitEvent(args);
            }
            else {
                this.receiveBuffer.push(Object.freeze(args));
            }
        }
        emitEvent(args) {
            if (this._anyListeners && this._anyListeners.length) {
                const listeners = this._anyListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, args);
                }
            }
            super.emit.apply(this, args);
            if (this._pid && args.length && typeof args[args.length - 1] === "string") {
                this._lastOffset = args[args.length - 1];
            }
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */
        ack(id) {
            const self = this;
            let sent = false;
            return function (...args) {
                // prevent double callbacks
                if (sent)
                    return;
                sent = true;
                self.packet({
                    type: PacketType.ACK,
                    id: id,
                    data: args,
                });
            };
        }
        /**
         * Called upon a server acknowledgement.
         *
         * @param packet
         * @private
         */
        onack(packet) {
            const ack = this.acks[packet.id];
            if (typeof ack !== "function") {
                return;
            }
            delete this.acks[packet.id];
            // @ts-ignore FIXME ack is incorrectly inferred as 'never'
            if (ack.withError) {
                packet.data.unshift(null);
            }
            // @ts-ignore
            ack.apply(this, packet.data);
        }
        /**
         * Called upon server connect.
         *
         * @private
         */
        onconnect(id, pid) {
            this.id = id;
            this.recovered = pid && this._pid === pid;
            this._pid = pid; // defined only if connection state recovery is enabled
            this.connected = true;
            this.emitBuffered();
            this._drainQueue(true);
            this.emitReserved("connect");
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */
        emitBuffered() {
            this.receiveBuffer.forEach((args) => this.emitEvent(args));
            this.receiveBuffer = [];
            this.sendBuffer.forEach((packet) => {
                this.notifyOutgoingListeners(packet);
                this.packet(packet);
            });
            this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */
        ondisconnect() {
            this.destroy();
            this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */
        destroy() {
            if (this.subs) {
                // clean subscriptions to avoid reconnections
                this.subs.forEach((subDestroy) => subDestroy());
                this.subs = undefined;
            }
            this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually. In that case, the socket will not try to reconnect.
         *
         * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
         *
         * @example
         * const socket = io();
         *
         * socket.on("disconnect", (reason) => {
         *   // console.log(reason); prints "io client disconnect"
         * });
         *
         * socket.disconnect();
         *
         * @return self
         */
        disconnect() {
            if (this.connected) {
                this.packet({ type: PacketType.DISCONNECT });
            }
            // remove socket from pool
            this.destroy();
            if (this.connected) {
                // fire events
                this.onclose("io client disconnect");
            }
            return this;
        }
        /**
         * Alias for {@link disconnect()}.
         *
         * @return self
         */
        close() {
            return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @example
         * socket.compress(false).emit("hello");
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         */
        compress(compress) {
            this.flags.compress = compress;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @example
         * socket.volatile.emit("hello"); // the server may or may not receive it
         *
         * @returns self
         */
        get volatile() {
            this.flags.volatile = true;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
         * given number of milliseconds have elapsed without an acknowledgement from the server:
         *
         * @example
         * socket.timeout(5000).emit("my-event", (err) => {
         *   if (err) {
         *     // the server did not acknowledge the event in the given delay
         *   }
         * });
         *
         * @returns self
         */
        timeout(timeout) {
            this.flags.timeout = timeout;
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @example
         * socket.onAny((event, ...args) => {
         *   console.log(`got ${event}`);
         * });
         *
         * @param listener
         */
        onAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @example
         * socket.prependAny((event, ...args) => {
         *   console.log(`got event ${event}`);
         * });
         *
         * @param listener
         */
        prependAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @example
         * const catchAllListener = (event, ...args) => {
         *   console.log(`got event ${event}`);
         * }
         *
         * socket.onAny(catchAllListener);
         *
         * // remove a specific listener
         * socket.offAny(catchAllListener);
         *
         * // or remove all listeners
         * socket.offAny();
         *
         * @param listener
         */
        offAny(listener) {
            if (!this._anyListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         */
        listenersAny() {
            return this._anyListeners || [];
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * Note: acknowledgements sent to the server are not included.
         *
         * @example
         * socket.onAnyOutgoing((event, ...args) => {
         *   console.log(`sent event ${event}`);
         * });
         *
         * @param listener
         */
        onAnyOutgoing(listener) {
            this._anyOutgoingListeners = this._anyOutgoingListeners || [];
            this._anyOutgoingListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * Note: acknowledgements sent to the server are not included.
         *
         * @example
         * socket.prependAnyOutgoing((event, ...args) => {
         *   console.log(`sent event ${event}`);
         * });
         *
         * @param listener
         */
        prependAnyOutgoing(listener) {
            this._anyOutgoingListeners = this._anyOutgoingListeners || [];
            this._anyOutgoingListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @example
         * const catchAllListener = (event, ...args) => {
         *   console.log(`sent event ${event}`);
         * }
         *
         * socket.onAnyOutgoing(catchAllListener);
         *
         * // remove a specific listener
         * socket.offAnyOutgoing(catchAllListener);
         *
         * // or remove all listeners
         * socket.offAnyOutgoing();
         *
         * @param [listener] - the catch-all listener (optional)
         */
        offAnyOutgoing(listener) {
            if (!this._anyOutgoingListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyOutgoingListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyOutgoingListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         */
        listenersAnyOutgoing() {
            return this._anyOutgoingListeners || [];
        }
        /**
         * Notify the listeners for each packet sent
         *
         * @param packet
         *
         * @private
         */
        notifyOutgoingListeners(packet) {
            if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
                const listeners = this._anyOutgoingListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, packet.data);
                }
            }
        }
    }

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */
    function Backoff(opts) {
        opts = opts || {};
        this.ms = opts.min || 100;
        this.max = opts.max || 10000;
        this.factor = opts.factor || 2;
        this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
        this.attempts = 0;
    }
    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */
    Backoff.prototype.duration = function () {
        var ms = this.ms * Math.pow(this.factor, this.attempts++);
        if (this.jitter) {
            var rand = Math.random();
            var deviation = Math.floor(rand * this.jitter * ms);
            ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
        }
        return Math.min(ms, this.max) | 0;
    };
    /**
     * Reset the number of attempts.
     *
     * @api public
     */
    Backoff.prototype.reset = function () {
        this.attempts = 0;
    };
    /**
     * Set the minimum duration
     *
     * @api public
     */
    Backoff.prototype.setMin = function (min) {
        this.ms = min;
    };
    /**
     * Set the maximum duration
     *
     * @api public
     */
    Backoff.prototype.setMax = function (max) {
        this.max = max;
    };
    /**
     * Set the jitter
     *
     * @api public
     */
    Backoff.prototype.setJitter = function (jitter) {
        this.jitter = jitter;
    };

    class Manager extends Emitter_1 {
        constructor(uri, opts) {
            var _a;
            super();
            this.nsps = {};
            this.subs = [];
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = undefined;
            }
            opts = opts || {};
            opts.path = opts.path || "/socket.io";
            this.opts = opts;
            installTimerFunctions(this, opts);
            this.reconnection(opts.reconnection !== false);
            this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
            this.reconnectionDelay(opts.reconnectionDelay || 1000);
            this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
            this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);
            this.backoff = new Backoff({
                min: this.reconnectionDelay(),
                max: this.reconnectionDelayMax(),
                jitter: this.randomizationFactor(),
            });
            this.timeout(null == opts.timeout ? 20000 : opts.timeout);
            this._readyState = "closed";
            this.uri = uri;
            const _parser = opts.parser || parser;
            this.encoder = new _parser.Encoder();
            this.decoder = new _parser.Decoder();
            this._autoConnect = opts.autoConnect !== false;
            if (this._autoConnect)
                this.open();
        }
        reconnection(v) {
            if (!arguments.length)
                return this._reconnection;
            this._reconnection = !!v;
            if (!v) {
                this.skipReconnect = true;
            }
            return this;
        }
        reconnectionAttempts(v) {
            if (v === undefined)
                return this._reconnectionAttempts;
            this._reconnectionAttempts = v;
            return this;
        }
        reconnectionDelay(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelay;
            this._reconnectionDelay = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
            return this;
        }
        randomizationFactor(v) {
            var _a;
            if (v === undefined)
                return this._randomizationFactor;
            this._randomizationFactor = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
            return this;
        }
        reconnectionDelayMax(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelayMax;
            this._reconnectionDelayMax = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
            return this;
        }
        timeout(v) {
            if (!arguments.length)
                return this._timeout;
            this._timeout = v;
            return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */
        maybeReconnectOnOpen() {
            // Only try to reconnect if it's the first time we're connecting
            if (!this._reconnecting &&
                this._reconnection &&
                this.backoff.attempts === 0) {
                // keeps reconnection from firing twice for the same reconnection loop
                this.reconnect();
            }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */
        open(fn) {
            if (~this._readyState.indexOf("open"))
                return this;
            this.engine = new Socket$1(this.uri, this.opts);
            const socket = this.engine;
            const self = this;
            this._readyState = "opening";
            this.skipReconnect = false;
            // emit `open`
            const openSubDestroy = on(socket, "open", function () {
                self.onopen();
                fn && fn();
            });
            const onError = (err) => {
                this.cleanup();
                this._readyState = "closed";
                this.emitReserved("error", err);
                if (fn) {
                    fn(err);
                }
                else {
                    // Only do this if there is no fn to handle the error
                    this.maybeReconnectOnOpen();
                }
            };
            // emit `error`
            const errorSub = on(socket, "error", onError);
            if (false !== this._timeout) {
                const timeout = this._timeout;
                // set timer
                const timer = this.setTimeoutFn(() => {
                    openSubDestroy();
                    onError(new Error("timeout"));
                    socket.close();
                }, timeout);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(() => {
                    this.clearTimeoutFn(timer);
                });
            }
            this.subs.push(openSubDestroy);
            this.subs.push(errorSub);
            return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */
        connect(fn) {
            return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */
        onopen() {
            // clear old subs
            this.cleanup();
            // mark as open
            this._readyState = "open";
            this.emitReserved("open");
            // add new subs
            const socket = this.engine;
            this.subs.push(on(socket, "ping", this.onping.bind(this)), on(socket, "data", this.ondata.bind(this)), on(socket, "error", this.onerror.bind(this)), on(socket, "close", this.onclose.bind(this)), 
            // @ts-ignore
            on(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */
        onping() {
            this.emitReserved("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */
        ondata(data) {
            try {
                this.decoder.add(data);
            }
            catch (e) {
                this.onclose("parse error", e);
            }
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */
        ondecoded(packet) {
            // the nextTick call prevents an exception in a user-provided event listener from triggering a disconnection due to a "parse error"
            nextTick(() => {
                this.emitReserved("packet", packet);
            }, this.setTimeoutFn);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */
        onerror(err) {
            this.emitReserved("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */
        socket(nsp, opts) {
            let socket = this.nsps[nsp];
            if (!socket) {
                socket = new Socket(this, nsp, opts);
                this.nsps[nsp] = socket;
            }
            else if (this._autoConnect && !socket.active) {
                socket.connect();
            }
            return socket;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */
        _destroy(socket) {
            const nsps = Object.keys(this.nsps);
            for (const nsp of nsps) {
                const socket = this.nsps[nsp];
                if (socket.active) {
                    return;
                }
            }
            this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */
        _packet(packet) {
            const encodedPackets = this.encoder.encode(packet);
            for (let i = 0; i < encodedPackets.length; i++) {
                this.engine.write(encodedPackets[i], packet.options);
            }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */
        cleanup() {
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs.length = 0;
            this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */
        _close() {
            this.skipReconnect = true;
            this._reconnecting = false;
            this.onclose("forced close");
        }
        /**
         * Alias for close()
         *
         * @private
         */
        disconnect() {
            return this._close();
        }
        /**
         * Called when:
         *
         * - the low-level engine is closed
         * - the parser encountered a badly formatted packet
         * - all sockets are disconnected
         *
         * @private
         */
        onclose(reason, description) {
            var _a;
            this.cleanup();
            (_a = this.engine) === null || _a === void 0 ? void 0 : _a.close();
            this.backoff.reset();
            this._readyState = "closed";
            this.emitReserved("close", reason, description);
            if (this._reconnection && !this.skipReconnect) {
                this.reconnect();
            }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */
        reconnect() {
            if (this._reconnecting || this.skipReconnect)
                return this;
            const self = this;
            if (this.backoff.attempts >= this._reconnectionAttempts) {
                this.backoff.reset();
                this.emitReserved("reconnect_failed");
                this._reconnecting = false;
            }
            else {
                const delay = this.backoff.duration();
                this._reconnecting = true;
                const timer = this.setTimeoutFn(() => {
                    if (self.skipReconnect)
                        return;
                    this.emitReserved("reconnect_attempt", self.backoff.attempts);
                    // check again for the case socket closed in above events
                    if (self.skipReconnect)
                        return;
                    self.open((err) => {
                        if (err) {
                            self._reconnecting = false;
                            self.reconnect();
                            this.emitReserved("reconnect_error", err);
                        }
                        else {
                            self.onreconnect();
                        }
                    });
                }, delay);
                if (this.opts.autoUnref) {
                    timer.unref();
                }
                this.subs.push(() => {
                    this.clearTimeoutFn(timer);
                });
            }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */
        onreconnect() {
            const attempt = this.backoff.attempts;
            this._reconnecting = false;
            this.backoff.reset();
            this.emitReserved("reconnect", attempt);
        }
    }

    /**
     * Managers cache.
     */
    const cache = {};
    function lookup(uri, opts) {
        if (typeof uri === "object") {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};
        const parsed = url(uri, opts.path || "/socket.io");
        const source = parsed.source;
        const id = parsed.id;
        const path = parsed.path;
        const sameNamespace = cache[id] && path in cache[id]["nsps"];
        const newConnection = opts.forceNew ||
            opts["force new connection"] ||
            false === opts.multiplex ||
            sameNamespace;
        let io;
        if (newConnection) {
            io = new Manager(source, opts);
        }
        else {
            if (!cache[id]) {
                cache[id] = new Manager(source, opts);
            }
            io = cache[id];
        }
        if (parsed.query && !opts.query) {
            opts.query = parsed.queryKey;
        }
        return io.socket(parsed.path, opts);
    }
    // so that "lookup" can be used both as a function (e.g. `io(...)`) and as a
    // namespace (e.g. `io.connect(...)`), for backward compatibility
    Object.assign(lookup, {
        Manager,
        Socket,
        io: lookup,
        connect: lookup,
    });

    const SupportDashboard = () => {
      const [conversations, setConversations] = React.useState({}); // { userId: { messages: [], customerName: '', customerPhone: '' } }
      const [selectedUserId, setSelectedUserId] = React.useState(null);
      const [replyText, setReplyText] = React.useState('');
      const [socket, setSocket] = React.useState(null);
      const lastMessageRef = React.useRef(null);
      const audioRef = React.useRef(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'));
      new adminjs.ApiClient();
      React.useEffect(() => {
        const newSocket = lookup(window.location.origin, {
          transports: ['websocket']
        });
        setSocket(newSocket);
        newSocket.emit('joinSupport', 'admin');
        newSocket.on('adminNewMessage', data => {
          const {
            userId,
            message,
            customerName,
            customerPhone
          } = data;

          // Play sound if message is from a customer
          if (message.sender === 'customer') {
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
          }
          setConversations(prev => {
            const existing = prev[userId] || {
              messages: [],
              customerName: customerName || 'New User',
              customerPhone: customerPhone || ''
            };
            return {
              ...prev,
              [userId]: {
                ...existing,
                customerName: customerName || existing.customerName,
                customerPhone: customerPhone || existing.customerPhone,
                messages: [...existing.messages, message]
              }
            };
          });
        });
        return () => newSocket.disconnect();
      }, []);
      React.useEffect(() => {
        if (lastMessageRef.current) {
          lastMessageRef.current.scrollIntoView({
            behavior: 'smooth'
          });
        }
      }, [selectedUserId, conversations]);
      const handleSend = () => {
        if (!replyText.trim() || !selectedUserId || !socket) return;
        socket.emit('supportChatMessage', {
          userId: selectedUserId,
          sender: 'support',
          message: replyText
        });
        setReplyText('');
      };
      const activeUsers = Object.keys(conversations);
      return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        variant: "white",
        display: "flex",
        flexDirection: "row",
        height: "100vh"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        width: "300px",
        borderRight: "1px solid #eee",
        overflowY: "auto",
        backgroundColor: "grey20"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        padding: "xl",
        borderBottom: "1px solid #eee"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontWeight: "bold",
        fontSize: "lg"
      }, "Active Chats")), activeUsers.length === 0 ? /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        padding: "xl"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "grey60"
      }, "No active chats...")) : activeUsers.map(uid => /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        key: uid,
        padding: "l",
        onClick: () => setSelectedUserId(uid),
        cursor: "pointer",
        backgroundColor: selectedUserId === uid ? 'white' : 'transparent',
        borderBottom: "1px solid #eee"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        display: "flex",
        flexDirection: "row",
        alignItems: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Icon, {
        icon: "User",
        size: 16,
        marginRight: "s",
        color: "primary100"
      }), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontWeight: "bold"
      }, conversations[uid].customerName)), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontSize: "xs",
        color: "grey40",
        marginTop: "xs"
      }, conversations[uid].customerPhone), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontSize: "sm",
        color: "grey60",
        marginTop: "s",
        numberOfLines: 1
      }, conversations[uid].messages.slice(-1)[0]?.message)))), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "white"
      }, selectedUserId ? /*#__PURE__*/React__default.default.createElement(React__default.default.Fragment, null, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        padding: "xl",
        borderBottom: "1px solid #eee",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontWeight: "bold",
        fontSize: "lg"
      }, conversations[selectedUserId].customerName), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontSize: "xs",
        color: "grey60"
      }, conversations[selectedUserId].customerPhone)), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        display: "flex",
        alignItems: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        width: "8px",
        height: "8px",
        borderRadius: "4px",
        backgroundColor: "green",
        marginRight: "s"
      }), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontSize: "xs",
        color: "green"
      }, "Connected"))), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        flex: 1,
        padding: "xl",
        overflowY: "auto"
      }, conversations[selectedUserId].messages.map((msg, idx) => {
        const isMe = msg.sender === 'support';
        return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
          key: idx,
          marginVertical: "s",
          display: "flex",
          flexDirection: "column",
          alignItems: isMe ? 'flex-end' : 'flex-start'
        }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
          padding: "m",
          backgroundColor: isMe ? 'primary100' : 'grey20',
          color: isMe ? 'white' : 'black',
          borderRadius: "default",
          maxWidth: "70%"
        }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, null, msg.message)), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
          fontSize: "xs",
          color: "grey60",
          marginTop: "xs"
        }, new Date(msg.createdAt).toLocaleTimeString()));
      }), /*#__PURE__*/React__default.default.createElement("div", {
        ref: lastMessageRef
      })), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        padding: "xl",
        borderTop: "1px solid #eee",
        display: "flex"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.TextArea, {
        flex: 1,
        value: replyText,
        onChange: e => setReplyText(e.target.value),
        placeholder: "Type WhatsApp-style reply...",
        onKeyDown: e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }
      }), /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
        marginLeft: "m",
        variant: "primary",
        onClick: handleSend
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Icon, {
        icon: "Send"
      })))) : /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        textAlign: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Icon, {
        icon: "MessageSquare",
        size: 48,
        color: "grey40"
      }), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        marginTop: "m",
        color: "grey60"
      }, "Select a conversation to start chatting")))));
    };

    const SendNotification = props => {
      const {
        record,
        resource,
        action
      } = props;
      const [title, setTitle] = React.useState('');
      const [body, setBody] = React.useState('');
      const [pushToDrivers, setPushToDrivers] = React.useState(false);
      const [loading, setLoading] = React.useState(false);
      const [successMessage, setSuccessMessage] = React.useState('');
      const [errorMessage, setErrorMessage] = React.useState('');
      const api = new adminjs.ApiClient();
      const handleSend = async () => {
        setSuccessMessage('');
        setErrorMessage('');
        if (!title || !body) {
          setErrorMessage('Title and Body are absolutely required. Please fill them out.');
          return;
        }
        setLoading(true);
        try {
          const payload = {
            title,
            body,
            userType: pushToDrivers ? "DeliveryPartner" : "Customer"
          };

          // If it's a record action (Individual), we already have the user ID context via recordId
          // If it's a resource action (Broadcast), it broadcasts to the chosen userType
          const response = await api.resourceAction({
            resourceId: resource.id,
            actionName: action.name,
            method: 'post',
            data: payload,
            recordId: record ? record.id : undefined
          });
          if (response.data.notice && response.data.notice.type === 'success') {
            setSuccessMessage(response.data.notice.message);
          } else {
            setSuccessMessage('Notification sent successfully!');
          }

          // Reset form after success if it's a broadcast
          if (!record) {
            setTitle('');
            setBody('');
          }
        } catch (error) {
          console.error('Failed to send notification:', error);
          setErrorMessage('Error sending notification. Please check server logs.');
        } finally {
          setLoading(false);
        }
      };
      return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        variant: "white",
        padding: "xxl",
        style: {
          maxWidth: 600,
          margin: '0 auto',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "h3",
        mb: "lg",
        fontWeight: "bold"
      }, record ? `Direct Message: ${record.params.name || 'User'}` : 'Broadcast Push Notification'), record && /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm",
        color: "grey60",
        mb: "xl"
      }, "This notification will be sent immediately to a single device (if they have push notifications enabled)."), successMessage && /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mb: "lg"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.MessageBox, {
        variant: "success",
        message: successMessage
      })), errorMessage && /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mb: "lg"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.MessageBox, {
        variant: "danger",
        message: errorMessage
      })), !record && /*#__PURE__*/React__default.default.createElement(designSystem.FormGroup, null, /*#__PURE__*/React__default.default.createElement(designSystem.Label, {
        fontWeight: "bold"
      }, "Select Target Audience"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm",
        color: "grey60",
        mb: "default"
      }, "Who should receive this broadcast alert on their mobile devices?"), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        flex: true,
        flexDirection: "row",
        alignItems: "center",
        mt: "sm"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
        variant: !pushToDrivers ? "primary" : "secondary",
        onClick: () => setPushToDrivers(false),
        mr: "default",
        size: "lg"
      }, "\uD83D\uDECD\uFE0F All Customers"), /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
        variant: pushToDrivers ? "primary" : "secondary",
        onClick: () => setPushToDrivers(true),
        size: "lg"
      }, "\uD83D\uDEF5 All Drivers"))), /*#__PURE__*/React__default.default.createElement(designSystem.FormGroup, {
        mt: "xl"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Label, {
        fontWeight: "bold"
      }, "Notification Title"), /*#__PURE__*/React__default.default.createElement(designSystem.Input, {
        value: title,
        onChange: e => setTitle(e.target.value),
        placeholder: pushToDrivers ? "e.g., Rain Surge Active! 🌧️" : "e.g., Flash Sale! ⚡️",
        width: 1,
        size: "lg"
      })), /*#__PURE__*/React__default.default.createElement(designSystem.FormGroup, null, /*#__PURE__*/React__default.default.createElement(designSystem.Label, {
        fontWeight: "bold"
      }, "Notification Body"), /*#__PURE__*/React__default.default.createElement(designSystem.TextArea, {
        value: body,
        onChange: e => setBody(e.target.value),
        placeholder: pushToDrivers ? "Login now to earn extra ₹20 per order!" : "Get 50% off on all fresh vegetables for the next 2 hours!",
        rows: 5,
        width: 1
      })), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "xxl",
        pt: "lg",
        borderTop: "1px solid #eee"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
        variant: "primary",
        onClick: handleSend,
        disabled: loading,
        size: "lg",
        style: {
          width: '100%',
          justifyContent: 'center'
        }
      }, loading ? 'Sending & Delivering...' : record ? 'Send Direct Message Now' : `Broadcast to ${pushToDrivers ? 'All Drivers' : 'All Customers'}`)), !record && /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "lg",
        textAlign: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm",
        color: "grey40"
      }, "\u26A1\uFE0F Broadcasts are sent asynchronously via Expo servers.")));
    };

    const PremiumCard = styled.styled(designSystem.Box)`
  background: white;
  border-radius: 24px;
  padding: 32px;
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.15);
    border-color: #10b981;
  }
`;
    const StatLabel = styled.styled(designSystem.Text)`
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;
    const StatValue = styled.styled(designSystem.Text)`
  font-size: 44px;
  font-weight: 900;
  color: #1e293b;
  margin-top: 8px;
  line-height: 1;
`;
    const ActionButton = styled.styled(designSystem.Box)`
  display: flex;
  align-items: center;
  padding: 16px 24px;
  background: #f8fafc;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  width: 100%;
  text-decoration: none;
  color: inherit;
  &:hover {
    background: #ffffff;
    border-color: #10b981;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    transform: translateX(4px);
  }
`;
    const Dashboard = () => {
      const [stats, setStats] = React.useState({
        totalOrders: 0,
        activeCustomers: 0,
        lowStockAlerts: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        inventoryProfit: 0
      });
      const [recentOrders, setRecentOrders] = React.useState([]);
      const [loading, setLoading] = React.useState(true);
      React.useEffect(() => {
        const fetchMetrics = async () => {
          try {
            const api = new adminjs.ApiClient();
            // We use the configured resource IDs. 
            // Note: 'Order' might be registered multiple times, but AdminJS usually keeps the last one or the one with specific ID.
            // In our setup, 'Order' is the primary one, and 'OrderAssignment' is the secondary.

            const [ordersRes, pendingOrdersRes, customersRes, lowStockRes, deliveredOrdersRes, recentOrdersRes] = await Promise.all([api.resourceAction({
              resourceId: 'Order',
              actionName: 'list',
              params: {
                perPage: 1
              }
            }), api.resourceAction({
              resourceId: 'Order',
              actionName: 'list',
              params: {
                'filters.status': 'available',
                perPage: 1
              }
            }), api.resourceAction({
              resourceId: 'Customer',
              actionName: 'list',
              params: {
                perPage: 1
              }
            }), api.resourceAction({
              resourceId: 'Product',
              actionName: 'list',
              params: {
                'filters.stock~~lte': 10,
                perPage: 1
              }
            }), api.resourceAction({
              resourceId: 'Order',
              actionName: 'list',
              params: {
                'filters.status': 'delivered',
                perPage: 100,
                sortBy: 'createdAt',
                direction: 'desc'
              }
            }), api.resourceAction({
              resourceId: 'Order',
              actionName: 'list',
              params: {
                perPage: 5,
                sortBy: 'createdAt',
                direction: 'desc'
              }
            })]);

            // Helper to extract total from AdminJS response structure
            const getTotal = res => {
              if (res?.data?.meta?.total !== undefined) return res.data.meta.total;
              if (res?.meta?.total !== undefined) return res.meta.total;
              return 0;
            };
            const getRecords = res => {
              if (res?.data?.records) return res.data.records;
              if (res?.records) return res.records;
              return [];
            };

            // Calculate revenue from delivered orders
            const deliveredRecords = getRecords(deliveredOrdersRes);
            let totalRevenue = 0;
            deliveredRecords.forEach(order => {
              const price = parseFloat(order.params?.totalPrice || 0);
              if (!isNaN(price)) totalRevenue += price;
            });
            setStats({
              totalOrders: getTotal(ordersRes),
              pendingOrders: getTotal(pendingOrdersRes),
              activeCustomers: getTotal(customersRes),
              lowStockAlerts: getTotal(lowStockRes),
              totalRevenue: Math.round(totalRevenue),
              inventoryProfit: Math.round(totalRevenue * 0.3) // Approximate; exact value from Manager API
            });
            setRecentOrders(getRecords(recentOrdersRes));
          } catch (error) {
            console.error("Dashboard fetch error:", error);
          } finally {
            setLoading(false);
          }
        };
        fetchMetrics();
      }, []);
      if (loading) {
        return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
          p: "xl",
          bg: "#f8fafc",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }, /*#__PURE__*/React__default.default.createElement(designSystem.Loader, {
          color: "#10b981"
        }));
      }
      return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        p: "xxl",
        bg: "#f8fafc",
        minHeight: "100vh"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mb: "xxxl",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "#0f172a",
        fontSize: "40px",
        fontWeight: "900",
        letterSpacing: "-0.02em"
      }, "Store Insights"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "#64748b",
        mt: "xs",
        fontSize: "18px"
      }, "Real-time performance from your SabJab database.")), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        display: ['none', 'block']
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
        variant: "primary",
        as: "a",
        href: "/admin/resources/Product/actions/new"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Icon, {
        icon: "Plus",
        mr: "sm"
      }), "Add New Item"))), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        display: "grid",
        gridTemplateColumns: ["1fr", "1fr 1fr", "1fr 1fr 1fr"],
        gridGap: "32px",
        mb: "xxxl"
      }, /*#__PURE__*/React__default.default.createElement(PremiumCard, null, /*#__PURE__*/React__default.default.createElement(StatLabel, null, "Growth Metrics"), /*#__PURE__*/React__default.default.createElement(StatValue, null, stats.totalOrders), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "md",
        display: "flex",
        alignItems: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "#10b981",
        fontWeight: "bold",
        variant: "sm"
      }, "Total Orders Placed"))), /*#__PURE__*/React__default.default.createElement(PremiumCard, null, /*#__PURE__*/React__default.default.createElement(StatLabel, null, "Customer Base"), /*#__PURE__*/React__default.default.createElement(StatValue, null, stats.activeCustomers), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "md",
        display: "flex",
        alignItems: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "#3b82f6",
        fontWeight: "bold",
        variant: "sm"
      }, "Registered Users"))), /*#__PURE__*/React__default.default.createElement(PremiumCard, {
        borderLeft: "4px solid #facc15"
      }, /*#__PURE__*/React__default.default.createElement(StatLabel, null, "Pending Ops"), /*#__PURE__*/React__default.default.createElement(StatValue, {
        color: stats.pendingOrders > 0 ? "#854d0e" : "#10b981"
      }, stats.pendingOrders), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "md",
        display: "flex",
        alignItems: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "#854d0e",
        fontWeight: "bold",
        variant: "sm"
      }, "Unassigned Orders"))), /*#__PURE__*/React__default.default.createElement(PremiumCard, {
        borderLeft: "4px solid #ef4444"
      }, /*#__PURE__*/React__default.default.createElement(StatLabel, null, "Inventory Help"), /*#__PURE__*/React__default.default.createElement(StatValue, {
        color: stats.lowStockAlerts > 0 ? "#991b1b" : "#10b981"
      }, stats.lowStockAlerts), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "md",
        display: "flex",
        alignItems: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "#991b1b",
        fontWeight: "bold",
        variant: "sm"
      }, "Low Stock Alerts"))), /*#__PURE__*/React__default.default.createElement(PremiumCard, {
        borderLeft: "4px solid #06b6d4"
      }, /*#__PURE__*/React__default.default.createElement(StatLabel, null, "Revenue"), /*#__PURE__*/React__default.default.createElement(StatValue, null, "\u20B9", (stats.totalRevenue || 0).toLocaleString()), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "md",
        display: "flex",
        alignItems: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "#06b6d4",
        fontWeight: "bold",
        variant: "sm"
      }, "Total Delivered Revenue"))), /*#__PURE__*/React__default.default.createElement(PremiumCard, {
        borderLeft: "4px solid #10b981"
      }, /*#__PURE__*/React__default.default.createElement(StatLabel, null, "Inventory Profit"), /*#__PURE__*/React__default.default.createElement(StatValue, {
        color: "#10b981"
      }, "\u20B9", (stats.inventoryProfit || 0).toLocaleString()), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "md",
        display: "flex",
        alignItems: "center"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "#10b981",
        fontWeight: "bold",
        variant: "sm"
      }, "Quick Orders Only")))), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mb: "xxxl"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "#0f172a",
        fontSize: "24px",
        fontWeight: "800",
        mb: "xl"
      }, "Browse Products by Alphabet"), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        bg: "white",
        p: "xl",
        borderRadius: "24px",
        border: "1px solid #f1f5f9",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        display: "flex",
        flexWrap: "wrap",
        style: {
          gap: '8px'
        }
      }, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
        key: letter,
        size: "sm",
        variant: "light",
        as: "a",
        href: `/admin/resources/Product?letter=${letter}`,
        style: {
          minWidth: '42px',
          height: '42px',
          borderRadius: '12px'
        }
      }, letter)), /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
        size: "sm",
        variant: "primary",
        as: "a",
        href: "/admin/resources/Product",
        style: {
          padding: '0 20px',
          height: '42px',
          borderRadius: '12px'
        }
      }, "VIEW ALL PRODUCTS")))), recentOrders.length > 0 && /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mb: "xxxl"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "#0f172a",
        fontSize: "24px",
        fontWeight: "800",
        mb: "xl"
      }, "Live Activity Feed"), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        bg: "white",
        p: "xl",
        borderRadius: "24px",
        border: "1px solid #f1f5f9"
      }, /*#__PURE__*/React__default.default.createElement(Table, {
        width: "100%"
      }, /*#__PURE__*/React__default.default.createElement(TableHead, null, /*#__PURE__*/React__default.default.createElement(TableRow, null, /*#__PURE__*/React__default.default.createElement(TableCell, null, "Order ID"), /*#__PURE__*/React__default.default.createElement(TableCell, null, "Price"), /*#__PURE__*/React__default.default.createElement(TableCell, null, "Status"), /*#__PURE__*/React__default.default.createElement(TableCell, null, "Date"), /*#__PURE__*/React__default.default.createElement(TableCell, null))), /*#__PURE__*/React__default.default.createElement(TableBody, null, recentOrders.map(order => /*#__PURE__*/React__default.default.createElement(TableRow, {
        key: order.id
      }, /*#__PURE__*/React__default.default.createElement(TableCell, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontWeight: "bold"
      }, order.params.orderId || order.id)), /*#__PURE__*/React__default.default.createElement(TableCell, null, "\u20B9", order.params.totalPrice), /*#__PURE__*/React__default.default.createElement(TableCell, null, /*#__PURE__*/React__default.default.createElement(Badge, {
        variant: order.params.status === 'delivered' ? 'success' : 'info'
      }, order.params.status)), /*#__PURE__*/React__default.default.createElement(TableCell, null, new Date(order.params.createdAt).toLocaleDateString()), /*#__PURE__*/React__default.default.createElement(TableCell, null, /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
        size: "sm",
        as: "a",
        href: `/admin/resources/Order/records/${order.id}/show`
      }, "View")))))))), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        display: "grid",
        gridTemplateColumns: ["1fr", "1fr", "2fr 1fr"],
        gridGap: "40px"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "#0f172a",
        fontSize: "24px",
        fontWeight: "800",
        mb: "xl"
      }, "Resource Shortcuts"), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        display: "grid",
        gridTemplateColumns: ["1fr", "1fr 1fr"],
        gridGap: "16px"
      }, /*#__PURE__*/React__default.default.createElement(ActionButton, {
        as: "a",
        href: "/admin/resources/Order"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        bg: "rgba(16, 185, 129, 0.1)",
        p: "md",
        borderRadius: "12px",
        mr: "md"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Icon, {
        icon: "ShoppingCart",
        color: "#10b981"
      })), /*#__PURE__*/React__default.default.createElement(designSystem.Box, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontWeight: "bold"
      }, "Orders Queue"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm",
        color: "#64748b"
      }, "Live fulfillment center"))), /*#__PURE__*/React__default.default.createElement(ActionButton, {
        as: "a",
        href: "/admin/resources/Product"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        bg: "rgba(59, 130, 246, 0.1)",
        p: "md",
        borderRadius: "12px",
        mr: "md"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Icon, {
        icon: "Package",
        color: "#3b82f6"
      })), /*#__PURE__*/React__default.default.createElement(designSystem.Box, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontWeight: "bold"
      }, "Inventory Manager"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm",
        color: "#64748b"
      }, "Update items and pricing"))), /*#__PURE__*/React__default.default.createElement(ActionButton, {
        as: "a",
        href: "/admin/resources/Coupon"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        bg: "rgba(244, 63, 94, 0.1)",
        p: "md",
        borderRadius: "12px",
        mr: "md"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Icon, {
        icon: "Tag",
        color: "#f43f5e"
      })), /*#__PURE__*/React__default.default.createElement(designSystem.Box, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontWeight: "bold"
      }, "Campaign Hub"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm",
        color: "#64748b"
      }, "Marketing & Discounts"))), /*#__PURE__*/React__default.default.createElement(ActionButton, {
        as: "a",
        href: "/admin/resources/Customer"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        bg: "rgba(107, 114, 128, 0.1)",
        p: "md",
        borderRadius: "12px",
        mr: "md"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Icon, {
        icon: "Users",
        color: "#6b7280"
      })), /*#__PURE__*/React__default.default.createElement(designSystem.Box, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontWeight: "bold"
      }, "User Directory"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm",
        color: "#64748b"
      }, "Database of all users"))))), /*#__PURE__*/React__default.default.createElement(designSystem.Box, null, /*#__PURE__*/React__default.default.createElement(PremiumCard, {
        bg: "#047857"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "white",
        fontSize: "20px",
        fontWeight: "900",
        mb: "md"
      }, "System Maintenance"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "rgba(255,255,255,0.8)",
        mb: "xl",
        lineHeight: "1.6"
      }, "Running in production mode. Data is synced in real-time with Mongo Atlas."), /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
        variant: "secondary",
        as: "a",
        href: "/admin/pages/Component Guide",
        width: "100%"
      }, "Builder Instructions")))));
    };

    const AssignDriver = props => {
      const {
        record,
        resource,
        action
      } = props;
      const [drivers, setDrivers] = React.useState([]);
      const [selectedDriverId, setSelectedDriverId] = React.useState('');
      const [deliveryFee, setDeliveryFee] = React.useState(record.params.driverEarning || '');
      const [loading, setLoading] = React.useState(false);
      const [fetching, setFetching] = React.useState(true);
      const api = new adminjs.ApiClient();
      React.useEffect(() => {
        const fetchDrivers = async () => {
          try {
            // Fetch DeliveryPartner resource records
            const response = await api.resourceAction({
              resourceId: 'DeliveryPartner',
              actionName: 'list'
            });
            if (response.data.records) {
              const activeDrivers = response.data.records.filter(r => r.params.isActivated === true || r.params.isActivated === 'true').map(r => ({
                value: r.id,
                label: `${r.params.name} (${r.params.email})`
              }));
              setDrivers(activeDrivers);
            }
          } catch (error) {
            console.error('Failed to fetch drivers:', error);
          } finally {
            setFetching(false);
          }
        };
        fetchDrivers();
      }, []);
      const handleAssign = async () => {
        if (!selectedDriverId) {
          alert('Please select a driver');
          return;
        }
        setLoading(true);
        try {
          const response = await api.resourceAction({
            resourceId: resource.id,
            actionName: action.name,
            method: 'post',
            data: {
              driverId: selectedDriverId,
              driverEarning: deliveryFee
            },
            recordId: record.id
          });
          if (response.data.notice) {
            alert(response.data.notice.message);
            // Intelligent redirect based on current resource
            if (resource.id === 'OrderAssignment') {
              window.location.href = `/admin/resources/OrderAssignment`;
            } else {
              window.location.href = `/admin/resources/Order/records/${record.id}/show`;
            }
          }
        } catch (error) {
          console.error('Failed to assign driver:', error);
          const errMsg = error.response?.data?.notice?.message || error.message || 'Unknown error';
          alert(`Error assigning driver: ${errMsg}`);
        } finally {
          setLoading(false);
        }
      };
      if (fetching) return /*#__PURE__*/React__default.default.createElement(designSystem.Loader, null);
      return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        variant: "white",
        padding: "xl",
        minHeight: "400px"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "lg",
        mb: "xl"
      }, "Assign Driver to Order ", record.params.orderId || "N/A"), /*#__PURE__*/React__default.default.createElement(designSystem.FormGroup, null, /*#__PURE__*/React__default.default.createElement(designSystem.Label, null, "Select Delivery Partner"), /*#__PURE__*/React__default.default.createElement(designSystem.Select, {
        value: drivers.find(d => d.value === selectedDriverId),
        options: drivers,
        onChange: selected => setSelectedDriverId(selected.value)
      })), /*#__PURE__*/React__default.default.createElement(designSystem.FormGroup, {
        mt: "lg"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Label, null, "Delivery Fee (\u20B9)"), /*#__PURE__*/React__default.default.createElement("input", {
        type: "number",
        value: deliveryFee,
        onChange: e => setDeliveryFee(e.target.value),
        style: {
          width: '100%',
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #C0C0C0',
          fontSize: '14px'
        },
        placeholder: "Enter delivery fee"
      })), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "xl"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Button, {
        variant: "primary",
        onClick: handleAssign,
        disabled: loading || drivers.length === 0
      }, loading ? 'Assigning...' : 'Assign Driver')), drivers.length === 0 && /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "lg"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm",
        color: "red"
      }, "No active delivery partners found.")));
    };

    const STATUS_STYLES = {
      available: {
        bg: "#dbeafe",
        color: "#1d4ed8",
        label: "ACTIVE - NEW"
      },
      assigned: {
        bg: "#fef3c7",
        color: "#92400e",
        label: "ACTIVE - ASSIGNED"
      },
      confirmed: {
        bg: "#ffedd5",
        color: "#9a3412",
        label: "ACTIVE - ACCEPTED"
      },
      arriving: {
        bg: "#ede9fe",
        color: "#5b21b6",
        label: "ACTIVE - OUT FOR DELIVERY"
      },
      at_location: {
        bg: "#cffafe",
        color: "#155e75",
        label: "ACTIVE - AT LOCATION"
      },
      delivered: {
        bg: "#dcfce7",
        color: "#166534",
        label: "DELIVERED"
      },
      cancelled: {
        bg: "#fee2e2",
        color: "#991b1b",
        label: "CANCELLED"
      }
    };
    const baseBadgeStyle$1 = {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "999px",
      fontWeight: 800,
      fontSize: "11px",
      letterSpacing: "0.3px",
      whiteSpace: "nowrap"
    };
    const normalizeStatus = status => String(status || "").toLowerCase().trim();
    const getStatusConfig = status => {
      const normalized = normalizeStatus(status);
      return STATUS_STYLES[normalized] || {
        bg: "#e5e7eb",
        color: "#374151",
        label: normalized ? normalized.toUpperCase() : "UNKNOWN"
      };
    };
    const OrderStatusBadge = ({
      record
    }) => {
      const status = record?.params?.status;
      const config = getStatusConfig(status);
      return /*#__PURE__*/React__default.default.createElement("span", {
        style: {
          ...baseBadgeStyle$1,
          backgroundColor: config.bg,
          color: config.color
        }
      }, config.label);
    };

    const baseBadgeStyle = {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: "999px",
      fontWeight: 800,
      fontSize: "11px",
      letterSpacing: "0.3px",
      whiteSpace: "nowrap"
    };
    const DriverStatusBadge = ({
      record
    }) => {
      const driver = record?.params?.deliveryPartner;
      const isAssigned = !!driver;
      if (isAssigned) {
        return /*#__PURE__*/React__default.default.createElement("span", {
          style: {
            ...baseBadgeStyle,
            backgroundColor: "#dcfce7",
            color: "#166534"
          }
        }, "\u2705 DRIVER ASSIGNED");
      }
      return /*#__PURE__*/React__default.default.createElement("span", {
        style: {
          ...baseBadgeStyle,
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          border: "1px solid #991b1b"
        }
      }, "\uD83D\uDEA8 NOT ASSIGNED");
    };

    const GUIDES = [
    // --- STANDARD COLLECTIONS ---
    {
      type: "PRODUCT_SCROLLER",
      name: "Product Horizontal Scroller",
      desc: "Traditional swappable list of products.",
      mapping: {
        "Products": "The items shown in the horizontal list",
        "Title": "Main header for the scroller",
        "Theme Color": "Background color for the scroller section"
      },
      used: ["Title", "SubTitle", "Button Text", "Theme", "Products"],
      ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "PRODUCT_GRID",
      name: "Modern Product Grid",
      desc: "Wrap-around vertical grid (usually 2 columns).",
      mapping: {
        "Products": "Products filling the grid",
        "Button Text": "Text for the 'View More' style button"
      },
      used: ["Title", "SubTitle", "Button Text", "Theme", "Products"],
      ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "PRODUCT_GRID_3X2",
      name: "Elegant 3x2 Product Grid",
      desc: "A compact 3-column, 2-row grid for variety.",
      mapping: {
        "Products": "Fills the 6 slots in the grid (3 columns x 2 rows)"
      },
      used: ["Title", "SubTitle", "Products"],
      ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "STORY_STRIP",
      name: "Instagram-Style Story Strip",
      desc: "Circular icons used for quick navigation or highlights.",
      mapping: {
        "Products": "Each product becomes a circular 'Story' circle showing the product image"
      },
      used: ["Products", "Title", "Theme"],
      ignored: ["SubTitle", "Banner", "Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "CATEGORY_STRIP",
      name: "Category Strip",
      desc: "A horizontal strip of categories/items.",
      mapping: {
        "Categories": "The list of sub-categories to display"
      },
      used: ["Categories"],
      ignored: ["Title", "SubTitle", "Banner", "Carousel", "Big/Mini Deals", "Sections"]
    },
    // --- SPECIALIZED GRIDS ---
    {
      type: "BENTO_GRID",
      name: "Premium Bento Grid",
      desc: "Modern layout with 1 Large item and 2 Small items.",
      mapping: {
        "Big Deal": "The main focus product (Large Card)",
        "Mini Deals": "Supporting products (2 Small Cards on the right)"
      },
      used: ["Title", "SubTitle", "Button Text", "Theme", "Big Deal (Large)", "Mini Deals (Small x2)"],
      ignored: ["Products", "Banner", "Carousel", "Sections"]
    }, {
      type: "AISLE_2X2_GRID",
      name: "Aisle 2x2 Product Grid",
      desc: "Combination of a category strip and a product grid.",
      mapping: {
        "Categories": "Categories shown in the top horizontal list",
        "Products": "Products shown in the 2x2 grid below the categories"
      },
      used: ["Title", "SubTitle", "Categories", "Products", "Theme"],
      ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "CATEGORY_CLUSTERS",
      name: "2x2 Dynamic Category Grid",
      desc: "Shows 4 items in a 2x2 grid with an optional banner side.",
      mapping: {
        "Products": "The 4 products shown in the grid",
        "Banner Image": "Optional banner shown alongside the grid"
      },
      used: ["Title", "SubTitle", "Button Text", "Theme", "Products (Up to 4)", "Banner Image"],
      ignored: ["Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "CATEGORY_GRID_FOUR_IMAGES",
      name: "Category 2x2 Image Grid",
      desc: "A grid where each category shows 4 small product previews.",
      mapping: {
        "Categories": "The sub-categories used to build the image grids"
      },
      used: ["Title", "SubTitle", "Categories"],
      ignored: ["Products", "Banner", "Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "GROCERY_LIST_2X3",
      name: "Grocery List 2x3 Grid",
      desc: "A 2x3 layout specifically for category collections.",
      mapping: {
        "Categories": "Fills the 6 slots (2 columns x 3 rows)"
      },
      used: ["Title", "SubTitle", "Categories"],
      ignored: ["Products", "Banner", "Carousel", "Big/Mini Deals", "Sections"]
    },
    // --- MEDIA & PROMO ---
    {
      type: "MINI_VIDEO",
      name: "Floating Mini Video",
      desc: "An auto-playing video promotion.",
      mapping: {
        "Upload Video": "The MP4 file for the floating video",
        "Video Thumbnail": "Poster image shown before the video plays",
        "Banner Image": "Static background if video is not supported"
      },
      used: ["Title", "SubTitle", "Upload Video", "Video Thumbnail", "Banner Image"],
      ignored: ["Products", "Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "PROMOTION_PAGINATION",
      name: "Promo with 4-Dots Pagination",
      desc: "Large card design for featured events or deals.",
      mapping: {
        "Products": "The primary product being promoted"
      },
      used: ["Title", "SubTitle", "Products", "Theme"],
      ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "PROMO_BANNER",
      name: "Promotional Banner",
      desc: "Static high-quality banner for ads.",
      mapping: {
        "Upload Banner": "The main graphic image",
        "Button Text": "Label for the banner's call-to-action"
      },
      used: ["Upload Banner", "Button Text", "Theme"],
      ignored: ["Title", "SubTitle", "Products", "Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "IMAGE_CAROUSEL",
      name: "Image Carousel Slider",
      desc: "Auto-sliding collection of banner images.",
      mapping: {
        "Carousel Images": "Array of URLs to valid image files"
      },
      used: ["Title", "Carousel Images (Array)", "Theme (Optional)"],
      ignored: ["Products", "Banner", "Big/Mini Deals", "Sections"]
    },
    // --- INTERACTIVE ---
    {
      type: "TRIPLE_SECTION_GRID",
      name: "Triple Section Pager",
      desc: "Swipeable pages with distinct collections.",
      mapping: {
        "Sections": "Requires EXACTLY 3 sections. Each needs: Title, Color, and Products.",
        "Theme Mode": "Set to 'glass' for premium blurred effects"
      },
      used: ["Title (Main)", "Theme Mode", "Sections (Needs 3 entries)"],
      ignored: ["SubTitle", "Button Text", "Theme Color", "Banner", "Carousel", "Big/Mini Deals", "Products (General)"]
    },
    // --- FESTIVE / HERO ---
    {
      type: "GRADIENT_HERO",
      name: "High-Impact Gradient Hero",
      desc: "Primary entry section with large graphics.",
      mapping: {
        "Banner Image": "Large background graphic",
        "Products": "Featured items overlaying the hero"
      },
      used: ["Title", "SubTitle", "Button Text", "Theme", "Products", "Banner Image"],
      ignored: ["Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "RAMZAN_SPECIAL / SPECIAL2",
      name: "Festive Ramzan Layouts",
      desc: "Cultural/Themed layouts with specialized visual effects.",
      mapping: {
        "Products": "Products list shown within the festive theme",
        "Theme Mode": "Best used with 'glass' mode"
      },
      used: ["Title", "SubTitle", "Products", "Theme Mode"],
      ignored: ["Banner", "Carousel", "Big/Mini Deals", "Sections"]
    }, {
      type: "DIWALI_SPECIAL / HAPPY_HOLI / CHRISTMAS...",
      name: "Holiday Themed Grids",
      desc: "Seasonal layouts for special events.",
      mapping: {
        "Products": "Active products for the holiday",
        "Banner Image": "Optional seasonal background/hero"
      },
      used: ["Title", "SubTitle", "Products", "Banner Image", "Theme Mode"],
      ignored: ["Carousel", "Big/Mini Deals", "Sections"]
    }];
    const ComponentGuide = () => {
      return /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        variant: "white",
        flex: true,
        flexDirection: "column",
        mx: "auto",
        p: "xl",
        style: {
          maxWidth: 1200,
          marginTop: 40,
          marginBottom: 40,
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mb: "xl"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.H2, null, "Home Component Builder Guide"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        color: "grey60",
        mb: "lg"
      }, "This cheat sheet explains how to configure all 22 component types. The Page Builder is \"smart\"\u2014it hides fields that aren't needed for your selected type.")), /*#__PURE__*/React__default.default.createElement(designSystem.Table, null, /*#__PURE__*/React__default.default.createElement(designSystem.TableHead, null, /*#__PURE__*/React__default.default.createElement(designSystem.TableRow, null, /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, {
        width: "25%"
      }, "Component Type"), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, {
        width: "25%"
      }, "Description"), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, {
        width: "30%"
      }, "\uD83C\uDFAF Field Mapping (Smart Helpers)"), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, {
        width: "20%"
      }, "\u2705 Visible Fields"))), /*#__PURE__*/React__default.default.createElement(designSystem.TableBody, null, GUIDES.map((g, i) => /*#__PURE__*/React__default.default.createElement(designSystem.TableRow, {
        key: i
      }, /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontWeight: "bold",
        color: "primary100"
      }, g.name), /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
        size: "sm",
        variant: "info",
        style: {
          textTransform: 'none',
          marginTop: 4
        }
      }, g.type)), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm"
      }, g.desc)), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, Object.entries(g.mapping).map(([field, help], mi) => /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        key: mi,
        mb: "sm",
        p: "xs",
        style: {
          background: '#f9fafb',
          borderRadius: 4,
          borderLeft: '3px solid #7033ff'
        }
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm",
        fontWeight: "bold"
      }, field, ":"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm",
        color: "grey60"
      }, help)))), /*#__PURE__*/React__default.default.createElement(designSystem.TableCell, null, g.used.map((u, ui) => /*#__PURE__*/React__default.default.createElement(designSystem.Badge, {
        key: ui,
        size: "sm",
        variant: "success",
        mb: "xs",
        mr: "xs"
      }, u)), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "sm"
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "xs",
        color: "grey40"
      }, "Ignored: ", g.ignored.slice(0, 3).join(', '), "..."))))))), /*#__PURE__*/React__default.default.createElement(designSystem.Box, {
        mt: "xl",
        p: "lg",
        style: {
          background: '#eff6ff',
          borderRadius: 8,
          border: '1px solid #bfdbfe'
        }
      }, /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        fontWeight: "bold",
        color: "#1e40af"
      }, "\uD83D\uDCA1 Pro Tip:"), /*#__PURE__*/React__default.default.createElement(designSystem.Text, {
        variant: "sm",
        color: "#1e40af"
      }, "If you provide a field that is marked as \u274C Ignored for a specific type, it won't break anything! The field will simply be ignored by the app's rendering engine for that specific component.")));
    };

    const Edit = ({ property, record, onChange }) => {
        const { translateProperty } = adminjs.useTranslation();
        const { params } = record;
        const { custom } = property;
        const path = adminjs.flat.get(params, custom.filePathProperty);
        const key = adminjs.flat.get(params, custom.keyProperty);
        const file = adminjs.flat.get(params, custom.fileProperty);
        const [originalKey, setOriginalKey] = React.useState(key);
        const [filesToUpload, setFilesToUpload] = React.useState([]);
        React.useEffect(() => {
            // it means means that someone hit save and new file has been uploaded
            // in this case fliesToUpload should be cleared.
            // This happens when user turns off redirect after new/edit
            if ((typeof key === 'string' && key !== originalKey)
                || (typeof key !== 'string' && !originalKey)
                || (typeof key !== 'string' && Array.isArray(key) && key.length !== originalKey.length)) {
                setOriginalKey(key);
                setFilesToUpload([]);
            }
        }, [key, originalKey]);
        const onUpload = (files) => {
            setFilesToUpload(files);
            onChange(custom.fileProperty, files);
        };
        const handleRemove = () => {
            onChange(custom.fileProperty, null);
        };
        const handleMultiRemove = (singleKey) => {
            const index = (adminjs.flat.get(record.params, custom.keyProperty) || []).indexOf(singleKey);
            const filesToDelete = adminjs.flat.get(record.params, custom.filesToDeleteProperty) || [];
            if (path && path.length > 0) {
                const newPath = path.map((currentPath, i) => (i !== index ? currentPath : null));
                let newParams = adminjs.flat.set(record.params, custom.filesToDeleteProperty, [...filesToDelete, index]);
                newParams = adminjs.flat.set(newParams, custom.filePathProperty, newPath);
                onChange({
                    ...record,
                    params: newParams,
                });
            }
            else {
                // eslint-disable-next-line no-console
                console.log('You cannot remove file when there are no uploaded files yet');
            }
        };
        return (React__default.default.createElement(designSystem.FormGroup, null,
            React__default.default.createElement(designSystem.Label, null, translateProperty(property.label, property.resourceId)),
            React__default.default.createElement(designSystem.DropZone, { onChange: onUpload, multiple: custom.multiple, validate: {
                    mimeTypes: custom.mimeTypes,
                    maxSize: custom.maxSize,
                }, files: filesToUpload }),
            !custom.multiple && key && path && !filesToUpload.length && file !== null && (React__default.default.createElement(designSystem.DropZoneItem, { filename: key, src: path, onRemove: handleRemove })),
            custom.multiple && key && key.length && path ? (React__default.default.createElement(React__default.default.Fragment, null, key.map((singleKey, index) => {
                // when we remove items we set only path index to nulls.
                // key is still there. This is because
                // we have to maintain all the indexes. So here we simply filter out elements which
                // were removed and display only what was left
                const currentPath = path[index];
                return currentPath ? (React__default.default.createElement(designSystem.DropZoneItem, { key: singleKey, filename: singleKey, src: path[index], onRemove: () => handleMultiRemove(singleKey) })) : '';
            }))) : ''));
    };

    const AudioMimeTypes = [
        'audio/aac',
        'audio/midi',
        'audio/x-midi',
        'audio/mpeg',
        'audio/ogg',
        'application/ogg',
        'audio/opus',
        'audio/wav',
        'audio/webm',
        'audio/3gpp2',
    ];
    const ImageMimeTypes = [
        'image/bmp',
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/svg+xml',
        'image/vnd.microsoft.icon',
        'image/tiff',
        'image/webp',
    ];

    // eslint-disable-next-line import/no-extraneous-dependencies
    const SingleFile = (props) => {
        const { name, path, mimeType, width } = props;
        if (path && path.length) {
            if (mimeType && ImageMimeTypes.includes(mimeType)) {
                return (React__default.default.createElement("img", { src: path, style: { maxHeight: width, maxWidth: width }, alt: name }));
            }
            if (mimeType && AudioMimeTypes.includes(mimeType)) {
                return (React__default.default.createElement("audio", { controls: true, src: path },
                    "Your browser does not support the",
                    React__default.default.createElement("code", null, "audio"),
                    React__default.default.createElement("track", { kind: "captions" })));
            }
        }
        return (React__default.default.createElement(designSystem.Box, null,
            React__default.default.createElement(designSystem.Button, { as: "a", href: path, ml: "default", size: "sm", rounded: true, target: "_blank" },
                React__default.default.createElement(designSystem.Icon, { icon: "DocumentDownload", color: "white", mr: "default" }),
                name)));
    };
    const File$1 = ({ width, record, property }) => {
        const { custom } = property;
        let path = adminjs.flat.get(record?.params, custom.filePathProperty);
        if (!path) {
            return null;
        }
        const name = adminjs.flat.get(record?.params, custom.fileNameProperty ? custom.fileNameProperty : custom.keyProperty);
        const mimeType = custom.mimeTypeProperty
            && adminjs.flat.get(record?.params, custom.mimeTypeProperty);
        if (!property.custom.multiple) {
            if (custom.opts && custom.opts.baseUrl) {
                path = `${custom.opts.baseUrl}/${name}`;
            }
            return (React__default.default.createElement(SingleFile, { path: path, name: name, width: width, mimeType: mimeType }));
        }
        if (custom.opts && custom.opts.baseUrl) {
            const baseUrl = custom.opts.baseUrl || '';
            path = path.map((singlePath, index) => `${baseUrl}/${name[index]}`);
        }
        return (React__default.default.createElement(React__default.default.Fragment, null, path.map((singlePath, index) => (React__default.default.createElement(SingleFile, { key: singlePath, path: singlePath, name: name[index], width: width, mimeType: mimeType[index] })))));
    };

    const List = (props) => (React__default.default.createElement(File$1, { width: 100, ...props }));

    const Show = (props) => {
        const { property } = props;
        const { translateProperty } = adminjs.useTranslation();
        return (React__default.default.createElement(designSystem.FormGroup, null,
            React__default.default.createElement(designSystem.Label, null, translateProperty(property.label, property.resourceId)),
            React__default.default.createElement(File$1, { width: "100%", ...props })));
    };

    AdminJS.UserComponents = {};
    AdminJS.UserComponents.FilteredCategory = FilteredCategory;
    AdminJS.UserComponents.FilteredSubCategory = FilteredSubCategory;
    AdminJS.UserComponents.SupportReply = SupportReply;
    AdminJS.UserComponents.SupportDashboard = SupportDashboard;
    AdminJS.UserComponents.SendNotification = SendNotification;
    AdminJS.UserComponents.Dashboard = Dashboard;
    AdminJS.UserComponents.AssignDriverComponent = AssignDriver;
    AdminJS.UserComponents.OrderStatusBadge = OrderStatusBadge;
    AdminJS.UserComponents.DriverStatusBadge = DriverStatusBadge;
    AdminJS.UserComponents.ComponentGuide = ComponentGuide;
    AdminJS.UserComponents.UploadEditComponent = Edit;
    AdminJS.UserComponents.UploadListComponent = List;
    AdminJS.UserComponents.UploadShowComponent = Show;

})(React, AdminJSDesignSystem, AdminJS, styled);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29tcG9uZW50cy9GaWx0ZXJlZENhdGVnb3J5LmpzeCIsIi4uL3NyYy9jb21wb25lbnRzL0ZpbHRlcmVkU3ViQ2F0ZWdvcnkuanN4IiwiLi4vc3JjL2NvbXBvbmVudHMvU3VwcG9ydFJlcGx5LmpzeCIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tcGFyc2VyL2J1aWxkL2VzbS9jb21tb25zLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1wYXJzZXIvYnVpbGQvZXNtL2VuY29kZVBhY2tldC5icm93c2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1wYXJzZXIvYnVpbGQvZXNtL2NvbnRyaWIvYmFzZTY0LWFycmF5YnVmZmVyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1wYXJzZXIvYnVpbGQvZXNtL2RlY29kZVBhY2tldC5icm93c2VyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1wYXJzZXIvYnVpbGQvZXNtL2luZGV4LmpzIiwiLi4vbm9kZV9tb2R1bGVzL0Bzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXIvbGliL2Nqcy9pbmRleC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9nbG9iYWxzLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3V0aWwuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi9wYXJzZXFzLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3RyYW5zcG9ydC5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnRzL3BvbGxpbmcuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi9oYXMtY29ycy5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS90cmFuc3BvcnRzL3BvbGxpbmcteGhyLmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3RyYW5zcG9ydHMvd2Vic29ja2V0LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3RyYW5zcG9ydHMvd2VidHJhbnNwb3J0LmpzIiwiLi4vbm9kZV9tb2R1bGVzL2VuZ2luZS5pby1jbGllbnQvYnVpbGQvZXNtL3RyYW5zcG9ydHMvaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vY29udHJpYi9wYXJzZXVyaS5qcyIsIi4uL25vZGVfbW9kdWxlcy9lbmdpbmUuaW8tY2xpZW50L2J1aWxkL2VzbS9zb2NrZXQuanMiLCIuLi9ub2RlX21vZHVsZXMvZW5naW5lLmlvLWNsaWVudC9idWlsZC9lc20vaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vdXJsLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1wYXJzZXIvYnVpbGQvZXNtL2lzLWJpbmFyeS5qcyIsIi4uL25vZGVfbW9kdWxlcy9zb2NrZXQuaW8tcGFyc2VyL2J1aWxkL2VzbS9iaW5hcnkuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLXBhcnNlci9idWlsZC9lc20vaW5kZXguanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vb24uanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vc29ja2V0LmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1jbGllbnQvYnVpbGQvZXNtL2NvbnRyaWIvYmFja28yLmpzIiwiLi4vbm9kZV9tb2R1bGVzL3NvY2tldC5pby1jbGllbnQvYnVpbGQvZXNtL21hbmFnZXIuanMiLCIuLi9ub2RlX21vZHVsZXMvc29ja2V0LmlvLWNsaWVudC9idWlsZC9lc20vaW5kZXguanMiLCIuLi9zcmMvY29tcG9uZW50cy9TdXBwb3J0RGFzaGJvYXJkLmpzeCIsIi4uL3NyYy9jb21wb25lbnRzL1NlbmROb3RpZmljYXRpb24uanN4IiwiLi4vc3JjL2NvbXBvbmVudHMvRGFzaGJvYXJkLmpzeCIsIi4uL3NyYy9jb21wb25lbnRzL0Fzc2lnbkRyaXZlci5qc3giLCIuLi9zcmMvY29tcG9uZW50cy9PcmRlclN0YXR1c0JhZGdlLmpzeCIsIi4uL3NyYy9jb21wb25lbnRzL0RyaXZlclN0YXR1c0JhZGdlLmpzeCIsIi4uL3NyYy9jb21wb25lbnRzL0NvbXBvbmVudEd1aWRlLmpzeCIsIi4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRFZGl0Q29tcG9uZW50LmpzIiwiLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS90eXBlcy9taW1lLXR5cGVzLnR5cGUuanMiLCIuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvZmlsZS5qcyIsIi4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRMaXN0Q29tcG9uZW50LmpzIiwiLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS9jb21wb25lbnRzL1VwbG9hZFNob3dDb21wb25lbnQuanMiLCJlbnRyeS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IExhYmVsLCBTZWxlY3QsIEZvcm1Hcm91cCwgRm9ybU1lc3NhZ2UgfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcblxuLyoqXG4gKiBDdXN0b20gQ2F0ZWdvcnkgZHJvcGRvd24gdGhhdCBmaWx0ZXJzIGJ5IHRoZSBzZWxlY3RlZCBTdXBlckNhdGVnb3J5LlxuICovXG5jb25zdCBGaWx0ZXJlZENhdGVnb3J5ID0gKHByb3BzKSA9PiB7XG4gICAgY29uc3QgeyBwcm9wZXJ0eSwgcmVjb3JkLCBvbkNoYW5nZSB9ID0gcHJvcHM7XG4gICAgY29uc3QgW29wdGlvbnMsIHNldE9wdGlvbnNdID0gdXNlU3RhdGUoW10pO1xuICAgIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICAgIC8vIEdldCB0aGUgY3VycmVudGx5IHNlbGVjdGVkIHN1cGVyQ2F0ZWdvcnkgZnJvbSB0aGUgcmVjb3JkXG4gICAgY29uc3Qgc3VwZXJDYXRlZ29yeUlkID0gcmVjb3JkPy5wYXJhbXM/LnN1cGVyQ2F0ZWdvcnk7XG4gICAgLy8gR2V0IHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgY2F0ZWdvcnlcbiAgICBjb25zdCBjdXJyZW50VmFsdWUgPSByZWNvcmQ/LnBhcmFtcz8uY2F0ZWdvcnk7XG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBpZiAoIXN1cGVyQ2F0ZWdvcnlJZCkge1xuICAgICAgICAgICAgc2V0T3B0aW9ucyhbXSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZXRMb2FkaW5nKHRydWUpO1xuXG4gICAgICAgIC8vIEZldGNoIGNhdGVnb3JpZXMgZmlsdGVyZWQgYnkgdGhlIHNlbGVjdGVkIHN1cGVyQ2F0ZWdvcnlcbiAgICAgICAgZmV0Y2goYC9hcGkvc3VwZXJjYXRlZ29yaWVzLyR7c3VwZXJDYXRlZ29yeUlkfS9jYXRlZ29yaWVzYClcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiByZXMuanNvbigpKVxuICAgICAgICAgICAgLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtcyA9IHJlc3VsdC5kYXRhIHx8IHJlc3VsdCB8fCBbXTtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRzID0gKEFycmF5LmlzQXJyYXkoaXRlbXMpID8gaXRlbXMgOiBbXSkubWFwKGNhdCA9PiAoe1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogY2F0Ll9pZCxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IGNhdC5uYW1lLFxuICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICBzZXRPcHRpb25zKG9wdHMpO1xuICAgICAgICAgICAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBmZXRjaCBjYXRlZ29yaWVzOicsIGVycik7XG4gICAgICAgICAgICAgICAgc2V0T3B0aW9ucyhbXSk7XG4gICAgICAgICAgICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9LCBbc3VwZXJDYXRlZ29yeUlkXSk7XG5cbiAgICBjb25zdCBzZWxlY3RlZCA9IG9wdGlvbnMuZmluZChvID0+IG8udmFsdWUgPT09IGN1cnJlbnRWYWx1ZSkgfHwgbnVsbDtcblxuICAgIGNvbnN0IGhhbmRsZUNoYW5nZSA9IChzZWxlY3RlZE9wdGlvbikgPT4ge1xuICAgICAgICBvbkNoYW5nZShwcm9wZXJ0eS5wYXRoLCBzZWxlY3RlZE9wdGlvbiA/IHNlbGVjdGVkT3B0aW9uLnZhbHVlIDogJycpO1xuICAgICAgICAvLyBSZXNldCBjYXRlZ29yeS1kZXBlbmRlbnQgZmllbGRzIGlmIG5lY2Vzc2FyeVxuICAgICAgICAvLyBIZXJlIHdlIG1pZ2h0IHdhbnQgdG8gY2xlYXIgc3ViQ2F0ZWdvcnkgaWYgY2F0ZWdvcnkgY2hhbmdlcywgXG4gICAgICAgIC8vIGJ1dCB0aGF0J3MgaGFuZGxlZCBieSB0aGUgc3ViQ2F0ZWdvcnkgY29tcG9uZW50IHdhdGNoaW5nIGNhdGVnb3J5LlxuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8Rm9ybUdyb3VwPlxuICAgICAgICAgICAgPExhYmVsPkNhdGVnb3J5PC9MYWJlbD5cbiAgICAgICAgICAgIHshc3VwZXJDYXRlZ29yeUlkID8gKFxuICAgICAgICAgICAgICAgIDxGb3JtTWVzc2FnZT5QbGVhc2Ugc2VsZWN0IGEgU3VwZXIgQ2F0ZWdvcnkgZmlyc3Q8L0Zvcm1NZXNzYWdlPlxuICAgICAgICAgICAgKSA6IGxvYWRpbmcgPyAoXG4gICAgICAgICAgICAgICAgPEZvcm1NZXNzYWdlPkxvYWRpbmcgY2F0ZWdvcmllcy4uLjwvRm9ybU1lc3NhZ2U+XG4gICAgICAgICAgICApIDogb3B0aW9ucy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgPEZvcm1NZXNzYWdlPk5vIGNhdGVnb3JpZXMgZm91bmQgZm9yIHRoaXMgc3VwZXIgY2F0ZWdvcnk8L0Zvcm1NZXNzYWdlPlxuICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICA8U2VsZWN0XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtzZWxlY3RlZH1cbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucz17b3B0aW9uc31cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZUNoYW5nZX1cbiAgICAgICAgICAgICAgICAgICAgaXNDbGVhcmFibGVcbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJTZWxlY3QgQ2F0ZWdvcnkuLi5cIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICApfVxuICAgICAgICA8L0Zvcm1Hcm91cD5cbiAgICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRmlsdGVyZWRDYXRlZ29yeTtcbiIsImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgTGFiZWwsIFNlbGVjdCwgRm9ybUdyb3VwLCBGb3JtTWVzc2FnZSB9IGZyb20gJ0BhZG1pbmpzL2Rlc2lnbi1zeXN0ZW0nO1xuXG4vKipcbiAqIEN1c3RvbSBTdWJDYXRlZ29yeSBkcm9wZG93biB0aGF0IGZpbHRlcnMgYnkgdGhlIHNlbGVjdGVkIENhdGVnb3J5LlxuICogV2F0Y2hlcyB0aGUgYGNhdGVnb3J5YCBmaWVsZCBvbiB0aGUgUHJvZHVjdCBmb3JtIGFuZCBmZXRjaGVzXG4gKiBvbmx5IHN1YmNhdGVnb3JpZXMgYmVsb25naW5nIHRvIHRoYXQgY2F0ZWdvcnkuXG4gKi9cbmNvbnN0IEZpbHRlcmVkU3ViQ2F0ZWdvcnkgPSAocHJvcHMpID0+IHtcbiAgICBjb25zdCB7IHByb3BlcnR5LCByZWNvcmQsIG9uQ2hhbmdlIH0gPSBwcm9wcztcbiAgICBjb25zdCBbb3B0aW9ucywgc2V0T3B0aW9uc10gPSB1c2VTdGF0ZShbXSk7XG4gICAgY29uc3QgW2xvYWRpbmcsIHNldExvYWRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gICAgLy8gR2V0IHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgY2F0ZWdvcnkgZnJvbSB0aGUgcmVjb3JkXG4gICAgY29uc3QgY2F0ZWdvcnlJZCA9IHJlY29yZD8ucGFyYW1zPy5jYXRlZ29yeTtcbiAgICAvLyBHZXQgdGhlIGN1cnJlbnRseSBzZWxlY3RlZCBzdWJDYXRlZ29yeVxuICAgIGNvbnN0IGN1cnJlbnRWYWx1ZSA9IHJlY29yZD8ucGFyYW1zPy5zdWJDYXRlZ29yeTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGlmICghY2F0ZWdvcnlJZCkge1xuICAgICAgICAgICAgc2V0T3B0aW9ucyhbXSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZXRMb2FkaW5nKHRydWUpO1xuXG4gICAgICAgIC8vIFVzZSB0aGUgZXhpc3RpbmcgQVBJIHJvdXRlIHRvIGZldGNoIGZpbHRlcmVkIHN1YmNhdGVnb3JpZXNcbiAgICAgICAgZmV0Y2goYC9hcGkvY2F0ZWdvcmllcy8ke2NhdGVnb3J5SWR9L3N1YmNhdGVnb3JpZXNgKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpXG4gICAgICAgICAgICAudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1zID0gcmVzdWx0LmRhdGEgfHwgcmVzdWx0IHx8IFtdO1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdHMgPSAoQXJyYXkuaXNBcnJheShpdGVtcykgPyBpdGVtcyA6IFtdKS5tYXAoc2MgPT4gKHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHNjLl9pZCxcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IHNjLm5hbWUsXG4gICAgICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgICAgIHNldE9wdGlvbnMob3B0cyk7XG4gICAgICAgICAgICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGZldGNoIHN1YmNhdGVnb3JpZXM6JywgZXJyKTtcbiAgICAgICAgICAgICAgICBzZXRPcHRpb25zKFtdKTtcbiAgICAgICAgICAgICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sIFtjYXRlZ29yeUlkXSk7XG5cbiAgICBjb25zdCBzZWxlY3RlZCA9IG9wdGlvbnMuZmluZChvID0+IG8udmFsdWUgPT09IGN1cnJlbnRWYWx1ZSkgfHwgbnVsbDtcblxuICAgIGNvbnN0IGhhbmRsZUNoYW5nZSA9IChzZWxlY3RlZE9wdGlvbikgPT4ge1xuICAgICAgICBvbkNoYW5nZShwcm9wZXJ0eS5wYXRoLCBzZWxlY3RlZE9wdGlvbiA/IHNlbGVjdGVkT3B0aW9uLnZhbHVlIDogJycpO1xuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8Rm9ybUdyb3VwPlxuICAgICAgICAgICAgPExhYmVsPlN1YiBDYXRlZ29yeTwvTGFiZWw+XG4gICAgICAgICAgICB7IWNhdGVnb3J5SWQgPyAoXG4gICAgICAgICAgICAgICAgPEZvcm1NZXNzYWdlPlBsZWFzZSBzZWxlY3QgYSBDYXRlZ29yeSBmaXJzdDwvRm9ybU1lc3NhZ2U+XG4gICAgICAgICAgICApIDogbG9hZGluZyA/IChcbiAgICAgICAgICAgICAgICA8Rm9ybU1lc3NhZ2U+TG9hZGluZyBzdWJjYXRlZ29yaWVzLi4uPC9Gb3JtTWVzc2FnZT5cbiAgICAgICAgICAgICkgOiBvcHRpb25zLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgICAgICAgICA8Rm9ybU1lc3NhZ2U+Tm8gc3ViY2F0ZWdvcmllcyBmb3VuZCBmb3IgdGhpcyBjYXRlZ29yeTwvRm9ybU1lc3NhZ2U+XG4gICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgIDxTZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3NlbGVjdGVkfVxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zPXtvcHRpb25zfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17aGFuZGxlQ2hhbmdlfVxuICAgICAgICAgICAgICAgICAgICBpc0NsZWFyYWJsZVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlNlbGVjdCBTdWIgQ2F0ZWdvcnkuLi5cIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICApfVxuICAgICAgICA8L0Zvcm1Hcm91cD5cbiAgICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRmlsdGVyZWRTdWJDYXRlZ29yeTtcbiIsImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEJveCwgQnV0dG9uLCBUZXh0QXJlYSwgTGFiZWwsIEZvcm1Hcm91cCwgdXNlTm90aWNlLCBUZXh0IH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSc7XG5pbXBvcnQgeyBBcGlDbGllbnQgfSBmcm9tICdhZG1pbmpzJztcblxuY29uc3QgU3VwcG9ydFJlcGx5ID0gKHByb3BzKSA9PiB7XG4gICAgY29uc3QgeyByZWNvcmQsIHJlc291cmNlLCBhY3Rpb24gfSA9IHByb3BzO1xuICAgIGNvbnN0IFttZXNzYWdlLCBzZXRNZXNzYWdlXSA9IHVzZVN0YXRlKCcnKTtcbiAgICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3Qgc2VuZE5vdGljZSA9IHVzZU5vdGljZSgpO1xuICAgIGNvbnN0IGFwaSA9IG5ldyBBcGlDbGllbnQoKTtcblxuICAgIGNvbnN0IGhhbmRsZVNlbmQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGlmICghbWVzc2FnZS50cmltKCkpIHJldHVybjtcbiAgICAgICAgc2V0TG9hZGluZyh0cnVlKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgYXBpLnJlY29yZEFjdGlvbih7XG4gICAgICAgICAgICAgICAgcmVzb3VyY2VJZDogcmVzb3VyY2UuaWQsXG4gICAgICAgICAgICAgICAgcmVjb3JkSWQ6IHJlY29yZC5pZCxcbiAgICAgICAgICAgICAgICBhY3Rpb25OYW1lOiBhY3Rpb24ubmFtZSxcbiAgICAgICAgICAgICAgICBwYXlsb2FkOiB7IHJlcGx5TWVzc2FnZTogbWVzc2FnZSB9LFxuICAgICAgICAgICAgICAgIG1ldGhvZDogJ3Bvc3QnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgc2VuZE5vdGljZSh7IG1lc3NhZ2U6ICdSZXBseSBzZW50IHN1Y2Nlc3NmdWxseSEnLCB0eXBlOiAnc3VjY2VzcycgfSk7XG4gICAgICAgICAgICBzZXRNZXNzYWdlKCcnKTtcbiAgICAgICAgICAgIC8vIFJlZGlyZWN0IGJhY2sgdG8gbGlzdFxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBgL2FkbWluL3Jlc291cmNlcy8ke3Jlc291cmNlLmlkfWA7XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdSZXBseSBmYWlsZWQ6JywgZXJyb3IpO1xuICAgICAgICAgICAgc2VuZE5vdGljZSh7IG1lc3NhZ2U6ICdGYWlsZWQgdG8gc2VuZCByZXBseScsIHR5cGU6ICdlcnJvcicgfSk7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBzZXRMb2FkaW5nKGZhbHNlKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8Qm94IHZhcmlhbnQ9XCJ3aGl0ZVwiIHBhZGRpbmc9XCJ4bFwiPlxuICAgICAgICAgICAgPEJveCBtYXJnaW5Cb3R0b209XCJ4bFwiPlxuICAgICAgICAgICAgICAgIDxMYWJlbD5Vc2VyJ3MgTGFzdCBNZXNzYWdlOjwvTGFiZWw+XG4gICAgICAgICAgICAgICAgPEJveCBwYWRkaW5nPVwibVwiIGJhY2tncm91bmRDb2xvcj1cImdyZXkyMFwiIGJvcmRlclJhZGl1cz1cImRlZmF1bHRcIj5cbiAgICAgICAgICAgICAgICAgICAgPFRleHQ+e3JlY29yZC5wYXJhbXMubWVzc2FnZX08L1RleHQ+XG4gICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICA8L0JveD5cblxuICAgICAgICAgICAgPEZvcm1Hcm91cD5cbiAgICAgICAgICAgICAgICA8TGFiZWw+WW91ciBSZXBseTo8L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxUZXh0QXJlYVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17bWVzc2FnZX1cbiAgICAgICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRNZXNzYWdlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJUeXBlIHlvdXIgcmVzcG9uc2UgaGVyZS4uLlwiXG4gICAgICAgICAgICAgICAgICAgIHJvd3M9ezV9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvRm9ybUdyb3VwPlxuXG4gICAgICAgICAgICA8Qm94IG1hcmdpblRvcD1cInhsXCI+XG4gICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB2YXJpYW50PVwicHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVNlbmR9XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtsb2FkaW5nIHx8ICFtZXNzYWdlLnRyaW0oKX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHtsb2FkaW5nID8gJ1NlbmRpbmcuLi4nIDogJ1NlbmQgUmVwbHknfVxuICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgIDwvQm94PlxuICAgICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTdXBwb3J0UmVwbHk7XG4iLCJjb25zdCBQQUNLRVRfVFlQRVMgPSBPYmplY3QuY3JlYXRlKG51bGwpOyAvLyBubyBNYXAgPSBubyBwb2x5ZmlsbFxuUEFDS0VUX1RZUEVTW1wib3BlblwiXSA9IFwiMFwiO1xuUEFDS0VUX1RZUEVTW1wiY2xvc2VcIl0gPSBcIjFcIjtcblBBQ0tFVF9UWVBFU1tcInBpbmdcIl0gPSBcIjJcIjtcblBBQ0tFVF9UWVBFU1tcInBvbmdcIl0gPSBcIjNcIjtcblBBQ0tFVF9UWVBFU1tcIm1lc3NhZ2VcIl0gPSBcIjRcIjtcblBBQ0tFVF9UWVBFU1tcInVwZ3JhZGVcIl0gPSBcIjVcIjtcblBBQ0tFVF9UWVBFU1tcIm5vb3BcIl0gPSBcIjZcIjtcbmNvbnN0IFBBQ0tFVF9UWVBFU19SRVZFUlNFID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbk9iamVjdC5rZXlzKFBBQ0tFVF9UWVBFUykuZm9yRWFjaCgoa2V5KSA9PiB7XG4gICAgUEFDS0VUX1RZUEVTX1JFVkVSU0VbUEFDS0VUX1RZUEVTW2tleV1dID0ga2V5O1xufSk7XG5jb25zdCBFUlJPUl9QQUNLRVQgPSB7IHR5cGU6IFwiZXJyb3JcIiwgZGF0YTogXCJwYXJzZXIgZXJyb3JcIiB9O1xuZXhwb3J0IHsgUEFDS0VUX1RZUEVTLCBQQUNLRVRfVFlQRVNfUkVWRVJTRSwgRVJST1JfUEFDS0VUIH07XG4iLCJpbXBvcnQgeyBQQUNLRVRfVFlQRVMgfSBmcm9tIFwiLi9jb21tb25zLmpzXCI7XG5jb25zdCB3aXRoTmF0aXZlQmxvYiA9IHR5cGVvZiBCbG9iID09PSBcImZ1bmN0aW9uXCIgfHxcbiAgICAodHlwZW9mIEJsb2IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICAgICAgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKEJsb2IpID09PSBcIltvYmplY3QgQmxvYkNvbnN0cnVjdG9yXVwiKTtcbmNvbnN0IHdpdGhOYXRpdmVBcnJheUJ1ZmZlciA9IHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gXCJmdW5jdGlvblwiO1xuLy8gQXJyYXlCdWZmZXIuaXNWaWV3IG1ldGhvZCBpcyBub3QgZGVmaW5lZCBpbiBJRTEwXG5jb25zdCBpc1ZpZXcgPSAob2JqKSA9PiB7XG4gICAgcmV0dXJuIHR5cGVvZiBBcnJheUJ1ZmZlci5pc1ZpZXcgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/IEFycmF5QnVmZmVyLmlzVmlldyhvYmopXG4gICAgICAgIDogb2JqICYmIG9iai5idWZmZXIgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcjtcbn07XG5jb25zdCBlbmNvZGVQYWNrZXQgPSAoeyB0eXBlLCBkYXRhIH0sIHN1cHBvcnRzQmluYXJ5LCBjYWxsYmFjaykgPT4ge1xuICAgIGlmICh3aXRoTmF0aXZlQmxvYiAmJiBkYXRhIGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgICBpZiAoc3VwcG9ydHNCaW5hcnkpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjayhkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBlbmNvZGVCbG9iQXNCYXNlNjQoZGF0YSwgY2FsbGJhY2spO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHdpdGhOYXRpdmVBcnJheUJ1ZmZlciAmJlxuICAgICAgICAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyIHx8IGlzVmlldyhkYXRhKSkpIHtcbiAgICAgICAgaWYgKHN1cHBvcnRzQmluYXJ5KSB7XG4gICAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZW5jb2RlQmxvYkFzQmFzZTY0KG5ldyBCbG9iKFtkYXRhXSksIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBwbGFpbiBzdHJpbmdcbiAgICByZXR1cm4gY2FsbGJhY2soUEFDS0VUX1RZUEVTW3R5cGVdICsgKGRhdGEgfHwgXCJcIikpO1xufTtcbmNvbnN0IGVuY29kZUJsb2JBc0Jhc2U2NCA9IChkYXRhLCBjYWxsYmFjaykgPT4ge1xuICAgIGNvbnN0IGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgIGZpbGVSZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zdCBjb250ZW50ID0gZmlsZVJlYWRlci5yZXN1bHQuc3BsaXQoXCIsXCIpWzFdO1xuICAgICAgICBjYWxsYmFjayhcImJcIiArIChjb250ZW50IHx8IFwiXCIpKTtcbiAgICB9O1xuICAgIHJldHVybiBmaWxlUmVhZGVyLnJlYWRBc0RhdGFVUkwoZGF0YSk7XG59O1xuZnVuY3Rpb24gdG9BcnJheShkYXRhKSB7XG4gICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbiAgICBlbHNlIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGRhdGEpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KGRhdGEuYnVmZmVyLCBkYXRhLmJ5dGVPZmZzZXQsIGRhdGEuYnl0ZUxlbmd0aCk7XG4gICAgfVxufVxubGV0IFRFWFRfRU5DT0RFUjtcbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGVQYWNrZXRUb0JpbmFyeShwYWNrZXQsIGNhbGxiYWNrKSB7XG4gICAgaWYgKHdpdGhOYXRpdmVCbG9iICYmIHBhY2tldC5kYXRhIGluc3RhbmNlb2YgQmxvYikge1xuICAgICAgICByZXR1cm4gcGFja2V0LmRhdGEuYXJyYXlCdWZmZXIoKS50aGVuKHRvQXJyYXkpLnRoZW4oY2FsbGJhY2spO1xuICAgIH1cbiAgICBlbHNlIGlmICh3aXRoTmF0aXZlQXJyYXlCdWZmZXIgJiZcbiAgICAgICAgKHBhY2tldC5kYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHwgaXNWaWV3KHBhY2tldC5kYXRhKSkpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKHRvQXJyYXkocGFja2V0LmRhdGEpKTtcbiAgICB9XG4gICAgZW5jb2RlUGFja2V0KHBhY2tldCwgZmFsc2UsIChlbmNvZGVkKSA9PiB7XG4gICAgICAgIGlmICghVEVYVF9FTkNPREVSKSB7XG4gICAgICAgICAgICBURVhUX0VOQ09ERVIgPSBuZXcgVGV4dEVuY29kZXIoKTtcbiAgICAgICAgfVxuICAgICAgICBjYWxsYmFjayhURVhUX0VOQ09ERVIuZW5jb2RlKGVuY29kZWQpKTtcbiAgICB9KTtcbn1cbmV4cG9ydCB7IGVuY29kZVBhY2tldCB9O1xuIiwiLy8gaW1wb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vc29ja2V0aW8vYmFzZTY0LWFycmF5YnVmZmVyXG5jb25zdCBjaGFycyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJztcbi8vIFVzZSBhIGxvb2t1cCB0YWJsZSB0byBmaW5kIHRoZSBpbmRleC5cbmNvbnN0IGxvb2t1cCA9IHR5cGVvZiBVaW50OEFycmF5ID09PSAndW5kZWZpbmVkJyA/IFtdIDogbmV3IFVpbnQ4QXJyYXkoMjU2KTtcbmZvciAobGV0IGkgPSAwOyBpIDwgY2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICBsb29rdXBbY2hhcnMuY2hhckNvZGVBdChpKV0gPSBpO1xufVxuZXhwb3J0IGNvbnN0IGVuY29kZSA9IChhcnJheWJ1ZmZlcikgPT4ge1xuICAgIGxldCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKSwgaSwgbGVuID0gYnl0ZXMubGVuZ3RoLCBiYXNlNjQgPSAnJztcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDMpIHtcbiAgICAgICAgYmFzZTY0ICs9IGNoYXJzW2J5dGVzW2ldID4+IDJdO1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbKChieXRlc1tpXSAmIDMpIDw8IDQpIHwgKGJ5dGVzW2kgKyAxXSA+PiA0KV07XG4gICAgICAgIGJhc2U2NCArPSBjaGFyc1soKGJ5dGVzW2kgKyAxXSAmIDE1KSA8PCAyKSB8IChieXRlc1tpICsgMl0gPj4gNildO1xuICAgICAgICBiYXNlNjQgKz0gY2hhcnNbYnl0ZXNbaSArIDJdICYgNjNdO1xuICAgIH1cbiAgICBpZiAobGVuICUgMyA9PT0gMikge1xuICAgICAgICBiYXNlNjQgPSBiYXNlNjQuc3Vic3RyaW5nKDAsIGJhc2U2NC5sZW5ndGggLSAxKSArICc9JztcbiAgICB9XG4gICAgZWxzZSBpZiAobGVuICUgMyA9PT0gMSkge1xuICAgICAgICBiYXNlNjQgPSBiYXNlNjQuc3Vic3RyaW5nKDAsIGJhc2U2NC5sZW5ndGggLSAyKSArICc9PSc7XG4gICAgfVxuICAgIHJldHVybiBiYXNlNjQ7XG59O1xuZXhwb3J0IGNvbnN0IGRlY29kZSA9IChiYXNlNjQpID0+IHtcbiAgICBsZXQgYnVmZmVyTGVuZ3RoID0gYmFzZTY0Lmxlbmd0aCAqIDAuNzUsIGxlbiA9IGJhc2U2NC5sZW5ndGgsIGksIHAgPSAwLCBlbmNvZGVkMSwgZW5jb2RlZDIsIGVuY29kZWQzLCBlbmNvZGVkNDtcbiAgICBpZiAoYmFzZTY0W2Jhc2U2NC5sZW5ndGggLSAxXSA9PT0gJz0nKSB7XG4gICAgICAgIGJ1ZmZlckxlbmd0aC0tO1xuICAgICAgICBpZiAoYmFzZTY0W2Jhc2U2NC5sZW5ndGggLSAyXSA9PT0gJz0nKSB7XG4gICAgICAgICAgICBidWZmZXJMZW5ndGgtLTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBhcnJheWJ1ZmZlciA9IG5ldyBBcnJheUJ1ZmZlcihidWZmZXJMZW5ndGgpLCBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpICs9IDQpIHtcbiAgICAgICAgZW5jb2RlZDEgPSBsb29rdXBbYmFzZTY0LmNoYXJDb2RlQXQoaSldO1xuICAgICAgICBlbmNvZGVkMiA9IGxvb2t1cFtiYXNlNjQuY2hhckNvZGVBdChpICsgMSldO1xuICAgICAgICBlbmNvZGVkMyA9IGxvb2t1cFtiYXNlNjQuY2hhckNvZGVBdChpICsgMildO1xuICAgICAgICBlbmNvZGVkNCA9IGxvb2t1cFtiYXNlNjQuY2hhckNvZGVBdChpICsgMyldO1xuICAgICAgICBieXRlc1twKytdID0gKGVuY29kZWQxIDw8IDIpIHwgKGVuY29kZWQyID4+IDQpO1xuICAgICAgICBieXRlc1twKytdID0gKChlbmNvZGVkMiAmIDE1KSA8PCA0KSB8IChlbmNvZGVkMyA+PiAyKTtcbiAgICAgICAgYnl0ZXNbcCsrXSA9ICgoZW5jb2RlZDMgJiAzKSA8PCA2KSB8IChlbmNvZGVkNCAmIDYzKTtcbiAgICB9XG4gICAgcmV0dXJuIGFycmF5YnVmZmVyO1xufTtcbiIsImltcG9ydCB7IEVSUk9SX1BBQ0tFVCwgUEFDS0VUX1RZUEVTX1JFVkVSU0UsIH0gZnJvbSBcIi4vY29tbW9ucy5qc1wiO1xuaW1wb3J0IHsgZGVjb2RlIH0gZnJvbSBcIi4vY29udHJpYi9iYXNlNjQtYXJyYXlidWZmZXIuanNcIjtcbmNvbnN0IHdpdGhOYXRpdmVBcnJheUJ1ZmZlciA9IHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gXCJmdW5jdGlvblwiO1xuZXhwb3J0IGNvbnN0IGRlY29kZVBhY2tldCA9IChlbmNvZGVkUGFja2V0LCBiaW5hcnlUeXBlKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBlbmNvZGVkUGFja2V0ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICB0eXBlOiBcIm1lc3NhZ2VcIixcbiAgICAgICAgICAgIGRhdGE6IG1hcEJpbmFyeShlbmNvZGVkUGFja2V0LCBiaW5hcnlUeXBlKSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgY29uc3QgdHlwZSA9IGVuY29kZWRQYWNrZXQuY2hhckF0KDApO1xuICAgIGlmICh0eXBlID09PSBcImJcIikge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdHlwZTogXCJtZXNzYWdlXCIsXG4gICAgICAgICAgICBkYXRhOiBkZWNvZGVCYXNlNjRQYWNrZXQoZW5jb2RlZFBhY2tldC5zdWJzdHJpbmcoMSksIGJpbmFyeVR5cGUpLFxuICAgICAgICB9O1xuICAgIH1cbiAgICBjb25zdCBwYWNrZXRUeXBlID0gUEFDS0VUX1RZUEVTX1JFVkVSU0VbdHlwZV07XG4gICAgaWYgKCFwYWNrZXRUeXBlKSB7XG4gICAgICAgIHJldHVybiBFUlJPUl9QQUNLRVQ7XG4gICAgfVxuICAgIHJldHVybiBlbmNvZGVkUGFja2V0Lmxlbmd0aCA+IDFcbiAgICAgICAgPyB7XG4gICAgICAgICAgICB0eXBlOiBQQUNLRVRfVFlQRVNfUkVWRVJTRVt0eXBlXSxcbiAgICAgICAgICAgIGRhdGE6IGVuY29kZWRQYWNrZXQuc3Vic3RyaW5nKDEpLFxuICAgICAgICB9XG4gICAgICAgIDoge1xuICAgICAgICAgICAgdHlwZTogUEFDS0VUX1RZUEVTX1JFVkVSU0VbdHlwZV0sXG4gICAgICAgIH07XG59O1xuY29uc3QgZGVjb2RlQmFzZTY0UGFja2V0ID0gKGRhdGEsIGJpbmFyeVR5cGUpID0+IHtcbiAgICBpZiAod2l0aE5hdGl2ZUFycmF5QnVmZmVyKSB7XG4gICAgICAgIGNvbnN0IGRlY29kZWQgPSBkZWNvZGUoZGF0YSk7XG4gICAgICAgIHJldHVybiBtYXBCaW5hcnkoZGVjb2RlZCwgYmluYXJ5VHlwZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4geyBiYXNlNjQ6IHRydWUsIGRhdGEgfTsgLy8gZmFsbGJhY2sgZm9yIG9sZCBicm93c2Vyc1xuICAgIH1cbn07XG5jb25zdCBtYXBCaW5hcnkgPSAoZGF0YSwgYmluYXJ5VHlwZSkgPT4ge1xuICAgIHN3aXRjaCAoYmluYXJ5VHlwZSkge1xuICAgICAgICBjYXNlIFwiYmxvYlwiOlxuICAgICAgICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBCbG9iKSB7XG4gICAgICAgICAgICAgICAgLy8gZnJvbSBXZWJTb2NrZXQgKyBiaW5hcnlUeXBlIFwiYmxvYlwiXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBmcm9tIEhUVFAgbG9uZy1wb2xsaW5nIG9yIFdlYlRyYW5zcG9ydFxuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgQmxvYihbZGF0YV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICBjYXNlIFwiYXJyYXlidWZmZXJcIjpcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgICAgICAvLyBmcm9tIEhUVFAgbG9uZy1wb2xsaW5nIChiYXNlNjQpIG9yIFdlYlNvY2tldCArIGJpbmFyeVR5cGUgXCJhcnJheWJ1ZmZlclwiXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBmcm9tIFdlYlRyYW5zcG9ydCAoVWludDhBcnJheSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5idWZmZXI7XG4gICAgICAgICAgICB9XG4gICAgfVxufTtcbiIsImltcG9ydCB7IGVuY29kZVBhY2tldCwgZW5jb2RlUGFja2V0VG9CaW5hcnkgfSBmcm9tIFwiLi9lbmNvZGVQYWNrZXQuanNcIjtcbmltcG9ydCB7IGRlY29kZVBhY2tldCB9IGZyb20gXCIuL2RlY29kZVBhY2tldC5qc1wiO1xuaW1wb3J0IHsgRVJST1JfUEFDS0VULCB9IGZyb20gXCIuL2NvbW1vbnMuanNcIjtcbmNvbnN0IFNFUEFSQVRPUiA9IFN0cmluZy5mcm9tQ2hhckNvZGUoMzApOyAvLyBzZWUgaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvRGVsaW1pdGVyI0FTQ0lJX2RlbGltaXRlZF90ZXh0XG5jb25zdCBlbmNvZGVQYXlsb2FkID0gKHBhY2tldHMsIGNhbGxiYWNrKSA9PiB7XG4gICAgLy8gc29tZSBwYWNrZXRzIG1heSBiZSBhZGRlZCB0byB0aGUgYXJyYXkgd2hpbGUgZW5jb2RpbmcsIHNvIHRoZSBpbml0aWFsIGxlbmd0aCBtdXN0IGJlIHNhdmVkXG4gICAgY29uc3QgbGVuZ3RoID0gcGFja2V0cy5sZW5ndGg7XG4gICAgY29uc3QgZW5jb2RlZFBhY2tldHMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICBsZXQgY291bnQgPSAwO1xuICAgIHBhY2tldHMuZm9yRWFjaCgocGFja2V0LCBpKSA9PiB7XG4gICAgICAgIC8vIGZvcmNlIGJhc2U2NCBlbmNvZGluZyBmb3IgYmluYXJ5IHBhY2tldHNcbiAgICAgICAgZW5jb2RlUGFja2V0KHBhY2tldCwgZmFsc2UsIChlbmNvZGVkUGFja2V0KSA9PiB7XG4gICAgICAgICAgICBlbmNvZGVkUGFja2V0c1tpXSA9IGVuY29kZWRQYWNrZXQ7XG4gICAgICAgICAgICBpZiAoKytjb3VudCA9PT0gbGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soZW5jb2RlZFBhY2tldHMuam9pbihTRVBBUkFUT1IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG59O1xuY29uc3QgZGVjb2RlUGF5bG9hZCA9IChlbmNvZGVkUGF5bG9hZCwgYmluYXJ5VHlwZSkgPT4ge1xuICAgIGNvbnN0IGVuY29kZWRQYWNrZXRzID0gZW5jb2RlZFBheWxvYWQuc3BsaXQoU0VQQVJBVE9SKTtcbiAgICBjb25zdCBwYWNrZXRzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVkUGFja2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkZWNvZGVkUGFja2V0ID0gZGVjb2RlUGFja2V0KGVuY29kZWRQYWNrZXRzW2ldLCBiaW5hcnlUeXBlKTtcbiAgICAgICAgcGFja2V0cy5wdXNoKGRlY29kZWRQYWNrZXQpO1xuICAgICAgICBpZiAoZGVjb2RlZFBhY2tldC50eXBlID09PSBcImVycm9yXCIpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwYWNrZXRzO1xufTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQYWNrZXRFbmNvZGVyU3RyZWFtKCkge1xuICAgIHJldHVybiBuZXcgVHJhbnNmb3JtU3RyZWFtKHtcbiAgICAgICAgdHJhbnNmb3JtKHBhY2tldCwgY29udHJvbGxlcikge1xuICAgICAgICAgICAgZW5jb2RlUGFja2V0VG9CaW5hcnkocGFja2V0LCAoZW5jb2RlZFBhY2tldCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBheWxvYWRMZW5ndGggPSBlbmNvZGVkUGFja2V0Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICBsZXQgaGVhZGVyO1xuICAgICAgICAgICAgICAgIC8vIGluc3BpcmVkIGJ5IHRoZSBXZWJTb2NrZXQgZm9ybWF0OiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViU29ja2V0c19BUEkvV3JpdGluZ19XZWJTb2NrZXRfc2VydmVycyNkZWNvZGluZ19wYXlsb2FkX2xlbmd0aFxuICAgICAgICAgICAgICAgIGlmIChwYXlsb2FkTGVuZ3RoIDwgMTI2KSB7XG4gICAgICAgICAgICAgICAgICAgIGhlYWRlciA9IG5ldyBVaW50OEFycmF5KDEpO1xuICAgICAgICAgICAgICAgICAgICBuZXcgRGF0YVZpZXcoaGVhZGVyLmJ1ZmZlcikuc2V0VWludDgoMCwgcGF5bG9hZExlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHBheWxvYWRMZW5ndGggPCA2NTUzNikge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXIgPSBuZXcgVWludDhBcnJheSgzKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhoZWFkZXIuYnVmZmVyKTtcbiAgICAgICAgICAgICAgICAgICAgdmlldy5zZXRVaW50OCgwLCAxMjYpO1xuICAgICAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQxNigxLCBwYXlsb2FkTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGhlYWRlciA9IG5ldyBVaW50OEFycmF5KDkpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB2aWV3ID0gbmV3IERhdGFWaWV3KGhlYWRlci5idWZmZXIpO1xuICAgICAgICAgICAgICAgICAgICB2aWV3LnNldFVpbnQ4KDAsIDEyNyk7XG4gICAgICAgICAgICAgICAgICAgIHZpZXcuc2V0QmlnVWludDY0KDEsIEJpZ0ludChwYXlsb2FkTGVuZ3RoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGZpcnN0IGJpdCBpbmRpY2F0ZXMgd2hldGhlciB0aGUgcGF5bG9hZCBpcyBwbGFpbiB0ZXh0ICgwKSBvciBiaW5hcnkgKDEpXG4gICAgICAgICAgICAgICAgaWYgKHBhY2tldC5kYXRhICYmIHR5cGVvZiBwYWNrZXQuZGF0YSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXJbMF0gfD0gMHg4MDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGhlYWRlcik7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGVuY29kZWRQYWNrZXQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSk7XG59XG5sZXQgVEVYVF9ERUNPREVSO1xuZnVuY3Rpb24gdG90YWxMZW5ndGgoY2h1bmtzKSB7XG4gICAgcmV0dXJuIGNodW5rcy5yZWR1Y2UoKGFjYywgY2h1bmspID0+IGFjYyArIGNodW5rLmxlbmd0aCwgMCk7XG59XG5mdW5jdGlvbiBjb25jYXRDaHVua3MoY2h1bmtzLCBzaXplKSB7XG4gICAgaWYgKGNodW5rc1swXS5sZW5ndGggPT09IHNpemUpIHtcbiAgICAgICAgcmV0dXJuIGNodW5rcy5zaGlmdCgpO1xuICAgIH1cbiAgICBjb25zdCBidWZmZXIgPSBuZXcgVWludDhBcnJheShzaXplKTtcbiAgICBsZXQgaiA9IDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgYnVmZmVyW2ldID0gY2h1bmtzWzBdW2orK107XG4gICAgICAgIGlmIChqID09PSBjaHVua3NbMF0ubGVuZ3RoKSB7XG4gICAgICAgICAgICBjaHVua3Muc2hpZnQoKTtcbiAgICAgICAgICAgIGogPSAwO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChjaHVua3MubGVuZ3RoICYmIGogPCBjaHVua3NbMF0ubGVuZ3RoKSB7XG4gICAgICAgIGNodW5rc1swXSA9IGNodW5rc1swXS5zbGljZShqKTtcbiAgICB9XG4gICAgcmV0dXJuIGJ1ZmZlcjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQYWNrZXREZWNvZGVyU3RyZWFtKG1heFBheWxvYWQsIGJpbmFyeVR5cGUpIHtcbiAgICBpZiAoIVRFWFRfREVDT0RFUikge1xuICAgICAgICBURVhUX0RFQ09ERVIgPSBuZXcgVGV4dERlY29kZXIoKTtcbiAgICB9XG4gICAgY29uc3QgY2h1bmtzID0gW107XG4gICAgbGV0IHN0YXRlID0gMCAvKiBTdGF0ZS5SRUFEX0hFQURFUiAqLztcbiAgICBsZXQgZXhwZWN0ZWRMZW5ndGggPSAtMTtcbiAgICBsZXQgaXNCaW5hcnkgPSBmYWxzZTtcbiAgICByZXR1cm4gbmV3IFRyYW5zZm9ybVN0cmVhbSh7XG4gICAgICAgIHRyYW5zZm9ybShjaHVuaywgY29udHJvbGxlcikge1xuICAgICAgICAgICAgY2h1bmtzLnB1c2goY2h1bmspO1xuICAgICAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICAgICAgICBpZiAoc3RhdGUgPT09IDAgLyogU3RhdGUuUkVBRF9IRUFERVIgKi8pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvdGFsTGVuZ3RoKGNodW5rcykgPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBoZWFkZXIgPSBjb25jYXRDaHVua3MoY2h1bmtzLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgaXNCaW5hcnkgPSAoaGVhZGVyWzBdICYgMHg4MCkgPT09IDB4ODA7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkTGVuZ3RoID0gaGVhZGVyWzBdICYgMHg3ZjtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGV4cGVjdGVkTGVuZ3RoIDwgMTI2KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDMgLyogU3RhdGUuUkVBRF9QQVlMT0FEICovO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGV4cGVjdGVkTGVuZ3RoID09PSAxMjYpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMSAvKiBTdGF0ZS5SRUFEX0VYVEVOREVEX0xFTkdUSF8xNiAqLztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMiAvKiBTdGF0ZS5SRUFEX0VYVEVOREVEX0xFTkdUSF82NCAqLztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChzdGF0ZSA9PT0gMSAvKiBTdGF0ZS5SRUFEX0VYVEVOREVEX0xFTkdUSF8xNiAqLykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodG90YWxMZW5ndGgoY2h1bmtzKSA8IDIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGhlYWRlckFycmF5ID0gY29uY2F0Q2h1bmtzKGNodW5rcywgMik7XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkTGVuZ3RoID0gbmV3IERhdGFWaWV3KGhlYWRlckFycmF5LmJ1ZmZlciwgaGVhZGVyQXJyYXkuYnl0ZU9mZnNldCwgaGVhZGVyQXJyYXkubGVuZ3RoKS5nZXRVaW50MTYoMCk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMyAvKiBTdGF0ZS5SRUFEX1BBWUxPQUQgKi87XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHN0YXRlID09PSAyIC8qIFN0YXRlLlJFQURfRVhURU5ERURfTEVOR1RIXzY0ICovKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0b3RhbExlbmd0aChjaHVua3MpIDwgOCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGVhZGVyQXJyYXkgPSBjb25jYXRDaHVua3MoY2h1bmtzLCA4KTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmlldyA9IG5ldyBEYXRhVmlldyhoZWFkZXJBcnJheS5idWZmZXIsIGhlYWRlckFycmF5LmJ5dGVPZmZzZXQsIGhlYWRlckFycmF5Lmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG4gPSB2aWV3LmdldFVpbnQzMigwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG4gPiBNYXRoLnBvdygyLCA1MyAtIDMyKSAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSBtYXhpbXVtIHNhZmUgaW50ZWdlciBpbiBKYXZhU2NyaXB0IGlzIDJeNTMgLSAxXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoRVJST1JfUEFDS0VUKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGV4cGVjdGVkTGVuZ3RoID0gbiAqIE1hdGgucG93KDIsIDMyKSArIHZpZXcuZ2V0VWludDMyKDQpO1xuICAgICAgICAgICAgICAgICAgICBzdGF0ZSA9IDMgLyogU3RhdGUuUkVBRF9QQVlMT0FEICovO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRvdGFsTGVuZ3RoKGNodW5rcykgPCBleHBlY3RlZExlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YSA9IGNvbmNhdENodW5rcyhjaHVua3MsIGV4cGVjdGVkTGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlci5lbnF1ZXVlKGRlY29kZVBhY2tldChpc0JpbmFyeSA/IGRhdGEgOiBURVhUX0RFQ09ERVIuZGVjb2RlKGRhdGEpLCBiaW5hcnlUeXBlKSk7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRlID0gMCAvKiBTdGF0ZS5SRUFEX0hFQURFUiAqLztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGV4cGVjdGVkTGVuZ3RoID09PSAwIHx8IGV4cGVjdGVkTGVuZ3RoID4gbWF4UGF5bG9hZCkge1xuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyLmVucXVldWUoRVJST1JfUEFDS0VUKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH0pO1xufVxuZXhwb3J0IGNvbnN0IHByb3RvY29sID0gNDtcbmV4cG9ydCB7IGVuY29kZVBhY2tldCwgZW5jb2RlUGF5bG9hZCwgZGVjb2RlUGFja2V0LCBkZWNvZGVQYXlsb2FkLCB9O1xuIiwiXG4vKipcbiAqIEV4cG9zZSBgRW1pdHRlcmAuXG4gKi9cblxuZXhwb3J0cy5FbWl0dGVyID0gRW1pdHRlcjtcblxuLyoqXG4gKiBJbml0aWFsaXplIGEgbmV3IGBFbWl0dGVyYC5cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbmZ1bmN0aW9uIEVtaXR0ZXIob2JqKSB7XG4gIGlmIChvYmopIHJldHVybiBtaXhpbihvYmopO1xufVxuXG4vKipcbiAqIE1peGluIHRoZSBlbWl0dGVyIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHJldHVybiB7T2JqZWN0fVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gbWl4aW4ob2JqKSB7XG4gIGZvciAodmFyIGtleSBpbiBFbWl0dGVyLnByb3RvdHlwZSkge1xuICAgIG9ialtrZXldID0gRW1pdHRlci5wcm90b3R5cGVba2V5XTtcbiAgfVxuICByZXR1cm4gb2JqO1xufVxuXG4vKipcbiAqIExpc3RlbiBvbiB0aGUgZ2l2ZW4gYGV2ZW50YCB3aXRoIGBmbmAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RW1pdHRlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUub24gPVxuRW1pdHRlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcbiAgKHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF0gPSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdIHx8IFtdKVxuICAgIC5wdXNoKGZuKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZHMgYW4gYGV2ZW50YCBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgaW52b2tlZCBhIHNpbmdsZVxuICogdGltZSB0aGVuIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICogQGFwaSBwdWJsaWNcbiAqL1xuXG5FbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24oZXZlbnQsIGZuKXtcbiAgZnVuY3Rpb24gb24oKSB7XG4gICAgdGhpcy5vZmYoZXZlbnQsIG9uKTtcbiAgICBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgb24uZm4gPSBmbjtcbiAgdGhpcy5vbihldmVudCwgb24pO1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBnaXZlbiBjYWxsYmFjayBmb3IgYGV2ZW50YCBvciBhbGxcbiAqIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLm9mZiA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPVxuRW1pdHRlci5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcblxuICAvLyBhbGxcbiAgaWYgKDAgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xuICAgIHRoaXMuX2NhbGxiYWNrcyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gc3BlY2lmaWMgZXZlbnRcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF07XG4gIGlmICghY2FsbGJhY2tzKSByZXR1cm4gdGhpcztcblxuICAvLyByZW1vdmUgYWxsIGhhbmRsZXJzXG4gIGlmICgxID09IGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIHJlbW92ZSBzcGVjaWZpYyBoYW5kbGVyXG4gIHZhciBjYjtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYWxsYmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICBjYiA9IGNhbGxiYWNrc1tpXTtcbiAgICBpZiAoY2IgPT09IGZuIHx8IGNiLmZuID09PSBmbikge1xuICAgICAgY2FsbGJhY2tzLnNwbGljZShpLCAxKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlbW92ZSBldmVudCBzcGVjaWZpYyBhcnJheXMgZm9yIGV2ZW50IHR5cGVzIHRoYXQgbm9cbiAgLy8gb25lIGlzIHN1YnNjcmliZWQgZm9yIHRvIGF2b2lkIG1lbW9yeSBsZWFrLlxuICBpZiAoY2FsbGJhY2tzLmxlbmd0aCA9PT0gMCkge1xuICAgIGRlbGV0ZSB0aGlzLl9jYWxsYmFja3NbJyQnICsgZXZlbnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEVtaXQgYGV2ZW50YCB3aXRoIHRoZSBnaXZlbiBhcmdzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHBhcmFtIHtNaXhlZH0gLi4uXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudCl7XG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcblxuICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSlcbiAgICAsIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1snJCcgKyBldmVudF07XG5cbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgfVxuXG4gIGlmIChjYWxsYmFja3MpIHtcbiAgICBjYWxsYmFja3MgPSBjYWxsYmFja3Muc2xpY2UoMCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGNhbGxiYWNrcy5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgY2FsbGJhY2tzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gYWxpYXMgdXNlZCBmb3IgcmVzZXJ2ZWQgZXZlbnRzIChwcm90ZWN0ZWQgbWV0aG9kKVxuRW1pdHRlci5wcm90b3R5cGUuZW1pdFJlc2VydmVkID0gRW1pdHRlci5wcm90b3R5cGUuZW1pdDtcblxuLyoqXG4gKiBSZXR1cm4gYXJyYXkgb2YgY2FsbGJhY2tzIGZvciBgZXZlbnRgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7QXJyYXl9XG4gKiBAYXBpIHB1YmxpY1xuICovXG5cbkVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xuICByZXR1cm4gdGhpcy5fY2FsbGJhY2tzWyckJyArIGV2ZW50XSB8fCBbXTtcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgdGhpcyBlbWl0dGVyIGhhcyBgZXZlbnRgIGhhbmRsZXJzLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqIEBhcGkgcHVibGljXG4gKi9cblxuRW1pdHRlci5wcm90b3R5cGUuaGFzTGlzdGVuZXJzID0gZnVuY3Rpb24oZXZlbnQpe1xuICByZXR1cm4gISEgdGhpcy5saXN0ZW5lcnMoZXZlbnQpLmxlbmd0aDtcbn07XG4iLCJleHBvcnQgY29uc3QgbmV4dFRpY2sgPSAoKCkgPT4ge1xuICAgIGNvbnN0IGlzUHJvbWlzZUF2YWlsYWJsZSA9IHR5cGVvZiBQcm9taXNlID09PSBcImZ1bmN0aW9uXCIgJiYgdHlwZW9mIFByb21pc2UucmVzb2x2ZSA9PT0gXCJmdW5jdGlvblwiO1xuICAgIGlmIChpc1Byb21pc2VBdmFpbGFibGUpIHtcbiAgICAgICAgcmV0dXJuIChjYikgPT4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihjYik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gKGNiLCBzZXRUaW1lb3V0Rm4pID0+IHNldFRpbWVvdXRGbihjYiwgMCk7XG4gICAgfVxufSkoKTtcbmV4cG9ydCBjb25zdCBnbG9iYWxUaGlzU2hpbSA9ICgoKSA9PiB7XG4gICAgaWYgKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHJldHVybiB3aW5kb3c7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gRnVuY3Rpb24oXCJyZXR1cm4gdGhpc1wiKSgpO1xuICAgIH1cbn0pKCk7XG5leHBvcnQgY29uc3QgZGVmYXVsdEJpbmFyeVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29va2llSmFyKCkgeyB9XG4iLCJpbXBvcnQgeyBnbG9iYWxUaGlzU2hpbSBhcyBnbG9iYWxUaGlzIH0gZnJvbSBcIi4vZ2xvYmFscy5ub2RlLmpzXCI7XG5leHBvcnQgZnVuY3Rpb24gcGljayhvYmosIC4uLmF0dHIpIHtcbiAgICByZXR1cm4gYXR0ci5yZWR1Y2UoKGFjYywgaykgPT4ge1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICBhY2Nba10gPSBvYmpba107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG59XG4vLyBLZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSByZWFsIHRpbWVvdXQgZnVuY3Rpb25zIHNvIHRoZXkgY2FuIGJlIHVzZWQgd2hlbiBvdmVycmlkZGVuXG5jb25zdCBOQVRJVkVfU0VUX1RJTUVPVVQgPSBnbG9iYWxUaGlzLnNldFRpbWVvdXQ7XG5jb25zdCBOQVRJVkVfQ0xFQVJfVElNRU9VVCA9IGdsb2JhbFRoaXMuY2xlYXJUaW1lb3V0O1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbGxUaW1lckZ1bmN0aW9ucyhvYmosIG9wdHMpIHtcbiAgICBpZiAob3B0cy51c2VOYXRpdmVUaW1lcnMpIHtcbiAgICAgICAgb2JqLnNldFRpbWVvdXRGbiA9IE5BVElWRV9TRVRfVElNRU9VVC5iaW5kKGdsb2JhbFRoaXMpO1xuICAgICAgICBvYmouY2xlYXJUaW1lb3V0Rm4gPSBOQVRJVkVfQ0xFQVJfVElNRU9VVC5iaW5kKGdsb2JhbFRoaXMpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgb2JqLnNldFRpbWVvdXRGbiA9IGdsb2JhbFRoaXMuc2V0VGltZW91dC5iaW5kKGdsb2JhbFRoaXMpO1xuICAgICAgICBvYmouY2xlYXJUaW1lb3V0Rm4gPSBnbG9iYWxUaGlzLmNsZWFyVGltZW91dC5iaW5kKGdsb2JhbFRoaXMpO1xuICAgIH1cbn1cbi8vIGJhc2U2NCBlbmNvZGVkIGJ1ZmZlcnMgYXJlIGFib3V0IDMzJSBiaWdnZXIgKGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0Jhc2U2NClcbmNvbnN0IEJBU0U2NF9PVkVSSEVBRCA9IDEuMzM7XG4vLyB3ZSBjb3VsZCBhbHNvIGhhdmUgdXNlZCBgbmV3IEJsb2IoW29ial0pLnNpemVgLCBidXQgaXQgaXNuJ3Qgc3VwcG9ydGVkIGluIElFOVxuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVMZW5ndGgob2JqKSB7XG4gICAgaWYgKHR5cGVvZiBvYmogPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgcmV0dXJuIHV0ZjhMZW5ndGgob2JqKTtcbiAgICB9XG4gICAgLy8gYXJyYXlidWZmZXIgb3IgYmxvYlxuICAgIHJldHVybiBNYXRoLmNlaWwoKG9iai5ieXRlTGVuZ3RoIHx8IG9iai5zaXplKSAqIEJBU0U2NF9PVkVSSEVBRCk7XG59XG5mdW5jdGlvbiB1dGY4TGVuZ3RoKHN0cikge1xuICAgIGxldCBjID0gMCwgbGVuZ3RoID0gMDtcbiAgICBmb3IgKGxldCBpID0gMCwgbCA9IHN0ci5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgYyA9IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgICAgICBpZiAoYyA8IDB4ODApIHtcbiAgICAgICAgICAgIGxlbmd0aCArPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPCAweDgwMCkge1xuICAgICAgICAgICAgbGVuZ3RoICs9IDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYyA8IDB4ZDgwMCB8fCBjID49IDB4ZTAwMCkge1xuICAgICAgICAgICAgbGVuZ3RoICs9IDM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBsZW5ndGggKz0gNDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbGVuZ3RoO1xufVxuLyoqXG4gKiBHZW5lcmF0ZXMgYSByYW5kb20gOC1jaGFyYWN0ZXJzIHN0cmluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJhbmRvbVN0cmluZygpIHtcbiAgICByZXR1cm4gKERhdGUubm93KCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygzKSArXG4gICAgICAgIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA1KSk7XG59XG4iLCIvLyBpbXBvcnRlZCBmcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9nYWxrbi9xdWVyeXN0cmluZ1xuLyoqXG4gKiBDb21waWxlcyBhIHF1ZXJ5c3RyaW5nXG4gKiBSZXR1cm5zIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgb2JqZWN0XG4gKlxuICogQHBhcmFtIHtPYmplY3R9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuY29kZShvYmopIHtcbiAgICBsZXQgc3RyID0gJyc7XG4gICAgZm9yIChsZXQgaSBpbiBvYmopIHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgaWYgKHN0ci5sZW5ndGgpXG4gICAgICAgICAgICAgICAgc3RyICs9ICcmJztcbiAgICAgICAgICAgIHN0ciArPSBlbmNvZGVVUklDb21wb25lbnQoaSkgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQob2JqW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3RyO1xufVxuLyoqXG4gKiBQYXJzZXMgYSBzaW1wbGUgcXVlcnlzdHJpbmcgaW50byBhbiBvYmplY3RcbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gcXNcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGVjb2RlKHFzKSB7XG4gICAgbGV0IHFyeSA9IHt9O1xuICAgIGxldCBwYWlycyA9IHFzLnNwbGl0KCcmJyk7XG4gICAgZm9yIChsZXQgaSA9IDAsIGwgPSBwYWlycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgbGV0IHBhaXIgPSBwYWlyc1tpXS5zcGxpdCgnPScpO1xuICAgICAgICBxcnlbZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMF0pXSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKTtcbiAgICB9XG4gICAgcmV0dXJuIHFyeTtcbn1cbiIsImltcG9ydCB7IGRlY29kZVBhY2tldCB9IGZyb20gXCJlbmdpbmUuaW8tcGFyc2VyXCI7XG5pbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbmltcG9ydCB7IGluc3RhbGxUaW1lckZ1bmN0aW9ucyB9IGZyb20gXCIuL3V0aWwuanNcIjtcbmltcG9ydCB7IGVuY29kZSB9IGZyb20gXCIuL2NvbnRyaWIvcGFyc2Vxcy5qc1wiO1xuZXhwb3J0IGNsYXNzIFRyYW5zcG9ydEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAgIGNvbnN0cnVjdG9yKHJlYXNvbiwgZGVzY3JpcHRpb24sIGNvbnRleHQpIHtcbiAgICAgICAgc3VwZXIocmVhc29uKTtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2NyaXB0aW9uO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLnR5cGUgPSBcIlRyYW5zcG9ydEVycm9yXCI7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFRyYW5zcG9ydCBleHRlbmRzIEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIFRyYW5zcG9ydCBhYnN0cmFjdCBjb25zdHJ1Y3Rvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzIC0gb3B0aW9uc1xuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgaW5zdGFsbFRpbWVyRnVuY3Rpb25zKHRoaXMsIG9wdHMpO1xuICAgICAgICB0aGlzLm9wdHMgPSBvcHRzO1xuICAgICAgICB0aGlzLnF1ZXJ5ID0gb3B0cy5xdWVyeTtcbiAgICAgICAgdGhpcy5zb2NrZXQgPSBvcHRzLnNvY2tldDtcbiAgICAgICAgdGhpcy5zdXBwb3J0c0JpbmFyeSA9ICFvcHRzLmZvcmNlQmFzZTY0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbWl0cyBhbiBlcnJvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSByZWFzb25cbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb25cbiAgICAgKiBAcGFyYW0gY29udGV4dCAtIHRoZSBlcnJvciBjb250ZXh0XG4gICAgICogQHJldHVybiB7VHJhbnNwb3J0fSBmb3IgY2hhaW5pbmdcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25FcnJvcihyZWFzb24sIGRlc2NyaXB0aW9uLCBjb250ZXh0KSB7XG4gICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIG5ldyBUcmFuc3BvcnRFcnJvcihyZWFzb24sIGRlc2NyaXB0aW9uLCBjb250ZXh0KSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBPcGVucyB0aGUgdHJhbnNwb3J0LlxuICAgICAqL1xuICAgIG9wZW4oKSB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwib3BlbmluZ1wiO1xuICAgICAgICB0aGlzLmRvT3BlbigpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xvc2VzIHRoZSB0cmFuc3BvcnQuXG4gICAgICovXG4gICAgY2xvc2UoKSB7XG4gICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IFwib3BlbmluZ1wiIHx8IHRoaXMucmVhZHlTdGF0ZSA9PT0gXCJvcGVuXCIpIHtcbiAgICAgICAgICAgIHRoaXMuZG9DbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy5vbkNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIG11bHRpcGxlIHBhY2tldHMuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwYWNrZXRzXG4gICAgICovXG4gICAgc2VuZChwYWNrZXRzKSB7XG4gICAgICAgIGlmICh0aGlzLnJlYWR5U3RhdGUgPT09IFwib3BlblwiKSB7XG4gICAgICAgICAgICB0aGlzLndyaXRlKHBhY2tldHMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhpcyBtaWdodCBoYXBwZW4gaWYgdGhlIHRyYW5zcG9ydCB3YXMgc2lsZW50bHkgY2xvc2VkIGluIHRoZSBiZWZvcmV1bmxvYWQgZXZlbnQgaGFuZGxlclxuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIG9wZW5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBvbk9wZW4oKSB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwib3BlblwiO1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwib3BlblwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdpdGggZGF0YS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBkYXRhXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uRGF0YShkYXRhKSB7XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IGRlY29kZVBhY2tldChkYXRhLCB0aGlzLnNvY2tldC5iaW5hcnlUeXBlKTtcbiAgICAgICAgdGhpcy5vblBhY2tldChwYWNrZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgd2l0aCBhIGRlY29kZWQgcGFja2V0LlxuICAgICAqXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIG9uUGFja2V0KHBhY2tldCkge1xuICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJwYWNrZXRcIiwgcGFja2V0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gY2xvc2UuXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25DbG9zZShkZXRhaWxzKSB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwiY2xvc2VkXCI7XG4gICAgICAgIHN1cGVyLmVtaXRSZXNlcnZlZChcImNsb3NlXCIsIGRldGFpbHMpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBQYXVzZXMgdGhlIHRyYW5zcG9ydCwgaW4gb3JkZXIgbm90IHRvIGxvc2UgcGFja2V0cyBkdXJpbmcgYW4gdXBncmFkZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBvblBhdXNlXG4gICAgICovXG4gICAgcGF1c2Uob25QYXVzZSkgeyB9XG4gICAgY3JlYXRlVXJpKHNjaGVtYSwgcXVlcnkgPSB7fSkge1xuICAgICAgICByZXR1cm4gKHNjaGVtYSArXG4gICAgICAgICAgICBcIjovL1wiICtcbiAgICAgICAgICAgIHRoaXMuX2hvc3RuYW1lKCkgK1xuICAgICAgICAgICAgdGhpcy5fcG9ydCgpICtcbiAgICAgICAgICAgIHRoaXMub3B0cy5wYXRoICtcbiAgICAgICAgICAgIHRoaXMuX3F1ZXJ5KHF1ZXJ5KSk7XG4gICAgfVxuICAgIF9ob3N0bmFtZSgpIHtcbiAgICAgICAgY29uc3QgaG9zdG5hbWUgPSB0aGlzLm9wdHMuaG9zdG5hbWU7XG4gICAgICAgIHJldHVybiBob3N0bmFtZS5pbmRleE9mKFwiOlwiKSA9PT0gLTEgPyBob3N0bmFtZSA6IFwiW1wiICsgaG9zdG5hbWUgKyBcIl1cIjtcbiAgICB9XG4gICAgX3BvcnQoKSB7XG4gICAgICAgIGlmICh0aGlzLm9wdHMucG9ydCAmJlxuICAgICAgICAgICAgKCh0aGlzLm9wdHMuc2VjdXJlICYmIE51bWJlcih0aGlzLm9wdHMucG9ydCkgIT09IDQ0MykgfHxcbiAgICAgICAgICAgICAgICAoIXRoaXMub3B0cy5zZWN1cmUgJiYgTnVtYmVyKHRoaXMub3B0cy5wb3J0KSAhPT0gODApKSkge1xuICAgICAgICAgICAgcmV0dXJuIFwiOlwiICsgdGhpcy5vcHRzLnBvcnQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gXCJcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBfcXVlcnkocXVlcnkpIHtcbiAgICAgICAgY29uc3QgZW5jb2RlZFF1ZXJ5ID0gZW5jb2RlKHF1ZXJ5KTtcbiAgICAgICAgcmV0dXJuIGVuY29kZWRRdWVyeS5sZW5ndGggPyBcIj9cIiArIGVuY29kZWRRdWVyeSA6IFwiXCI7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgVHJhbnNwb3J0IH0gZnJvbSBcIi4uL3RyYW5zcG9ydC5qc1wiO1xuaW1wb3J0IHsgcmFuZG9tU3RyaW5nIH0gZnJvbSBcIi4uL3V0aWwuanNcIjtcbmltcG9ydCB7IGVuY29kZVBheWxvYWQsIGRlY29kZVBheWxvYWQgfSBmcm9tIFwiZW5naW5lLmlvLXBhcnNlclwiO1xuZXhwb3J0IGNsYXNzIFBvbGxpbmcgZXh0ZW5kcyBUcmFuc3BvcnQge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLl9wb2xsaW5nID0gZmFsc2U7XG4gICAgfVxuICAgIGdldCBuYW1lKCkge1xuICAgICAgICByZXR1cm4gXCJwb2xsaW5nXCI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE9wZW5zIHRoZSBzb2NrZXQgKHRyaWdnZXJzIHBvbGxpbmcpLiBXZSB3cml0ZSBhIFBJTkcgbWVzc2FnZSB0byBkZXRlcm1pbmVcbiAgICAgKiB3aGVuIHRoZSB0cmFuc3BvcnQgaXMgb3Blbi5cbiAgICAgKlxuICAgICAqIEBwcm90ZWN0ZWRcbiAgICAgKi9cbiAgICBkb09wZW4oKSB7XG4gICAgICAgIHRoaXMuX3BvbGwoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogUGF1c2VzIHBvbGxpbmcuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBvblBhdXNlIC0gY2FsbGJhY2sgdXBvbiBidWZmZXJzIGFyZSBmbHVzaGVkIGFuZCB0cmFuc3BvcnQgaXMgcGF1c2VkXG4gICAgICogQHBhY2thZ2VcbiAgICAgKi9cbiAgICBwYXVzZShvblBhdXNlKSB7XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwicGF1c2luZ1wiO1xuICAgICAgICBjb25zdCBwYXVzZSA9ICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwicGF1c2VkXCI7XG4gICAgICAgICAgICBvblBhdXNlKCk7XG4gICAgICAgIH07XG4gICAgICAgIGlmICh0aGlzLl9wb2xsaW5nIHx8ICF0aGlzLndyaXRhYmxlKSB7XG4gICAgICAgICAgICBsZXQgdG90YWwgPSAwO1xuICAgICAgICAgICAgaWYgKHRoaXMuX3BvbGxpbmcpIHtcbiAgICAgICAgICAgICAgICB0b3RhbCsrO1xuICAgICAgICAgICAgICAgIHRoaXMub25jZShcInBvbGxDb21wbGV0ZVwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIC0tdG90YWwgfHwgcGF1c2UoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghdGhpcy53cml0YWJsZSkge1xuICAgICAgICAgICAgICAgIHRvdGFsKys7XG4gICAgICAgICAgICAgICAgdGhpcy5vbmNlKFwiZHJhaW5cIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAtLXRvdGFsIHx8IHBhdXNlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXVzZSgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyBwb2xsaW5nIGN5Y2xlLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcG9sbCgpIHtcbiAgICAgICAgdGhpcy5fcG9sbGluZyA9IHRydWU7XG4gICAgICAgIHRoaXMuZG9Qb2xsKCk7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicG9sbFwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3ZlcmxvYWRzIG9uRGF0YSB0byBkZXRlY3QgcGF5bG9hZHMuXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgb25EYXRhKGRhdGEpIHtcbiAgICAgICAgY29uc3QgY2FsbGJhY2sgPSAocGFja2V0KSA9PiB7XG4gICAgICAgICAgICAvLyBpZiBpdHMgdGhlIGZpcnN0IG1lc3NhZ2Ugd2UgY29uc2lkZXIgdGhlIHRyYW5zcG9ydCBvcGVuXG4gICAgICAgICAgICBpZiAoXCJvcGVuaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSAmJiBwYWNrZXQudHlwZSA9PT0gXCJvcGVuXCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uT3BlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgaXRzIGEgY2xvc2UgcGFja2V0LCB3ZSBjbG9zZSB0aGUgb25nb2luZyByZXF1ZXN0c1xuICAgICAgICAgICAgaWYgKFwiY2xvc2VcIiA9PT0gcGFja2V0LnR5cGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9uQ2xvc2UoeyBkZXNjcmlwdGlvbjogXCJ0cmFuc3BvcnQgY2xvc2VkIGJ5IHRoZSBzZXJ2ZXJcIiB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBvdGhlcndpc2UgYnlwYXNzIG9uRGF0YSBhbmQgaGFuZGxlIHRoZSBtZXNzYWdlXG4gICAgICAgICAgICB0aGlzLm9uUGFja2V0KHBhY2tldCk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIGRlY29kZSBwYXlsb2FkXG4gICAgICAgIGRlY29kZVBheWxvYWQoZGF0YSwgdGhpcy5zb2NrZXQuYmluYXJ5VHlwZSkuZm9yRWFjaChjYWxsYmFjayk7XG4gICAgICAgIC8vIGlmIGFuIGV2ZW50IGRpZCBub3QgdHJpZ2dlciBjbG9zaW5nXG4gICAgICAgIGlmIChcImNsb3NlZFwiICE9PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIC8vIGlmIHdlIGdvdCBkYXRhIHdlJ3JlIG5vdCBwb2xsaW5nXG4gICAgICAgICAgICB0aGlzLl9wb2xsaW5nID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBvbGxDb21wbGV0ZVwiKTtcbiAgICAgICAgICAgIGlmIChcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fcG9sbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogRm9yIHBvbGxpbmcsIHNlbmQgYSBjbG9zZSBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcHJvdGVjdGVkXG4gICAgICovXG4gICAgZG9DbG9zZSgpIHtcbiAgICAgICAgY29uc3QgY2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLndyaXRlKFt7IHR5cGU6IFwiY2xvc2VcIiB9XSk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaW4gY2FzZSB3ZSdyZSB0cnlpbmcgdG8gY2xvc2Ugd2hpbGVcbiAgICAgICAgICAgIC8vIGhhbmRzaGFraW5nIGlzIGluIHByb2dyZXNzIChHSC0xNjQpXG4gICAgICAgICAgICB0aGlzLm9uY2UoXCJvcGVuXCIsIGNsb3NlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBXcml0ZXMgYSBwYWNrZXRzIHBheWxvYWQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0FycmF5fSBwYWNrZXRzIC0gZGF0YSBwYWNrZXRzXG4gICAgICogQHByb3RlY3RlZFxuICAgICAqL1xuICAgIHdyaXRlKHBhY2tldHMpIHtcbiAgICAgICAgdGhpcy53cml0YWJsZSA9IGZhbHNlO1xuICAgICAgICBlbmNvZGVQYXlsb2FkKHBhY2tldHMsIChkYXRhKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmRvV3JpdGUoZGF0YSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMud3JpdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZHJhaW5cIik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlcyB1cmkgZm9yIGNvbm5lY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHVyaSgpIHtcbiAgICAgICAgY29uc3Qgc2NoZW1hID0gdGhpcy5vcHRzLnNlY3VyZSA/IFwiaHR0cHNcIiA6IFwiaHR0cFwiO1xuICAgICAgICBjb25zdCBxdWVyeSA9IHRoaXMucXVlcnkgfHwge307XG4gICAgICAgIC8vIGNhY2hlIGJ1c3RpbmcgaXMgZm9yY2VkXG4gICAgICAgIGlmIChmYWxzZSAhPT0gdGhpcy5vcHRzLnRpbWVzdGFtcFJlcXVlc3RzKSB7XG4gICAgICAgICAgICBxdWVyeVt0aGlzLm9wdHMudGltZXN0YW1wUGFyYW1dID0gcmFuZG9tU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLnN1cHBvcnRzQmluYXJ5ICYmICFxdWVyeS5zaWQpIHtcbiAgICAgICAgICAgIHF1ZXJ5LmI2NCA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY3JlYXRlVXJpKHNjaGVtYSwgcXVlcnkpO1xuICAgIH1cbn1cbiIsIi8vIGltcG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2NvbXBvbmVudC9oYXMtY29yc1xubGV0IHZhbHVlID0gZmFsc2U7XG50cnkge1xuICAgIHZhbHVlID0gdHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgICAnd2l0aENyZWRlbnRpYWxzJyBpbiBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbn1cbmNhdGNoIChlcnIpIHtcbiAgICAvLyBpZiBYTUxIdHRwIHN1cHBvcnQgaXMgZGlzYWJsZWQgaW4gSUUgdGhlbiBpdCB3aWxsIHRocm93XG4gICAgLy8gd2hlbiB0cnlpbmcgdG8gY3JlYXRlXG59XG5leHBvcnQgY29uc3QgaGFzQ09SUyA9IHZhbHVlO1xuIiwiaW1wb3J0IHsgUG9sbGluZyB9IGZyb20gXCIuL3BvbGxpbmcuanNcIjtcbmltcG9ydCB7IEVtaXR0ZXIgfSBmcm9tIFwiQHNvY2tldC5pby9jb21wb25lbnQtZW1pdHRlclwiO1xuaW1wb3J0IHsgaW5zdGFsbFRpbWVyRnVuY3Rpb25zLCBwaWNrIH0gZnJvbSBcIi4uL3V0aWwuanNcIjtcbmltcG9ydCB7IGdsb2JhbFRoaXNTaGltIGFzIGdsb2JhbFRoaXMgfSBmcm9tIFwiLi4vZ2xvYmFscy5ub2RlLmpzXCI7XG5pbXBvcnQgeyBoYXNDT1JTIH0gZnJvbSBcIi4uL2NvbnRyaWIvaGFzLWNvcnMuanNcIjtcbmZ1bmN0aW9uIGVtcHR5KCkgeyB9XG5leHBvcnQgY2xhc3MgQmFzZVhIUiBleHRlbmRzIFBvbGxpbmcge1xuICAgIC8qKlxuICAgICAqIFhIUiBQb2xsaW5nIGNvbnN0cnVjdG9yLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdHNcbiAgICAgKiBAcGFja2FnZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKG9wdHMpIHtcbiAgICAgICAgc3VwZXIob3B0cyk7XG4gICAgICAgIGlmICh0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IGlzU1NMID0gXCJodHRwczpcIiA9PT0gbG9jYXRpb24ucHJvdG9jb2w7XG4gICAgICAgICAgICBsZXQgcG9ydCA9IGxvY2F0aW9uLnBvcnQ7XG4gICAgICAgICAgICAvLyBzb21lIHVzZXIgYWdlbnRzIGhhdmUgZW1wdHkgYGxvY2F0aW9uLnBvcnRgXG4gICAgICAgICAgICBpZiAoIXBvcnQpIHtcbiAgICAgICAgICAgICAgICBwb3J0ID0gaXNTU0wgPyBcIjQ0M1wiIDogXCI4MFwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy54ZCA9XG4gICAgICAgICAgICAgICAgKHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICAgICAgICAgICAgICBvcHRzLmhvc3RuYW1lICE9PSBsb2NhdGlvbi5ob3N0bmFtZSkgfHxcbiAgICAgICAgICAgICAgICAgICAgcG9ydCAhPT0gb3B0cy5wb3J0O1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGRhdGEuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gZGF0YSB0byBzZW5kLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxlZCB1cG9uIGZsdXNoLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZG9Xcml0ZShkYXRhLCBmbikge1xuICAgICAgICBjb25zdCByZXEgPSB0aGlzLnJlcXVlc3Qoe1xuICAgICAgICAgICAgbWV0aG9kOiBcIlBPU1RcIixcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgIH0pO1xuICAgICAgICByZXEub24oXCJzdWNjZXNzXCIsIGZuKTtcbiAgICAgICAgcmVxLm9uKFwiZXJyb3JcIiwgKHhoclN0YXR1cywgY29udGV4dCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKFwieGhyIHBvc3QgZXJyb3JcIiwgeGhyU3RhdHVzLCBjb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyBhIHBvbGwgY3ljbGUuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGRvUG9sbCgpIHtcbiAgICAgICAgY29uc3QgcmVxID0gdGhpcy5yZXF1ZXN0KCk7XG4gICAgICAgIHJlcS5vbihcImRhdGFcIiwgdGhpcy5vbkRhdGEuYmluZCh0aGlzKSk7XG4gICAgICAgIHJlcS5vbihcImVycm9yXCIsICh4aHJTdGF0dXMsIGNvbnRleHQpID0+IHtcbiAgICAgICAgICAgIHRoaXMub25FcnJvcihcInhociBwb2xsIGVycm9yXCIsIHhoclN0YXR1cywgY29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLnBvbGxYaHIgPSByZXE7XG4gICAgfVxufVxuZXhwb3J0IGNsYXNzIFJlcXVlc3QgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBSZXF1ZXN0IGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgICAqIEBwYWNrYWdlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoY3JlYXRlUmVxdWVzdCwgdXJpLCBvcHRzKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMuY3JlYXRlUmVxdWVzdCA9IGNyZWF0ZVJlcXVlc3Q7XG4gICAgICAgIGluc3RhbGxUaW1lckZ1bmN0aW9ucyh0aGlzLCBvcHRzKTtcbiAgICAgICAgdGhpcy5fb3B0cyA9IG9wdHM7XG4gICAgICAgIHRoaXMuX21ldGhvZCA9IG9wdHMubWV0aG9kIHx8IFwiR0VUXCI7XG4gICAgICAgIHRoaXMuX3VyaSA9IHVyaTtcbiAgICAgICAgdGhpcy5fZGF0YSA9IHVuZGVmaW5lZCAhPT0gb3B0cy5kYXRhID8gb3B0cy5kYXRhIDogbnVsbDtcbiAgICAgICAgdGhpcy5fY3JlYXRlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdGhlIFhIUiBvYmplY3QgYW5kIHNlbmRzIHRoZSByZXF1ZXN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3JlYXRlKCkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGNvbnN0IG9wdHMgPSBwaWNrKHRoaXMuX29wdHMsIFwiYWdlbnRcIiwgXCJwZnhcIiwgXCJrZXlcIiwgXCJwYXNzcGhyYXNlXCIsIFwiY2VydFwiLCBcImNhXCIsIFwiY2lwaGVyc1wiLCBcInJlamVjdFVuYXV0aG9yaXplZFwiLCBcImF1dG9VbnJlZlwiKTtcbiAgICAgICAgb3B0cy54ZG9tYWluID0gISF0aGlzLl9vcHRzLnhkO1xuICAgICAgICBjb25zdCB4aHIgPSAodGhpcy5feGhyID0gdGhpcy5jcmVhdGVSZXF1ZXN0KG9wdHMpKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHhoci5vcGVuKHRoaXMuX21ldGhvZCwgdGhpcy5fdXJpLCB0cnVlKTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX29wdHMuZXh0cmFIZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgeGhyLnNldERpc2FibGVIZWFkZXJDaGVjayAmJiB4aHIuc2V0RGlzYWJsZUhlYWRlckNoZWNrKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBpIGluIHRoaXMuX29wdHMuZXh0cmFIZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5fb3B0cy5leHRyYUhlYWRlcnMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihpLCB0aGlzLl9vcHRzLmV4dHJhSGVhZGVyc1tpXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICBpZiAoXCJQT1NUXCIgPT09IHRoaXMuX21ldGhvZCkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQ29udGVudC10eXBlXCIsIFwidGV4dC9wbGFpbjtjaGFyc2V0PVVURi04XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKFwiQWNjZXB0XCIsIFwiKi8qXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgKF9hID0gdGhpcy5fb3B0cy5jb29raWVKYXIpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS5hZGRDb29raWVzKHhocik7XG4gICAgICAgICAgICAvLyBpZTYgY2hlY2tcbiAgICAgICAgICAgIGlmIChcIndpdGhDcmVkZW50aWFsc1wiIGluIHhocikge1xuICAgICAgICAgICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSB0aGlzLl9vcHRzLndpdGhDcmVkZW50aWFscztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh0aGlzLl9vcHRzLnJlcXVlc3RUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgeGhyLnRpbWVvdXQgPSB0aGlzLl9vcHRzLnJlcXVlc3RUaW1lb3V0O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB2YXIgX2E7XG4gICAgICAgICAgICAgICAgaWYgKHhoci5yZWFkeVN0YXRlID09PSAzKSB7XG4gICAgICAgICAgICAgICAgICAgIChfYSA9IHRoaXMuX29wdHMuY29va2llSmFyKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2EucGFyc2VDb29raWVzKFxuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIHhoci5nZXRSZXNwb25zZUhlYWRlcihcInNldC1jb29raWVcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoNCAhPT0geGhyLnJlYWR5U3RhdGUpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBpZiAoMjAwID09PSB4aHIuc3RhdHVzIHx8IDEyMjMgPT09IHhoci5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb25Mb2FkKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIGBlcnJvcmAgZXZlbnQgaGFuZGxlciB0aGF0J3MgdXNlci1zZXRcbiAgICAgICAgICAgICAgICAgICAgLy8gZG9lcyBub3QgdGhyb3cgaW4gdGhlIHNhbWUgdGljayBhbmQgZ2V0cyBjYXVnaHQgaGVyZVxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9vbkVycm9yKHR5cGVvZiB4aHIuc3RhdHVzID09PSBcIm51bWJlclwiID8geGhyLnN0YXR1cyA6IDApO1xuICAgICAgICAgICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgeGhyLnNlbmQodGhpcy5fZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIC8vIE5lZWQgdG8gZGVmZXIgc2luY2UgLmNyZWF0ZSgpIGlzIGNhbGxlZCBkaXJlY3RseSBmcm9tIHRoZSBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgLy8gYW5kIHRodXMgdGhlICdlcnJvcicgZXZlbnQgY2FuIG9ubHkgYmUgb25seSBib3VuZCAqYWZ0ZXIqIHRoaXMgZXhjZXB0aW9uXG4gICAgICAgICAgICAvLyBvY2N1cnMuICBUaGVyZWZvcmUsIGFsc28sIHdlIGNhbm5vdCB0aHJvdyBoZXJlIGF0IGFsbC5cbiAgICAgICAgICAgIHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vbkVycm9yKGUpO1xuICAgICAgICAgICAgfSwgMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdGhpcy5faW5kZXggPSBSZXF1ZXN0LnJlcXVlc3RzQ291bnQrKztcbiAgICAgICAgICAgIFJlcXVlc3QucmVxdWVzdHNbdGhpcy5faW5kZXhdID0gdGhpcztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBlcnJvci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uRXJyb3IoZXJyKSB7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgZXJyLCB0aGlzLl94aHIpO1xuICAgICAgICB0aGlzLl9jbGVhbnVwKHRydWUpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbGVhbnMgdXAgaG91c2UuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jbGVhbnVwKGZyb21FcnJvcikge1xuICAgICAgICBpZiAoXCJ1bmRlZmluZWRcIiA9PT0gdHlwZW9mIHRoaXMuX3hociB8fCBudWxsID09PSB0aGlzLl94aHIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl94aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZW1wdHk7XG4gICAgICAgIGlmIChmcm9tRXJyb3IpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5feGhyLmFib3J0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBkb2N1bWVudCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgZGVsZXRlIFJlcXVlc3QucmVxdWVzdHNbdGhpcy5faW5kZXhdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3hociA9IG51bGw7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGxvYWQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9vbkxvYWQoKSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLl94aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICBpZiAoZGF0YSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkYXRhXCIsIGRhdGEpO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJzdWNjZXNzXCIpO1xuICAgICAgICAgICAgdGhpcy5fY2xlYW51cCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFib3J0cyB0aGUgcmVxdWVzdC5cbiAgICAgKlxuICAgICAqIEBwYWNrYWdlXG4gICAgICovXG4gICAgYWJvcnQoKSB7XG4gICAgICAgIHRoaXMuX2NsZWFudXAoKTtcbiAgICB9XG59XG5SZXF1ZXN0LnJlcXVlc3RzQ291bnQgPSAwO1xuUmVxdWVzdC5yZXF1ZXN0cyA9IHt9O1xuLyoqXG4gKiBBYm9ydHMgcGVuZGluZyByZXF1ZXN0cyB3aGVuIHVubG9hZGluZyB0aGUgd2luZG93LiBUaGlzIGlzIG5lZWRlZCB0byBwcmV2ZW50XG4gKiBtZW1vcnkgbGVha3MgKGUuZy4gd2hlbiB1c2luZyBJRSkgYW5kIHRvIGVuc3VyZSB0aGF0IG5vIHNwdXJpb3VzIGVycm9yIGlzXG4gKiBlbWl0dGVkLlxuICovXG5pZiAodHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGlmICh0eXBlb2YgYXR0YWNoRXZlbnQgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIGF0dGFjaEV2ZW50KFwib251bmxvYWRcIiwgdW5sb2FkSGFuZGxlcik7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBhZGRFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY29uc3QgdGVybWluYXRpb25FdmVudCA9IFwib25wYWdlaGlkZVwiIGluIGdsb2JhbFRoaXMgPyBcInBhZ2VoaWRlXCIgOiBcInVubG9hZFwiO1xuICAgICAgICBhZGRFdmVudExpc3RlbmVyKHRlcm1pbmF0aW9uRXZlbnQsIHVubG9hZEhhbmRsZXIsIGZhbHNlKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1bmxvYWRIYW5kbGVyKCkge1xuICAgIGZvciAobGV0IGkgaW4gUmVxdWVzdC5yZXF1ZXN0cykge1xuICAgICAgICBpZiAoUmVxdWVzdC5yZXF1ZXN0cy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgUmVxdWVzdC5yZXF1ZXN0c1tpXS5hYm9ydCgpO1xuICAgICAgICB9XG4gICAgfVxufVxuY29uc3QgaGFzWEhSMiA9IChmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgeGhyID0gbmV3UmVxdWVzdCh7XG4gICAgICAgIHhkb21haW46IGZhbHNlLFxuICAgIH0pO1xuICAgIHJldHVybiB4aHIgJiYgeGhyLnJlc3BvbnNlVHlwZSAhPT0gbnVsbDtcbn0pKCk7XG4vKipcbiAqIEhUVFAgbG9uZy1wb2xsaW5nIGJhc2VkIG9uIHRoZSBidWlsdC1pbiBgWE1MSHR0cFJlcXVlc3RgIG9iamVjdC5cbiAqXG4gKiBVc2FnZTogYnJvd3NlclxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1hNTEh0dHBSZXF1ZXN0XG4gKi9cbmV4cG9ydCBjbGFzcyBYSFIgZXh0ZW5kcyBCYXNlWEhSIHtcbiAgICBjb25zdHJ1Y3RvcihvcHRzKSB7XG4gICAgICAgIHN1cGVyKG9wdHMpO1xuICAgICAgICBjb25zdCBmb3JjZUJhc2U2NCA9IG9wdHMgJiYgb3B0cy5mb3JjZUJhc2U2NDtcbiAgICAgICAgdGhpcy5zdXBwb3J0c0JpbmFyeSA9IGhhc1hIUjIgJiYgIWZvcmNlQmFzZTY0O1xuICAgIH1cbiAgICByZXF1ZXN0KG9wdHMgPSB7fSkge1xuICAgICAgICBPYmplY3QuYXNzaWduKG9wdHMsIHsgeGQ6IHRoaXMueGQgfSwgdGhpcy5vcHRzKTtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXF1ZXN0KG5ld1JlcXVlc3QsIHRoaXMudXJpKCksIG9wdHMpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG5ld1JlcXVlc3Qob3B0cykge1xuICAgIGNvbnN0IHhkb21haW4gPSBvcHRzLnhkb21haW47XG4gICAgLy8gWE1MSHR0cFJlcXVlc3QgY2FuIGJlIGRpc2FibGVkIG9uIElFXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKFwidW5kZWZpbmVkXCIgIT09IHR5cGVvZiBYTUxIdHRwUmVxdWVzdCAmJiAoIXhkb21haW4gfHwgaGFzQ09SUykpIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoZSkgeyB9XG4gICAgaWYgKCF4ZG9tYWluKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGdsb2JhbFRoaXNbW1wiQWN0aXZlXCJdLmNvbmNhdChcIk9iamVjdFwiKS5qb2luKFwiWFwiKV0oXCJNaWNyb3NvZnQuWE1MSFRUUFwiKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkgeyB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgVHJhbnNwb3J0IH0gZnJvbSBcIi4uL3RyYW5zcG9ydC5qc1wiO1xuaW1wb3J0IHsgcGljaywgcmFuZG9tU3RyaW5nIH0gZnJvbSBcIi4uL3V0aWwuanNcIjtcbmltcG9ydCB7IGVuY29kZVBhY2tldCB9IGZyb20gXCJlbmdpbmUuaW8tcGFyc2VyXCI7XG5pbXBvcnQgeyBnbG9iYWxUaGlzU2hpbSBhcyBnbG9iYWxUaGlzLCBuZXh0VGljayB9IGZyb20gXCIuLi9nbG9iYWxzLm5vZGUuanNcIjtcbi8vIGRldGVjdCBSZWFjdE5hdGl2ZSBlbnZpcm9ubWVudFxuY29uc3QgaXNSZWFjdE5hdGl2ZSA9IHR5cGVvZiBuYXZpZ2F0b3IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICB0eXBlb2YgbmF2aWdhdG9yLnByb2R1Y3QgPT09IFwic3RyaW5nXCIgJiZcbiAgICBuYXZpZ2F0b3IucHJvZHVjdC50b0xvd2VyQ2FzZSgpID09PSBcInJlYWN0bmF0aXZlXCI7XG5leHBvcnQgY2xhc3MgQmFzZVdTIGV4dGVuZHMgVHJhbnNwb3J0IHtcbiAgICBnZXQgbmFtZSgpIHtcbiAgICAgICAgcmV0dXJuIFwid2Vic29ja2V0XCI7XG4gICAgfVxuICAgIGRvT3BlbigpIHtcbiAgICAgICAgY29uc3QgdXJpID0gdGhpcy51cmkoKTtcbiAgICAgICAgY29uc3QgcHJvdG9jb2xzID0gdGhpcy5vcHRzLnByb3RvY29scztcbiAgICAgICAgLy8gUmVhY3QgTmF0aXZlIG9ubHkgc3VwcG9ydHMgdGhlICdoZWFkZXJzJyBvcHRpb24sIGFuZCB3aWxsIHByaW50IGEgd2FybmluZyBpZiBhbnl0aGluZyBlbHNlIGlzIHBhc3NlZFxuICAgICAgICBjb25zdCBvcHRzID0gaXNSZWFjdE5hdGl2ZVxuICAgICAgICAgICAgPyB7fVxuICAgICAgICAgICAgOiBwaWNrKHRoaXMub3B0cywgXCJhZ2VudFwiLCBcInBlck1lc3NhZ2VEZWZsYXRlXCIsIFwicGZ4XCIsIFwia2V5XCIsIFwicGFzc3BocmFzZVwiLCBcImNlcnRcIiwgXCJjYVwiLCBcImNpcGhlcnNcIiwgXCJyZWplY3RVbmF1dGhvcml6ZWRcIiwgXCJsb2NhbEFkZHJlc3NcIiwgXCJwcm90b2NvbFZlcnNpb25cIiwgXCJvcmlnaW5cIiwgXCJtYXhQYXlsb2FkXCIsIFwiZmFtaWx5XCIsIFwiY2hlY2tTZXJ2ZXJJZGVudGl0eVwiKTtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5leHRyYUhlYWRlcnMpIHtcbiAgICAgICAgICAgIG9wdHMuaGVhZGVycyA9IHRoaXMub3B0cy5leHRyYUhlYWRlcnM7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMud3MgPSB0aGlzLmNyZWF0ZVNvY2tldCh1cmksIHByb3RvY29scywgb3B0cyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLndzLmJpbmFyeVR5cGUgPSB0aGlzLnNvY2tldC5iaW5hcnlUeXBlO1xuICAgICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXJzKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBzb2NrZXRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgYWRkRXZlbnRMaXN0ZW5lcnMoKSB7XG4gICAgICAgIHRoaXMud3Mub25vcGVuID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5hdXRvVW5yZWYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndzLl9zb2NrZXQudW5yZWYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMub25PcGVuKCk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMud3Mub25jbG9zZSA9IChjbG9zZUV2ZW50KSA9PiB0aGlzLm9uQ2xvc2Uoe1xuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwid2Vic29ja2V0IGNvbm5lY3Rpb24gY2xvc2VkXCIsXG4gICAgICAgICAgICBjb250ZXh0OiBjbG9zZUV2ZW50LFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy53cy5vbm1lc3NhZ2UgPSAoZXYpID0+IHRoaXMub25EYXRhKGV2LmRhdGEpO1xuICAgICAgICB0aGlzLndzLm9uZXJyb3IgPSAoZSkgPT4gdGhpcy5vbkVycm9yKFwid2Vic29ja2V0IGVycm9yXCIsIGUpO1xuICAgIH1cbiAgICB3cml0ZShwYWNrZXRzKSB7XG4gICAgICAgIHRoaXMud3JpdGFibGUgPSBmYWxzZTtcbiAgICAgICAgLy8gZW5jb2RlUGFja2V0IGVmZmljaWVudCBhcyBpdCB1c2VzIFdTIGZyYW1pbmdcbiAgICAgICAgLy8gbm8gbmVlZCBmb3IgZW5jb2RlUGF5bG9hZFxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhY2tldHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHBhY2tldCA9IHBhY2tldHNbaV07XG4gICAgICAgICAgICBjb25zdCBsYXN0UGFja2V0ID0gaSA9PT0gcGFja2V0cy5sZW5ndGggLSAxO1xuICAgICAgICAgICAgZW5jb2RlUGFja2V0KHBhY2tldCwgdGhpcy5zdXBwb3J0c0JpbmFyeSwgKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAvLyBTb21ldGltZXMgdGhlIHdlYnNvY2tldCBoYXMgYWxyZWFkeSBiZWVuIGNsb3NlZCBidXQgdGhlIGJyb3dzZXIgZGlkbid0XG4gICAgICAgICAgICAgICAgLy8gaGF2ZSBhIGNoYW5jZSBvZiBpbmZvcm1pbmcgdXMgYWJvdXQgaXQgeWV0LCBpbiB0aGF0IGNhc2Ugc2VuZCB3aWxsXG4gICAgICAgICAgICAgICAgLy8gdGhyb3cgYW4gZXJyb3JcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmRvV3JpdGUocGFja2V0LCBkYXRhKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKGxhc3RQYWNrZXQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZmFrZSBkcmFpblxuICAgICAgICAgICAgICAgICAgICAvLyBkZWZlciB0byBuZXh0IHRpY2sgdG8gYWxsb3cgU29ja2V0IHRvIGNsZWFyIHdyaXRlQnVmZmVyXG4gICAgICAgICAgICAgICAgICAgIG5leHRUaWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud3JpdGFibGUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkcmFpblwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgdGhpcy5zZXRUaW1lb3V0Rm4pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRvQ2xvc2UoKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy53cyAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdGhpcy53cy5vbmVycm9yID0gKCkgPT4geyB9O1xuICAgICAgICAgICAgdGhpcy53cy5jbG9zZSgpO1xuICAgICAgICAgICAgdGhpcy53cyA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIHVyaSBmb3IgY29ubmVjdGlvbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgdXJpKCkge1xuICAgICAgICBjb25zdCBzY2hlbWEgPSB0aGlzLm9wdHMuc2VjdXJlID8gXCJ3c3NcIiA6IFwid3NcIjtcbiAgICAgICAgY29uc3QgcXVlcnkgPSB0aGlzLnF1ZXJ5IHx8IHt9O1xuICAgICAgICAvLyBhcHBlbmQgdGltZXN0YW1wIHRvIFVSSVxuICAgICAgICBpZiAodGhpcy5vcHRzLnRpbWVzdGFtcFJlcXVlc3RzKSB7XG4gICAgICAgICAgICBxdWVyeVt0aGlzLm9wdHMudGltZXN0YW1wUGFyYW1dID0gcmFuZG9tU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gY29tbXVuaWNhdGUgYmluYXJ5IHN1cHBvcnQgY2FwYWJpbGl0aWVzXG4gICAgICAgIGlmICghdGhpcy5zdXBwb3J0c0JpbmFyeSkge1xuICAgICAgICAgICAgcXVlcnkuYjY0ID0gMTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5jcmVhdGVVcmkoc2NoZW1hLCBxdWVyeSk7XG4gICAgfVxufVxuY29uc3QgV2ViU29ja2V0Q3RvciA9IGdsb2JhbFRoaXMuV2ViU29ja2V0IHx8IGdsb2JhbFRoaXMuTW96V2ViU29ja2V0O1xuLyoqXG4gKiBXZWJTb2NrZXQgdHJhbnNwb3J0IGJhc2VkIG9uIHRoZSBidWlsdC1pbiBgV2ViU29ja2V0YCBvYmplY3QuXG4gKlxuICogVXNhZ2U6IGJyb3dzZXIsIE5vZGUuanMgKHNpbmNlIHYyMSksIERlbm8sIEJ1blxuICpcbiAqIEBzZWUgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL1dlYlNvY2tldFxuICogQHNlZSBodHRwczovL2Nhbml1c2UuY29tL21kbi1hcGlfd2Vic29ja2V0XG4gKiBAc2VlIGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZ2xvYmFscy5odG1sI3dlYnNvY2tldFxuICovXG5leHBvcnQgY2xhc3MgV1MgZXh0ZW5kcyBCYXNlV1Mge1xuICAgIGNyZWF0ZVNvY2tldCh1cmksIHByb3RvY29scywgb3B0cykge1xuICAgICAgICByZXR1cm4gIWlzUmVhY3ROYXRpdmVcbiAgICAgICAgICAgID8gcHJvdG9jb2xzXG4gICAgICAgICAgICAgICAgPyBuZXcgV2ViU29ja2V0Q3Rvcih1cmksIHByb3RvY29scylcbiAgICAgICAgICAgICAgICA6IG5ldyBXZWJTb2NrZXRDdG9yKHVyaSlcbiAgICAgICAgICAgIDogbmV3IFdlYlNvY2tldEN0b3IodXJpLCBwcm90b2NvbHMsIG9wdHMpO1xuICAgIH1cbiAgICBkb1dyaXRlKF9wYWNrZXQsIGRhdGEpIHtcbiAgICAgICAgdGhpcy53cy5zZW5kKGRhdGEpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IFRyYW5zcG9ydCB9IGZyb20gXCIuLi90cmFuc3BvcnQuanNcIjtcbmltcG9ydCB7IG5leHRUaWNrIH0gZnJvbSBcIi4uL2dsb2JhbHMubm9kZS5qc1wiO1xuaW1wb3J0IHsgY3JlYXRlUGFja2V0RGVjb2RlclN0cmVhbSwgY3JlYXRlUGFja2V0RW5jb2RlclN0cmVhbSwgfSBmcm9tIFwiZW5naW5lLmlvLXBhcnNlclwiO1xuLyoqXG4gKiBXZWJUcmFuc3BvcnQgdHJhbnNwb3J0IGJhc2VkIG9uIHRoZSBidWlsdC1pbiBgV2ViVHJhbnNwb3J0YCBvYmplY3QuXG4gKlxuICogVXNhZ2U6IGJyb3dzZXIsIE5vZGUuanMgKHdpdGggdGhlIGBAZmFpbHMtY29tcG9uZW50cy93ZWJ0cmFuc3BvcnRgIHBhY2thZ2UpXG4gKlxuICogQHNlZSBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvV2ViVHJhbnNwb3J0XG4gKiBAc2VlIGh0dHBzOi8vY2FuaXVzZS5jb20vd2VidHJhbnNwb3J0XG4gKi9cbmV4cG9ydCBjbGFzcyBXVCBleHRlbmRzIFRyYW5zcG9ydCB7XG4gICAgZ2V0IG5hbWUoKSB7XG4gICAgICAgIHJldHVybiBcIndlYnRyYW5zcG9ydFwiO1xuICAgIH1cbiAgICBkb09wZW4oKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0aGlzLl90cmFuc3BvcnQgPSBuZXcgV2ViVHJhbnNwb3J0KHRoaXMuY3JlYXRlVXJpKFwiaHR0cHNcIiksIHRoaXMub3B0cy50cmFuc3BvcnRPcHRpb25zW3RoaXMubmFtZV0pO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIGVycik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fdHJhbnNwb3J0LmNsb3NlZFxuICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vbkNsb3NlKCk7XG4gICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgdGhpcy5vbkVycm9yKFwid2VidHJhbnNwb3J0IGVycm9yXCIsIGVycik7XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBub3RlOiB3ZSBjb3VsZCBoYXZlIHVzZWQgYXN5bmMvYXdhaXQsIGJ1dCB0aGF0IHdvdWxkIHJlcXVpcmUgc29tZSBhZGRpdGlvbmFsIHBvbHlmaWxsc1xuICAgICAgICB0aGlzLl90cmFuc3BvcnQucmVhZHkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl90cmFuc3BvcnQuY3JlYXRlQmlkaXJlY3Rpb25hbFN0cmVhbSgpLnRoZW4oKHN0cmVhbSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlY29kZXJTdHJlYW0gPSBjcmVhdGVQYWNrZXREZWNvZGVyU3RyZWFtKE51bWJlci5NQVhfU0FGRV9JTlRFR0VSLCB0aGlzLnNvY2tldC5iaW5hcnlUeXBlKTtcbiAgICAgICAgICAgICAgICBjb25zdCByZWFkZXIgPSBzdHJlYW0ucmVhZGFibGUucGlwZVRocm91Z2goZGVjb2RlclN0cmVhbSkuZ2V0UmVhZGVyKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgZW5jb2RlclN0cmVhbSA9IGNyZWF0ZVBhY2tldEVuY29kZXJTdHJlYW0oKTtcbiAgICAgICAgICAgICAgICBlbmNvZGVyU3RyZWFtLnJlYWRhYmxlLnBpcGVUbyhzdHJlYW0ud3JpdGFibGUpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dyaXRlciA9IGVuY29kZXJTdHJlYW0ud3JpdGFibGUuZ2V0V3JpdGVyKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVhZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVhZGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAucmVhZCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbigoeyBkb25lLCB2YWx1ZSB9KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9uZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25QYWNrZXQodmFsdWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVhZCgpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZWFkKCk7XG4gICAgICAgICAgICAgICAgY29uc3QgcGFja2V0ID0geyB0eXBlOiBcIm9wZW5cIiB9O1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnF1ZXJ5LnNpZCkge1xuICAgICAgICAgICAgICAgICAgICBwYWNrZXQuZGF0YSA9IGB7XCJzaWRcIjpcIiR7dGhpcy5xdWVyeS5zaWR9XCJ9YDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fd3JpdGVyLndyaXRlKHBhY2tldCkudGhlbigoKSA9PiB0aGlzLm9uT3BlbigpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgd3JpdGUocGFja2V0cykge1xuICAgICAgICB0aGlzLndyaXRhYmxlID0gZmFsc2U7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcGFja2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcGFja2V0ID0gcGFja2V0c1tpXTtcbiAgICAgICAgICAgIGNvbnN0IGxhc3RQYWNrZXQgPSBpID09PSBwYWNrZXRzLmxlbmd0aCAtIDE7XG4gICAgICAgICAgICB0aGlzLl93cml0ZXIud3JpdGUocGFja2V0KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobGFzdFBhY2tldCkge1xuICAgICAgICAgICAgICAgICAgICBuZXh0VGljaygoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndyaXRhYmxlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZHJhaW5cIik7XG4gICAgICAgICAgICAgICAgICAgIH0sIHRoaXMuc2V0VGltZW91dEZuKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBkb0Nsb3NlKCkge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIChfYSA9IHRoaXMuX3RyYW5zcG9ydCkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmNsb3NlKCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgWEhSIH0gZnJvbSBcIi4vcG9sbGluZy14aHIubm9kZS5qc1wiO1xuaW1wb3J0IHsgV1MgfSBmcm9tIFwiLi93ZWJzb2NrZXQubm9kZS5qc1wiO1xuaW1wb3J0IHsgV1QgfSBmcm9tIFwiLi93ZWJ0cmFuc3BvcnQuanNcIjtcbmV4cG9ydCBjb25zdCB0cmFuc3BvcnRzID0ge1xuICAgIHdlYnNvY2tldDogV1MsXG4gICAgd2VidHJhbnNwb3J0OiBXVCxcbiAgICBwb2xsaW5nOiBYSFIsXG59O1xuIiwiLy8gaW1wb3J0ZWQgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vZ2Fsa24vcGFyc2V1cmlcbi8qKlxuICogUGFyc2VzIGEgVVJJXG4gKlxuICogTm90ZTogd2UgY291bGQgYWxzbyBoYXZlIHVzZWQgdGhlIGJ1aWx0LWluIFVSTCBvYmplY3QsIGJ1dCBpdCBpc24ndCBzdXBwb3J0ZWQgb24gYWxsIHBsYXRmb3Jtcy5cbiAqXG4gKiBTZWU6XG4gKiAtIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9VUkxcbiAqIC0gaHR0cHM6Ly9jYW5pdXNlLmNvbS91cmxcbiAqIC0gaHR0cHM6Ly93d3cucmZjLWVkaXRvci5vcmcvcmZjL3JmYzM5ODYjYXBwZW5kaXgtQlxuICpcbiAqIEhpc3Rvcnkgb2YgdGhlIHBhcnNlKCkgbWV0aG9kOlxuICogLSBmaXJzdCBjb21taXQ6IGh0dHBzOi8vZ2l0aHViLmNvbS9zb2NrZXRpby9zb2NrZXQuaW8tY2xpZW50L2NvbW1pdC80ZWUxZDVkOTRiMzkwNmE5YzA1MmI0NTlmMWE4MThiMTVmMzhmOTFjXG4gKiAtIGV4cG9ydCBpbnRvIGl0cyBvd24gbW9kdWxlOiBodHRwczovL2dpdGh1Yi5jb20vc29ja2V0aW8vZW5naW5lLmlvLWNsaWVudC9jb21taXQvZGUyYzU2MWU0NTY0ZWZlYjc4ZjFiZGIxYmEzOWVmODFiMjgyMmNiM1xuICogLSByZWltcG9ydDogaHR0cHM6Ly9naXRodWIuY29tL3NvY2tldGlvL2VuZ2luZS5pby1jbGllbnQvY29tbWl0L2RmMzIyNzdjM2Y2ZDYyMmVlYzVlZDA5ZjQ5M2NhZTNmMzM5MWQyNDJcbiAqXG4gKiBAYXV0aG9yIFN0ZXZlbiBMZXZpdGhhbiA8c3RldmVubGV2aXRoYW4uY29tPiAoTUlUIGxpY2Vuc2UpXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuY29uc3QgcmUgPSAvXig/Oig/IVteOkBcXC8/I10rOlteOkBcXC9dKkApKGh0dHB8aHR0cHN8d3N8d3NzKTpcXC9cXC8pPygoPzooKFteOkBcXC8/I10qKSg/OjooW146QFxcLz8jXSopKT8pP0ApPygoPzpbYS1mMC05XXswLDR9Oil7Miw3fVthLWYwLTldezAsNH18W146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLztcbmNvbnN0IHBhcnRzID0gW1xuICAgICdzb3VyY2UnLCAncHJvdG9jb2wnLCAnYXV0aG9yaXR5JywgJ3VzZXJJbmZvJywgJ3VzZXInLCAncGFzc3dvcmQnLCAnaG9zdCcsICdwb3J0JywgJ3JlbGF0aXZlJywgJ3BhdGgnLCAnZGlyZWN0b3J5JywgJ2ZpbGUnLCAncXVlcnknLCAnYW5jaG9yJ1xuXTtcbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShzdHIpIHtcbiAgICBpZiAoc3RyLmxlbmd0aCA+IDgwMDApIHtcbiAgICAgICAgdGhyb3cgXCJVUkkgdG9vIGxvbmdcIjtcbiAgICB9XG4gICAgY29uc3Qgc3JjID0gc3RyLCBiID0gc3RyLmluZGV4T2YoJ1snKSwgZSA9IHN0ci5pbmRleE9mKCddJyk7XG4gICAgaWYgKGIgIT0gLTEgJiYgZSAhPSAtMSkge1xuICAgICAgICBzdHIgPSBzdHIuc3Vic3RyaW5nKDAsIGIpICsgc3RyLnN1YnN0cmluZyhiLCBlKS5yZXBsYWNlKC86L2csICc7JykgKyBzdHIuc3Vic3RyaW5nKGUsIHN0ci5sZW5ndGgpO1xuICAgIH1cbiAgICBsZXQgbSA9IHJlLmV4ZWMoc3RyIHx8ICcnKSwgdXJpID0ge30sIGkgPSAxNDtcbiAgICB3aGlsZSAoaS0tKSB7XG4gICAgICAgIHVyaVtwYXJ0c1tpXV0gPSBtW2ldIHx8ICcnO1xuICAgIH1cbiAgICBpZiAoYiAhPSAtMSAmJiBlICE9IC0xKSB7XG4gICAgICAgIHVyaS5zb3VyY2UgPSBzcmM7XG4gICAgICAgIHVyaS5ob3N0ID0gdXJpLmhvc3Quc3Vic3RyaW5nKDEsIHVyaS5ob3N0Lmxlbmd0aCAtIDEpLnJlcGxhY2UoLzsvZywgJzonKTtcbiAgICAgICAgdXJpLmF1dGhvcml0eSA9IHVyaS5hdXRob3JpdHkucmVwbGFjZSgnWycsICcnKS5yZXBsYWNlKCddJywgJycpLnJlcGxhY2UoLzsvZywgJzonKTtcbiAgICAgICAgdXJpLmlwdjZ1cmkgPSB0cnVlO1xuICAgIH1cbiAgICB1cmkucGF0aE5hbWVzID0gcGF0aE5hbWVzKHVyaSwgdXJpWydwYXRoJ10pO1xuICAgIHVyaS5xdWVyeUtleSA9IHF1ZXJ5S2V5KHVyaSwgdXJpWydxdWVyeSddKTtcbiAgICByZXR1cm4gdXJpO1xufVxuZnVuY3Rpb24gcGF0aE5hbWVzKG9iaiwgcGF0aCkge1xuICAgIGNvbnN0IHJlZ3ggPSAvXFwvezIsOX0vZywgbmFtZXMgPSBwYXRoLnJlcGxhY2UocmVneCwgXCIvXCIpLnNwbGl0KFwiL1wiKTtcbiAgICBpZiAocGF0aC5zbGljZSgwLCAxKSA9PSAnLycgfHwgcGF0aC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbmFtZXMuc3BsaWNlKDAsIDEpO1xuICAgIH1cbiAgICBpZiAocGF0aC5zbGljZSgtMSkgPT0gJy8nKSB7XG4gICAgICAgIG5hbWVzLnNwbGljZShuYW1lcy5sZW5ndGggLSAxLCAxKTtcbiAgICB9XG4gICAgcmV0dXJuIG5hbWVzO1xufVxuZnVuY3Rpb24gcXVlcnlLZXkodXJpLCBxdWVyeSkge1xuICAgIGNvbnN0IGRhdGEgPSB7fTtcbiAgICBxdWVyeS5yZXBsYWNlKC8oPzpefCYpKFteJj1dKik9PyhbXiZdKikvZywgZnVuY3Rpb24gKCQwLCAkMSwgJDIpIHtcbiAgICAgICAgaWYgKCQxKSB7XG4gICAgICAgICAgICBkYXRhWyQxXSA9ICQyO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRhdGE7XG59XG4iLCJpbXBvcnQgeyB0cmFuc3BvcnRzIGFzIERFRkFVTFRfVFJBTlNQT1JUUyB9IGZyb20gXCIuL3RyYW5zcG9ydHMvaW5kZXguanNcIjtcbmltcG9ydCB7IGluc3RhbGxUaW1lckZ1bmN0aW9ucywgYnl0ZUxlbmd0aCB9IGZyb20gXCIuL3V0aWwuanNcIjtcbmltcG9ydCB7IGRlY29kZSB9IGZyb20gXCIuL2NvbnRyaWIvcGFyc2Vxcy5qc1wiO1xuaW1wb3J0IHsgcGFyc2UgfSBmcm9tIFwiLi9jb250cmliL3BhcnNldXJpLmpzXCI7XG5pbXBvcnQgeyBFbWl0dGVyIH0gZnJvbSBcIkBzb2NrZXQuaW8vY29tcG9uZW50LWVtaXR0ZXJcIjtcbmltcG9ydCB7IHByb3RvY29sIH0gZnJvbSBcImVuZ2luZS5pby1wYXJzZXJcIjtcbmltcG9ydCB7IGNyZWF0ZUNvb2tpZUphciwgZGVmYXVsdEJpbmFyeVR5cGUsIG5leHRUaWNrLCB9IGZyb20gXCIuL2dsb2JhbHMubm9kZS5qc1wiO1xuY29uc3Qgd2l0aEV2ZW50TGlzdGVuZXJzID0gdHlwZW9mIGFkZEV2ZW50TGlzdGVuZXIgPT09IFwiZnVuY3Rpb25cIiAmJlxuICAgIHR5cGVvZiByZW1vdmVFdmVudExpc3RlbmVyID09PSBcImZ1bmN0aW9uXCI7XG5jb25zdCBPRkZMSU5FX0VWRU5UX0xJU1RFTkVSUyA9IFtdO1xuaWYgKHdpdGhFdmVudExpc3RlbmVycykge1xuICAgIC8vIHdpdGhpbiBhIFNlcnZpY2VXb3JrZXIsIGFueSBldmVudCBoYW5kbGVyIGZvciB0aGUgJ29mZmxpbmUnIGV2ZW50IG11c3QgYmUgYWRkZWQgb24gdGhlIGluaXRpYWwgZXZhbHVhdGlvbiBvZiB0aGVcbiAgICAvLyBzY3JpcHQsIHNvIHdlIGNyZWF0ZSBvbmUgc2luZ2xlIGV2ZW50IGxpc3RlbmVyIGhlcmUgd2hpY2ggd2lsbCBmb3J3YXJkIHRoZSBldmVudCB0byB0aGUgc29ja2V0IGluc3RhbmNlc1xuICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJvZmZsaW5lXCIsICgpID0+IHtcbiAgICAgICAgT0ZGTElORV9FVkVOVF9MSVNURU5FUlMuZm9yRWFjaCgobGlzdGVuZXIpID0+IGxpc3RlbmVyKCkpO1xuICAgIH0sIGZhbHNlKTtcbn1cbi8qKlxuICogVGhpcyBjbGFzcyBwcm92aWRlcyBhIFdlYlNvY2tldC1saWtlIGludGVyZmFjZSB0byBjb25uZWN0IHRvIGFuIEVuZ2luZS5JTyBzZXJ2ZXIuIFRoZSBjb25uZWN0aW9uIHdpbGwgYmUgZXN0YWJsaXNoZWRcbiAqIHdpdGggb25lIG9mIHRoZSBhdmFpbGFibGUgbG93LWxldmVsIHRyYW5zcG9ydHMsIGxpa2UgSFRUUCBsb25nLXBvbGxpbmcsIFdlYlNvY2tldCBvciBXZWJUcmFuc3BvcnQuXG4gKlxuICogVGhpcyBjbGFzcyBjb21lcyB3aXRob3V0IHVwZ3JhZGUgbWVjaGFuaXNtLCB3aGljaCBtZWFucyB0aGF0IGl0IHdpbGwga2VlcCB0aGUgZmlyc3QgbG93LWxldmVsIHRyYW5zcG9ydCB0aGF0XG4gKiBzdWNjZXNzZnVsbHkgZXN0YWJsaXNoZXMgdGhlIGNvbm5lY3Rpb24uXG4gKlxuICogSW4gb3JkZXIgdG8gYWxsb3cgdHJlZS1zaGFraW5nLCB0aGVyZSBhcmUgbm8gdHJhbnNwb3J0cyBpbmNsdWRlZCwgdGhhdCdzIHdoeSB0aGUgYHRyYW5zcG9ydHNgIG9wdGlvbiBpcyBtYW5kYXRvcnkuXG4gKlxuICogQGV4YW1wbGVcbiAqIGltcG9ydCB7IFNvY2tldFdpdGhvdXRVcGdyYWRlLCBXZWJTb2NrZXQgfSBmcm9tIFwiZW5naW5lLmlvLWNsaWVudFwiO1xuICpcbiAqIGNvbnN0IHNvY2tldCA9IG5ldyBTb2NrZXRXaXRob3V0VXBncmFkZSh7XG4gKiAgIHRyYW5zcG9ydHM6IFtXZWJTb2NrZXRdXG4gKiB9KTtcbiAqXG4gKiBzb2NrZXQub24oXCJvcGVuXCIsICgpID0+IHtcbiAqICAgc29ja2V0LnNlbmQoXCJoZWxsb1wiKTtcbiAqIH0pO1xuICpcbiAqIEBzZWUgU29ja2V0V2l0aFVwZ3JhZGVcbiAqIEBzZWUgU29ja2V0XG4gKi9cbmV4cG9ydCBjbGFzcyBTb2NrZXRXaXRob3V0VXBncmFkZSBleHRlbmRzIEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIFNvY2tldCBjb25zdHJ1Y3Rvci5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gdXJpIC0gdXJpIG9yIG9wdGlvbnNcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0cyAtIG9wdGlvbnNcbiAgICAgKi9cbiAgICBjb25zdHJ1Y3Rvcih1cmksIG9wdHMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5iaW5hcnlUeXBlID0gZGVmYXVsdEJpbmFyeVR5cGU7XG4gICAgICAgIHRoaXMud3JpdGVCdWZmZXIgPSBbXTtcbiAgICAgICAgdGhpcy5fcHJldkJ1ZmZlckxlbiA9IDA7XG4gICAgICAgIHRoaXMuX3BpbmdJbnRlcnZhbCA9IC0xO1xuICAgICAgICB0aGlzLl9waW5nVGltZW91dCA9IC0xO1xuICAgICAgICB0aGlzLl9tYXhQYXlsb2FkID0gLTE7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZXhwaXJhdGlvbiB0aW1lc3RhbXAgb2YgdGhlIHtAbGluayBfcGluZ1RpbWVvdXRUaW1lcn0gb2JqZWN0IGlzIHRyYWNrZWQsIGluIGNhc2UgdGhlIHRpbWVyIGlzIHRocm90dGxlZCBhbmQgdGhlXG4gICAgICAgICAqIGNhbGxiYWNrIGlzIG5vdCBmaXJlZCBvbiB0aW1lLiBUaGlzIGNhbiBoYXBwZW4gZm9yIGV4YW1wbGUgd2hlbiBhIGxhcHRvcCBpcyBzdXNwZW5kZWQgb3Igd2hlbiBhIHBob25lIGlzIGxvY2tlZC5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMuX3BpbmdUaW1lb3V0VGltZSA9IEluZmluaXR5O1xuICAgICAgICBpZiAodXJpICYmIFwib2JqZWN0XCIgPT09IHR5cGVvZiB1cmkpIHtcbiAgICAgICAgICAgIG9wdHMgPSB1cmk7XG4gICAgICAgICAgICB1cmkgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1cmkpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZFVyaSA9IHBhcnNlKHVyaSk7XG4gICAgICAgICAgICBvcHRzLmhvc3RuYW1lID0gcGFyc2VkVXJpLmhvc3Q7XG4gICAgICAgICAgICBvcHRzLnNlY3VyZSA9XG4gICAgICAgICAgICAgICAgcGFyc2VkVXJpLnByb3RvY29sID09PSBcImh0dHBzXCIgfHwgcGFyc2VkVXJpLnByb3RvY29sID09PSBcIndzc1wiO1xuICAgICAgICAgICAgb3B0cy5wb3J0ID0gcGFyc2VkVXJpLnBvcnQ7XG4gICAgICAgICAgICBpZiAocGFyc2VkVXJpLnF1ZXJ5KVxuICAgICAgICAgICAgICAgIG9wdHMucXVlcnkgPSBwYXJzZWRVcmkucXVlcnk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob3B0cy5ob3N0KSB7XG4gICAgICAgICAgICBvcHRzLmhvc3RuYW1lID0gcGFyc2Uob3B0cy5ob3N0KS5ob3N0O1xuICAgICAgICB9XG4gICAgICAgIGluc3RhbGxUaW1lckZ1bmN0aW9ucyh0aGlzLCBvcHRzKTtcbiAgICAgICAgdGhpcy5zZWN1cmUgPVxuICAgICAgICAgICAgbnVsbCAhPSBvcHRzLnNlY3VyZVxuICAgICAgICAgICAgICAgID8gb3B0cy5zZWN1cmVcbiAgICAgICAgICAgICAgICA6IHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiAmJiBcImh0dHBzOlwiID09PSBsb2NhdGlvbi5wcm90b2NvbDtcbiAgICAgICAgaWYgKG9wdHMuaG9zdG5hbWUgJiYgIW9wdHMucG9ydCkge1xuICAgICAgICAgICAgLy8gaWYgbm8gcG9ydCBpcyBzcGVjaWZpZWQgbWFudWFsbHksIHVzZSB0aGUgcHJvdG9jb2wgZGVmYXVsdFxuICAgICAgICAgICAgb3B0cy5wb3J0ID0gdGhpcy5zZWN1cmUgPyBcIjQ0M1wiIDogXCI4MFwiO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaG9zdG5hbWUgPVxuICAgICAgICAgICAgb3B0cy5ob3N0bmFtZSB8fFxuICAgICAgICAgICAgICAgICh0eXBlb2YgbG9jYXRpb24gIT09IFwidW5kZWZpbmVkXCIgPyBsb2NhdGlvbi5ob3N0bmFtZSA6IFwibG9jYWxob3N0XCIpO1xuICAgICAgICB0aGlzLnBvcnQgPVxuICAgICAgICAgICAgb3B0cy5wb3J0IHx8XG4gICAgICAgICAgICAgICAgKHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiAmJiBsb2NhdGlvbi5wb3J0XG4gICAgICAgICAgICAgICAgICAgID8gbG9jYXRpb24ucG9ydFxuICAgICAgICAgICAgICAgICAgICA6IHRoaXMuc2VjdXJlXG4gICAgICAgICAgICAgICAgICAgICAgICA/IFwiNDQzXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIDogXCI4MFwiKTtcbiAgICAgICAgdGhpcy50cmFuc3BvcnRzID0gW107XG4gICAgICAgIHRoaXMuX3RyYW5zcG9ydHNCeU5hbWUgPSB7fTtcbiAgICAgICAgb3B0cy50cmFuc3BvcnRzLmZvckVhY2goKHQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHRyYW5zcG9ydE5hbWUgPSB0LnByb3RvdHlwZS5uYW1lO1xuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnRzLnB1c2godHJhbnNwb3J0TmFtZSk7XG4gICAgICAgICAgICB0aGlzLl90cmFuc3BvcnRzQnlOYW1lW3RyYW5zcG9ydE5hbWVdID0gdDtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMub3B0cyA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICAgICAgcGF0aDogXCIvZW5naW5lLmlvXCIsXG4gICAgICAgICAgICBhZ2VudDogZmFsc2UsXG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IGZhbHNlLFxuICAgICAgICAgICAgdXBncmFkZTogdHJ1ZSxcbiAgICAgICAgICAgIHRpbWVzdGFtcFBhcmFtOiBcInRcIixcbiAgICAgICAgICAgIHJlbWVtYmVyVXBncmFkZTogZmFsc2UsXG4gICAgICAgICAgICBhZGRUcmFpbGluZ1NsYXNoOiB0cnVlLFxuICAgICAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiB0cnVlLFxuICAgICAgICAgICAgcGVyTWVzc2FnZURlZmxhdGU6IHtcbiAgICAgICAgICAgICAgICB0aHJlc2hvbGQ6IDEwMjQsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdHJhbnNwb3J0T3B0aW9uczoge30sXG4gICAgICAgICAgICBjbG9zZU9uQmVmb3JldW5sb2FkOiBmYWxzZSxcbiAgICAgICAgfSwgb3B0cyk7XG4gICAgICAgIHRoaXMub3B0cy5wYXRoID1cbiAgICAgICAgICAgIHRoaXMub3B0cy5wYXRoLnJlcGxhY2UoL1xcLyQvLCBcIlwiKSArXG4gICAgICAgICAgICAgICAgKHRoaXMub3B0cy5hZGRUcmFpbGluZ1NsYXNoID8gXCIvXCIgOiBcIlwiKTtcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm9wdHMucXVlcnkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMub3B0cy5xdWVyeSA9IGRlY29kZSh0aGlzLm9wdHMucXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh3aXRoRXZlbnRMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuY2xvc2VPbkJlZm9yZXVubG9hZCkge1xuICAgICAgICAgICAgICAgIC8vIEZpcmVmb3ggY2xvc2VzIHRoZSBjb25uZWN0aW9uIHdoZW4gdGhlIFwiYmVmb3JldW5sb2FkXCIgZXZlbnQgaXMgZW1pdHRlZCBidXQgbm90IENocm9tZS4gVGhpcyBldmVudCBsaXN0ZW5lclxuICAgICAgICAgICAgICAgIC8vIGVuc3VyZXMgZXZlcnkgYnJvd3NlciBiZWhhdmVzIHRoZSBzYW1lIChubyBcImRpc2Nvbm5lY3RcIiBldmVudCBhdCB0aGUgU29ja2V0LklPIGxldmVsIHdoZW4gdGhlIHBhZ2UgaXNcbiAgICAgICAgICAgICAgICAvLyBjbG9zZWQvcmVsb2FkZWQpXG4gICAgICAgICAgICAgICAgdGhpcy5fYmVmb3JldW5sb2FkRXZlbnRMaXN0ZW5lciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMudHJhbnNwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaWxlbnRseSBjbG9zZSB0aGUgdHJhbnNwb3J0XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoXCJiZWZvcmV1bmxvYWRcIiwgdGhpcy5fYmVmb3JldW5sb2FkRXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHRoaXMuaG9zdG5hbWUgIT09IFwibG9jYWxob3N0XCIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9vZmZsaW5lRXZlbnRMaXN0ZW5lciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fb25DbG9zZShcInRyYW5zcG9ydCBjbG9zZVwiLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJuZXR3b3JrIGNvbm5lY3Rpb24gbG9zdFwiLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIE9GRkxJTkVfRVZFTlRfTElTVEVORVJTLnB1c2godGhpcy5fb2ZmbGluZUV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLm9wdHMud2l0aENyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICB0aGlzLl9jb29raWVKYXIgPSBjcmVhdGVDb29raWVKYXIoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vcGVuKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgdHJhbnNwb3J0IG9mIHRoZSBnaXZlbiB0eXBlLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSB0cmFuc3BvcnQgbmFtZVxuICAgICAqIEByZXR1cm4ge1RyYW5zcG9ydH1cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIGNyZWF0ZVRyYW5zcG9ydChuYW1lKSB7XG4gICAgICAgIGNvbnN0IHF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5vcHRzLnF1ZXJ5KTtcbiAgICAgICAgLy8gYXBwZW5kIGVuZ2luZS5pbyBwcm90b2NvbCBpZGVudGlmaWVyXG4gICAgICAgIHF1ZXJ5LkVJTyA9IHByb3RvY29sO1xuICAgICAgICAvLyB0cmFuc3BvcnQgbmFtZVxuICAgICAgICBxdWVyeS50cmFuc3BvcnQgPSBuYW1lO1xuICAgICAgICAvLyBzZXNzaW9uIGlkIGlmIHdlIGFscmVhZHkgaGF2ZSBvbmVcbiAgICAgICAgaWYgKHRoaXMuaWQpXG4gICAgICAgICAgICBxdWVyeS5zaWQgPSB0aGlzLmlkO1xuICAgICAgICBjb25zdCBvcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5vcHRzLCB7XG4gICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICAgIHNvY2tldDogdGhpcyxcbiAgICAgICAgICAgIGhvc3RuYW1lOiB0aGlzLmhvc3RuYW1lLFxuICAgICAgICAgICAgc2VjdXJlOiB0aGlzLnNlY3VyZSxcbiAgICAgICAgICAgIHBvcnQ6IHRoaXMucG9ydCxcbiAgICAgICAgfSwgdGhpcy5vcHRzLnRyYW5zcG9ydE9wdGlvbnNbbmFtZV0pO1xuICAgICAgICByZXR1cm4gbmV3IHRoaXMuX3RyYW5zcG9ydHNCeU5hbWVbbmFtZV0ob3B0cyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEluaXRpYWxpemVzIHRyYW5zcG9ydCB0byB1c2UgYW5kIHN0YXJ0cyBwcm9iZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29wZW4oKSB7XG4gICAgICAgIGlmICh0aGlzLnRyYW5zcG9ydHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAvLyBFbWl0IGVycm9yIG9uIG5leHQgdGljayBzbyBpdCBjYW4gYmUgbGlzdGVuZWQgdG9cbiAgICAgICAgICAgIHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImVycm9yXCIsIFwiTm8gdHJhbnNwb3J0cyBhdmFpbGFibGVcIik7XG4gICAgICAgICAgICB9LCAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB0cmFuc3BvcnROYW1lID0gdGhpcy5vcHRzLnJlbWVtYmVyVXBncmFkZSAmJlxuICAgICAgICAgICAgU29ja2V0V2l0aG91dFVwZ3JhZGUucHJpb3JXZWJzb2NrZXRTdWNjZXNzICYmXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydHMuaW5kZXhPZihcIndlYnNvY2tldFwiKSAhPT0gLTFcbiAgICAgICAgICAgID8gXCJ3ZWJzb2NrZXRcIlxuICAgICAgICAgICAgOiB0aGlzLnRyYW5zcG9ydHNbMF07XG4gICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwib3BlbmluZ1wiO1xuICAgICAgICBjb25zdCB0cmFuc3BvcnQgPSB0aGlzLmNyZWF0ZVRyYW5zcG9ydCh0cmFuc3BvcnROYW1lKTtcbiAgICAgICAgdHJhbnNwb3J0Lm9wZW4oKTtcbiAgICAgICAgdGhpcy5zZXRUcmFuc3BvcnQodHJhbnNwb3J0KTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY3VycmVudCB0cmFuc3BvcnQuIERpc2FibGVzIHRoZSBleGlzdGluZyBvbmUgKGlmIGFueSkuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHNldFRyYW5zcG9ydCh0cmFuc3BvcnQpIHtcbiAgICAgICAgaWYgKHRoaXMudHJhbnNwb3J0KSB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzZXQgdXAgdHJhbnNwb3J0XG4gICAgICAgIHRoaXMudHJhbnNwb3J0ID0gdHJhbnNwb3J0O1xuICAgICAgICAvLyBzZXQgdXAgdHJhbnNwb3J0IGxpc3RlbmVyc1xuICAgICAgICB0cmFuc3BvcnRcbiAgICAgICAgICAgIC5vbihcImRyYWluXCIsIHRoaXMuX29uRHJhaW4uYmluZCh0aGlzKSlcbiAgICAgICAgICAgIC5vbihcInBhY2tldFwiLCB0aGlzLl9vblBhY2tldC5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgLm9uKFwiZXJyb3JcIiwgdGhpcy5fb25FcnJvci5iaW5kKHRoaXMpKVxuICAgICAgICAgICAgLm9uKFwiY2xvc2VcIiwgKHJlYXNvbikgPT4gdGhpcy5fb25DbG9zZShcInRyYW5zcG9ydCBjbG9zZVwiLCByZWFzb24pKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdoZW4gY29ubmVjdGlvbiBpcyBkZWVtZWQgb3Blbi5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25PcGVuKCkge1xuICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPSBcIm9wZW5cIjtcbiAgICAgICAgU29ja2V0V2l0aG91dFVwZ3JhZGUucHJpb3JXZWJzb2NrZXRTdWNjZXNzID1cbiAgICAgICAgICAgIFwid2Vic29ja2V0XCIgPT09IHRoaXMudHJhbnNwb3J0Lm5hbWU7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwib3BlblwiKTtcbiAgICAgICAgdGhpcy5mbHVzaCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBIYW5kbGVzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25QYWNrZXQocGFja2V0KSB7XG4gICAgICAgIGlmIChcIm9wZW5pbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8XG4gICAgICAgICAgICBcIm9wZW5cIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8XG4gICAgICAgICAgICBcImNsb3NpbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBhY2tldFwiLCBwYWNrZXQpO1xuICAgICAgICAgICAgLy8gU29ja2V0IGlzIGxpdmUgLSBhbnkgcGFja2V0IGNvdW50c1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJoZWFydGJlYXRcIik7XG4gICAgICAgICAgICBzd2l0Y2ggKHBhY2tldC50eXBlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm9wZW5cIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbkhhbmRzaGFrZShKU09OLnBhcnNlKHBhY2tldC5kYXRhKSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgXCJwaW5nXCI6XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3NlbmRQYWNrZXQoXCJwb25nXCIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBpbmdcIik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicG9uZ1wiKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcmVzZXRQaW5nVGltZW91dCgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIFwiZXJyb3JcIjpcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyID0gbmV3IEVycm9yKFwic2VydmVyIGVycm9yXCIpO1xuICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgIGVyci5jb2RlID0gcGFja2V0LmRhdGE7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX29uRXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSBcIm1lc3NhZ2VcIjpcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkYXRhXCIsIHBhY2tldC5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJtZXNzYWdlXCIsIHBhY2tldC5kYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gaGFuZHNoYWtlIGNvbXBsZXRpb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gZGF0YSAtIGhhbmRzaGFrZSBvYmpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uSGFuZHNoYWtlKGRhdGEpIHtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJoYW5kc2hha2VcIiwgZGF0YSk7XG4gICAgICAgIHRoaXMuaWQgPSBkYXRhLnNpZDtcbiAgICAgICAgdGhpcy50cmFuc3BvcnQucXVlcnkuc2lkID0gZGF0YS5zaWQ7XG4gICAgICAgIHRoaXMuX3BpbmdJbnRlcnZhbCA9IGRhdGEucGluZ0ludGVydmFsO1xuICAgICAgICB0aGlzLl9waW5nVGltZW91dCA9IGRhdGEucGluZ1RpbWVvdXQ7XG4gICAgICAgIHRoaXMuX21heFBheWxvYWQgPSBkYXRhLm1heFBheWxvYWQ7XG4gICAgICAgIHRoaXMub25PcGVuKCk7XG4gICAgICAgIC8vIEluIGNhc2Ugb3BlbiBoYW5kbGVyIGNsb3NlcyBzb2NrZXRcbiAgICAgICAgaWYgKFwiY2xvc2VkXCIgPT09IHRoaXMucmVhZHlTdGF0ZSlcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgdGhpcy5fcmVzZXRQaW5nVGltZW91dCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGFuZCByZXNldHMgcGluZyB0aW1lb3V0IHRpbWVyIGJhc2VkIG9uIHNlcnZlciBwaW5ncy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3Jlc2V0UGluZ1RpbWVvdXQoKSB7XG4gICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0Rm4odGhpcy5fcGluZ1RpbWVvdXRUaW1lcik7XG4gICAgICAgIGNvbnN0IGRlbGF5ID0gdGhpcy5fcGluZ0ludGVydmFsICsgdGhpcy5fcGluZ1RpbWVvdXQ7XG4gICAgICAgIHRoaXMuX3BpbmdUaW1lb3V0VGltZSA9IERhdGUubm93KCkgKyBkZWxheTtcbiAgICAgICAgdGhpcy5fcGluZ1RpbWVvdXRUaW1lciA9IHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuX29uQ2xvc2UoXCJwaW5nIHRpbWVvdXRcIik7XG4gICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgaWYgKHRoaXMub3B0cy5hdXRvVW5yZWYpIHtcbiAgICAgICAgICAgIHRoaXMuX3BpbmdUaW1lb3V0VGltZXIudW5yZWYoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgb24gYGRyYWluYCBldmVudFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfb25EcmFpbigpIHtcbiAgICAgICAgdGhpcy53cml0ZUJ1ZmZlci5zcGxpY2UoMCwgdGhpcy5fcHJldkJ1ZmZlckxlbik7XG4gICAgICAgIC8vIHNldHRpbmcgcHJldkJ1ZmZlckxlbiA9IDAgaXMgdmVyeSBpbXBvcnRhbnRcbiAgICAgICAgLy8gZm9yIGV4YW1wbGUsIHdoZW4gdXBncmFkaW5nLCB1cGdyYWRlIHBhY2tldCBpcyBzZW50IG92ZXIsXG4gICAgICAgIC8vIGFuZCBhIG5vbnplcm8gcHJldkJ1ZmZlckxlbiBjb3VsZCBjYXVzZSBwcm9ibGVtcyBvbiBgZHJhaW5gXG4gICAgICAgIHRoaXMuX3ByZXZCdWZmZXJMZW4gPSAwO1xuICAgICAgICBpZiAoMCA9PT0gdGhpcy53cml0ZUJ1ZmZlci5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZHJhaW5cIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogRmx1c2ggd3JpdGUgYnVmZmVycy5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZmx1c2goKSB7XG4gICAgICAgIGlmIChcImNsb3NlZFwiICE9PSB0aGlzLnJlYWR5U3RhdGUgJiZcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LndyaXRhYmxlICYmXG4gICAgICAgICAgICAhdGhpcy51cGdyYWRpbmcgJiZcbiAgICAgICAgICAgIHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBwYWNrZXRzID0gdGhpcy5fZ2V0V3JpdGFibGVQYWNrZXRzKCk7XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5zZW5kKHBhY2tldHMpO1xuICAgICAgICAgICAgLy8ga2VlcCB0cmFjayBvZiBjdXJyZW50IGxlbmd0aCBvZiB3cml0ZUJ1ZmZlclxuICAgICAgICAgICAgLy8gc3BsaWNlIHdyaXRlQnVmZmVyIGFuZCBjYWxsYmFja0J1ZmZlciBvbiBgZHJhaW5gXG4gICAgICAgICAgICB0aGlzLl9wcmV2QnVmZmVyTGVuID0gcGFja2V0cy5sZW5ndGg7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImZsdXNoXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuc3VyZSB0aGUgZW5jb2RlZCBzaXplIG9mIHRoZSB3cml0ZUJ1ZmZlciBpcyBiZWxvdyB0aGUgbWF4UGF5bG9hZCB2YWx1ZSBzZW50IGJ5IHRoZSBzZXJ2ZXIgKG9ubHkgZm9yIEhUVFBcbiAgICAgKiBsb25nLXBvbGxpbmcpXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZXRXcml0YWJsZVBhY2tldHMoKSB7XG4gICAgICAgIGNvbnN0IHNob3VsZENoZWNrUGF5bG9hZFNpemUgPSB0aGlzLl9tYXhQYXlsb2FkICYmXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5uYW1lID09PSBcInBvbGxpbmdcIiAmJlxuICAgICAgICAgICAgdGhpcy53cml0ZUJ1ZmZlci5sZW5ndGggPiAxO1xuICAgICAgICBpZiAoIXNob3VsZENoZWNrUGF5bG9hZFNpemUpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLndyaXRlQnVmZmVyO1xuICAgICAgICB9XG4gICAgICAgIGxldCBwYXlsb2FkU2l6ZSA9IDE7IC8vIGZpcnN0IHBhY2tldCB0eXBlXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53cml0ZUJ1ZmZlci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMud3JpdGVCdWZmZXJbaV0uZGF0YTtcbiAgICAgICAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgcGF5bG9hZFNpemUgKz0gYnl0ZUxlbmd0aChkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpID4gMCAmJiBwYXlsb2FkU2l6ZSA+IHRoaXMuX21heFBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy53cml0ZUJ1ZmZlci5zbGljZSgwLCBpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBheWxvYWRTaXplICs9IDI7IC8vIHNlcGFyYXRvciArIHBhY2tldCB0eXBlXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMud3JpdGVCdWZmZXI7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENoZWNrcyB3aGV0aGVyIHRoZSBoZWFydGJlYXQgdGltZXIgaGFzIGV4cGlyZWQgYnV0IHRoZSBzb2NrZXQgaGFzIG5vdCB5ZXQgYmVlbiBub3RpZmllZC5cbiAgICAgKlxuICAgICAqIE5vdGU6IHRoaXMgbWV0aG9kIGlzIHByaXZhdGUgZm9yIG5vdyBiZWNhdXNlIGl0IGRvZXMgbm90IHJlYWxseSBmaXQgdGhlIFdlYlNvY2tldCBBUEksIGJ1dCBpZiB3ZSBwdXQgaXQgaW4gdGhlXG4gICAgICogYHdyaXRlKClgIG1ldGhvZCB0aGVuIHRoZSBtZXNzYWdlIHdvdWxkIG5vdCBiZSBidWZmZXJlZCBieSB0aGUgU29ja2V0LklPIGNsaWVudC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICAvKiBwcml2YXRlICovIF9oYXNQaW5nRXhwaXJlZCgpIHtcbiAgICAgICAgaWYgKCF0aGlzLl9waW5nVGltZW91dFRpbWUpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgY29uc3QgaGFzRXhwaXJlZCA9IERhdGUubm93KCkgPiB0aGlzLl9waW5nVGltZW91dFRpbWU7XG4gICAgICAgIGlmIChoYXNFeHBpcmVkKSB7XG4gICAgICAgICAgICB0aGlzLl9waW5nVGltZW91dFRpbWUgPSAwO1xuICAgICAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuX29uQ2xvc2UoXCJwaW5nIHRpbWVvdXRcIik7XG4gICAgICAgICAgICB9LCB0aGlzLnNldFRpbWVvdXRGbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhhc0V4cGlyZWQ7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgbWVzc2FnZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBtc2cgLSBtZXNzYWdlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIC0gY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICogQHJldHVybiB7U29ja2V0fSBmb3IgY2hhaW5pbmcuXG4gICAgICovXG4gICAgd3JpdGUobXNnLCBvcHRpb25zLCBmbikge1xuICAgICAgICB0aGlzLl9zZW5kUGFja2V0KFwibWVzc2FnZVwiLCBtc2csIG9wdGlvbnMsIGZuKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgbWVzc2FnZS4gQWxpYXMgb2Yge0BsaW5rIFNvY2tldCN3cml0ZX0uXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbXNnIC0gbWVzc2FnZS5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAtIGNhbGxiYWNrIGZ1bmN0aW9uLlxuICAgICAqIEByZXR1cm4ge1NvY2tldH0gZm9yIGNoYWluaW5nLlxuICAgICAqL1xuICAgIHNlbmQobXNnLCBvcHRpb25zLCBmbikge1xuICAgICAgICB0aGlzLl9zZW5kUGFja2V0KFwibWVzc2FnZVwiLCBtc2csIG9wdGlvbnMsIGZuKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHR5cGU6IHBhY2tldCB0eXBlLlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBkYXRhLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIC0gY2FsbGJhY2sgZnVuY3Rpb24uXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2VuZFBhY2tldCh0eXBlLCBkYXRhLCBvcHRpb25zLCBmbikge1xuICAgICAgICBpZiAoXCJmdW5jdGlvblwiID09PSB0eXBlb2YgZGF0YSkge1xuICAgICAgICAgICAgZm4gPSBkYXRhO1xuICAgICAgICAgICAgZGF0YSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoXCJmdW5jdGlvblwiID09PSB0eXBlb2Ygb3B0aW9ucykge1xuICAgICAgICAgICAgZm4gPSBvcHRpb25zO1xuICAgICAgICAgICAgb3B0aW9ucyA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFwiY2xvc2luZ1wiID09PSB0aGlzLnJlYWR5U3RhdGUgfHwgXCJjbG9zZWRcIiA9PT0gdGhpcy5yZWFkeVN0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgIG9wdGlvbnMuY29tcHJlc3MgPSBmYWxzZSAhPT0gb3B0aW9ucy5jb21wcmVzcztcbiAgICAgICAgY29uc3QgcGFja2V0ID0ge1xuICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBvcHRpb25zOiBvcHRpb25zLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInBhY2tldENyZWF0ZVwiLCBwYWNrZXQpO1xuICAgICAgICB0aGlzLndyaXRlQnVmZmVyLnB1c2gocGFja2V0KTtcbiAgICAgICAgaWYgKGZuKVxuICAgICAgICAgICAgdGhpcy5vbmNlKFwiZmx1c2hcIiwgZm4pO1xuICAgICAgICB0aGlzLmZsdXNoKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENsb3NlcyB0aGUgY29ubmVjdGlvbi5cbiAgICAgKi9cbiAgICBjbG9zZSgpIHtcbiAgICAgICAgY29uc3QgY2xvc2UgPSAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLl9vbkNsb3NlKFwiZm9yY2VkIGNsb3NlXCIpO1xuICAgICAgICAgICAgdGhpcy50cmFuc3BvcnQuY2xvc2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgY2xlYW51cEFuZENsb3NlID0gKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5vZmYoXCJ1cGdyYWRlXCIsIGNsZWFudXBBbmRDbG9zZSk7XG4gICAgICAgICAgICB0aGlzLm9mZihcInVwZ3JhZGVFcnJvclwiLCBjbGVhbnVwQW5kQ2xvc2UpO1xuICAgICAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgd2FpdEZvclVwZ3JhZGUgPSAoKSA9PiB7XG4gICAgICAgICAgICAvLyB3YWl0IGZvciB1cGdyYWRlIHRvIGZpbmlzaCBzaW5jZSB3ZSBjYW4ndCBzZW5kIHBhY2tldHMgd2hpbGUgcGF1c2luZyBhIHRyYW5zcG9ydFxuICAgICAgICAgICAgdGhpcy5vbmNlKFwidXBncmFkZVwiLCBjbGVhbnVwQW5kQ2xvc2UpO1xuICAgICAgICAgICAgdGhpcy5vbmNlKFwidXBncmFkZUVycm9yXCIsIGNsZWFudXBBbmRDbG9zZSk7XG4gICAgICAgIH07XG4gICAgICAgIGlmIChcIm9wZW5pbmdcIiA9PT0gdGhpcy5yZWFkeVN0YXRlIHx8IFwib3BlblwiID09PSB0aGlzLnJlYWR5U3RhdGUpIHtcbiAgICAgICAgICAgIHRoaXMucmVhZHlTdGF0ZSA9IFwiY2xvc2luZ1wiO1xuICAgICAgICAgICAgaWYgKHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vbmNlKFwiZHJhaW5cIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy51cGdyYWRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhaXRGb3JVcGdyYWRlKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLnVwZ3JhZGluZykge1xuICAgICAgICAgICAgICAgIHdhaXRGb3JVcGdyYWRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBjbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiB0cmFuc3BvcnQgZXJyb3JcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uRXJyb3IoZXJyKSB7XG4gICAgICAgIFNvY2tldFdpdGhvdXRVcGdyYWRlLnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5vcHRzLnRyeUFsbFRyYW5zcG9ydHMgJiZcbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0cy5sZW5ndGggPiAxICYmXG4gICAgICAgICAgICB0aGlzLnJlYWR5U3RhdGUgPT09IFwib3BlbmluZ1wiKSB7XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydHMuc2hpZnQoKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9vcGVuKCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBlcnIpO1xuICAgICAgICB0aGlzLl9vbkNsb3NlKFwidHJhbnNwb3J0IGVycm9yXCIsIGVycik7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHRyYW5zcG9ydCBjbG9zZS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX29uQ2xvc2UocmVhc29uLCBkZXNjcmlwdGlvbikge1xuICAgICAgICBpZiAoXCJvcGVuaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSB8fFxuICAgICAgICAgICAgXCJvcGVuXCIgPT09IHRoaXMucmVhZHlTdGF0ZSB8fFxuICAgICAgICAgICAgXCJjbG9zaW5nXCIgPT09IHRoaXMucmVhZHlTdGF0ZSkge1xuICAgICAgICAgICAgLy8gY2xlYXIgdGltZXJzXG4gICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dEZuKHRoaXMuX3BpbmdUaW1lb3V0VGltZXIpO1xuICAgICAgICAgICAgLy8gc3RvcCBldmVudCBmcm9tIGZpcmluZyBhZ2FpbiBmb3IgdHJhbnNwb3J0XG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoXCJjbG9zZVwiKTtcbiAgICAgICAgICAgIC8vIGVuc3VyZSB0cmFuc3BvcnQgd29uJ3Qgc3RheSBvcGVuXG4gICAgICAgICAgICB0aGlzLnRyYW5zcG9ydC5jbG9zZSgpO1xuICAgICAgICAgICAgLy8gaWdub3JlIGZ1cnRoZXIgdHJhbnNwb3J0IGNvbW11bmljYXRpb25cbiAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnJlbW92ZUFsbExpc3RlbmVycygpO1xuICAgICAgICAgICAgaWYgKHdpdGhFdmVudExpc3RlbmVycykge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9iZWZvcmV1bmxvYWRFdmVudExpc3RlbmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlbW92ZUV2ZW50TGlzdGVuZXIoXCJiZWZvcmV1bmxvYWRcIiwgdGhpcy5fYmVmb3JldW5sb2FkRXZlbnRMaXN0ZW5lciwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fb2ZmbGluZUV2ZW50TGlzdGVuZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaSA9IE9GRkxJTkVfRVZFTlRfTElTVEVORVJTLmluZGV4T2YodGhpcy5fb2ZmbGluZUV2ZW50TGlzdGVuZXIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9GRkxJTkVfRVZFTlRfTElTVEVORVJTLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHNldCByZWFkeSBzdGF0ZVxuICAgICAgICAgICAgdGhpcy5yZWFkeVN0YXRlID0gXCJjbG9zZWRcIjtcbiAgICAgICAgICAgIC8vIGNsZWFyIHNlc3Npb24gaWRcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgLy8gZW1pdCBjbG9zZSBldmVudFxuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjbG9zZVwiLCByZWFzb24sIGRlc2NyaXB0aW9uKTtcbiAgICAgICAgICAgIC8vIGNsZWFuIGJ1ZmZlcnMgYWZ0ZXIsIHNvIHVzZXJzIGNhbiBzdGlsbFxuICAgICAgICAgICAgLy8gZ3JhYiB0aGUgYnVmZmVycyBvbiBgY2xvc2VgIGV2ZW50XG4gICAgICAgICAgICB0aGlzLndyaXRlQnVmZmVyID0gW107XG4gICAgICAgICAgICB0aGlzLl9wcmV2QnVmZmVyTGVuID0gMDtcbiAgICAgICAgfVxuICAgIH1cbn1cblNvY2tldFdpdGhvdXRVcGdyYWRlLnByb3RvY29sID0gcHJvdG9jb2w7XG4vKipcbiAqIFRoaXMgY2xhc3MgcHJvdmlkZXMgYSBXZWJTb2NrZXQtbGlrZSBpbnRlcmZhY2UgdG8gY29ubmVjdCB0byBhbiBFbmdpbmUuSU8gc2VydmVyLiBUaGUgY29ubmVjdGlvbiB3aWxsIGJlIGVzdGFibGlzaGVkXG4gKiB3aXRoIG9uZSBvZiB0aGUgYXZhaWxhYmxlIGxvdy1sZXZlbCB0cmFuc3BvcnRzLCBsaWtlIEhUVFAgbG9uZy1wb2xsaW5nLCBXZWJTb2NrZXQgb3IgV2ViVHJhbnNwb3J0LlxuICpcbiAqIFRoaXMgY2xhc3MgY29tZXMgd2l0aCBhbiB1cGdyYWRlIG1lY2hhbmlzbSwgd2hpY2ggbWVhbnMgdGhhdCBvbmNlIHRoZSBjb25uZWN0aW9uIGlzIGVzdGFibGlzaGVkIHdpdGggdGhlIGZpcnN0XG4gKiBsb3ctbGV2ZWwgdHJhbnNwb3J0LCBpdCB3aWxsIHRyeSB0byB1cGdyYWRlIHRvIGEgYmV0dGVyIHRyYW5zcG9ydC5cbiAqXG4gKiBJbiBvcmRlciB0byBhbGxvdyB0cmVlLXNoYWtpbmcsIHRoZXJlIGFyZSBubyB0cmFuc3BvcnRzIGluY2x1ZGVkLCB0aGF0J3Mgd2h5IHRoZSBgdHJhbnNwb3J0c2Agb3B0aW9uIGlzIG1hbmRhdG9yeS5cbiAqXG4gKiBAZXhhbXBsZVxuICogaW1wb3J0IHsgU29ja2V0V2l0aFVwZ3JhZGUsIFdlYlNvY2tldCB9IGZyb20gXCJlbmdpbmUuaW8tY2xpZW50XCI7XG4gKlxuICogY29uc3Qgc29ja2V0ID0gbmV3IFNvY2tldFdpdGhVcGdyYWRlKHtcbiAqICAgdHJhbnNwb3J0czogW1dlYlNvY2tldF1cbiAqIH0pO1xuICpcbiAqIHNvY2tldC5vbihcIm9wZW5cIiwgKCkgPT4ge1xuICogICBzb2NrZXQuc2VuZChcImhlbGxvXCIpO1xuICogfSk7XG4gKlxuICogQHNlZSBTb2NrZXRXaXRob3V0VXBncmFkZVxuICogQHNlZSBTb2NrZXRcbiAqL1xuZXhwb3J0IGNsYXNzIFNvY2tldFdpdGhVcGdyYWRlIGV4dGVuZHMgU29ja2V0V2l0aG91dFVwZ3JhZGUge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlciguLi5hcmd1bWVudHMpO1xuICAgICAgICB0aGlzLl91cGdyYWRlcyA9IFtdO1xuICAgIH1cbiAgICBvbk9wZW4oKSB7XG4gICAgICAgIHN1cGVyLm9uT3BlbigpO1xuICAgICAgICBpZiAoXCJvcGVuXCIgPT09IHRoaXMucmVhZHlTdGF0ZSAmJiB0aGlzLm9wdHMudXBncmFkZSkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl91cGdyYWRlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Byb2JlKHRoaXMuX3VwZ3JhZGVzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBQcm9iZXMgYSB0cmFuc3BvcnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIHRyYW5zcG9ydCBuYW1lXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcHJvYmUobmFtZSkge1xuICAgICAgICBsZXQgdHJhbnNwb3J0ID0gdGhpcy5jcmVhdGVUcmFuc3BvcnQobmFtZSk7XG4gICAgICAgIGxldCBmYWlsZWQgPSBmYWxzZTtcbiAgICAgICAgU29ja2V0V2l0aG91dFVwZ3JhZGUucHJpb3JXZWJzb2NrZXRTdWNjZXNzID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IG9uVHJhbnNwb3J0T3BlbiA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgdHJhbnNwb3J0LnNlbmQoW3sgdHlwZTogXCJwaW5nXCIsIGRhdGE6IFwicHJvYmVcIiB9XSk7XG4gICAgICAgICAgICB0cmFuc3BvcnQub25jZShcInBhY2tldFwiLCAobXNnKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGZhaWxlZClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIGlmIChcInBvbmdcIiA9PT0gbXNnLnR5cGUgJiYgXCJwcm9iZVwiID09PSBtc2cuZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZ3JhZGluZyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwidXBncmFkaW5nXCIsIHRyYW5zcG9ydCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICghdHJhbnNwb3J0KVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBTb2NrZXRXaXRob3V0VXBncmFkZS5wcmlvcldlYnNvY2tldFN1Y2Nlc3MgPVxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ3ZWJzb2NrZXRcIiA9PT0gdHJhbnNwb3J0Lm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJhbnNwb3J0LnBhdXNlKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKFwiY2xvc2VkXCIgPT09IHRoaXMucmVhZHlTdGF0ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFRyYW5zcG9ydCh0cmFuc3BvcnQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNwb3J0LnNlbmQoW3sgdHlwZTogXCJ1cGdyYWRlXCIgfV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJ1cGdyYWRlXCIsIHRyYW5zcG9ydCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGdyYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmx1c2goKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoXCJwcm9iZSBlcnJvclwiKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICBlcnIudHJhbnNwb3J0ID0gdHJhbnNwb3J0Lm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwidXBncmFkZUVycm9yXCIsIGVycik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgICAgIGZ1bmN0aW9uIGZyZWV6ZVRyYW5zcG9ydCgpIHtcbiAgICAgICAgICAgIGlmIChmYWlsZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgLy8gQW55IGNhbGxiYWNrIGNhbGxlZCBieSB0cmFuc3BvcnQgc2hvdWxkIGJlIGlnbm9yZWQgc2luY2Ugbm93XG4gICAgICAgICAgICBmYWlsZWQgPSB0cnVlO1xuICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgdHJhbnNwb3J0LmNsb3NlKCk7XG4gICAgICAgICAgICB0cmFuc3BvcnQgPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIC8vIEhhbmRsZSBhbnkgZXJyb3IgdGhhdCBoYXBwZW5zIHdoaWxlIHByb2JpbmdcbiAgICAgICAgY29uc3Qgb25lcnJvciA9IChlcnIpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKFwicHJvYmUgZXJyb3I6IFwiICsgZXJyKTtcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgIGVycm9yLnRyYW5zcG9ydCA9IHRyYW5zcG9ydC5uYW1lO1xuICAgICAgICAgICAgZnJlZXplVHJhbnNwb3J0KCk7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInVwZ3JhZGVFcnJvclwiLCBlcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIGZ1bmN0aW9uIG9uVHJhbnNwb3J0Q2xvc2UoKSB7XG4gICAgICAgICAgICBvbmVycm9yKFwidHJhbnNwb3J0IGNsb3NlZFwiKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBXaGVuIHRoZSBzb2NrZXQgaXMgY2xvc2VkIHdoaWxlIHdlJ3JlIHByb2JpbmdcbiAgICAgICAgZnVuY3Rpb24gb25jbG9zZSgpIHtcbiAgICAgICAgICAgIG9uZXJyb3IoXCJzb2NrZXQgY2xvc2VkXCIpO1xuICAgICAgICB9XG4gICAgICAgIC8vIFdoZW4gdGhlIHNvY2tldCBpcyB1cGdyYWRlZCB3aGlsZSB3ZSdyZSBwcm9iaW5nXG4gICAgICAgIGZ1bmN0aW9uIG9udXBncmFkZSh0bykge1xuICAgICAgICAgICAgaWYgKHRyYW5zcG9ydCAmJiB0by5uYW1lICE9PSB0cmFuc3BvcnQubmFtZSkge1xuICAgICAgICAgICAgICAgIGZyZWV6ZVRyYW5zcG9ydCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFJlbW92ZSBhbGwgbGlzdGVuZXJzIG9uIHRoZSB0cmFuc3BvcnQgYW5kIG9uIHNlbGZcbiAgICAgICAgY29uc3QgY2xlYW51cCA9ICgpID0+IHtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5yZW1vdmVMaXN0ZW5lcihcIm9wZW5cIiwgb25UcmFuc3BvcnRPcGVuKTtcbiAgICAgICAgICAgIHRyYW5zcG9ydC5yZW1vdmVMaXN0ZW5lcihcImVycm9yXCIsIG9uZXJyb3IpO1xuICAgICAgICAgICAgdHJhbnNwb3J0LnJlbW92ZUxpc3RlbmVyKFwiY2xvc2VcIiwgb25UcmFuc3BvcnRDbG9zZSk7XG4gICAgICAgICAgICB0aGlzLm9mZihcImNsb3NlXCIsIG9uY2xvc2UpO1xuICAgICAgICAgICAgdGhpcy5vZmYoXCJ1cGdyYWRpbmdcIiwgb251cGdyYWRlKTtcbiAgICAgICAgfTtcbiAgICAgICAgdHJhbnNwb3J0Lm9uY2UoXCJvcGVuXCIsIG9uVHJhbnNwb3J0T3Blbik7XG4gICAgICAgIHRyYW5zcG9ydC5vbmNlKFwiZXJyb3JcIiwgb25lcnJvcik7XG4gICAgICAgIHRyYW5zcG9ydC5vbmNlKFwiY2xvc2VcIiwgb25UcmFuc3BvcnRDbG9zZSk7XG4gICAgICAgIHRoaXMub25jZShcImNsb3NlXCIsIG9uY2xvc2UpO1xuICAgICAgICB0aGlzLm9uY2UoXCJ1cGdyYWRpbmdcIiwgb251cGdyYWRlKTtcbiAgICAgICAgaWYgKHRoaXMuX3VwZ3JhZGVzLmluZGV4T2YoXCJ3ZWJ0cmFuc3BvcnRcIikgIT09IC0xICYmXG4gICAgICAgICAgICBuYW1lICE9PSBcIndlYnRyYW5zcG9ydFwiKSB7XG4gICAgICAgICAgICAvLyBmYXZvciBXZWJUcmFuc3BvcnRcbiAgICAgICAgICAgIHRoaXMuc2V0VGltZW91dEZuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoIWZhaWxlZCkge1xuICAgICAgICAgICAgICAgICAgICB0cmFuc3BvcnQub3BlbigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDIwMCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0cmFuc3BvcnQub3BlbigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIG9uSGFuZHNoYWtlKGRhdGEpIHtcbiAgICAgICAgdGhpcy5fdXBncmFkZXMgPSB0aGlzLl9maWx0ZXJVcGdyYWRlcyhkYXRhLnVwZ3JhZGVzKTtcbiAgICAgICAgc3VwZXIub25IYW5kc2hha2UoZGF0YSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEZpbHRlcnMgdXBncmFkZXMsIHJldHVybmluZyBvbmx5IHRob3NlIG1hdGNoaW5nIGNsaWVudCB0cmFuc3BvcnRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gdXBncmFkZXMgLSBzZXJ2ZXIgdXBncmFkZXNcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9maWx0ZXJVcGdyYWRlcyh1cGdyYWRlcykge1xuICAgICAgICBjb25zdCBmaWx0ZXJlZFVwZ3JhZGVzID0gW107XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdXBncmFkZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh+dGhpcy50cmFuc3BvcnRzLmluZGV4T2YodXBncmFkZXNbaV0pKVxuICAgICAgICAgICAgICAgIGZpbHRlcmVkVXBncmFkZXMucHVzaCh1cGdyYWRlc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpbHRlcmVkVXBncmFkZXM7XG4gICAgfVxufVxuLyoqXG4gKiBUaGlzIGNsYXNzIHByb3ZpZGVzIGEgV2ViU29ja2V0LWxpa2UgaW50ZXJmYWNlIHRvIGNvbm5lY3QgdG8gYW4gRW5naW5lLklPIHNlcnZlci4gVGhlIGNvbm5lY3Rpb24gd2lsbCBiZSBlc3RhYmxpc2hlZFxuICogd2l0aCBvbmUgb2YgdGhlIGF2YWlsYWJsZSBsb3ctbGV2ZWwgdHJhbnNwb3J0cywgbGlrZSBIVFRQIGxvbmctcG9sbGluZywgV2ViU29ja2V0IG9yIFdlYlRyYW5zcG9ydC5cbiAqXG4gKiBUaGlzIGNsYXNzIGNvbWVzIHdpdGggYW4gdXBncmFkZSBtZWNoYW5pc20sIHdoaWNoIG1lYW5zIHRoYXQgb25jZSB0aGUgY29ubmVjdGlvbiBpcyBlc3RhYmxpc2hlZCB3aXRoIHRoZSBmaXJzdFxuICogbG93LWxldmVsIHRyYW5zcG9ydCwgaXQgd2lsbCB0cnkgdG8gdXBncmFkZSB0byBhIGJldHRlciB0cmFuc3BvcnQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGltcG9ydCB7IFNvY2tldCB9IGZyb20gXCJlbmdpbmUuaW8tY2xpZW50XCI7XG4gKlxuICogY29uc3Qgc29ja2V0ID0gbmV3IFNvY2tldCgpO1xuICpcbiAqIHNvY2tldC5vbihcIm9wZW5cIiwgKCkgPT4ge1xuICogICBzb2NrZXQuc2VuZChcImhlbGxvXCIpO1xuICogfSk7XG4gKlxuICogQHNlZSBTb2NrZXRXaXRob3V0VXBncmFkZVxuICogQHNlZSBTb2NrZXRXaXRoVXBncmFkZVxuICovXG5leHBvcnQgY2xhc3MgU29ja2V0IGV4dGVuZHMgU29ja2V0V2l0aFVwZ3JhZGUge1xuICAgIGNvbnN0cnVjdG9yKHVyaSwgb3B0cyA9IHt9KSB7XG4gICAgICAgIGNvbnN0IG8gPSB0eXBlb2YgdXJpID09PSBcIm9iamVjdFwiID8gdXJpIDogb3B0cztcbiAgICAgICAgaWYgKCFvLnRyYW5zcG9ydHMgfHxcbiAgICAgICAgICAgIChvLnRyYW5zcG9ydHMgJiYgdHlwZW9mIG8udHJhbnNwb3J0c1swXSA9PT0gXCJzdHJpbmdcIikpIHtcbiAgICAgICAgICAgIG8udHJhbnNwb3J0cyA9IChvLnRyYW5zcG9ydHMgfHwgW1wicG9sbGluZ1wiLCBcIndlYnNvY2tldFwiLCBcIndlYnRyYW5zcG9ydFwiXSlcbiAgICAgICAgICAgICAgICAubWFwKCh0cmFuc3BvcnROYW1lKSA9PiBERUZBVUxUX1RSQU5TUE9SVFNbdHJhbnNwb3J0TmFtZV0pXG4gICAgICAgICAgICAgICAgLmZpbHRlcigodCkgPT4gISF0KTtcbiAgICAgICAgfVxuICAgICAgICBzdXBlcih1cmksIG8pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IFNvY2tldCB9IGZyb20gXCIuL3NvY2tldC5qc1wiO1xuZXhwb3J0IHsgU29ja2V0IH07XG5leHBvcnQgeyBTb2NrZXRXaXRob3V0VXBncmFkZSwgU29ja2V0V2l0aFVwZ3JhZGUsIH0gZnJvbSBcIi4vc29ja2V0LmpzXCI7XG5leHBvcnQgY29uc3QgcHJvdG9jb2wgPSBTb2NrZXQucHJvdG9jb2w7XG5leHBvcnQgeyBUcmFuc3BvcnQsIFRyYW5zcG9ydEVycm9yIH0gZnJvbSBcIi4vdHJhbnNwb3J0LmpzXCI7XG5leHBvcnQgeyB0cmFuc3BvcnRzIH0gZnJvbSBcIi4vdHJhbnNwb3J0cy9pbmRleC5qc1wiO1xuZXhwb3J0IHsgaW5zdGFsbFRpbWVyRnVuY3Rpb25zIH0gZnJvbSBcIi4vdXRpbC5qc1wiO1xuZXhwb3J0IHsgcGFyc2UgfSBmcm9tIFwiLi9jb250cmliL3BhcnNldXJpLmpzXCI7XG5leHBvcnQgeyBuZXh0VGljayB9IGZyb20gXCIuL2dsb2JhbHMubm9kZS5qc1wiO1xuZXhwb3J0IHsgRmV0Y2ggfSBmcm9tIFwiLi90cmFuc3BvcnRzL3BvbGxpbmctZmV0Y2guanNcIjtcbmV4cG9ydCB7IFhIUiBhcyBOb2RlWEhSIH0gZnJvbSBcIi4vdHJhbnNwb3J0cy9wb2xsaW5nLXhoci5ub2RlLmpzXCI7XG5leHBvcnQgeyBYSFIgfSBmcm9tIFwiLi90cmFuc3BvcnRzL3BvbGxpbmcteGhyLmpzXCI7XG5leHBvcnQgeyBXUyBhcyBOb2RlV2ViU29ja2V0IH0gZnJvbSBcIi4vdHJhbnNwb3J0cy93ZWJzb2NrZXQubm9kZS5qc1wiO1xuZXhwb3J0IHsgV1MgYXMgV2ViU29ja2V0IH0gZnJvbSBcIi4vdHJhbnNwb3J0cy93ZWJzb2NrZXQuanNcIjtcbmV4cG9ydCB7IFdUIGFzIFdlYlRyYW5zcG9ydCB9IGZyb20gXCIuL3RyYW5zcG9ydHMvd2VidHJhbnNwb3J0LmpzXCI7XG4iLCJpbXBvcnQgeyBwYXJzZSB9IGZyb20gXCJlbmdpbmUuaW8tY2xpZW50XCI7XG4vKipcbiAqIFVSTCBwYXJzZXIuXG4gKlxuICogQHBhcmFtIHVyaSAtIHVybFxuICogQHBhcmFtIHBhdGggLSB0aGUgcmVxdWVzdCBwYXRoIG9mIHRoZSBjb25uZWN0aW9uXG4gKiBAcGFyYW0gbG9jIC0gQW4gb2JqZWN0IG1lYW50IHRvIG1pbWljIHdpbmRvdy5sb2NhdGlvbi5cbiAqICAgICAgICBEZWZhdWx0cyB0byB3aW5kb3cubG9jYXRpb24uXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cmwodXJpLCBwYXRoID0gXCJcIiwgbG9jKSB7XG4gICAgbGV0IG9iaiA9IHVyaTtcbiAgICAvLyBkZWZhdWx0IHRvIHdpbmRvdy5sb2NhdGlvblxuICAgIGxvYyA9IGxvYyB8fCAodHlwZW9mIGxvY2F0aW9uICE9PSBcInVuZGVmaW5lZFwiICYmIGxvY2F0aW9uKTtcbiAgICBpZiAobnVsbCA9PSB1cmkpXG4gICAgICAgIHVyaSA9IGxvYy5wcm90b2NvbCArIFwiLy9cIiArIGxvYy5ob3N0O1xuICAgIC8vIHJlbGF0aXZlIHBhdGggc3VwcG9ydFxuICAgIGlmICh0eXBlb2YgdXJpID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgIGlmIChcIi9cIiA9PT0gdXJpLmNoYXJBdCgwKSkge1xuICAgICAgICAgICAgaWYgKFwiL1wiID09PSB1cmkuY2hhckF0KDEpKSB7XG4gICAgICAgICAgICAgICAgdXJpID0gbG9jLnByb3RvY29sICsgdXJpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdXJpID0gbG9jLmhvc3QgKyB1cmk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCEvXihodHRwcz98d3NzPyk6XFwvXFwvLy50ZXN0KHVyaSkpIHtcbiAgICAgICAgICAgIGlmIChcInVuZGVmaW5lZFwiICE9PSB0eXBlb2YgbG9jKSB7XG4gICAgICAgICAgICAgICAgdXJpID0gbG9jLnByb3RvY29sICsgXCIvL1wiICsgdXJpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdXJpID0gXCJodHRwczovL1wiICsgdXJpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIHBhcnNlXG4gICAgICAgIG9iaiA9IHBhcnNlKHVyaSk7XG4gICAgfVxuICAgIC8vIG1ha2Ugc3VyZSB3ZSB0cmVhdCBgbG9jYWxob3N0OjgwYCBhbmQgYGxvY2FsaG9zdGAgZXF1YWxseVxuICAgIGlmICghb2JqLnBvcnQpIHtcbiAgICAgICAgaWYgKC9eKGh0dHB8d3MpJC8udGVzdChvYmoucHJvdG9jb2wpKSB7XG4gICAgICAgICAgICBvYmoucG9ydCA9IFwiODBcIjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgvXihodHRwfHdzKXMkLy50ZXN0KG9iai5wcm90b2NvbCkpIHtcbiAgICAgICAgICAgIG9iai5wb3J0ID0gXCI0NDNcIjtcbiAgICAgICAgfVxuICAgIH1cbiAgICBvYmoucGF0aCA9IG9iai5wYXRoIHx8IFwiL1wiO1xuICAgIGNvbnN0IGlwdjYgPSBvYmouaG9zdC5pbmRleE9mKFwiOlwiKSAhPT0gLTE7XG4gICAgY29uc3QgaG9zdCA9IGlwdjYgPyBcIltcIiArIG9iai5ob3N0ICsgXCJdXCIgOiBvYmouaG9zdDtcbiAgICAvLyBkZWZpbmUgdW5pcXVlIGlkXG4gICAgb2JqLmlkID0gb2JqLnByb3RvY29sICsgXCI6Ly9cIiArIGhvc3QgKyBcIjpcIiArIG9iai5wb3J0ICsgcGF0aDtcbiAgICAvLyBkZWZpbmUgaHJlZlxuICAgIG9iai5ocmVmID1cbiAgICAgICAgb2JqLnByb3RvY29sICtcbiAgICAgICAgICAgIFwiOi8vXCIgK1xuICAgICAgICAgICAgaG9zdCArXG4gICAgICAgICAgICAobG9jICYmIGxvYy5wb3J0ID09PSBvYmoucG9ydCA/IFwiXCIgOiBcIjpcIiArIG9iai5wb3J0KTtcbiAgICByZXR1cm4gb2JqO1xufVxuIiwiY29uc3Qgd2l0aE5hdGl2ZUFycmF5QnVmZmVyID0gdHlwZW9mIEFycmF5QnVmZmVyID09PSBcImZ1bmN0aW9uXCI7XG5jb25zdCBpc1ZpZXcgPSAob2JqKSA9PiB7XG4gICAgcmV0dXJuIHR5cGVvZiBBcnJheUJ1ZmZlci5pc1ZpZXcgPT09IFwiZnVuY3Rpb25cIlxuICAgICAgICA/IEFycmF5QnVmZmVyLmlzVmlldyhvYmopXG4gICAgICAgIDogb2JqLmJ1ZmZlciBpbnN0YW5jZW9mIEFycmF5QnVmZmVyO1xufTtcbmNvbnN0IHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmNvbnN0IHdpdGhOYXRpdmVCbG9iID0gdHlwZW9mIEJsb2IgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICh0eXBlb2YgQmxvYiAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICB0b1N0cmluZy5jYWxsKEJsb2IpID09PSBcIltvYmplY3QgQmxvYkNvbnN0cnVjdG9yXVwiKTtcbmNvbnN0IHdpdGhOYXRpdmVGaWxlID0gdHlwZW9mIEZpbGUgPT09IFwiZnVuY3Rpb25cIiB8fFxuICAgICh0eXBlb2YgRmlsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgICAgICB0b1N0cmluZy5jYWxsKEZpbGUpID09PSBcIltvYmplY3QgRmlsZUNvbnN0cnVjdG9yXVwiKTtcbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIG9iaiBpcyBhIEJ1ZmZlciwgYW4gQXJyYXlCdWZmZXIsIGEgQmxvYiBvciBhIEZpbGUuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzQmluYXJ5KG9iaikge1xuICAgIHJldHVybiAoKHdpdGhOYXRpdmVBcnJheUJ1ZmZlciAmJiAob2JqIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgfHwgaXNWaWV3KG9iaikpKSB8fFxuICAgICAgICAod2l0aE5hdGl2ZUJsb2IgJiYgb2JqIGluc3RhbmNlb2YgQmxvYikgfHxcbiAgICAgICAgKHdpdGhOYXRpdmVGaWxlICYmIG9iaiBpbnN0YW5jZW9mIEZpbGUpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBoYXNCaW5hcnkob2JqLCB0b0pTT04pIHtcbiAgICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKEFycmF5LmlzQXJyYXkob2JqKSkge1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbCA9IG9iai5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChoYXNCaW5hcnkob2JqW2ldKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKGlzQmluYXJ5KG9iaikpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChvYmoudG9KU09OICYmXG4gICAgICAgIHR5cGVvZiBvYmoudG9KU09OID09PSBcImZ1bmN0aW9uXCIgJiZcbiAgICAgICAgYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gaGFzQmluYXJ5KG9iai50b0pTT04oKSwgdHJ1ZSk7XG4gICAgfVxuICAgIGZvciAoY29uc3Qga2V5IGluIG9iaikge1xuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSAmJiBoYXNCaW5hcnkob2JqW2tleV0pKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG59XG4iLCJpbXBvcnQgeyBpc0JpbmFyeSB9IGZyb20gXCIuL2lzLWJpbmFyeS5qc1wiO1xuLyoqXG4gKiBSZXBsYWNlcyBldmVyeSBCdWZmZXIgfCBBcnJheUJ1ZmZlciB8IEJsb2IgfCBGaWxlIGluIHBhY2tldCB3aXRoIGEgbnVtYmVyZWQgcGxhY2Vob2xkZXIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhY2tldCAtIHNvY2tldC5pbyBldmVudCBwYWNrZXRcbiAqIEByZXR1cm4ge09iamVjdH0gd2l0aCBkZWNvbnN0cnVjdGVkIHBhY2tldCBhbmQgbGlzdCBvZiBidWZmZXJzXG4gKiBAcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZWNvbnN0cnVjdFBhY2tldChwYWNrZXQpIHtcbiAgICBjb25zdCBidWZmZXJzID0gW107XG4gICAgY29uc3QgcGFja2V0RGF0YSA9IHBhY2tldC5kYXRhO1xuICAgIGNvbnN0IHBhY2sgPSBwYWNrZXQ7XG4gICAgcGFjay5kYXRhID0gX2RlY29uc3RydWN0UGFja2V0KHBhY2tldERhdGEsIGJ1ZmZlcnMpO1xuICAgIHBhY2suYXR0YWNobWVudHMgPSBidWZmZXJzLmxlbmd0aDsgLy8gbnVtYmVyIG9mIGJpbmFyeSAnYXR0YWNobWVudHMnXG4gICAgcmV0dXJuIHsgcGFja2V0OiBwYWNrLCBidWZmZXJzOiBidWZmZXJzIH07XG59XG5mdW5jdGlvbiBfZGVjb25zdHJ1Y3RQYWNrZXQoZGF0YSwgYnVmZmVycykge1xuICAgIGlmICghZGF0YSlcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgaWYgKGlzQmluYXJ5KGRhdGEpKSB7XG4gICAgICAgIGNvbnN0IHBsYWNlaG9sZGVyID0geyBfcGxhY2Vob2xkZXI6IHRydWUsIG51bTogYnVmZmVycy5sZW5ndGggfTtcbiAgICAgICAgYnVmZmVycy5wdXNoKGRhdGEpO1xuICAgICAgICByZXR1cm4gcGxhY2Vob2xkZXI7XG4gICAgfVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgY29uc3QgbmV3RGF0YSA9IG5ldyBBcnJheShkYXRhLmxlbmd0aCk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbmV3RGF0YVtpXSA9IF9kZWNvbnN0cnVjdFBhY2tldChkYXRhW2ldLCBidWZmZXJzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3RGF0YTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIGRhdGEgPT09IFwib2JqZWN0XCIgJiYgIShkYXRhIGluc3RhbmNlb2YgRGF0ZSkpIHtcbiAgICAgICAgY29uc3QgbmV3RGF0YSA9IHt9O1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGRhdGEsIGtleSkpIHtcbiAgICAgICAgICAgICAgICBuZXdEYXRhW2tleV0gPSBfZGVjb25zdHJ1Y3RQYWNrZXQoZGF0YVtrZXldLCBidWZmZXJzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3RGF0YTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGE7XG59XG4vKipcbiAqIFJlY29uc3RydWN0cyBhIGJpbmFyeSBwYWNrZXQgZnJvbSBpdHMgcGxhY2Vob2xkZXIgcGFja2V0IGFuZCBidWZmZXJzXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IHBhY2tldCAtIGV2ZW50IHBhY2tldCB3aXRoIHBsYWNlaG9sZGVyc1xuICogQHBhcmFtIHtBcnJheX0gYnVmZmVycyAtIGJpbmFyeSBidWZmZXJzIHRvIHB1dCBpbiBwbGFjZWhvbGRlciBwb3NpdGlvbnNcbiAqIEByZXR1cm4ge09iamVjdH0gcmVjb25zdHJ1Y3RlZCBwYWNrZXRcbiAqIEBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlY29uc3RydWN0UGFja2V0KHBhY2tldCwgYnVmZmVycykge1xuICAgIHBhY2tldC5kYXRhID0gX3JlY29uc3RydWN0UGFja2V0KHBhY2tldC5kYXRhLCBidWZmZXJzKTtcbiAgICBkZWxldGUgcGFja2V0LmF0dGFjaG1lbnRzOyAvLyBubyBsb25nZXIgdXNlZnVsXG4gICAgcmV0dXJuIHBhY2tldDtcbn1cbmZ1bmN0aW9uIF9yZWNvbnN0cnVjdFBhY2tldChkYXRhLCBidWZmZXJzKSB7XG4gICAgaWYgKCFkYXRhKVxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICBpZiAoZGF0YSAmJiBkYXRhLl9wbGFjZWhvbGRlciA9PT0gdHJ1ZSkge1xuICAgICAgICBjb25zdCBpc0luZGV4VmFsaWQgPSB0eXBlb2YgZGF0YS5udW0gPT09IFwibnVtYmVyXCIgJiZcbiAgICAgICAgICAgIGRhdGEubnVtID49IDAgJiZcbiAgICAgICAgICAgIGRhdGEubnVtIDwgYnVmZmVycy5sZW5ndGg7XG4gICAgICAgIGlmIChpc0luZGV4VmFsaWQpIHtcbiAgICAgICAgICAgIHJldHVybiBidWZmZXJzW2RhdGEubnVtXTsgLy8gYXBwcm9wcmlhdGUgYnVmZmVyIChzaG91bGQgYmUgbmF0dXJhbCBvcmRlciBhbnl3YXkpXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbGxlZ2FsIGF0dGFjaG1lbnRzXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoZGF0YSkpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBkYXRhW2ldID0gX3JlY29uc3RydWN0UGFja2V0KGRhdGFbaV0sIGJ1ZmZlcnMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGVvZiBkYXRhID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgIGZvciAoY29uc3Qga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoZGF0YSwga2V5KSkge1xuICAgICAgICAgICAgICAgIGRhdGFba2V5XSA9IF9yZWNvbnN0cnVjdFBhY2tldChkYXRhW2tleV0sIGJ1ZmZlcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkYXRhO1xufVxuIiwiaW1wb3J0IHsgRW1pdHRlciB9IGZyb20gXCJAc29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyXCI7XG5pbXBvcnQgeyBkZWNvbnN0cnVjdFBhY2tldCwgcmVjb25zdHJ1Y3RQYWNrZXQgfSBmcm9tIFwiLi9iaW5hcnkuanNcIjtcbmltcG9ydCB7IGlzQmluYXJ5LCBoYXNCaW5hcnkgfSBmcm9tIFwiLi9pcy1iaW5hcnkuanNcIjtcbi8qKlxuICogVGhlc2Ugc3RyaW5ncyBtdXN0IG5vdCBiZSB1c2VkIGFzIGV2ZW50IG5hbWVzLCBhcyB0aGV5IGhhdmUgYSBzcGVjaWFsIG1lYW5pbmcuXG4gKi9cbmNvbnN0IFJFU0VSVkVEX0VWRU5UUyA9IFtcbiAgICBcImNvbm5lY3RcIiwgLy8gdXNlZCBvbiB0aGUgY2xpZW50IHNpZGVcbiAgICBcImNvbm5lY3RfZXJyb3JcIiwgLy8gdXNlZCBvbiB0aGUgY2xpZW50IHNpZGVcbiAgICBcImRpc2Nvbm5lY3RcIiwgLy8gdXNlZCBvbiBib3RoIHNpZGVzXG4gICAgXCJkaXNjb25uZWN0aW5nXCIsIC8vIHVzZWQgb24gdGhlIHNlcnZlciBzaWRlXG4gICAgXCJuZXdMaXN0ZW5lclwiLCAvLyB1c2VkIGJ5IHRoZSBOb2RlLmpzIEV2ZW50RW1pdHRlclxuICAgIFwicmVtb3ZlTGlzdGVuZXJcIiwgLy8gdXNlZCBieSB0aGUgTm9kZS5qcyBFdmVudEVtaXR0ZXJcbl07XG4vKipcbiAqIFByb3RvY29sIHZlcnNpb24uXG4gKlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgY29uc3QgcHJvdG9jb2wgPSA1O1xuZXhwb3J0IHZhciBQYWNrZXRUeXBlO1xuKGZ1bmN0aW9uIChQYWNrZXRUeXBlKSB7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQ09OTkVDVFwiXSA9IDBdID0gXCJDT05ORUNUXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiRElTQ09OTkVDVFwiXSA9IDFdID0gXCJESVNDT05ORUNUXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiRVZFTlRcIl0gPSAyXSA9IFwiRVZFTlRcIjtcbiAgICBQYWNrZXRUeXBlW1BhY2tldFR5cGVbXCJBQ0tcIl0gPSAzXSA9IFwiQUNLXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQ09OTkVDVF9FUlJPUlwiXSA9IDRdID0gXCJDT05ORUNUX0VSUk9SXCI7XG4gICAgUGFja2V0VHlwZVtQYWNrZXRUeXBlW1wiQklOQVJZX0VWRU5UXCJdID0gNV0gPSBcIkJJTkFSWV9FVkVOVFwiO1xuICAgIFBhY2tldFR5cGVbUGFja2V0VHlwZVtcIkJJTkFSWV9BQ0tcIl0gPSA2XSA9IFwiQklOQVJZX0FDS1wiO1xufSkoUGFja2V0VHlwZSB8fCAoUGFja2V0VHlwZSA9IHt9KSk7XG4vKipcbiAqIEEgc29ja2V0LmlvIEVuY29kZXIgaW5zdGFuY2VcbiAqL1xuZXhwb3J0IGNsYXNzIEVuY29kZXIge1xuICAgIC8qKlxuICAgICAqIEVuY29kZXIgY29uc3RydWN0b3JcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7ZnVuY3Rpb259IHJlcGxhY2VyIC0gY3VzdG9tIHJlcGxhY2VyIHRvIHBhc3MgZG93biB0byBKU09OLnBhcnNlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IocmVwbGFjZXIpIHtcbiAgICAgICAgdGhpcy5yZXBsYWNlciA9IHJlcGxhY2VyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbmNvZGUgYSBwYWNrZXQgYXMgYSBzaW5nbGUgc3RyaW5nIGlmIG5vbi1iaW5hcnksIG9yIGFzIGFcbiAgICAgKiBidWZmZXIgc2VxdWVuY2UsIGRlcGVuZGluZyBvbiBwYWNrZXQgdHlwZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvYmogLSBwYWNrZXQgb2JqZWN0XG4gICAgICovXG4gICAgZW5jb2RlKG9iaikge1xuICAgICAgICBpZiAob2JqLnR5cGUgPT09IFBhY2tldFR5cGUuRVZFTlQgfHwgb2JqLnR5cGUgPT09IFBhY2tldFR5cGUuQUNLKSB7XG4gICAgICAgICAgICBpZiAoaGFzQmluYXJ5KG9iaikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5lbmNvZGVBc0JpbmFyeSh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IG9iai50eXBlID09PSBQYWNrZXRUeXBlLkVWRU5UXG4gICAgICAgICAgICAgICAgICAgICAgICA/IFBhY2tldFR5cGUuQklOQVJZX0VWRU5UXG4gICAgICAgICAgICAgICAgICAgICAgICA6IFBhY2tldFR5cGUuQklOQVJZX0FDSyxcbiAgICAgICAgICAgICAgICAgICAgbnNwOiBvYmoubnNwLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBvYmouZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgaWQ6IG9iai5pZCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gW3RoaXMuZW5jb2RlQXNTdHJpbmcob2JqKV07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEVuY29kZSBwYWNrZXQgYXMgc3RyaW5nLlxuICAgICAqL1xuICAgIGVuY29kZUFzU3RyaW5nKG9iaikge1xuICAgICAgICAvLyBmaXJzdCBpcyB0eXBlXG4gICAgICAgIGxldCBzdHIgPSBcIlwiICsgb2JqLnR5cGU7XG4gICAgICAgIC8vIGF0dGFjaG1lbnRzIGlmIHdlIGhhdmUgdGhlbVxuICAgICAgICBpZiAob2JqLnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0VWRU5UIHx8XG4gICAgICAgICAgICBvYmoudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfQUNLKSB7XG4gICAgICAgICAgICBzdHIgKz0gb2JqLmF0dGFjaG1lbnRzICsgXCItXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgd2UgaGF2ZSBhIG5hbWVzcGFjZSBvdGhlciB0aGFuIGAvYFxuICAgICAgICAvLyB3ZSBhcHBlbmQgaXQgZm9sbG93ZWQgYnkgYSBjb21tYSBgLGBcbiAgICAgICAgaWYgKG9iai5uc3AgJiYgXCIvXCIgIT09IG9iai5uc3ApIHtcbiAgICAgICAgICAgIHN0ciArPSBvYmoubnNwICsgXCIsXCI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW1tZWRpYXRlbHkgZm9sbG93ZWQgYnkgdGhlIGlkXG4gICAgICAgIGlmIChudWxsICE9IG9iai5pZCkge1xuICAgICAgICAgICAgc3RyICs9IG9iai5pZDtcbiAgICAgICAgfVxuICAgICAgICAvLyBqc29uIGRhdGFcbiAgICAgICAgaWYgKG51bGwgIT0gb2JqLmRhdGEpIHtcbiAgICAgICAgICAgIHN0ciArPSBKU09OLnN0cmluZ2lmeShvYmouZGF0YSwgdGhpcy5yZXBsYWNlcik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRW5jb2RlIHBhY2tldCBhcyAnYnVmZmVyIHNlcXVlbmNlJyBieSByZW1vdmluZyBibG9icywgYW5kXG4gICAgICogZGVjb25zdHJ1Y3RpbmcgcGFja2V0IGludG8gb2JqZWN0IHdpdGggcGxhY2Vob2xkZXJzIGFuZFxuICAgICAqIGEgbGlzdCBvZiBidWZmZXJzLlxuICAgICAqL1xuICAgIGVuY29kZUFzQmluYXJ5KG9iaikge1xuICAgICAgICBjb25zdCBkZWNvbnN0cnVjdGlvbiA9IGRlY29uc3RydWN0UGFja2V0KG9iaik7XG4gICAgICAgIGNvbnN0IHBhY2sgPSB0aGlzLmVuY29kZUFzU3RyaW5nKGRlY29uc3RydWN0aW9uLnBhY2tldCk7XG4gICAgICAgIGNvbnN0IGJ1ZmZlcnMgPSBkZWNvbnN0cnVjdGlvbi5idWZmZXJzO1xuICAgICAgICBidWZmZXJzLnVuc2hpZnQocGFjayk7IC8vIGFkZCBwYWNrZXQgaW5mbyB0byBiZWdpbm5pbmcgb2YgZGF0YSBsaXN0XG4gICAgICAgIHJldHVybiBidWZmZXJzOyAvLyB3cml0ZSBhbGwgdGhlIGJ1ZmZlcnNcbiAgICB9XG59XG4vKipcbiAqIEEgc29ja2V0LmlvIERlY29kZXIgaW5zdGFuY2VcbiAqXG4gKiBAcmV0dXJuIHtPYmplY3R9IGRlY29kZXJcbiAqL1xuZXhwb3J0IGNsYXNzIERlY29kZXIgZXh0ZW5kcyBFbWl0dGVyIHtcbiAgICAvKipcbiAgICAgKiBEZWNvZGVyIGNvbnN0cnVjdG9yXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSByZXZpdmVyIC0gY3VzdG9tIHJldml2ZXIgdG8gcGFzcyBkb3duIHRvIEpTT04uc3RyaW5naWZ5XG4gICAgICovXG4gICAgY29uc3RydWN0b3IocmV2aXZlcikge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnJldml2ZXIgPSByZXZpdmVyO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZWNvZGVzIGFuIGVuY29kZWQgcGFja2V0IHN0cmluZyBpbnRvIHBhY2tldCBKU09OLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IG9iaiAtIGVuY29kZWQgcGFja2V0XG4gICAgICovXG4gICAgYWRkKG9iaikge1xuICAgICAgICBsZXQgcGFja2V0O1xuICAgICAgICBpZiAodHlwZW9mIG9iaiA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVjb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImdvdCBwbGFpbnRleHQgZGF0YSB3aGVuIHJlY29uc3RydWN0aW5nIGEgcGFja2V0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFja2V0ID0gdGhpcy5kZWNvZGVTdHJpbmcob2JqKTtcbiAgICAgICAgICAgIGNvbnN0IGlzQmluYXJ5RXZlbnQgPSBwYWNrZXQudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfRVZFTlQ7XG4gICAgICAgICAgICBpZiAoaXNCaW5hcnlFdmVudCB8fCBwYWNrZXQudHlwZSA9PT0gUGFja2V0VHlwZS5CSU5BUllfQUNLKSB7XG4gICAgICAgICAgICAgICAgcGFja2V0LnR5cGUgPSBpc0JpbmFyeUV2ZW50ID8gUGFja2V0VHlwZS5FVkVOVCA6IFBhY2tldFR5cGUuQUNLO1xuICAgICAgICAgICAgICAgIC8vIGJpbmFyeSBwYWNrZXQncyBqc29uXG4gICAgICAgICAgICAgICAgdGhpcy5yZWNvbnN0cnVjdG9yID0gbmV3IEJpbmFyeVJlY29uc3RydWN0b3IocGFja2V0KTtcbiAgICAgICAgICAgICAgICAvLyBubyBhdHRhY2htZW50cywgbGFiZWxlZCBiaW5hcnkgYnV0IG5vIGJpbmFyeSBkYXRhIHRvIGZvbGxvd1xuICAgICAgICAgICAgICAgIGlmIChwYWNrZXQuYXR0YWNobWVudHMgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwiZGVjb2RlZFwiLCBwYWNrZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIG5vbi1iaW5hcnkgZnVsbCBwYWNrZXRcbiAgICAgICAgICAgICAgICBzdXBlci5lbWl0UmVzZXJ2ZWQoXCJkZWNvZGVkXCIsIHBhY2tldCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNCaW5hcnkob2JqKSB8fCBvYmouYmFzZTY0KSB7XG4gICAgICAgICAgICAvLyByYXcgYmluYXJ5IGRhdGFcbiAgICAgICAgICAgIGlmICghdGhpcy5yZWNvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiZ290IGJpbmFyeSBkYXRhIHdoZW4gbm90IHJlY29uc3RydWN0aW5nIGEgcGFja2V0XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcGFja2V0ID0gdGhpcy5yZWNvbnN0cnVjdG9yLnRha2VCaW5hcnlEYXRhKG9iaik7XG4gICAgICAgICAgICAgICAgaWYgKHBhY2tldCkge1xuICAgICAgICAgICAgICAgICAgICAvLyByZWNlaXZlZCBmaW5hbCBidWZmZXJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWNvbnN0cnVjdG9yID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgc3VwZXIuZW1pdFJlc2VydmVkKFwiZGVjb2RlZFwiLCBwYWNrZXQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVua25vd24gdHlwZTogXCIgKyBvYmopO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIERlY29kZSBhIHBhY2tldCBTdHJpbmcgKEpTT04gZGF0YSlcbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBzdHJcbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IHBhY2tldFxuICAgICAqL1xuICAgIGRlY29kZVN0cmluZyhzdHIpIHtcbiAgICAgICAgbGV0IGkgPSAwO1xuICAgICAgICAvLyBsb29rIHVwIHR5cGVcbiAgICAgICAgY29uc3QgcCA9IHtcbiAgICAgICAgICAgIHR5cGU6IE51bWJlcihzdHIuY2hhckF0KDApKSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKFBhY2tldFR5cGVbcC50eXBlXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ1bmtub3duIHBhY2tldCB0eXBlIFwiICsgcC50eXBlKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBsb29rIHVwIGF0dGFjaG1lbnRzIGlmIHR5cGUgYmluYXJ5XG4gICAgICAgIGlmIChwLnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0VWRU5UIHx8XG4gICAgICAgICAgICBwLnR5cGUgPT09IFBhY2tldFR5cGUuQklOQVJZX0FDSykge1xuICAgICAgICAgICAgY29uc3Qgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICAgIHdoaWxlIChzdHIuY2hhckF0KCsraSkgIT09IFwiLVwiICYmIGkgIT0gc3RyLmxlbmd0aCkgeyB9XG4gICAgICAgICAgICBjb25zdCBidWYgPSBzdHIuc3Vic3RyaW5nKHN0YXJ0LCBpKTtcbiAgICAgICAgICAgIGlmIChidWYgIT0gTnVtYmVyKGJ1ZikgfHwgc3RyLmNoYXJBdChpKSAhPT0gXCItXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbGxlZ2FsIGF0dGFjaG1lbnRzXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcC5hdHRhY2htZW50cyA9IE51bWJlcihidWYpO1xuICAgICAgICB9XG4gICAgICAgIC8vIGxvb2sgdXAgbmFtZXNwYWNlIChpZiBhbnkpXG4gICAgICAgIGlmIChcIi9cIiA9PT0gc3RyLmNoYXJBdChpICsgMSkpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gaSArIDE7XG4gICAgICAgICAgICB3aGlsZSAoKytpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYyA9IHN0ci5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgaWYgKFwiLFwiID09PSBjKVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gc3RyLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwLm5zcCA9IHN0ci5zdWJzdHJpbmcoc3RhcnQsIGkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcC5uc3AgPSBcIi9cIjtcbiAgICAgICAgfVxuICAgICAgICAvLyBsb29rIHVwIGlkXG4gICAgICAgIGNvbnN0IG5leHQgPSBzdHIuY2hhckF0KGkgKyAxKTtcbiAgICAgICAgaWYgKFwiXCIgIT09IG5leHQgJiYgTnVtYmVyKG5leHQpID09IG5leHQpIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0ID0gaSArIDE7XG4gICAgICAgICAgICB3aGlsZSAoKytpKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYyA9IHN0ci5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgaWYgKG51bGwgPT0gYyB8fCBOdW1iZXIoYykgIT0gYykge1xuICAgICAgICAgICAgICAgICAgICAtLWk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoaSA9PT0gc3RyLmxlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwLmlkID0gTnVtYmVyKHN0ci5zdWJzdHJpbmcoc3RhcnQsIGkgKyAxKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbG9vayB1cCBqc29uIGRhdGFcbiAgICAgICAgaWYgKHN0ci5jaGFyQXQoKytpKSkge1xuICAgICAgICAgICAgY29uc3QgcGF5bG9hZCA9IHRoaXMudHJ5UGFyc2Uoc3RyLnN1YnN0cihpKSk7XG4gICAgICAgICAgICBpZiAoRGVjb2Rlci5pc1BheWxvYWRWYWxpZChwLnR5cGUsIHBheWxvYWQpKSB7XG4gICAgICAgICAgICAgICAgcC5kYXRhID0gcGF5bG9hZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImludmFsaWQgcGF5bG9hZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcDtcbiAgICB9XG4gICAgdHJ5UGFyc2Uoc3RyKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShzdHIsIHRoaXMucmV2aXZlcik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgaXNQYXlsb2FkVmFsaWQodHlwZSwgcGF5bG9hZCkge1xuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5DT05ORUNUOlxuICAgICAgICAgICAgICAgIHJldHVybiBpc09iamVjdChwYXlsb2FkKTtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5ESVNDT05ORUNUOlxuICAgICAgICAgICAgICAgIHJldHVybiBwYXlsb2FkID09PSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQ09OTkVDVF9FUlJPUjpcbiAgICAgICAgICAgICAgICByZXR1cm4gdHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIgfHwgaXNPYmplY3QocGF5bG9hZCk7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuRVZFTlQ6XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQklOQVJZX0VWRU5UOlxuICAgICAgICAgICAgICAgIHJldHVybiAoQXJyYXkuaXNBcnJheShwYXlsb2FkKSAmJlxuICAgICAgICAgICAgICAgICAgICAodHlwZW9mIHBheWxvYWRbMF0gPT09IFwibnVtYmVyXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgICh0eXBlb2YgcGF5bG9hZFswXSA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJFU0VSVkVEX0VWRU5UUy5pbmRleE9mKHBheWxvYWRbMF0pID09PSAtMSkpKTtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5BQ0s6XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQklOQVJZX0FDSzpcbiAgICAgICAgICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShwYXlsb2FkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBEZWFsbG9jYXRlcyBhIHBhcnNlcidzIHJlc291cmNlc1xuICAgICAqL1xuICAgIGRlc3Ryb3koKSB7XG4gICAgICAgIGlmICh0aGlzLnJlY29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgIHRoaXMucmVjb25zdHJ1Y3Rvci5maW5pc2hlZFJlY29uc3RydWN0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLnJlY29uc3RydWN0b3IgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxufVxuLyoqXG4gKiBBIG1hbmFnZXIgb2YgYSBiaW5hcnkgZXZlbnQncyAnYnVmZmVyIHNlcXVlbmNlJy4gU2hvdWxkXG4gKiBiZSBjb25zdHJ1Y3RlZCB3aGVuZXZlciBhIHBhY2tldCBvZiB0eXBlIEJJTkFSWV9FVkVOVCBpc1xuICogZGVjb2RlZC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gcGFja2V0XG4gKiBAcmV0dXJuIHtCaW5hcnlSZWNvbnN0cnVjdG9yfSBpbml0aWFsaXplZCByZWNvbnN0cnVjdG9yXG4gKi9cbmNsYXNzIEJpbmFyeVJlY29uc3RydWN0b3Ige1xuICAgIGNvbnN0cnVjdG9yKHBhY2tldCkge1xuICAgICAgICB0aGlzLnBhY2tldCA9IHBhY2tldDtcbiAgICAgICAgdGhpcy5idWZmZXJzID0gW107XG4gICAgICAgIHRoaXMucmVjb25QYWNrID0gcGFja2V0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gYmluYXJ5IGRhdGEgcmVjZWl2ZWQgZnJvbSBjb25uZWN0aW9uXG4gICAgICogYWZ0ZXIgYSBCSU5BUllfRVZFTlQgcGFja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtCdWZmZXIgfCBBcnJheUJ1ZmZlcn0gYmluRGF0YSAtIHRoZSByYXcgYmluYXJ5IGRhdGEgcmVjZWl2ZWRcbiAgICAgKiBAcmV0dXJuIHtudWxsIHwgT2JqZWN0fSByZXR1cm5zIG51bGwgaWYgbW9yZSBiaW5hcnkgZGF0YSBpcyBleHBlY3RlZCBvclxuICAgICAqICAgYSByZWNvbnN0cnVjdGVkIHBhY2tldCBvYmplY3QgaWYgYWxsIGJ1ZmZlcnMgaGF2ZSBiZWVuIHJlY2VpdmVkLlxuICAgICAqL1xuICAgIHRha2VCaW5hcnlEYXRhKGJpbkRhdGEpIHtcbiAgICAgICAgdGhpcy5idWZmZXJzLnB1c2goYmluRGF0YSk7XG4gICAgICAgIGlmICh0aGlzLmJ1ZmZlcnMubGVuZ3RoID09PSB0aGlzLnJlY29uUGFjay5hdHRhY2htZW50cykge1xuICAgICAgICAgICAgLy8gZG9uZSB3aXRoIGJ1ZmZlciBsaXN0XG4gICAgICAgICAgICBjb25zdCBwYWNrZXQgPSByZWNvbnN0cnVjdFBhY2tldCh0aGlzLnJlY29uUGFjaywgdGhpcy5idWZmZXJzKTtcbiAgICAgICAgICAgIHRoaXMuZmluaXNoZWRSZWNvbnN0cnVjdGlvbigpO1xuICAgICAgICAgICAgcmV0dXJuIHBhY2tldDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xlYW5zIHVwIGJpbmFyeSBwYWNrZXQgcmVjb25zdHJ1Y3Rpb24gdmFyaWFibGVzLlxuICAgICAqL1xuICAgIGZpbmlzaGVkUmVjb25zdHJ1Y3Rpb24oKSB7XG4gICAgICAgIHRoaXMucmVjb25QYWNrID0gbnVsbDtcbiAgICAgICAgdGhpcy5idWZmZXJzID0gW107XG4gICAgfVxufVxuZnVuY3Rpb24gaXNOYW1lc3BhY2VWYWxpZChuc3ApIHtcbiAgICByZXR1cm4gdHlwZW9mIG5zcCA9PT0gXCJzdHJpbmdcIjtcbn1cbi8vIHNlZSBodHRwczovL2Nhbml1c2UuY29tL21kbi1qYXZhc2NyaXB0X2J1aWx0aW5zX251bWJlcl9pc2ludGVnZXJcbmNvbnN0IGlzSW50ZWdlciA9IE51bWJlci5pc0ludGVnZXIgfHxcbiAgICBmdW5jdGlvbiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgJiZcbiAgICAgICAgICAgIGlzRmluaXRlKHZhbHVlKSAmJlxuICAgICAgICAgICAgTWF0aC5mbG9vcih2YWx1ZSkgPT09IHZhbHVlKTtcbiAgICB9O1xuZnVuY3Rpb24gaXNBY2tJZFZhbGlkKGlkKSB7XG4gICAgcmV0dXJuIGlkID09PSB1bmRlZmluZWQgfHwgaXNJbnRlZ2VyKGlkKTtcbn1cbi8vIHNlZSBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy84NTExMjgxL2NoZWNrLWlmLWEtdmFsdWUtaXMtYW4tb2JqZWN0LWluLWphdmFzY3JpcHRcbmZ1bmN0aW9uIGlzT2JqZWN0KHZhbHVlKSB7XG4gICAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09IFwiW29iamVjdCBPYmplY3RdXCI7XG59XG5mdW5jdGlvbiBpc0RhdGFWYWxpZCh0eXBlLCBwYXlsb2FkKSB7XG4gICAgc3dpdGNoICh0eXBlKSB7XG4gICAgICAgIGNhc2UgUGFja2V0VHlwZS5DT05ORUNUOlxuICAgICAgICAgICAgcmV0dXJuIHBheWxvYWQgPT09IHVuZGVmaW5lZCB8fCBpc09iamVjdChwYXlsb2FkKTtcbiAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkRJU0NPTk5FQ1Q6XG4gICAgICAgICAgICByZXR1cm4gcGF5bG9hZCA9PT0gdW5kZWZpbmVkO1xuICAgICAgICBjYXNlIFBhY2tldFR5cGUuRVZFTlQ6XG4gICAgICAgICAgICByZXR1cm4gKEFycmF5LmlzQXJyYXkocGF5bG9hZCkgJiZcbiAgICAgICAgICAgICAgICAodHlwZW9mIHBheWxvYWRbMF0gPT09IFwibnVtYmVyXCIgfHxcbiAgICAgICAgICAgICAgICAgICAgKHR5cGVvZiBwYXlsb2FkWzBdID09PSBcInN0cmluZ1wiICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBSRVNFUlZFRF9FVkVOVFMuaW5kZXhPZihwYXlsb2FkWzBdKSA9PT0gLTEpKSk7XG4gICAgICAgIGNhc2UgUGFja2V0VHlwZS5BQ0s6XG4gICAgICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShwYXlsb2FkKTtcbiAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkNPTk5FQ1RfRVJST1I6XG4gICAgICAgICAgICByZXR1cm4gdHlwZW9mIHBheWxvYWQgPT09IFwic3RyaW5nXCIgfHwgaXNPYmplY3QocGF5bG9hZCk7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIGlzUGFja2V0VmFsaWQocGFja2V0KSB7XG4gICAgcmV0dXJuIChpc05hbWVzcGFjZVZhbGlkKHBhY2tldC5uc3ApICYmXG4gICAgICAgIGlzQWNrSWRWYWxpZChwYWNrZXQuaWQpICYmXG4gICAgICAgIGlzRGF0YVZhbGlkKHBhY2tldC50eXBlLCBwYWNrZXQuZGF0YSkpO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIG9uKG9iaiwgZXYsIGZuKSB7XG4gICAgb2JqLm9uKGV2LCBmbik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHN1YkRlc3Ryb3koKSB7XG4gICAgICAgIG9iai5vZmYoZXYsIGZuKTtcbiAgICB9O1xufVxuIiwiaW1wb3J0IHsgUGFja2V0VHlwZSB9IGZyb20gXCJzb2NrZXQuaW8tcGFyc2VyXCI7XG5pbXBvcnQgeyBvbiB9IGZyb20gXCIuL29uLmpzXCI7XG5pbXBvcnQgeyBFbWl0dGVyLCB9IGZyb20gXCJAc29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyXCI7XG4vKipcbiAqIEludGVybmFsIGV2ZW50cy5cbiAqIFRoZXNlIGV2ZW50cyBjYW4ndCBiZSBlbWl0dGVkIGJ5IHRoZSB1c2VyLlxuICovXG5jb25zdCBSRVNFUlZFRF9FVkVOVFMgPSBPYmplY3QuZnJlZXplKHtcbiAgICBjb25uZWN0OiAxLFxuICAgIGNvbm5lY3RfZXJyb3I6IDEsXG4gICAgZGlzY29ubmVjdDogMSxcbiAgICBkaXNjb25uZWN0aW5nOiAxLFxuICAgIC8vIEV2ZW50RW1pdHRlciByZXNlcnZlZCBldmVudHM6IGh0dHBzOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWwjZXZlbnRzX2V2ZW50X25ld2xpc3RlbmVyXG4gICAgbmV3TGlzdGVuZXI6IDEsXG4gICAgcmVtb3ZlTGlzdGVuZXI6IDEsXG59KTtcbi8qKlxuICogQSBTb2NrZXQgaXMgdGhlIGZ1bmRhbWVudGFsIGNsYXNzIGZvciBpbnRlcmFjdGluZyB3aXRoIHRoZSBzZXJ2ZXIuXG4gKlxuICogQSBTb2NrZXQgYmVsb25ncyB0byBhIGNlcnRhaW4gTmFtZXNwYWNlIChieSBkZWZhdWx0IC8pIGFuZCB1c2VzIGFuIHVuZGVybHlpbmcge0BsaW5rIE1hbmFnZXJ9IHRvIGNvbW11bmljYXRlLlxuICpcbiAqIEBleGFtcGxlXG4gKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICpcbiAqIHNvY2tldC5vbihcImNvbm5lY3RcIiwgKCkgPT4ge1xuICogICBjb25zb2xlLmxvZyhcImNvbm5lY3RlZFwiKTtcbiAqIH0pO1xuICpcbiAqIC8vIHNlbmQgYW4gZXZlbnQgdG8gdGhlIHNlcnZlclxuICogc29ja2V0LmVtaXQoXCJmb29cIiwgXCJiYXJcIik7XG4gKlxuICogc29ja2V0Lm9uKFwiZm9vYmFyXCIsICgpID0+IHtcbiAqICAgLy8gYW4gZXZlbnQgd2FzIHJlY2VpdmVkIGZyb20gdGhlIHNlcnZlclxuICogfSk7XG4gKlxuICogLy8gdXBvbiBkaXNjb25uZWN0aW9uXG4gKiBzb2NrZXQub24oXCJkaXNjb25uZWN0XCIsIChyZWFzb24pID0+IHtcbiAqICAgY29uc29sZS5sb2coYGRpc2Nvbm5lY3RlZCBkdWUgdG8gJHtyZWFzb259YCk7XG4gKiB9KTtcbiAqL1xuZXhwb3J0IGNsYXNzIFNvY2tldCBleHRlbmRzIEVtaXR0ZXIge1xuICAgIC8qKlxuICAgICAqIGBTb2NrZXRgIGNvbnN0cnVjdG9yLlxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGlvLCBuc3AsIG9wdHMpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgdGhlIHNvY2tldCBpcyBjdXJyZW50bHkgY29ubmVjdGVkIHRvIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICAqIGNvbnN0IHNvY2tldCA9IGlvKCk7XG4gICAgICAgICAqXG4gICAgICAgICAqIHNvY2tldC5vbihcImNvbm5lY3RcIiwgKCkgPT4ge1xuICAgICAgICAgKiAgIGNvbnNvbGUubG9nKHNvY2tldC5jb25uZWN0ZWQpOyAvLyB0cnVlXG4gICAgICAgICAqIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiBzb2NrZXQub24oXCJkaXNjb25uZWN0XCIsICgpID0+IHtcbiAgICAgICAgICogICBjb25zb2xlLmxvZyhzb2NrZXQuY29ubmVjdGVkKTsgLy8gZmFsc2VcbiAgICAgICAgICogfSk7XG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgY29ubmVjdGlvbiBzdGF0ZSB3YXMgcmVjb3ZlcmVkIGFmdGVyIGEgdGVtcG9yYXJ5IGRpc2Nvbm5lY3Rpb24uIEluIHRoYXQgY2FzZSwgYW55IG1pc3NlZCBwYWNrZXRzIHdpbGxcbiAgICAgICAgICogYmUgdHJhbnNtaXR0ZWQgYnkgdGhlIHNlcnZlci5cbiAgICAgICAgICovXG4gICAgICAgIHRoaXMucmVjb3ZlcmVkID0gZmFsc2U7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCdWZmZXIgZm9yIHBhY2tldHMgcmVjZWl2ZWQgYmVmb3JlIHRoZSBDT05ORUNUIHBhY2tldFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5yZWNlaXZlQnVmZmVyID0gW107XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCdWZmZXIgZm9yIHBhY2tldHMgdGhhdCB3aWxsIGJlIHNlbnQgb25jZSB0aGUgc29ja2V0IGlzIGNvbm5lY3RlZFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5zZW5kQnVmZmVyID0gW107XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcXVldWUgb2YgcGFja2V0cyB0byBiZSBzZW50IHdpdGggcmV0cnkgaW4gY2FzZSBvZiBmYWlsdXJlLlxuICAgICAgICAgKlxuICAgICAgICAgKiBQYWNrZXRzIGFyZSBzZW50IG9uZSBieSBvbmUsIGVhY2ggd2FpdGluZyBmb3IgdGhlIHNlcnZlciBhY2tub3dsZWRnZW1lbnQsIGluIG9yZGVyIHRvIGd1YXJhbnRlZSB0aGUgZGVsaXZlcnkgb3JkZXIuXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9xdWV1ZSA9IFtdO1xuICAgICAgICAvKipcbiAgICAgICAgICogQSBzZXF1ZW5jZSB0byBnZW5lcmF0ZSB0aGUgSUQgb2YgdGhlIHtAbGluayBRdWV1ZWRQYWNrZXR9LlxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcXVldWVTZXEgPSAwO1xuICAgICAgICB0aGlzLmlkcyA9IDA7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBIG1hcCBjb250YWluaW5nIGFja25vd2xlZGdlbWVudCBoYW5kbGVycy5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGB3aXRoRXJyb3JgIGF0dHJpYnV0ZSBpcyB1c2VkIHRvIGRpZmZlcmVudGlhdGUgaGFuZGxlcnMgdGhhdCBhY2NlcHQgYW4gZXJyb3IgYXMgZmlyc3QgYXJndW1lbnQ6XG4gICAgICAgICAqXG4gICAgICAgICAqIC0gYHNvY2tldC5lbWl0KFwidGVzdFwiLCAoZXJyLCB2YWx1ZSkgPT4geyAuLi4gfSlgIHdpdGggYGFja1RpbWVvdXRgIG9wdGlvblxuICAgICAgICAgKiAtIGBzb2NrZXQudGltZW91dCg1MDAwKS5lbWl0KFwidGVzdFwiLCAoZXJyLCB2YWx1ZSkgPT4geyAuLi4gfSlgXG4gICAgICAgICAqIC0gYGNvbnN0IHZhbHVlID0gYXdhaXQgc29ja2V0LmVtaXRXaXRoQWNrKFwidGVzdFwiKWBcbiAgICAgICAgICpcbiAgICAgICAgICogRnJvbSB0aG9zZSB0aGF0IGRvbid0OlxuICAgICAgICAgKlxuICAgICAgICAgKiAtIGBzb2NrZXQuZW1pdChcInRlc3RcIiwgKHZhbHVlKSA9PiB7IC4uLiB9KTtgXG4gICAgICAgICAqXG4gICAgICAgICAqIEluIHRoZSBmaXJzdCBjYXNlLCB0aGUgaGFuZGxlcnMgd2lsbCBiZSBjYWxsZWQgd2l0aCBhbiBlcnJvciB3aGVuOlxuICAgICAgICAgKlxuICAgICAgICAgKiAtIHRoZSB0aW1lb3V0IGlzIHJlYWNoZWRcbiAgICAgICAgICogLSB0aGUgc29ja2V0IGdldHMgZGlzY29ubmVjdGVkXG4gICAgICAgICAqXG4gICAgICAgICAqIEluIHRoZSBzZWNvbmQgY2FzZSwgdGhlIGhhbmRsZXJzIHdpbGwgYmUgc2ltcGx5IGRpc2NhcmRlZCB1cG9uIGRpc2Nvbm5lY3Rpb24sIHNpbmNlIHRoZSBjbGllbnQgd2lsbCBuZXZlciByZWNlaXZlXG4gICAgICAgICAqIGFuIGFja25vd2xlZGdlbWVudCBmcm9tIHRoZSBzZXJ2ZXIuXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLmFja3MgPSB7fTtcbiAgICAgICAgdGhpcy5mbGFncyA9IHt9O1xuICAgICAgICB0aGlzLmlvID0gaW87XG4gICAgICAgIHRoaXMubnNwID0gbnNwO1xuICAgICAgICBpZiAob3B0cyAmJiBvcHRzLmF1dGgpIHtcbiAgICAgICAgICAgIHRoaXMuYXV0aCA9IG9wdHMuYXV0aDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9vcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgb3B0cyk7XG4gICAgICAgIGlmICh0aGlzLmlvLl9hdXRvQ29ubmVjdClcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXaGV0aGVyIHRoZSBzb2NrZXQgaXMgY3VycmVudGx5IGRpc2Nvbm5lY3RlZFxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICAgICAqXG4gICAgICogc29ja2V0Lm9uKFwiY29ubmVjdFwiLCAoKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhzb2NrZXQuZGlzY29ubmVjdGVkKTsgLy8gZmFsc2VcbiAgICAgKiB9KTtcbiAgICAgKlxuICAgICAqIHNvY2tldC5vbihcImRpc2Nvbm5lY3RcIiwgKCkgPT4ge1xuICAgICAqICAgY29uc29sZS5sb2coc29ja2V0LmRpc2Nvbm5lY3RlZCk7IC8vIHRydWVcbiAgICAgKiB9KTtcbiAgICAgKi9cbiAgICBnZXQgZGlzY29ubmVjdGVkKCkge1xuICAgICAgICByZXR1cm4gIXRoaXMuY29ubmVjdGVkO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTdWJzY3JpYmUgdG8gb3BlbiwgY2xvc2UgYW5kIHBhY2tldCBldmVudHNcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgc3ViRXZlbnRzKCkge1xuICAgICAgICBpZiAodGhpcy5zdWJzKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICBjb25zdCBpbyA9IHRoaXMuaW87XG4gICAgICAgIHRoaXMuc3VicyA9IFtcbiAgICAgICAgICAgIG9uKGlvLCBcIm9wZW5cIiwgdGhpcy5vbm9wZW4uYmluZCh0aGlzKSksXG4gICAgICAgICAgICBvbihpbywgXCJwYWNrZXRcIiwgdGhpcy5vbnBhY2tldC5iaW5kKHRoaXMpKSxcbiAgICAgICAgICAgIG9uKGlvLCBcImVycm9yXCIsIHRoaXMub25lcnJvci5iaW5kKHRoaXMpKSxcbiAgICAgICAgICAgIG9uKGlvLCBcImNsb3NlXCIsIHRoaXMub25jbG9zZS5iaW5kKHRoaXMpKSxcbiAgICAgICAgXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogV2hldGhlciB0aGUgU29ja2V0IHdpbGwgdHJ5IHRvIHJlY29ubmVjdCB3aGVuIGl0cyBNYW5hZ2VyIGNvbm5lY3RzIG9yIHJlY29ubmVjdHMuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IHNvY2tldCA9IGlvKCk7XG4gICAgICpcbiAgICAgKiBjb25zb2xlLmxvZyhzb2NrZXQuYWN0aXZlKTsgLy8gdHJ1ZVxuICAgICAqXG4gICAgICogc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAocmVhc29uKSA9PiB7XG4gICAgICogICBpZiAocmVhc29uID09PSBcImlvIHNlcnZlciBkaXNjb25uZWN0XCIpIHtcbiAgICAgKiAgICAgLy8gdGhlIGRpc2Nvbm5lY3Rpb24gd2FzIGluaXRpYXRlZCBieSB0aGUgc2VydmVyLCB5b3UgbmVlZCB0byBtYW51YWxseSByZWNvbm5lY3RcbiAgICAgKiAgICAgY29uc29sZS5sb2coc29ja2V0LmFjdGl2ZSk7IC8vIGZhbHNlXG4gICAgICogICB9XG4gICAgICogICAvLyBlbHNlIHRoZSBzb2NrZXQgd2lsbCBhdXRvbWF0aWNhbGx5IHRyeSB0byByZWNvbm5lY3RcbiAgICAgKiAgIGNvbnNvbGUubG9nKHNvY2tldC5hY3RpdmUpOyAvLyB0cnVlXG4gICAgICogfSk7XG4gICAgICovXG4gICAgZ2V0IGFjdGl2ZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5zdWJzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBcIk9wZW5zXCIgdGhlIHNvY2tldC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogY29uc3Qgc29ja2V0ID0gaW8oe1xuICAgICAqICAgYXV0b0Nvbm5lY3Q6IGZhbHNlXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBzb2NrZXQuY29ubmVjdCgpO1xuICAgICAqL1xuICAgIGNvbm5lY3QoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbm5lY3RlZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB0aGlzLnN1YkV2ZW50cygpO1xuICAgICAgICBpZiAoIXRoaXMuaW9bXCJfcmVjb25uZWN0aW5nXCJdKVxuICAgICAgICAgICAgdGhpcy5pby5vcGVuKCk7IC8vIGVuc3VyZSBvcGVuXG4gICAgICAgIGlmIChcIm9wZW5cIiA9PT0gdGhpcy5pby5fcmVhZHlTdGF0ZSlcbiAgICAgICAgICAgIHRoaXMub25vcGVuKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlhcyBmb3Ige0BsaW5rIGNvbm5lY3QoKX0uXG4gICAgICovXG4gICAgb3BlbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29ubmVjdCgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kcyBhIGBtZXNzYWdlYCBldmVudC5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIG1pbWljcyB0aGUgV2ViU29ja2V0LnNlbmQoKSBtZXRob2QuXG4gICAgICpcbiAgICAgKiBAc2VlIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0FQSS9XZWJTb2NrZXQvc2VuZFxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQuc2VuZChcImhlbGxvXCIpO1xuICAgICAqXG4gICAgICogLy8gdGhpcyBpcyBlcXVpdmFsZW50IHRvXG4gICAgICogc29ja2V0LmVtaXQoXCJtZXNzYWdlXCIsIFwiaGVsbG9cIik7XG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKi9cbiAgICBzZW5kKC4uLmFyZ3MpIHtcbiAgICAgICAgYXJncy51bnNoaWZ0KFwibWVzc2FnZVwiKTtcbiAgICAgICAgdGhpcy5lbWl0LmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogT3ZlcnJpZGUgYGVtaXRgLlxuICAgICAqIElmIHRoZSBldmVudCBpcyBpbiBgZXZlbnRzYCwgaXQncyBlbWl0dGVkIG5vcm1hbGx5LlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQuZW1pdChcImhlbGxvXCIsIFwid29ybGRcIik7XG4gICAgICpcbiAgICAgKiAvLyBhbGwgc2VyaWFsaXphYmxlIGRhdGFzdHJ1Y3R1cmVzIGFyZSBzdXBwb3J0ZWQgKG5vIG5lZWQgdG8gY2FsbCBKU09OLnN0cmluZ2lmeSlcbiAgICAgKiBzb2NrZXQuZW1pdChcImhlbGxvXCIsIDEsIFwiMlwiLCB7IDM6IFtcIjRcIl0sIDU6IFVpbnQ4QXJyYXkuZnJvbShbNl0pIH0pO1xuICAgICAqXG4gICAgICogLy8gd2l0aCBhbiBhY2tub3dsZWRnZW1lbnQgZnJvbSB0aGUgc2VydmVyXG4gICAgICogc29ja2V0LmVtaXQoXCJoZWxsb1wiLCBcIndvcmxkXCIsICh2YWwpID0+IHtcbiAgICAgKiAgIC8vIC4uLlxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICovXG4gICAgZW1pdChldiwgLi4uYXJncykge1xuICAgICAgICB2YXIgX2EsIF9iLCBfYztcbiAgICAgICAgaWYgKFJFU0VSVkVEX0VWRU5UUy5oYXNPd25Qcm9wZXJ0eShldikpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignXCInICsgZXYudG9TdHJpbmcoKSArICdcIiBpcyBhIHJlc2VydmVkIGV2ZW50IG5hbWUnKTtcbiAgICAgICAgfVxuICAgICAgICBhcmdzLnVuc2hpZnQoZXYpO1xuICAgICAgICBpZiAodGhpcy5fb3B0cy5yZXRyaWVzICYmICF0aGlzLmZsYWdzLmZyb21RdWV1ZSAmJiAhdGhpcy5mbGFncy52b2xhdGlsZSkge1xuICAgICAgICAgICAgdGhpcy5fYWRkVG9RdWV1ZShhcmdzKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IHtcbiAgICAgICAgICAgIHR5cGU6IFBhY2tldFR5cGUuRVZFTlQsXG4gICAgICAgICAgICBkYXRhOiBhcmdzLFxuICAgICAgICB9O1xuICAgICAgICBwYWNrZXQub3B0aW9ucyA9IHt9O1xuICAgICAgICBwYWNrZXQub3B0aW9ucy5jb21wcmVzcyA9IHRoaXMuZmxhZ3MuY29tcHJlc3MgIT09IGZhbHNlO1xuICAgICAgICAvLyBldmVudCBhY2sgY2FsbGJhY2tcbiAgICAgICAgaWYgKFwiZnVuY3Rpb25cIiA9PT0gdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSkge1xuICAgICAgICAgICAgY29uc3QgaWQgPSB0aGlzLmlkcysrO1xuICAgICAgICAgICAgY29uc3QgYWNrID0gYXJncy5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyQWNrQ2FsbGJhY2soaWQsIGFjayk7XG4gICAgICAgICAgICBwYWNrZXQuaWQgPSBpZDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBpc1RyYW5zcG9ydFdyaXRhYmxlID0gKF9iID0gKF9hID0gdGhpcy5pby5lbmdpbmUpID09PSBudWxsIHx8IF9hID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYS50cmFuc3BvcnQpID09PSBudWxsIHx8IF9iID09PSB2b2lkIDAgPyB2b2lkIDAgOiBfYi53cml0YWJsZTtcbiAgICAgICAgY29uc3QgaXNDb25uZWN0ZWQgPSB0aGlzLmNvbm5lY3RlZCAmJiAhKChfYyA9IHRoaXMuaW8uZW5naW5lKSA9PT0gbnVsbCB8fCBfYyA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2MuX2hhc1BpbmdFeHBpcmVkKCkpO1xuICAgICAgICBjb25zdCBkaXNjYXJkUGFja2V0ID0gdGhpcy5mbGFncy52b2xhdGlsZSAmJiAhaXNUcmFuc3BvcnRXcml0YWJsZTtcbiAgICAgICAgaWYgKGRpc2NhcmRQYWNrZXQpIHtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpc0Nvbm5lY3RlZCkge1xuICAgICAgICAgICAgdGhpcy5ub3RpZnlPdXRnb2luZ0xpc3RlbmVycyhwYWNrZXQpO1xuICAgICAgICAgICAgdGhpcy5wYWNrZXQocGFja2V0KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuc2VuZEJ1ZmZlci5wdXNoKHBhY2tldCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5mbGFncyA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVnaXN0ZXJBY2tDYWxsYmFjayhpZCwgYWNrKSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgY29uc3QgdGltZW91dCA9IChfYSA9IHRoaXMuZmxhZ3MudGltZW91dCkgIT09IG51bGwgJiYgX2EgIT09IHZvaWQgMCA/IF9hIDogdGhpcy5fb3B0cy5hY2tUaW1lb3V0O1xuICAgICAgICBpZiAodGltZW91dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLmFja3NbaWRdID0gYWNrO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgY29uc3QgdGltZXIgPSB0aGlzLmlvLnNldFRpbWVvdXRGbigoKSA9PiB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5hY2tzW2lkXTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zZW5kQnVmZmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc2VuZEJ1ZmZlcltpXS5pZCA9PT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZW5kQnVmZmVyLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhY2suY2FsbCh0aGlzLCBuZXcgRXJyb3IoXCJvcGVyYXRpb24gaGFzIHRpbWVkIG91dFwiKSk7XG4gICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICBjb25zdCBmbiA9ICguLi5hcmdzKSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0aGlzLmlvLmNsZWFyVGltZW91dEZuKHRpbWVyKTtcbiAgICAgICAgICAgIGFjay5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICAgICAgfTtcbiAgICAgICAgZm4ud2l0aEVycm9yID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5hY2tzW2lkXSA9IGZuO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbWl0cyBhbiBldmVudCBhbmQgd2FpdHMgZm9yIGFuIGFja25vd2xlZGdlbWVudFxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiAvLyB3aXRob3V0IHRpbWVvdXRcbiAgICAgKiBjb25zdCByZXNwb25zZSA9IGF3YWl0IHNvY2tldC5lbWl0V2l0aEFjayhcImhlbGxvXCIsIFwid29ybGRcIik7XG4gICAgICpcbiAgICAgKiAvLyB3aXRoIGEgc3BlY2lmaWMgdGltZW91dFxuICAgICAqIHRyeSB7XG4gICAgICogICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHNvY2tldC50aW1lb3V0KDEwMDApLmVtaXRXaXRoQWNrKFwiaGVsbG9cIiwgXCJ3b3JsZFwiKTtcbiAgICAgKiB9IGNhdGNoIChlcnIpIHtcbiAgICAgKiAgIC8vIHRoZSBzZXJ2ZXIgZGlkIG5vdCBhY2tub3dsZWRnZSB0aGUgZXZlbnQgaW4gdGhlIGdpdmVuIGRlbGF5XG4gICAgICogfVxuICAgICAqXG4gICAgICogQHJldHVybiBhIFByb21pc2UgdGhhdCB3aWxsIGJlIGZ1bGZpbGxlZCB3aGVuIHRoZSBzZXJ2ZXIgYWNrbm93bGVkZ2VzIHRoZSBldmVudFxuICAgICAqL1xuICAgIGVtaXRXaXRoQWNrKGV2LCAuLi5hcmdzKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmbiA9IChhcmcxLCBhcmcyKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFyZzEgPyByZWplY3QoYXJnMSkgOiByZXNvbHZlKGFyZzIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGZuLndpdGhFcnJvciA9IHRydWU7XG4gICAgICAgICAgICBhcmdzLnB1c2goZm4pO1xuICAgICAgICAgICAgdGhpcy5lbWl0KGV2LCAuLi5hcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZCB0aGUgcGFja2V0IHRvIHRoZSBxdWV1ZS5cbiAgICAgKiBAcGFyYW0gYXJnc1xuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2FkZFRvUXVldWUoYXJncykge1xuICAgICAgICBsZXQgYWNrO1xuICAgICAgICBpZiAodHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICBhY2sgPSBhcmdzLnBvcCgpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHBhY2tldCA9IHtcbiAgICAgICAgICAgIGlkOiB0aGlzLl9xdWV1ZVNlcSsrLFxuICAgICAgICAgICAgdHJ5Q291bnQ6IDAsXG4gICAgICAgICAgICBwZW5kaW5nOiBmYWxzZSxcbiAgICAgICAgICAgIGFyZ3MsXG4gICAgICAgICAgICBmbGFnczogT2JqZWN0LmFzc2lnbih7IGZyb21RdWV1ZTogdHJ1ZSB9LCB0aGlzLmZsYWdzKSxcbiAgICAgICAgfTtcbiAgICAgICAgYXJncy5wdXNoKChlcnIsIC4uLnJlc3BvbnNlQXJncykgPT4ge1xuICAgICAgICAgICAgaWYgKHBhY2tldCAhPT0gdGhpcy5fcXVldWVbMF0pIHtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IGhhc0Vycm9yID0gZXJyICE9PSBudWxsO1xuICAgICAgICAgICAgaWYgKGhhc0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgaWYgKHBhY2tldC50cnlDb3VudCA+IHRoaXMuX29wdHMucmV0cmllcykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9xdWV1ZS5zaGlmdCgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY2soZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgaWYgKGFjaykge1xuICAgICAgICAgICAgICAgICAgICBhY2sobnVsbCwgLi4ucmVzcG9uc2VBcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYWNrZXQucGVuZGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2RyYWluUXVldWUoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuX3F1ZXVlLnB1c2gocGFja2V0KTtcbiAgICAgICAgdGhpcy5fZHJhaW5RdWV1ZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZW5kIHRoZSBmaXJzdCBwYWNrZXQgb2YgdGhlIHF1ZXVlLCBhbmQgd2FpdCBmb3IgYW4gYWNrbm93bGVkZ2VtZW50IGZyb20gdGhlIHNlcnZlci5cbiAgICAgKiBAcGFyYW0gZm9yY2UgLSB3aGV0aGVyIHRvIHJlc2VuZCBhIHBhY2tldCB0aGF0IGhhcyBub3QgYmVlbiBhY2tub3dsZWRnZWQgeWV0XG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kcmFpblF1ZXVlKGZvcmNlID0gZmFsc2UpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNvbm5lY3RlZCB8fCB0aGlzLl9xdWV1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBwYWNrZXQgPSB0aGlzLl9xdWV1ZVswXTtcbiAgICAgICAgaWYgKHBhY2tldC5wZW5kaW5nICYmICFmb3JjZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHBhY2tldC5wZW5kaW5nID0gdHJ1ZTtcbiAgICAgICAgcGFja2V0LnRyeUNvdW50Kys7XG4gICAgICAgIHRoaXMuZmxhZ3MgPSBwYWNrZXQuZmxhZ3M7XG4gICAgICAgIHRoaXMuZW1pdC5hcHBseSh0aGlzLCBwYWNrZXQuYXJncyk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNlbmRzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHBhcmFtIHBhY2tldFxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgcGFja2V0KHBhY2tldCkge1xuICAgICAgICBwYWNrZXQubnNwID0gdGhpcy5uc3A7XG4gICAgICAgIHRoaXMuaW8uX3BhY2tldChwYWNrZXQpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBlbmdpbmUgYG9wZW5gLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbm9wZW4oKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5hdXRoID09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgdGhpcy5hdXRoKChkYXRhKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc2VuZENvbm5lY3RQYWNrZXQoZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3NlbmRDb25uZWN0UGFja2V0KHRoaXMuYXV0aCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU2VuZHMgYSBDT05ORUNUIHBhY2tldCB0byBpbml0aWF0ZSB0aGUgU29ja2V0LklPIHNlc3Npb24uXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZGF0YVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX3NlbmRDb25uZWN0UGFja2V0KGRhdGEpIHtcbiAgICAgICAgdGhpcy5wYWNrZXQoe1xuICAgICAgICAgICAgdHlwZTogUGFja2V0VHlwZS5DT05ORUNULFxuICAgICAgICAgICAgZGF0YTogdGhpcy5fcGlkXG4gICAgICAgICAgICAgICAgPyBPYmplY3QuYXNzaWduKHsgcGlkOiB0aGlzLl9waWQsIG9mZnNldDogdGhpcy5fbGFzdE9mZnNldCB9LCBkYXRhKVxuICAgICAgICAgICAgICAgIDogZGF0YSxcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIGVuZ2luZSBvciBtYW5hZ2VyIGBlcnJvcmAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gZXJyXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmVycm9yKGVycikge1xuICAgICAgICBpZiAoIXRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImNvbm5lY3RfZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBlbmdpbmUgYGNsb3NlYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSByZWFzb25cbiAgICAgKiBAcGFyYW0gZGVzY3JpcHRpb25cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uY2xvc2UocmVhc29uLCBkZXNjcmlwdGlvbikge1xuICAgICAgICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xuICAgICAgICBkZWxldGUgdGhpcy5pZDtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJkaXNjb25uZWN0XCIsIHJlYXNvbiwgZGVzY3JpcHRpb24pO1xuICAgICAgICB0aGlzLl9jbGVhckFja3MoKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2xlYXJzIHRoZSBhY2tub3dsZWRnZW1lbnQgaGFuZGxlcnMgdXBvbiBkaXNjb25uZWN0aW9uLCBzaW5jZSB0aGUgY2xpZW50IHdpbGwgbmV2ZXIgcmVjZWl2ZSBhbiBhY2tub3dsZWRnZW1lbnQgZnJvbVxuICAgICAqIHRoZSBzZXJ2ZXIuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jbGVhckFja3MoKSB7XG4gICAgICAgIE9iamVjdC5rZXlzKHRoaXMuYWNrcykuZm9yRWFjaCgoaWQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlzQnVmZmVyZWQgPSB0aGlzLnNlbmRCdWZmZXIuc29tZSgocGFja2V0KSA9PiBTdHJpbmcocGFja2V0LmlkKSA9PT0gaWQpO1xuICAgICAgICAgICAgaWYgKCFpc0J1ZmZlcmVkKSB7XG4gICAgICAgICAgICAgICAgLy8gbm90ZTogaGFuZGxlcnMgdGhhdCBkbyBub3QgYWNjZXB0IGFuIGVycm9yIGFzIGZpcnN0IGFyZ3VtZW50IGFyZSBpZ25vcmVkIGhlcmVcbiAgICAgICAgICAgICAgICBjb25zdCBhY2sgPSB0aGlzLmFja3NbaWRdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmFja3NbaWRdO1xuICAgICAgICAgICAgICAgIGlmIChhY2sud2l0aEVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjay5jYWxsKHRoaXMsIG5ldyBFcnJvcihcInNvY2tldCBoYXMgYmVlbiBkaXNjb25uZWN0ZWRcIikpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aXRoIHNvY2tldCBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbnBhY2tldChwYWNrZXQpIHtcbiAgICAgICAgY29uc3Qgc2FtZU5hbWVzcGFjZSA9IHBhY2tldC5uc3AgPT09IHRoaXMubnNwO1xuICAgICAgICBpZiAoIXNhbWVOYW1lc3BhY2UpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIHN3aXRjaCAocGFja2V0LnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5DT05ORUNUOlxuICAgICAgICAgICAgICAgIGlmIChwYWNrZXQuZGF0YSAmJiBwYWNrZXQuZGF0YS5zaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbmNvbm5lY3QocGFja2V0LmRhdGEuc2lkLCBwYWNrZXQuZGF0YS5waWQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjb25uZWN0X2Vycm9yXCIsIG5ldyBFcnJvcihcIkl0IHNlZW1zIHlvdSBhcmUgdHJ5aW5nIHRvIHJlYWNoIGEgU29ja2V0LklPIHNlcnZlciBpbiB2Mi54IHdpdGggYSB2My54IGNsaWVudCwgYnV0IHRoZXkgYXJlIG5vdCBjb21wYXRpYmxlIChtb3JlIGluZm9ybWF0aW9uIGhlcmU6IGh0dHBzOi8vc29ja2V0LmlvL2RvY3MvdjMvbWlncmF0aW5nLWZyb20tMi14LXRvLTMtMC8pXCIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuRVZFTlQ6XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQklOQVJZX0VWRU5UOlxuICAgICAgICAgICAgICAgIHRoaXMub25ldmVudChwYWNrZXQpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBQYWNrZXRUeXBlLkFDSzpcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5CSU5BUllfQUNLOlxuICAgICAgICAgICAgICAgIHRoaXMub25hY2socGFja2V0KTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgUGFja2V0VHlwZS5ESVNDT05ORUNUOlxuICAgICAgICAgICAgICAgIHRoaXMub25kaXNjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFBhY2tldFR5cGUuQ09OTkVDVF9FUlJPUjpcbiAgICAgICAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IocGFja2V0LmRhdGEubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIGVyci5kYXRhID0gcGFja2V0LmRhdGEuZGF0YTtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcImNvbm5lY3RfZXJyb3JcIiwgZXJyKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBhIHNlcnZlciBldmVudC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZXZlbnQocGFja2V0KSB7XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBwYWNrZXQuZGF0YSB8fCBbXTtcbiAgICAgICAgaWYgKG51bGwgIT0gcGFja2V0LmlkKSB7XG4gICAgICAgICAgICBhcmdzLnB1c2godGhpcy5hY2socGFja2V0LmlkKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLmVtaXRFdmVudChhcmdzKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMucmVjZWl2ZUJ1ZmZlci5wdXNoKE9iamVjdC5mcmVlemUoYXJncykpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVtaXRFdmVudChhcmdzKSB7XG4gICAgICAgIGlmICh0aGlzLl9hbnlMaXN0ZW5lcnMgJiYgdGhpcy5fYW55TGlzdGVuZXJzLmxlbmd0aCkge1xuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fYW55TGlzdGVuZXJzLnNsaWNlKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN1cGVyLmVtaXQuYXBwbHkodGhpcywgYXJncyk7XG4gICAgICAgIGlmICh0aGlzLl9waWQgJiYgYXJncy5sZW5ndGggJiYgdHlwZW9mIGFyZ3NbYXJncy5sZW5ndGggLSAxXSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5fbGFzdE9mZnNldCA9IGFyZ3NbYXJncy5sZW5ndGggLSAxXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBQcm9kdWNlcyBhbiBhY2sgY2FsbGJhY2sgdG8gZW1pdCB3aXRoIGFuIGV2ZW50LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBhY2soaWQpIHtcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGxldCBzZW50ID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoLi4uYXJncykge1xuICAgICAgICAgICAgLy8gcHJldmVudCBkb3VibGUgY2FsbGJhY2tzXG4gICAgICAgICAgICBpZiAoc2VudClcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBzZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgIHNlbGYucGFja2V0KHtcbiAgICAgICAgICAgICAgICB0eXBlOiBQYWNrZXRUeXBlLkFDSyxcbiAgICAgICAgICAgICAgICBpZDogaWQsXG4gICAgICAgICAgICAgICAgZGF0YTogYXJncyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBhIHNlcnZlciBhY2tub3dsZWRnZW1lbnQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmFjayhwYWNrZXQpIHtcbiAgICAgICAgY29uc3QgYWNrID0gdGhpcy5hY2tzW3BhY2tldC5pZF07XG4gICAgICAgIGlmICh0eXBlb2YgYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBkZWxldGUgdGhpcy5hY2tzW3BhY2tldC5pZF07XG4gICAgICAgIC8vIEB0cy1pZ25vcmUgRklYTUUgYWNrIGlzIGluY29ycmVjdGx5IGluZmVycmVkIGFzICduZXZlcidcbiAgICAgICAgaWYgKGFjay53aXRoRXJyb3IpIHtcbiAgICAgICAgICAgIHBhY2tldC5kYXRhLnVuc2hpZnQobnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBhY2suYXBwbHkodGhpcywgcGFja2V0LmRhdGEpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBzZXJ2ZXIgY29ubmVjdC5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25jb25uZWN0KGlkLCBwaWQpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLnJlY292ZXJlZCA9IHBpZCAmJiB0aGlzLl9waWQgPT09IHBpZDtcbiAgICAgICAgdGhpcy5fcGlkID0gcGlkOyAvLyBkZWZpbmVkIG9ubHkgaWYgY29ubmVjdGlvbiBzdGF0ZSByZWNvdmVyeSBpcyBlbmFibGVkXG4gICAgICAgIHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5lbWl0QnVmZmVyZWQoKTtcbiAgICAgICAgdGhpcy5fZHJhaW5RdWV1ZSh0cnVlKTtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjb25uZWN0XCIpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBFbWl0IGJ1ZmZlcmVkIGV2ZW50cyAocmVjZWl2ZWQgYW5kIGVtaXR0ZWQpLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBlbWl0QnVmZmVyZWQoKSB7XG4gICAgICAgIHRoaXMucmVjZWl2ZUJ1ZmZlci5mb3JFYWNoKChhcmdzKSA9PiB0aGlzLmVtaXRFdmVudChhcmdzKSk7XG4gICAgICAgIHRoaXMucmVjZWl2ZUJ1ZmZlciA9IFtdO1xuICAgICAgICB0aGlzLnNlbmRCdWZmZXIuZm9yRWFjaCgocGFja2V0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLm5vdGlmeU91dGdvaW5nTGlzdGVuZXJzKHBhY2tldCk7XG4gICAgICAgICAgICB0aGlzLnBhY2tldChwYWNrZXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZW5kQnVmZmVyID0gW107XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHNlcnZlciBkaXNjb25uZWN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmRpc2Nvbm5lY3QoKSB7XG4gICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLm9uY2xvc2UoXCJpbyBzZXJ2ZXIgZGlzY29ubmVjdFwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gZm9yY2VkIGNsaWVudC9zZXJ2ZXIgc2lkZSBkaXNjb25uZWN0aW9ucyxcbiAgICAgKiB0aGlzIG1ldGhvZCBlbnN1cmVzIHRoZSBtYW5hZ2VyIHN0b3BzIHRyYWNraW5nIHVzIGFuZFxuICAgICAqIHRoYXQgcmVjb25uZWN0aW9ucyBkb24ndCBnZXQgdHJpZ2dlcmVkIGZvciB0aGlzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBkZXN0cm95KCkge1xuICAgICAgICBpZiAodGhpcy5zdWJzKSB7XG4gICAgICAgICAgICAvLyBjbGVhbiBzdWJzY3JpcHRpb25zIHRvIGF2b2lkIHJlY29ubmVjdGlvbnNcbiAgICAgICAgICAgIHRoaXMuc3Vicy5mb3JFYWNoKChzdWJEZXN0cm95KSA9PiBzdWJEZXN0cm95KCkpO1xuICAgICAgICAgICAgdGhpcy5zdWJzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaW9bXCJfZGVzdHJveVwiXSh0aGlzKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogRGlzY29ubmVjdHMgdGhlIHNvY2tldCBtYW51YWxseS4gSW4gdGhhdCBjYXNlLCB0aGUgc29ja2V0IHdpbGwgbm90IHRyeSB0byByZWNvbm5lY3QuXG4gICAgICpcbiAgICAgKiBJZiB0aGlzIGlzIHRoZSBsYXN0IGFjdGl2ZSBTb2NrZXQgaW5zdGFuY2Ugb2YgdGhlIHtAbGluayBNYW5hZ2VyfSwgdGhlIGxvdy1sZXZlbCBjb25uZWN0aW9uIHdpbGwgYmUgY2xvc2VkLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBjb25zdCBzb2NrZXQgPSBpbygpO1xuICAgICAqXG4gICAgICogc29ja2V0Lm9uKFwiZGlzY29ubmVjdFwiLCAocmVhc29uKSA9PiB7XG4gICAgICogICAvLyBjb25zb2xlLmxvZyhyZWFzb24pOyBwcmludHMgXCJpbyBjbGllbnQgZGlzY29ubmVjdFwiXG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBzb2NrZXQuZGlzY29ubmVjdCgpO1xuICAgICAqXG4gICAgICogQHJldHVybiBzZWxmXG4gICAgICovXG4gICAgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhY2tldCh7IHR5cGU6IFBhY2tldFR5cGUuRElTQ09OTkVDVCB9KTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZW1vdmUgc29ja2V0IGZyb20gcG9vbFxuICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgaWYgKHRoaXMuY29ubmVjdGVkKSB7XG4gICAgICAgICAgICAvLyBmaXJlIGV2ZW50c1xuICAgICAgICAgICAgdGhpcy5vbmNsb3NlKFwiaW8gY2xpZW50IGRpc2Nvbm5lY3RcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFsaWFzIGZvciB7QGxpbmsgZGlzY29ubmVjdCgpfS5cbiAgICAgKlxuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqL1xuICAgIGNsb3NlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNjb25uZWN0KCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGNvbXByZXNzIGZsYWcuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5jb21wcmVzcyhmYWxzZSkuZW1pdChcImhlbGxvXCIpO1xuICAgICAqXG4gICAgICogQHBhcmFtIGNvbXByZXNzIC0gaWYgYHRydWVgLCBjb21wcmVzc2VzIHRoZSBzZW5kaW5nIGRhdGFcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKi9cbiAgICBjb21wcmVzcyhjb21wcmVzcykge1xuICAgICAgICB0aGlzLmZsYWdzLmNvbXByZXNzID0gY29tcHJlc3M7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGEgbW9kaWZpZXIgZm9yIGEgc3Vic2VxdWVudCBldmVudCBlbWlzc2lvbiB0aGF0IHRoZSBldmVudCBtZXNzYWdlIHdpbGwgYmUgZHJvcHBlZCB3aGVuIHRoaXMgc29ja2V0IGlzIG5vdFxuICAgICAqIHJlYWR5IHRvIHNlbmQgbWVzc2FnZXMuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC52b2xhdGlsZS5lbWl0KFwiaGVsbG9cIik7IC8vIHRoZSBzZXJ2ZXIgbWF5IG9yIG1heSBub3QgcmVjZWl2ZSBpdFxuICAgICAqXG4gICAgICogQHJldHVybnMgc2VsZlxuICAgICAqL1xuICAgIGdldCB2b2xhdGlsZSgpIHtcbiAgICAgICAgdGhpcy5mbGFncy52b2xhdGlsZSA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBTZXRzIGEgbW9kaWZpZXIgZm9yIGEgc3Vic2VxdWVudCBldmVudCBlbWlzc2lvbiB0aGF0IHRoZSBjYWxsYmFjayB3aWxsIGJlIGNhbGxlZCB3aXRoIGFuIGVycm9yIHdoZW4gdGhlXG4gICAgICogZ2l2ZW4gbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyBoYXZlIGVsYXBzZWQgd2l0aG91dCBhbiBhY2tub3dsZWRnZW1lbnQgZnJvbSB0aGUgc2VydmVyOlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQudGltZW91dCg1MDAwKS5lbWl0KFwibXktZXZlbnRcIiwgKGVycikgPT4ge1xuICAgICAqICAgaWYgKGVycikge1xuICAgICAqICAgICAvLyB0aGUgc2VydmVyIGRpZCBub3QgYWNrbm93bGVkZ2UgdGhlIGV2ZW50IGluIHRoZSBnaXZlbiBkZWxheVxuICAgICAqICAgfVxuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHJldHVybnMgc2VsZlxuICAgICAqL1xuICAgIHRpbWVvdXQodGltZW91dCkge1xuICAgICAgICB0aGlzLmZsYWdzLnRpbWVvdXQgPSB0aW1lb3V0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLiBUaGUgZXZlbnQgbmFtZSBpcyBwYXNzZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZVxuICAgICAqIGNhbGxiYWNrLlxuICAgICAqXG4gICAgICogQGV4YW1wbGVcbiAgICAgKiBzb2NrZXQub25BbnkoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgZ290ICR7ZXZlbnR9YCk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBvbkFueShsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9hbnlMaXN0ZW5lcnMgPSB0aGlzLl9hbnlMaXN0ZW5lcnMgfHwgW107XG4gICAgICAgIHRoaXMuX2FueUxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC4gVGhlIGV2ZW50IG5hbWUgaXMgcGFzc2VkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGVcbiAgICAgKiBjYWxsYmFjay4gVGhlIGxpc3RlbmVyIGlzIGFkZGVkIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpc3RlbmVycyBhcnJheS5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0LnByZXBlbmRBbnkoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgZ290IGV2ZW50ICR7ZXZlbnR9YCk7XG4gICAgICogfSk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gbGlzdGVuZXJcbiAgICAgKi9cbiAgICBwcmVwZW5kQW55KGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2FueUxpc3RlbmVycyA9IHRoaXMuX2FueUxpc3RlbmVycyB8fCBbXTtcbiAgICAgICAgdGhpcy5fYW55TGlzdGVuZXJzLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IGNhdGNoQWxsTGlzdGVuZXIgPSAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGBnb3QgZXZlbnQgJHtldmVudH1gKTtcbiAgICAgKiB9XG4gICAgICpcbiAgICAgKiBzb2NrZXQub25BbnkoY2F0Y2hBbGxMaXN0ZW5lcik7XG4gICAgICpcbiAgICAgKiAvLyByZW1vdmUgYSBzcGVjaWZpYyBsaXN0ZW5lclxuICAgICAqIHNvY2tldC5vZmZBbnkoY2F0Y2hBbGxMaXN0ZW5lcik7XG4gICAgICpcbiAgICAgKiAvLyBvciByZW1vdmUgYWxsIGxpc3RlbmVyc1xuICAgICAqIHNvY2tldC5vZmZBbnkoKTtcbiAgICAgKlxuICAgICAqIEBwYXJhbSBsaXN0ZW5lclxuICAgICAqL1xuICAgIG9mZkFueShsaXN0ZW5lcikge1xuICAgICAgICBpZiAoIXRoaXMuX2FueUxpc3RlbmVycykge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpc3RlbmVyKSB7XG4gICAgICAgICAgICBjb25zdCBsaXN0ZW5lcnMgPSB0aGlzLl9hbnlMaXN0ZW5lcnM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lciA9PT0gbGlzdGVuZXJzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FueUxpc3RlbmVycyA9IFtdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIGFuIGFycmF5IG9mIGxpc3RlbmVycyB0aGF0IGFyZSBsaXN0ZW5pbmcgZm9yIGFueSBldmVudCB0aGF0IGlzIHNwZWNpZmllZC4gVGhpcyBhcnJheSBjYW4gYmUgbWFuaXB1bGF0ZWQsXG4gICAgICogZS5nLiB0byByZW1vdmUgbGlzdGVuZXJzLlxuICAgICAqL1xuICAgIGxpc3RlbmVyc0FueSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2FueUxpc3RlbmVycyB8fCBbXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWRkcyBhIGxpc3RlbmVyIHRoYXQgd2lsbCBiZSBmaXJlZCB3aGVuIGFueSBldmVudCBpcyBlbWl0dGVkLiBUaGUgZXZlbnQgbmFtZSBpcyBwYXNzZWQgYXMgdGhlIGZpcnN0IGFyZ3VtZW50IHRvIHRoZVxuICAgICAqIGNhbGxiYWNrLlxuICAgICAqXG4gICAgICogTm90ZTogYWNrbm93bGVkZ2VtZW50cyBzZW50IHRvIHRoZSBzZXJ2ZXIgYXJlIG5vdCBpbmNsdWRlZC5cbiAgICAgKlxuICAgICAqIEBleGFtcGxlXG4gICAgICogc29ja2V0Lm9uQW55T3V0Z29pbmcoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgc2VudCBldmVudCAke2V2ZW50fWApO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIGxpc3RlbmVyXG4gICAgICovXG4gICAgb25BbnlPdXRnb2luZyhsaXN0ZW5lcikge1xuICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyA9IHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzIHx8IFtdO1xuICAgICAgICB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBsaXN0ZW5lciB0aGF0IHdpbGwgYmUgZmlyZWQgd2hlbiBhbnkgZXZlbnQgaXMgZW1pdHRlZC4gVGhlIGV2ZW50IG5hbWUgaXMgcGFzc2VkIGFzIHRoZSBmaXJzdCBhcmd1bWVudCB0byB0aGVcbiAgICAgKiBjYWxsYmFjay4gVGhlIGxpc3RlbmVyIGlzIGFkZGVkIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGxpc3RlbmVycyBhcnJheS5cbiAgICAgKlxuICAgICAqIE5vdGU6IGFja25vd2xlZGdlbWVudHMgc2VudCB0byB0aGUgc2VydmVyIGFyZSBub3QgaW5jbHVkZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIHNvY2tldC5wcmVwZW5kQW55T3V0Z29pbmcoKGV2ZW50LCAuLi5hcmdzKSA9PiB7XG4gICAgICogICBjb25zb2xlLmxvZyhgc2VudCBldmVudCAke2V2ZW50fWApO1xuICAgICAqIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIGxpc3RlbmVyXG4gICAgICovXG4gICAgcHJlcGVuZEFueU91dGdvaW5nKGxpc3RlbmVyKSB7XG4gICAgICAgIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzID0gdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMgfHwgW107XG4gICAgICAgIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzLnVuc2hpZnQobGlzdGVuZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgLyoqXG4gICAgICogUmVtb3ZlcyB0aGUgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGZpcmVkIHdoZW4gYW55IGV2ZW50IGlzIGVtaXR0ZWQuXG4gICAgICpcbiAgICAgKiBAZXhhbXBsZVxuICAgICAqIGNvbnN0IGNhdGNoQWxsTGlzdGVuZXIgPSAoZXZlbnQsIC4uLmFyZ3MpID0+IHtcbiAgICAgKiAgIGNvbnNvbGUubG9nKGBzZW50IGV2ZW50ICR7ZXZlbnR9YCk7XG4gICAgICogfVxuICAgICAqXG4gICAgICogc29ja2V0Lm9uQW55T3V0Z29pbmcoY2F0Y2hBbGxMaXN0ZW5lcik7XG4gICAgICpcbiAgICAgKiAvLyByZW1vdmUgYSBzcGVjaWZpYyBsaXN0ZW5lclxuICAgICAqIHNvY2tldC5vZmZBbnlPdXRnb2luZyhjYXRjaEFsbExpc3RlbmVyKTtcbiAgICAgKlxuICAgICAqIC8vIG9yIHJlbW92ZSBhbGwgbGlzdGVuZXJzXG4gICAgICogc29ja2V0Lm9mZkFueU91dGdvaW5nKCk7XG4gICAgICpcbiAgICAgKiBAcGFyYW0gW2xpc3RlbmVyXSAtIHRoZSBjYXRjaC1hbGwgbGlzdGVuZXIgKG9wdGlvbmFsKVxuICAgICAqL1xuICAgIG9mZkFueU91dGdvaW5nKGxpc3RlbmVyKSB7XG4gICAgICAgIGlmICghdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnMpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChsaXN0ZW5lcikge1xuICAgICAgICAgICAgY29uc3QgbGlzdGVuZXJzID0gdGhpcy5fYW55T3V0Z29pbmdMaXN0ZW5lcnM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lciA9PT0gbGlzdGVuZXJzW2ldKSB7XG4gICAgICAgICAgICAgICAgICAgIGxpc3RlbmVycy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzID0gW107XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFJldHVybnMgYW4gYXJyYXkgb2YgbGlzdGVuZXJzIHRoYXQgYXJlIGxpc3RlbmluZyBmb3IgYW55IGV2ZW50IHRoYXQgaXMgc3BlY2lmaWVkLiBUaGlzIGFycmF5IGNhbiBiZSBtYW5pcHVsYXRlZCxcbiAgICAgKiBlLmcuIHRvIHJlbW92ZSBsaXN0ZW5lcnMuXG4gICAgICovXG4gICAgbGlzdGVuZXJzQW55T3V0Z29pbmcoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyB8fCBbXTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogTm90aWZ5IHRoZSBsaXN0ZW5lcnMgZm9yIGVhY2ggcGFja2V0IHNlbnRcbiAgICAgKlxuICAgICAqIEBwYXJhbSBwYWNrZXRcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgbm90aWZ5T3V0Z29pbmdMaXN0ZW5lcnMocGFja2V0KSB7XG4gICAgICAgIGlmICh0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycyAmJiB0aGlzLl9hbnlPdXRnb2luZ0xpc3RlbmVycy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGNvbnN0IGxpc3RlbmVycyA9IHRoaXMuX2FueU91dGdvaW5nTGlzdGVuZXJzLnNsaWNlKCk7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGxpc3RlbmVyIG9mIGxpc3RlbmVycykge1xuICAgICAgICAgICAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIHBhY2tldC5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsIi8qKlxuICogSW5pdGlhbGl6ZSBiYWNrb2ZmIHRpbWVyIHdpdGggYG9wdHNgLlxuICpcbiAqIC0gYG1pbmAgaW5pdGlhbCB0aW1lb3V0IGluIG1pbGxpc2Vjb25kcyBbMTAwXVxuICogLSBgbWF4YCBtYXggdGltZW91dCBbMTAwMDBdXG4gKiAtIGBqaXR0ZXJgIFswXVxuICogLSBgZmFjdG9yYCBbMl1cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0c1xuICogQGFwaSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIEJhY2tvZmYob3B0cykge1xuICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgIHRoaXMubXMgPSBvcHRzLm1pbiB8fCAxMDA7XG4gICAgdGhpcy5tYXggPSBvcHRzLm1heCB8fCAxMDAwMDtcbiAgICB0aGlzLmZhY3RvciA9IG9wdHMuZmFjdG9yIHx8IDI7XG4gICAgdGhpcy5qaXR0ZXIgPSBvcHRzLmppdHRlciA+IDAgJiYgb3B0cy5qaXR0ZXIgPD0gMSA/IG9wdHMuaml0dGVyIDogMDtcbiAgICB0aGlzLmF0dGVtcHRzID0gMDtcbn1cbi8qKlxuICogUmV0dXJuIHRoZSBiYWNrb2ZmIGR1cmF0aW9uLlxuICpcbiAqIEByZXR1cm4ge051bWJlcn1cbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLmR1cmF0aW9uID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBtcyA9IHRoaXMubXMgKiBNYXRoLnBvdyh0aGlzLmZhY3RvciwgdGhpcy5hdHRlbXB0cysrKTtcbiAgICBpZiAodGhpcy5qaXR0ZXIpIHtcbiAgICAgICAgdmFyIHJhbmQgPSBNYXRoLnJhbmRvbSgpO1xuICAgICAgICB2YXIgZGV2aWF0aW9uID0gTWF0aC5mbG9vcihyYW5kICogdGhpcy5qaXR0ZXIgKiBtcyk7XG4gICAgICAgIG1zID0gKE1hdGguZmxvb3IocmFuZCAqIDEwKSAmIDEpID09IDAgPyBtcyAtIGRldmlhdGlvbiA6IG1zICsgZGV2aWF0aW9uO1xuICAgIH1cbiAgICByZXR1cm4gTWF0aC5taW4obXMsIHRoaXMubWF4KSB8IDA7XG59O1xuLyoqXG4gKiBSZXNldCB0aGUgbnVtYmVyIG9mIGF0dGVtcHRzLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuYXR0ZW1wdHMgPSAwO1xufTtcbi8qKlxuICogU2V0IHRoZSBtaW5pbXVtIGR1cmF0aW9uXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqL1xuQmFja29mZi5wcm90b3R5cGUuc2V0TWluID0gZnVuY3Rpb24gKG1pbikge1xuICAgIHRoaXMubXMgPSBtaW47XG59O1xuLyoqXG4gKiBTZXQgdGhlIG1heGltdW0gZHVyYXRpb25cbiAqXG4gKiBAYXBpIHB1YmxpY1xuICovXG5CYWNrb2ZmLnByb3RvdHlwZS5zZXRNYXggPSBmdW5jdGlvbiAobWF4KSB7XG4gICAgdGhpcy5tYXggPSBtYXg7XG59O1xuLyoqXG4gKiBTZXQgdGhlIGppdHRlclxuICpcbiAqIEBhcGkgcHVibGljXG4gKi9cbkJhY2tvZmYucHJvdG90eXBlLnNldEppdHRlciA9IGZ1bmN0aW9uIChqaXR0ZXIpIHtcbiAgICB0aGlzLmppdHRlciA9IGppdHRlcjtcbn07XG4iLCJpbXBvcnQgeyBTb2NrZXQgYXMgRW5naW5lLCBpbnN0YWxsVGltZXJGdW5jdGlvbnMsIG5leHRUaWNrLCB9IGZyb20gXCJlbmdpbmUuaW8tY2xpZW50XCI7XG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tIFwiLi9zb2NrZXQuanNcIjtcbmltcG9ydCAqIGFzIHBhcnNlciBmcm9tIFwic29ja2V0LmlvLXBhcnNlclwiO1xuaW1wb3J0IHsgb24gfSBmcm9tIFwiLi9vbi5qc1wiO1xuaW1wb3J0IHsgQmFja29mZiB9IGZyb20gXCIuL2NvbnRyaWIvYmFja28yLmpzXCI7XG5pbXBvcnQgeyBFbWl0dGVyLCB9IGZyb20gXCJAc29ja2V0LmlvL2NvbXBvbmVudC1lbWl0dGVyXCI7XG5leHBvcnQgY2xhc3MgTWFuYWdlciBleHRlbmRzIEVtaXR0ZXIge1xuICAgIGNvbnN0cnVjdG9yKHVyaSwgb3B0cykge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubnNwcyA9IHt9O1xuICAgICAgICB0aGlzLnN1YnMgPSBbXTtcbiAgICAgICAgaWYgKHVyaSAmJiBcIm9iamVjdFwiID09PSB0eXBlb2YgdXJpKSB7XG4gICAgICAgICAgICBvcHRzID0gdXJpO1xuICAgICAgICAgICAgdXJpID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICAgIG9wdHMgPSBvcHRzIHx8IHt9O1xuICAgICAgICBvcHRzLnBhdGggPSBvcHRzLnBhdGggfHwgXCIvc29ja2V0LmlvXCI7XG4gICAgICAgIHRoaXMub3B0cyA9IG9wdHM7XG4gICAgICAgIGluc3RhbGxUaW1lckZ1bmN0aW9ucyh0aGlzLCBvcHRzKTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb24ob3B0cy5yZWNvbm5lY3Rpb24gIT09IGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25BdHRlbXB0cyhvcHRzLnJlY29ubmVjdGlvbkF0dGVtcHRzIHx8IEluZmluaXR5KTtcbiAgICAgICAgdGhpcy5yZWNvbm5lY3Rpb25EZWxheShvcHRzLnJlY29ubmVjdGlvbkRlbGF5IHx8IDEwMDApO1xuICAgICAgICB0aGlzLnJlY29ubmVjdGlvbkRlbGF5TWF4KG9wdHMucmVjb25uZWN0aW9uRGVsYXlNYXggfHwgNTAwMCk7XG4gICAgICAgIHRoaXMucmFuZG9taXphdGlvbkZhY3RvcigoX2EgPSBvcHRzLnJhbmRvbWl6YXRpb25GYWN0b3IpICE9PSBudWxsICYmIF9hICE9PSB2b2lkIDAgPyBfYSA6IDAuNSk7XG4gICAgICAgIHRoaXMuYmFja29mZiA9IG5ldyBCYWNrb2ZmKHtcbiAgICAgICAgICAgIG1pbjogdGhpcy5yZWNvbm5lY3Rpb25EZWxheSgpLFxuICAgICAgICAgICAgbWF4OiB0aGlzLnJlY29ubmVjdGlvbkRlbGF5TWF4KCksXG4gICAgICAgICAgICBqaXR0ZXI6IHRoaXMucmFuZG9taXphdGlvbkZhY3RvcigpLFxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy50aW1lb3V0KG51bGwgPT0gb3B0cy50aW1lb3V0ID8gMjAwMDAgOiBvcHRzLnRpbWVvdXQpO1xuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJjbG9zZWRcIjtcbiAgICAgICAgdGhpcy51cmkgPSB1cmk7XG4gICAgICAgIGNvbnN0IF9wYXJzZXIgPSBvcHRzLnBhcnNlciB8fCBwYXJzZXI7XG4gICAgICAgIHRoaXMuZW5jb2RlciA9IG5ldyBfcGFyc2VyLkVuY29kZXIoKTtcbiAgICAgICAgdGhpcy5kZWNvZGVyID0gbmV3IF9wYXJzZXIuRGVjb2RlcigpO1xuICAgICAgICB0aGlzLl9hdXRvQ29ubmVjdCA9IG9wdHMuYXV0b0Nvbm5lY3QgIT09IGZhbHNlO1xuICAgICAgICBpZiAodGhpcy5fYXV0b0Nvbm5lY3QpXG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICB9XG4gICAgcmVjb25uZWN0aW9uKHYpIHtcbiAgICAgICAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlY29ubmVjdGlvbjtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uID0gISF2O1xuICAgICAgICBpZiAoIXYpIHtcbiAgICAgICAgICAgIHRoaXMuc2tpcFJlY29ubmVjdCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHJlY29ubmVjdGlvbkF0dGVtcHRzKHYpIHtcbiAgICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWNvbm5lY3Rpb25BdHRlbXB0cztcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uQXR0ZW1wdHMgPSB2O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmVjb25uZWN0aW9uRGVsYXkodikge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGlmICh2ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVjb25uZWN0aW9uRGVsYXk7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbkRlbGF5ID0gdjtcbiAgICAgICAgKF9hID0gdGhpcy5iYWNrb2ZmKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Euc2V0TWluKHYpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmFuZG9taXphdGlvbkZhY3Rvcih2KSB7XG4gICAgICAgIHZhciBfYTtcbiAgICAgICAgaWYgKHYgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yYW5kb21pemF0aW9uRmFjdG9yO1xuICAgICAgICB0aGlzLl9yYW5kb21pemF0aW9uRmFjdG9yID0gdjtcbiAgICAgICAgKF9hID0gdGhpcy5iYWNrb2ZmKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Euc2V0Sml0dGVyKHYpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgcmVjb25uZWN0aW9uRGVsYXlNYXgodikge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIGlmICh2ID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVjb25uZWN0aW9uRGVsYXlNYXg7XG4gICAgICAgIHRoaXMuX3JlY29ubmVjdGlvbkRlbGF5TWF4ID0gdjtcbiAgICAgICAgKF9hID0gdGhpcy5iYWNrb2ZmKSA9PT0gbnVsbCB8fCBfYSA9PT0gdm9pZCAwID8gdm9pZCAwIDogX2Euc2V0TWF4KHYpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG4gICAgdGltZW91dCh2KSB7XG4gICAgICAgIGlmICghYXJndW1lbnRzLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl90aW1lb3V0O1xuICAgICAgICB0aGlzLl90aW1lb3V0ID0gdjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFN0YXJ0cyB0cnlpbmcgdG8gcmVjb25uZWN0IGlmIHJlY29ubmVjdGlvbiBpcyBlbmFibGVkIGFuZCB3ZSBoYXZlIG5vdFxuICAgICAqIHN0YXJ0ZWQgcmVjb25uZWN0aW5nIHlldFxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBtYXliZVJlY29ubmVjdE9uT3BlbigpIHtcbiAgICAgICAgLy8gT25seSB0cnkgdG8gcmVjb25uZWN0IGlmIGl0J3MgdGhlIGZpcnN0IHRpbWUgd2UncmUgY29ubmVjdGluZ1xuICAgICAgICBpZiAoIXRoaXMuX3JlY29ubmVjdGluZyAmJlxuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW9uICYmXG4gICAgICAgICAgICB0aGlzLmJhY2tvZmYuYXR0ZW1wdHMgPT09IDApIHtcbiAgICAgICAgICAgIC8vIGtlZXBzIHJlY29ubmVjdGlvbiBmcm9tIGZpcmluZyB0d2ljZSBmb3IgdGhlIHNhbWUgcmVjb25uZWN0aW9uIGxvb3BcbiAgICAgICAgICAgIHRoaXMucmVjb25uZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgY3VycmVudCB0cmFuc3BvcnQgYHNvY2tldGAuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbiAtIG9wdGlvbmFsLCBjYWxsYmFja1xuICAgICAqIEByZXR1cm4gc2VsZlxuICAgICAqIEBwdWJsaWNcbiAgICAgKi9cbiAgICBvcGVuKGZuKSB7XG4gICAgICAgIGlmICh+dGhpcy5fcmVhZHlTdGF0ZS5pbmRleE9mKFwib3BlblwiKSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB0aGlzLmVuZ2luZSA9IG5ldyBFbmdpbmUodGhpcy51cmksIHRoaXMub3B0cyk7XG4gICAgICAgIGNvbnN0IHNvY2tldCA9IHRoaXMuZW5naW5lO1xuICAgICAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5fcmVhZHlTdGF0ZSA9IFwib3BlbmluZ1wiO1xuICAgICAgICB0aGlzLnNraXBSZWNvbm5lY3QgPSBmYWxzZTtcbiAgICAgICAgLy8gZW1pdCBgb3BlbmBcbiAgICAgICAgY29uc3Qgb3BlblN1YkRlc3Ryb3kgPSBvbihzb2NrZXQsIFwib3BlblwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLm9ub3BlbigpO1xuICAgICAgICAgICAgZm4gJiYgZm4oKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IG9uRXJyb3IgPSAoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmNsZWFudXAoKTtcbiAgICAgICAgICAgIHRoaXMuX3JlYWR5U3RhdGUgPSBcImNsb3NlZFwiO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJlcnJvclwiLCBlcnIpO1xuICAgICAgICAgICAgaWYgKGZuKSB7XG4gICAgICAgICAgICAgICAgZm4oZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIE9ubHkgZG8gdGhpcyBpZiB0aGVyZSBpcyBubyBmbiB0byBoYW5kbGUgdGhlIGVycm9yXG4gICAgICAgICAgICAgICAgdGhpcy5tYXliZVJlY29ubmVjdE9uT3BlbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICAvLyBlbWl0IGBlcnJvcmBcbiAgICAgICAgY29uc3QgZXJyb3JTdWIgPSBvbihzb2NrZXQsIFwiZXJyb3JcIiwgb25FcnJvcik7XG4gICAgICAgIGlmIChmYWxzZSAhPT0gdGhpcy5fdGltZW91dCkge1xuICAgICAgICAgICAgY29uc3QgdGltZW91dCA9IHRoaXMuX3RpbWVvdXQ7XG4gICAgICAgICAgICAvLyBzZXQgdGltZXJcbiAgICAgICAgICAgIGNvbnN0IHRpbWVyID0gdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIG9wZW5TdWJEZXN0cm95KCk7XG4gICAgICAgICAgICAgICAgb25FcnJvcihuZXcgRXJyb3IoXCJ0aW1lb3V0XCIpKTtcbiAgICAgICAgICAgICAgICBzb2NrZXQuY2xvc2UoKTtcbiAgICAgICAgICAgIH0sIHRpbWVvdXQpO1xuICAgICAgICAgICAgaWYgKHRoaXMub3B0cy5hdXRvVW5yZWYpIHtcbiAgICAgICAgICAgICAgICB0aW1lci51bnJlZigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zdWJzLnB1c2goKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xlYXJUaW1lb3V0Rm4odGltZXIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zdWJzLnB1c2gob3BlblN1YkRlc3Ryb3kpO1xuICAgICAgICB0aGlzLnN1YnMucHVzaChlcnJvclN1Yik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBbGlhcyBmb3Igb3BlbigpXG4gICAgICpcbiAgICAgKiBAcmV0dXJuIHNlbGZcbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgY29ubmVjdChmbikge1xuICAgICAgICByZXR1cm4gdGhpcy5vcGVuKGZuKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gdHJhbnNwb3J0IG9wZW4uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9ub3BlbigpIHtcbiAgICAgICAgLy8gY2xlYXIgb2xkIHN1YnNcbiAgICAgICAgdGhpcy5jbGVhbnVwKCk7XG4gICAgICAgIC8vIG1hcmsgYXMgb3BlblxuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJvcGVuXCI7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwib3BlblwiKTtcbiAgICAgICAgLy8gYWRkIG5ldyBzdWJzXG4gICAgICAgIGNvbnN0IHNvY2tldCA9IHRoaXMuZW5naW5lO1xuICAgICAgICB0aGlzLnN1YnMucHVzaChvbihzb2NrZXQsIFwicGluZ1wiLCB0aGlzLm9ucGluZy5iaW5kKHRoaXMpKSwgb24oc29ja2V0LCBcImRhdGFcIiwgdGhpcy5vbmRhdGEuYmluZCh0aGlzKSksIG9uKHNvY2tldCwgXCJlcnJvclwiLCB0aGlzLm9uZXJyb3IuYmluZCh0aGlzKSksIG9uKHNvY2tldCwgXCJjbG9zZVwiLCB0aGlzLm9uY2xvc2UuYmluZCh0aGlzKSksIFxuICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgIG9uKHRoaXMuZGVjb2RlciwgXCJkZWNvZGVkXCIsIHRoaXMub25kZWNvZGVkLmJpbmQodGhpcykpKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHVwb24gYSBwaW5nLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbnBpbmcoKSB7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicGluZ1wiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ2FsbGVkIHdpdGggZGF0YS5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgb25kYXRhKGRhdGEpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHRoaXMuZGVjb2Rlci5hZGQoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRoaXMub25jbG9zZShcInBhcnNlIGVycm9yXCIsIGUpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuIHBhcnNlciBmdWxseSBkZWNvZGVzIGEgcGFja2V0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbmRlY29kZWQocGFja2V0KSB7XG4gICAgICAgIC8vIHRoZSBuZXh0VGljayBjYWxsIHByZXZlbnRzIGFuIGV4Y2VwdGlvbiBpbiBhIHVzZXItcHJvdmlkZWQgZXZlbnQgbGlzdGVuZXIgZnJvbSB0cmlnZ2VyaW5nIGEgZGlzY29ubmVjdGlvbiBkdWUgdG8gYSBcInBhcnNlIGVycm9yXCJcbiAgICAgICAgbmV4dFRpY2soKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJwYWNrZXRcIiwgcGFja2V0KTtcbiAgICAgICAgfSwgdGhpcy5zZXRUaW1lb3V0Rm4pO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBzb2NrZXQgZXJyb3IuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uZXJyb3IoZXJyKSB7XG4gICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwiZXJyb3JcIiwgZXJyKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhIG5ldyBzb2NrZXQgZm9yIHRoZSBnaXZlbiBgbnNwYC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge1NvY2tldH1cbiAgICAgKiBAcHVibGljXG4gICAgICovXG4gICAgc29ja2V0KG5zcCwgb3B0cykge1xuICAgICAgICBsZXQgc29ja2V0ID0gdGhpcy5uc3BzW25zcF07XG4gICAgICAgIGlmICghc29ja2V0KSB7XG4gICAgICAgICAgICBzb2NrZXQgPSBuZXcgU29ja2V0KHRoaXMsIG5zcCwgb3B0cyk7XG4gICAgICAgICAgICB0aGlzLm5zcHNbbnNwXSA9IHNvY2tldDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLl9hdXRvQ29ubmVjdCAmJiAhc29ja2V0LmFjdGl2ZSkge1xuICAgICAgICAgICAgc29ja2V0LmNvbm5lY3QoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gc29ja2V0O1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDYWxsZWQgdXBvbiBhIHNvY2tldCBjbG9zZS5cbiAgICAgKlxuICAgICAqIEBwYXJhbSBzb2NrZXRcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9kZXN0cm95KHNvY2tldCkge1xuICAgICAgICBjb25zdCBuc3BzID0gT2JqZWN0LmtleXModGhpcy5uc3BzKTtcbiAgICAgICAgZm9yIChjb25zdCBuc3Agb2YgbnNwcykge1xuICAgICAgICAgICAgY29uc3Qgc29ja2V0ID0gdGhpcy5uc3BzW25zcF07XG4gICAgICAgICAgICBpZiAoc29ja2V0LmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9jbG9zZSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBXcml0ZXMgYSBwYWNrZXQuXG4gICAgICpcbiAgICAgKiBAcGFyYW0gcGFja2V0XG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcGFja2V0KHBhY2tldCkge1xuICAgICAgICBjb25zdCBlbmNvZGVkUGFja2V0cyA9IHRoaXMuZW5jb2Rlci5lbmNvZGUocGFja2V0KTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlbmNvZGVkUGFja2V0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5lbmdpbmUud3JpdGUoZW5jb2RlZFBhY2tldHNbaV0sIHBhY2tldC5vcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbGVhbiB1cCB0cmFuc3BvcnQgc3Vic2NyaXB0aW9ucyBhbmQgcGFja2V0IGJ1ZmZlci5cbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgY2xlYW51cCgpIHtcbiAgICAgICAgdGhpcy5zdWJzLmZvckVhY2goKHN1YkRlc3Ryb3kpID0+IHN1YkRlc3Ryb3koKSk7XG4gICAgICAgIHRoaXMuc3Vicy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmRlY29kZXIuZGVzdHJveSgpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBDbG9zZSB0aGUgY3VycmVudCBzb2NrZXQuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jbG9zZSgpIHtcbiAgICAgICAgdGhpcy5za2lwUmVjb25uZWN0ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMub25jbG9zZShcImZvcmNlZCBjbG9zZVwiKTtcbiAgICB9XG4gICAgLyoqXG4gICAgICogQWxpYXMgZm9yIGNsb3NlKClcbiAgICAgKlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgZGlzY29ubmVjdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2Nsb3NlKCk7XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB3aGVuOlxuICAgICAqXG4gICAgICogLSB0aGUgbG93LWxldmVsIGVuZ2luZSBpcyBjbG9zZWRcbiAgICAgKiAtIHRoZSBwYXJzZXIgZW5jb3VudGVyZWQgYSBiYWRseSBmb3JtYXR0ZWQgcGFja2V0XG4gICAgICogLSBhbGwgc29ja2V0cyBhcmUgZGlzY29ubmVjdGVkXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIG9uY2xvc2UocmVhc29uLCBkZXNjcmlwdGlvbikge1xuICAgICAgICB2YXIgX2E7XG4gICAgICAgIHRoaXMuY2xlYW51cCgpO1xuICAgICAgICAoX2EgPSB0aGlzLmVuZ2luZSkgPT09IG51bGwgfHwgX2EgPT09IHZvaWQgMCA/IHZvaWQgMCA6IF9hLmNsb3NlKCk7XG4gICAgICAgIHRoaXMuYmFja29mZi5yZXNldCgpO1xuICAgICAgICB0aGlzLl9yZWFkeVN0YXRlID0gXCJjbG9zZWRcIjtcbiAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJjbG9zZVwiLCByZWFzb24sIGRlc2NyaXB0aW9uKTtcbiAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGlvbiAmJiAhdGhpcy5za2lwUmVjb25uZWN0KSB7XG4gICAgICAgICAgICB0aGlzLnJlY29ubmVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIEF0dGVtcHQgYSByZWNvbm5lY3Rpb24uXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIHJlY29ubmVjdCgpIHtcbiAgICAgICAgaWYgKHRoaXMuX3JlY29ubmVjdGluZyB8fCB0aGlzLnNraXBSZWNvbm5lY3QpXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICh0aGlzLmJhY2tvZmYuYXR0ZW1wdHMgPj0gdGhpcy5fcmVjb25uZWN0aW9uQXR0ZW1wdHMpIHtcbiAgICAgICAgICAgIHRoaXMuYmFja29mZi5yZXNldCgpO1xuICAgICAgICAgICAgdGhpcy5lbWl0UmVzZXJ2ZWQoXCJyZWNvbm5lY3RfZmFpbGVkXCIpO1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkZWxheSA9IHRoaXMuYmFja29mZi5kdXJhdGlvbigpO1xuICAgICAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVyID0gdGhpcy5zZXRUaW1lb3V0Rm4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLnNraXBSZWNvbm5lY3QpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInJlY29ubmVjdF9hdHRlbXB0XCIsIHNlbGYuYmFja29mZi5hdHRlbXB0cyk7XG4gICAgICAgICAgICAgICAgLy8gY2hlY2sgYWdhaW4gZm9yIHRoZSBjYXNlIHNvY2tldCBjbG9zZWQgaW4gYWJvdmUgZXZlbnRzXG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuc2tpcFJlY29ubmVjdClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIHNlbGYub3BlbigoZXJyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3JlY29ubmVjdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZWNvbm5lY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZW1pdFJlc2VydmVkKFwicmVjb25uZWN0X2Vycm9yXCIsIGVycik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLm9ucmVjb25uZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sIGRlbGF5KTtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuYXV0b1VucmVmKSB7XG4gICAgICAgICAgICAgICAgdGltZXIudW5yZWYoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc3Vicy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsZWFyVGltZW91dEZuKHRpbWVyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIENhbGxlZCB1cG9uIHN1Y2Nlc3NmdWwgcmVjb25uZWN0LlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBvbnJlY29ubmVjdCgpIHtcbiAgICAgICAgY29uc3QgYXR0ZW1wdCA9IHRoaXMuYmFja29mZi5hdHRlbXB0cztcbiAgICAgICAgdGhpcy5fcmVjb25uZWN0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYmFja29mZi5yZXNldCgpO1xuICAgICAgICB0aGlzLmVtaXRSZXNlcnZlZChcInJlY29ubmVjdFwiLCBhdHRlbXB0KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyB1cmwgfSBmcm9tIFwiLi91cmwuanNcIjtcbmltcG9ydCB7IE1hbmFnZXIgfSBmcm9tIFwiLi9tYW5hZ2VyLmpzXCI7XG5pbXBvcnQgeyBTb2NrZXQgfSBmcm9tIFwiLi9zb2NrZXQuanNcIjtcbi8qKlxuICogTWFuYWdlcnMgY2FjaGUuXG4gKi9cbmNvbnN0IGNhY2hlID0ge307XG5mdW5jdGlvbiBsb29rdXAodXJpLCBvcHRzKSB7XG4gICAgaWYgKHR5cGVvZiB1cmkgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgb3B0cyA9IHVyaTtcbiAgICAgICAgdXJpID0gdW5kZWZpbmVkO1xuICAgIH1cbiAgICBvcHRzID0gb3B0cyB8fCB7fTtcbiAgICBjb25zdCBwYXJzZWQgPSB1cmwodXJpLCBvcHRzLnBhdGggfHwgXCIvc29ja2V0LmlvXCIpO1xuICAgIGNvbnN0IHNvdXJjZSA9IHBhcnNlZC5zb3VyY2U7XG4gICAgY29uc3QgaWQgPSBwYXJzZWQuaWQ7XG4gICAgY29uc3QgcGF0aCA9IHBhcnNlZC5wYXRoO1xuICAgIGNvbnN0IHNhbWVOYW1lc3BhY2UgPSBjYWNoZVtpZF0gJiYgcGF0aCBpbiBjYWNoZVtpZF1bXCJuc3BzXCJdO1xuICAgIGNvbnN0IG5ld0Nvbm5lY3Rpb24gPSBvcHRzLmZvcmNlTmV3IHx8XG4gICAgICAgIG9wdHNbXCJmb3JjZSBuZXcgY29ubmVjdGlvblwiXSB8fFxuICAgICAgICBmYWxzZSA9PT0gb3B0cy5tdWx0aXBsZXggfHxcbiAgICAgICAgc2FtZU5hbWVzcGFjZTtcbiAgICBsZXQgaW87XG4gICAgaWYgKG5ld0Nvbm5lY3Rpb24pIHtcbiAgICAgICAgaW8gPSBuZXcgTWFuYWdlcihzb3VyY2UsIG9wdHMpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKCFjYWNoZVtpZF0pIHtcbiAgICAgICAgICAgIGNhY2hlW2lkXSA9IG5ldyBNYW5hZ2VyKHNvdXJjZSwgb3B0cyk7XG4gICAgICAgIH1cbiAgICAgICAgaW8gPSBjYWNoZVtpZF07XG4gICAgfVxuICAgIGlmIChwYXJzZWQucXVlcnkgJiYgIW9wdHMucXVlcnkpIHtcbiAgICAgICAgb3B0cy5xdWVyeSA9IHBhcnNlZC5xdWVyeUtleTtcbiAgICB9XG4gICAgcmV0dXJuIGlvLnNvY2tldChwYXJzZWQucGF0aCwgb3B0cyk7XG59XG4vLyBzbyB0aGF0IFwibG9va3VwXCIgY2FuIGJlIHVzZWQgYm90aCBhcyBhIGZ1bmN0aW9uIChlLmcuIGBpbyguLi4pYCkgYW5kIGFzIGFcbi8vIG5hbWVzcGFjZSAoZS5nLiBgaW8uY29ubmVjdCguLi4pYCksIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5XG5PYmplY3QuYXNzaWduKGxvb2t1cCwge1xuICAgIE1hbmFnZXIsXG4gICAgU29ja2V0LFxuICAgIGlvOiBsb29rdXAsXG4gICAgY29ubmVjdDogbG9va3VwLFxufSk7XG4vKipcbiAqIFByb3RvY29sIHZlcnNpb24uXG4gKlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgeyBwcm90b2NvbCB9IGZyb20gXCJzb2NrZXQuaW8tcGFyc2VyXCI7XG4vKipcbiAqIEV4cG9zZSBjb25zdHJ1Y3RvcnMgZm9yIHN0YW5kYWxvbmUgYnVpbGQuXG4gKlxuICogQHB1YmxpY1xuICovXG5leHBvcnQgeyBNYW5hZ2VyLCBTb2NrZXQsIGxvb2t1cCBhcyBpbywgbG9va3VwIGFzIGNvbm5lY3QsIGxvb2t1cCBhcyBkZWZhdWx0LCB9O1xuZXhwb3J0IHsgRmV0Y2gsIE5vZGVYSFIsIFhIUiwgTm9kZVdlYlNvY2tldCwgV2ViU29ja2V0LCBXZWJUcmFuc3BvcnQsIH0gZnJvbSBcImVuZ2luZS5pby1jbGllbnRcIjtcbiIsImltcG9ydCBSZWFjdCwgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VSZWYgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBCb3gsIFRleHQsIEJ1dHRvbiwgVGV4dEFyZWEsIExhYmVsLCBJY29uLCB1c2VOb3RpY2UgfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcbmltcG9ydCB7IEFwaUNsaWVudCB9IGZyb20gJ2FkbWluanMnO1xuaW1wb3J0IHsgaW8gfSBmcm9tICdzb2NrZXQuaW8tY2xpZW50JztcblxuY29uc3QgU3VwcG9ydERhc2hib2FyZCA9ICgpID0+IHtcbiAgICBjb25zdCBbY29udmVyc2F0aW9ucywgc2V0Q29udmVyc2F0aW9uc10gPSB1c2VTdGF0ZSh7fSk7IC8vIHsgdXNlcklkOiB7IG1lc3NhZ2VzOiBbXSwgY3VzdG9tZXJOYW1lOiAnJywgY3VzdG9tZXJQaG9uZTogJycgfSB9XG4gICAgY29uc3QgW3NlbGVjdGVkVXNlcklkLCBzZXRTZWxlY3RlZFVzZXJJZF0gPSB1c2VTdGF0ZShudWxsKTtcbiAgICBjb25zdCBbcmVwbHlUZXh0LCBzZXRSZXBseVRleHRdID0gdXNlU3RhdGUoJycpO1xuICAgIGNvbnN0IFtzb2NrZXQsIHNldFNvY2tldF0gPSB1c2VTdGF0ZShudWxsKTtcbiAgICBjb25zdCBsYXN0TWVzc2FnZVJlZiA9IHVzZVJlZihudWxsKTtcbiAgICBjb25zdCBhdWRpb1JlZiA9IHVzZVJlZihuZXcgQXVkaW8oJ2h0dHBzOi8vYXNzZXRzLm1peGtpdC5jby9hY3RpdmVfc3RvcmFnZS9zZngvMjM1OC8yMzU4LXByZXZpZXcubXAzJykpO1xuICAgIGNvbnN0IGFwaSA9IG5ldyBBcGlDbGllbnQoKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld1NvY2tldCA9IGlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4sIHsgdHJhbnNwb3J0czogWyd3ZWJzb2NrZXQnXSB9KTtcbiAgICAgICAgc2V0U29ja2V0KG5ld1NvY2tldCk7XG5cbiAgICAgICAgbmV3U29ja2V0LmVtaXQoJ2pvaW5TdXBwb3J0JywgJ2FkbWluJyk7XG5cbiAgICAgICAgbmV3U29ja2V0Lm9uKCdhZG1pbk5ld01lc3NhZ2UnLCAoZGF0YSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeyB1c2VySWQsIG1lc3NhZ2UsIGN1c3RvbWVyTmFtZSwgY3VzdG9tZXJQaG9uZSB9ID0gZGF0YTtcblxuICAgICAgICAgICAgLy8gUGxheSBzb3VuZCBpZiBtZXNzYWdlIGlzIGZyb20gYSBjdXN0b21lclxuICAgICAgICAgICAgaWYgKG1lc3NhZ2Uuc2VuZGVyID09PSAnY3VzdG9tZXInKSB7XG4gICAgICAgICAgICAgICAgYXVkaW9SZWYuY3VycmVudC5wbGF5KCkuY2F0Y2goZSA9PiBjb25zb2xlLmxvZygnQXVkaW8gcGxheSBmYWlsZWQ6JywgZSkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZXRDb252ZXJzYXRpb25zKHByZXYgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4aXN0aW5nID0gcHJldlt1c2VySWRdIHx8IHsgbWVzc2FnZXM6IFtdLCBjdXN0b21lck5hbWU6IGN1c3RvbWVyTmFtZSB8fCAnTmV3IFVzZXInLCBjdXN0b21lclBob25lOiBjdXN0b21lclBob25lIHx8ICcnIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgLi4ucHJldixcbiAgICAgICAgICAgICAgICAgICAgW3VzZXJJZF06IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC4uLmV4aXN0aW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tZXJOYW1lOiBjdXN0b21lck5hbWUgfHwgZXhpc3RpbmcuY3VzdG9tZXJOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tZXJQaG9uZTogY3VzdG9tZXJQaG9uZSB8fCBleGlzdGluZy5jdXN0b21lclBob25lLFxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZXM6IFsuLi5leGlzdGluZy5tZXNzYWdlcywgbWVzc2FnZV1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuICgpID0+IG5ld1NvY2tldC5kaXNjb25uZWN0KCk7XG4gICAgfSwgW10pO1xuXG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgaWYgKGxhc3RNZXNzYWdlUmVmLmN1cnJlbnQpIHtcbiAgICAgICAgICAgIGxhc3RNZXNzYWdlUmVmLmN1cnJlbnQuc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogJ3Ntb290aCcgfSk7XG4gICAgICAgIH1cbiAgICB9LCBbc2VsZWN0ZWRVc2VySWQsIGNvbnZlcnNhdGlvbnNdKTtcblxuICAgIGNvbnN0IGhhbmRsZVNlbmQgPSAoKSA9PiB7XG4gICAgICAgIGlmICghcmVwbHlUZXh0LnRyaW0oKSB8fCAhc2VsZWN0ZWRVc2VySWQgfHwgIXNvY2tldCkgcmV0dXJuO1xuXG4gICAgICAgIHNvY2tldC5lbWl0KCdzdXBwb3J0Q2hhdE1lc3NhZ2UnLCB7XG4gICAgICAgICAgICB1c2VySWQ6IHNlbGVjdGVkVXNlcklkLFxuICAgICAgICAgICAgc2VuZGVyOiAnc3VwcG9ydCcsXG4gICAgICAgICAgICBtZXNzYWdlOiByZXBseVRleHRcbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2V0UmVwbHlUZXh0KCcnKTtcbiAgICB9O1xuXG4gICAgY29uc3QgYWN0aXZlVXNlcnMgPSBPYmplY3Qua2V5cyhjb252ZXJzYXRpb25zKTtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxCb3ggdmFyaWFudD1cIndoaXRlXCIgZGlzcGxheT1cImZsZXhcIiBmbGV4RGlyZWN0aW9uPVwicm93XCIgaGVpZ2h0PVwiMTAwdmhcIj5cbiAgICAgICAgICAgIHsvKiBTaWRlYmFyIC0gQWN0aXZlIENvbnZlcnNhdGlvbnMgKi99XG4gICAgICAgICAgICA8Qm94IHdpZHRoPVwiMzAwcHhcIiBib3JkZXJSaWdodD1cIjFweCBzb2xpZCAjZWVlXCIgb3ZlcmZsb3dZPVwiYXV0b1wiIGJhY2tncm91bmRDb2xvcj1cImdyZXkyMFwiPlxuICAgICAgICAgICAgICAgIDxCb3ggcGFkZGluZz1cInhsXCIgYm9yZGVyQm90dG9tPVwiMXB4IHNvbGlkICNlZWVcIj5cbiAgICAgICAgICAgICAgICAgICAgPFRleHQgZm9udFdlaWdodD1cImJvbGRcIiBmb250U2l6ZT1cImxnXCI+QWN0aXZlIENoYXRzPC9UZXh0PlxuICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICAgIHthY3RpdmVVc2Vycy5sZW5ndGggPT09IDAgPyAoXG4gICAgICAgICAgICAgICAgICAgIDxCb3ggcGFkZGluZz1cInhsXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cImdyZXk2MFwiPk5vIGFjdGl2ZSBjaGF0cy4uLjwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlVXNlcnMubWFwKHVpZCA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICA8Qm94XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5PXt1aWR9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZz1cImxcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFNlbGVjdGVkVXNlcklkKHVpZCl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3Vyc29yPVwicG9pbnRlclwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yPXtzZWxlY3RlZFVzZXJJZCA9PT0gdWlkID8gJ3doaXRlJyA6ICd0cmFuc3BhcmVudCd9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyQm90dG9tPVwiMXB4IHNvbGlkICNlZWVcIlxuICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCb3ggZGlzcGxheT1cImZsZXhcIiBmbGV4RGlyZWN0aW9uPVwicm93XCIgYWxpZ25JdGVtcz1cImNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8SWNvbiBpY29uPVwiVXNlclwiIHNpemU9ezE2fSBtYXJnaW5SaWdodD1cInNcIiBjb2xvcj1cInByaW1hcnkxMDBcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGV4dCBmb250V2VpZ2h0PVwiYm9sZFwiPntjb252ZXJzYXRpb25zW3VpZF0uY3VzdG9tZXJOYW1lfTwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGV4dCBmb250U2l6ZT1cInhzXCIgY29sb3I9XCJncmV5NDBcIiBtYXJnaW5Ub3A9XCJ4c1wiPntjb252ZXJzYXRpb25zW3VpZF0uY3VzdG9tZXJQaG9uZX08L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRleHQgZm9udFNpemU9XCJzbVwiIGNvbG9yPVwiZ3JleTYwXCIgbWFyZ2luVG9wPVwic1wiIG51bWJlck9mTGluZXM9ezF9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29udmVyc2F0aW9uc1t1aWRdLm1lc3NhZ2VzLnNsaWNlKC0xKVswXT8ubWVzc2FnZX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICAgICAgKSlcbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAgICAgIHsvKiBNYWluIENoYXQgQXJlYSAqL31cbiAgICAgICAgICAgIDxCb3ggZmxleD17MX0gZGlzcGxheT1cImZsZXhcIiBmbGV4RGlyZWN0aW9uPVwiY29sdW1uXCIgYmFja2dyb3VuZENvbG9yPVwid2hpdGVcIj5cbiAgICAgICAgICAgICAgICB7c2VsZWN0ZWRVc2VySWQgPyAoXG4gICAgICAgICAgICAgICAgICAgIDw+XG4gICAgICAgICAgICAgICAgICAgICAgICA8Qm94IHBhZGRpbmc9XCJ4bFwiIGJvcmRlckJvdHRvbT1cIjFweCBzb2xpZCAjZWVlXCIgZGlzcGxheT1cImZsZXhcIiBqdXN0aWZ5Q29udGVudD1cInNwYWNlLWJldHdlZW5cIiBhbGlnbkl0ZW1zPVwiY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJveD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRleHQgZm9udFdlaWdodD1cImJvbGRcIiBmb250U2l6ZT1cImxnXCI+e2NvbnZlcnNhdGlvbnNbc2VsZWN0ZWRVc2VySWRdLmN1c3RvbWVyTmFtZX08L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IGZvbnRTaXplPVwieHNcIiBjb2xvcj1cImdyZXk2MFwiPntjb252ZXJzYXRpb25zW3NlbGVjdGVkVXNlcklkXS5jdXN0b21lclBob25lfTwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Qm94IGRpc3BsYXk9XCJmbGV4XCIgYWxpZ25JdGVtcz1cImNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Qm94IHdpZHRoPVwiOHB4XCIgaGVpZ2h0PVwiOHB4XCIgYm9yZGVyUmFkaXVzPVwiNHB4XCIgYmFja2dyb3VuZENvbG9yPVwiZ3JlZW5cIiBtYXJnaW5SaWdodD1cInNcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGV4dCBmb250U2l6ZT1cInhzXCIgY29sb3I9XCJncmVlblwiPkNvbm5lY3RlZDwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQm94PlxuXG4gICAgICAgICAgICAgICAgICAgICAgICA8Qm94IGZsZXg9ezF9IHBhZGRpbmc9XCJ4bFwiIG92ZXJmbG93WT1cImF1dG9cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29udmVyc2F0aW9uc1tzZWxlY3RlZFVzZXJJZF0ubWVzc2FnZXMubWFwKChtc2csIGlkeCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpc01lID0gbXNnLnNlbmRlciA9PT0gJ3N1cHBvcnQnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJveFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleT17aWR4fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hcmdpblZlcnRpY2FsPVwic1wiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheT1cImZsZXhcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsZXhEaXJlY3Rpb249XCJjb2x1bW5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsaWduSXRlbXM9e2lzTWUgPyAnZmxleC1lbmQnIDogJ2ZsZXgtc3RhcnQnfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCb3hcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZz1cIm1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I9e2lzTWUgPyAncHJpbWFyeTEwMCcgOiAnZ3JleTIwJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I9e2lzTWUgPyAnd2hpdGUnIDogJ2JsYWNrJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzPVwiZGVmYXVsdFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1heFdpZHRoPVwiNzAlXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0Pnttc2cubWVzc2FnZX08L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRleHQgZm9udFNpemU9XCJ4c1wiIGNvbG9yPVwiZ3JleTYwXCIgbWFyZ2luVG9wPVwieHNcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge25ldyBEYXRlKG1zZy5jcmVhdGVkQXQpLnRvTG9jYWxlVGltZVN0cmluZygpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiByZWY9e2xhc3RNZXNzYWdlUmVmfSAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxCb3ggcGFkZGluZz1cInhsXCIgYm9yZGVyVG9wPVwiMXB4IHNvbGlkICNlZWVcIiBkaXNwbGF5PVwiZmxleFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0QXJlYVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGV4PXsxfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZT17cmVwbHlUZXh0fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17ZSA9PiBzZXRSZXBseVRleHQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cIlR5cGUgV2hhdHNBcHAtc3R5bGUgcmVwbHkuLi5cIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbktleURvd249e2UgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmICFlLnNoaWZ0S2V5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZVNlbmQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gbWFyZ2luTGVmdD1cIm1cIiB2YXJpYW50PVwicHJpbWFyeVwiIG9uQ2xpY2s9e2hhbmRsZVNlbmR9PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8SWNvbiBpY29uPVwiU2VuZFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICAgICAgPC8+XG4gICAgICAgICAgICAgICAgKSA6IChcbiAgICAgICAgICAgICAgICAgICAgPEJveCBmbGV4PXsxfSBkaXNwbGF5PVwiZmxleFwiIGp1c3RpZnlDb250ZW50PVwiY2VudGVyXCIgYWxpZ25JdGVtcz1cImNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPEJveCB0ZXh0QWxpZ249XCJjZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8SWNvbiBpY29uPVwiTWVzc2FnZVNxdWFyZVwiIHNpemU9ezQ4fSBjb2xvcj1cImdyZXk0MFwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRleHQgbWFyZ2luVG9wPVwibVwiIGNvbG9yPVwiZ3JleTYwXCI+U2VsZWN0IGEgY29udmVyc2F0aW9uIHRvIHN0YXJ0IGNoYXR0aW5nPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L0JveD5cbiAgICAgICAgPC9Cb3g+XG4gICAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IFN1cHBvcnREYXNoYm9hcmQ7XG4iLCJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBCb3gsIEJ1dHRvbiwgRm9ybUdyb3VwLCBJbnB1dCwgTGFiZWwsIFRleHQsIFRleHRBcmVhLCBNZXNzYWdlQm94IH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSc7XG5pbXBvcnQgeyBBcGlDbGllbnQgfSBmcm9tICdhZG1pbmpzJztcblxuY29uc3QgU2VuZE5vdGlmaWNhdGlvbiA9IChwcm9wcykgPT4ge1xuICAgIGNvbnN0IHsgcmVjb3JkLCByZXNvdXJjZSwgYWN0aW9uIH0gPSBwcm9wcztcbiAgICBjb25zdCBbdGl0bGUsIHNldFRpdGxlXSA9IHVzZVN0YXRlKCcnKTtcbiAgICBjb25zdCBbYm9keSwgc2V0Qm9keV0gPSB1c2VTdGF0ZSgnJyk7XG4gICAgY29uc3QgW3B1c2hUb0RyaXZlcnMsIHNldFB1c2hUb0RyaXZlcnNdID0gdXNlU3RhdGUoZmFsc2UpO1xuICAgIGNvbnN0IFtsb2FkaW5nLCBzZXRMb2FkaW5nXSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgICBjb25zdCBbc3VjY2Vzc01lc3NhZ2UsIHNldFN1Y2Nlc3NNZXNzYWdlXSA9IHVzZVN0YXRlKCcnKTtcbiAgICBjb25zdCBbZXJyb3JNZXNzYWdlLCBzZXRFcnJvck1lc3NhZ2VdID0gdXNlU3RhdGUoJycpO1xuICAgIGNvbnN0IGFwaSA9IG5ldyBBcGlDbGllbnQoKTtcblxuICAgIGNvbnN0IGhhbmRsZVNlbmQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIHNldFN1Y2Nlc3NNZXNzYWdlKCcnKTtcbiAgICAgICAgc2V0RXJyb3JNZXNzYWdlKCcnKTtcblxuICAgICAgICBpZiAoIXRpdGxlIHx8ICFib2R5KSB7XG4gICAgICAgICAgICBzZXRFcnJvck1lc3NhZ2UoJ1RpdGxlIGFuZCBCb2R5IGFyZSBhYnNvbHV0ZWx5IHJlcXVpcmVkLiBQbGVhc2UgZmlsbCB0aGVtIG91dC4nKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldExvYWRpbmcodHJ1ZSk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBwYXlsb2FkID0geyB0aXRsZSwgYm9keSwgdXNlclR5cGU6IHB1c2hUb0RyaXZlcnMgPyBcIkRlbGl2ZXJ5UGFydG5lclwiIDogXCJDdXN0b21lclwiIH07XG5cbiAgICAgICAgICAgIC8vIElmIGl0J3MgYSByZWNvcmQgYWN0aW9uIChJbmRpdmlkdWFsKSwgd2UgYWxyZWFkeSBoYXZlIHRoZSB1c2VyIElEIGNvbnRleHQgdmlhIHJlY29yZElkXG4gICAgICAgICAgICAvLyBJZiBpdCdzIGEgcmVzb3VyY2UgYWN0aW9uIChCcm9hZGNhc3QpLCBpdCBicm9hZGNhc3RzIHRvIHRoZSBjaG9zZW4gdXNlclR5cGVcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXBpLnJlc291cmNlQWN0aW9uKHtcbiAgICAgICAgICAgICAgICByZXNvdXJjZUlkOiByZXNvdXJjZS5pZCxcbiAgICAgICAgICAgICAgICBhY3Rpb25OYW1lOiBhY3Rpb24ubmFtZSxcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdwb3N0JyxcbiAgICAgICAgICAgICAgICBkYXRhOiBwYXlsb2FkLFxuICAgICAgICAgICAgICAgIHJlY29yZElkOiByZWNvcmQgPyByZWNvcmQuaWQgOiB1bmRlZmluZWQsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEubm90aWNlICYmIHJlc3BvbnNlLmRhdGEubm90aWNlLnR5cGUgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgIHNldFN1Y2Nlc3NNZXNzYWdlKHJlc3BvbnNlLmRhdGEubm90aWNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZXRTdWNjZXNzTWVzc2FnZSgnTm90aWZpY2F0aW9uIHNlbnQgc3VjY2Vzc2Z1bGx5IScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBSZXNldCBmb3JtIGFmdGVyIHN1Y2Nlc3MgaWYgaXQncyBhIGJyb2FkY2FzdFxuICAgICAgICAgICAgaWYgKCFyZWNvcmQpIHtcbiAgICAgICAgICAgICAgICBzZXRUaXRsZSgnJyk7XG4gICAgICAgICAgICAgICAgc2V0Qm9keSgnJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gc2VuZCBub3RpZmljYXRpb246JywgZXJyb3IpO1xuICAgICAgICAgICAgc2V0RXJyb3JNZXNzYWdlKCdFcnJvciBzZW5kaW5nIG5vdGlmaWNhdGlvbi4gUGxlYXNlIGNoZWNrIHNlcnZlciBsb2dzLicpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPEJveCB2YXJpYW50PVwid2hpdGVcIiBwYWRkaW5nPVwieHhsXCIgc3R5bGU9e3sgbWF4V2lkdGg6IDYwMCwgbWFyZ2luOiAnMCBhdXRvJywgYm9yZGVyUmFkaXVzOiA4LCBib3hTaGFkb3c6ICcwIDRweCAxMnB4IHJnYmEoMCwwLDAsMC4wNSknIH19PlxuICAgICAgICAgICAgPFRleHQgdmFyaWFudD1cImgzXCIgbWI9XCJsZ1wiIGZvbnRXZWlnaHQ9XCJib2xkXCI+XG4gICAgICAgICAgICAgICAge3JlY29yZCA/IGBEaXJlY3QgTWVzc2FnZTogJHtyZWNvcmQucGFyYW1zLm5hbWUgfHwgJ1VzZXInfWAgOiAnQnJvYWRjYXN0IFB1c2ggTm90aWZpY2F0aW9uJ31cbiAgICAgICAgICAgIDwvVGV4dD5cblxuICAgICAgICAgICAge3JlY29yZCAmJiAoXG4gICAgICAgICAgICAgICAgPFRleHQgdmFyaWFudD1cInNtXCIgY29sb3I9XCJncmV5NjBcIiBtYj1cInhsXCI+XG4gICAgICAgICAgICAgICAgICAgIFRoaXMgbm90aWZpY2F0aW9uIHdpbGwgYmUgc2VudCBpbW1lZGlhdGVseSB0byBhIHNpbmdsZSBkZXZpY2UgKGlmIHRoZXkgaGF2ZSBwdXNoIG5vdGlmaWNhdGlvbnMgZW5hYmxlZCkuXG4gICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAge3N1Y2Nlc3NNZXNzYWdlICYmIChcbiAgICAgICAgICAgICAgICA8Qm94IG1iPVwibGdcIj5cbiAgICAgICAgICAgICAgICAgICAgPE1lc3NhZ2VCb3ggdmFyaWFudD1cInN1Y2Nlc3NcIiBtZXNzYWdlPXtzdWNjZXNzTWVzc2FnZX0gLz5cbiAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHtlcnJvck1lc3NhZ2UgJiYgKFxuICAgICAgICAgICAgICAgIDxCb3ggbWI9XCJsZ1wiPlxuICAgICAgICAgICAgICAgICAgICA8TWVzc2FnZUJveCB2YXJpYW50PVwiZGFuZ2VyXCIgbWVzc2FnZT17ZXJyb3JNZXNzYWdlfSAvPlxuICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgKX1cblxuICAgICAgICAgICAgeyFyZWNvcmQgJiYgKFxuICAgICAgICAgICAgICAgIDxGb3JtR3JvdXA+XG4gICAgICAgICAgICAgICAgICAgIDxMYWJlbCBmb250V2VpZ2h0PVwiYm9sZFwiPlNlbGVjdCBUYXJnZXQgQXVkaWVuY2U8L0xhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8VGV4dCB2YXJpYW50PVwic21cIiBjb2xvcj1cImdyZXk2MFwiIG1iPVwiZGVmYXVsdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgV2hvIHNob3VsZCByZWNlaXZlIHRoaXMgYnJvYWRjYXN0IGFsZXJ0IG9uIHRoZWlyIG1vYmlsZSBkZXZpY2VzP1xuICAgICAgICAgICAgICAgICAgICA8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgIDxCb3ggZmxleCBmbGV4RGlyZWN0aW9uPVwicm93XCIgYWxpZ25JdGVtcz1cImNlbnRlclwiIG10PVwic21cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50PXshcHVzaFRvRHJpdmVycyA/IFwicHJpbWFyeVwiIDogXCJzZWNvbmRhcnlcIn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRQdXNoVG9Ecml2ZXJzKGZhbHNlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtcj1cImRlZmF1bHRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU9XCJsZ1wiXG4gICAgICAgICAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAg8J+bje+4jyBBbGwgQ3VzdG9tZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b25cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50PXtwdXNoVG9Ecml2ZXJzID8gXCJwcmltYXJ5XCIgOiBcInNlY29uZGFyeVwifVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHNldFB1c2hUb0RyaXZlcnModHJ1ZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZT1cImxnXCJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICDwn5u1IEFsbCBEcml2ZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICAgPC9Gb3JtR3JvdXA+XG4gICAgICAgICAgICApfVxuXG4gICAgICAgICAgICA8Rm9ybUdyb3VwIG10PVwieGxcIj5cbiAgICAgICAgICAgICAgICA8TGFiZWwgZm9udFdlaWdodD1cImJvbGRcIj5Ob3RpZmljYXRpb24gVGl0bGU8L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxJbnB1dFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZT17dGl0bGV9XG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0VGl0bGUoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17cHVzaFRvRHJpdmVycyA/IFwiZS5nLiwgUmFpbiBTdXJnZSBBY3RpdmUhIPCfjKfvuI9cIiA6IFwiZS5nLiwgRmxhc2ggU2FsZSEg4pqh77iPXCJ9XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoPXsxfVxuICAgICAgICAgICAgICAgICAgICBzaXplPVwibGdcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L0Zvcm1Hcm91cD5cblxuICAgICAgICAgICAgPEZvcm1Hcm91cD5cbiAgICAgICAgICAgICAgICA8TGFiZWwgZm9udFdlaWdodD1cImJvbGRcIj5Ob3RpZmljYXRpb24gQm9keTwvTGFiZWw+XG4gICAgICAgICAgICAgICAgPFRleHRBcmVhXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlPXtib2R5fVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldEJvZHkoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17cHVzaFRvRHJpdmVycyA/IFwiTG9naW4gbm93IHRvIGVhcm4gZXh0cmEg4oK5MjAgcGVyIG9yZGVyIVwiIDogXCJHZXQgNTAlIG9mZiBvbiBhbGwgZnJlc2ggdmVnZXRhYmxlcyBmb3IgdGhlIG5leHQgMiBob3VycyFcIn1cbiAgICAgICAgICAgICAgICAgICAgcm93cz17NX1cbiAgICAgICAgICAgICAgICAgICAgd2lkdGg9ezF9XG4gICAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgIDwvRm9ybUdyb3VwPlxuXG4gICAgICAgICAgICA8Qm94IG10PVwieHhsXCIgcHQ9XCJsZ1wiIGJvcmRlclRvcD1cIjFweCBzb2xpZCAjZWVlXCI+XG4gICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB2YXJpYW50PVwicHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZVNlbmR9XG4gICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtsb2FkaW5nfVxuICAgICAgICAgICAgICAgICAgICBzaXplPVwibGdcIlxuICAgICAgICAgICAgICAgICAgICBzdHlsZT17eyB3aWR0aDogJzEwMCUnLCBqdXN0aWZ5Q29udGVudDogJ2NlbnRlcicgfX1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICAgIHtsb2FkaW5nID8gJ1NlbmRpbmcgJiBEZWxpdmVyaW5nLi4uJyA6IChyZWNvcmQgPyAnU2VuZCBEaXJlY3QgTWVzc2FnZSBOb3cnIDogYEJyb2FkY2FzdCB0byAke3B1c2hUb0RyaXZlcnMgPyAnQWxsIERyaXZlcnMnIDogJ0FsbCBDdXN0b21lcnMnfWApfVxuICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAgICAgIHshcmVjb3JkICYmIChcbiAgICAgICAgICAgICAgICA8Qm94IG10PVwibGdcIiB0ZXh0QWxpZ249XCJjZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgPFRleHQgdmFyaWFudD1cInNtXCIgY29sb3I9XCJncmV5NDBcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIOKaoe+4jyBCcm9hZGNhc3RzIGFyZSBzZW50IGFzeW5jaHJvbm91c2x5IHZpYSBFeHBvIHNlcnZlcnMuXG4gICAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICl9XG4gICAgICAgIDwvQm94PlxuICAgICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBTZW5kTm90aWZpY2F0aW9uO1xuIiwiaW1wb3J0IFJlYWN0LCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBCb3gsIFRleHQsIEJ1dHRvbiwgTG9hZGVyLCBJY29uIH0gZnJvbSAnQGFkbWluanMvZGVzaWduLXN5c3RlbSc7XG5pbXBvcnQgeyBzdHlsZWQgfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtL3N0eWxlZCc7XG5pbXBvcnQgeyBBcGlDbGllbnQgfSBmcm9tICdhZG1pbmpzJztcblxuY29uc3QgUHJlbWl1bUNhcmQgPSBzdHlsZWQoQm94KWBcbiAgYmFja2dyb3VuZDogd2hpdGU7XG4gIGJvcmRlci1yYWRpdXM6IDI0cHg7XG4gIHBhZGRpbmc6IDMycHg7XG4gIGJveC1zaGFkb3c6IDAgMTBweCAzMHB4IC0xMHB4IHJnYmEoMCwgMCwgMCwgMC4wNSk7XG4gIGJvcmRlcjogMXB4IHNvbGlkICNmMWY1Zjk7XG4gIHRyYW5zaXRpb246IGFsbCAwLjNzIGN1YmljLWJlemllcigwLjQsIDAsIDAuMiwgMSk7XG4gICY6aG92ZXIge1xuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtOHB4KTtcbiAgICBib3gtc2hhZG93OiAwIDIwcHggNDBweCAtMTVweCByZ2JhKDE2LCAxODUsIDEyOSwgMC4xNSk7XG4gICAgYm9yZGVyLWNvbG9yOiAjMTBiOTgxO1xuICB9XG5gO1xuXG5jb25zdCBTdGF0TGFiZWwgPSBzdHlsZWQoVGV4dClgXG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgY29sb3I6ICM2NDc0OGI7XG4gIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gIGxldHRlci1zcGFjaW5nOiAwLjFlbTtcbmA7XG5cbmNvbnN0IFN0YXRWYWx1ZSA9IHN0eWxlZChUZXh0KWBcbiAgZm9udC1zaXplOiA0NHB4O1xuICBmb250LXdlaWdodDogOTAwO1xuICBjb2xvcjogIzFlMjkzYjtcbiAgbWFyZ2luLXRvcDogOHB4O1xuICBsaW5lLWhlaWdodDogMTtcbmA7XG5cbmNvbnN0IEFjdGlvbkJ1dHRvbiA9IHN0eWxlZChCb3gpYFxuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBwYWRkaW5nOiAxNnB4IDI0cHg7XG4gIGJhY2tncm91bmQ6ICNmOGZhZmM7XG4gIGJvcmRlci1yYWRpdXM6IDE2cHg7XG4gIGN1cnNvcjogcG9pbnRlcjtcbiAgdHJhbnNpdGlvbjogYWxsIDAuMnMgZWFzZTtcbiAgYm9yZGVyOiAxcHggc29saWQgdHJhbnNwYXJlbnQ7XG4gIHdpZHRoOiAxMDAlO1xuICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gIGNvbG9yOiBpbmhlcml0O1xuICAmOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kOiAjZmZmZmZmO1xuICAgIGJvcmRlci1jb2xvcjogIzEwYjk4MTtcbiAgICBib3gtc2hhZG93OiAwIDRweCAxMnB4IHJnYmEoMCwwLDAsMC4wNSk7XG4gICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDRweCk7XG4gIH1cbmA7XG5cbmNvbnN0IERhc2hib2FyZCA9ICgpID0+IHtcbiAgICBjb25zdCBbc3RhdHMsIHNldFN0YXRzXSA9IHVzZVN0YXRlKHtcbiAgICAgICAgdG90YWxPcmRlcnM6IDAsXG4gICAgICAgIGFjdGl2ZUN1c3RvbWVyczogMCxcbiAgICAgICAgbG93U3RvY2tBbGVydHM6IDAsXG4gICAgICAgIHBlbmRpbmdPcmRlcnM6IDAsXG4gICAgICAgIHRvdGFsUmV2ZW51ZTogMCxcbiAgICAgICAgaW52ZW50b3J5UHJvZml0OiAwXG4gICAgfSk7XG4gICAgY29uc3QgW3JlY2VudE9yZGVycywgc2V0UmVjZW50T3JkZXJzXSA9IHVzZVN0YXRlKFtdKTtcbiAgICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcblxuICAgIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgICAgIGNvbnN0IGZldGNoTWV0cmljcyA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYXBpID0gbmV3IEFwaUNsaWVudCgpO1xuICAgICAgICAgICAgICAgIC8vIFdlIHVzZSB0aGUgY29uZmlndXJlZCByZXNvdXJjZSBJRHMuIFxuICAgICAgICAgICAgICAgIC8vIE5vdGU6ICdPcmRlcicgbWlnaHQgYmUgcmVnaXN0ZXJlZCBtdWx0aXBsZSB0aW1lcywgYnV0IEFkbWluSlMgdXN1YWxseSBrZWVwcyB0aGUgbGFzdCBvbmUgb3IgdGhlIG9uZSB3aXRoIHNwZWNpZmljIElELlxuICAgICAgICAgICAgICAgIC8vIEluIG91ciBzZXR1cCwgJ09yZGVyJyBpcyB0aGUgcHJpbWFyeSBvbmUsIGFuZCAnT3JkZXJBc3NpZ25tZW50JyBpcyB0aGUgc2Vjb25kYXJ5LlxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IFtvcmRlcnNSZXMsIHBlbmRpbmdPcmRlcnNSZXMsIGN1c3RvbWVyc1JlcywgbG93U3RvY2tSZXMsIGRlbGl2ZXJlZE9yZGVyc1JlcywgcmVjZW50T3JkZXJzUmVzXSA9IGF3YWl0IFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICAgICAgYXBpLnJlc291cmNlQWN0aW9uKHsgcmVzb3VyY2VJZDogJ09yZGVyJywgYWN0aW9uTmFtZTogJ2xpc3QnLCBwYXJhbXM6IHsgcGVyUGFnZTogMSB9IH0pLFxuICAgICAgICAgICAgICAgICAgICBhcGkucmVzb3VyY2VBY3Rpb24oeyByZXNvdXJjZUlkOiAnT3JkZXInLCBhY3Rpb25OYW1lOiAnbGlzdCcsIHBhcmFtczogeyAnZmlsdGVycy5zdGF0dXMnOiAnYXZhaWxhYmxlJywgcGVyUGFnZTogMSB9IH0pLFxuICAgICAgICAgICAgICAgICAgICBhcGkucmVzb3VyY2VBY3Rpb24oeyByZXNvdXJjZUlkOiAnQ3VzdG9tZXInLCBhY3Rpb25OYW1lOiAnbGlzdCcsIHBhcmFtczogeyBwZXJQYWdlOiAxIH0gfSksXG4gICAgICAgICAgICAgICAgICAgIGFwaS5yZXNvdXJjZUFjdGlvbih7IHJlc291cmNlSWQ6ICdQcm9kdWN0JywgYWN0aW9uTmFtZTogJ2xpc3QnLCBwYXJhbXM6IHsgJ2ZpbHRlcnMuc3RvY2t+fmx0ZSc6IDEwLCBwZXJQYWdlOiAxIH0gfSksXG4gICAgICAgICAgICAgICAgICAgIGFwaS5yZXNvdXJjZUFjdGlvbih7IHJlc291cmNlSWQ6ICdPcmRlcicsIGFjdGlvbk5hbWU6ICdsaXN0JywgcGFyYW1zOiB7ICdmaWx0ZXJzLnN0YXR1cyc6ICdkZWxpdmVyZWQnLCBwZXJQYWdlOiAxMDAsIHNvcnRCeTogJ2NyZWF0ZWRBdCcsIGRpcmVjdGlvbjogJ2Rlc2MnIH0gfSksXG4gICAgICAgICAgICAgICAgICAgIGFwaS5yZXNvdXJjZUFjdGlvbih7IHJlc291cmNlSWQ6ICdPcmRlcicsIGFjdGlvbk5hbWU6ICdsaXN0JywgcGFyYW1zOiB7IHBlclBhZ2U6IDUsIHNvcnRCeTogJ2NyZWF0ZWRBdCcsIGRpcmVjdGlvbjogJ2Rlc2MnIH0gfSlcbiAgICAgICAgICAgICAgICBdKTtcblxuICAgICAgICAgICAgICAgIC8vIEhlbHBlciB0byBleHRyYWN0IHRvdGFsIGZyb20gQWRtaW5KUyByZXNwb25zZSBzdHJ1Y3R1cmVcbiAgICAgICAgICAgICAgICBjb25zdCBnZXRUb3RhbCA9IChyZXMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlcz8uZGF0YT8ubWV0YT8udG90YWwgIT09IHVuZGVmaW5lZCkgcmV0dXJuIHJlcy5kYXRhLm1ldGEudG90YWw7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXM/Lm1ldGE/LnRvdGFsICE9PSB1bmRlZmluZWQpIHJldHVybiByZXMubWV0YS50b3RhbDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGdldFJlY29yZHMgPSAocmVzKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXM/LmRhdGE/LnJlY29yZHMpIHJldHVybiByZXMuZGF0YS5yZWNvcmRzO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzPy5yZWNvcmRzKSByZXR1cm4gcmVzLnJlY29yZHM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIHJldmVudWUgZnJvbSBkZWxpdmVyZWQgb3JkZXJzXG4gICAgICAgICAgICAgICAgY29uc3QgZGVsaXZlcmVkUmVjb3JkcyA9IGdldFJlY29yZHMoZGVsaXZlcmVkT3JkZXJzUmVzKTtcbiAgICAgICAgICAgICAgICBsZXQgdG90YWxSZXZlbnVlID0gMDtcbiAgICAgICAgICAgICAgICBkZWxpdmVyZWRSZWNvcmRzLmZvckVhY2gob3JkZXIgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwcmljZSA9IHBhcnNlRmxvYXQob3JkZXIucGFyYW1zPy50b3RhbFByaWNlIHx8IDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWlzTmFOKHByaWNlKSkgdG90YWxSZXZlbnVlICs9IHByaWNlO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgc2V0U3RhdHMoe1xuICAgICAgICAgICAgICAgICAgICB0b3RhbE9yZGVyczogZ2V0VG90YWwob3JkZXJzUmVzKSxcbiAgICAgICAgICAgICAgICAgICAgcGVuZGluZ09yZGVyczogZ2V0VG90YWwocGVuZGluZ09yZGVyc1JlcyksXG4gICAgICAgICAgICAgICAgICAgIGFjdGl2ZUN1c3RvbWVyczogZ2V0VG90YWwoY3VzdG9tZXJzUmVzKSxcbiAgICAgICAgICAgICAgICAgICAgbG93U3RvY2tBbGVydHM6IGdldFRvdGFsKGxvd1N0b2NrUmVzKSxcbiAgICAgICAgICAgICAgICAgICAgdG90YWxSZXZlbnVlOiBNYXRoLnJvdW5kKHRvdGFsUmV2ZW51ZSksXG4gICAgICAgICAgICAgICAgICAgIGludmVudG9yeVByb2ZpdDogTWF0aC5yb3VuZCh0b3RhbFJldmVudWUgKiAwLjMpIC8vIEFwcHJveGltYXRlOyBleGFjdCB2YWx1ZSBmcm9tIE1hbmFnZXIgQVBJXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBzZXRSZWNlbnRPcmRlcnMoZ2V0UmVjb3JkcyhyZWNlbnRPcmRlcnNSZXMpKTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRGFzaGJvYXJkIGZldGNoIGVycm9yOlwiLCBlcnJvcik7XG4gICAgICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHNldExvYWRpbmcoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBmZXRjaE1ldHJpY3MoKTtcbiAgICB9LCBbXSk7XG5cbiAgICBpZiAobG9hZGluZykge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgPEJveCBwPVwieGxcIiBiZz1cIiNmOGZhZmNcIiBtaW5IZWlnaHQ9XCIxMDB2aFwiIGRpc3BsYXk9XCJmbGV4XCIganVzdGlmeUNvbnRlbnQ9XCJjZW50ZXJcIiBhbGlnbkl0ZW1zPVwiY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgPExvYWRlciBjb2xvcj1cIiMxMGI5ODFcIiAvPlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICk7XG4gICAgfVxuXG4gICAgcmV0dXJuIChcbiAgICAgICAgPEJveCBwPVwieHhsXCIgYmc9XCIjZjhmYWZjXCIgbWluSGVpZ2h0PVwiMTAwdmhcIj5cbiAgICAgICAgICAgIHsvKiBIZWFkZXIgc2VjdGlvbiB3aXRoIGJyYW5kIGZlZWwgKi99XG4gICAgICAgICAgICA8Qm94IG1iPVwieHh4bFwiIGRpc3BsYXk9XCJmbGV4XCIganVzdGlmeUNvbnRlbnQ9XCJzcGFjZS1iZXR3ZWVuXCIgYWxpZ25JdGVtcz1cImZsZXgtZW5kXCI+XG4gICAgICAgICAgICAgICAgPEJveD5cbiAgICAgICAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCIjMGYxNzJhXCIgZm9udFNpemU9XCI0MHB4XCIgZm9udFdlaWdodD1cIjkwMFwiIGxldHRlclNwYWNpbmc9XCItMC4wMmVtXCI+U3RvcmUgSW5zaWdodHM8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiIzY0NzQ4YlwiIG10PVwieHNcIiBmb250U2l6ZT1cIjE4cHhcIj5SZWFsLXRpbWUgcGVyZm9ybWFuY2UgZnJvbSB5b3VyIFNhYkphYiBkYXRhYmFzZS48L1RleHQ+XG4gICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICAgPEJveCBkaXNwbGF5PXtbJ25vbmUnLCAnYmxvY2snXX0+XG4gICAgICAgICAgICAgICAgICAgPEJ1dHRvbiB2YXJpYW50PVwicHJpbWFyeVwiIGFzPVwiYVwiIGhyZWY9XCIvYWRtaW4vcmVzb3VyY2VzL1Byb2R1Y3QvYWN0aW9ucy9uZXdcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxJY29uIGljb249XCJQbHVzXCIgbXI9XCJzbVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICBBZGQgTmV3IEl0ZW1cbiAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgIDwvQm94PlxuXG4gICAgICAgICAgICB7LyogTWFpbiBTdGF0cyBHcmlkICovfVxuICAgICAgICAgICAgPEJveCBkaXNwbGF5PVwiZ3JpZFwiIGdyaWRUZW1wbGF0ZUNvbHVtbnM9e1tcIjFmclwiLCBcIjFmciAxZnJcIiwgXCIxZnIgMWZyIDFmclwiXX0gZ3JpZEdhcD1cIjMycHhcIiBtYj1cInh4eGxcIj5cbiAgICAgICAgICAgICAgICA8UHJlbWl1bUNhcmQ+XG4gICAgICAgICAgICAgICAgICAgIDxTdGF0TGFiZWw+R3Jvd3RoIE1ldHJpY3M8L1N0YXRMYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPFN0YXRWYWx1ZT57c3RhdHMudG90YWxPcmRlcnN9PC9TdGF0VmFsdWU+XG4gICAgICAgICAgICAgICAgICAgIDxCb3ggbXQ9XCJtZFwiIGRpc3BsYXk9XCJmbGV4XCIgYWxpZ25JdGVtcz1cImNlbnRlclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCIjMTBiOTgxXCIgZm9udFdlaWdodD1cImJvbGRcIiB2YXJpYW50PVwic21cIj5Ub3RhbCBPcmRlcnMgUGxhY2VkPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICA8L1ByZW1pdW1DYXJkPlxuXG4gICAgICAgICAgICAgICAgPFByZW1pdW1DYXJkPlxuICAgICAgICAgICAgICAgICAgICA8U3RhdExhYmVsPkN1c3RvbWVyIEJhc2U8L1N0YXRMYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPFN0YXRWYWx1ZT57c3RhdHMuYWN0aXZlQ3VzdG9tZXJzfTwvU3RhdFZhbHVlPlxuICAgICAgICAgICAgICAgICAgICA8Qm94IG10PVwibWRcIiBkaXNwbGF5PVwiZmxleFwiIGFsaWduSXRlbXM9XCJjZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiIzNiODJmNlwiIGZvbnRXZWlnaHQ9XCJib2xkXCIgdmFyaWFudD1cInNtXCI+UmVnaXN0ZXJlZCBVc2VyczwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICAgPC9QcmVtaXVtQ2FyZD5cblxuICAgICAgICAgICAgICAgIDxQcmVtaXVtQ2FyZCBib3JkZXJMZWZ0PVwiNHB4IHNvbGlkICNmYWNjMTVcIj5cbiAgICAgICAgICAgICAgICAgICAgPFN0YXRMYWJlbD5QZW5kaW5nIE9wczwvU3RhdExhYmVsPlxuICAgICAgICAgICAgICAgICAgICA8U3RhdFZhbHVlIGNvbG9yPXtzdGF0cy5wZW5kaW5nT3JkZXJzID4gMCA/IFwiIzg1NGQwZVwiIDogXCIjMTBiOTgxXCJ9PntzdGF0cy5wZW5kaW5nT3JkZXJzfTwvU3RhdFZhbHVlPlxuICAgICAgICAgICAgICAgICAgICA8Qm94IG10PVwibWRcIiBkaXNwbGF5PVwiZmxleFwiIGFsaWduSXRlbXM9XCJjZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiIzg1NGQwZVwiIGZvbnRXZWlnaHQ9XCJib2xkXCIgdmFyaWFudD1cInNtXCI+VW5hc3NpZ25lZCBPcmRlcnM8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICAgIDwvUHJlbWl1bUNhcmQ+XG5cbiAgICAgICAgICAgICAgICA8UHJlbWl1bUNhcmQgYm9yZGVyTGVmdD1cIjRweCBzb2xpZCAjZWY0NDQ0XCI+XG4gICAgICAgICAgICAgICAgICAgIDxTdGF0TGFiZWw+SW52ZW50b3J5IEhlbHA8L1N0YXRMYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPFN0YXRWYWx1ZSBjb2xvcj17c3RhdHMubG93U3RvY2tBbGVydHMgPiAwID8gXCIjOTkxYjFiXCIgOiBcIiMxMGI5ODFcIn0+e3N0YXRzLmxvd1N0b2NrQWxlcnRzfTwvU3RhdFZhbHVlPlxuICAgICAgICAgICAgICAgICAgICA8Qm94IG10PVwibWRcIiBkaXNwbGF5PVwiZmxleFwiIGFsaWduSXRlbXM9XCJjZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiIzk5MWIxYlwiIGZvbnRXZWlnaHQ9XCJib2xkXCIgdmFyaWFudD1cInNtXCI+TG93IFN0b2NrIEFsZXJ0czwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICAgPC9QcmVtaXVtQ2FyZD5cblxuICAgICAgICAgICAgICAgIDxQcmVtaXVtQ2FyZCBib3JkZXJMZWZ0PVwiNHB4IHNvbGlkICMwNmI2ZDRcIj5cbiAgICAgICAgICAgICAgICAgICAgPFN0YXRMYWJlbD5SZXZlbnVlPC9TdGF0TGFiZWw+XG4gICAgICAgICAgICAgICAgICAgIDxTdGF0VmFsdWU+4oK5eyhzdGF0cy50b3RhbFJldmVudWUgfHwgMCkudG9Mb2NhbGVTdHJpbmcoKX08L1N0YXRWYWx1ZT5cbiAgICAgICAgICAgICAgICAgICAgPEJveCBtdD1cIm1kXCIgZGlzcGxheT1cImZsZXhcIiBhbGlnbkl0ZW1zPVwiY2VudGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cIiMwNmI2ZDRcIiBmb250V2VpZ2h0PVwiYm9sZFwiIHZhcmlhbnQ9XCJzbVwiPlRvdGFsIERlbGl2ZXJlZCBSZXZlbnVlPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICA8L1ByZW1pdW1DYXJkPlxuXG4gICAgICAgICAgICAgICAgPFByZW1pdW1DYXJkIGJvcmRlckxlZnQ9XCI0cHggc29saWQgIzEwYjk4MVwiPlxuICAgICAgICAgICAgICAgICAgICA8U3RhdExhYmVsPkludmVudG9yeSBQcm9maXQ8L1N0YXRMYWJlbD5cbiAgICAgICAgICAgICAgICAgICAgPFN0YXRWYWx1ZSBjb2xvcj1cIiMxMGI5ODFcIj7igrl7KHN0YXRzLmludmVudG9yeVByb2ZpdCB8fCAwKS50b0xvY2FsZVN0cmluZygpfTwvU3RhdFZhbHVlPlxuICAgICAgICAgICAgICAgICAgICA8Qm94IG10PVwibWRcIiBkaXNwbGF5PVwiZmxleFwiIGFsaWduSXRlbXM9XCJjZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwiIzEwYjk4MVwiIGZvbnRXZWlnaHQ9XCJib2xkXCIgdmFyaWFudD1cInNtXCI+UXVpY2sgT3JkZXJzIE9ubHk8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICAgIDwvUHJlbWl1bUNhcmQ+XG4gICAgICAgICAgICA8L0JveD5cblxuICAgICAgICAgICAgey8qIEFscGhhYmV0aWNhbCBDYXRhbG9nIFNlYXJjaCAqL31cbiAgICAgICAgICAgIDxCb3ggbWI9XCJ4eHhsXCI+XG4gICAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCIjMGYxNzJhXCIgZm9udFNpemU9XCIyNHB4XCIgZm9udFdlaWdodD1cIjgwMFwiIG1iPVwieGxcIj5Ccm93c2UgUHJvZHVjdHMgYnkgQWxwaGFiZXQ8L1RleHQ+XG4gICAgICAgICAgICAgICAgPEJveCBiZz1cIndoaXRlXCIgcD1cInhsXCIgYm9yZGVyUmFkaXVzPVwiMjRweFwiIGJvcmRlcj1cIjFweCBzb2xpZCAjZjFmNWY5XCIgYm94U2hhZG93PVwiMCA0cHggNnB4IC0xcHggcmdiYSgwLDAsMCwwLjA1KVwiPlxuICAgICAgICAgICAgICAgICAgICA8Qm94IGRpc3BsYXk9XCJmbGV4XCIgZmxleFdyYXA9XCJ3cmFwXCIgc3R5bGU9e3sgZ2FwOiAnOHB4JyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgIHsnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonLnNwbGl0KCcnKS5tYXAobGV0dGVyID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk9e2xldHRlcn0gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU9XCJzbVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50PVwibGlnaHRcIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXM9XCJhXCIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY9e2AvYWRtaW4vcmVzb3VyY2VzL1Byb2R1Y3Q/bGV0dGVyPSR7bGV0dGVyfWB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IG1pbldpZHRoOiAnNDJweCcsIGhlaWdodDogJzQycHgnLCBib3JkZXJSYWRpdXM6ICcxMnB4JyB9fVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2xldHRlcn1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgPEJ1dHRvbiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplPVwic21cIiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXJpYW50PVwicHJpbWFyeVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFzPVwiYVwiIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY9XCIvYWRtaW4vcmVzb3VyY2VzL1Byb2R1Y3RcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IHBhZGRpbmc6ICcwIDIwcHgnLCBoZWlnaHQ6ICc0MnB4JywgYm9yZGVyUmFkaXVzOiAnMTJweCcgfX1cbiAgICAgICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBWSUVXIEFMTCBQUk9EVUNUU1xuICAgICAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAgICAgIHsvKiBSZWNlbnQgT3JkZXJzIFRhYmxlICovfVxuICAgICAgICAgICAge3JlY2VudE9yZGVycy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgICA8Qm94IG1iPVwieHh4bFwiPlxuICAgICAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cIiMwZjE3MmFcIiBmb250U2l6ZT1cIjI0cHhcIiBmb250V2VpZ2h0PVwiODAwXCIgbWI9XCJ4bFwiPkxpdmUgQWN0aXZpdHkgRmVlZDwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgPEJveCBiZz1cIndoaXRlXCIgcD1cInhsXCIgYm9yZGVyUmFkaXVzPVwiMjRweFwiIGJvcmRlcj1cIjFweCBzb2xpZCAjZjFmNWY5XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFibGUgd2lkdGg9XCIxMDAlXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlUm93PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD5PcmRlciBJRDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD5QcmljZTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD5TdGF0dXM8L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+RGF0ZTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD48L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZVJvdz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVCb2R5PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7cmVjZW50T3JkZXJzLm1hcChvcmRlciA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVSb3cga2V5PXtvcmRlci5pZH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD48VGV4dCBmb250V2VpZ2h0PVwiYm9sZFwiPntvcmRlci5wYXJhbXMub3JkZXJJZCB8fCBvcmRlci5pZH08L1RleHQ+PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD7igrl7b3JkZXIucGFyYW1zLnRvdGFsUHJpY2V9PC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJhZGdlIHZhcmlhbnQ9e29yZGVyLnBhcmFtcy5zdGF0dXMgPT09ICdkZWxpdmVyZWQnID8gJ3N1Y2Nlc3MnIDogJ2luZm8nfT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtvcmRlci5wYXJhbXMuc3RhdHVzfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0JhZGdlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+e25ldyBEYXRlKG9yZGVyLnBhcmFtcy5jcmVhdGVkQXQpLnRvTG9jYWxlRGF0ZVN0cmluZygpfTwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCdXR0b24gc2l6ZT1cInNtXCIgYXM9XCJhXCIgaHJlZj17YC9hZG1pbi9yZXNvdXJjZXMvT3JkZXIvcmVjb3Jkcy8ke29yZGVyLmlkfS9zaG93YH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWaWV3XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZVJvdz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUJvZHk+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L1RhYmxlPlxuICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICl9XG5cbiAgICAgICAgICAgIHsvKiBRdWljayBBY3Rpb25zICYgTWFpbnRlbmFuY2UgKi99XG4gICAgICAgICAgICA8Qm94IGRpc3BsYXk9XCJncmlkXCIgZ3JpZFRlbXBsYXRlQ29sdW1ucz17W1wiMWZyXCIsIFwiMWZyXCIsIFwiMmZyIDFmclwiXX0gZ3JpZEdhcD1cIjQwcHhcIj5cbiAgICAgICAgICAgICAgICA8Qm94PlxuICAgICAgICAgICAgICAgICAgICA8VGV4dCBjb2xvcj1cIiMwZjE3MmFcIiBmb250U2l6ZT1cIjI0cHhcIiBmb250V2VpZ2h0PVwiODAwXCIgbWI9XCJ4bFwiPlJlc291cmNlIFNob3J0Y3V0czwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgPEJveCBkaXNwbGF5PVwiZ3JpZFwiIGdyaWRUZW1wbGF0ZUNvbHVtbnM9e1tcIjFmclwiLCBcIjFmciAxZnJcIl19IGdyaWRHYXA9XCIxNnB4XCI+XG4gICAgICAgICAgICAgICAgICAgICAgICA8QWN0aW9uQnV0dG9uIGFzPVwiYVwiIGhyZWY9XCIvYWRtaW4vcmVzb3VyY2VzL09yZGVyXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJveCBiZz1cInJnYmEoMTYsIDE4NSwgMTI5LCAwLjEpXCIgcD1cIm1kXCIgYm9yZGVyUmFkaXVzPVwiMTJweFwiIG1yPVwibWRcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEljb24gaWNvbj1cIlNob3BwaW5nQ2FydFwiIGNvbG9yPVwiIzEwYjk4MVwiIC8+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJveD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRleHQgZm9udFdlaWdodD1cImJvbGRcIj5PcmRlcnMgUXVldWU8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IHZhcmlhbnQ9XCJzbVwiIGNvbG9yPVwiIzY0NzQ4YlwiPkxpdmUgZnVsZmlsbG1lbnQgY2VudGVyPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9BY3Rpb25CdXR0b24+XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIDxBY3Rpb25CdXR0b24gYXM9XCJhXCIgaHJlZj1cIi9hZG1pbi9yZXNvdXJjZXMvUHJvZHVjdFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCb3ggYmc9XCJyZ2JhKDU5LCAxMzAsIDI0NiwgMC4xKVwiIHA9XCJtZFwiIGJvcmRlclJhZGl1cz1cIjEycHhcIiBtcj1cIm1kXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxJY29uIGljb249XCJQYWNrYWdlXCIgY29sb3I9XCIjM2I4MmY2XCIgLz5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Qm94PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGV4dCBmb250V2VpZ2h0PVwiYm9sZFwiPkludmVudG9yeSBNYW5hZ2VyPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGV4dCB2YXJpYW50PVwic21cIiBjb2xvcj1cIiM2NDc0OGJcIj5VcGRhdGUgaXRlbXMgYW5kIHByaWNpbmc8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0FjdGlvbkJ1dHRvbj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPEFjdGlvbkJ1dHRvbiBhcz1cImFcIiBocmVmPVwiL2FkbWluL3Jlc291cmNlcy9Db3Vwb25cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Qm94IGJnPVwicmdiYSgyNDQsIDYzLCA5NCwgMC4xKVwiIHA9XCJtZFwiIGJvcmRlclJhZGl1cz1cIjEycHhcIiBtcj1cIm1kXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxJY29uIGljb249XCJUYWdcIiBjb2xvcj1cIiNmNDNmNWVcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCb3g+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IGZvbnRXZWlnaHQ9XCJib2xkXCI+Q2FtcGFpZ24gSHViPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGV4dCB2YXJpYW50PVwic21cIiBjb2xvcj1cIiM2NDc0OGJcIj5NYXJrZXRpbmcgJiBEaXNjb3VudHM8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgICAgICAgICAgICAgICAgICA8L0FjdGlvbkJ1dHRvbj5cblxuICAgICAgICAgICAgICAgICAgICAgICAgPEFjdGlvbkJ1dHRvbiBhcz1cImFcIiBocmVmPVwiL2FkbWluL3Jlc291cmNlcy9DdXN0b21lclwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCb3ggYmc9XCJyZ2JhKDEwNywgMTE0LCAxMjgsIDAuMSlcIiBwPVwibWRcIiBib3JkZXJSYWRpdXM9XCIxMnB4XCIgbXI9XCJtZFwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8SWNvbiBpY29uPVwiVXNlcnNcIiBjb2xvcj1cIiM2YjcyODBcIiAvPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxCb3g+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IGZvbnRXZWlnaHQ9XCJib2xkXCI+VXNlciBEaXJlY3Rvcnk8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IHZhcmlhbnQ9XCJzbVwiIGNvbG9yPVwiIzY0NzQ4YlwiPkRhdGFiYXNlIG9mIGFsbCB1c2VyczwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvQWN0aW9uQnV0dG9uPlxuICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICA8L0JveD5cblxuICAgICAgICAgICAgICAgIDxCb3g+XG4gICAgICAgICAgICAgICAgICA8UHJlbWl1bUNhcmQgYmc9XCIjMDQ3ODU3XCI+XG4gICAgICAgICAgICAgICAgICAgIDxUZXh0IGNvbG9yPVwid2hpdGVcIiBmb250U2l6ZT1cIjIwcHhcIiBmb250V2VpZ2h0PVwiOTAwXCIgbWI9XCJtZFwiPlN5c3RlbSBNYWludGVuYW5jZTwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCJyZ2JhKDI1NSwyNTUsMjU1LDAuOClcIiBtYj1cInhsXCIgbGluZUhlaWdodD1cIjEuNlwiPlxuICAgICAgICAgICAgICAgICAgICAgIFJ1bm5pbmcgaW4gcHJvZHVjdGlvbiBtb2RlLiBEYXRhIGlzIHN5bmNlZCBpbiByZWFsLXRpbWUgd2l0aCBNb25nbyBBdGxhcy5cbiAgICAgICAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICA8QnV0dG9uIHZhcmlhbnQ9XCJzZWNvbmRhcnlcIiBhcz1cImFcIiBocmVmPVwiL2FkbWluL3BhZ2VzL0NvbXBvbmVudCBHdWlkZVwiIHdpZHRoPVwiMTAwJVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgQnVpbGRlciBJbnN0cnVjdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICAgICAgICA8L1ByZW1pdW1DYXJkPlxuICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgIDwvQm94PlxuICAgICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBEYXNoYm9hcmQ7XG4iLCJpbXBvcnQgUmVhY3QsIHsgdXNlU3RhdGUsIHVzZUVmZmVjdCB9IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEJveCwgQnV0dG9uLCBGb3JtR3JvdXAsIExhYmVsLCBTZWxlY3QsIFRleHQsIExvYWRlciB9IGZyb20gJ0BhZG1pbmpzL2Rlc2lnbi1zeXN0ZW0nO1xuaW1wb3J0IHsgQXBpQ2xpZW50IH0gZnJvbSAnYWRtaW5qcyc7XG5cbmNvbnN0IEFzc2lnbkRyaXZlciA9IChwcm9wcykgPT4ge1xuICAgIGNvbnN0IHsgcmVjb3JkLCByZXNvdXJjZSwgYWN0aW9uIH0gPSBwcm9wcztcbiAgICBjb25zdCBbZHJpdmVycywgc2V0RHJpdmVyc10gPSB1c2VTdGF0ZShbXSk7XG4gICAgY29uc3QgW3NlbGVjdGVkRHJpdmVySWQsIHNldFNlbGVjdGVkRHJpdmVySWRdID0gdXNlU3RhdGUoJycpO1xuICAgIGNvbnN0IFtkZWxpdmVyeUZlZSwgc2V0RGVsaXZlcnlGZWVdID0gdXNlU3RhdGUocmVjb3JkLnBhcmFtcy5kcml2ZXJFYXJuaW5nIHx8ICcnKTtcbiAgICBjb25zdCBbbG9hZGluZywgc2V0TG9hZGluZ10gPSB1c2VTdGF0ZShmYWxzZSk7XG4gICAgY29uc3QgW2ZldGNoaW5nLCBzZXRGZXRjaGluZ10gPSB1c2VTdGF0ZSh0cnVlKTtcbiAgICBjb25zdCBhcGkgPSBuZXcgQXBpQ2xpZW50KCk7XG5cbiAgICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgICAgICBjb25zdCBmZXRjaERyaXZlcnMgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIC8vIEZldGNoIERlbGl2ZXJ5UGFydG5lciByZXNvdXJjZSByZWNvcmRzXG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBhcGkucmVzb3VyY2VBY3Rpb24oe1xuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZUlkOiAnRGVsaXZlcnlQYXJ0bmVyJyxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uTmFtZTogJ2xpc3QnLFxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEucmVjb3Jkcykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBhY3RpdmVEcml2ZXJzID0gcmVzcG9uc2UuZGF0YS5yZWNvcmRzXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsdGVyKHIgPT4gci5wYXJhbXMuaXNBY3RpdmF0ZWQgPT09IHRydWUgfHwgci5wYXJhbXMuaXNBY3RpdmF0ZWQgPT09ICd0cnVlJylcbiAgICAgICAgICAgICAgICAgICAgICAgIC5tYXAociA9PiAoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiByLmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBgJHtyLnBhcmFtcy5uYW1lfSAoJHtyLnBhcmFtcy5lbWFpbH0pYCxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0RHJpdmVycyhhY3RpdmVEcml2ZXJzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBmZXRjaCBkcml2ZXJzOicsIGVycm9yKTtcbiAgICAgICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICAgICAgc2V0RmV0Y2hpbmcoZmFsc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGZldGNoRHJpdmVycygpO1xuICAgIH0sIFtdKTtcblxuICAgIGNvbnN0IGhhbmRsZUFzc2lnbiA9IGFzeW5jICgpID0+IHtcbiAgICAgICAgaWYgKCFzZWxlY3RlZERyaXZlcklkKSB7XG4gICAgICAgICAgICBhbGVydCgnUGxlYXNlIHNlbGVjdCBhIGRyaXZlcicpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0TG9hZGluZyh0cnVlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYXBpLnJlc291cmNlQWN0aW9uKHtcbiAgICAgICAgICAgICAgICByZXNvdXJjZUlkOiByZXNvdXJjZS5pZCxcbiAgICAgICAgICAgICAgICBhY3Rpb25OYW1lOiBhY3Rpb24ubmFtZSxcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdwb3N0JyxcbiAgICAgICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgICAgIGRyaXZlcklkOiBzZWxlY3RlZERyaXZlcklkLFxuICAgICAgICAgICAgICAgICAgICBkcml2ZXJFYXJuaW5nOiBkZWxpdmVyeUZlZVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgcmVjb3JkSWQ6IHJlY29yZC5pZCxcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5ub3RpY2UpIHtcbiAgICAgICAgICAgICAgICBhbGVydChyZXNwb25zZS5kYXRhLm5vdGljZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAvLyBJbnRlbGxpZ2VudCByZWRpcmVjdCBiYXNlZCBvbiBjdXJyZW50IHJlc291cmNlXG4gICAgICAgICAgICAgICAgaWYgKHJlc291cmNlLmlkID09PSAnT3JkZXJBc3NpZ25tZW50Jykge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGAvYWRtaW4vcmVzb3VyY2VzL09yZGVyQXNzaWdubWVudGA7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBgL2FkbWluL3Jlc291cmNlcy9PcmRlci9yZWNvcmRzLyR7cmVjb3JkLmlkfS9zaG93YDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gYXNzaWduIGRyaXZlcjonLCBlcnJvcik7XG4gICAgICAgICAgICBjb25zdCBlcnJNc2cgPSBlcnJvci5yZXNwb25zZT8uZGF0YT8ubm90aWNlPy5tZXNzYWdlIHx8IGVycm9yLm1lc3NhZ2UgfHwgJ1Vua25vd24gZXJyb3InO1xuICAgICAgICAgICAgYWxlcnQoYEVycm9yIGFzc2lnbmluZyBkcml2ZXI6ICR7ZXJyTXNnfWApO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgc2V0TG9hZGluZyhmYWxzZSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYgKGZldGNoaW5nKSByZXR1cm4gPExvYWRlciAvPjtcblxuICAgIHJldHVybiAoXG4gICAgICAgIDxCb3ggdmFyaWFudD1cIndoaXRlXCIgcGFkZGluZz1cInhsXCIgbWluSGVpZ2h0PVwiNDAwcHhcIj5cbiAgICAgICAgICAgIDxUZXh0IHZhcmlhbnQ9XCJsZ1wiIG1iPVwieGxcIj5cbiAgICAgICAgICAgICAgICBBc3NpZ24gRHJpdmVyIHRvIE9yZGVyIHtyZWNvcmQucGFyYW1zLm9yZGVySWQgfHwgXCJOL0FcIn1cbiAgICAgICAgICAgIDwvVGV4dD5cblxuICAgICAgICAgICAgPEZvcm1Hcm91cD5cbiAgICAgICAgICAgICAgICA8TGFiZWw+U2VsZWN0IERlbGl2ZXJ5IFBhcnRuZXI8L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxTZWxlY3RcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2RyaXZlcnMuZmluZChkID0+IGQudmFsdWUgPT09IHNlbGVjdGVkRHJpdmVySWQpfVxuICAgICAgICAgICAgICAgICAgICBvcHRpb25zPXtkcml2ZXJzfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KHNlbGVjdGVkKSA9PiBzZXRTZWxlY3RlZERyaXZlcklkKHNlbGVjdGVkLnZhbHVlKX1cbiAgICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9Gb3JtR3JvdXA+XG5cbiAgICAgICAgICAgIDxGb3JtR3JvdXAgbXQ9XCJsZ1wiPlxuICAgICAgICAgICAgICAgIDxMYWJlbD5EZWxpdmVyeSBGZWUgKOKCuSk8L0xhYmVsPlxuICAgICAgICAgICAgICAgIDxpbnB1dFxuICAgICAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU9e2RlbGl2ZXJ5RmVlfVxuICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldERlbGl2ZXJ5RmVlKGUudGFyZ2V0LnZhbHVlKX1cbiAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOiAnMTAwJScsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAnOHB4IDEycHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyUmFkaXVzOiAnNHB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCAjQzBDMEMwJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMTRweCdcbiAgICAgICAgICAgICAgICAgICAgfX1cbiAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9XCJFbnRlciBkZWxpdmVyeSBmZWVcIlxuICAgICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICA8L0Zvcm1Hcm91cD5cblxuICAgICAgICAgICAgPEJveCBtdD1cInhsXCI+XG4gICAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgICAgICB2YXJpYW50PVwicHJpbWFyeVwiXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9e2hhbmRsZUFzc2lnbn1cbiAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2xvYWRpbmcgfHwgZHJpdmVycy5sZW5ndGggPT09IDB9XG4gICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgICB7bG9hZGluZyA/ICdBc3NpZ25pbmcuLi4nIDogJ0Fzc2lnbiBEcml2ZXInfVxuICAgICAgICAgICAgICAgIDwvQnV0dG9uPlxuICAgICAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAgICAgIHtkcml2ZXJzLmxlbmd0aCA9PT0gMCAmJiAoXG4gICAgICAgICAgICAgICAgPEJveCBtdD1cImxnXCI+XG4gICAgICAgICAgICAgICAgICAgIDxUZXh0IHZhcmlhbnQ9XCJzbVwiIGNvbG9yPVwicmVkXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBObyBhY3RpdmUgZGVsaXZlcnkgcGFydG5lcnMgZm91bmQuXG4gICAgICAgICAgICAgICAgICAgIDwvVGV4dD5cbiAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICl9XG4gICAgICAgIDwvQm94PlxuICAgICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBBc3NpZ25Ecml2ZXI7XG4iLCJpbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5cbmNvbnN0IFNUQVRVU19TVFlMRVMgPSB7XG4gIGF2YWlsYWJsZTogeyBiZzogXCIjZGJlYWZlXCIsIGNvbG9yOiBcIiMxZDRlZDhcIiwgbGFiZWw6IFwiQUNUSVZFIC0gTkVXXCIgfSxcbiAgYXNzaWduZWQ6IHsgYmc6IFwiI2ZlZjNjN1wiLCBjb2xvcjogXCIjOTI0MDBlXCIsIGxhYmVsOiBcIkFDVElWRSAtIEFTU0lHTkVEXCIgfSxcbiAgY29uZmlybWVkOiB7IGJnOiBcIiNmZmVkZDVcIiwgY29sb3I6IFwiIzlhMzQxMlwiLCBsYWJlbDogXCJBQ1RJVkUgLSBBQ0NFUFRFRFwiIH0sXG4gIGFycml2aW5nOiB7IGJnOiBcIiNlZGU5ZmVcIiwgY29sb3I6IFwiIzViMjFiNlwiLCBsYWJlbDogXCJBQ1RJVkUgLSBPVVQgRk9SIERFTElWRVJZXCIgfSxcbiAgYXRfbG9jYXRpb246IHsgYmc6IFwiI2NmZmFmZVwiLCBjb2xvcjogXCIjMTU1ZTc1XCIsIGxhYmVsOiBcIkFDVElWRSAtIEFUIExPQ0FUSU9OXCIgfSxcbiAgZGVsaXZlcmVkOiB7IGJnOiBcIiNkY2ZjZTdcIiwgY29sb3I6IFwiIzE2NjUzNFwiLCBsYWJlbDogXCJERUxJVkVSRURcIiB9LFxuICBjYW5jZWxsZWQ6IHsgYmc6IFwiI2ZlZTJlMlwiLCBjb2xvcjogXCIjOTkxYjFiXCIsIGxhYmVsOiBcIkNBTkNFTExFRFwiIH0sXG59O1xuXG5jb25zdCBiYXNlQmFkZ2VTdHlsZSA9IHtcbiAgZGlzcGxheTogXCJpbmxpbmUtZmxleFwiLFxuICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICBwYWRkaW5nOiBcIjRweCAxMHB4XCIsXG4gIGJvcmRlclJhZGl1czogXCI5OTlweFwiLFxuICBmb250V2VpZ2h0OiA4MDAsXG4gIGZvbnRTaXplOiBcIjExcHhcIixcbiAgbGV0dGVyU3BhY2luZzogXCIwLjNweFwiLFxuICB3aGl0ZVNwYWNlOiBcIm5vd3JhcFwiLFxufTtcblxuY29uc3Qgbm9ybWFsaXplU3RhdHVzID0gKHN0YXR1cykgPT4gU3RyaW5nKHN0YXR1cyB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuY29uc3QgZ2V0U3RhdHVzQ29uZmlnID0gKHN0YXR1cykgPT4ge1xuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplU3RhdHVzKHN0YXR1cyk7XG4gIHJldHVybiBTVEFUVVNfU1RZTEVTW25vcm1hbGl6ZWRdIHx8IHtcbiAgICBiZzogXCIjZTVlN2ViXCIsXG4gICAgY29sb3I6IFwiIzM3NDE1MVwiLFxuICAgIGxhYmVsOiBub3JtYWxpemVkID8gbm9ybWFsaXplZC50b1VwcGVyQ2FzZSgpIDogXCJVTktOT1dOXCIsXG4gIH07XG59O1xuXG5jb25zdCBPcmRlclN0YXR1c0JhZGdlID0gKHsgcmVjb3JkIH0pID0+IHtcbiAgY29uc3Qgc3RhdHVzID0gcmVjb3JkPy5wYXJhbXM/LnN0YXR1cztcbiAgY29uc3QgY29uZmlnID0gZ2V0U3RhdHVzQ29uZmlnKHN0YXR1cyk7XG5cbiAgcmV0dXJuIChcbiAgICA8c3BhblxuICAgICAgc3R5bGU9e3tcbiAgICAgICAgLi4uYmFzZUJhZGdlU3R5bGUsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogY29uZmlnLmJnLFxuICAgICAgICBjb2xvcjogY29uZmlnLmNvbG9yLFxuICAgICAgfX1cbiAgICA+XG4gICAgICB7Y29uZmlnLmxhYmVsfVxuICAgIDwvc3Bhbj5cbiAgKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE9yZGVyU3RhdHVzQmFkZ2U7XG4iLCJpbXBvcnQgUmVhY3QgZnJvbSBcInJlYWN0XCI7XG5cbmNvbnN0IGJhc2VCYWRnZVN0eWxlID0ge1xuICAgIGRpc3BsYXk6IFwiaW5saW5lLWZsZXhcIixcbiAgICBhbGlnbkl0ZW1zOiBcImNlbnRlclwiLFxuICAgIHBhZGRpbmc6IFwiNHB4IDEwcHhcIixcbiAgICBib3JkZXJSYWRpdXM6IFwiOTk5cHhcIixcbiAgICBmb250V2VpZ2h0OiA4MDAsXG4gICAgZm9udFNpemU6IFwiMTFweFwiLFxuICAgIGxldHRlclNwYWNpbmc6IFwiMC4zcHhcIixcbiAgICB3aGl0ZVNwYWNlOiBcIm5vd3JhcFwiLFxufTtcblxuY29uc3QgRHJpdmVyU3RhdHVzQmFkZ2UgPSAoeyByZWNvcmQgfSkgPT4ge1xuICAgIGNvbnN0IGRyaXZlciA9IHJlY29yZD8ucGFyYW1zPy5kZWxpdmVyeVBhcnRuZXI7XG4gICAgY29uc3QgaXNBc3NpZ25lZCA9ICEhZHJpdmVyO1xuXG4gICAgaWYgKGlzQXNzaWduZWQpIHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxzcGFuXG4gICAgICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAgICAgLi4uYmFzZUJhZGdlU3R5bGUsXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCIjZGNmY2U3XCIsXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yOiBcIiMxNjY1MzRcIixcbiAgICAgICAgICAgICAgICB9fVxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIOKchSBEUklWRVIgQVNTSUdORURcbiAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4gKFxuICAgICAgICA8c3BhblxuICAgICAgICAgICAgc3R5bGU9e3tcbiAgICAgICAgICAgICAgICAuLi5iYXNlQmFkZ2VTdHlsZSxcbiAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwiI2ZlZTJlMlwiLFxuICAgICAgICAgICAgICAgIGNvbG9yOiBcIiM5OTFiMWJcIixcbiAgICAgICAgICAgICAgICBib3JkZXI6IFwiMXB4IHNvbGlkICM5OTFiMWJcIixcbiAgICAgICAgICAgIH19XG4gICAgICAgID5cbiAgICAgICAgICAgIPCfmqggTk9UIEFTU0lHTkVEXG4gICAgICAgIDwvc3Bhbj5cbiAgICApO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgRHJpdmVyU3RhdHVzQmFkZ2U7XG4iLCJpbXBvcnQgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQm94LCBIMiwgVGV4dCwgVGFibGUsIFRhYmxlSGVhZCwgVGFibGVSb3csIFRhYmxlQ2VsbCwgVGFibGVCb2R5LCBCYWRnZSB9IGZyb20gJ0BhZG1pbmpzL2Rlc2lnbi1zeXN0ZW0nO1xuXG5jb25zdCBHVUlERVMgPSBbXG4gIC8vIC0tLSBTVEFOREFSRCBDT0xMRUNUSU9OUyAtLS1cbiAge1xuICAgIHR5cGU6IFwiUFJPRFVDVF9TQ1JPTExFUlwiLFxuICAgIG5hbWU6IFwiUHJvZHVjdCBIb3Jpem9udGFsIFNjcm9sbGVyXCIsXG4gICAgZGVzYzogXCJUcmFkaXRpb25hbCBzd2FwcGFibGUgbGlzdCBvZiBwcm9kdWN0cy5cIixcbiAgICBtYXBwaW5nOiB7XG4gICAgICBcIlByb2R1Y3RzXCI6IFwiVGhlIGl0ZW1zIHNob3duIGluIHRoZSBob3Jpem9udGFsIGxpc3RcIixcbiAgICAgIFwiVGl0bGVcIjogXCJNYWluIGhlYWRlciBmb3IgdGhlIHNjcm9sbGVyXCIsXG4gICAgICBcIlRoZW1lIENvbG9yXCI6IFwiQmFja2dyb3VuZCBjb2xvciBmb3IgdGhlIHNjcm9sbGVyIHNlY3Rpb25cIlxuICAgIH0sXG4gICAgdXNlZDogW1wiVGl0bGVcIiwgXCJTdWJUaXRsZVwiLCBcIkJ1dHRvbiBUZXh0XCIsIFwiVGhlbWVcIiwgXCJQcm9kdWN0c1wiXSxcbiAgICBpZ25vcmVkOiBbXCJCYW5uZXJcIiwgXCJDYXJvdXNlbFwiLCBcIkJpZy9NaW5pIERlYWxzXCIsIFwiU2VjdGlvbnNcIl1cbiAgfSxcbiAge1xuICAgIHR5cGU6IFwiUFJPRFVDVF9HUklEXCIsXG4gICAgbmFtZTogXCJNb2Rlcm4gUHJvZHVjdCBHcmlkXCIsXG4gICAgZGVzYzogXCJXcmFwLWFyb3VuZCB2ZXJ0aWNhbCBncmlkICh1c3VhbGx5IDIgY29sdW1ucykuXCIsXG4gICAgbWFwcGluZzoge1xuICAgICAgXCJQcm9kdWN0c1wiOiBcIlByb2R1Y3RzIGZpbGxpbmcgdGhlIGdyaWRcIixcbiAgICAgIFwiQnV0dG9uIFRleHRcIjogXCJUZXh0IGZvciB0aGUgJ1ZpZXcgTW9yZScgc3R5bGUgYnV0dG9uXCJcbiAgICB9LFxuICAgIHVzZWQ6IFtcIlRpdGxlXCIsIFwiU3ViVGl0bGVcIiwgXCJCdXR0b24gVGV4dFwiLCBcIlRoZW1lXCIsIFwiUHJvZHVjdHNcIl0sXG4gICAgaWdub3JlZDogW1wiQmFubmVyXCIsIFwiQ2Fyb3VzZWxcIiwgXCJCaWcvTWluaSBEZWFsc1wiLCBcIlNlY3Rpb25zXCJdXG4gIH0sXG4gIHtcbiAgICB0eXBlOiBcIlBST0RVQ1RfR1JJRF8zWDJcIixcbiAgICBuYW1lOiBcIkVsZWdhbnQgM3gyIFByb2R1Y3QgR3JpZFwiLFxuICAgIGRlc2M6IFwiQSBjb21wYWN0IDMtY29sdW1uLCAyLXJvdyBncmlkIGZvciB2YXJpZXR5LlwiLFxuICAgIG1hcHBpbmc6IHtcbiAgICAgIFwiUHJvZHVjdHNcIjogXCJGaWxscyB0aGUgNiBzbG90cyBpbiB0aGUgZ3JpZCAoMyBjb2x1bW5zIHggMiByb3dzKVwiXG4gICAgfSxcbiAgICB1c2VkOiBbXCJUaXRsZVwiLCBcIlN1YlRpdGxlXCIsIFwiUHJvZHVjdHNcIl0sXG4gICAgaWdub3JlZDogW1wiQmFubmVyXCIsIFwiQ2Fyb3VzZWxcIiwgXCJCaWcvTWluaSBEZWFsc1wiLCBcIlNlY3Rpb25zXCJdXG4gIH0sXG4gIHtcbiAgICB0eXBlOiBcIlNUT1JZX1NUUklQXCIsXG4gICAgbmFtZTogXCJJbnN0YWdyYW0tU3R5bGUgU3RvcnkgU3RyaXBcIixcbiAgICBkZXNjOiBcIkNpcmN1bGFyIGljb25zIHVzZWQgZm9yIHF1aWNrIG5hdmlnYXRpb24gb3IgaGlnaGxpZ2h0cy5cIixcbiAgICBtYXBwaW5nOiB7XG4gICAgICBcIlByb2R1Y3RzXCI6IFwiRWFjaCBwcm9kdWN0IGJlY29tZXMgYSBjaXJjdWxhciAnU3RvcnknIGNpcmNsZSBzaG93aW5nIHRoZSBwcm9kdWN0IGltYWdlXCJcbiAgICB9LFxuICAgIHVzZWQ6IFtcIlByb2R1Y3RzXCIsIFwiVGl0bGVcIiwgXCJUaGVtZVwiXSxcbiAgICBpZ25vcmVkOiBbXCJTdWJUaXRsZVwiLCBcIkJhbm5lclwiLCBcIkNhcm91c2VsXCIsIFwiQmlnL01pbmkgRGVhbHNcIiwgXCJTZWN0aW9uc1wiXVxuICB9LFxuICB7XG4gICAgdHlwZTogXCJDQVRFR09SWV9TVFJJUFwiLFxuICAgIG5hbWU6IFwiQ2F0ZWdvcnkgU3RyaXBcIixcbiAgICBkZXNjOiBcIkEgaG9yaXpvbnRhbCBzdHJpcCBvZiBjYXRlZ29yaWVzL2l0ZW1zLlwiLFxuICAgIG1hcHBpbmc6IHtcbiAgICAgIFwiQ2F0ZWdvcmllc1wiOiBcIlRoZSBsaXN0IG9mIHN1Yi1jYXRlZ29yaWVzIHRvIGRpc3BsYXlcIlxuICAgIH0sXG4gICAgdXNlZDogW1wiQ2F0ZWdvcmllc1wiXSxcbiAgICBpZ25vcmVkOiBbXCJUaXRsZVwiLCBcIlN1YlRpdGxlXCIsIFwiQmFubmVyXCIsIFwiQ2Fyb3VzZWxcIiwgXCJCaWcvTWluaSBEZWFsc1wiLCBcIlNlY3Rpb25zXCJdXG4gIH0sXG5cbiAgLy8gLS0tIFNQRUNJQUxJWkVEIEdSSURTIC0tLVxuICB7XG4gICAgdHlwZTogXCJCRU5UT19HUklEXCIsXG4gICAgbmFtZTogXCJQcmVtaXVtIEJlbnRvIEdyaWRcIixcbiAgICBkZXNjOiBcIk1vZGVybiBsYXlvdXQgd2l0aCAxIExhcmdlIGl0ZW0gYW5kIDIgU21hbGwgaXRlbXMuXCIsXG4gICAgbWFwcGluZzoge1xuICAgICAgXCJCaWcgRGVhbFwiOiBcIlRoZSBtYWluIGZvY3VzIHByb2R1Y3QgKExhcmdlIENhcmQpXCIsXG4gICAgICBcIk1pbmkgRGVhbHNcIjogXCJTdXBwb3J0aW5nIHByb2R1Y3RzICgyIFNtYWxsIENhcmRzIG9uIHRoZSByaWdodClcIlxuICAgIH0sXG4gICAgdXNlZDogW1wiVGl0bGVcIiwgXCJTdWJUaXRsZVwiLCBcIkJ1dHRvbiBUZXh0XCIsIFwiVGhlbWVcIiwgXCJCaWcgRGVhbCAoTGFyZ2UpXCIsIFwiTWluaSBEZWFscyAoU21hbGwgeDIpXCJdLFxuICAgIGlnbm9yZWQ6IFtcIlByb2R1Y3RzXCIsIFwiQmFubmVyXCIsIFwiQ2Fyb3VzZWxcIiwgXCJTZWN0aW9uc1wiXVxuICB9LFxuICB7XG4gICAgdHlwZTogXCJBSVNMRV8yWDJfR1JJRFwiLFxuICAgIG5hbWU6IFwiQWlzbGUgMngyIFByb2R1Y3QgR3JpZFwiLFxuICAgIGRlc2M6IFwiQ29tYmluYXRpb24gb2YgYSBjYXRlZ29yeSBzdHJpcCBhbmQgYSBwcm9kdWN0IGdyaWQuXCIsXG4gICAgbWFwcGluZzoge1xuICAgICAgXCJDYXRlZ29yaWVzXCI6IFwiQ2F0ZWdvcmllcyBzaG93biBpbiB0aGUgdG9wIGhvcml6b250YWwgbGlzdFwiLFxuICAgICAgXCJQcm9kdWN0c1wiOiBcIlByb2R1Y3RzIHNob3duIGluIHRoZSAyeDIgZ3JpZCBiZWxvdyB0aGUgY2F0ZWdvcmllc1wiXG4gICAgfSxcbiAgICB1c2VkOiBbXCJUaXRsZVwiLCBcIlN1YlRpdGxlXCIsIFwiQ2F0ZWdvcmllc1wiLCBcIlByb2R1Y3RzXCIsIFwiVGhlbWVcIl0sXG4gICAgaWdub3JlZDogW1wiQmFubmVyXCIsIFwiQ2Fyb3VzZWxcIiwgXCJCaWcvTWluaSBEZWFsc1wiLCBcIlNlY3Rpb25zXCJdXG4gIH0sXG4gIHtcbiAgICB0eXBlOiBcIkNBVEVHT1JZX0NMVVNURVJTXCIsXG4gICAgbmFtZTogXCIyeDIgRHluYW1pYyBDYXRlZ29yeSBHcmlkXCIsXG4gICAgZGVzYzogXCJTaG93cyA0IGl0ZW1zIGluIGEgMngyIGdyaWQgd2l0aCBhbiBvcHRpb25hbCBiYW5uZXIgc2lkZS5cIixcbiAgICBtYXBwaW5nOiB7XG4gICAgICBcIlByb2R1Y3RzXCI6IFwiVGhlIDQgcHJvZHVjdHMgc2hvd24gaW4gdGhlIGdyaWRcIixcbiAgICAgIFwiQmFubmVyIEltYWdlXCI6IFwiT3B0aW9uYWwgYmFubmVyIHNob3duIGFsb25nc2lkZSB0aGUgZ3JpZFwiXG4gICAgfSxcbiAgICB1c2VkOiBbXCJUaXRsZVwiLCBcIlN1YlRpdGxlXCIsIFwiQnV0dG9uIFRleHRcIiwgXCJUaGVtZVwiLCBcIlByb2R1Y3RzIChVcCB0byA0KVwiLCBcIkJhbm5lciBJbWFnZVwiXSxcbiAgICBpZ25vcmVkOiBbXCJDYXJvdXNlbFwiLCBcIkJpZy9NaW5pIERlYWxzXCIsIFwiU2VjdGlvbnNcIl1cbiAgfSxcbiAge1xuICAgIHR5cGU6IFwiQ0FURUdPUllfR1JJRF9GT1VSX0lNQUdFU1wiLFxuICAgIG5hbWU6IFwiQ2F0ZWdvcnkgMngyIEltYWdlIEdyaWRcIixcbiAgICBkZXNjOiBcIkEgZ3JpZCB3aGVyZSBlYWNoIGNhdGVnb3J5IHNob3dzIDQgc21hbGwgcHJvZHVjdCBwcmV2aWV3cy5cIixcbiAgICBtYXBwaW5nOiB7XG4gICAgICBcIkNhdGVnb3JpZXNcIjogXCJUaGUgc3ViLWNhdGVnb3JpZXMgdXNlZCB0byBidWlsZCB0aGUgaW1hZ2UgZ3JpZHNcIlxuICAgIH0sXG4gICAgdXNlZDogW1wiVGl0bGVcIiwgXCJTdWJUaXRsZVwiLCBcIkNhdGVnb3JpZXNcIl0sXG4gICAgaWdub3JlZDogW1wiUHJvZHVjdHNcIiwgXCJCYW5uZXJcIiwgXCJDYXJvdXNlbFwiLCBcIkJpZy9NaW5pIERlYWxzXCIsIFwiU2VjdGlvbnNcIl1cbiAgfSxcbiAge1xuICAgIHR5cGU6IFwiR1JPQ0VSWV9MSVNUXzJYM1wiLFxuICAgIG5hbWU6IFwiR3JvY2VyeSBMaXN0IDJ4MyBHcmlkXCIsXG4gICAgZGVzYzogXCJBIDJ4MyBsYXlvdXQgc3BlY2lmaWNhbGx5IGZvciBjYXRlZ29yeSBjb2xsZWN0aW9ucy5cIixcbiAgICBtYXBwaW5nOiB7XG4gICAgICBcIkNhdGVnb3JpZXNcIjogXCJGaWxscyB0aGUgNiBzbG90cyAoMiBjb2x1bW5zIHggMyByb3dzKVwiXG4gICAgfSxcbiAgICB1c2VkOiBbXCJUaXRsZVwiLCBcIlN1YlRpdGxlXCIsIFwiQ2F0ZWdvcmllc1wiXSxcbiAgICBpZ25vcmVkOiBbXCJQcm9kdWN0c1wiLCBcIkJhbm5lclwiLCBcIkNhcm91c2VsXCIsIFwiQmlnL01pbmkgRGVhbHNcIiwgXCJTZWN0aW9uc1wiXVxuICB9LFxuXG4gIC8vIC0tLSBNRURJQSAmIFBST01PIC0tLVxuICB7XG4gICAgdHlwZTogXCJNSU5JX1ZJREVPXCIsXG4gICAgbmFtZTogXCJGbG9hdGluZyBNaW5pIFZpZGVvXCIsXG4gICAgZGVzYzogXCJBbiBhdXRvLXBsYXlpbmcgdmlkZW8gcHJvbW90aW9uLlwiLFxuICAgIG1hcHBpbmc6IHtcbiAgICAgIFwiVXBsb2FkIFZpZGVvXCI6IFwiVGhlIE1QNCBmaWxlIGZvciB0aGUgZmxvYXRpbmcgdmlkZW9cIixcbiAgICAgIFwiVmlkZW8gVGh1bWJuYWlsXCI6IFwiUG9zdGVyIGltYWdlIHNob3duIGJlZm9yZSB0aGUgdmlkZW8gcGxheXNcIixcbiAgICAgIFwiQmFubmVyIEltYWdlXCI6IFwiU3RhdGljIGJhY2tncm91bmQgaWYgdmlkZW8gaXMgbm90IHN1cHBvcnRlZFwiXG4gICAgfSxcbiAgICB1c2VkOiBbXCJUaXRsZVwiLCBcIlN1YlRpdGxlXCIsIFwiVXBsb2FkIFZpZGVvXCIsIFwiVmlkZW8gVGh1bWJuYWlsXCIsIFwiQmFubmVyIEltYWdlXCJdLFxuICAgIGlnbm9yZWQ6IFtcIlByb2R1Y3RzXCIsIFwiQ2Fyb3VzZWxcIiwgXCJCaWcvTWluaSBEZWFsc1wiLCBcIlNlY3Rpb25zXCJdXG4gIH0sXG4gIHtcbiAgICB0eXBlOiBcIlBST01PVElPTl9QQUdJTkFUSU9OXCIsXG4gICAgbmFtZTogXCJQcm9tbyB3aXRoIDQtRG90cyBQYWdpbmF0aW9uXCIsXG4gICAgZGVzYzogXCJMYXJnZSBjYXJkIGRlc2lnbiBmb3IgZmVhdHVyZWQgZXZlbnRzIG9yIGRlYWxzLlwiLFxuICAgIG1hcHBpbmc6IHtcbiAgICAgIFwiUHJvZHVjdHNcIjogXCJUaGUgcHJpbWFyeSBwcm9kdWN0IGJlaW5nIHByb21vdGVkXCJcbiAgICB9LFxuICAgIHVzZWQ6IFtcIlRpdGxlXCIsIFwiU3ViVGl0bGVcIiwgXCJQcm9kdWN0c1wiLCBcIlRoZW1lXCJdLFxuICAgIGlnbm9yZWQ6IFtcIkJhbm5lclwiLCBcIkNhcm91c2VsXCIsIFwiQmlnL01pbmkgRGVhbHNcIiwgXCJTZWN0aW9uc1wiXVxuICB9LFxuICB7XG4gICAgdHlwZTogXCJQUk9NT19CQU5ORVJcIixcbiAgICBuYW1lOiBcIlByb21vdGlvbmFsIEJhbm5lclwiLFxuICAgIGRlc2M6IFwiU3RhdGljIGhpZ2gtcXVhbGl0eSBiYW5uZXIgZm9yIGFkcy5cIixcbiAgICBtYXBwaW5nOiB7XG4gICAgICBcIlVwbG9hZCBCYW5uZXJcIjogXCJUaGUgbWFpbiBncmFwaGljIGltYWdlXCIsXG4gICAgICBcIkJ1dHRvbiBUZXh0XCI6IFwiTGFiZWwgZm9yIHRoZSBiYW5uZXIncyBjYWxsLXRvLWFjdGlvblwiXG4gICAgfSxcbiAgICB1c2VkOiBbXCJVcGxvYWQgQmFubmVyXCIsIFwiQnV0dG9uIFRleHRcIiwgXCJUaGVtZVwiXSxcbiAgICBpZ25vcmVkOiBbXCJUaXRsZVwiLCBcIlN1YlRpdGxlXCIsIFwiUHJvZHVjdHNcIiwgXCJDYXJvdXNlbFwiLCBcIkJpZy9NaW5pIERlYWxzXCIsIFwiU2VjdGlvbnNcIl1cbiAgfSxcbiAge1xuICAgIHR5cGU6IFwiSU1BR0VfQ0FST1VTRUxcIixcbiAgICBuYW1lOiBcIkltYWdlIENhcm91c2VsIFNsaWRlclwiLFxuICAgIGRlc2M6IFwiQXV0by1zbGlkaW5nIGNvbGxlY3Rpb24gb2YgYmFubmVyIGltYWdlcy5cIixcbiAgICBtYXBwaW5nOiB7XG4gICAgICBcIkNhcm91c2VsIEltYWdlc1wiOiBcIkFycmF5IG9mIFVSTHMgdG8gdmFsaWQgaW1hZ2UgZmlsZXNcIlxuICAgIH0sXG4gICAgdXNlZDogW1wiVGl0bGVcIiwgXCJDYXJvdXNlbCBJbWFnZXMgKEFycmF5KVwiLCBcIlRoZW1lIChPcHRpb25hbClcIl0sXG4gICAgaWdub3JlZDogW1wiUHJvZHVjdHNcIiwgXCJCYW5uZXJcIiwgXCJCaWcvTWluaSBEZWFsc1wiLCBcIlNlY3Rpb25zXCJdXG4gIH0sXG5cbiAgLy8gLS0tIElOVEVSQUNUSVZFIC0tLVxuICB7XG4gICAgdHlwZTogXCJUUklQTEVfU0VDVElPTl9HUklEXCIsXG4gICAgbmFtZTogXCJUcmlwbGUgU2VjdGlvbiBQYWdlclwiLFxuICAgIGRlc2M6IFwiU3dpcGVhYmxlIHBhZ2VzIHdpdGggZGlzdGluY3QgY29sbGVjdGlvbnMuXCIsXG4gICAgbWFwcGluZzoge1xuICAgICAgXCJTZWN0aW9uc1wiOiBcIlJlcXVpcmVzIEVYQUNUTFkgMyBzZWN0aW9ucy4gRWFjaCBuZWVkczogVGl0bGUsIENvbG9yLCBhbmQgUHJvZHVjdHMuXCIsXG4gICAgICBcIlRoZW1lIE1vZGVcIjogXCJTZXQgdG8gJ2dsYXNzJyBmb3IgcHJlbWl1bSBibHVycmVkIGVmZmVjdHNcIlxuICAgIH0sXG4gICAgdXNlZDogW1wiVGl0bGUgKE1haW4pXCIsIFwiVGhlbWUgTW9kZVwiLCBcIlNlY3Rpb25zIChOZWVkcyAzIGVudHJpZXMpXCJdLFxuICAgIGlnbm9yZWQ6IFtcIlN1YlRpdGxlXCIsIFwiQnV0dG9uIFRleHRcIiwgXCJUaGVtZSBDb2xvclwiLCBcIkJhbm5lclwiLCBcIkNhcm91c2VsXCIsIFwiQmlnL01pbmkgRGVhbHNcIiwgXCJQcm9kdWN0cyAoR2VuZXJhbClcIl1cbiAgfSxcblxuICAvLyAtLS0gRkVTVElWRSAvIEhFUk8gLS0tXG4gIHtcbiAgICB0eXBlOiBcIkdSQURJRU5UX0hFUk9cIixcbiAgICBuYW1lOiBcIkhpZ2gtSW1wYWN0IEdyYWRpZW50IEhlcm9cIixcbiAgICBkZXNjOiBcIlByaW1hcnkgZW50cnkgc2VjdGlvbiB3aXRoIGxhcmdlIGdyYXBoaWNzLlwiLFxuICAgIG1hcHBpbmc6IHtcbiAgICAgIFwiQmFubmVyIEltYWdlXCI6IFwiTGFyZ2UgYmFja2dyb3VuZCBncmFwaGljXCIsXG4gICAgICBcIlByb2R1Y3RzXCI6IFwiRmVhdHVyZWQgaXRlbXMgb3ZlcmxheWluZyB0aGUgaGVyb1wiXG4gICAgfSxcbiAgICB1c2VkOiBbXCJUaXRsZVwiLCBcIlN1YlRpdGxlXCIsIFwiQnV0dG9uIFRleHRcIiwgXCJUaGVtZVwiLCBcIlByb2R1Y3RzXCIsIFwiQmFubmVyIEltYWdlXCJdLFxuICAgIGlnbm9yZWQ6IFtcIkNhcm91c2VsXCIsIFwiQmlnL01pbmkgRGVhbHNcIiwgXCJTZWN0aW9uc1wiXVxuICB9LFxuICB7XG4gICAgdHlwZTogXCJSQU1aQU5fU1BFQ0lBTCAvIFNQRUNJQUwyXCIsXG4gICAgbmFtZTogXCJGZXN0aXZlIFJhbXphbiBMYXlvdXRzXCIsXG4gICAgZGVzYzogXCJDdWx0dXJhbC9UaGVtZWQgbGF5b3V0cyB3aXRoIHNwZWNpYWxpemVkIHZpc3VhbCBlZmZlY3RzLlwiLFxuICAgIG1hcHBpbmc6IHtcbiAgICAgIFwiUHJvZHVjdHNcIjogXCJQcm9kdWN0cyBsaXN0IHNob3duIHdpdGhpbiB0aGUgZmVzdGl2ZSB0aGVtZVwiLFxuICAgICAgXCJUaGVtZSBNb2RlXCI6IFwiQmVzdCB1c2VkIHdpdGggJ2dsYXNzJyBtb2RlXCJcbiAgICB9LFxuICAgIHVzZWQ6IFtcIlRpdGxlXCIsIFwiU3ViVGl0bGVcIiwgXCJQcm9kdWN0c1wiLCBcIlRoZW1lIE1vZGVcIl0sXG4gICAgaWdub3JlZDogW1wiQmFubmVyXCIsIFwiQ2Fyb3VzZWxcIiwgXCJCaWcvTWluaSBEZWFsc1wiLCBcIlNlY3Rpb25zXCJdXG4gIH0sXG4gIHtcbiAgICB0eXBlOiBcIkRJV0FMSV9TUEVDSUFMIC8gSEFQUFlfSE9MSSAvIENIUklTVE1BUy4uLlwiLFxuICAgIG5hbWU6IFwiSG9saWRheSBUaGVtZWQgR3JpZHNcIixcbiAgICBkZXNjOiBcIlNlYXNvbmFsIGxheW91dHMgZm9yIHNwZWNpYWwgZXZlbnRzLlwiLFxuICAgIG1hcHBpbmc6IHtcbiAgICAgIFwiUHJvZHVjdHNcIjogXCJBY3RpdmUgcHJvZHVjdHMgZm9yIHRoZSBob2xpZGF5XCIsXG4gICAgICBcIkJhbm5lciBJbWFnZVwiOiBcIk9wdGlvbmFsIHNlYXNvbmFsIGJhY2tncm91bmQvaGVyb1wiXG4gICAgfSxcbiAgICB1c2VkOiBbXCJUaXRsZVwiLCBcIlN1YlRpdGxlXCIsIFwiUHJvZHVjdHNcIiwgXCJCYW5uZXIgSW1hZ2VcIiwgXCJUaGVtZSBNb2RlXCJdLFxuICAgIGlnbm9yZWQ6IFtcIkNhcm91c2VsXCIsIFwiQmlnL01pbmkgRGVhbHNcIiwgXCJTZWN0aW9uc1wiXVxuICB9XG5dO1xuXG5jb25zdCBDb21wb25lbnRHdWlkZSA9ICgpID0+IHtcbiAgICByZXR1cm4gKFxuICAgICAgICA8Qm94IHZhcmlhbnQ9XCJ3aGl0ZVwiIGZsZXggZmxleERpcmVjdGlvbj1cImNvbHVtblwiIG14PVwiYXV0b1wiIHA9XCJ4bFwiIHN0eWxlPXt7IG1heFdpZHRoOiAxMjAwLCBtYXJnaW5Ub3A6IDQwLCBtYXJnaW5Cb3R0b206IDQwLCBib3JkZXJSYWRpdXM6IDEyLCBib3hTaGFkb3c6ICcwIDRweCAyMHB4IHJnYmEoMCwwLDAsMC4wOCknIH19PlxuICAgICAgICAgICAgPEJveCBtYj1cInhsXCI+XG4gICAgICAgICAgICAgIDxIMj5Ib21lIENvbXBvbmVudCBCdWlsZGVyIEd1aWRlPC9IMj5cbiAgICAgICAgICAgICAgPFRleHQgY29sb3I9XCJncmV5NjBcIiBtYj1cImxnXCI+XG4gICAgICAgICAgICAgICAgICBUaGlzIGNoZWF0IHNoZWV0IGV4cGxhaW5zIGhvdyB0byBjb25maWd1cmUgYWxsIDIyIGNvbXBvbmVudCB0eXBlcy4gXG4gICAgICAgICAgICAgICAgICBUaGUgUGFnZSBCdWlsZGVyIGlzIFwic21hcnRcIuKAlGl0IGhpZGVzIGZpZWxkcyB0aGF0IGFyZW4ndCBuZWVkZWQgZm9yIHlvdXIgc2VsZWN0ZWQgdHlwZS5cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG5cbiAgICAgICAgICAgIDxUYWJsZT5cbiAgICAgICAgICAgICAgICA8VGFibGVIZWFkPlxuICAgICAgICAgICAgICAgICAgICA8VGFibGVSb3c+XG4gICAgICAgICAgICAgICAgICAgICAgICA8VGFibGVDZWxsIHdpZHRoPVwiMjUlXCI+Q29tcG9uZW50IFR5cGU8L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgd2lkdGg9XCIyNSVcIj5EZXNjcmlwdGlvbjwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbCB3aWR0aD1cIjMwJVwiPvCfjq8gRmllbGQgTWFwcGluZyAoU21hcnQgSGVscGVycyk8L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGwgd2lkdGg9XCIyMCVcIj7inIUgVmlzaWJsZSBGaWVsZHM8L1RhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgPC9UYWJsZVJvdz5cbiAgICAgICAgICAgICAgICA8L1RhYmxlSGVhZD5cbiAgICAgICAgICAgICAgICA8VGFibGVCb2R5PlxuICAgICAgICAgICAgICAgICAgICB7R1VJREVTLm1hcCgoZywgaSkgPT4gKFxuICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlUm93IGtleT17aX0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRleHQgZm9udFdlaWdodD1cImJvbGRcIiBjb2xvcj1cInByaW1hcnkxMDBcIj57Zy5uYW1lfTwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPEJhZGdlIHNpemU9XCJzbVwiIHZhcmlhbnQ9XCJpbmZvXCIgc3R5bGU9e3sgdGV4dFRyYW5zZm9ybTogJ25vbmUnLCBtYXJnaW5Ub3A6IDQgfX0+e2cudHlwZX08L0JhZGdlPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IHZhcmlhbnQ9XCJzbVwiPntnLmRlc2N9PC9UZXh0PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtPYmplY3QuZW50cmllcyhnLm1hcHBpbmcpLm1hcCgoW2ZpZWxkLCBoZWxwXSwgbWkpID0+IChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Qm94IGtleT17bWl9IG1iPVwic21cIiBwPVwieHNcIiBzdHlsZT17eyBiYWNrZ3JvdW5kOiAnI2Y5ZmFmYicsIGJvcmRlclJhZGl1czogNCwgYm9yZGVyTGVmdDogJzNweCBzb2xpZCAjNzAzM2ZmJyB9fT5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxUZXh0IHZhcmlhbnQ9XCJzbVwiIGZvbnRXZWlnaHQ9XCJib2xkXCI+e2ZpZWxkfTo8L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGV4dCB2YXJpYW50PVwic21cIiBjb2xvcj1cImdyZXk2MFwiPntoZWxwfTwvVGV4dD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L0JveD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZUNlbGw+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPFRhYmxlQ2VsbD5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge2cudXNlZC5tYXAoKHUsIHVpKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8QmFkZ2Uga2V5PXt1aX0gc2l6ZT1cInNtXCIgdmFyaWFudD1cInN1Y2Nlc3NcIiBtYj1cInhzXCIgbXI9XCJ4c1wiPnt1fTwvQmFkZ2U+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICkpfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8Qm94IG10PVwic21cIj5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8VGV4dCB2YXJpYW50PVwieHNcIiBjb2xvcj1cImdyZXk0MFwiPklnbm9yZWQ6IHtnLmlnbm9yZWQuc2xpY2UoMCwgMykuam9pbignLCAnKX0uLi48L1RleHQ+XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvQm94PlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvVGFibGVDZWxsPlxuICAgICAgICAgICAgICAgICAgICAgICAgPC9UYWJsZVJvdz5cbiAgICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9UYWJsZUJvZHk+XG4gICAgICAgICAgICA8L1RhYmxlPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICA8Qm94IG10PVwieGxcIiBwPVwibGdcIiBzdHlsZT17eyBiYWNrZ3JvdW5kOiAnI2VmZjZmZicsIGJvcmRlclJhZGl1czogOCwgYm9yZGVyOiAnMXB4IHNvbGlkICNiZmRiZmUnIH19PlxuICAgICAgICAgICAgICA8VGV4dCBmb250V2VpZ2h0PVwiYm9sZFwiIGNvbG9yPVwiIzFlNDBhZlwiPvCfkqEgUHJvIFRpcDo8L1RleHQ+XG4gICAgICAgICAgICAgIDxUZXh0IHZhcmlhbnQ9XCJzbVwiIGNvbG9yPVwiIzFlNDBhZlwiPlxuICAgICAgICAgICAgICAgIElmIHlvdSBwcm92aWRlIGEgZmllbGQgdGhhdCBpcyBtYXJrZWQgYXMg4p2MIElnbm9yZWQgZm9yIGEgc3BlY2lmaWMgdHlwZSwgaXQgd29uJ3QgYnJlYWsgYW55dGhpbmchIFxuICAgICAgICAgICAgICAgIFRoZSBmaWVsZCB3aWxsIHNpbXBseSBiZSBpZ25vcmVkIGJ5IHRoZSBhcHAncyByZW5kZXJpbmcgZW5naW5lIGZvciB0aGF0IHNwZWNpZmljIGNvbXBvbmVudC5cbiAgICAgICAgICAgICAgPC9UZXh0PlxuICAgICAgICAgICAgPC9Cb3g+XG4gICAgICAgIDwvQm94PlxuICAgICk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnRHdWlkZTtcbiIsImltcG9ydCB7IERyb3Bab25lLCBEcm9wWm9uZUl0ZW0sIEZvcm1Hcm91cCwgTGFiZWwgfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcbmltcG9ydCB7IGZsYXQsIHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAnYWRtaW5qcyc7XG5pbXBvcnQgUmVhY3QsIHsgdXNlRWZmZWN0LCB1c2VTdGF0ZSB9IGZyb20gJ3JlYWN0JztcbmNvbnN0IEVkaXQgPSAoeyBwcm9wZXJ0eSwgcmVjb3JkLCBvbkNoYW5nZSB9KSA9PiB7XG4gICAgY29uc3QgeyB0cmFuc2xhdGVQcm9wZXJ0eSB9ID0gdXNlVHJhbnNsYXRpb24oKTtcbiAgICBjb25zdCB7IHBhcmFtcyB9ID0gcmVjb3JkO1xuICAgIGNvbnN0IHsgY3VzdG9tIH0gPSBwcm9wZXJ0eTtcbiAgICBjb25zdCBwYXRoID0gZmxhdC5nZXQocGFyYW1zLCBjdXN0b20uZmlsZVBhdGhQcm9wZXJ0eSk7XG4gICAgY29uc3Qga2V5ID0gZmxhdC5nZXQocGFyYW1zLCBjdXN0b20ua2V5UHJvcGVydHkpO1xuICAgIGNvbnN0IGZpbGUgPSBmbGF0LmdldChwYXJhbXMsIGN1c3RvbS5maWxlUHJvcGVydHkpO1xuICAgIGNvbnN0IFtvcmlnaW5hbEtleSwgc2V0T3JpZ2luYWxLZXldID0gdXNlU3RhdGUoa2V5KTtcbiAgICBjb25zdCBbZmlsZXNUb1VwbG9hZCwgc2V0RmlsZXNUb1VwbG9hZF0gPSB1c2VTdGF0ZShbXSk7XG4gICAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAgICAgLy8gaXQgbWVhbnMgbWVhbnMgdGhhdCBzb21lb25lIGhpdCBzYXZlIGFuZCBuZXcgZmlsZSBoYXMgYmVlbiB1cGxvYWRlZFxuICAgICAgICAvLyBpbiB0aGlzIGNhc2UgZmxpZXNUb1VwbG9hZCBzaG91bGQgYmUgY2xlYXJlZC5cbiAgICAgICAgLy8gVGhpcyBoYXBwZW5zIHdoZW4gdXNlciB0dXJucyBvZmYgcmVkaXJlY3QgYWZ0ZXIgbmV3L2VkaXRcbiAgICAgICAgaWYgKCh0eXBlb2Yga2V5ID09PSAnc3RyaW5nJyAmJiBrZXkgIT09IG9yaWdpbmFsS2V5KVxuICAgICAgICAgICAgfHwgKHR5cGVvZiBrZXkgIT09ICdzdHJpbmcnICYmICFvcmlnaW5hbEtleSlcbiAgICAgICAgICAgIHx8ICh0eXBlb2Yga2V5ICE9PSAnc3RyaW5nJyAmJiBBcnJheS5pc0FycmF5KGtleSkgJiYga2V5Lmxlbmd0aCAhPT0gb3JpZ2luYWxLZXkubGVuZ3RoKSkge1xuICAgICAgICAgICAgc2V0T3JpZ2luYWxLZXkoa2V5KTtcbiAgICAgICAgICAgIHNldEZpbGVzVG9VcGxvYWQoW10pO1xuICAgICAgICB9XG4gICAgfSwgW2tleSwgb3JpZ2luYWxLZXldKTtcbiAgICBjb25zdCBvblVwbG9hZCA9IChmaWxlcykgPT4ge1xuICAgICAgICBzZXRGaWxlc1RvVXBsb2FkKGZpbGVzKTtcbiAgICAgICAgb25DaGFuZ2UoY3VzdG9tLmZpbGVQcm9wZXJ0eSwgZmlsZXMpO1xuICAgIH07XG4gICAgY29uc3QgaGFuZGxlUmVtb3ZlID0gKCkgPT4ge1xuICAgICAgICBvbkNoYW5nZShjdXN0b20uZmlsZVByb3BlcnR5LCBudWxsKTtcbiAgICB9O1xuICAgIGNvbnN0IGhhbmRsZU11bHRpUmVtb3ZlID0gKHNpbmdsZUtleSkgPT4ge1xuICAgICAgICBjb25zdCBpbmRleCA9IChmbGF0LmdldChyZWNvcmQucGFyYW1zLCBjdXN0b20ua2V5UHJvcGVydHkpIHx8IFtdKS5pbmRleE9mKHNpbmdsZUtleSk7XG4gICAgICAgIGNvbnN0IGZpbGVzVG9EZWxldGUgPSBmbGF0LmdldChyZWNvcmQucGFyYW1zLCBjdXN0b20uZmlsZXNUb0RlbGV0ZVByb3BlcnR5KSB8fCBbXTtcbiAgICAgICAgaWYgKHBhdGggJiYgcGF0aC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBuZXdQYXRoID0gcGF0aC5tYXAoKGN1cnJlbnRQYXRoLCBpKSA9PiAoaSAhPT0gaW5kZXggPyBjdXJyZW50UGF0aCA6IG51bGwpKTtcbiAgICAgICAgICAgIGxldCBuZXdQYXJhbXMgPSBmbGF0LnNldChyZWNvcmQucGFyYW1zLCBjdXN0b20uZmlsZXNUb0RlbGV0ZVByb3BlcnR5LCBbLi4uZmlsZXNUb0RlbGV0ZSwgaW5kZXhdKTtcbiAgICAgICAgICAgIG5ld1BhcmFtcyA9IGZsYXQuc2V0KG5ld1BhcmFtcywgY3VzdG9tLmZpbGVQYXRoUHJvcGVydHksIG5ld1BhdGgpO1xuICAgICAgICAgICAgb25DaGFuZ2Uoe1xuICAgICAgICAgICAgICAgIC4uLnJlY29yZCxcbiAgICAgICAgICAgICAgICBwYXJhbXM6IG5ld1BhcmFtcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbnNvbGVcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdZb3UgY2Fubm90IHJlbW92ZSBmaWxlIHdoZW4gdGhlcmUgYXJlIG5vIHVwbG9hZGVkIGZpbGVzIHlldCcpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoRm9ybUdyb3VwLCBudWxsLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KExhYmVsLCBudWxsLCB0cmFuc2xhdGVQcm9wZXJ0eShwcm9wZXJ0eS5sYWJlbCwgcHJvcGVydHkucmVzb3VyY2VJZCkpLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KERyb3Bab25lLCB7IG9uQ2hhbmdlOiBvblVwbG9hZCwgbXVsdGlwbGU6IGN1c3RvbS5tdWx0aXBsZSwgdmFsaWRhdGU6IHtcbiAgICAgICAgICAgICAgICBtaW1lVHlwZXM6IGN1c3RvbS5taW1lVHlwZXMsXG4gICAgICAgICAgICAgICAgbWF4U2l6ZTogY3VzdG9tLm1heFNpemUsXG4gICAgICAgICAgICB9LCBmaWxlczogZmlsZXNUb1VwbG9hZCB9KSxcbiAgICAgICAgIWN1c3RvbS5tdWx0aXBsZSAmJiBrZXkgJiYgcGF0aCAmJiAhZmlsZXNUb1VwbG9hZC5sZW5ndGggJiYgZmlsZSAhPT0gbnVsbCAmJiAoUmVhY3QuY3JlYXRlRWxlbWVudChEcm9wWm9uZUl0ZW0sIHsgZmlsZW5hbWU6IGtleSwgc3JjOiBwYXRoLCBvblJlbW92ZTogaGFuZGxlUmVtb3ZlIH0pKSxcbiAgICAgICAgY3VzdG9tLm11bHRpcGxlICYmIGtleSAmJiBrZXkubGVuZ3RoICYmIHBhdGggPyAoUmVhY3QuY3JlYXRlRWxlbWVudChSZWFjdC5GcmFnbWVudCwgbnVsbCwga2V5Lm1hcCgoc2luZ2xlS2V5LCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgLy8gd2hlbiB3ZSByZW1vdmUgaXRlbXMgd2Ugc2V0IG9ubHkgcGF0aCBpbmRleCB0byBudWxscy5cbiAgICAgICAgICAgIC8vIGtleSBpcyBzdGlsbCB0aGVyZS4gVGhpcyBpcyBiZWNhdXNlXG4gICAgICAgICAgICAvLyB3ZSBoYXZlIHRvIG1haW50YWluIGFsbCB0aGUgaW5kZXhlcy4gU28gaGVyZSB3ZSBzaW1wbHkgZmlsdGVyIG91dCBlbGVtZW50cyB3aGljaFxuICAgICAgICAgICAgLy8gd2VyZSByZW1vdmVkIGFuZCBkaXNwbGF5IG9ubHkgd2hhdCB3YXMgbGVmdFxuICAgICAgICAgICAgY29uc3QgY3VycmVudFBhdGggPSBwYXRoW2luZGV4XTtcbiAgICAgICAgICAgIHJldHVybiBjdXJyZW50UGF0aCA/IChSZWFjdC5jcmVhdGVFbGVtZW50KERyb3Bab25lSXRlbSwgeyBrZXk6IHNpbmdsZUtleSwgZmlsZW5hbWU6IHNpbmdsZUtleSwgc3JjOiBwYXRoW2luZGV4XSwgb25SZW1vdmU6ICgpID0+IGhhbmRsZU11bHRpUmVtb3ZlKHNpbmdsZUtleSkgfSkpIDogJyc7XG4gICAgICAgIH0pKSkgOiAnJykpO1xufTtcbmV4cG9ydCBkZWZhdWx0IEVkaXQ7XG4iLCJleHBvcnQgY29uc3QgQXVkaW9NaW1lVHlwZXMgPSBbXG4gICAgJ2F1ZGlvL2FhYycsXG4gICAgJ2F1ZGlvL21pZGknLFxuICAgICdhdWRpby94LW1pZGknLFxuICAgICdhdWRpby9tcGVnJyxcbiAgICAnYXVkaW8vb2dnJyxcbiAgICAnYXBwbGljYXRpb24vb2dnJyxcbiAgICAnYXVkaW8vb3B1cycsXG4gICAgJ2F1ZGlvL3dhdicsXG4gICAgJ2F1ZGlvL3dlYm0nLFxuICAgICdhdWRpby8zZ3BwMicsXG5dO1xuZXhwb3J0IGNvbnN0IFZpZGVvTWltZVR5cGVzID0gW1xuICAgICd2aWRlby94LW1zdmlkZW8nLFxuICAgICd2aWRlby9tcGVnJyxcbiAgICAndmlkZW8vb2dnJyxcbiAgICAndmlkZW8vbXAydCcsXG4gICAgJ3ZpZGVvL3dlYm0nLFxuICAgICd2aWRlby8zZ3BwJyxcbiAgICAndmlkZW8vM2dwcDInLFxuXTtcbmV4cG9ydCBjb25zdCBJbWFnZU1pbWVUeXBlcyA9IFtcbiAgICAnaW1hZ2UvYm1wJyxcbiAgICAnaW1hZ2UvZ2lmJyxcbiAgICAnaW1hZ2UvanBlZycsXG4gICAgJ2ltYWdlL3BuZycsXG4gICAgJ2ltYWdlL3N2Zyt4bWwnLFxuICAgICdpbWFnZS92bmQubWljcm9zb2Z0Lmljb24nLFxuICAgICdpbWFnZS90aWZmJyxcbiAgICAnaW1hZ2Uvd2VicCcsXG5dO1xuZXhwb3J0IGNvbnN0IENvbXByZXNzZWRNaW1lVHlwZXMgPSBbXG4gICAgJ2FwcGxpY2F0aW9uL3gtYnppcCcsXG4gICAgJ2FwcGxpY2F0aW9uL3gtYnppcDInLFxuICAgICdhcHBsaWNhdGlvbi9nemlwJyxcbiAgICAnYXBwbGljYXRpb24vamF2YS1hcmNoaXZlJyxcbiAgICAnYXBwbGljYXRpb24veC10YXInLFxuICAgICdhcHBsaWNhdGlvbi96aXAnLFxuICAgICdhcHBsaWNhdGlvbi94LTd6LWNvbXByZXNzZWQnLFxuXTtcbmV4cG9ydCBjb25zdCBEb2N1bWVudE1pbWVUeXBlcyA9IFtcbiAgICAnYXBwbGljYXRpb24veC1hYml3b3JkJyxcbiAgICAnYXBwbGljYXRpb24veC1mcmVlYXJjJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLmFtYXpvbi5lYm9vaycsXG4gICAgJ2FwcGxpY2F0aW9uL21zd29yZCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC53b3JkcHJvY2Vzc2luZ21sLmRvY3VtZW50JyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm1zLWZvbnRvYmplY3QnLFxuICAgICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnByZXNlbnRhdGlvbicsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5vYXNpcy5vcGVuZG9jdW1lbnQuc3ByZWFkc2hlZXQnLFxuICAgICdhcHBsaWNhdGlvbi92bmQub2FzaXMub3BlbmRvY3VtZW50LnRleHQnLFxuICAgICdhcHBsaWNhdGlvbi92bmQubXMtcG93ZXJwb2ludCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5vcGVueG1sZm9ybWF0cy1vZmZpY2Vkb2N1bWVudC5wcmVzZW50YXRpb25tbC5wcmVzZW50YXRpb24nLFxuICAgICdhcHBsaWNhdGlvbi92bmQucmFyJyxcbiAgICAnYXBwbGljYXRpb24vcnRmJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm1zLWV4Y2VsJyxcbiAgICAnYXBwbGljYXRpb24vdm5kLm9wZW54bWxmb3JtYXRzLW9mZmljZWRvY3VtZW50LnNwcmVhZHNoZWV0bWwuc2hlZXQnLFxuXTtcbmV4cG9ydCBjb25zdCBUZXh0TWltZVR5cGVzID0gW1xuICAgICd0ZXh0L2NzcycsXG4gICAgJ3RleHQvY3N2JyxcbiAgICAndGV4dC9odG1sJyxcbiAgICAndGV4dC9jYWxlbmRhcicsXG4gICAgJ3RleHQvamF2YXNjcmlwdCcsXG4gICAgJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICdhcHBsaWNhdGlvbi9sZCtqc29uJyxcbiAgICAndGV4dC9qYXZhc2NyaXB0JyxcbiAgICAndGV4dC9wbGFpbicsXG4gICAgJ2FwcGxpY2F0aW9uL3hodG1sK3htbCcsXG4gICAgJ2FwcGxpY2F0aW9uL3htbCcsXG4gICAgJ3RleHQveG1sJyxcbl07XG5leHBvcnQgY29uc3QgQmluYXJ5RG9jc01pbWVUeXBlcyA9IFtcbiAgICAnYXBwbGljYXRpb24vZXB1Yit6aXAnLFxuICAgICdhcHBsaWNhdGlvbi9wZGYnLFxuXTtcbmV4cG9ydCBjb25zdCBGb250TWltZVR5cGVzID0gW1xuICAgICdmb250L290ZicsXG4gICAgJ2ZvbnQvdHRmJyxcbiAgICAnZm9udC93b2ZmJyxcbiAgICAnZm9udC93b2ZmMicsXG5dO1xuZXhwb3J0IGNvbnN0IE90aGVyTWltZVR5cGVzID0gW1xuICAgICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nLFxuICAgICdhcHBsaWNhdGlvbi94LWNzaCcsXG4gICAgJ2FwcGxpY2F0aW9uL3ZuZC5hcHBsZS5pbnN0YWxsZXIreG1sJyxcbiAgICAnYXBwbGljYXRpb24veC1odHRwZC1waHAnLFxuICAgICdhcHBsaWNhdGlvbi94LXNoJyxcbiAgICAnYXBwbGljYXRpb24veC1zaG9ja3dhdmUtZmxhc2gnLFxuICAgICd2bmQudmlzaW8nLFxuICAgICdhcHBsaWNhdGlvbi92bmQubW96aWxsYS54dWwreG1sJyxcbl07XG5leHBvcnQgY29uc3QgTWltZVR5cGVzID0gW1xuICAgIC4uLkF1ZGlvTWltZVR5cGVzLFxuICAgIC4uLlZpZGVvTWltZVR5cGVzLFxuICAgIC4uLkltYWdlTWltZVR5cGVzLFxuICAgIC4uLkNvbXByZXNzZWRNaW1lVHlwZXMsXG4gICAgLi4uRG9jdW1lbnRNaW1lVHlwZXMsXG4gICAgLi4uVGV4dE1pbWVUeXBlcyxcbiAgICAuLi5CaW5hcnlEb2NzTWltZVR5cGVzLFxuICAgIC4uLk90aGVyTWltZVR5cGVzLFxuICAgIC4uLkZvbnRNaW1lVHlwZXMsXG4gICAgLi4uT3RoZXJNaW1lVHlwZXMsXG5dO1xuIiwiLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGltcG9ydC9uby1leHRyYW5lb3VzLWRlcGVuZGVuY2llc1xuaW1wb3J0IHsgQm94LCBCdXR0b24sIEljb24gfSBmcm9tICdAYWRtaW5qcy9kZXNpZ24tc3lzdGVtJztcbmltcG9ydCB7IGZsYXQgfSBmcm9tICdhZG1pbmpzJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBBdWRpb01pbWVUeXBlcywgSW1hZ2VNaW1lVHlwZXMgfSBmcm9tICcuLi90eXBlcy9taW1lLXR5cGVzLnR5cGUuanMnO1xuY29uc3QgU2luZ2xlRmlsZSA9IChwcm9wcykgPT4ge1xuICAgIGNvbnN0IHsgbmFtZSwgcGF0aCwgbWltZVR5cGUsIHdpZHRoIH0gPSBwcm9wcztcbiAgICBpZiAocGF0aCAmJiBwYXRoLmxlbmd0aCkge1xuICAgICAgICBpZiAobWltZVR5cGUgJiYgSW1hZ2VNaW1lVHlwZXMuaW5jbHVkZXMobWltZVR5cGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoXCJpbWdcIiwgeyBzcmM6IHBhdGgsIHN0eWxlOiB7IG1heEhlaWdodDogd2lkdGgsIG1heFdpZHRoOiB3aWR0aCB9LCBhbHQ6IG5hbWUgfSkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtaW1lVHlwZSAmJiBBdWRpb01pbWVUeXBlcy5pbmNsdWRlcyhtaW1lVHlwZSkpIHtcbiAgICAgICAgICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChcImF1ZGlvXCIsIHsgY29udHJvbHM6IHRydWUsIHNyYzogcGF0aCB9LFxuICAgICAgICAgICAgICAgIFwiWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdGhlXCIsXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChcImNvZGVcIiwgbnVsbCwgXCJhdWRpb1wiKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KFwidHJhY2tcIiwgeyBraW5kOiBcImNhcHRpb25zXCIgfSkpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoQm94LCBudWxsLFxuICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEJ1dHRvbiwgeyBhczogXCJhXCIsIGhyZWY6IHBhdGgsIG1sOiBcImRlZmF1bHRcIiwgc2l6ZTogXCJzbVwiLCByb3VuZGVkOiB0cnVlLCB0YXJnZXQ6IFwiX2JsYW5rXCIgfSxcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoSWNvbiwgeyBpY29uOiBcIkRvY3VtZW50RG93bmxvYWRcIiwgY29sb3I6IFwid2hpdGVcIiwgbXI6IFwiZGVmYXVsdFwiIH0pLFxuICAgICAgICAgICAgbmFtZSkpKTtcbn07XG5jb25zdCBGaWxlID0gKHsgd2lkdGgsIHJlY29yZCwgcHJvcGVydHkgfSkgPT4ge1xuICAgIGNvbnN0IHsgY3VzdG9tIH0gPSBwcm9wZXJ0eTtcbiAgICBsZXQgcGF0aCA9IGZsYXQuZ2V0KHJlY29yZD8ucGFyYW1zLCBjdXN0b20uZmlsZVBhdGhQcm9wZXJ0eSk7XG4gICAgaWYgKCFwYXRoKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBuYW1lID0gZmxhdC5nZXQocmVjb3JkPy5wYXJhbXMsIGN1c3RvbS5maWxlTmFtZVByb3BlcnR5ID8gY3VzdG9tLmZpbGVOYW1lUHJvcGVydHkgOiBjdXN0b20ua2V5UHJvcGVydHkpO1xuICAgIGNvbnN0IG1pbWVUeXBlID0gY3VzdG9tLm1pbWVUeXBlUHJvcGVydHlcbiAgICAgICAgJiYgZmxhdC5nZXQocmVjb3JkPy5wYXJhbXMsIGN1c3RvbS5taW1lVHlwZVByb3BlcnR5KTtcbiAgICBpZiAoIXByb3BlcnR5LmN1c3RvbS5tdWx0aXBsZSkge1xuICAgICAgICBpZiAoY3VzdG9tLm9wdHMgJiYgY3VzdG9tLm9wdHMuYmFzZVVybCkge1xuICAgICAgICAgICAgcGF0aCA9IGAke2N1c3RvbS5vcHRzLmJhc2VVcmx9LyR7bmFtZX1gO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChTaW5nbGVGaWxlLCB7IHBhdGg6IHBhdGgsIG5hbWU6IG5hbWUsIHdpZHRoOiB3aWR0aCwgbWltZVR5cGU6IG1pbWVUeXBlIH0pKTtcbiAgICB9XG4gICAgaWYgKGN1c3RvbS5vcHRzICYmIGN1c3RvbS5vcHRzLmJhc2VVcmwpIHtcbiAgICAgICAgY29uc3QgYmFzZVVybCA9IGN1c3RvbS5vcHRzLmJhc2VVcmwgfHwgJyc7XG4gICAgICAgIHBhdGggPSBwYXRoLm1hcCgoc2luZ2xlUGF0aCwgaW5kZXgpID0+IGAke2Jhc2VVcmx9LyR7bmFtZVtpbmRleF19YCk7XG4gICAgfVxuICAgIHJldHVybiAoUmVhY3QuY3JlYXRlRWxlbWVudChSZWFjdC5GcmFnbWVudCwgbnVsbCwgcGF0aC5tYXAoKHNpbmdsZVBhdGgsIGluZGV4KSA9PiAoUmVhY3QuY3JlYXRlRWxlbWVudChTaW5nbGVGaWxlLCB7IGtleTogc2luZ2xlUGF0aCwgcGF0aDogc2luZ2xlUGF0aCwgbmFtZTogbmFtZVtpbmRleF0sIHdpZHRoOiB3aWR0aCwgbWltZVR5cGU6IG1pbWVUeXBlW2luZGV4XSB9KSkpKSk7XG59O1xuZXhwb3J0IGRlZmF1bHQgRmlsZTtcbiIsImltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgRmlsZSBmcm9tICcuL2ZpbGUuanMnO1xuY29uc3QgTGlzdCA9IChwcm9wcykgPT4gKFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmlsZSwgeyB3aWR0aDogMTAwLCAuLi5wcm9wcyB9KSk7XG5leHBvcnQgZGVmYXVsdCBMaXN0O1xuIiwiaW1wb3J0IHsgRm9ybUdyb3VwLCBMYWJlbCB9IGZyb20gJ0BhZG1pbmpzL2Rlc2lnbi1zeXN0ZW0nO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdhZG1pbmpzJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgRmlsZSBmcm9tICcuL2ZpbGUuanMnO1xuY29uc3QgU2hvdyA9IChwcm9wcykgPT4ge1xuICAgIGNvbnN0IHsgcHJvcGVydHkgfSA9IHByb3BzO1xuICAgIGNvbnN0IHsgdHJhbnNsYXRlUHJvcGVydHkgfSA9IHVzZVRyYW5zbGF0aW9uKCk7XG4gICAgcmV0dXJuIChSZWFjdC5jcmVhdGVFbGVtZW50KEZvcm1Hcm91cCwgbnVsbCxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChMYWJlbCwgbnVsbCwgdHJhbnNsYXRlUHJvcGVydHkocHJvcGVydHkubGFiZWwsIHByb3BlcnR5LnJlc291cmNlSWQpKSxcbiAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGaWxlLCB7IHdpZHRoOiBcIjEwMCVcIiwgLi4ucHJvcHMgfSkpKTtcbn07XG5leHBvcnQgZGVmYXVsdCBTaG93O1xuIiwiQWRtaW5KUy5Vc2VyQ29tcG9uZW50cyA9IHt9XG5pbXBvcnQgRmlsdGVyZWRDYXRlZ29yeSBmcm9tICcuLi9zcmMvY29tcG9uZW50cy9GaWx0ZXJlZENhdGVnb3J5J1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5GaWx0ZXJlZENhdGVnb3J5ID0gRmlsdGVyZWRDYXRlZ29yeVxuaW1wb3J0IEZpbHRlcmVkU3ViQ2F0ZWdvcnkgZnJvbSAnLi4vc3JjL2NvbXBvbmVudHMvRmlsdGVyZWRTdWJDYXRlZ29yeSdcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuRmlsdGVyZWRTdWJDYXRlZ29yeSA9IEZpbHRlcmVkU3ViQ2F0ZWdvcnlcbmltcG9ydCBTdXBwb3J0UmVwbHkgZnJvbSAnLi4vc3JjL2NvbXBvbmVudHMvU3VwcG9ydFJlcGx5J1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5TdXBwb3J0UmVwbHkgPSBTdXBwb3J0UmVwbHlcbmltcG9ydCBTdXBwb3J0RGFzaGJvYXJkIGZyb20gJy4uL3NyYy9jb21wb25lbnRzL1N1cHBvcnREYXNoYm9hcmQnXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLlN1cHBvcnREYXNoYm9hcmQgPSBTdXBwb3J0RGFzaGJvYXJkXG5pbXBvcnQgU2VuZE5vdGlmaWNhdGlvbiBmcm9tICcuLi9zcmMvY29tcG9uZW50cy9TZW5kTm90aWZpY2F0aW9uJ1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5TZW5kTm90aWZpY2F0aW9uID0gU2VuZE5vdGlmaWNhdGlvblxuaW1wb3J0IERhc2hib2FyZCBmcm9tICcuLi9zcmMvY29tcG9uZW50cy9EYXNoYm9hcmQnXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLkRhc2hib2FyZCA9IERhc2hib2FyZFxuaW1wb3J0IEFzc2lnbkRyaXZlckNvbXBvbmVudCBmcm9tICcuLi9zcmMvY29tcG9uZW50cy9Bc3NpZ25Ecml2ZXInXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLkFzc2lnbkRyaXZlckNvbXBvbmVudCA9IEFzc2lnbkRyaXZlckNvbXBvbmVudFxuaW1wb3J0IE9yZGVyU3RhdHVzQmFkZ2UgZnJvbSAnLi4vc3JjL2NvbXBvbmVudHMvT3JkZXJTdGF0dXNCYWRnZSdcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuT3JkZXJTdGF0dXNCYWRnZSA9IE9yZGVyU3RhdHVzQmFkZ2VcbmltcG9ydCBEcml2ZXJTdGF0dXNCYWRnZSBmcm9tICcuLi9zcmMvY29tcG9uZW50cy9Ecml2ZXJTdGF0dXNCYWRnZSdcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuRHJpdmVyU3RhdHVzQmFkZ2UgPSBEcml2ZXJTdGF0dXNCYWRnZVxuaW1wb3J0IENvbXBvbmVudEd1aWRlIGZyb20gJy4uL3NyYy9jb21wb25lbnRzL0NvbXBvbmVudEd1aWRlJ1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5Db21wb25lbnRHdWlkZSA9IENvbXBvbmVudEd1aWRlXG5pbXBvcnQgVXBsb2FkRWRpdENvbXBvbmVudCBmcm9tICcuLi9ub2RlX21vZHVsZXMvQGFkbWluanMvdXBsb2FkL2J1aWxkL2ZlYXR1cmVzL3VwbG9hZC1maWxlL2NvbXBvbmVudHMvVXBsb2FkRWRpdENvbXBvbmVudCdcbkFkbWluSlMuVXNlckNvbXBvbmVudHMuVXBsb2FkRWRpdENvbXBvbmVudCA9IFVwbG9hZEVkaXRDb21wb25lbnRcbmltcG9ydCBVcGxvYWRMaXN0Q29tcG9uZW50IGZyb20gJy4uL25vZGVfbW9kdWxlcy9AYWRtaW5qcy91cGxvYWQvYnVpbGQvZmVhdHVyZXMvdXBsb2FkLWZpbGUvY29tcG9uZW50cy9VcGxvYWRMaXN0Q29tcG9uZW50J1xuQWRtaW5KUy5Vc2VyQ29tcG9uZW50cy5VcGxvYWRMaXN0Q29tcG9uZW50ID0gVXBsb2FkTGlzdENvbXBvbmVudFxuaW1wb3J0IFVwbG9hZFNob3dDb21wb25lbnQgZnJvbSAnLi4vbm9kZV9tb2R1bGVzL0BhZG1pbmpzL3VwbG9hZC9idWlsZC9mZWF0dXJlcy91cGxvYWQtZmlsZS9jb21wb25lbnRzL1VwbG9hZFNob3dDb21wb25lbnQnXG5BZG1pbkpTLlVzZXJDb21wb25lbnRzLlVwbG9hZFNob3dDb21wb25lbnQgPSBVcGxvYWRTaG93Q29tcG9uZW50Il0sIm5hbWVzIjpbIkZpbHRlcmVkQ2F0ZWdvcnkiLCJwcm9wcyIsInByb3BlcnR5IiwicmVjb3JkIiwib25DaGFuZ2UiLCJvcHRpb25zIiwic2V0T3B0aW9ucyIsInVzZVN0YXRlIiwibG9hZGluZyIsInNldExvYWRpbmciLCJzdXBlckNhdGVnb3J5SWQiLCJwYXJhbXMiLCJzdXBlckNhdGVnb3J5IiwiY3VycmVudFZhbHVlIiwiY2F0ZWdvcnkiLCJ1c2VFZmZlY3QiLCJmZXRjaCIsInRoZW4iLCJyZXMiLCJqc29uIiwicmVzdWx0IiwiaXRlbXMiLCJkYXRhIiwib3B0cyIsIkFycmF5IiwiaXNBcnJheSIsIm1hcCIsImNhdCIsInZhbHVlIiwiX2lkIiwibGFiZWwiLCJuYW1lIiwiY2F0Y2giLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJzZWxlY3RlZCIsImZpbmQiLCJvIiwiaGFuZGxlQ2hhbmdlIiwic2VsZWN0ZWRPcHRpb24iLCJwYXRoIiwiUmVhY3QiLCJjcmVhdGVFbGVtZW50IiwiRm9ybUdyb3VwIiwiTGFiZWwiLCJGb3JtTWVzc2FnZSIsImxlbmd0aCIsIlNlbGVjdCIsImlzQ2xlYXJhYmxlIiwicGxhY2Vob2xkZXIiLCJGaWx0ZXJlZFN1YkNhdGVnb3J5IiwiY2F0ZWdvcnlJZCIsInN1YkNhdGVnb3J5Iiwic2MiLCJTdXBwb3J0UmVwbHkiLCJyZXNvdXJjZSIsImFjdGlvbiIsIm1lc3NhZ2UiLCJzZXRNZXNzYWdlIiwic2VuZE5vdGljZSIsInVzZU5vdGljZSIsImFwaSIsIkFwaUNsaWVudCIsImhhbmRsZVNlbmQiLCJ0cmltIiwicmVjb3JkQWN0aW9uIiwicmVzb3VyY2VJZCIsImlkIiwicmVjb3JkSWQiLCJhY3Rpb25OYW1lIiwicGF5bG9hZCIsInJlcGx5TWVzc2FnZSIsIm1ldGhvZCIsInR5cGUiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImhyZWYiLCJCb3giLCJ2YXJpYW50IiwicGFkZGluZyIsIm1hcmdpbkJvdHRvbSIsImJhY2tncm91bmRDb2xvciIsImJvcmRlclJhZGl1cyIsIlRleHQiLCJUZXh0QXJlYSIsImUiLCJ0YXJnZXQiLCJyb3dzIiwibWFyZ2luVG9wIiwiQnV0dG9uIiwib25DbGljayIsImRpc2FibGVkIiwid2l0aE5hdGl2ZUJsb2IiLCJ3aXRoTmF0aXZlQXJyYXlCdWZmZXIiLCJpc1ZpZXciLCJsb29rdXAiLCJkZWNvZGUiLCJnbG9iYWxUaGlzIiwiRW1pdHRlciIsIkRFRkFVTFRfVFJBTlNQT1JUUyIsIlNvY2tldCIsIlJFU0VSVkVEX0VWRU5UUyIsIkVuZ2luZSIsIlN1cHBvcnREYXNoYm9hcmQiLCJjb252ZXJzYXRpb25zIiwic2V0Q29udmVyc2F0aW9ucyIsInNlbGVjdGVkVXNlcklkIiwic2V0U2VsZWN0ZWRVc2VySWQiLCJyZXBseVRleHQiLCJzZXRSZXBseVRleHQiLCJzb2NrZXQiLCJzZXRTb2NrZXQiLCJsYXN0TWVzc2FnZVJlZiIsInVzZVJlZiIsImF1ZGlvUmVmIiwiQXVkaW8iLCJuZXdTb2NrZXQiLCJpbyIsIm9yaWdpbiIsInRyYW5zcG9ydHMiLCJlbWl0Iiwib24iLCJ1c2VySWQiLCJjdXN0b21lck5hbWUiLCJjdXN0b21lclBob25lIiwic2VuZGVyIiwiY3VycmVudCIsInBsYXkiLCJsb2ciLCJwcmV2IiwiZXhpc3RpbmciLCJtZXNzYWdlcyIsImRpc2Nvbm5lY3QiLCJzY3JvbGxJbnRvVmlldyIsImJlaGF2aW9yIiwiYWN0aXZlVXNlcnMiLCJPYmplY3QiLCJrZXlzIiwiZGlzcGxheSIsImZsZXhEaXJlY3Rpb24iLCJoZWlnaHQiLCJ3aWR0aCIsImJvcmRlclJpZ2h0Iiwib3ZlcmZsb3dZIiwiYm9yZGVyQm90dG9tIiwiZm9udFdlaWdodCIsImZvbnRTaXplIiwiY29sb3IiLCJ1aWQiLCJrZXkiLCJjdXJzb3IiLCJhbGlnbkl0ZW1zIiwiSWNvbiIsImljb24iLCJzaXplIiwibWFyZ2luUmlnaHQiLCJudW1iZXJPZkxpbmVzIiwic2xpY2UiLCJmbGV4IiwiRnJhZ21lbnQiLCJqdXN0aWZ5Q29udGVudCIsIm1zZyIsImlkeCIsImlzTWUiLCJtYXJnaW5WZXJ0aWNhbCIsIm1heFdpZHRoIiwiRGF0ZSIsImNyZWF0ZWRBdCIsInRvTG9jYWxlVGltZVN0cmluZyIsInJlZiIsImJvcmRlclRvcCIsIm9uS2V5RG93biIsInNoaWZ0S2V5IiwicHJldmVudERlZmF1bHQiLCJtYXJnaW5MZWZ0IiwidGV4dEFsaWduIiwiU2VuZE5vdGlmaWNhdGlvbiIsInRpdGxlIiwic2V0VGl0bGUiLCJib2R5Iiwic2V0Qm9keSIsInB1c2hUb0RyaXZlcnMiLCJzZXRQdXNoVG9Ecml2ZXJzIiwic3VjY2Vzc01lc3NhZ2UiLCJzZXRTdWNjZXNzTWVzc2FnZSIsImVycm9yTWVzc2FnZSIsInNldEVycm9yTWVzc2FnZSIsInVzZXJUeXBlIiwicmVzcG9uc2UiLCJyZXNvdXJjZUFjdGlvbiIsInVuZGVmaW5lZCIsIm5vdGljZSIsInN0eWxlIiwibWFyZ2luIiwiYm94U2hhZG93IiwibWIiLCJNZXNzYWdlQm94IiwibXQiLCJtciIsIklucHV0IiwicHQiLCJQcmVtaXVtQ2FyZCIsInN0eWxlZCIsIlN0YXRMYWJlbCIsIlN0YXRWYWx1ZSIsIkFjdGlvbkJ1dHRvbiIsIkRhc2hib2FyZCIsInN0YXRzIiwic2V0U3RhdHMiLCJ0b3RhbE9yZGVycyIsImFjdGl2ZUN1c3RvbWVycyIsImxvd1N0b2NrQWxlcnRzIiwicGVuZGluZ09yZGVycyIsInRvdGFsUmV2ZW51ZSIsImludmVudG9yeVByb2ZpdCIsInJlY2VudE9yZGVycyIsInNldFJlY2VudE9yZGVycyIsImZldGNoTWV0cmljcyIsIm9yZGVyc1JlcyIsInBlbmRpbmdPcmRlcnNSZXMiLCJjdXN0b21lcnNSZXMiLCJsb3dTdG9ja1JlcyIsImRlbGl2ZXJlZE9yZGVyc1JlcyIsInJlY2VudE9yZGVyc1JlcyIsIlByb21pc2UiLCJhbGwiLCJwZXJQYWdlIiwic29ydEJ5IiwiZGlyZWN0aW9uIiwiZ2V0VG90YWwiLCJtZXRhIiwidG90YWwiLCJnZXRSZWNvcmRzIiwicmVjb3JkcyIsImRlbGl2ZXJlZFJlY29yZHMiLCJmb3JFYWNoIiwib3JkZXIiLCJwcmljZSIsInBhcnNlRmxvYXQiLCJ0b3RhbFByaWNlIiwiaXNOYU4iLCJNYXRoIiwicm91bmQiLCJwIiwiYmciLCJtaW5IZWlnaHQiLCJMb2FkZXIiLCJsZXR0ZXJTcGFjaW5nIiwiYXMiLCJncmlkVGVtcGxhdGVDb2x1bW5zIiwiZ3JpZEdhcCIsImJvcmRlckxlZnQiLCJ0b0xvY2FsZVN0cmluZyIsImJvcmRlciIsImZsZXhXcmFwIiwiZ2FwIiwic3BsaXQiLCJsZXR0ZXIiLCJtaW5XaWR0aCIsIlRhYmxlIiwiVGFibGVIZWFkIiwiVGFibGVSb3ciLCJUYWJsZUNlbGwiLCJUYWJsZUJvZHkiLCJvcmRlcklkIiwiQmFkZ2UiLCJzdGF0dXMiLCJ0b0xvY2FsZURhdGVTdHJpbmciLCJsaW5lSGVpZ2h0IiwiQXNzaWduRHJpdmVyIiwiZHJpdmVycyIsInNldERyaXZlcnMiLCJzZWxlY3RlZERyaXZlcklkIiwic2V0U2VsZWN0ZWREcml2ZXJJZCIsImRlbGl2ZXJ5RmVlIiwic2V0RGVsaXZlcnlGZWUiLCJkcml2ZXJFYXJuaW5nIiwiZmV0Y2hpbmciLCJzZXRGZXRjaGluZyIsImZldGNoRHJpdmVycyIsImFjdGl2ZURyaXZlcnMiLCJmaWx0ZXIiLCJyIiwiaXNBY3RpdmF0ZWQiLCJlbWFpbCIsImhhbmRsZUFzc2lnbiIsImFsZXJ0IiwiZHJpdmVySWQiLCJlcnJNc2ciLCJkIiwiU1RBVFVTX1NUWUxFUyIsImF2YWlsYWJsZSIsImFzc2lnbmVkIiwiY29uZmlybWVkIiwiYXJyaXZpbmciLCJhdF9sb2NhdGlvbiIsImRlbGl2ZXJlZCIsImNhbmNlbGxlZCIsImJhc2VCYWRnZVN0eWxlIiwid2hpdGVTcGFjZSIsIm5vcm1hbGl6ZVN0YXR1cyIsIlN0cmluZyIsInRvTG93ZXJDYXNlIiwiZ2V0U3RhdHVzQ29uZmlnIiwibm9ybWFsaXplZCIsInRvVXBwZXJDYXNlIiwiT3JkZXJTdGF0dXNCYWRnZSIsImNvbmZpZyIsIkRyaXZlclN0YXR1c0JhZGdlIiwiZHJpdmVyIiwiZGVsaXZlcnlQYXJ0bmVyIiwiaXNBc3NpZ25lZCIsIkdVSURFUyIsImRlc2MiLCJtYXBwaW5nIiwidXNlZCIsImlnbm9yZWQiLCJDb21wb25lbnRHdWlkZSIsIm14IiwiSDIiLCJnIiwiaSIsInRleHRUcmFuc2Zvcm0iLCJlbnRyaWVzIiwiZmllbGQiLCJoZWxwIiwibWkiLCJiYWNrZ3JvdW5kIiwidSIsInVpIiwiam9pbiIsInVzZVRyYW5zbGF0aW9uIiwiZmxhdCIsIkRyb3Bab25lIiwiRHJvcFpvbmVJdGVtIiwiRmlsZSIsIkFkbWluSlMiLCJVc2VyQ29tcG9uZW50cyIsIkFzc2lnbkRyaXZlckNvbXBvbmVudCIsIlVwbG9hZEVkaXRDb21wb25lbnQiLCJV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S0FBSyxNQUFNQSxzQkFBSyxDQUFDLGFBQWEsQ0FBQ3NTLE1BQUksRUFBRSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDOztJQ0U3RSxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssS0FBSztJQUN4QixJQUFJLE1BQU0sRUFBRSxRQUFRLEVBQUUsR0FBRyxLQUFLO0lBQzlCLElBQUksTUFBTSxFQUFFLGlCQUFpQixFQUFFLEdBQUdKLHNCQUFjLEVBQUU7SUFDbEQsSUFBSSxRQUFRbFMsc0JBQUssQ0FBQyxhQUFhLENBQUNFLHNCQUFTLEVBQUUsSUFBSTtJQUMvQyxRQUFRRixzQkFBSyxDQUFDLGFBQWEsQ0FBQ0csa0JBQUssRUFBRSxJQUFJLEVBQUUsaUJBQWlCLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDaEcsUUFBUUgsc0JBQUssQ0FBQyxhQUFhLENBQUNzUyxNQUFJLEVBQUUsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUMvRCxDQUFDOztJQ1ZEQyxPQUFPLENBQUNDLGNBQWMsR0FBRyxFQUFFO0lBRTNCRCxPQUFPLENBQUNDLGNBQWMsQ0FBQ2xWLGdCQUFnQixHQUFHQSxnQkFBZ0I7SUFFMURpVixPQUFPLENBQUNDLGNBQWMsQ0FBQy9SLG1CQUFtQixHQUFHQSxtQkFBbUI7SUFFaEU4UixPQUFPLENBQUNDLGNBQWMsQ0FBQzNSLFlBQVksR0FBR0EsWUFBWTtJQUVsRDBSLE9BQU8sQ0FBQ0MsY0FBYyxDQUFDMU8sZ0JBQWdCLEdBQUdBLGdCQUFnQjtJQUUxRHlPLE9BQU8sQ0FBQ0MsY0FBYyxDQUFDakssZ0JBQWdCLEdBQUdBLGdCQUFnQjtJQUUxRGdLLE9BQU8sQ0FBQ0MsY0FBYyxDQUFDbkksU0FBUyxHQUFHQSxTQUFTO0lBRTVDa0ksT0FBTyxDQUFDQyxjQUFjLENBQUNDLHFCQUFxQixHQUFHQSxZQUFxQjtJQUVwRUYsT0FBTyxDQUFDQyxjQUFjLENBQUMvQixnQkFBZ0IsR0FBR0EsZ0JBQWdCO0lBRTFEOEIsT0FBTyxDQUFDQyxjQUFjLENBQUM3QixpQkFBaUIsR0FBR0EsaUJBQWlCO0lBRTVENEIsT0FBTyxDQUFDQyxjQUFjLENBQUNwQixjQUFjLEdBQUdBLGNBQWM7SUFFdERtQixPQUFPLENBQUNDLGNBQWMsQ0FBQ0UsbUJBQW1CLEdBQUdBLElBQW1CO0lBRWhFSCxPQUFPLENBQUNDLGNBQWMsQ0FBQ0csbUJBQW1CLEdBQUdBLElBQW1CO0lBRWhFSixPQUFPLENBQUNDLGNBQWMsQ0FBQ0ksbUJBQW1CLEdBQUdBLElBQW1COzs7Ozs7IiwieF9nb29nbGVfaWdub3JlTGlzdCI6WzMsNCw1LDYsNyw4LDksMTAsMTEsMTIsMTMsMTQsMTUsMTYsMTcsMTgsMTksMjAsMjEsMjIsMjMsMjQsMjUsMjYsMjcsMjgsMjksMzAsMzgsMzksNDAsNDEsNDJdfQ==
