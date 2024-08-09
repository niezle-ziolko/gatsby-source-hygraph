"use strict";

function _createBinding(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);

  if (!desc || (!desc.get && (!m.__esModule || desc.writable || desc.configurable))) {
    desc = { enumerable: true, get: function() { return m[k]; } };
  };

  Object.defineProperty(o, k2, desc);
};

function _import(m, exports) {
  for (var p in m) {
    if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) {
      _createBinding(exports, m, p);
    };
  };
};

module.exports = { _import };