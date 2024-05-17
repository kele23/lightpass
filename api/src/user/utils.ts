

import nano from 'nano';
import { UserType } from './types';


/**
 *
 * @param {name,password} Check if username password belong to user
 * @param userDb The userDB
 * @throws
 * @returns true if login successfull
 */
export const checkLogin = async (
    { name, password }: { name: string; password: string  },
    couchUrl: string
): Promise<void> => {
    
    // connect to couch using user credentials
    const split = couchUrl.split("://")
    const userCouch = nano(`${split[0]}://${name}:${password}@${split[1]}`);

    // test session
    try {
        await userCouch.session();
    }catch(e){
        throw new Error('Invalid login');
    }
};

/**
 *
 * @param name The username
 * @param userDb The userDB
 * @returns The user if found, undefined if not found
 */
export const getUser = async (name: string, couch:  nano.ServerScope): Promise<UserType | undefined> => {
    
    try {
        const usersDb = couch.use("_users");
        const user = await usersDb.get("org.couchdb.user:"+name) as UserType;
        return user;
    } catch (e) {
        return undefined;
    }
};

/**
 *
 * @param name The username
 * @param userDb The userDB
 * @returns The user if found, undefined if not found
 */
export const getUserOrThrow = async (name: string, couch:  nano.ServerScope): Promise<UserType> => {

    const user = await getUser(name, couch);
    if(!user)  throw new Error('User not found');
    return user;
};
