
export type Computation<T, R> = (raw: T) => R;
export type EnhancementConfig<T> = {
    [key: string]: Computation<T, any>;
}
export type Enhanced<T, C> = T & {
    [K in keyof C]: C[K] extends Computation<T, infer R> ? R : never
}
export const enhance = <T extends object, C extends EnhancementConfig<T>>(raw: T, config: C): Enhanced<T, C> => {
    const cache: {
        [key: string]: any
    } = {};
    const dependencies: {
        [key: string]: Set<string>
    } = {};

    return new Proxy(raw, {
        get(target: any, prop: string) {
            if (config[prop]) {
                // enhanced field
                if (!cache[prop]) {
                    const collectedDepended = new Set<string>();
                    const proxyHandler = {
                        get(target: any, prop: string) {
                            collectedDepended.add(prop);
                            return target[prop];
                        }
                    }

                    const proxied = new Proxy(raw, proxyHandler);

                    cache[prop] = config[prop](proxied);

                    for (const dep of collectedDepended) {
                        if (!dependencies[dep]) {
                            dependencies[dep] = new Set<string>();
                        }
                        dependencies[dep].add(prop);
                    }
                }
                return cache[prop];
            } else {
                return target[prop];
            }
        },
        set(target: any, prop: string, value: any) {
            if (target[prop as keyof T] !== value) {
                target[prop as keyof T] = value;

                function clearDependencies(dep: string) {
                    if (!dependencies[dep]) {
                        return;
                    }
                    for (const d of dependencies[dep]) {
                        clearDependencies(d);
                        delete cache[d];
                    }
                }
                clearDependencies(prop);
            }
            return true;
        }
    });
}

function test() {
    let raw = {
        a: 1,
        b: 2,
    }

    let enhanced = enhance(raw, {
        c: (raw) => raw.a + raw.b,
        d: (raw) => raw.c + raw.b,
    });
    enhanced.c; // 3
}