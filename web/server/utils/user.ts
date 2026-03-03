import nano from 'nano';
import { User } from '../../types/user.ts';
import { HTTPError } from 'nitro/h3';

/**
 *
 * @param {name,password} Check if username password belong to user
 * @param userDb The userDB
 * @throws
 * @returns true if login successfull
 */
export const checkLogin = async (
  { name, password }: { name: string; password: string },
  couchUrl: string,
): Promise<boolean> => {
  // connect to couch using user credentials
  const split = couchUrl.split('://');
  const userCouch = nano(`${split[0]}://${name}:${password}@${split[1]}`);

  // test session
  try {
    await userCouch.session();
    return true;
  } catch (e) {
    return false;
  }
};

/**
 *
 * @param name The username
 * @param userDb The userDB
 * @returns The user if found, undefined if not found
 */
export const getUser = async (name: string, couch: nano.ServerScope): Promise<User | undefined> => {
  try {
    const usersDb = couch.use('_users');
    const user = (await usersDb.get('org.couchdb.user:' + name)) as User;
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
export const getUserOrThrow = async (name: string, couch: nano.ServerScope): Promise<User> => {
  const user = await getUser(name, couch);
  if (!user) throw new HTTPError('User not found', { status: 401 });
  return user;
};
