// 存储副作用函数的桶
const bucket = new WeakMap()

// 原始数据
const data = { foo: 1 }
// 对原始数据的代理
const obj = new Proxy(data, {
  // 拦截读取操作
  get(target, key) {
    // 将副作用函数 activeEffect 添加到存储副作用函数的桶中
    track(target, key)
    // 返回属性值
    return target[key]
  },
  // 拦截设置操作
  set(target, key, newVal) {
    // 设置属性值
    target[key] = newVal
    // 把副作用函数从桶里取出并执行
    trigger(target, key)
    return true
  },
})

function track(target, key) {
  console.log('track run')
  if (!activeEffect) return // 没有正在执行的副作用函数 直接返回
  let depsMap = bucket.get(target)
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()))
  }
  let deps = depsMap.get(key)
  if (!deps) {
    depsMap.set(key, (deps = new Set()))
  }
  // deps就是与当前副作用函数相关的依赖集合
  deps.add(activeEffect)
  // 将该依赖集合存储到activeEffect.deps中
  activeEffect.deps.push(deps)
}

function trigger(target, key) {
  console.log('trigger run')
  const depsMap = bucket.get(target)
  if (!depsMap) return
  const effects = depsMap.get(key)
  const effectsToRun = new Set()
  effects &&
    effects.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn)
      }
    })
  effectsToRun.forEach((effectFn) => {
    // 如果副作用函数有 调度器，则调用调度器，并将副作用函数作为参数传入
    if (effectFn.options.scheduler) {
      effectFn.options.scheduler(effectFn)
    } else {
      effectFn()
    }
  })
}

// 用一个全局变量存储当前激活的 effect 函数
let activeEffect
const effectStack = []

function effect(fn, options = {}) {
  const effectFn = () => {
    console.log('clean run')
    cleanup(effectFn)
    // 当调用 effect 注册副作用函数时，将副作用函数赋值给 activeEffect
    activeEffect = effectFn
    // 调用前将当前副作用函数压入栈中
    effectStack.push(effectFn)
    // 存储fn的执行结果
    const res = fn()
    // 副作用函数执行后，将当前副作用函数从栈中弹出
    effectStack.pop()
    activeEffect = effectStack[effectStack.length - 1]
    return res
  }
  // 将 options 挂载到 effectFn 上
  effectFn.options = options
  // activeEffect.deps 用来存储所有与该副作用函数相关的依赖集合
  effectFn.deps = []
  // 如果传入 lazy 选项，则不会立即执行副作用函数
  if (!options.lazy) {
    effectFn()
  }
  return effectFn
}

function cleanup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i]
    deps.delete(effectFn)
  }
  effectFn.deps.length = 0
}

const effectFn = effect(() => obj.foo + 1, { lazy: true })

const value = effectFn()

console.log(value)
