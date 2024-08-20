export interface Md5HashValue {
    md5: string;
}
export interface Sha256HashValue {
    sha256: string;
}
export interface Sha1HashValue {
    sha1: string;
}

export type HashValue = Md5HashValue | Sha256HashValue | Sha1HashValue;
export type HashString = {
    salt?: string;
    i?: number;
} & HashValue;

export interface EncryptedString {
    encrypted: string;
    nonce?: string;
    iv?: string;
    algorithm?: string;
    version?: string;
}

export interface EncryptedEmailAddress {
    value?: EncryptedString;
    hash: HashString;
}

export interface ContactBaseProfile {
    id?: string,
    name?: string,
    url?: string,
    avatar?: string,
    email?: EncryptedEmailAddress,
    verified?: boolean | 'email' | 'profile'
}

export interface Credentials {
    password: HashString
}
