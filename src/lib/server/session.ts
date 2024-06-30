
import Crypto from 'crypto';

const sessions:any = {};
export const sessionDuration = 1000 * 60 * 60 * 24 * 365;

export const createSession = (username:string) => {
    const id = Crypto.createHash('sha1').update(`${username} ${Math.random} ${+new Date()}`).digest('hex');

    sessions[id] = {
        username,
        id,
        expires: +new Date() + sessionDuration
    };

    return sessions[id];
}

export const getSession = (id:string) => {
    let session = sessions[id];
    if(session && session.expires > +new Date()) {
        session.expires = +new Date() + sessionDuration;
        return session;
    } else {
        deleteSession(id);
        return null;
    }
}

export const deleteSession = (id:string) => {
    delete sessions[id];
}

export const cleanupSessions = () => {
    for(const id in sessions) {
        if(sessions[id].expires < +new Date()) {
            delete sessions[id];
        }
    }
}