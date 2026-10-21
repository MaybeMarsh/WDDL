import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard">
            <section class="stage" id="stage">
                <p class="error" v-if="err.length > 0">
                    Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                </p>
                <template v-if="entry">
                    <div class="stage__head">
                        <p class="stage__rank">#{{ selected + 1 }}</p>
                        <h1>{{ entry.user }}</h1>
                    </div>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Total points</div>
                            <p>{{ localize(entry.total) }}</p>
                        </li>
                    </ul>
                    <div class="score-block" v-if="entry.verified.length > 0">
                        <h2>Verified ({{ entry.verified.length }})</h2>
                        <table class="table">
                            <tr v-for="score in entry.verified">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" rel="noopener" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="score-block" v-if="entry.completed.length > 0">
                        <h2>Completed ({{ entry.completed.length }})</h2>
                        <table class="table">
                            <tr v-for="score in entry.completed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" rel="noopener" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="score-block" v-if="entry.progressed.length > 0">
                        <h2>Progressed ({{ entry.progressed.length }})</h2>
                        <table class="table">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" rel="noopener" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </template>
                <p v-else class="empty">Nobody is on the leaderboard yet. Add records to a level and players will show up here.</p>
            </section>
            <aside class="ladder">
                <ol>
                    <li v-for="(ientry, i) in leaderboard" :key="ientry.user">
                        <button class="tile tile--player" :class="{ active: selected == i }" :aria-current="selected == i ? 'true' : null" @click="pick(i)">
                            <span class="tile__rank">#{{ i + 1 }}</span>
                            <span class="tile__name">{{ ientry.user }}</span>
                            <span class="tile__score">{{ localize(ientry.total) }}</span>
                        </button>
                    </li>
                </ol>
            </aside>
        </main>
    `,
    computed: {
        entry() {
            return this.leaderboard?.[this.selected] ?? null;
        },
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard;
        this.err = err;
        // Hide loading spinner
        this.loading = false;
    },
    methods: {
        localize,
        pick(i) {
            this.selected = i;
            if (window.matchMedia('(max-width: 1099px)').matches) {
                const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                this.$nextTick(() => {
                    document.getElementById('stage')?.scrollIntoView({
                        behavior: calm ? 'auto' : 'smooth',
                        block: 'start',
                    });
                });
            }
        },
    },
};
