import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyStatic from '@fastify/static';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import path from 'path';
import auth from './auth';
import couch from './couch';
import races from './races';
import crypto from 'crypto';
import { UserTokenPayload } from './auth/dto-types';

///////////// CONFIG
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const COUCH_URL = process.env.COUCH_URL || 'http://192.168.68.107:5984';
const COUCH_USER = process.env.COUCH_USER || 'admin';
const COUCH_SECRET = process.env.COUCH_SECRET || 'CfrjEE208qg83bYjpW';
const PRODUCTION = process.env.NODE_ENV === 'production';
const SECURE_COOKIES = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || '12345678901234567890';
const ADMIN_ROLE = process.env.ADMIN_ROLE || 'lightpassAdmin';
const STANDARD_ROLE = process.env.STANDARD_ROLE || 'lightpass';



const start = async () => {

    const app = Fastify({
        logger: {
            level: 'trace' 
        }
    });

    try {
        
        // register couch 
        app.register(couch, { user: COUCH_USER, url: COUCH_URL, secret: COUCH_SECRET });

        // register static
        app.register(fastifyStatic, {
            root: path.join(__dirname, 'static'),
        });
        
        // register proxy to couchdb
        app.register(fastifyHttpProxy, {
            upstream: process.env.COUCHDB_URL || 'http://192.168.68.107:5984',
            prefix: '/couchdb', // optional,
            logLevel: "trace",
            preValidation: async (req) => {
                await req.jwtVerify();
            },
            replyOptions: {
                rewriteRequestHeaders: (originalReq, headers) => {
                    const payload = originalReq.user as UserTokenPayload;

                    const hash = crypto.createHmac('sha256', COUCH_SECRET);
                    hash.update(payload.name);
                    const token = hash.digest('hex');

                    originalReq.log.debug(token);

                    const newHeaders = {
                        ...headers,
                        "X-Auth-CouchDB-UserName": payload.name,
                        "X-Auth-CouchDB-Roles": payload.roles.join(","),
                        "X-Auth-CouchDB-Token": token
                    }

                    delete newHeaders.cookie;
                    return newHeaders;
                },
            },
        });
        
        // swagger
        if (!PRODUCTION) {
            app.register(fastifySwagger);
            app.register(fastifySwaggerUi, {
                routePrefix: '/api/docs',
                uiConfig: {
                    docExpansion: 'full',
                    deepLinking: false,
                },
            });
        }


        // register authentication
        app.register(auth, { secret:JWT_SECRET, secureCookies: SECURE_COOKIES, couchUrl: COUCH_URL, adminRole: ADMIN_ROLE, standardRole: STANDARD_ROLE });      

        // register races
        app.register(races, { prefix:"lightpass", adminRole: ADMIN_ROLE, standardRole: STANDARD_ROLE  });

        

        await app.listen({ port: PORT , host: '0.0.0.0' })
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}
start();