// 存储副作用函数的桶
const bucket = new WeakMap()
// 原始数据
const data = { text: 'hello world' }

const obj = new Proxy(data, {
  // 拦截对象属性的读取
  get(target, key) {
    // 收集依赖，将副作用函数添加进桶
    track(target, key)
    return target[key]
  },
  // 拦截对象属性的设置
  set(target, key, newVal) {
    target[key] = newVal
    // 触发变化，将副作用函数从桶中取出并执行
    trigger(target, key)
    return true
  },
})

//在get拦截函数内调用track函数追踪变化，收集依赖
function track(target, key) {
  if (!activeEffect) return
  // 根据target从桶里拿到depsMap，值是Map(key --> effects)
  let depsMap = bucket.get(target)
  // 若不存在，创建一个Map并与target关联
  if (!depsMap) bucket.set(target, (depsMap = new Map()))
  // 根据key从depsMap里拿到deps，是Set类型，存放着与key相关的副作用函数effects
  let deps = depsMap.get(key)
  // 若不存在，创建一个Set并与key关联
  if (!deps) depsMap.set(key, (deps = new Set()))
  deps.add(activeEffect)
}

//在set拦截函数内调用trigger函数触发变化
function trigger(target, key) {
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  effects && effects.forEach((fn) => fn())
}

// 用一个全局变量存储当前激活的 effect 函数
let activeEffect = undefined
function effect(fn) {
  // 当调用 effect 注册副作用函数时，将副作用函数赋值给 activeEffect
  activeEffect = fn
  // 执行副作用函数
  fn()
}

effect(() => {
  console.log('effect run')
  document.body.innerText = obj.text
})

setTimeout(() => {
  obj.text = 'hello vue3'
}, 1000)
