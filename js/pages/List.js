import { store } from "../main.js";
import { embed, getThumbnailFromId, getYoutubeIdFromUrl } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <section class="stage" id="stage">
                <div class="errors" v-show="errors.length > 0">
                    <p class="error" v-for="error of errors">{{ error }}</p>
                </div>
                <template v-if="level">
                    <div class="stage__head">
                        <p class="stage__rank">{{ rankLabel(selected) }}</p>
                        <h1>{{ level.name }}</h1>
                    </div>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0" allowfullscreen :title="level.name + ' video'"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Code</div>
                            <button class="copy" :class="{ copied }" title="Click to copy the level code" @click="copyCode">
                                <span class="copy__id">{{ level.id }}</span>
                                <span class="copy__done" aria-hidden="true">&#10003; Copied</span>
                            </button>
                            <span class="sr-only" aria-live="polite">{{ copied ? 'Level code copied' : '' }}</span>
                        </li>
                    </ul>
                    <div class="records-block">
                        <h2>Records</h2>
                        <p v-if="selected + 1 > 150">This level does not accept new records.</p>
                        <table class="records">
                            <tr v-for="record in level.records" class="record">
                                <td class="percent">
                                    <p>{{ record.percent }}%</p>
                                </td>
                                <td class="user">
                                    <a :href="record.link" target="_blank" rel="noopener" class="type-label-lg">{{ record.user }}</a>
                                </td>
                                <td class="mobile">
                                    <img v-if="record.mobile" :src="'/assets/phone-landscape' + (store.dark ? '-dark' : '') + '.svg'" alt="Mobile">
                                </td>
                                <td class="hz">
                                    <p>{{ record.hz }}Hz</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </template>
                <p v-else class="empty">This level could not be loaded. Pick another one from the ranking.</p>
                <div class="staff-block" v-if="editors && editors.length">
                    <h3>List editors</h3>
                    <ul class="staff">
                        <li v-for="editor in editors">
                            <img :src="'/assets/' + roleIconMap[editor.role] + (store.dark ? '-dark' : '') + '.svg'" :alt="editor.role">
                            <a v-if="editor.link" class="type-label-lg link" target="_blank" rel="noopener" :href="editor.link">{{ editor.name }}</a>
                            <p v-else>{{ editor.name }}</p>
                        </li>
                    </ul>
                </div>
            </section>
            <aside class="ladder" v-if="list">
                <ol>
                    <li v-for="([lvl, err], i) in list" :key="i">
                        <button class="tile" :class="{ active: selected == i, error: !lvl }" :disabled="!lvl" :aria-current="selected == i ? 'true' : null" @click="pick(i)">
                            <span class="tile__rank" :class="{ 'tile__rank--legacy': i + 1 > 150 }">{{ rankLabel(i) }}</span>
                            <img v-if="thumb(lvl)" class="tile__thumb" :src="thumb(lvl)" alt="" loading="lazy">
                            <span v-else class="tile__thumb tile__thumb--empty"></span>
                            <span class="tile__name">{{ lvl ? lvl.name : 'Error (' + err + '.json)' }}</span>
                        </button>
                    </li>
                </ol>
            </aside>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        copied: false,
        errors: [],
        roleIconMap,
        store
    }),
    computed: {
        level() {
            return this.list?.[this.selected]?.[0] ?? null;
        },
        video() {
            if (!this.level) {
                return "";
            }
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
    },
    watch: {
        selected() {
            this.copied = false;
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
        rankLabel(i) {
            return i + 1 <= 150 ? "#" + (i + 1) : "Legacy";
        },
        thumb(lvl) {
            if (!lvl || !lvl.verification) {
                return "";
            }
            const id = getYoutubeIdFromUrl(lvl.verification);
            return id ? getThumbnailFromId(id) : "";
        },
        async copyCode() {
            const text = String(this.level.id);
            try {
                await navigator.clipboard.writeText(text);
            } catch {
                // Fallback for browsers that block the clipboard API
                const box = document.createElement("textarea");
                box.value = text;
                box.style.position = "fixed";
                box.style.opacity = "0";
                document.body.appendChild(box);
                box.select();
                try {
                    document.execCommand("copy");
                } catch {}
                box.remove();
            }
            this.copied = true;
            clearTimeout(this.copyTimer);
            this.copyTimer = setTimeout(() => {
                this.copied = false;
            }, 1800);
        },
        pick(i) {
            this.selected = i;
            // On narrow screens the stage sits above the ranking, so bring it into view
            if (window.matchMedia("(max-width: 1099px)").matches) {
                const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                this.$nextTick(() => {
                    document.getElementById("stage")?.scrollIntoView({
                        behavior: calm ? "auto" : "smooth",
                        block: "start",
                    });
                });
            }
        },
    },
};
