import { Ref, ref, watch } from 'vue';
import { PS, Take } from '../interfaces/db.ts';
import { Score } from '../interfaces/score.ts';
import { calculateScore } from '../utils/score.ts';
import { useRace } from './useRace.ts';
// import { RACES_TYPES, getFiltersForType, getRaceDB } from '../services/utils.ts';

// export function useDashboard(selectedPs: Ref<string | undefined>) {
//     const { currentRace } = useRace();
//     const reset = ref(0);
//     const takes = ref([] as Take[]);
//     const score = ref([] as Score[]);

//     watch([reset, selectedPs], async () => {
//         if (!currentRace || !currentRace.value) return;

//         let tmp = [] as Take[];

//         const docs = await getRaceDB(currentRace.value._id).allDocs<Take>({
//             include_docs: true,
//             descending: true,
//             ...getFiltersForType(RACES_TYPES.TAKE),
//         });

//         for (const doc of docs.rows) {
//             tmp.push(doc.doc!);
//         }

//         // finish
//         takes.value = tmp;
//     });

//     watch([reset, selectedPs], async () => {
//         if (!currentRace || !currentRace.value) return;
//         if (!selectedPs || !selectedPs.value) return;


//         const raceDB = getRaceDB(currentRace.value._id)

//         let ps = undefined;
//         try {
//             const tmp = await psLevel.get(selectedPs.value);
//             ps = {
//                 _id: selectedPs.value,
//                 ...tmp,
//             };
//         } catch (e) {
//             return;
//         }

//         let limitedScore = [] as Score[];
//         const tmp = await calculateScore(ps, currentRace.value);
//         let index = 0;
//         for (let i = tmp.length - 1; i >= 0; i--) {
//             if (tmp[i].end) {
//                 index = i;
//                 break;
//             }
//         }

//         for (let i = -3; i < 5; i++) {
//             if (index + i < 0 || index + i >= tmp.length) continue;
//             limitedScore.push(tmp[index + i]);
//         }

//         score.value = limitedScore.reverse();
//     });

//     return {
//         takes,
//         score,
//     };
// }
