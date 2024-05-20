import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import fp from 'fastify-plugin';
import { Race, RaceCreate, RaceCreateType, RaceType, Races, RacesType } from "./dto-types";


export type AuthOptions = FastifyPluginOptions & {
    prefix: string;
    adminRole: string;
    standardRole: string
};

const RacesPlugin: FastifyPluginAsync<AuthOptions> = async (fastify: FastifyInstance, options: AuthOptions) => {

    //////// after
    await fastify.after();

    fastify.route<{ Reply: RacesType }>({
        method: 'GET',
        url: '/api/races',
        schema: {
            description: 'Get races',
            tags: ['Races'],
            response: {
                200: Races,
            },
        },
        preHandler: fastify.auth([fastify.verifyJWT]),
        handler: async (request, reply) => {
            const dblist = await fastify.couch.db.list();
            let result: RacesType = [];

            for(const dbName of dblist){
                if(!dbName.startsWith(options.prefix)) continue;

                const db = fastify.couch.use(dbName);
                try {
                    const info = await db.get("raceinfo") as RaceType;
                    result.push({name: info.name, _id: dbName});
                } catch(ignored){
                    request.log.warn('Cannot read raceinfo of race '+ dbName);
                }
            }
            reply.send(result);
        },
    });

    fastify.route<{  Body: RaceCreateType; Reply: RaceType }>({
        method: 'POST',
        url: '/api/races',
        schema: {
            description: 'Add race',
            tags: ['Races'],
            body: RaceCreate,
            response: {
                200: Race,
            },
        },
        preHandler: fastify.auth([fastify.verifyAdministrator]),
        handler: async (request, reply) => {
            
            // convert name into something usable
            let result = request.body.name.replace(/\s+/g, '-');
            result = result.toLowerCase();
            result = result.replace(/[^a-z0-9-]/g, '');

            // add prefix
            result = `${options.prefix}_${result}`;

            // create db, and add raceinfo
            await fastify.couch.db.create(result);
            const raceDb = fastify.couch.use(result);
            //@ts-expect-error
            await raceDb.insert({_id: "raceinfo", name: request.body.name});

            // set db permissions
            await fastify.couch.request({db: result, method: 'put', path: '_security', body:
                {
                    admins:  { names: [], roles: ["_admin", options.adminRole] },
                    members: { names: [], roles: [options.standardRole] },
                }
            });

            // return
            reply.send({name:  request.body.name, _id: result});
        },
    });

}

export default fp(RacesPlugin);
