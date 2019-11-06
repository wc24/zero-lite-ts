//------------------------------------
// 蓝面包 wc24@qq.com
// zero 基于es6的对象事件机件
// 2019.11.16
//------------------------------------
/**
 * 链表迭代接口
 */
interface ChainIterator {
    next(value?: any): ChainIterationResult,
}

/**
 * 迭代返回数据
 */
interface ChainIterationResult {
    value: ChainNode,
    done: boolean,
}
/**
 * ChainNode
 * 链表节点
 */
export class ChainNode {
    public priority: number;
    public data: any;
    public next: ChainNode | null = null;
    public prev: ChainNode | null = null;
    public parent: ZeroChain | null = null;
    constructor(data: any, priority: number = 0) {
        this.priority = priority;
        this.data = data;
    }
    /**
     * 将当前节点从链表中删除
     */
    remove(): void {
        if (this.parent != null) {
            this.parent.remove(this);
        }
    }
}
/**
 * 链表
 */
export class ZeroChain {
    private _size: number;
    private first: ChainNode;
    private last: ChainNode;
    private isChange: boolean = true;
    private _list: Array<ChainNode> = []
    constructor() {
        this.first = new ChainNode(null, -Number.MAX_VALUE);
        this.last = new ChainNode(null, Number.MAX_VALUE);
        this.first.next = this.last;
        this.last.prev = this.first;
        this._size = 0;

    }
    [Symbol.iterator](): ChainIterator {
        let chainNode: ChainNode = this.first;
        return {
            next() {
                chainNode = chainNode.next!;
                return { done: chainNode == null || chainNode.next == null, value: chainNode };
            }
        }
    }
    /**
     * 遍历链表
     * @param callback 处理函数
     */
    forEach(callback: (chainNode: ChainNode) => boolean): void {
        let iterator = this[Symbol.iterator]();
        let iterationResult: ChainIterationResult;
        let idDone: boolean = false;
        iterationResult = iterator.next();
        while (!idDone && !iterationResult.done) {
            idDone = callback(iterationResult.value)
            iterationResult = iterator.next();
        }
    }
    /**
     * 删除节点
     * @param chainNode 
     */
    remove(chainNode: ChainNode): void {
        chainNode.prev!.next = chainNode.next;
        chainNode.next!.prev = chainNode.prev;
        chainNode.next = null;
        chainNode.prev = null;
        chainNode.parent = null;
        this._size--;
        this.isChange = true
    }
    /**
     * 添加节点
     * @param args 多个节点
     */
    add(...args: Array<ChainNode>): void {
        for (let chainNode of args) {
            let findchainNode: ChainNode = this.find(chainNode.priority);
            chainNode.next = findchainNode.next;
            chainNode.prev = findchainNode;
            findchainNode.next!.prev = chainNode;
            findchainNode.next = chainNode;
            chainNode.parent = this;
            this._size++;
            this.isChange = true
        }
    }
    /**
     * 查找与指定优先级最接近的节点
     * 相同优先级返回最先加出的节的
     * @param priority 
     */
    find(priority: number): ChainNode {
        let useChainNode: ChainNode = this.last.prev!;
        let cp: number = Math.abs(useChainNode.priority - priority);
        this.forEach((chainNode) => {
            let kcp: number = Math.abs(chainNode.priority - priority);
            if (kcp === 0) {
                useChainNode = chainNode;
                return true;
            } else if (kcp < cp) {
                cp = kcp;
                useChainNode = chainNode;
            }
            return false;
        })
        if (useChainNode.priority > priority) {
            useChainNode = useChainNode.prev!;
        }
        return useChainNode;
    }
    /**
     * 所有节点的数组
     */
    get list(): Array<ChainNode> {
        if (this.isChange) {
            this.isChange = false;
            this._list = []
            this.forEach((chainNode) => {
                this._list.push(chainNode)
                return false;
            })
        }
        return this._list
    }
    /**
     * 所有节点数据的数组
     */
    get dateList(): Array<any> {
        if (this.isChange) {
            this.isChange = false;
            this._list = []
            this.forEach((chainNode) => {
                this._list.push(chainNode.data)
                return false;
            })
        }
        return this._list
    }
    /**
     * 长度
     */
    get size(): number {
        return this._size;
    }
}
//------------------------------------------------------------------------------------
/**
 * 事件集合
 */
class EventSet<T extends ZeroLiteEvent> extends ZeroChain {
    private pool: WeakMap<(event?: T) => void, ChainNode>;
    constructor() {
        super();
        this.pool = new WeakMap();
    }
    /**
     * 添加一个事件
     * @param callback 事件处理函数
     * @param priority 优先级
     */
    addEvent(callback: (event?: T) => void, priority: number = 0): void {
        let chainNode = new ChainNode(callback, priority);
        this.pool.set(callback, chainNode);
        this.add(chainNode);
    }
    /**
     *删除一个事件
     * @param callback 事件处理函数
     */
    del(callback: (event?: T) => void): void {
        if (this.pool.has(callback)) {
            let chainNode = this.pool.get(callback);
            this.pool.delete(callback);
            chainNode!.remove();
        }
    }
    /**
     * 判断是否含有事件处理函数
     * @param callback 事件处理函数
     */
    has(callback: (event?: T) => void): boolean {
        return this.pool.has(callback);
    }
    /**
     * 遍历链表
     * @param callback 处理函数 函数返回值代表是否终于遍历
     */
    forEach(callback: (chainNode: ChainNode) => boolean): void {
        let iterator = this[Symbol.iterator]();
        let iterationResult: ChainIterationResult;
        let idDone: boolean = false;
        iterationResult = iterator.next();
        while (!idDone && !iterationResult.done) {
            idDone = callback(iterationResult.value)
            iterationResult = iterator.next();
        }
    }
};

export type ZLEC = new (...args: any[]) => ZeroLiteEvent
export type ZLECT<T extends ZeroLiteEvent> = new (...args: any[]) => T
export type ZLC = new (...args: any[]) => ZeroLite
export type ZLCT<T extends ZeroLite> = new (...args: any[]) => T

/**
 * 事件信息体
 */
export class ZeroLiteEvent {
    public target: ZeroLite | null = null;
    private _isStop: boolean
    private _isUse: boolean
    private _base: ZLEC
    constructor(base?: ZLEC) {
        if (base == null) {
            this._base = <ZLEC>this.constructor
        } else {
            this._base = base
        }
        this._isStop = false
        this._isUse = false
    }
    /**
     * 使用
     * @param target 使用者
     */
    use(target: ZeroLite): void {
        this.target = target;
        this._isUse = true
    }
    /**
     * 结束事件传递
     */
    stop() {
        this._isStop = true;
    }
    /**
     * 事件是否是结束传递状态
     */
    get isStopped(): boolean {
        return this._isStop;
    }
    /**
     * 事件是否已结被使用过
     */
    get isUsed(): boolean {
        return this._isUse;
    }
    /**
     * 事件对应的类名
     */
    get base(): ZLEC {
        return this._base;
    }
}
/**
 * zero-lite 设计模式
 * 用于分离管理基于事件的逻辑模形
 * v1.0.0
 * 不支持es6以下版本
 * 单例模式
 * 类名索引
 * 事件机制
 * 具有优先级
 * 链表优化
 */
export class ZeroLite {
    private pool: WeakMap<ZLEC, EventSet<any>>
    private static instanceMap: Map<ZLC, [ZeroLite, ((instance: ZeroLite) => void) | undefined]> = new Map()
    /**
     * 获取单例
     * @param zeroLiteClass 类名
     */
    static getZeroLite<T extends ZeroLite>(zeroLiteClass: ZLCT<T>, initCallback?: (instance: T) => void): T {
        let zeroLite: ZeroLite
        if (this.instanceMap.has(zeroLiteClass)) {
            [zeroLite] = this.instanceMap.get(zeroLiteClass)!
        } else {
            zeroLite = new zeroLiteClass()
            if (initCallback != null) {
                initCallback.call(zeroLite, zeroLite as T)
            }
            this.instanceMap.set(zeroLiteClass, [zeroLite, initCallback as ((instance: ZeroLite) => void)])
        }
        return <T>zeroLite
    }
    /**
     * 清空单例池
     */
    static clear() {
        this.instanceMap = new Map()
    }
    /**
     * 重建单例池
     */
    static reset(isCreate: boolean = false) {
        this.instanceMap.forEach(([zeroLite, initCallback], zeroLiteClass) => {
            if (initCallback != null) {
                let instance: ZeroLite
                if (isCreate) {
                    instance = new zeroLiteClass()
                } else {
                    instance = zeroLite
                }
                initCallback.call(instance, instance)
            }
        })
    }

    constructor() {
        this.pool = new WeakMap()
    }
    /**
     * 注册事件
     * @param zlec 类名
     * @param callBack 事件处理函数
     * @param priority 优于级默认为0 越小越先执行
     */
    on<T extends ZeroLiteEvent>(zlec: ZLECT<T>, callBack: (event: T) => void, priority: number = 0): void {
        if (!this.pool.has(zlec)) {
            this.pool.set(zlec, new EventSet());
        }
        this.pool.get(zlec)!.addEvent(callBack, priority)
    };
    /**
     * 通知事件
     * @param event 事件实例
     */
    emit(event: ZeroLiteEvent): void
    /**
     * 通知事件
     * @param event 事件类名
     */
    emit(zlec: ZLEC): void
    emit(arg: ZeroLiteEvent | ZLEC): void {
        let event: ZeroLiteEvent
        if (arg instanceof ZeroLiteEvent) {
            event = arg
        } else {
            event = new arg()
        }
        event.use(this)
        if (this.pool.has(event.base)) {
            let EventSet = this.pool.get(event.base)!
            EventSet.forEach((chainNode) => {
                chainNode.data(event);
                return event.isStopped;
            })
        }
    }
    /**
     * 注销事件
     * @param zeroLiteClass 类名
     * @param callBack 事件处理函数
     */
    off<T extends ZeroLiteEvent>(zlec: ZLECT<T>, callBack: (event?: T) => void): void {
        if (this.pool.has(zlec)) {
            this.pool.get(zlec)!.del(callBack)
        }
    }
    /**
     * 判断是否含有事件
     * @param zlec 类名
     */
    has(zlec: ZLEC): boolean {
        return this.pool.has(zlec)
    }
    /**
     * 判断是否含有指字事件处理函数
     * @param zlec 类名
     */
    check(zlec: ZLEC, callBack: (event?: ZeroLiteEvent) => void): boolean {
        return this.pool.has(zlec) && this.pool.get(zlec)!.has(callBack)
    }
    /**
     * 清空重置事件下的所有处理函数
     * @param zlec 类名
     */
    clear(zlec: ZLEC): void {
        this.pool.set(zlec, new EventSet());
    }
}
