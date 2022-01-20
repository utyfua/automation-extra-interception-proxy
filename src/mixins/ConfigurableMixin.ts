import {
    IConfig,
    IConfigurableMixin,
    IRequestEventOptionsMap,
    IConfigurableHandlerTarget,
    IConfigurableListenerTarget,
    DEFAULT_KEY, NOOP, RequestMode,
} from '../interfaces'

import { baseHttpHandler, baseHttpHandlerKey } from '../handlers/baseHttpHandler'
import { dataUrlHandler, dataUrlHandlerKey } from '../handlers/dataUrl'
import { defaultLogger } from '../utils/logger'

const DefaultConfig: IConfig = {
    cooperativePriority: undefined,
    requestMode: RequestMode.managed,
    logger: defaultLogger,
    proxy: null,
    timeout: 30000,
    // attempts: 1,
    nativeContinueIfPossible: true,
    requestHandlers: [
        {
            key: baseHttpHandlerKey,
            priority: -10,
            handler: baseHttpHandler,
        },
        {
            key: dataUrlHandlerKey,
            priority: -11,
            handler: dataUrlHandler,
        },
    ],
    requestListeners: [],
}

export function applyConfigurableMixin(base: any): any {
    class ConfigurableMixinBase extends base { }

    // extending by getters and setters
    interface ConfigurableMixinBase extends IConfig { }
    for (let key of Object.keys(DefaultConfig)) {
        Object.defineProperty(ConfigurableMixinBase.prototype, key, {
            get: function () {
                return this.__configGetter(key);
            },
            set: function (value) {
                return this.__configSetter(key, value);
            },
            // enumerable: true,
            // configurable: true
        });
    }

    function getBaseEventListenerConfig() {
        return {
            key: DEFAULT_KEY,
            priority: 1,
            handler: NOOP,
        };
    }

    function getEventListenerConfig<T extends keyof IRequestEventOptionsMap>(eventName: T, args: any[]): IRequestEventOptionsMap[T] {
        let options: IRequestEventOptionsMap[T] = getBaseEventListenerConfig()

        let shift = 0;

        for (let arg of args) {
            const type = typeof arg;

            if (shift <= 0 && ['symbol', 'string'].includes(type)) {
                options.key = arg;
                shift = 1;
                continue;
            }

            if (shift <= 1 && ['number'].includes(type)) {
                options.priority = arg;
                shift = 2;
                continue;
            }

            if (shift <= 2 && ['function'].includes(type)) {
                options.handler = arg;
                shift = 3;
                continue;
            }

            throw new Error(`Unknown argument[${type}]: ${arg}`)
        }

        return options;
    }

    class ConfigurableMixin extends ConfigurableMixinBase implements IConfigurableMixin {
        protected __local: Partial<IConfig> = {};
        protected __parent?: Partial<IConfig>;

        protected __configGetter<T extends keyof IConfig>(key: T): IConfig[T] {
            // merge listener list by parent of default configuration
            if (['requestHandlers', 'requestListeners'].includes(key)) {
                const listeners: IRequestEventOptionsMap[keyof IRequestEventOptionsMap][] =
                    [...(this.__parent && this.__parent[key] || DefaultConfig[key])] as IConfig[T];

                const localListeners: IRequestEventOptionsMap[keyof IRequestEventOptionsMap][] = this.__local[key];

                if (localListeners) {
                    localListeners.forEach(eventOptions => {
                        const existsIndex = listeners.findIndex(({ key }) => eventOptions.key == key);
                        if (existsIndex === -1) {
                            listeners.push(eventOptions);
                        } else {
                            listeners[existsIndex] = eventOptions;
                        }
                    })
                }

                // sort by priority
                listeners.sort((a, b) => b.priority - a.priority);

                return listeners as IConfig[T];
            }

            if (this.__local && key in this.__local) return this.__local[key] as IConfig[T];
            if (this.__parent && key in this.__parent) return this.__parent[key] as IConfig[T];
            return DefaultConfig[key];
        }

        protected __configSetter<T extends keyof IConfig>(key: T, value: IConfig[T]): void {
            this.__local[key] = value;
            // this.emit(key, value)
        }

        protected __getEventBase<T extends keyof IRequestEventOptionsMap>(eventName: T) {
            let eventStorage: IConfig[keyof IRequestEventOptionsMap] | undefined = this.__local[eventName];

            if (!eventStorage) {
                eventStorage = this.__local[eventName] = [];
            }

            return { eventStorage };
        }

        protected __addEvent<T extends keyof IRequestEventOptionsMap>(eventName: T, args: any[]) {
            const eventOptions: IRequestEventOptionsMap[T] = getEventListenerConfig(eventName, args);
            const { eventStorage } = this.__getEventBase(eventName);

            const existsIndex = eventStorage.findIndex(({ key }) => eventOptions.key == key);
            if (existsIndex === -1) {
                // @ts-ignore
                eventStorage.push(eventOptions);
            } else {
                eventStorage[existsIndex] = eventOptions;
            }
        }
        protected __deleteLocalEvent<T extends keyof IRequestEventOptionsMap>(eventName: T, target: IRequestEventOptionsMap[T]["key"] | IRequestEventOptionsMap[T]["handler"]) {
            const { eventStorage } = this.__getEventBase(eventName);

            const findIndex = eventStorage.findIndex(({ key, handler }) => key === target || handler === target);
            if (!findIndex) return false;

            eventStorage.splice(findIndex, 1);
            return true;
        }

        addRequestHandler(...args: any[]) {
            this.__addEvent('requestHandlers', args);
        }
        deleteLocalRequestHandler(target: IConfigurableHandlerTarget) {
            return this.__deleteLocalEvent('requestHandlers', target);
        }

        addRequestListener(...args: any[]) {
            this.__addEvent('requestListeners', args);
        }
        deleteLocalRequestListener(target: IConfigurableListenerTarget) {
            return this.__deleteLocalEvent('requestListeners', target);
        }

        flushLocal(key?: keyof IConfig): void {
            if (key) {
                delete this.__local[key];
            } else {
                this.__local = {};
            }
        }
    }


    return ConfigurableMixin
}
