# 自动测试背景

偶尔想起测试妹子，每次都要手动重复测试功能。
趁着空闲，结合generator的特性，写了一个简单的功能测试框架，希望以后能用上。

# 简要说明

通过 auto('任务名', GeneratorFunction) 的形式，指定一个自动化测试的任务。
通过 run() 去执行所有当前指定的任务，或 run(['任务名']) 去执行特定任务。

``` javascript
'use strict';

const autoTest = new AutoTest();
const { auto, assert, wait, run } = autoTest;

auto('login', function* login() {
  // 测试代码
});

run();
```

1、wait(check:Function, timeout: Number) => Promise

配合 yield 使用，用于等待界面的变化。
该方法会定时调用 check 函数，如果 check 函数返回 true，则代表执行成功，
否则将等待超时，触发返回 Promise 对象的 reject 回调，停止当前的测试任务。

timeout 默认为 5000ms

```javascript
'use strict';

const autoTest = new AutoTest();
const { auto, assert, wait, run } = autoTest;

auto('login', function* login() {
  // 等待 username 元素可见后，才继续往下执行
  yield wait(() => $('#username').is(':visible'));
});

run();
```


2、assert(isPass: Boolean, error: String)

如果 isPass 是 false，则停止当前任务，抛出 error

```javascript
'use strict';

const autoTest = new AutoTest();
const { auto, assert, wait, run } = autoTest;

let name = 'da宗熊';

auto('login', function* login() {
  assert(name.indexOf('da') >= 0, '名字必须是"da"开头');
});

run();
```


3、run(tasks: Array?)

如果没有参数，则运行所有任务，如果有参数，则该参数，必须是数组，并且指定需要运行的任务

```javascript
'use strict';

const autoTest = new AutoTest();
const { auto, assert, wait, run } = autoTest;


auto('login', function* login() {
  // 测试代码
});

run(['login']);
