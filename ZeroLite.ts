/**
 * v1.0.0
 * 不支持es6以下版本
 * 单例模式
 * 类名索引
 * 事件机制
 * 具有优先级
 * 链表优化
 */
/**
 * ZeroChain
 * 链表实现
 */
interface ChainIterator {
    next(value?: any): ChainIterationResult,
}
interface ChainIterationResult {
    value: ChainNode,
    done: boolean,
}
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
    remove(): void {
        if (this.parent != null) {
            this.parent.remove(this);
        }
    }
}
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
    //在es5下可以会报错
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
     * callback 返回值 为是否结束遍历的
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
    remove(chainNode: ChainNode): void {
        chainNode.prev!.next = chainNode.next;
        chainNode.next!.prev = chainNode.prev;
        chainNode.next = null;
        chainNode.prev = null;
        chainNode.parent = null;
        this._size--;
        this.isChange = true
    }
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
    find(priority: number): ChainNode {
        let useChainNode: ChainNode = this.last.prev!;
        let cp: number = Math.abs(useChainNode.priority - priority);
        //ts当发布目标为es5时对for of支持不足
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
    get size(): number {
        return this._size;
    }
}
//------------------------------------------------------------------------------------
class Observer<T extends ZeroLiteEvent>extends ZeroChain {
    private pool: WeakMap<(event?: T) => void, ChainNode>;
    constructor() {
        super();
        this.pool = new WeakMap();
    }
    addEvent(callback: (event?: T) => void, priority: number = 0): void {
        let chainNode = new ChainNode(callback, priority);
        this.pool.set(callback, chainNode);
        this.add(chainNode);
    }
    del(callback: (event?: T) => void): void {
        if (this.pool.has(callback)) {
            let chainNode = this.pool.get(callback);
            this.pool.delete(callback);
            chainNode!.remove();
        }
    }
    has(callback: (event?: T) => void): boolean {
        return this.pool.has(callback);
    }
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
export class ZeroLiteEvent {
    public target: ZeroLite | null = null;
    private _isStop: boolean
    private _isUse: boolean
    public type: new () => ZeroLiteEvent
    constructor(type?: new () => ZeroLiteEvent) {
        if (type == null) {
            this.type = <new () => ZeroLiteEvent>this.constructor
        }else{
            this.type = type
        }
        this._isStop = false
        this._isUse = false
    }
    use(target: ZeroLite): void {
        this.target = target;
        this._isUse = true
    }
    stop() {
        this._isStop = true;
    }
    get isStopped(): boolean {
        return this._isStop;
    }
    get isUsed(): boolean {
        return this._isUse;
    }
}
export class ZeroLite {
    private pool: WeakMap<new () => ZeroLiteEvent, Observer<any>>
    static instanceMap: WeakMap<new () => ZeroLite, ZeroLite> = new WeakMap()
    static getZeroLite<T extends ZeroLite>(zeroLiteClass: new () => T): T {
        let zeroLite: ZeroLite
        if (this.instanceMap.has(zeroLiteClass)) {
            zeroLite = this.instanceMap.get(zeroLiteClass)!
        } else {
            zeroLite = new zeroLiteClass()
            this.instanceMap.set(zeroLiteClass, zeroLite)
        }
        return <T>zeroLite
    }
    constructor() {
        this.pool = new WeakMap()
    }
    on<T extends ZeroLiteEvent>(type: (new () => T), callBack: (event: T) => void, priority: number = 0): void {
        if (!this.pool.has(type)) {
            this.pool.set(type, new Observer());
        }
        this.pool.get(type)!.addEvent(callBack, priority)
    };
    emit(event: ZeroLiteEvent): void
    emit(type: new () => ZeroLiteEvent): void
    emit(arg: any): void {
        let event: ZeroLiteEvent
        if (arg instanceof ZeroLiteEvent) {
            event = arg
        } else {
            event = new ZeroLiteEvent(arg)
        }
        event.use(this)
        if (this.pool.has(event.type)) {
            let Observer = this.pool.get(event.type)!
            Observer.forEach((chainNode) => {
                chainNode.data(event);
                return event.isStopped;
            })
        }
    }
    off<T extends ZeroLiteEvent>(type: (new () => T), callBack: (event?: T) => void): void {
        if (this.pool.has(type)) {
            this.pool.get(type)!.del(callBack)
        }
    }
    has(type: new () => ZeroLiteEvent): boolean {
        return this.pool.has(type)
    }
    check(type: new () => ZeroLiteEvent, callBack: (event?: ZeroLiteEvent) => void): boolean {
        return this.pool.has(type) && this.pool.get(type)!.has(callBack)
    }
    clear(type: new () => ZeroLiteEvent): void {
        this.pool.set(type, new Observer());
    }
}
