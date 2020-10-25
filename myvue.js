/**
 * 发布者类
 */
class Publisher {
  /**
   * 构造方法
   */
  constructor() {
    // 初始化观察者数组
    this.watchers = [];
  }
  /**
   * 添加观察者
   * @param {Watcher} watcher
   */
  addWatcher(watcher) {
    this.watchers.push(watcher);
  }
  /**
   * 通知观察者
   * @param {*} newValue 最新的值
   */
  notify(newValue) {
    // 循环遍历观察者数组，调用观察者的接收方法，把最新的值传递过去
    this.watchers.forEach((watcher) => watcher.receive(newValue));
  }
}

/**
 * 观察者类
 */
class Watcher {
  /**
   * 构造方法
   * @param {Function} receiveHook 接收时的回调函数（钩子）
   */
  constructor(receiveHook) {
    this.receiveHook = receiveHook;
  }
  /**
   * 订阅发布者
   * @param {Publisher} publisher
   */
  subscribe(publisher) {
    publisher.addWatcher(this);
  }
  /**
   * 接收通知方法，供发布者调用
   * @param {*} newValue
   */
  receive(newValue) {
    // 调用回调函数（钩子）
    this.receiveHook(newValue);
  }
}

class MyVue {
  constructor(opts) {
    this.el = window.document.querySelector(opts.el);
    this.data = opts.data;
    // 用来存储publisher的map数据结构
    this.publisherMap = {};
    this.initData();
    this.parseDOM();
  }
  /**
   * 初始化数据
   */
  initData() {
    Object.entries(this.data).forEach(([key, value]) => {
      // 先从map中获取该key对应的publisher（同样的key使用同一个publisher）
      let publisher = this.publisherMap[key];
      // 如果publisher不存在，则创建赋值并存储起来
      if (!publisher) {
        this.publisherMap[key] = publisher = new Publisher();
      }
      Object.defineProperty(this, key, {
        // 获取该属性值时触发
        get() {
          return value;
        },
        // 修改该属性值时触发
        set(newValue) {
          // 如果新的值和旧的值不相等，才更新，并调用publisher的notify方法，通知其所有的观察者
          if (newValue !== value) {
            value = newValue;
            publisher.notify(newValue);
          }
        },
      });
    });
  }
  /**
   * 解析DOM
   */
  parseDOM() {
    // 获取所有包含v-model属性的元素节点，并将伪数组转换成数组
    const nodes = [...this.el.querySelectorAll('[v-model]')];
    // 遍历这些元素节点
    nodes.forEach((node) => {
      // 获取v-model属性值
      const key = node.getAttribute('v-model');
      // 将该元素的初始值赋值上去
      node.value = this[key];
      // 监听元素的input事件，同步更新数据（视图 --> 数据）
      node.addEventListener('input', (e) => {
        this[key] = e.target.value;
      });
      // 创建观察者对象，用于监听数据变化时同步元素的值（数据 --> 视图）
      const watcher = new Watcher((newValue) => {
        node.value = newValue;
      });
      // 订阅发布者（同样的key使用同一个publisher）
      watcher.subscribe(this.publisherMap[key]);
    });
  }
}
