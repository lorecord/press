export type ExtentionFieldComputor<T> = (target: T) => any;
export type ExtendtionFieldConfig<T> = {
    compute?: ExtentionFieldComputor<T>;
    ignore?: boolean;
};
export type ExtentionField<T> = string | number | ExtentionFieldComputor<T> | ExtendtionFieldConfig<T>;

export type ExtentionStatic<T> = {
    [key: string]: ExtentionField<T>
}
export type ExtentionProvider<T> = (key: string) => ExtentionField<T>;
export type Extention<T> = ExtentionStatic<T>;

export const deleteField = <T extends object, K extends ((keyof T) | string | number | symbol)>(obj: T, key: K): K extends keyof T ? Omit<T, K> : T => {
    const { [key]: _, ...rest } = obj;
    return rest as K extends keyof T ? Omit<T, K> : T;
}

export const enhanceField = <T extends object, K extends ((keyof T) | string | number | symbol)>(obj: T, key: K, value: K extends keyof T ? T[K] : any): K extends keyof T ? Omit<T, K> & Record<K, T[K]> : T => {
    return { ...obj, [key]: value } as K extends keyof T ? Omit<T, K> & Record<K, T[K]> : T;
}

export const enhance = <T extends object, E extends Extention<T>[]>(target: T, ...extentions: E) => {

    let resolveExtention = (key: string) => {
        // for each reverse
        for (let i = extentions.length - 1; i >= 0; i--) {
            let extention = extentions[i];
            if (typeof extention === 'function') {
                // extention = extention as ExtentionProvider<T>;
                // let value = extention(key);
                // if (value !== undefined) {
                //     return value;
                // }
            } else if (key in extention) {
                return extention[key];
            }
        }
    }

    return new Proxy(target, {
        get: (proxied, prop) => {
            if (prop === 'toJSON') {
                return () => {
                    let result: any = {};
                    for (const key in proxied) {
                        if (proxied.hasOwnProperty(key)) {
                            result[key] = proxied[key];
                        }
                    }
                    for (let i = 0; i < extentions.length; i++) {
                        let extention = extentions[i];
                        if (prop in extention) {
                            // resolve value
                            let extentionField = resolveExtention(prop as string);
                            if (extentionField === undefined) {
                                continue;

                            } else if ((typeof extentionField === 'object'
                                && extentionField.ignore === false)) {
                                delete result[prop];

                            } else if (typeof extentionField === 'function') {
                                result[prop] = extentionField(proxied);

                            } else if (typeof extentionField === 'object'
                                && typeof extentionField.compute == 'function') {
                                result[prop] = extentionField.compute(proxied);

                            } else {
                                result[prop] = extentionField;
                            }
                        }
                    }
                    return result;
                }
            }

            // for each reverse
            for (let i = extentions.length - 1; i >= 0; i--) {
                let extention = extentions[i];
                if (prop in extention) {
                    // resolve value
                    let extentionField = resolveExtention(prop as string);
                    if (extentionField === undefined
                        || (typeof extentionField === 'object'
                            && extentionField.ignore === false)
                    ) {
                        return (proxied as any)[prop];
                    } else if (typeof extentionField === 'function') {
                        return extentionField(proxied);
                    } else if (typeof extentionField === 'object'
                        && typeof extentionField.compute == 'function') {
                        return extentionField.compute(proxied);
                    } else {
                        return extentionField;
                    }
                }
            }

            return (proxied as any)[prop];
        }
    }) as T & {

    };
}

export const enhanceTest = () => {
    type Post = {
        title: string,
        content: string,
        password?: string
    }
    let target: Post = {
        title: 'Test Post',
        content: 'This is a test post',
        password: '1234'
    };

    let extention: Extention<Post> = {
        title: 'Test Post 2',
        content: (target) => {
            return target.content + ' 2';
        },
        password: {
            ignore: true
        },
        keywords: {
            compute: (target: any) => {
                return target.title.split(' ');
            }
        }
    }

    let extention2: Extention<Post> = {
        title: (target) => target.title + ' - Site',
    }

    let extention3: ExtentionProvider<Post> = (key) => {
        if (key.startsWith('content-')) {
            return (target) => {
                return target.content + ' - Site';
            }
        }
        return (target) => undefined;
    }

    let fieldDeleted = deleteField(target, 'passwor0d');
    fieldDeleted.title;
    let fieldDeleted2 = deleteField(target, 'content');
    fieldDeleted2.title;
    let post = enhance(target, extention, extention2);
}