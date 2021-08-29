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
exports.GanttController = GanttController;

var _rect = require("../elements/rect");

var _utils = require("../core/utils");

var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);

const defaults = _chart.Chart.defaults;
defaults.elements.gantt = {
  borderWidth: 1,
  borderColor: defaults.defaultColor,
  backgroundColor: defaults.defaultColor
};

class GanttControllerZ extends _chart.Chart.DatasetController {
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

GanttControllerZ.defaults = {
  dataElementType: "rect",
  //    datasetElementType: "rect",
  height: 5,
  width: 5
};
_chart.Chart.defaults.gantt = GanttControllerZ.overrides = {
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

function GanttController(Chart) {
  Chart.register(GanttControllerZ);
}

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
    ctx.fillRect(rect.x.from, rect.y.from, rect.x.size, rect.y.size);
    ctx.strokeRect(rect.x.from, rect.y.from, rect.x.size, rect.y.size);
    ctx.restore();
  }

}

exports.Rect = Rect;

_chart.Chart.register(Rect);

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../core/utils":2}],4:[function(require,module,exports){
(function (global){(function (){
"use strict";

var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);

var _gantt = require("./controllers/gantt");

var _linearGantt = require("./scales/linear-gantt");

var _timeGantt = require("./scales/time-gantt");

(0, _gantt.GanttController)(_chart.Chart);
(0, _linearGantt.LinearGanttScale)(_chart.Chart);
(0, _timeGantt.TimeGanttScale)(_chart.Chart);

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./controllers/gantt":1,"./scales/linear-gantt":5,"./scales/time-gantt":7}],5:[function(require,module,exports){
(function (global){(function (){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LinearGanttScale = LinearGanttScale;

var _scaleUtils = require("./scale-utils");

var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);

class LinearGanttScaleZ extends _chart.LinearScale {
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
    console.log("val", value);
    return value;
  }

}

LinearGanttScaleZ.defaults = {
  ticks: {
    callback: value => value
  }
};

function LinearGanttScale(Chart) {
  Chart.register(LinearGanttScaleZ);
}

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
  },
  getLabelForIndex: function (scale, index, datasetIndex) {
    const data = scale.chart.data.datasets[datasetIndex].data[index];
    const val = scale.isHorizontal() ? data.x : data.y;
    if (_utils.Utils.isRange(val)) return val.from + "~" + val.to;
    return val;
  }
};
exports.ScaleUtils = ScaleUtils;

},{"../core/utils":2}],7:[function(require,module,exports){
(function (global){(function (){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TimeGanttScale = TimeGanttScale;

var _scaleUtils = require("./scale-utils");

var _chart = (typeof window !== "undefined" ? window['Chart'] : typeof global !== "undefined" ? global['Chart'] : null);

class TimeGanttScaleZ extends _chart.TimeScale {
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
    this.__proto__.__proto__.determineDataLimits.call(this);

    _scaleUtils.ScaleUtils.determineDataLimits(this);
  }

  getLabelForValue(value) {
    console.log("val", value);
    return value;
  }

}

function TimeGanttScale(Chart) {
  Chart.register(TimeGanttScaleZ);
}

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./scale-utils":6}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29udHJvbGxlcnMvZ2FudHQuanMiLCJzcmMvY29yZS91dGlscy5qcyIsInNyYy9lbGVtZW50cy9yZWN0LmpzIiwic3JjL2luZGV4LmpzIiwic3JjL3NjYWxlcy9saW5lYXItZ2FudHQuanMiLCJzcmMvc2NhbGVzL3NjYWxlLXV0aWxzLmpzIiwic3JjL3NjYWxlcy90aW1lLWdhbnR0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOztBQ0FBOzs7Ozs7O0FBRUE7O0FBQ0E7O0FBQ0E7O0FBRUEsTUFBTSxRQUFRLEdBQUcsYUFBTSxRQUF2QjtBQUVBLFFBQVEsQ0FBQyxRQUFULENBQWtCLEtBQWxCLEdBQTBCO0FBQ3RCLEVBQUEsV0FBVyxFQUFFLENBRFM7QUFFdEIsRUFBQSxXQUFXLEVBQUUsUUFBUSxDQUFDLFlBRkE7QUFHdEIsRUFBQSxlQUFlLEVBQUUsUUFBUSxDQUFDO0FBSEosQ0FBMUI7O0FBTUEsTUFBTSxnQkFBTixTQUErQixhQUFNLGlCQUFyQyxDQUF1RDtBQUN0QyxhQUFGLEVBQUUsR0FBRztBQUFFLFdBQU8sT0FBUDtBQUFpQjs7QUFFbkMsRUFBQSxZQUFZLENBQUMsSUFBRCxFQUFPLE9BQVAsRUFBZ0I7QUFDeEIsV0FBTztBQUNILE1BQUEsQ0FBQyxFQUFFLGFBQU0sV0FBTixDQUFrQixJQUFJLENBQUMsQ0FBdkIsRUFBMEIsT0FBTyxDQUFDLE1BQWxDLENBREE7QUFFSCxNQUFBLENBQUMsRUFBRSxhQUFNLFdBQU4sQ0FBa0IsSUFBSSxDQUFDLENBQXZCLEVBQTBCLE9BQU8sQ0FBQyxPQUFsQztBQUZBLEtBQVA7QUFJSDs7QUFFRCxFQUFBLFdBQVcsQ0FBQyxLQUFELEVBQVEsVUFBUixFQUFvQjtBQUMzQixVQUFNLElBQUksR0FBRyxLQUFLLENBQUMsZ0JBQU4sQ0FBdUIsVUFBVSxDQUFDLElBQWxDLENBQWI7QUFDQSxVQUFNLEVBQUUsR0FBRyxLQUFLLENBQUMsZ0JBQU4sQ0FBdUIsVUFBVSxDQUFDLEVBQWxDLENBQVg7QUFDQSxVQUFNLEdBQUcsR0FBRztBQUNSLE1BQUEsSUFBSSxFQUFFLElBREU7QUFFUixNQUFBLEVBQUUsRUFBRTtBQUZJLEtBQVo7O0FBSUEsaUJBQU0sU0FBTixDQUFnQixHQUFoQjs7QUFDQSxJQUFBLEdBQUcsQ0FBQyxJQUFKLEdBQVcsR0FBRyxDQUFDLEVBQUosR0FBUyxHQUFHLENBQUMsSUFBeEI7QUFDQSxXQUFPLEdBQVA7QUFDSDs7QUFFRCxFQUFBLE1BQU0sQ0FBQyxLQUFELEVBQVE7QUFDVixVQUFNLElBQUksR0FBRyxLQUFLLE9BQUwsRUFBYjtBQUNBLFVBQU0sT0FBTyxHQUFHLEtBQUssVUFBTCxFQUFoQjtBQUNBLFVBQU0sTUFBTSxHQUFHLEtBQUssYUFBTCxDQUFtQixJQUFJLENBQUMsT0FBeEIsQ0FBZjtBQUNBLFVBQU0sTUFBTSxHQUFHLEtBQUssYUFBTCxDQUFtQixJQUFJLENBQUMsT0FBeEIsQ0FBZjtBQUVBLElBQUEsT0FBTyxDQUFDLE1BQVIsR0FBaUIsYUFBTSxXQUFOLENBQWtCLE1BQWxCLEVBQTBCLGFBQU0sT0FBTixDQUFjLGNBQWQsQ0FBNkIsT0FBTyxDQUFDLEtBQXJDLEVBQTRDLFFBQVEsQ0FBQyxLQUFULENBQWUsS0FBM0QsQ0FBMUIsQ0FBakI7QUFDQSxJQUFBLE9BQU8sQ0FBQyxPQUFSLEdBQWtCLGFBQU0sV0FBTixDQUFrQixNQUFsQixFQUEwQixhQUFNLE9BQU4sQ0FBYyxjQUFkLENBQTZCLE9BQU8sQ0FBQyxNQUFyQyxFQUE2QyxRQUFRLENBQUMsS0FBVCxDQUFlLE1BQTVELENBQTFCLENBQWxCO0FBRUEsVUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsUUFBVCxDQUFrQixLQUE1QztBQUVBLFVBQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFMLElBQWEsRUFBMUI7O0FBQ0EsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFiLEVBQWdCLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBekIsRUFBaUMsQ0FBQyxFQUFsQyxFQUNJLEtBQUssYUFBTCxDQUFtQixJQUFJLENBQUMsQ0FBRCxDQUF2QixFQUE0QixDQUE1QixFQUErQixLQUEvQjtBQUNQOztBQUVELEVBQUEsY0FBYyxDQUFDLE1BQUQsRUFBUyxLQUFULEVBQWdCLEtBQWhCLEVBQXVCLElBQXZCLEVBQTZCO0FBQ3ZDLFNBQUssSUFBSSxDQUFDLEdBQUcsS0FBYixFQUFvQixDQUFDLEdBQUcsS0FBeEIsRUFBK0IsQ0FBQyxFQUFoQyxFQUFvQztBQUNoQyxXQUFLLGFBQUwsQ0FBbUIsTUFBTSxDQUFDLENBQUQsQ0FBekIsRUFBOEIsQ0FBOUIsRUFBaUMsSUFBSSxLQUFLLE9BQTFDO0FBQ0g7QUFDSjs7QUFFRCxFQUFBLGFBQWEsQ0FBQyxLQUFELEVBQVEsS0FBUixFQUFlLEtBQWYsRUFBc0I7QUFDL0IsVUFBTSxJQUFJLEdBQUcsS0FBSyxPQUFMLEVBQWI7QUFDQSxVQUFNLE9BQU8sR0FBRyxLQUFLLFVBQUwsRUFBaEI7QUFDQSxVQUFNLFlBQVksR0FBRyxLQUFLLEtBQTFCO0FBQ0EsVUFBTSxNQUFNLEdBQUcsS0FBSyxhQUFMLENBQW1CLElBQUksQ0FBQyxPQUF4QixDQUFmO0FBQ0EsVUFBTSxNQUFNLEdBQUcsS0FBSyxhQUFMLENBQW1CLElBQUksQ0FBQyxPQUF4QixDQUFmO0FBQ0EsVUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQVIsQ0FBYSxLQUFiLENBQWQsQ0FOK0IsQ0FRL0I7O0FBQ0EsSUFBQSxLQUFLLENBQUMsT0FBTixHQUFnQixNQUFoQjtBQUNBLElBQUEsS0FBSyxDQUFDLE9BQU4sR0FBZ0IsTUFBaEI7QUFDQSxJQUFBLEtBQUssQ0FBQyxhQUFOLEdBQXNCLFlBQXRCO0FBQ0EsSUFBQSxLQUFLLENBQUMsTUFBTixHQUFlLEtBQWY7O0FBRUEsVUFBTSxTQUFTLEdBQUcsS0FBSyxZQUFMLENBQWtCLEtBQWxCLEVBQXlCLE9BQXpCLENBQWxCOztBQUVBLElBQUEsTUFBTSxDQUFDLE1BQVAsQ0FBYyxLQUFkLEVBQXFCO0FBQ2pCLE1BQUEsSUFBSSxFQUFFO0FBQ0YsUUFBQSxDQUFDLEVBQUUsS0FBSyxXQUFMLENBQWlCLE1BQWpCLEVBQXlCLFNBQVMsQ0FBQyxDQUFuQyxDQUREO0FBRUYsUUFBQSxDQUFDLEVBQUUsS0FBSyxXQUFMLENBQWlCLE1BQWpCLEVBQXlCLFNBQVMsQ0FBQyxDQUFuQztBQUZELE9BRFc7QUFLakIsTUFBQSxXQUFXLEVBQUUsS0FBSyxDQUFDLFdBQU4sSUFBcUIsS0FBSyxXQUx0QjtBQU1qQixNQUFBLFdBQVcsRUFBRSxLQUFLLENBQUMsV0FBTixJQUFxQixLQUFLLFdBTnRCO0FBT2pCLE1BQUEsZUFBZSxFQUFFLEtBQUssQ0FBQyxlQUFOLElBQXlCLEtBQUs7QUFQOUIsS0FBckI7QUFVQSxJQUFBLE1BQU0sQ0FBQyxNQUFQLENBQWMsS0FBZCxFQUFxQjtBQUNqQixNQUFBLENBQUMsRUFBRSxhQUFNLFNBQU4sQ0FBZ0IsS0FBSyxDQUFDLElBQU4sQ0FBVyxDQUEzQixDQURjO0FBRWpCLE1BQUEsQ0FBQyxFQUFFLGFBQU0sU0FBTixDQUFnQixLQUFLLENBQUMsSUFBTixDQUFXLENBQTNCO0FBRmMsS0FBckIsRUExQitCLENBK0IvQjtBQUNIOztBQTVFa0Q7O0FBK0V2RCxnQkFBZ0IsQ0FBQyxRQUFqQixHQUE0QjtBQUN4QixFQUFBLGVBQWUsRUFBRSxNQURPO0FBRTVCO0FBQ0ksRUFBQSxNQUFNLEVBQUUsQ0FIZ0I7QUFJeEIsRUFBQSxLQUFLLEVBQUU7QUFKaUIsQ0FBNUI7QUFPQSxhQUFNLFFBQU4sQ0FBZSxLQUFmLEdBQXVCLGdCQUFnQixDQUFDLFNBQWpCLEdBQTZCO0FBQ2hELEVBQUEsTUFBTSxFQUFFO0FBQ0osSUFBQSxPQUFPLEVBQUU7QUFDTCxNQUFBLEVBQUUsRUFBRSxHQURDO0FBRUwsTUFBQSxNQUFNLEVBQUUsSUFGSDtBQUdMLE1BQUEsSUFBSSxFQUFFLFlBSEQ7QUFJTCxNQUFBLFFBQVEsRUFBRTtBQUpMLEtBREw7QUFPSixJQUFBLE9BQU8sRUFBRTtBQUNMLE1BQUEsRUFBRSxFQUFFLEdBREM7QUFFTCxNQUFBLE1BQU0sRUFBRSxJQUZIO0FBR0wsTUFBQSxJQUFJLEVBQUUsY0FIRDtBQUlMLE1BQUEsUUFBUSxFQUFFO0FBSkw7QUFQTDtBQUR3QyxDQUFwRDs7QUFpQk8sU0FBUyxlQUFULENBQXlCLEtBQXpCLEVBQWdDO0FBQ25DLEVBQUEsS0FBSyxDQUFDLFFBQU4sQ0FBZSxnQkFBZjtBQUNIOzs7OztBQ3ZIRDs7Ozs7O0FBRU8sTUFBTSxLQUFLLEdBQUc7QUFDakIsRUFBQSxjQUFjLEVBQUUsVUFBVSxLQUFWLEVBQWlCO0FBQzdCLFFBQUksT0FBTyxLQUFQLEtBQWlCLFFBQXJCLEVBQ0ksT0FBTyxLQUFQOztBQUNKLFFBQUksT0FBTyxLQUFQLEtBQWlCLFFBQXJCLEVBQStCO0FBQzNCLFlBQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxJQUFOLEdBQWEsV0FBYixHQUEyQixLQUEzQixDQUFpQyxhQUFqQyxDQUFmO0FBQ0EsVUFBSSxHQUFHLEdBQUcsSUFBVjtBQUNBLFlBQU0sR0FBRyxHQUFHLEVBQVo7O0FBQ0EsV0FBSyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBUCxHQUFnQixDQUE3QixFQUFnQyxDQUFDLEdBQUcsQ0FBcEMsRUFBdUMsQ0FBQyxFQUF4QyxFQUE0QztBQUN4QyxjQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUQsQ0FBUCxDQUF0QjtBQUNBLFlBQUksUUFBUSxDQUFDLEdBQUQsQ0FBWixFQUNJLEdBQUcsQ0FBQyxHQUFELENBQUgsR0FBVyxHQUFYLENBREosS0FHSSxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUQsQ0FBWjtBQUNQOztBQUNELE1BQUEsS0FBSyxHQUFHLEdBQVI7QUFDSDs7QUFDRCxVQUFNLEtBQUssR0FBRztBQUNWLE1BQUEsRUFBRSxFQUFFLENBRE07QUFFVixNQUFBLENBQUMsRUFBRSxJQUZPO0FBR1YsTUFBQSxDQUFDLEVBQUUsT0FBTyxFQUhBO0FBSVYsTUFBQSxDQUFDLEVBQUUsT0FBTyxFQUFQLEdBQVksRUFKTDtBQUtWLE1BQUEsQ0FBQyxFQUFFLE9BQU8sRUFBUCxHQUFZLEVBQVosR0FBaUI7QUFMVixLQUFkO0FBT0EsUUFBSSxHQUFHLEdBQUcsQ0FBVjs7QUFDQSxTQUFLLElBQUksR0FBVCxJQUFnQixLQUFoQixFQUF1QjtBQUNuQixVQUFJLEtBQUssQ0FBQyxHQUFELENBQVQsRUFDSSxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUQsQ0FBTCxHQUFhLEtBQUssQ0FBQyxHQUFELENBQXpCO0FBQ1A7O0FBQ0QsV0FBTyxHQUFQO0FBQ0gsR0E5QmdCO0FBZ0NqQixFQUFBLE9BQU8sRUFBRSxVQUFTLEtBQVQsRUFBZ0I7QUFDckIsV0FBTyxPQUFPLEtBQUssQ0FBQyxJQUFiLEtBQXNCLFdBQXRCLElBQXFDLE9BQU8sS0FBSyxDQUFDLEVBQWIsS0FBb0IsV0FBaEU7QUFDSCxHQWxDZ0I7QUFvQ2pCLEVBQUEsUUFBUSxFQUFFLFVBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQjtBQUNqQyxRQUFJLE9BQU8sUUFBUCxLQUFvQixRQUF4QixFQUNJLE9BQU8sQ0FBQyxRQUFSLENBRjZCLENBSWpDOztBQUNBLFFBQUksT0FBTyxRQUFQLEtBQW9CLFdBQXBCLElBQW1DLFFBQVEsS0FBSyxJQUFwRCxFQUNJLE9BQU8sR0FBUCxDQU42QixDQU9qQzs7QUFDQSxRQUFJLE9BQU8sUUFBUCxLQUFvQixRQUFwQixJQUFnQyxDQUFDLFFBQVEsQ0FBQyxRQUFELENBQTdDLEVBQXlEO0FBQ3JELGFBQU8sR0FBUDtBQUNILEtBVmdDLENBV2pDOzs7QUFDQSxRQUFJLFFBQUosRUFBYztBQUNWLFlBQU0sTUFBTSxHQUFJLEtBQUssQ0FBQyxZQUFOLEVBQUQsR0FBeUIsUUFBUSxDQUFDLENBQWxDLEdBQXNDLFFBQVEsQ0FBQyxDQUE5RDtBQUNBLFVBQUksTUFBTSxLQUFLLFNBQWYsRUFDSSxPQUFPLEtBQUssUUFBTCxDQUFjLE1BQWQsRUFBc0IsS0FBdEIsQ0FBUDtBQUNQLEtBaEJnQyxDQWtCakM7OztBQUNBLFdBQU8sUUFBUDtBQUNILEdBeERnQjtBQTBEakIsRUFBQSxnQkFBZ0IsRUFBRSxVQUFTLElBQVQsRUFBZSxNQUFmLEVBQXVCO0FBQ3JDLFVBQU0sR0FBRyxHQUFHLElBQUksSUFBSixDQUFTLElBQVQsQ0FBWjtBQUNBLElBQUEsR0FBRyxDQUFDLGVBQUosQ0FBb0IsR0FBRyxDQUFDLGVBQUosS0FBd0IsTUFBNUM7QUFDQSxXQUFPLEdBQVA7QUFDSCxHQTlEZ0I7QUFnRWpCLEVBQUEsV0FBVyxFQUFFLFVBQVUsS0FBVixFQUFpQixPQUFqQixFQUEwQjtBQUNuQyxRQUFJLEtBQUssT0FBTCxDQUFhLEtBQWIsQ0FBSixFQUNJLE9BQU8sS0FBUDtBQUNKLFFBQUksQ0FBQyxRQUFRLENBQUMsS0FBRCxDQUFiLEVBQ0ksT0FBTyxHQUFQO0FBRUosVUFBTSxLQUFLLEdBQUcsT0FBTyxHQUFHLENBQXhCOztBQUNBLFFBQUksS0FBSyxZQUFZLElBQXJCLEVBQTJCO0FBQ3ZCLGFBQU87QUFDSCxRQUFBLElBQUksRUFBRSxLQUFLLGdCQUFMLENBQXNCLEtBQXRCLEVBQTZCLENBQUMsS0FBOUIsQ0FESDtBQUVILFFBQUEsRUFBRSxFQUFFLEtBQUssZ0JBQUwsQ0FBc0IsS0FBdEIsRUFBNkIsS0FBN0I7QUFGRCxPQUFQO0FBSUg7O0FBQ0QsV0FBTztBQUNILE1BQUEsSUFBSSxFQUFFLEtBQUssR0FBRyxLQURYO0FBRUgsTUFBQSxFQUFFLEVBQUUsS0FBSyxHQUFHO0FBRlQsS0FBUDtBQUlILEdBakZnQjtBQW1GakIsRUFBQSxXQUFXLEVBQUUsVUFBUyxLQUFULEVBQWdCO0FBQ3pCLFdBQU8sS0FBSyxDQUFDLE1BQU4sSUFBZ0IsS0FBSyxDQUFDLElBQU4sS0FBZSxNQUF0QztBQUNILEdBckZnQjtBQXVGakIsRUFBQSxXQUFXLEVBQUUsVUFBVSxLQUFWLEVBQWlCLElBQWpCLEVBQXVCO0FBQ2hDLFdBQVEsS0FBSyxXQUFMLENBQWlCLEtBQWpCLENBQUQsR0FBNEIsS0FBSyxjQUFMLENBQW9CLElBQXBCLENBQTVCLEdBQXdELElBQS9EO0FBQ0gsR0F6RmdCO0FBMkZqQixFQUFBLFNBQVMsRUFBRSxVQUFVLEtBQVYsRUFBaUI7QUFDeEIsUUFBSSxLQUFLLENBQUMsSUFBTixHQUFhLEtBQUssQ0FBQyxFQUF2QixFQUEyQjtBQUN2QixZQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBbEI7QUFDQSxNQUFBLEtBQUssQ0FBQyxJQUFOLEdBQWEsS0FBSyxDQUFDLEVBQW5CO0FBQ0EsTUFBQSxLQUFLLENBQUMsRUFBTixHQUFXLEdBQVg7QUFDSDs7QUFDRCxXQUFPLEtBQVA7QUFDSCxHQWxHZ0I7QUFvR2pCLEVBQUEsU0FBUyxFQUFFLFVBQVMsS0FBVCxFQUFnQjtBQUN2QixXQUFPLENBQUMsS0FBSyxDQUFDLElBQU4sR0FBYSxLQUFLLENBQUMsRUFBcEIsSUFBMEIsQ0FBakM7QUFDSDtBQXRHZ0IsQ0FBZDs7Ozs7QUNGUDs7Ozs7OztBQUVBOztBQUNBOztBQUVPLE1BQU0sSUFBTixTQUFtQixjQUFuQixDQUEyQjtBQUNqQixhQUFGLEVBQUUsR0FBRztBQUFFLFdBQU8sTUFBUDtBQUFnQjs7QUFFbEMsRUFBQSxPQUFPLENBQUMsTUFBRCxFQUFTLE1BQVQsRUFBaUI7QUFDcEIsVUFBTSxJQUFJLEdBQUcsS0FBSyxJQUFsQjtBQUNBLFdBQ0ksTUFBTSxJQUFJLElBQUksQ0FBQyxDQUFMLENBQU8sSUFBakIsSUFBeUIsTUFBTSxJQUFJLElBQUksQ0FBQyxDQUFMLENBQU8sRUFBMUMsSUFDQSxNQUFNLElBQUksSUFBSSxDQUFDLENBQUwsQ0FBTyxJQURqQixJQUN5QixNQUFNLElBQUksSUFBSSxDQUFDLENBQUwsQ0FBTyxFQUY5QztBQUlIOztBQUVELEVBQUEsY0FBYyxHQUFHO0FBQ2IsV0FBTztBQUNILE1BQUEsQ0FBQyxFQUFFLEtBQUssQ0FETDtBQUVILE1BQUEsQ0FBQyxFQUFFLEtBQUs7QUFGTCxLQUFQO0FBSUg7O0FBRUQsRUFBQSxPQUFPLEdBQUc7QUFDTixVQUFNLElBQUksR0FBRyxLQUFLLElBQWxCO0FBQ0EsV0FBTyxJQUFJLENBQUMsQ0FBTCxDQUFPLElBQVAsR0FBYyxJQUFJLENBQUMsQ0FBTCxDQUFPLElBQTVCO0FBQ0g7O0FBRUQsRUFBQSxJQUFJLENBQUMsR0FBRCxFQUFNO0FBQ04sSUFBQSxHQUFHLENBQUMsSUFBSjtBQUVBLElBQUEsR0FBRyxDQUFDLFNBQUosR0FBZ0IsS0FBSyxXQUFyQjtBQUNBLElBQUEsR0FBRyxDQUFDLFdBQUosR0FBa0IsS0FBSyxXQUF2QjtBQUNBLElBQUEsR0FBRyxDQUFDLFNBQUosR0FBZ0IsS0FBSyxlQUFyQjtBQUVBLFVBQU0sSUFBSSxHQUFHLEtBQUssSUFBbEI7QUFDQSxJQUFBLEdBQUcsQ0FBQyxRQUFKLENBQWEsSUFBSSxDQUFDLENBQUwsQ0FBTyxJQUFwQixFQUEwQixJQUFJLENBQUMsQ0FBTCxDQUFPLElBQWpDLEVBQXVDLElBQUksQ0FBQyxDQUFMLENBQU8sSUFBOUMsRUFBb0QsSUFBSSxDQUFDLENBQUwsQ0FBTyxJQUEzRDtBQUNBLElBQUEsR0FBRyxDQUFDLFVBQUosQ0FBZSxJQUFJLENBQUMsQ0FBTCxDQUFPLElBQXRCLEVBQTRCLElBQUksQ0FBQyxDQUFMLENBQU8sSUFBbkMsRUFBeUMsSUFBSSxDQUFDLENBQUwsQ0FBTyxJQUFoRCxFQUFzRCxJQUFJLENBQUMsQ0FBTCxDQUFPLElBQTdEO0FBRUEsSUFBQSxHQUFHLENBQUMsT0FBSjtBQUNIOztBQW5DNkI7Ozs7QUFzQ2xDLGFBQU0sUUFBTixDQUFlLElBQWY7Ozs7OztBQzNDQTs7QUFFQTs7QUFFQTs7QUFDQTs7QUFDQTs7QUFFQSw0QkFBZ0IsWUFBaEI7QUFDQSxtQ0FBaUIsWUFBakI7QUFDQSwrQkFBZSxZQUFmOzs7Ozs7QUNWQTs7Ozs7OztBQUVBOztBQUNBOztBQUVBLE1BQU0saUJBQU4sU0FBZ0Msa0JBQWhDLENBQTRDO0FBQzNCLGFBQUYsRUFBRSxHQUFHO0FBQUUsV0FBTyxjQUFQO0FBQXdCOztBQUUxQyxFQUFBLGFBQWEsQ0FBQyxRQUFELEVBQVc7QUFDcEIsV0FBTyx1QkFBVyxhQUFYLENBQXlCLElBQXpCLEVBQStCLFFBQS9CLENBQVA7QUFDSDs7QUFFRCxFQUFBLG1CQUFtQixHQUFHO0FBQ2xCLDJCQUFXLG1CQUFYLENBQStCLElBQS9COztBQUNBLFNBQUssc0JBQUw7QUFDSDs7QUFFRCxFQUFBLGdCQUFnQixDQUFDLEtBQUQsRUFBUTtBQUNwQixJQUFBLE9BQU8sQ0FBQyxHQUFSLENBQVksS0FBWixFQUFtQixLQUFuQjtBQUVBLFdBQU8sS0FBUDtBQUNIOztBQWhCdUM7O0FBbUI1QyxpQkFBaUIsQ0FBQyxRQUFsQixHQUE2QjtBQUN6QixFQUFBLEtBQUssRUFBRTtBQUNILElBQUEsUUFBUSxFQUFFLEtBQUssSUFBSTtBQURoQjtBQURrQixDQUE3Qjs7QUFNTyxTQUFTLGdCQUFULENBQTBCLEtBQTFCLEVBQWlDO0FBQ3BDLEVBQUEsS0FBSyxDQUFDLFFBQU4sQ0FBZSxpQkFBZjtBQUNIOzs7OztBQ2hDRDs7Ozs7OztBQUVBOztBQUVBLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUF0QjtBQUVPLE1BQU0sVUFBVSxHQUFHO0FBQ3RCLEVBQUEsYUFBYSxFQUFFLFVBQVUsS0FBVixFQUFpQixRQUFqQixFQUEyQjtBQUN0QyxRQUFJLGFBQU0sT0FBTixDQUFjLFFBQWQsQ0FBSixFQUNJLE9BQU8sYUFBTSxTQUFOLENBQWdCLFFBQWhCLENBQVA7QUFDSixXQUFPLEtBQUssQ0FBQyxTQUFOLENBQWdCLFNBQWhCLENBQTBCLGFBQTFCLENBQXdDLElBQXhDLENBQTZDLEtBQTdDLEVBQW9ELFFBQXBELENBQVA7QUFDSCxHQUxxQjtBQU90QixFQUFBLG1CQUFtQixFQUFFLFVBQVUsS0FBVixFQUFpQjtBQUNsQyxVQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBcEI7QUFDQSxVQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBTixDQUFlLEtBQWYsSUFBd0IsRUFBekM7QUFDQSxVQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBTixFQUFyQjs7QUFFQSxhQUFTLFNBQVQsQ0FBbUIsSUFBbkIsRUFBeUI7QUFDckIsYUFBTyxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQUwsS0FBaUIsS0FBSyxDQUFDLEVBQTFCLEdBQStCLElBQUksQ0FBQyxPQUFMLEtBQWlCLEtBQUssQ0FBQyxFQUF6RTtBQUNIOztBQUVELElBQUEsS0FBSyxDQUFDLEdBQU4sR0FBWSxJQUFaO0FBQ0EsSUFBQSxLQUFLLENBQUMsR0FBTixHQUFZLElBQVo7QUFFQSxJQUFBLE9BQU8sQ0FBQyxJQUFSLENBQWEsS0FBSyxDQUFDLElBQU4sQ0FBVyxRQUF4QixFQUFrQyxVQUFVLE9BQVYsRUFBbUIsWUFBbkIsRUFBaUM7QUFDL0QsWUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLGNBQU4sQ0FBcUIsWUFBckIsQ0FBYjs7QUFDQSxVQUFJLEtBQUssQ0FBQyxnQkFBTixDQUF1QixZQUF2QixLQUF3QyxTQUFTLENBQUMsSUFBRCxDQUFyRCxFQUE2RDtBQUN6RCxjQUFNLElBQUksR0FBSSxZQUFELEdBQ1QsYUFBTSxXQUFOLENBQWtCLEtBQWxCLEVBQXlCLE9BQU8sQ0FBQyxjQUFSLENBQXVCLE9BQU8sQ0FBQyxLQUEvQixFQUFzQyxRQUFRLENBQUMsS0FBL0MsQ0FBekIsQ0FEUyxHQUVULGFBQU0sV0FBTixDQUFrQixLQUFsQixFQUF5QixPQUFPLENBQUMsY0FBUixDQUF1QixPQUFPLENBQUMsTUFBL0IsRUFBdUMsUUFBUSxDQUFDLE1BQWhELENBQXpCLENBRko7QUFJQSxRQUFBLE9BQU8sQ0FBQyxJQUFSLENBQWEsT0FBTyxDQUFDLElBQXJCLEVBQTJCLFVBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQjtBQUNsRCxjQUFJLElBQUksQ0FBQyxJQUFMLENBQVUsS0FBVixFQUFpQixNQUFyQixFQUE2QjtBQUN6QjtBQUNIOztBQUVELGdCQUFNLEtBQUssR0FBRyxhQUFNLFdBQU4sQ0FBa0IsYUFBTSxRQUFOLENBQWUsUUFBZixFQUF5QixLQUF6QixDQUFsQixFQUFtRCxJQUFuRCxDQUFkOztBQUVBLGNBQUksT0FBTyxLQUFQLEtBQWlCLFFBQWpCLElBQTZCLEtBQUssQ0FBQyxLQUFELENBQXRDLEVBQ0k7O0FBRUosdUJBQU0sU0FBTixDQUFnQixLQUFoQjs7QUFFQSxjQUFJLEtBQUssQ0FBQyxHQUFOLEtBQWMsSUFBZCxJQUFzQixLQUFLLENBQUMsR0FBTixHQUFZLEtBQUssQ0FBQyxJQUE1QyxFQUNJLEtBQUssQ0FBQyxHQUFOLEdBQVksS0FBSyxDQUFDLElBQWxCO0FBRUosY0FBSSxLQUFLLENBQUMsR0FBTixLQUFjLElBQWQsSUFBc0IsS0FBSyxDQUFDLEdBQU4sR0FBWSxLQUFLLENBQUMsRUFBNUMsRUFDSSxLQUFLLENBQUMsR0FBTixHQUFZLEtBQUssQ0FBQyxFQUFsQjtBQUNQLFNBakJEO0FBa0JIO0FBQ0osS0ExQkQ7QUEyQkgsR0E5Q3FCO0FBZ0R0QixFQUFBLGdCQUFnQixFQUFFLFVBQVUsS0FBVixFQUFpQixLQUFqQixFQUF3QixZQUF4QixFQUFzQztBQUNwRCxVQUFNLElBQUksR0FBRyxLQUFLLENBQUMsS0FBTixDQUFZLElBQVosQ0FBaUIsUUFBakIsQ0FBMEIsWUFBMUIsRUFBd0MsSUFBeEMsQ0FBNkMsS0FBN0MsQ0FBYjtBQUNBLFVBQU0sR0FBRyxHQUFJLEtBQUssQ0FBQyxZQUFOLEVBQUQsR0FBeUIsSUFBSSxDQUFDLENBQTlCLEdBQWtDLElBQUksQ0FBQyxDQUFuRDtBQUNBLFFBQUksYUFBTSxPQUFOLENBQWMsR0FBZCxDQUFKLEVBQ0ksT0FBTyxHQUFHLENBQUMsSUFBSixHQUFXLEdBQVgsR0FBaUIsR0FBRyxDQUFDLEVBQTVCO0FBQ0osV0FBTyxHQUFQO0FBQ0g7QUF0RHFCLENBQW5COzs7OztBQ05QOzs7Ozs7O0FBRUE7O0FBQ0E7O0FBRUEsTUFBTSxlQUFOLFNBQThCLGdCQUE5QixDQUF3QztBQUNuQixhQUFOLE1BQU0sR0FBRztBQUFFLFdBQU8sSUFBUDtBQUFjOztBQUN2QixhQUFGLEVBQUUsR0FBRztBQUFFLFdBQU8sWUFBUDtBQUFzQjs7QUFFeEMsRUFBQSxhQUFhLENBQUMsUUFBRCxFQUFXO0FBQ3BCLFdBQU8sdUJBQVcsYUFBWCxDQUF5QixJQUF6QixFQUErQixRQUEvQixDQUFQO0FBQ0g7O0FBRUQsRUFBQSxtQkFBbUIsR0FBRztBQUNsQixTQUFLLFNBQUwsQ0FBZSxTQUFmLENBQXlCLG1CQUF6QixDQUE2QyxJQUE3QyxDQUFrRCxJQUFsRDs7QUFDQSwyQkFBVyxtQkFBWCxDQUErQixJQUEvQjtBQUNIOztBQUVELEVBQUEsZ0JBQWdCLENBQUMsS0FBRCxFQUFRO0FBQ3BCLElBQUEsT0FBTyxDQUFDLEdBQVIsQ0FBWSxLQUFaLEVBQW1CLEtBQW5CO0FBRUEsV0FBTyxLQUFQO0FBQ0g7O0FBakJtQzs7QUFvQmpDLFNBQVMsY0FBVCxDQUF3QixLQUF4QixFQUErQjtBQUNsQyxFQUFBLEtBQUssQ0FBQyxRQUFOLENBQWUsZUFBZjtBQUNIIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCB7UmVjdH0gZnJvbSBcIi4uL2VsZW1lbnRzL3JlY3RcIjtcbmltcG9ydCB7VXRpbHN9IGZyb20gXCIuLi9jb3JlL3V0aWxzXCI7XG5pbXBvcnQge0NoYXJ0fSBmcm9tIFwiY2hhcnQuanNcIlxuXG5jb25zdCBkZWZhdWx0cyA9IENoYXJ0LmRlZmF1bHRzO1xuXG5kZWZhdWx0cy5lbGVtZW50cy5nYW50dCA9IHtcbiAgICBib3JkZXJXaWR0aDogMSxcbiAgICBib3JkZXJDb2xvcjogZGVmYXVsdHMuZGVmYXVsdENvbG9yLFxuICAgIGJhY2tncm91bmRDb2xvcjogZGVmYXVsdHMuZGVmYXVsdENvbG9yLFxufTtcblxuY2xhc3MgR2FudHRDb250cm9sbGVyWiBleHRlbmRzIENoYXJ0LkRhdGFzZXRDb250cm9sbGVyIHtcbiAgICBzdGF0aWMgZ2V0IGlkKCkgeyByZXR1cm4gXCJnYW50dFwiOyB9XG5cbiAgICBfcHJlcGFyZURhdGEoZGF0YSwgZGF0YXNldCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogVXRpbHMuZXh0ZW5kVmFsdWUoZGF0YS54LCBkYXRhc2V0Ll93aWR0aCksXG4gICAgICAgICAgICB5OiBVdGlscy5leHRlbmRWYWx1ZShkYXRhLnksIGRhdGFzZXQuX2hlaWdodCksXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfY2FsY0JvdW5kcyhzY2FsZSwgc2NhbGVWYWx1ZSkge1xuICAgICAgICBjb25zdCBmcm9tID0gc2NhbGUuZ2V0UGl4ZWxGb3JWYWx1ZShzY2FsZVZhbHVlLmZyb20pO1xuICAgICAgICBjb25zdCB0byA9IHNjYWxlLmdldFBpeGVsRm9yVmFsdWUoc2NhbGVWYWx1ZS50byk7XG4gICAgICAgIGNvbnN0IHJlcyA9IHtcbiAgICAgICAgICAgIGZyb206IGZyb20sXG4gICAgICAgICAgICB0bzogdG8sXG4gICAgICAgIH07XG4gICAgICAgIFV0aWxzLm5vcm1hbGl6ZShyZXMpO1xuICAgICAgICByZXMuc2l6ZSA9IHJlcy50byAtIHJlcy5mcm9tO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIHVwZGF0ZShyZXNldCkge1xuICAgICAgICBjb25zdCBtZXRhID0gdGhpcy5nZXRNZXRhKCk7XG4gICAgICAgIGNvbnN0IGRhdGFzZXQgPSB0aGlzLmdldERhdGFzZXQoKTtcbiAgICAgICAgY29uc3QgeFNjYWxlID0gdGhpcy5nZXRTY2FsZUZvcklkKG1ldGEueEF4aXNJRCk7XG4gICAgICAgIGNvbnN0IHlTY2FsZSA9IHRoaXMuZ2V0U2NhbGVGb3JJZChtZXRhLnlBeGlzSUQpO1xuXG4gICAgICAgIGRhdGFzZXQuX3dpZHRoID0gVXRpbHMuY29udmVydFNpemUoeFNjYWxlLCBDaGFydC5oZWxwZXJzLnZhbHVlT3JEZWZhdWx0KGRhdGFzZXQud2lkdGgsIGRlZmF1bHRzLmdhbnR0LndpZHRoKSk7XG4gICAgICAgIGRhdGFzZXQuX2hlaWdodCA9IFV0aWxzLmNvbnZlcnRTaXplKHlTY2FsZSwgQ2hhcnQuaGVscGVycy52YWx1ZU9yRGVmYXVsdChkYXRhc2V0LmhlaWdodCwgZGVmYXVsdHMuZ2FudHQuaGVpZ2h0KSk7XG5cbiAgICAgICAgY29uc3QgZ2xvYmFsT3B0aW9uR2FudHQgPSBkZWZhdWx0cy5lbGVtZW50cy5nYW50dDtcblxuICAgICAgICBjb25zdCBkYXRhID0gbWV0YS5kYXRhIHx8IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUVsZW1lbnQoZGF0YVtpXSwgaSwgcmVzZXQpO1xuICAgIH1cblxuICAgIHVwZGF0ZUVsZW1lbnRzKHBvaW50cywgc3RhcnQsIGNvdW50LCBtb2RlKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudXBkYXRlRWxlbWVudChwb2ludHNbaV0sIGksIG1vZGUgPT09ICdyZXNldCcpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdXBkYXRlRWxlbWVudChwb2ludCwgaW5kZXgsIHJlc2V0KSB7XG4gICAgICAgIGNvbnN0IG1ldGEgPSB0aGlzLmdldE1ldGEoKTtcbiAgICAgICAgY29uc3QgZGF0YXNldCA9IHRoaXMuZ2V0RGF0YXNldCgpO1xuICAgICAgICBjb25zdCBkYXRhc2V0SW5kZXggPSB0aGlzLmluZGV4O1xuICAgICAgICBjb25zdCB4U2NhbGUgPSB0aGlzLmdldFNjYWxlRm9ySWQobWV0YS54QXhpc0lEKTtcbiAgICAgICAgY29uc3QgeVNjYWxlID0gdGhpcy5nZXRTY2FsZUZvcklkKG1ldGEueUF4aXNJRCk7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gZGF0YXNldC5kYXRhW2luZGV4XTtcblxuICAgICAgICAvLyBVdGlsaXR5XG4gICAgICAgIHBvaW50Ll94U2NhbGUgPSB4U2NhbGU7XG4gICAgICAgIHBvaW50Ll95U2NhbGUgPSB5U2NhbGU7XG4gICAgICAgIHBvaW50Ll9kYXRhc2V0SW5kZXggPSBkYXRhc2V0SW5kZXg7XG4gICAgICAgIHBvaW50Ll9pbmRleCA9IGluZGV4O1xuXG4gICAgICAgIGNvbnN0IGZ1bGxQb2ludCA9IHRoaXMuX3ByZXBhcmVEYXRhKHZhbHVlLCBkYXRhc2V0KTtcblxuICAgICAgICBPYmplY3QuYXNzaWduKHBvaW50LCB7XG4gICAgICAgICAgICByZWN0OiB7XG4gICAgICAgICAgICAgICAgeDogdGhpcy5fY2FsY0JvdW5kcyh4U2NhbGUsIGZ1bGxQb2ludC54KSxcbiAgICAgICAgICAgICAgICB5OiB0aGlzLl9jYWxjQm91bmRzKHlTY2FsZSwgZnVsbFBvaW50LnkpLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvcmRlcldpZHRoOiB2YWx1ZS5ib3JkZXJXaWR0aCB8fCB0aGlzLmJvcmRlcldpZHRoLFxuICAgICAgICAgICAgYm9yZGVyQ29sb3I6IHZhbHVlLmJvcmRlckNvbG9yIHx8IHRoaXMuYm9yZGVyQ29sb3IsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHZhbHVlLmJhY2tncm91bmRDb2xvciB8fCB0aGlzLmJhY2tncm91bmRDb2xvcixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihwb2ludCwge1xuICAgICAgICAgICAgeDogVXRpbHMuZ2V0TWlkZGxlKHBvaW50LnJlY3QueCksXG4gICAgICAgICAgICB5OiBVdGlscy5nZXRNaWRkbGUocG9pbnQucmVjdC55KVxuICAgICAgICB9KTtcblxuICAgICAgICAvL3BvaW50LnBpdm90KCk7XG4gICAgfVxufVxuXG5HYW50dENvbnRyb2xsZXJaLmRlZmF1bHRzID0ge1xuICAgIGRhdGFFbGVtZW50VHlwZTogXCJyZWN0XCIsXG4vLyAgICBkYXRhc2V0RWxlbWVudFR5cGU6IFwicmVjdFwiLFxuICAgIGhlaWdodDogNSxcbiAgICB3aWR0aDogNVxufTtcblxuQ2hhcnQuZGVmYXVsdHMuZ2FudHQgPSBHYW50dENvbnRyb2xsZXJaLm92ZXJyaWRlcyA9IHtcbiAgICBzY2FsZXM6IHtcbiAgICAgICAgX2luZGV4Xzoge1xuICAgICAgICAgICAgaWQ6ICd4JyxcbiAgICAgICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgICAgIHR5cGU6ICd0aW1lLWdhbnR0JyxcbiAgICAgICAgICAgIHBvc2l0aW9uOiAnYm90dG9tJ1xuICAgICAgICB9LFxuICAgICAgICBfdmFsdWVfOiB7XG4gICAgICAgICAgICBpZDogJ3knLFxuICAgICAgICAgICAgYWN0aXZlOiB0cnVlLFxuICAgICAgICAgICAgdHlwZTogJ2xpbmVhci1nYW50dCcsXG4gICAgICAgICAgICBwb3NpdGlvbjogJ2xlZnQnXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBHYW50dENvbnRyb2xsZXIoQ2hhcnQpIHtcbiAgICBDaGFydC5yZWdpc3RlcihHYW50dENvbnRyb2xsZXJaKTtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG5leHBvcnQgY29uc3QgVXRpbHMgPSB7XG4gICAgX3BhcnNlSW50ZXJ2YWw6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcIm51bWJlclwiKVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBjb25zdCBwYXJzZWQgPSB2YWx1ZS50cmltKCkudG9Mb3dlckNhc2UoKS5zcGxpdCgvXFxzKihcXGQrKVxccyovKTtcbiAgICAgICAgICAgIGxldCBjdXIgPSBcIm1zXCI7XG4gICAgICAgICAgICBjb25zdCBvYmogPSB7fTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSBwYXJzZWQubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG51bSA9IHBhcnNlRmxvYXQocGFyc2VkW2ldKVxuICAgICAgICAgICAgICAgIGlmIChpc0Zpbml0ZShudW0pKVxuICAgICAgICAgICAgICAgICAgICBvYmpbY3VyXSA9IG51bTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIGN1ciA9IHBhcnNlZFtpXVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBvYmo7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY29lZnMgPSB7XG4gICAgICAgICAgICBtczogMSxcbiAgICAgICAgICAgIHM6IDEwMDAsXG4gICAgICAgICAgICBtOiAxMDAwICogNjAsXG4gICAgICAgICAgICBoOiAxMDAwICogNjAgKiA2MCxcbiAgICAgICAgICAgIGQ6IDEwMDAgKiA2MCAqIDYwICogMjRcbiAgICAgICAgfTtcbiAgICAgICAgbGV0IHJlcyA9IDA7XG4gICAgICAgIGZvciAobGV0IGtleSBpbiB2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKGNvZWZzW2tleV0pXG4gICAgICAgICAgICAgICAgcmVzICs9IHZhbHVlW2tleV0gKiBjb2Vmc1trZXldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcblxuICAgIGlzUmFuZ2U6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiB0eXBlb2YgdmFsdWUuZnJvbSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YgdmFsdWUudG8gIT09IFwidW5kZWZpbmVkXCI7XG4gICAgfSxcblxuICAgIGdldFZhbHVlOiBmdW5jdGlvbiAocmF3VmFsdWUsIHNjYWxlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcmF3VmFsdWUgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgcmV0dXJuICtyYXdWYWx1ZTtcblxuICAgICAgICAvLyBOdWxsIGFuZCB1bmRlZmluZWQgdmFsdWVzIGZpcnN0XG4gICAgICAgIGlmICh0eXBlb2YgcmF3VmFsdWUgPT09IFwidW5kZWZpbmVkXCIgfHwgcmF3VmFsdWUgPT09IG51bGwpXG4gICAgICAgICAgICByZXR1cm4gTmFOO1xuICAgICAgICAvLyBpc05hTihvYmplY3QpIHJldHVybnMgdHJ1ZSwgc28gbWFrZSBzdXJlIE5hTiBpcyBjaGVja2luZyBmb3IgYSBudW1iZXI7IERpc2NhcmQgSW5maW5pdGUgdmFsdWVzXG4gICAgICAgIGlmICh0eXBlb2YgcmF3VmFsdWUgPT09ICdudW1iZXInICYmICFpc0Zpbml0ZShyYXdWYWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBOYU47XG4gICAgICAgIH1cbiAgICAgICAgLy8gSWYgaXQgaXMgaW4gZmFjdCBhbiBvYmplY3QsIGRpdmUgaW4gb25lIG1vcmUgbGV2ZWxcbiAgICAgICAgaWYgKHJhd1ZhbHVlKSB7XG4gICAgICAgICAgICBjb25zdCBuZXN0ZWQgPSAoc2NhbGUuaXNIb3Jpem9udGFsKCkpID8gcmF3VmFsdWUueCA6IHJhd1ZhbHVlLnk7XG4gICAgICAgICAgICBpZiAobmVzdGVkICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0VmFsdWUobmVzdGVkLCBzY2FsZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWx1ZSBpcyBnb29kLCByZXR1cm4gaXRcbiAgICAgICAgcmV0dXJuIHJhd1ZhbHVlO1xuICAgIH0sXG5cbiAgICBfaW5jTWlsbGlzZWNvbmRzOiBmdW5jdGlvbihkYXRlLCBhZGRlbmQpIHtcbiAgICAgICAgY29uc3QgcmVzID0gbmV3IERhdGUoZGF0ZSk7XG4gICAgICAgIHJlcy5zZXRNaWxsaXNlY29uZHMocmVzLmdldE1pbGxpc2Vjb25kcygpICsgYWRkZW5kKTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9LFxuXG4gICAgZXh0ZW5kVmFsdWU6IGZ1bmN0aW9uICh2YWx1ZSwgZGVmU2l6ZSkge1xuICAgICAgICBpZiAodGhpcy5pc1JhbmdlKHZhbHVlKSlcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgaWYgKCFpc0Zpbml0ZSh2YWx1ZSkpXG4gICAgICAgICAgICByZXR1cm4gTmFOO1xuXG4gICAgICAgIGNvbnN0IGRlbHRhID0gZGVmU2l6ZSAvIDI7XG4gICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgZnJvbTogdGhpcy5faW5jTWlsbGlzZWNvbmRzKHZhbHVlLCAtZGVsdGEpLFxuICAgICAgICAgICAgICAgIHRvOiB0aGlzLl9pbmNNaWxsaXNlY29uZHModmFsdWUsIGRlbHRhKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGZyb206IHZhbHVlIC0gZGVsdGEsXG4gICAgICAgICAgICB0bzogdmFsdWUgKyBkZWx0YSxcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpc1RpbWVTY2FsZTogZnVuY3Rpb24oc2NhbGUpIHtcbiAgICAgICAgcmV0dXJuIHNjYWxlLmlzVGltZSB8fCBzY2FsZS50eXBlID09PSBcInRpbWVcIjtcbiAgICB9LFxuXG4gICAgY29udmVydFNpemU6IGZ1bmN0aW9uIChzY2FsZSwgc2l6ZSkge1xuICAgICAgICByZXR1cm4gKHRoaXMuaXNUaW1lU2NhbGUoc2NhbGUpKSA/IHRoaXMuX3BhcnNlSW50ZXJ2YWwoc2l6ZSkgOiBzaXplO1xuICAgIH0sXG5cbiAgICBub3JtYWxpemU6IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodmFsdWUuZnJvbSA+IHZhbHVlLnRvKSB7XG4gICAgICAgICAgICBjb25zdCB0bXAgPSB2YWx1ZS5mcm9tO1xuICAgICAgICAgICAgdmFsdWUuZnJvbSA9IHZhbHVlLnRvO1xuICAgICAgICAgICAgdmFsdWUudG8gPSB0bXA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH0sXG5cbiAgICBnZXRNaWRkbGU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiAodmFsdWUuZnJvbSArIHZhbHVlLnRvKSAvIDI7XG4gICAgfVxufTsiLCJcInVzZSBzdHJpY3RcIjtcblxuaW1wb3J0IHtFbGVtZW50LCBDaGFydH0gZnJvbSBcImNoYXJ0LmpzXCJcbmltcG9ydCB7VXRpbHN9IGZyb20gXCIuLi9jb3JlL3V0aWxzXCI7XG5cbmV4cG9ydCBjbGFzcyBSZWN0IGV4dGVuZHMgRWxlbWVudCB7XG4gICAgc3RhdGljIGdldCBpZCgpIHsgcmV0dXJuIFwicmVjdFwiOyB9XG5cbiAgICBpblJhbmdlKG1vdXNlWCwgbW91c2VZKSB7XG4gICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnJlY3Q7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICBtb3VzZVggPj0gcmVjdC54LmZyb20gJiYgbW91c2VYIDw9IHJlY3QueC50byAmJlxuICAgICAgICAgICAgbW91c2VZID49IHJlY3QueS5mcm9tICYmIG1vdXNlWSA8PSByZWN0LnkudG9cbiAgICAgICAgKTtcbiAgICB9XG5cbiAgICBnZXRDZW50ZXJQb2ludCgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6IHRoaXMueCxcbiAgICAgICAgICAgIHk6IHRoaXMueSxcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldEFyZWEoKSB7XG4gICAgICAgIGNvbnN0IHJlY3QgPSB0aGlzLnJlY3Q7XG4gICAgICAgIHJldHVybiByZWN0Lnguc2l6ZSAqIHJlY3QueS5zaXplO1xuICAgIH1cblxuICAgIGRyYXcoY3R4KSB7XG4gICAgICAgIGN0eC5zYXZlKCk7XG5cbiAgICAgICAgY3R4LmxpbmVXaWR0aCA9IHRoaXMuYm9yZGVyV2lkdGg7XG4gICAgICAgIGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuYm9yZGVyQ29sb3I7XG4gICAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmJhY2tncm91bmRDb2xvcjtcblxuICAgICAgICBjb25zdCByZWN0ID0gdGhpcy5yZWN0O1xuICAgICAgICBjdHguZmlsbFJlY3QocmVjdC54LmZyb20sIHJlY3QueS5mcm9tLCByZWN0Lnguc2l6ZSwgcmVjdC55LnNpemUpO1xuICAgICAgICBjdHguc3Ryb2tlUmVjdChyZWN0LnguZnJvbSwgcmVjdC55LmZyb20sIHJlY3QueC5zaXplLCByZWN0Lnkuc2l6ZSk7XG5cbiAgICAgICAgY3R4LnJlc3RvcmUoKTtcbiAgICB9XG59XG5cbkNoYXJ0LnJlZ2lzdGVyKFJlY3QpO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbmltcG9ydCB7Q2hhcnR9IGZyb20gXCJjaGFydC5qc1wiXG5cbmltcG9ydCB7R2FudHRDb250cm9sbGVyfSBmcm9tICcuL2NvbnRyb2xsZXJzL2dhbnR0JztcbmltcG9ydCB7TGluZWFyR2FudHRTY2FsZX0gZnJvbSAnLi9zY2FsZXMvbGluZWFyLWdhbnR0J1xuaW1wb3J0IHtUaW1lR2FudHRTY2FsZX0gZnJvbSBcIi4vc2NhbGVzL3RpbWUtZ2FudHRcIjtcblxuR2FudHRDb250cm9sbGVyKENoYXJ0KTtcbkxpbmVhckdhbnR0U2NhbGUoQ2hhcnQpO1xuVGltZUdhbnR0U2NhbGUoQ2hhcnQpOyIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IHtTY2FsZVV0aWxzfSBmcm9tIFwiLi9zY2FsZS11dGlsc1wiO1xuaW1wb3J0IHtMaW5lYXJTY2FsZX0gZnJvbSBcImNoYXJ0LmpzXCI7XG5cbmNsYXNzIExpbmVhckdhbnR0U2NhbGVaIGV4dGVuZHMgTGluZWFyU2NhbGUge1xuICAgIHN0YXRpYyBnZXQgaWQoKSB7IHJldHVybiAnbGluZWFyLWdhbnR0JzsgfVxuXG4gICAgZ2V0UmlnaHRWYWx1ZShyYXdWYWx1ZSkge1xuICAgICAgICByZXR1cm4gU2NhbGVVdGlscy5nZXRSaWdodFZhbHVlKHRoaXMsIHJhd1ZhbHVlKTtcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVEYXRhTGltaXRzKCkge1xuICAgICAgICBTY2FsZVV0aWxzLmRldGVybWluZURhdGFMaW1pdHModGhpcyk7XG4gICAgICAgIHRoaXMuaGFuZGxlVGlja1JhbmdlT3B0aW9ucygpO1xuICAgIH1cblxuICAgIGdldExhYmVsRm9yVmFsdWUodmFsdWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJ2YWxcIiwgdmFsdWUpO1xuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG59XG5cbkxpbmVhckdhbnR0U2NhbGVaLmRlZmF1bHRzID0ge1xuICAgIHRpY2tzOiB7XG4gICAgICAgIGNhbGxiYWNrOiB2YWx1ZSA9PiB2YWx1ZVxuICAgIH1cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBMaW5lYXJHYW50dFNjYWxlKENoYXJ0KSB7XG4gICAgQ2hhcnQucmVnaXN0ZXIoTGluZWFyR2FudHRTY2FsZVopO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge1V0aWxzfSBmcm9tIFwiLi4vY29yZS91dGlsc1wiO1xuXG5jb25zdCBoZWxwZXJzID0gQ2hhcnQuaGVscGVycztcblxuZXhwb3J0IGNvbnN0IFNjYWxlVXRpbHMgPSB7XG4gICAgZ2V0UmlnaHRWYWx1ZTogZnVuY3Rpb24gKHNjYWxlLCByYXdWYWx1ZSkge1xuICAgICAgICBpZiAoVXRpbHMuaXNSYW5nZShyYXdWYWx1ZSkpXG4gICAgICAgICAgICByZXR1cm4gVXRpbHMuZ2V0TWlkZGxlKHJhd1ZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHNjYWxlLl9fcHJvdG9fXy5fX3Byb3RvX18uZ2V0UmlnaHRWYWx1ZS5jYWxsKHNjYWxlLCByYXdWYWx1ZSk7XG4gICAgfSxcblxuICAgIGRldGVybWluZURhdGFMaW1pdHM6IGZ1bmN0aW9uIChzY2FsZSkge1xuICAgICAgICBjb25zdCBjaGFydCA9IHNjYWxlLmNoYXJ0O1xuICAgICAgICBjb25zdCBkZWZhdWx0cyA9IENoYXJ0LmRlZmF1bHRzLmdhbnR0IHx8IHt9O1xuICAgICAgICBjb25zdCBpc0hvcml6b250YWwgPSBzY2FsZS5pc0hvcml6b250YWwoKTtcblxuICAgICAgICBmdW5jdGlvbiBJRE1hdGNoZXMobWV0YSkge1xuICAgICAgICAgICAgcmV0dXJuIGlzSG9yaXpvbnRhbCA/IG1ldGEueEF4aXNJRCA9PT0gc2NhbGUuaWQgOiBtZXRhLnlBeGlzSUQgPT09IHNjYWxlLmlkO1xuICAgICAgICB9XG5cbiAgICAgICAgc2NhbGUubWluID0gbnVsbDtcbiAgICAgICAgc2NhbGUubWF4ID0gbnVsbDtcblxuICAgICAgICBoZWxwZXJzLmVhY2goY2hhcnQuZGF0YS5kYXRhc2V0cywgZnVuY3Rpb24gKGRhdGFzZXQsIGRhdGFzZXRJbmRleCkge1xuICAgICAgICAgICAgY29uc3QgbWV0YSA9IGNoYXJ0LmdldERhdGFzZXRNZXRhKGRhdGFzZXRJbmRleCk7XG4gICAgICAgICAgICBpZiAoY2hhcnQuaXNEYXRhc2V0VmlzaWJsZShkYXRhc2V0SW5kZXgpICYmIElETWF0Y2hlcyhtZXRhKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpemUgPSAoaXNIb3Jpem9udGFsKSA/XG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLmNvbnZlcnRTaXplKHNjYWxlLCBoZWxwZXJzLnZhbHVlT3JEZWZhdWx0KGRhdGFzZXQud2lkdGgsIGRlZmF1bHRzLndpZHRoKSkgOlxuICAgICAgICAgICAgICAgICAgICBVdGlscy5jb252ZXJ0U2l6ZShzY2FsZSwgaGVscGVycy52YWx1ZU9yRGVmYXVsdChkYXRhc2V0LmhlaWdodCwgZGVmYXVsdHMuaGVpZ2h0KSk7XG5cbiAgICAgICAgICAgICAgICBoZWxwZXJzLmVhY2goZGF0YXNldC5kYXRhLCBmdW5jdGlvbiAocmF3VmFsdWUsIGluZGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtZXRhLmRhdGFbaW5kZXhdLmhpZGRlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBVdGlscy5leHRlbmRWYWx1ZShVdGlscy5nZXRWYWx1ZShyYXdWYWx1ZSwgc2NhbGUpLCBzaXplKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBcIm9iamVjdFwiICYmIGlzTmFOKHZhbHVlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgICAgICAgICBVdGlscy5ub3JtYWxpemUodmFsdWUpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzY2FsZS5taW4gPT09IG51bGwgfHwgc2NhbGUubWluID4gdmFsdWUuZnJvbSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlLm1pbiA9IHZhbHVlLmZyb207XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHNjYWxlLm1heCA9PT0gbnVsbCB8fCBzY2FsZS5tYXggPCB2YWx1ZS50bylcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjYWxlLm1heCA9IHZhbHVlLnRvO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0TGFiZWxGb3JJbmRleDogZnVuY3Rpb24gKHNjYWxlLCBpbmRleCwgZGF0YXNldEluZGV4KSB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBzY2FsZS5jaGFydC5kYXRhLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0uZGF0YVtpbmRleF07XG4gICAgICAgIGNvbnN0IHZhbCA9IChzY2FsZS5pc0hvcml6b250YWwoKSkgPyBkYXRhLnggOiBkYXRhLnk7XG4gICAgICAgIGlmIChVdGlscy5pc1JhbmdlKHZhbCkpXG4gICAgICAgICAgICByZXR1cm4gdmFsLmZyb20gKyBcIn5cIiArIHZhbC50b1xuICAgICAgICByZXR1cm4gdmFsO1xuICAgIH1cbn07XG5cblxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQge1NjYWxlVXRpbHN9IGZyb20gXCIuL3NjYWxlLXV0aWxzXCI7XG5pbXBvcnQge1RpbWVTY2FsZX0gZnJvbSBcImNoYXJ0LmpzXCI7XG5cbmNsYXNzIFRpbWVHYW50dFNjYWxlWiBleHRlbmRzIFRpbWVTY2FsZSB7XG4gICAgc3RhdGljIGdldCBpc1RpbWUoKSB7IHJldHVybiB0cnVlOyB9XG4gICAgc3RhdGljIGdldCBpZCgpIHsgcmV0dXJuICd0aW1lLWdhbnR0JzsgfVxuXG4gICAgZ2V0UmlnaHRWYWx1ZShyYXdWYWx1ZSkge1xuICAgICAgICByZXR1cm4gU2NhbGVVdGlscy5nZXRSaWdodFZhbHVlKHRoaXMsIHJhd1ZhbHVlKTtcbiAgICB9XG5cbiAgICBkZXRlcm1pbmVEYXRhTGltaXRzKCkge1xuICAgICAgICB0aGlzLl9fcHJvdG9fXy5fX3Byb3RvX18uZGV0ZXJtaW5lRGF0YUxpbWl0cy5jYWxsKHRoaXMpO1xuICAgICAgICBTY2FsZVV0aWxzLmRldGVybWluZURhdGFMaW1pdHModGhpcyk7XG4gICAgfVxuXG4gICAgZ2V0TGFiZWxGb3JWYWx1ZSh2YWx1ZSkge1xuICAgICAgICBjb25zb2xlLmxvZyhcInZhbFwiLCB2YWx1ZSk7XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIFRpbWVHYW50dFNjYWxlKENoYXJ0KSB7XG4gICAgQ2hhcnQucmVnaXN0ZXIoVGltZUdhbnR0U2NhbGVaKTtcbn1cbiJdfQ==
