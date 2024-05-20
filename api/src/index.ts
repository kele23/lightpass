import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import Fastify from 'fastify';
import auth from './auth';
import couch from './couch';
import races from './races';

///////////// CONFIG
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const COUCH_URL = process.env.COUCH_URL || 'http://localhost:5984';
const COUCH_USER = process.env.COUCH_USER || 'admin';
const COUCH_SECRET = process.env.COUCH_SECRET || '1234567890';
const PRODUCTION = process.env.NODE_ENV === 'production';
const SECURE_COOKIES = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || '12345678901234567890';
const ADMIN_ROLE = process.env.ADMIN_ROLE || 'lightpassAdmin';
const STANDARD_ROLE = process.env.STANDARD_ROLE || 'lightpass';



const start = async () => {

    const app = Fastify({
        logger: {
            level: 'info' 
        }
    });

    try {
        
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

        // register couch 
        app.register(couch, { user: COUCH_USER, url: COUCH_URL, secret: COUCH_SECRET });

        // register authentication
        app.register(auth, { couchSecret: COUCH_SECRET, jwtSecret:JWT_SECRET, secureCookies: SECURE_COOKIES, couchUrl: COUCH_URL, adminRole: ADMIN_ROLE, standardRole: STANDARD_ROLE }); 

        // register races
        app.register(races, { prefix:"lightpass", adminRole: ADMIN_ROLE, standardRole: STANDARD_ROLE  });

        

        await app.listen({ port: PORT , host: '0.0.0.0' })
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}
start();