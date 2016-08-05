'use strict';
(function(window) {

  function noop() {}

  function type(o) {
    return Object.prototype.toString.call(o)
      .split(' ')[1]
      .slice(0, -1)
      .toLowerCase();
  }

  function isFunction(fn) {
    return type(fn) === 'function';
  }

  function isString(str) {
    return type(str) === 'string';
  }

  function isGenerator(obj) {
    return 'function' == typeof obj.next && 'function' == typeof obj.throw;
  }

  function isGeneratorFunction(obj) {
    var constructor = obj.constructor;
    if (!constructor) return false;
    if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
    return isGenerator(constructor.prototype);
  }

  function recurList(options) {
    options = options || {};
    var list = options.list;
    var next = options.next;
    var endCallback = options.end;

    function again() {
      var item = list.shift();

      if (item) {
        next(item, function() {
          again();
        });
      } else {
        endCallback && endCallback();
      }
    }

    again();
  }

  function runGenerator(options) {
    var generator = options.generator,
        success = options.success || noop,
        fail = options.fail;

    function throwError(err) {
      if (fail) {
        fail(err);
      } else {
        throw err;
      }
    }
    function run(initValue) {
      var result;
      try {
        result = generator.next(initValue);
      } catch (err) {
        return throwError(err);
      }

      if (result.done) {
        return success();
      }

      var value = result.value;

      if (Array.isArray(value)) {
        value = Promise.all(value);
      }
      if (value && value.then && isFunction(value.then)) {
        value.then(
          function(data) { run(data) },
          function(err) {
            throwError(err);
          }
        );
      } else {
        run(value);
      }
    }

    run();
  }


  // 自动化测试
  function AutoTest(options) {
    this.options = Object.assign({
      // wait 方法，默认等待 5s，每次检测的间隔，为 100ms
      waitTime: 5000,
      waitSpace: 100,
    });
    this.runMap = {};
    this.init();
  }

  Object.assign(AutoTest.prototype, {
    init() {
      ['auto', 'run', 'wait', 'assert'].forEach(function(key) {
        this[key] = this[key].bind(this);
      }.bind(this));
    },

    auto(key, generatorFn, isForce) {
      var ctx = this;
      var map = ctx.runMap;

      if (isGeneratorFunction(generatorFn) === false) {
        throw '第二个参数，必须是 generator 函数';
      }
      if (!isForce && ctx[key]) {
        console.warn(`测试用例"${key}"被覆盖`);
      }

      map[key] = generatorFn;
    },

    run(testCases, isForceExecute) {
      var ctx = this;
      var map = ctx.runMap;

      if (testCases === true) {
        isForceExecute = testCases;
        testCases = null;
      }

      if (Array.isArray(testCases) === false) {
        testCases = Object.keys(map).map(function(key) {
          return { key: key, fn: map[key] };
        });
      }

      var doneCounter = 0,
          failCounter = 0,
          total = testCases.length;

      recurList({
        list: testCases,
        next: function(item, next) {
          var key = item.key;
          var generatorFn = item.fn;

          console.log(`===== 开始测试: ${key} =====`);
          function end() {
            console.log(`===== END: ${key} =====`);
            console.log(' ');
            next();
          }

          runGenerator({
            generator: generatorFn(),
            success: function() {
              doneCounter++;
              end();
            },
            fail: function(err) {
              failCounter++;
              console.error(err);
              end();
              isForceExecute && next();
            }
          });
        },
        end: function() {
          console.log(`total: ${total}  done: ${doneCounter}  fail: ${failCounter}`);
        }
      });
    },

    // { timeout: Number, space: Number, check: Function }
    // 或者 Function 或 Number
    wait(fn, waitTime) {
      var ctx = this;
      var options = ctx.options;

      var time = options.waitTime;
      var space = options.waitSpace;
      var startTime = new Date / 1;
      // 是否之作等待，不做执行?
      var isOnlyWait = false;

      var fnType = type(fn);
      switch (fnType) {
        case 'number':
          time = fn;
          isOnlyWait = true;
          break;
        case 'object':
          time = fn.timeout || time;
          space = fn.space || space;
          fn = fn.check;
          break;
        case 'function':
          time = waitTime || time;
          break;
        default:
          fn = function() { return true; }
      }

      return new Promise(function(resolve, reject) {
        if (isOnlyWait) {
          return setTimeout(resolve, time);
        }

        function check() {
          if (Date.now() - startTime >= time) {
            reject('timeout');
          } else {
            fn() ? resolve() : setTimeout(check, space);
          }
        }
        check();
      });
    },

    assert(ispass, error) {
      if (!ispass) {
        throw error;
      }
    }
  });

  window.AutoTest = AutoTest;
})(window);
