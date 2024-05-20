import fastifyAuth from '@fastify/auth';
import fastifyCookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import crypto from "crypto";
import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { checkLogin, getUserOrThrow } from '../user/utils';
import { CheckResp, CheckRespType, LoginReq, LoginReqType, LoginResp, LoginRespType, RefreshReq, RefreshReqType, RefreshResp, RefreshRespType, UserRefreshPayload, UserTokenPayload } from './dto-types';

declare module 'fastify' {
    interface FastifyInstance {
        verifyJWT: (req: FastifyRequest, rpl: FastifyReply) => Promise<void>;
        verifyAdministrator: (req: FastifyRequest, rpl: FastifyReply) => Promise<void>;
    }
}

export type AuthOptions = FastifyPluginOptions & {
    secret: string;
    secureCookies: boolean;
    couchUrl: string;
    adminRole: string
};

const AuthPlugin: FastifyPluginAsync<AuthOptions> = async (fastify: FastifyInstance, options: AuthOptions) => {

    fastify.decorate('verifyJWT', async function (req: FastifyRequest, _: FastifyReply): Promise<void> {
        await req.jwtVerify();
    });

    fastify.decorate('verifyAdministrator', async function (req: FastifyRequest, _: FastifyReply): Promise<void> {
        await req.jwtVerify();
        const pay = req.user as UserTokenPayload;
        if (!pay.roles.includes(options.adminRole))
            throw new Error('User not administrator, required administrator role to continue');
    });

    // auth, jwt and cookie plugins
    fastify.register(jwt, {
        secret: options.secret,
        cookie: {
            cookieName: 'token',
            signed: false
        }
    });
    fastify.register(fastifyAuth);
    fastify.register(fastifyCookie)

    //////// after
    await fastify.after();

    //////// routes
    fastify.route<{ Body: LoginReqType; Reply: LoginRespType }>({
        method: 'POST',
        url: '/api/auth/login',
        schema: {
            description: 'Login user using username & password',
            tags: ['Auth'],
            body: LoginReq,
            response: {
                200: LoginResp,
            },
        },
        handler: async (req, rpl) => {
            const body = req.body as LoginReqType;
            await checkLogin(body, options.couchUrl);
            const user = await getUserOrThrow(req.body.name, fastify.couch);

            // main token
            const token = await rpl.jwtSign({
                sub: req.body.name,
                name: req.body.name,
                roles: user.roles,
            }, { expiresIn: '10m' },);

            // refresh token
            const refreshToken = await rpl.jwtSign(
                {
                    name: req.body.name,
                    refresh: true,
                },
                { expiresIn: '1d' },
            );

            // send response
            rpl.code(200)
                .setCookie('token', token, {
                    path: '/',
                    secure: options.secureCookies,
                    httpOnly: true,
                    sameSite: true
                })
                .send({ refreshToken });
        },
    });

    fastify.route<{ Body: RefreshReqType; Reply: RefreshRespType }>({
        method: 'POST',
        url: '/api/auth/refresh',
        schema: {
            description: 'Refresh user token',
            tags: ['Auth'],
            body: RefreshReq,
            response: {
                200: RefreshResp,
            },
        },
        handler: async (req, rpl) => {
            const payload = fastify.jwt.verify<UserRefreshPayload>(req.body.refreshToken);
            if (!payload.refresh) throw new Error('You need to pass refresh token');

            const userP = payload as UserRefreshPayload;
            const user = await getUserOrThrow(userP.name, fastify.couch);

            // main token
            const token = await rpl.jwtSign({
                name: userP.name,
                roles: user.roles,
            });

            // send response
            rpl.code(200)
                .setCookie('token', token, {
                    path: '/',
                    secure: options.secureCookies,
                    httpOnly: true,
                    sameSite: true
                })
                .send({ ok: true });
        },
    });

    fastify.route<{ Reply: CheckRespType }>({
        method: 'GET',
        url: '/api/auth/check',
        schema: {
            description: 'Check user token',
            tags: ['Auth'],
            response: {
                200: CheckResp,
            },
        },
        preHandler: fastify.auth([fastify.verifyJWT]),
        handler: async (req, rpl) => {
            const pay = req.user as UserTokenPayload;
            rpl.code(200).send(pay);
        },
    });

    fastify.route({
        method: 'POST',
        url: '/api/auth/logout',
        schema: {
            description: 'Logout user',
            tags: ['Auth'],
        },
        preHandler: fastify.auth([fastify.verifyJWT]),
        handler: async (_, rpl) => {
            rpl.code(200)
                .setCookie('token', "", {
                    path: '/',
                    expires: new Date(),
                    secure: options.secureCookies,
                    httpOnly: true,
                    sameSite: true
                }).send();
        },
    });


     fastify.route<{ Reply: CheckRespType }>({
        method: 'GET',
        url: '/api/auth/couchcheck',
        schema: {
        description: 'Check token for couch authorization',
        tags: ['Auth'],
            response: {
                200: CheckResp,
            },
        },
        preHandler: fastify.auth([fastify.verifyJWT]),
        handler: async (req, rpl) => {
            const pay = req.user as UserTokenPayload;

            const hash = crypto.createHmac('sha256', options.secret);
            hash.update(pay.name);
            const token = hash.digest('hex');
            
            const headers = {
                "X-Auth-CouchDB-UserName": pay.name,
                "X-Auth-CouchDB-Roles": pay.roles.join(","),
                "X-Auth-CouchDB-Token": token
            }
            rpl.code(200).headers(headers).send(pay);
        },
     });
};
export default fp(AuthPlugin);
