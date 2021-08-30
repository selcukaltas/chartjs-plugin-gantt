/*!
 * chartjs-plugin-gantt
 * https://github.com/anton-shchyrov/chartjs-plugin-gantt#readme
 * Version: 0.9.0
 *
 * Copyright 2019 Anton Shchyrov
 * Released under the Apache 2.0 license
 * https://github.com/anton-shchyrov/chartjs-plugin-gantt#LICENSE
 */

(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.GanttController = void 0;

var _rect = require("../elements/rect");

var _utils = require("../core/utils");

var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);

const defaults = _chart.Chart.defaults;
defaults.elements.gantt = {
  borderWidth: 1,
  borderColor: defaults.defaultColor,
  backgroundColor: defaults.defaultColor
};

class GanttController extends _chart.Chart.DatasetController {
  static get id() {
    return "gantt";
  }

  _prepareData(data, dataset) {
    return {
      x: _utils.Utils.extendValue(data.x, dataset._width),
      y: _utils.Utils.extendValue(data.y, dataset._height)
    };
  }

  _calcBounds(scale, scaleValue) {
    const from = scale.getPixelForValue(scaleValue.from);
    const to = scale.getPixelForValue(scaleValue.to);
    const res = {
      from: from,
      to: to
    };

    _utils.Utils.normalize(res);

    res.size = res.to - res.from;
    return res;
  }

  update(reset) {
    const meta = this.getMeta();
    const dataset = this.getDataset();
    const xScale = this.getScaleForId(meta.xAxisID);
    const yScale = this.getScaleForId(meta.yAxisID);
    dataset._width = _utils.Utils.convertSize(xScale, _chart.Chart.helpers.valueOrDefault(dataset.width, defaults.gantt.width));
    dataset._height = _utils.Utils.convertSize(yScale, _chart.Chart.helpers.valueOrDefault(dataset.height, defaults.gantt.height));
    const globalOptionGantt = defaults.elements.gantt;
    const data = meta.data || [];

    for (let i = 0; i < data.length; i++) this.updateElement(data[i], i, reset);
  }

  updateElements(points, start, count, mode) {
    for (let i = start; i < count; i++) {
      this.updateElement(points[i], i, mode === 'reset');
    }
  }

  updateElement(point, index, reset) {
    const meta = this.getMeta();
    const dataset = this.getDataset();
    const datasetIndex = this.index;
    const xScale = this.getScaleForId(meta.xAxisID);
    const yScale = this.getScaleForId(meta.yAxisID);
    const value = dataset.data[index]; // Utility

    point._xScale = xScale;
    point._yScale = yScale;
    point._datasetIndex = datasetIndex;
    point._index = index;

    const fullPoint = this._prepareData(value, dataset);

    Object.assign(point, {
      rect: {
        x: this._calcBounds(xScale, fullPoint.x),
        y: this._calcBounds(yScale, fullPoint.y)
      },
      borderWidth: value.borderWidth || this.borderWidth,
      borderColor: value.borderColor || this.borderColor,
      backgroundColor: value.backgroundColor || this.backgroundColor
    });
    Object.assign(point, {
      x: _utils.Utils.getMiddle(point.rect.x),
      y: _utils.Utils.getMiddle(point.rect.y)
    }); //point.pivot();
  }

}

exports.GanttController = GanttController;
GanttController.defaults = {
  dataElementType: "rect",
  //    datasetElementType: "rect",
  height: 5,
  width: 5
};
_chart.Chart.defaults.gantt = GanttController.overrides = {
  scales: {
    _index_: {
      id: 'x',
      active: true,
      type: 'time-gantt',
      position: 'bottom'
    },
    _value_: {
      id: 'y',
      active: true,
      type: 'linear-gantt',
      position: 'left'
    }
  }
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../core/utils":2,"../elements/rect":3}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Utils = void 0;
const Utils = {
  _parseInterval: function (value) {
    if (typeof value === "number") return value;

    if (typeof value === "string") {
      const parsed = value.trim().toLowerCase().split(/\s*(\d+)\s*/);
      let cur = "ms";
      const obj = {};

      for (let i = parsed.length - 1; i > 0; i--) {
        const num = parseFloat(parsed[i]);
        if (isFinite(num)) obj[cur] = num;else cur = parsed[i];
      }

      value = obj;
    }

    const coefs = {
      ms: 1,
      s: 1000,
      m: 1000 * 60,
      h: 1000 * 60 * 60,
      d: 1000 * 60 * 60 * 24
    };
    let res = 0;

    for (let key in value) {
      if (coefs[key]) res += value[key] * coefs[key];
    }

    return res;
  },
  isRange: function (value) {
    return typeof value.from !== "undefined" && typeof value.to !== "undefined";
  },
  getValue: function (rawValue, scale) {
    if (typeof rawValue === 'string') return +rawValue; // Null and undefined values first

    if (typeof rawValue === "undefined" || rawValue === null) return NaN; // isNaN(object) returns true, so make sure NaN is checking for a number; Discard Infinite values

    if (typeof rawValue === 'number' && !isFinite(rawValue)) {
      return NaN;
    } // If it is in fact an object, dive in one more level


    if (rawValue) {
      const nested = scale.isHorizontal() ? rawValue.x : rawValue.y;
      if (nested !== undefined) return this.getValue(nested, scale);
    } // Value is good, return it


    return rawValue;
  },
  _incMilliseconds: function (date, addend) {
    const res = new Date(date);
    res.setMilliseconds(res.getMilliseconds() + addend);
    return res;
  },
  extendValue: function (value, defSize) {
    if (this.isRange(value)) return value;
    if (!isFinite(value)) return NaN;
    const delta = defSize / 2;

    if (value instanceof Date) {
      return {
        from: this._incMilliseconds(value, -delta),
        to: this._incMilliseconds(value, delta)
      };
    }

    return {
      from: value - delta,
      to: value + delta
    };
  },
  isTimeScale: function (scale) {
    return scale.isTime || scale.type === "time";
  },
  convertSize: function (scale, size) {
    return this.isTimeScale(scale) ? this._parseInterval(size) : size;
  },
  normalize: function (value) {
    if (value.from > value.to) {
      const tmp = value.from;
      value.from = value.to;
      value.to = tmp;
    }

    return value;
  },
  getMiddle: function (value) {
    return (value.from + value.to) / 2;
  }
};
exports.Utils = Utils;

},{}],3:[function(require,module,exports){
(function (global){(function (){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Rect = void 0;

var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);

var _utils = require("../core/utils");

class Rect extends _chart.Element {
  static get id() {
    return "rect";
  }

  inRange(mouseX, mouseY) {
    const rect = this.rect;
    return mouseX >= rect.x.from && mouseX <= rect.x.to && mouseY >= rect.y.from && mouseY <= rect.y.to;
  }

  getCenterPoint() {
    return {
      x: this.x,
      y: this.y
    };
  }

  getArea() {
    const rect = this.rect;
    return rect.x.size * rect.y.size;
  }

  draw(ctx) {
    ctx.save();
    ctx.lineWidth = this.borderWidth;
    ctx.strokeStyle = this.borderColor;
    ctx.fillStyle = this.backgroundColor;
    const rect = this.rect;
    this.roundedRect(ctx, rect.x.from, rect.y.from, rect.x.size, rect.y.size, 5);
    ctx.restore();
  }

  roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.arcTo(x, y + height, x + radius, y + height, radius);
    ctx.lineTo(x + width - radius, y + height);
    ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
    ctx.lineTo(x + width, y + radius);
    ctx.arcTo(x + width, y, x + width - radius, y, radius);
    ctx.lineTo(x + radius, y);
    ctx.arcTo(x, y, x, y + radius, radius);
    ctx.fill();
  }

}

exports.Rect = Rect;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../core/utils":2}],4:[function(require,module,exports){
(function (global){(function (){
"use strict";

var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);

var _gantt = require("./controllers/gantt");

var _linearGantt = require("./scales/linear-gantt");

var _timeGantt = require("./scales/time-gantt");

var _rect = require("./elements/rect");

_chart.Chart.register(_gantt.GanttController);

_chart.Chart.register(_linearGantt.LinearGanttScale);

_chart.Chart.register(_timeGantt.TimeGanttScale);

_chart.Chart.register(_rect.Rect);

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./controllers/gantt":1,"./elements/rect":3,"./scales/linear-gantt":5,"./scales/time-gantt":7}],5:[function(require,module,exports){
(function (global){(function (){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LinearGanttScale = void 0;

var _scaleUtils = require("./scale-utils");

var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);

class LinearGanttScale extends _chart.LinearScale {
  static get id() {
    return 'linear-gantt';
  }

  getRightValue(rawValue) {
    return _scaleUtils.ScaleUtils.getRightValue(this, rawValue);
  }

  determineDataLimits() {
    _scaleUtils.ScaleUtils.determineDataLimits(this);

    this.handleTickRangeOptions();
  }

  getLabelForValue(value) {
    return value;
  }

}

exports.LinearGanttScale = LinearGanttScale;
LinearGanttScale.defaults = {
  ticks: {
    callback: value => value
  }
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./scale-utils":6}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ScaleUtils = void 0;

var _utils = require("../core/utils");

const helpers = Chart.helpers;
const ScaleUtils = {
  getRightValue: function (scale, rawValue) {
    if (_utils.Utils.isRange(rawValue)) return _utils.Utils.getMiddle(rawValue);
    return scale.__proto__.__proto__.getRightValue.call(scale, rawValue);
  },
  determineDataLimits: function (scale) {
    const chart = scale.chart;
    const defaults = Chart.defaults.gantt || {};
    const isHorizontal = scale.isHorizontal();

    function IDMatches(meta) {
      return isHorizontal ? meta.xAxisID === scale.id : meta.yAxisID === scale.id;
    }

    scale.min = null;
    scale.max = null;
    helpers.each(chart.data.datasets, function (dataset, datasetIndex) {
      const meta = chart.getDatasetMeta(datasetIndex);

      if (chart.isDatasetVisible(datasetIndex) && IDMatches(meta)) {
        const size = isHorizontal ? _utils.Utils.convertSize(scale, helpers.valueOrDefault(dataset.width, defaults.width)) : _utils.Utils.convertSize(scale, helpers.valueOrDefault(dataset.height, defaults.height));
        helpers.each(dataset.data, function (rawValue, index) {
          if (meta.data[index].hidden) {
            return;
          }

          const value = _utils.Utils.extendValue(_utils.Utils.getValue(rawValue, scale), size);

          if (typeof value !== "object" && isNaN(value)) return;

          _utils.Utils.normalize(value);

          if (scale.min === null || scale.min > value.from) scale.min = value.from;
          if (scale.max === null || scale.max < value.to) scale.max = value.to;
        });
      }
    });
  }
};
exports.ScaleUtils = ScaleUtils;

},{"../core/utils":2}],7:[function(require,module,exports){
(function (global){(function (){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimeGanttScale = void 0;

var _scaleUtils = require("./scale-utils");

var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);

class TimeGanttScale extends _chart.TimeScale {
  static get isTime() {
    return true;
  }

  static get id() {
    return 'time-gantt';
  }

  getRightValue(rawValue) {
    return _scaleUtils.ScaleUtils.getRightValue(this, rawValue);
  }

  determineDataLimits() {
    this.__proto__.__proto__.determineDataLimits.call(this); //ScaleUtils.determineDataLimits(this);

  }

  getLabelForValue(value) {
    return value;
  }

}

exports.TimeGanttScale = TimeGanttScale;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./scale-utils":6}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29udHJvbGxlcnMvZ2FudHQuanMiLCJzcmMvY29yZS91dGlscy5qcyIsInNyYy9lbGVtZW50cy9yZWN0LmpzIiwic3JjL2luZGV4LmpzIiwic3JjL3NjYWxlcy9saW5lYXItZ2FudHQuanMiLCJzcmMvc2NhbGVzL3NjYWxlLXV0aWxzLmpzIiwic3JjL3NjYWxlcy90aW1lLWdhbnR0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBOzs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTSxRQUFRLEdBQUcsYUFBTSxRQUF2QjtBQUVBLFFBQVEsQ0FBQyxRQUFULENBQWtCLEtBQWxCLEdBQTBCO0FBQ3RCLEVBQUEsV0FBVyxFQUFFLENBRFM7QUFFdEIsRUFBQSxXQUFXLEVBQUUsUUFBUSxDQUFDLFlBRkE7QUFHdEIsRUFBQSxlQUFlLEVBQUUsUUFBUSxDQUFDO0FBSEosQ0FBMUI7O0FBTU8sTUFBTSxlQUFOLFNBQThCLGFBQU0saUJBQXBDLENBQXNEO0FBQzVDLGFBQUYsRUFBRSxHQUFHO0FBQUUsV0FBTyxPQUFQO0FBQWlCOztBQUVuQyxFQUFBLFlBQVksQ0FBQyxJQUFELEVBQU8sT0FBUCxFQUFnQjtBQUN4QixXQUFPO0FBQ0gsTUFBQSxDQUFDLEVBQUUsYUFBTSxXQUFOLENBQWtCLElBQUksQ0FBQyxDQUF2QixFQUEwQixPQUFPLENBQUMsTUFBbEMsQ0FEQTtBQUVILE1BQUEsQ0FBQyxFQUFFLGFBQU0sV0FBTixDQUFrQixJQUFJLENBQUMsQ0FBdkIsRUFBMEIsT0FBTyxDQUFDLE9BQWxDO0FBRkEsS0FBUDtBQUlIOztBQUVELEVBQUEsV0FBVyxDQUFDLEtBQUQsRUFBUSxVQUFSLEVBQW9CO0FBQzNCLFVBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxnQkFBTixDQUF1QixVQUFVLENBQUMsSUFBbEMsQ0FBYjtBQUNBLFVBQU0sRUFBRSxHQUFHLEtBQUss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OUNxQixDQUFuQjs7Ozs7QUNOUDs7Ozs7OztBQUVBOztBQUNBOztBQUVPLE1BQU0sY0FBTixTQUE2QixnQkFBN0IsQ0FBdUM7QUFDekIsYUFBTixNQUFNLEdBQUc7QUFBRSxXQUFPLElBQVA7QUFBYzs7QUFDdkIsYUFBRixFQUFFLEdBQUc7QUFBRSxXQUFPLFlBQVA7QUFBc0I7O0FBRXhDLEVBQUEsYUFBYSxDQUFDLFFBQUQsRUFBVztBQUNwQixXQUFPLHVCQUFXLGFBQVgsQ0FBeUIsSUFBekIsRUFBK0IsUUFBL0IsQ0FBUDtBQUNIOztBQUVELEVBQUEsbUJBQW1CLEdBQUc7QUFDbEIsU0FBSyxTQUFMLENBQWUsU0FBZixDQUF5QixtQkFBekIsQ0FBNkMsSUFBN0MsQ0FBa0QsSUFBbEQsRUFEa0IsQ0FFbEI7O0FBQ0g7O0FBRUQsRUFBQSxnQkFBZ0IsQ0FBQyxLQUFELEVBQVE7QUFDcEIsV0FBTyxLQUFQO0FBQ0g7O0FBZnlDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCB7UmVjdH0gZnJvbSBcIi4uL2VsZW1lbnRzL3JlY3RcIjtcbmltcG9ydCB7VXRpbHN9IGZyb20gXCIuLi9jb3JlL3V0aWxzXCI7XG5pbXBvcnQge0NoYXJ0fSBmcm9tIFwiY2hhcnQuanNcIlxuXG5jb25zdCBkZWZhdWx0cyA9IENoYXJ0LmRlZmF1bHRzO1xuXG5kZWZhdWx0cy5lbGVtZW50cy5nYW50dCA9IHtcbiAgICBib3JkZXJXaWR0aDogMSxcbiAgICBib3JkZXJDb2xvcjogZGVmYXVsdHMuZGVmYXVsdENvbG9yLFxuICAgIGJhY2tncm91bmRDb2xvcjogZGVmYXVsdHMuZGVmYXVsdENvbG9yLFxufTtcblxuZXhwb3J0IGNsYXNzIEdhbnR0Q29udHJvbGxlciBleHRlbmRzIENoYXJ0LkRhdGFzZXRDb250cm9sbGVyIHtcbiAgICBzdGF0aWMgZ2V0IGlkKCkgeyByZXR1cm4gXCJnYW50dFwiOyB9XG5cbiAgICBfcHJlcGFyZURhdGEoZGF0YSwgZGF0YXNldCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogVXRpbHMuZXh0ZW5kVmFsdWUoZGF0YS54LCBkYXRhc2V0Ll93aWR0aCksXG4gICAgICAgICAgICB5OiBVdGlscy5leHRlbmRWYWx1ZShkYXRhLnksIGRhdGFzZXQuX2hlaWdodCksXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfY2FsY0JvdW5kcyhzY2FsZSwgc2NhbGVWYWx1ZSkge1xuICAgICAgICBjb25zdCBmcm9tID0gc2NhbGUuZ2V0UGl4ZWxGb3JWYWx1ZShzY2FsZVZhbHVlLmZyb20pO1xuICAgICAgICBjb25zdCB0byA9IHNjYWxlLmdldFBpeGVsRm9yVmFsdWUoc2NhbGVWYWx1ZS50byk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHtcbiAgICAgICAgICAgIGZyb206IGZyb20sXG4gICAgICAgICAgICB0bzogdG8sXG4gICAgICAgIH07XG4gICAgICAgIFV0aWxzLm5vcm1hbGl6ZShyZXMpO1xuICAgICAgICByZXMuc2l6ZSA9IHJlcy50byAtIHJlcy5mcm9tO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIHVwZGF0ZShyZXNldCkge1xuICAgICAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhKCk7XG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSB0aGlzLmdldERhdGFzZXQoKTtcbiAgICAgICAgY29uc3QgeFNjYWxlID0gdGhpcy5nZXRTY2FsZUZvcklkKG1ldGEueEF4aXNJRCk7XG4gICAgICAgIGNvbnN0IHlTY2FsZSA9IHRoaXMuZ2V0U2NhbGVGb3JJZChtZXRhLnlBeGlzSUQpO1xuXG4gICAgICAgIGRhdGFzZXQuX3dpZHRoID0gVXRpbHMuY29udmVydFNpemUoeFNjYWxlLCBDaGFydC5oZWxwZXJzLnZhbHVlT3JEZWZhdWx0KGRhdGFzZXQud2lkdGgsIGRlZmF1bHRzLmdhbnR0LndpZHRoKSk7XG4gICAgICAgIGRhdGFzZXQuX2hlaWdodCA9IFV0aWxzLmNvbnZlcnRTaXplKHlTY2FsZSwgQ2hhcnQuaGVscGVycy52YWx1ZU9yRGVmYXVsdChkYXRhc2V0LmhlaWdodCwgZGVmYXVsdHMuZ2FudHQuaGVpZ2h0KSk7XG5cbiAgICAgICAgY29uc3QgZ2xvYmFsT3B0aW9uR2FudHQgPSBkZWZhdWx0cy5lbGVtZW50cy5nYW50dDtcblxuICAgICAgICBjb25zdCBkYXRhID0gbWV0YS5kYXRhIHx8IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUVsZW1lbnQoZGF0YVtpXSwgaSwgcmVzZXQpO1xuICAgIH1cblxuICAgIHVwZGF0ZUVsZW1lbnRzKHBvaW50cywgc3RhcnQsIGNvdW50LCBtb2RlKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRWxlbWVudChwb2ludHNbaV0sIGksIG1vZGUgPT09ICdyZXNldCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlRWxlbWVudChwb2ludCwgaW5kZXgsIHJlc2V0KSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGEoKTtcbiAgICAgICAgY29uc3QgZGF0YXNldCA9IHRoaXMuZ2V0RGF0YXNldCgpO1xuICAgICAgICBjb25zdCBkYXRhc2V0SW5kZXggPSB0aGlzLmluZGV4O1xuICAgICAgICBjb25zdCB4U2NhbGUgPSB0aGlzLmdldFNjYWxlRm9ySWQobWV0YS54QXhpc0lEKTtcbiAgICAgICAgY29uc3QgeVNjYWxlID0gdGhpcy5nZXRTY2FsZUZvcklkKG1ldGEueUF4aXNJRCk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZGF0YXNldC5kYXRhW2luZGV4XTtcblxuICAgICAgICAvLyBVdGlsaXR5XG4gICAgICAgIHBvaW50Ll94U2NhbGUgPSB4U2NhbGU7XG4gICAgICAgIHBvaW50Ll95U2NhbGUgPSB5U2NhbGU7XG4gICAgICAgIHBvaW50Ll9kYXRhc2V0SW5kZXggPSBkYXRhc2V0SW5kZXg7XG4gICAgICAgIHBvaW50Ll9pbmRleCA9IGluZGV4O1xuXG4gICAgICAgIGNvbnN0IGZ1bGxQb2ludCA9IHRoaXMuX3ByZXBhcmVEYXRhKHZhbHVlLCBkYXRhc2V0KTtcblxuICAgICAgICBPYmplY3QuYXNzaWduKHBvaW50LCB7XG4gICAgICAgICAgICByZWN0OiB7XG4gICAgICAgICAgICAgICAgeDogdGhpcy5fY2FsY0JvdW5kcyh4U2NhbGUsIGZ1bGxQb2ludC54KSxcbiAgICAgICAgICAgICAgICB5OiB0aGlzLl9jYWxjQm91bmRzKHlTY2FsZSwgZnVsbFBvaW50LnkpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvcmRlcldpZHRoOiB2YWx1ZS5ib3JkZXJXaWR0aCB8fCB0aGlzLmJvcmRlcldpZHRoLFxuICAgICAgICAgICAgYm9yZGVyQ29sb3I6IHZhbHVlLmJvcmRlckNvbG9yIHx8IHRoaXMuYm9yZGVyQ29sb3IsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHZhbHVlLmJhY2tncm91bmRDb2xvciB8fCB0aGlzLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihwb2ludCwge1xuICAgICAgICAgICAgeDogVXRpbHMuZ2V0TWlkZGxlKHBvaW50LnJlY3QueCksXG4gICAgICAgICAgICB5OiBVdGlscy5nZXRNaWRkbGUocG9pbnQucmVjdC55KVxuICAgICAgICB9KTtcblxuICAgICAgICAvL3BvaW50LnBpdm90KCk7XG4gICAgfVxufVxuXG5HYW50dENvbnRyb2xsZXIuZGVmYXVsdHMgPSB7XG4gICAgZGF0YUVsZW1lbnRUeXBlOiBcInJlY3RcIixcbi8vICAgIGRhdGFzZXRFbGVtZW50VHlwZTogXCJyZWN0XCIsXG4gICAgaGVpZ2h0OiA1LFxuICAgIHdpZHRoOiA1XG59O1xuXG5DaGFydC5kZWZhdWx0cy5nYW50dCA9IEdhbnR0Q29udHJvbGxlci5vdmVycmlkZXMgPSB7XG4gICAgc2NhbGVzOiB7XG4gICAgICAgIF9pbmRleF86IHtcbiAgICAgICAgICAgIGlkOiAneCcsXG4gICAgICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgICAgICB0eXBlOiAndGltZS1nYW50dCcsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2JvdHRvbSdcbiAgICAgICAgfSxcbiAgICAgICAgX3ZhbHVlXzoge1xuICAgICAgICAgICAgaWQ6ICd5JyxcbiAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6ICdsaW5lYXItZ2FudHQnLFxuICAgICAgICAgICAgcG9zaXRpb246ICdsZWZ0J1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmV4cG9ydCBjb25zdCBVdGlscyA9IHtcbiAgICBfcGFyc2VJbnRlcnZhbDogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIpXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhcnNlZCA9IHZhbHVlLnRyaW0oKS50b0xvd2VyQ2FzZSgpLnNwbGl0KC9cXHMqKFxcZCspXFxzKi8pO1xuICAgICAgICAgICAgbGV0IGN1ciA9IFwibXNcIjtcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IHt9O1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IHBhcnNlZC5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbnVtID0gcGFyc2VGbG9hdChwYXJzZWRbaV0pXG4gICAgICAgICAgICAgICAgaWYgKGlzRmluaXRlKG51bSkpXG4gICAgICAgICAgICAgICAgICAgIG9ialtjdXJdID0gbnVtO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgY3VyID0gcGFyc2VkW2ldXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YWx1ZSA9IG9iajtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb2VmcyA9IHtcbiAgICAgICAgICAgIG1zOiAxLFxuICAgICAgICAgICAgczogMTAwMCxcbiAgICAgICAgICAgIG06IDEwMDAgKiA2MCxcbiAgICAgICAgICAgIGg6IDEwMDAgKiA2MCAqIDYwLFxuICAgICAgICAgICAgZDogMTAwMCAqIDYwICogNjAgKiAyNFxuICAgICAgICB9O1xuICAgICAgICBsZXQgcmVzID0gMDtcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoY29lZnNba2V5XSlcbiAgICAgICAgICAgICAgICByZXMgKz0gdmFsdWVba2V5XSAqIGNvZWZzW2tleV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgaXNSYW5nZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZS5mcm9tICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiB2YWx1ZS50byAhPT0gXCJ1bmRlZmluZWRcIjtcbiAgICB9LFxuXG4gICAgZ2V0VmFsdWU6IGZ1bmN0aW9uIChyYXdWYWx1ZSwgc2NhbGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiByYXdWYWx1ZSA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICByZXR1cm4gK3Jhd1ZhbHVlO1xuXG4gICAgICAgIC8vIE51bGwgYW5kIHVuZGVmaW5lZCB2YWx1ZXMgZmlyc3RcbiAgICAgICAgaWYgKHR5cGVvZiByYXdWYWx1ZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCByYXdWYWx1ZSA9PT0gbnVsbClcbiAgICAgICAgICAgIHJldHVybiBOYU47XG4gICAgICAgIC8vIGlzTmFOKG9iamVjdCkgcmV0dXJucyB0cnVlLCBzbyBtYWtlIHN1cmUgTmFOIGlzIGNoZWNraW5nIGZvciBhIG51bWJlcjsgRGlzY2FyZCBJbmZpbml0ZSB2YWx1ZXNcbiAgICAgICAgaWYgKHR5cGVvZiByYXdWYWx1ZSA9PT0gJ251bWJlcicgJiYgIWlzRmluaXRlKHJhd1ZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuIE5hTjtcbiAgICAgICAgfVxuICAgICAgICAvLyBJZiBpdCBpcyBpbiBmYWN0IGFuIG9iamVjdCwgZGl2ZSBpbiBvbmUgbW9yZSBsZXZlbFxuICAgICAgICBpZiAocmF3VmFsdWUpIHtcbiAgICAgICAgICAgIGNvbnN0IG5lc3RlZCA9IChzY2FsZS5pc0hvcml6b250YWwoKSkgPyByYXdWYWx1ZS54IDogcmF3VmFsdWUueTtcbiAgICAgICAgICAgIGlmIChuZXN0ZWQgIT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRWYWx1ZShuZXN0ZWQsIHNjYWxlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbHVlIGlzIGdvb2QsIHJldHVybiBpdFxuICAgICAgICByZXR1cm4gcmF3VmFsdWU7XG4gICAgfSxcblxuICAgIF9pbmNNaWxsaXNlY29uZHM6IGZ1bmN0aW9uKGRhdGUsIGFkZGVuZCkge1xuICAgICAgICBjb25zdCByZXMgPSBuZXcgRGF0ZShkYXRlKTtcbiAgICAgICAgcmVzLnNldE1pbGxpc2Vjb25kcyhyZXMuZ2V0TWlsbGlzZWNvbmRzKCkgKyBhZGRlbmQpO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH0sXG5cbiAgICBleHRlbmRWYWx1ZTogZnVuY3Rpb24gKHZhbHVlLCBkZWZTaXplKSB7XG4gICAgICAgIGlmICh0aGlzLmlzUmFuZ2UodmFsdWUpKVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICBpZiAoIWlzRmluaXRlKHZhbHVlKSlcbiAgICAgICAgICAgIHJldHVybiBOYU47XG5cbiAgICAgICAgY29uc3QgZGVsdGEgPSBkZWZTaXplIC8gMjtcbiAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBmcm9tOiB0aGlzLl9pbmNNaWxsaXNlY29uZHModmFsdWUsIC1kZWx0YSksXG4gICAgICAgICAgICAgICAgdG86IHRoaXMuX2luY01pbGxpc2Vjb25kcyh2YWx1ZSwgZGVsdGEpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZnJvbTogdmFsdWUgLSBkZWx0YSxcbiAgICAgICAgICAgIHRvOiB2YWx1ZSArIGRlbHRhLFxuICAgICAgICB9XG4gICAgfSxcblxuICAgIGlzVGltZVNjYWxlOiBmdW5jdGlvbihzY2FsZSkge1xuICAgICAgICByZXR1cm4gc2NhbGUuaXNUaW1lIHx8IHNjYWxlLnR5cGUgPT09IFwidGltZVwiO1xuICAgIH0sXG5cbiAgICBjb252ZXJ0U2l6ZTogZnVuY3Rpb24gKHNjYWxlLCBzaXplKSB7XG4gICAgICAgIHJldHVybiAodGhpcy5pc1RpbWVTY2FsZShzY2FsZSkpID8gdGhpcy5fcGFyc2VJbnRlcnZhbChzaXplKSA6IHNpemU7XG4gICAgfSxcblxuICAgIG5vcm1hbGl6ZTogZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgIGlmICh2YWx1ZS5mcm9tID4gdmFsdWUudG8pIHtcbiAgICAgICAgICAgIGNvbnN0IHRtcCA9IHZhbHVlLmZyb207XG4gICAgICAgICAgICB2YWx1ZS5mcm9tID0gdmFsdWUudG87XG4gICAgICAgICAgICB2YWx1ZS50byA9IHRtcDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfSxcblxuICAgIGdldE1pZGRsZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuICh2YWx1ZS5mcm9tICsgdmFsdWUudG8pIC8gMjtcbiAgICB9XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5pbXBvcnQge0VsZW1lbnQsIENoYXJ0fSBmcm9tIFwiY2hhcnQuanNcIlxuaW1wb3J0IHtVdGlsc30gZnJvbSBcIi4uL2NvcmUvdXRpbHNcIjtcblxuZXhwb3J0IGNsYXNzIFJlY3QgZXh0ZW5kcyBFbGVtZW50IHtcbiAgICBzdGF0aWMgZ2V0IGlkKCkgeyByZXR1cm4gXCJyZWN0XCI7IH1cblxuICAgIGluUmFuZ2UobW91c2VYLCBtb3VzZVkpIHtcbiAgICAgICAgY29uc3QgcmVjdCA9IHRoaXMucmVjdDtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIG1vdXNlWCA+PSByZWN0LnguZnJvbSAmJiBtb3VzZVggPD0gcmVjdC54LnRvICYmXG4gICAgICAgICAgICBtb3VzZVkgPj0gcmVjdC55LmZyb20gJiYgbW91c2VZIDw9IHJlY3QueS50b1xuICAgICAgICApO1xuICAgIH1cblxuICAgIGdldENlbnRlclBvaW50KCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogdGhpcy54LFxuICAgICAgICAgICAgeTogdGhpcy55LFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0QXJlYSgpIHtcbiAgICAgICAgY29uc3QgcmVjdCA9IHRoaXMucmVjdDtcbiAgICAgICAgcmV0dXJuIHJlY3QueC5zaXplICogcmVjdC55LnNpemU7XG4gICAgfVxuXG4gICAgZHJhdyhjdHgpIHtcbiAgICAgICAgY3R4LnNhdmUoKTtcblxuICAgICAgICBjdHgubGluZVdpZHRoID0gdGhpcy5ib3JkZXJXaWR0aDtcbiAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5ib3JkZXJDb2xvcjtcbiAgICAgICAgY3R4LmZpbGxTdHlsZSA9IHRoaXMuYmFja2dyb3VuZENvbG9yO1xuXG4gICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnJlY3Q7XG4gICAgICAgIHRoaXMucm91bmRlZFJlY3QoY3R4LCByZWN0LnguZnJvbSwgcmVjdC55LmZyb20sIHJlY3QueC5zaXplLCByZWN0Lnkuc2l6ZSwgNSk7XG5cbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcbiAgICB9XG5cbiAgICByb3VuZGVkUmVjdChjdHgsIHgsIHksIHdpZHRoLCBoZWlnaHQsIHJhZGl1cykge1xuICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIGN0eC5tb3ZlVG8oeCwgeSArIHJhZGl1cyk7XG4gICAgICAgIGN0eC5saW5lVG8oeCwgeSArIGhlaWdodCAtIHJhZGl1cyk7XG4gICAgICAgIGN0eC5hcmNUbyh4LCB5ICsgaGVpZ2h0LCB4ICsgcmFkaXVzLCB5ICsgaGVpZ2h0LCByYWRpdXMpO1xuICAgICAgICBjdHgubGluZVRvKHggKyB3aWR0aCAtIHJhZGl1cywgeSArIGhlaWdodCk7XG4gICAgICAgIGN0eC5hcmNUbyh4ICsgd2lkdGgsIHkgKyBoZWlnaHQsIHggKyB3aWR0aCwgeSArIGhlaWdodC1yYWRpdXMsIHJhZGl1cyk7XG4gICAgICAgIGN0eC5saW5lVG8oeCArIHdpZHRoLCB5ICsgcmFkaXVzKTtcbiAgICAgICAgY3R4LmFyY1RvKHggKyB3aWR0aCwgeSwgeCArIHdpZHRoIC0gcmFkaXVzLCB5LCByYWRpdXMpO1xuICAgICAgICBjdHgubGluZVRvKHggKyByYWRpdXMsIHkpO1xuICAgICAgICBjdHguYXJjVG8oeCwgeSwgeCwgeSArIHJhZGl1cywgcmFkaXVzKTtcbiAgICAgICAgY3R4LmZpbGwoKTtcbiAgICB9XG59XG4iLCJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IHtDaGFydH0gZnJvbSBcImNoYXJ0LmpzXCJcblxuaW1wb3J0IHtHYW50dENvbnRyb2xsZXJ9IGZyb20gJy4vY29udHJvbGxlcnMvZ2FudHQnO1xuaW1wb3J0IHtMaW5lYXJHYW50dFNjYWxlfSBmcm9tICcuL3NjYWxlcy9saW5lYXItZ2FudHQnXG5pbXBvcnQge1RpbWVHYW50dFNjYWxlfSBmcm9tIFwiLi9zY2FsZXMvdGltZS1nYW50dFwiO1xuaW1wb3J0IHtSZWN0fSBmcm9tIFwiLi9lbGVtZW50cy9yZWN0XCI7XG5cbkNoYXJ0LnJlZ2lzdGVyKEdhbnR0Q29udHJvbGxlcik7XG5DaGFydC5yZWdpc3RlcihMaW5lYXJHYW50dFNjYWxlKTtcbkNoYXJ0LnJlZ2lzdGVyKFRpbWVHYW50dFNjYWxlKTtcbkNoYXJ0LnJlZ2lzdGVyKFJlY3QpOyIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtTY2FsZVV0aWxzfSBmcm9tIFwiLi9zY2FsZS11dGlsc1wiO1xuaW1wb3J0IHtMaW5lYXJTY2FsZX0gZnJvbSBcImNoYXJ0LmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBMaW5lYXJHYW50dFNjYWxlIGV4dGVuZHMgTGluZWFyU2NhbGUge1xuICAgIHN0YXRpYyBnZXQgaWQoKSB7IHJldHVybiAnbGluZWFyLWdhbnR0JzsgfVxuXG4gICAgZ2V0UmlnaHRWYWx1ZShyYXdWYWx1ZSkge1xuICAgICAgICByZXR1cm4gU2NhbGVVdGlscy5nZXRSaWdodFZhbHVlKHRoaXMsIHJhd1ZhbHVlKTtcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVEYXRhTGltaXRzKCkge1xuICAgICAgICBTY2FsZVV0aWxzLmRldGVybWluZURhdGFMaW1pdHModGhpcyk7XG4gICAgICAgIHRoaXMuaGFuZGxlVGlja1JhbmdlT3B0aW9ucygpO1xuICAgIH1cblxuICAgIGdldExhYmVsRm9yVmFsdWUodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbn1cblxuTGluZWFyR2FudHRTY2FsZS5kZWZhdWx0cyA9IHtcbiAgICB0aWNrczoge1xuICAgICAgICBjYWxsYmFjazogdmFsdWUgPT4gdmFsdWVcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge1V0aWxzfSBmcm9tIFwiLi4vY29yZS91dGlsc1wiO1xuXG5jb25zdCBoZWxwZXJzID0gQ2hhcnQuaGVscGVycztcblxuZXhwb3J0IGNvbnN0IFNjYWxlVXRpbHMgPSB7XG4gICAgZ2V0UmlnaHRWYWx1ZTogZnVuY3Rpb24gKHNjYWxlLCByYXdWYWx1ZSkge1xuICAgICAgICBpZiAoVXRpbHMuaXNSYW5nZShyYXdWYWx1ZSkpXG4gICAgICAgICAgICByZXR1cm4gVXRpbHMuZ2V0TWlkZGxlKHJhd1ZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHNjYWxlLl9fcHJvdG9fXy5fX3Byb3RvX18uZ2V0UmlnaHRWYWx1ZS5jYWxsKHNjYWxlLCByYXdWYWx1ZSk7XG4gICAgfSxcblxuICAgIGRldGVybWluZURhdGFMaW1pdHM6IGZ1bmN0aW9uIChzY2FsZSkge1xuICAgICAgICBjb25zdCBjaGFydCA9IHNjYWxlLmNoYXJ0O1xuICAgICAgICBjb25zdCBkZWZhdWx0cyA9IENoYXJ0LmRlZmF1bHRzLmdhbnR0IHx8IHt9O1xuICAgICAgICBjb25zdCBpc0hvcml6b250YWwgPSBzY2FsZS5pc0hvcml6b250YWwoKTtcblxuICAgICAgICBmdW5jdGlvbiBJRE1hdGNoZXMobWV0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/IG1ldGEueEF4aXNJRCA9PT0gc2NhbGUuaWQgOiBtZXRhLnlBeGlzSUQgPT09IHNjYWxlLmlkO1xuICAgICAgICB9XG5cbiAgICAgICAgc2NhbGUubWluID0gbnVsbDtcbiAgICAgICAgc2NhbGUubWF4ID0gbnVsbDtcblxuICAgICAgICBoZWxwZXJzLmVhY2goY2hhcnQuZGF0YS5kYXRhc2V0cywgZnVuY3Rpb24gKGRhdGFzZXQsIGRhdGFzZXRJbmRleCkge1xuICAgICAgICAgICAgY29uc3QgbWV0YSA9IGNoYXJ0LmdldERhdGFzZXRNZXRhKGRhdGFzZXRJbmRleCk7XG4gICAgICAgICAgICBpZiAoY2hhcnQuaXNEYXRhc2V0VmlzaWJsZShkYXRhc2V0SW5kZXgpICYmIElETWF0Y2hlcyhtZXRhKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpemUgPSAoaXNIb3Jpem9udGFsKSA/XG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmNvbnZlcnRTaXplKHNjYWxlLCBoZWxwZXJzLnZhbHVlT3JEZWZhdWx0KGRhdGFzZXQud2lkdGgsIGRlZmF1bHRzLndpZHRoKSkgOlxuICAgICAgICAgICAgICAgICAgICBVdGlscy5jb252ZXJ0U2l6ZShzY2FsZSwgaGVscGVycy52YWx1ZU9yRGVmYXVsdChkYXRhc2V0LmhlaWdodCwgZGVmYXVsdHMuaGVpZ2h0KSk7XG5cbiAgICAgICAgICAgICAgICBoZWxwZXJzLmVhY2goZGF0YXNldC5kYXRhLCBmdW5jdGlvbiAocmF3VmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXRhLmRhdGFbaW5kZXhdLmhpZGRlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBVdGlscy5leHRlbmRWYWx1ZShVdGlscy5nZXRWYWx1ZShyYXdWYWx1ZSwgc2NhbGUpLCBzaXplKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiICYmIGlzTmFOKHZhbHVlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICBVdGlscy5ub3JtYWxpemUodmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsZS5taW4gPT09IG51bGwgfHwgc2NhbGUubWluID4gdmFsdWUuZnJvbSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlLm1pbiA9IHZhbHVlLmZyb207XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxlLm1heCA9PT0gbnVsbCB8fCBzY2FsZS5tYXggPCB2YWx1ZS50bylcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlLm1heCA9IHZhbHVlLnRvO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5cbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtTY2FsZVV0aWxzfSBmcm9tIFwiLi9zY2FsZS11dGlsc1wiO1xuaW1wb3J0IHtUaW1lU2NhbGV9IGZyb20gXCJjaGFydC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgVGltZUdhbnR0U2NhbGUgZXh0ZW5kcyBUaW1lU2NhbGUge1xuICAgIHN0YXRpYyBnZXQgaXNUaW1lKCkgeyByZXR1cm4gdHJ1ZTsgfVxuICAgIHN0YXRpYyBnZXQgaWQoKSB7IHJldHVybiAndGltZS1nYW50dCc7IH1cblxuICAgIGdldFJpZ2h0VmFsdWUocmF3VmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIFNjYWxlVXRpbHMuZ2V0UmlnaHRWYWx1ZSh0aGlzLCByYXdWYWx1ZSk7XG4gICAgfVxuXG4gICAgZGV0ZXJtaW5lRGF0YUxpbWl0cygpIHtcbiAgICAgICAgdGhpcy5fX3Byb3RvX18uX19wcm90b19fLmRldGVybWluZURhdGFMaW1pdHMuY2FsbCh0aGlzKTtcbiAgICAgICAgLy9TY2FsZVV0aWxzLmRldGVybWluZURhdGFMaW1pdHModGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0TGFiZWxGb3JWYWx1ZSh2YWx1ZSkge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxufVxuIl19
