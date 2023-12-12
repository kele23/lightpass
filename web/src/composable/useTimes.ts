import { ref, watch, watchEffect } from 'vue';
import { Time } from '../interfaces/db.ts';
import { timesLevel } from '../services/db.ts';

export function useTimes() {
    const times = ref([] as Time[]);
    const reset = ref(0);

    const onDbChange = () => {
        reset.value++;
    };

    watchEffect((onCleanup) => {
        timesLevel.on('put', onDbChange);
        timesLevel.on('del', onDbChange);
        timesLevel.on('batch', onDbChange);

        onCleanup(() => {
            timesLevel.off('put', onDbChange);
            timesLevel.off('del', onDbChange);
            timesLevel.off('batch', onDbChange);
        });
    });

    watch(
        reset,
        async () => {
            let tmp = [] as Time[];

            try {
                const iterator = timesLevel.iterator();
                for await (const [key, value] of iterator) {
                    const time = {
                        _id: key,
                        ...value,
                    } as Time;
                    tmp.push(time);
                }
            } catch (err) {
                console.error(err);
            }

            // finish
            times.value = tmp;
        },
        { immediate: true }
    );

    return {
        times,
        async getTime(_id: string): Promise<Time> {
            const time = await timesLevel.get(_id);
            return {
                _id,
                ...time,
            } as Time;
        },
    };
}
