import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';
import nano from 'nano';
import crypto from 'crypto';
import { CheckResp, CheckRespType, UserTokenPayload } from './auth/dto-types';

declare module 'fastify' {
    interface FastifyInstance {
        couch: nano.ServerScope;
    }
}

export type MainDBOptions = {
    url: string;
    user: string,
    secret: string;
};

const CouchDB: FastifyPluginAsync<MainDBOptions> = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

    const hash = crypto.createHmac('sha256', options.secret);
    hash.update(options.user);
    const token = hash.digest('hex');

    const couch = nano({
        url: options.url,
        requestDefaults: {
            headers: {
                "X-Auth-CouchDB-UserName": options.user,
                "X-Auth-CouchDB-Roles": "_admin",
                "X-Auth-CouchDB-Token": token
            }
        }
    });

    fastify.decorate('couch', couch);

};

export default fp(CouchDB);
