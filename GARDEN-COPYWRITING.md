# 咪菲認字小花園 — Garden Copywriting Redesign

A full UX-writing pass that reframes the app from "an educational tool" to "a magical garden you tend every day." No UI/layout changes — every idea below fits inside the screens and components that already exist, unless explicitly marked **[future feature]**.

---

## 1. The Core Story

| Old frame | New frame |
|---|---|
| Student | **小小園丁 Little Gardener** |
| A character to learn | **一顆種子 A seed** |
| A practice session | **澆水照顧花園 Watering / tending the garden** |
| Completing a round | **一朵花盛開 A flower blooms** |
| Points / stars | **花朵 Flowers** — the garden itself *is* the collection |
| Course / word list | **花園 A garden** (bed of themed seeds) — *already renamed in-app* |
| Leaderboard / score | **展覽 A showcase** — gardens are admired, not ranked |

The goal is never "get more points than X." It's "come back and see what your garden looks like today."

---

## 2. Writing Principles

**Retire:** 課程 lesson · 練習 exercise · 答對 correct · 分數 score · 排名 rank · 點數 points · 進度 progress · 失敗 fail · 錯誤 wrong

**Reach for:** 種子 seed · 花朵 flower · 花園 garden · 澆水 watering · 成長 growing · 綻放 blooming · 陽光 sunshine · 大自然 nature · 小園丁 little gardener · 花朵收藏 flower collection · 花園日記 garden journal · 花園好朋友 garden friend

One rule threads every section below: **a child should never read the word "wrong."** Mistakes are just seeds that need a little more sunshine.

---

## 3. Screen-by-Screen

### 🏡 Home (pre-practice state — today's "尚未開始" screen)

| Element | Current | Redesigned | Why |
|---|---|---|---|
| Status heading | 尚未開始 | **花園在等你** | Turns a system-status label ("not started") into an invitation. |
| Body copy | 準備好了就開始。完成 20 題可以得到 1 顆星星。 | **今天想種下哪一顆種子呢？輕輕澆水，看看它會長成什麼樣子。** | Replaces a task quota ("20 questions, 1 star") with curiosity about an *outcome*, which is what actually motivates a 5–8 year old. |
| Start button | 開始練習 | **🌱 種下今天的種子** | "Practice" is a school word. Planting is an action a child wants to do. |
| Today-complete state | 今天 3 顆星已經拿到了，還想練習也可以。這次不會再加星星。 | **今天的花園已經開滿花囉！要不要再種一顆，讓花園更繽紛？** + button **🌸 再種一顆** | Removes "this won't count anymore" (which reads as *why bother*) and reframes extra practice as pure bonus color, not a wasted rep. |
| Empty garden (no words yet — parent hasn't set any up) | *(none today)* | **這座花園還沒有種子唷，請大人幫忙準備幾顆種子吧！** | Parent-facing but still in-world; doesn't break the fiction even in an admin-adjacent moment. |

Three alternates for the start button, in case 🌱 種下今天的種子 tests too long on small screens:
- 🌤 **開始澆水**
- ✨ **走進花園**
- 🌱 **種下種子**

---

### 🌤 Practice (in-session)

| Element | Current | Redesigned | Why |
|---|---|---|---|
| Round counter | 第 1 / 20 題 | **第 1 顆種子 / 共 20 顆** | Every "question" becomes a seed being tended — the counter stays just as legible but never says "question." |
| Instruction | 聽一聽，選出你聽到的字。 | **仔細聽一聽，找出正在發芽的那個字吧！** | Keeps the literal instruction (still has to say "listen, pick") but folds it into the metaphor instead of sitting outside it. |
| Replay button | 再聽一次 | **再聽一次** *(unchanged — see Style Guide, "don't theme high-frequency taps")* | This button gets tapped constantly. Micro-copy that's tapped 10+ times a session should stay short and near-invisible, not perform a new joke every time. |
| First wrong attempt | *(silent — just visual red state)* | **再仔細看看，你可以的！** | Never says "wrong." Just redirects attention warmly. |
| Second wrong attempt (reveal + move on) | *(silent — just reveals answer)* | **這顆種子需要多一點陽光，答案是「＿」，我們澆下一顆吧！** | States the fact (what the answer was) without ever labeling the child's choice a failure. |

---

### 🌱→🌸 After Each Correct Answer

**The idea:** instead of one static "✓ Correct!," the flower for *this round* visibly grows across the session. Map each question's position in the round to a growth stage, so question 1 feels like a seed stirring and the *final* correct answer of the round is the one that actually blooms. Five stages, several lines each so no child hears the same line twice in a row:

**Stage 1 — 種子甦醒 (first ~20% of the round)**
- 🌱 種子偷偷睜開了眼睛。
- 🌱 小種子動了一下，好像在說「你好」。
- 🌱 土壤裡傳來一點點動靜⋯⋯種子醒了！
- 🌱 種子感覺到你的澆水，輕輕地甦醒了。

**Stage 2 — 冒出新芽 (~20–40%)**
- 🌿 一根嫩綠的小芽鑽出了泥土。
- 🌿 芽尖朝著陽光，悄悄地探出頭來。
- 🌿 你看！小芽已經比剛才高了一點點。
- 🌿 嫩芽輕輕搖擺，像在跟你揮手。

**Stage 3 — 長出葉子 (~40–60%)**
- 🍃 兩片翠綠的葉子舒展開來。
- 🍃 微風吹過，葉子沙沙作響，像在唱歌。
- 🍃 葉子裡流動著滿滿的元氣。
- 🍃 葉子越長越茂盛，快要遮住陽光了！

**Stage 4 — 花苞成形 (~60–85%)**
- 🌼 一顆小小的花苞悄悄鼓了起來。
- 🌼 花苞害羞地藏在葉子後面，快要忍不住了。
- 🌼 再等一下下，花苞就要打開囉！
- 🌼 你能感覺到嗎？花朵就要綻放了。

**Stage 5 — 花朵綻放 (final correct answers)**
- 🌸 花朵「啵」的一聲，綻放了！
- 🌸 好美的一朵花！你做到了。
- 🌸 陽光灑在花瓣上，閃閃發光。
- 🌸 這朵花，是你親手種出來的。

*(If wiring a 5-stage progression is more than you want to build right now, a simpler fallback: pick randomly from the full pool of 20 lines every correct answer. Less narrative, still never repeats the same flat "Correct!")*

---

### 🎉 When a Round Finishes

**Passed (already-good round):**
- 🌸 恭喜！今天的花朵盛開了，你的花園又更繽紛了一點。
- 🌸 你做到了！陽光灑落，一朵新的花在花園裡綻放。
- 🌸 今天的種子順利長成了美麗的花朵，你是最棒的小園丁！
- 🌸 花園裡又多了一份色彩，這都是你細心澆水的結果。
- 🌸 微風輕輕吹過你的花園，新開的花朵正在跳舞呢！

**Too many misses (currently "這次先不算星星，再試一次吧！"):**
- 🌦 今天的種子需要多一點陽光才能開花，我們明天再試一次吧！
- 🌦 沒關係，有些種子要澆更多次水才會綻放。咪菲會一直陪著你！
- 🌦 這次種子還在努力生長，再澆一次水，它一定會開花的！

None of these say "you failed" or "try again" as a correction — they say the *seed* needs more time, which is true, gentle, and still accurately communicates "this one didn't count yet."

---

### 📖 Weekly Page (本週集點 → 花園日記)

| Element | Current | Redesigned |
|---|---|---|
| Page title | OO的中文集點卡 | **OO的花園日記** |
| Weekly summary | 本週 12 / 21 ⭐ | **這週你的花園開了 12 朵花🌸** |
| Per-day state | X / 3 ⭐ | Map star-count to growth stage per day: 0 = **🌰 準備發芽**, 1 = **🌱**, 2 = **🌿**, 3 = **🌸 盛開** |
| Mid-week encouragement | *(none)* | **花園已經有 12 朵花了，繼續澆水，週末就會開滿一整片花海！** |
| New week / empty | *(none)* | **新的一週，新的花園故事要開始囉！** |

This turns a 7-cell progress tracker into a week of a garden's life — day 1 is bare soil, day 7 (hopefully) is a field in bloom, and the child is reading their own week as a tiny story rather than a completion percentage.

---

### 🏵 Leaderboard (排行榜 → reimagined)

The brief is explicit: no competing. Recommended concept — **花園展覽會 Garden Showcase** — a gallery where every family's garden is on display, not a scoreboard.

Alternates considered: 百花園 (All-Flowers Garden), 好朋友花園 (Friends' Gardens), 祕密花園 (Secret Gardens). Showcase wins because it implies "come see," not "come compete" — a gallery has no losers.

| Element | Current | Redesigned |
|---|---|---|
| Page title | 認字排行榜 | **花園展覽會** |
| Subtitle | 完成一輪練習且答錯不超過上限就得 1 分 | **每次用心澆水，你的花園就會多開一朵花🌸 大家的花園，都在這裡展出！** |
| List entry | 咪咪　12 分 | **咪咪的花園　🌸 x 12** |
| Empty state | 還沒有人得分，開始練習拿第一分吧！ | **展覽會還在佈置中，快去澆水，讓你的第一朵花在這裡展出吧！** |

**[future feature, needs a small logic change, not just copy]** The current list still shows an implicit 1st/2nd/3rd order. To fully remove the "ranking" feeling, stop sorting by an exposed rank number and instead render it as a **wall of bouquets** — everyone's flower count shown as a cluster of blooms, sorted quietly in the background but never labeled "#1." Flagging this because it's the one place where the current *display logic*, not just the words, still says "leaderboard."

---

### ⚙️ Settings

Settings is a parent-facing utility screen, so per the Style Guide below it stays *mostly* plain — but a couple of labels are worth carrying the story into, since they were already renamed once this session:

| Element | Current | Redesigned |
|---|---|---|
| Settings subtitle | 管理玩家、花園與字詞 | **在這裡幫小園丁準備花園** |
| "Players" label | 玩家 | **小園丁** *(refines the 小孩→玩家 rename from earlier today — "gardener" is a stronger fit than the generic "player")* |
| "Garden" label | 花園 | 花園 *(already perfect, no change)* |
| Max-mistakes setting | 可答錯題數 | **花園能撐過幾次風雨** *(optional flavor — see note below)* |
| Account / logout | 登出 | 登出 *(unchanged — see Style Guide: utility actions don't get magic-washed)* |

Note on 花園能撐過幾次風雨: this is a fun option but it's also a number a parent needs to configure quickly and correctly — if the playful label makes the setting's actual function less clear at a glance, keep 可答錯題數 as a plain subtitle underneath it. Clarity wins over cleverness on parent-facing controls.

---

## 4. Long-Term Motivation — Flower Collection System **[future feature]**

Each topic/word-garden unlocks its own flower species when a child completes it. A starter set of 50+, grouped by theme:

**動物 Animals:** 向日葵 Sunflower · 蒲公英 Dandelion · 老虎百合 Tiger Lily · 孔雀羽花 Peacock Flower · 貓尾草 Cattail

**食物 Food:** 玫瑰 Rose · 草莓花 Strawberry Blossom · 南瓜花 Pumpkin Flower · 檸檬花 Lemon Blossom · 米蘭花 Rice Flower

**大自然 Nature:** 薰衣草 Lavender · 蕨葉 Fern Frond · 睡蓮 Water Lily · 溪邊野花 Wild Creek Flower · 山茶花 Camellia

**家人 Family:** 櫻花 Cherry Blossom · 康乃馨 Carnation · 滿天星 Baby's Breath · 常春藤 Ivy · 合歡花 Silk Tree Flower

**學校 School:** 雛菊 Daisy · 鈴蘭 Lily of the Valley · 紫羅蘭 Violet · 蝴蝶蘭 Butterfly Orchid · 風信子 Hyacinth

**顏色 Colors:** 彩虹菊 Rainbow Chrysanthemum · 藍鈴花 Bluebell · 黃金球 Golden Globe Flower · 紫藤花 Wisteria · 橙花 Orange Blossom

**數字 Numbers:** 七瓣花 Seven-Petal Flower · 百合 Lily (百 = hundred) · 千日紅 Globe Amaranth (千 = thousand) · 萬壽菊 Marigold (萬 = ten-thousand) · 十字花 Cross Flower

**天氣 Weather:** 向陽花 Sun-Facing Flower · 雨滴花 Raindrop Flower · 雪絨花 Edelweiss · 風鈴草 Bellflower · 彩虹百合 Rainbow Lily

**交通工具 Transportation:** 飛燕草 Larkspur (燕 = swallow, flight) · 帆船花 Sailboat Flower (morning glory family) · 車輪菊 Wheel Daisy · 錨形花 Anchor Flower · 星際百合 Star-Trail Lily

**情緒 Emotions:** 微笑花 Smile Flower (osteospermum) · 勇氣紅花 Courage Bloom · 安心花 Calm Blossom · 開心果花 Joy Blossom · 溫柔粉花 Gentle Pink Bloom

**身體 Body:** 掌葉花 Palm-Leaf Flower · 心形花 Bleeding Heart · 眼睛花 Black-Eyed Susan · 手指花 Coral Bells · 笑臉花 Sunny-Face Daisy

**節慶 Holidays:** 燈籠花 Lantern Flower (Chinese Lantern) · 聖誕紅 Poinsettia · 月桂花 Bay Laurel · 元宵花 Lantern Festival Bloom · 春聯花 Spring-Couplet Blossom

**海洋 Ocean:** 海葵花 Sea Anemone Bloom · 珊瑚花 Coral Flower · 浪花百合 Wave-Foam Lily · 貝殼花 Shell Flower · 海星草 Starfish Grass

**昆蟲好朋友 Insect Friends:** 蝴蝶結花 Butterfly-Bow Flower · 瓢蟲莓 Ladybug Berry Blossom · 螢火蟲草 Firefly Grass · 蜜蜂花 Bee Balm · 蜻蜓蘭 Dragonfly Orchid

Each species can carry a one-line "fun fact" card (e.g. *向日葵永遠面向太陽，就像你每天面向新的一天！*) shown the moment it's unlocked — this is where the "flower collection" starts to feel like Pokédex-for-flowers rather than a checklist.

---

## 5. Special Milestones **[future feature — needs a counter to track total flowers/streak]**

| Milestone | Message |
|---|---|
| First flower ever | 🌸 你種出了第一朵花！這是你花園故事的第一頁。 |
| 5 flowers | 🌷 五朵花了！你的花園開始有自己的顏色了。 |
| 10 flowers | 🌼 十朵花！微風經過都會停下來欣賞一下。 |
| 25 flowers | 🌻 二十五朵花——你的花園已經看得出用心澆灌的痕跡。 |
| 50 flowers | 🌺 五十朵花，這是一整片小花海了！ |
| 100 flowers | 🏵 一百朵花。你已經是這座花園最厲害的園丁。 |
| One week of visits | 🗓 一整個星期都來澆水，花園記得你每一次的到來。 |
| One month | 🌙 一個月了。回頭看看，你的花園跟一開始好不一樣。 |
| Three months | ☀️ 三個月的陽光和澆水，養出了一座真正的花園。 |
| One year | 🎂 一年了。這座花園，是你用時間親手種出來的。 |
| Returning after a break | 🌤 好久不見！陽光又出來了，花園也在等你回來。 |
| Completing today's garden | ✅ 今天的花園照顧好了，你可以安心去玩囉！ |

---

## 6. When a Child Misses a Day — Zero Guilt

Never a streak-break warning. Always "the garden is patient."

- 你的小花們一直在這裡，開開心心地等你。
- 陽光又出來了，花園隨時歡迎你回來。
- 花園沒有生氣唷，它只是很想你。
- 種子很有耐心，它知道你會回來澆水的。
- 不管隔了多久，你的花園永遠在這裡等你。
- 今天想不想回去看看，你的花有沒有長高一點？
- 休息也是花園的一部分——連太陽都會下山休息。
- 好久不見！你的花園悄悄長出了一點點新綠。

---

## 7. UX Writing Style Guide

**Voice & Tone**
Warm, unhurried, a little wondrous — like a grandparent telling a bedtime story, not a coach blowing a whistle. Short sentences. Present tense. Always addressed to "you" (你), never "the user" or "the student."

**Writing Principles**
1. Never say "wrong," "fail," "score," "rank," or "lesson." Ever.
2. Every screen is a moment *inside* the garden, not a report *about* the garden.
3. When in doubt, describe what's happening to the *plant*, not what the child did right or wrong.
4. A setback is always framed as "needs more time," never "didn't work."

**Emoji Usage**
- One emoji per line, at the start, never stacked (🌸🌸🌸 reads as noise, not delight).
- Growth-stage emoji are load-bearing, not decorative — 🌱 → 🌿 → 🍃 → 🌼 → 🌸 always progress in that order, never mixed at random.
- Utility buttons (replay, settings, logout) get zero or one neutral emoji at most. Save the garden emoji for moments that deserve celebrating.

**Button Writing Rules**
- Verb + object, never a noun alone ("種下種子," not "種子").
- Under ~8 characters where it appears in a fixed-width slot (nav, small buttons); longer is fine for a hero CTA.
- High-frequency taps (replay, next) stay short and nearly invisible in tone — don't make a child read a new joke 20 times a session.

**Celebration Writing Rules**
- Always specific to what just happened (a flower bloomed, a week finished) — never a generic "Great job!"
- Rotate through a pool of 4–6 lines minimum for anything that can trigger more than once a week, so it doesn't calcify into a catchphrase.
- Celebrations describe the garden's reaction, which implicitly celebrates the child — resist the urge to praise the child directly ("你好棒!") in every single line; let the garden's beauty be the reward sometimes.

**Error / Retry Message Rules**
- Never state what the child did ("你選錯了"). State what the seed needs ("這顆種子需要多一點陽光").
- Always paired with forward motion — a next step, never a dead end.
- No red, no buzzers, no "X" — visual state can stay as-is, but the *words* never scold.

**Empty State Rules**
- An empty state is "not yet," never "nothing here." ("展覽會還在佈置中" not "沒有資料.")
- Always implies the child (or parent) has a next action available.

**Encouragement Rules**
- Encouragement describes progress that already happened, not motivation to try harder — a child who already showed up doesn't need to be told to work hard.
- Keep numbers when they're useful (12 朵花) but never present them as a score to beat — always "this is what you built," never "this is what you need."

---

## 8. Bonus — 30 Magical Features (emotional engagement, not addiction mechanics)

Grouped by what they're actually for. None of these are streak-shaming, FOMO timers, or loot-box mechanics — every one rewards *care*, never punishes absence.

**Sensory delight**
1. Gentle ambient garden sounds (birds, wind) that fade in softly on the home screen — off by default, parent-toggleable.
2. A soft "grow" animation/sound the instant a flower blooms, distinct from the correct-answer chime.
3. Weather in the garden matches the *device's* time of day — soft sunrise colors in the morning, fireflies at dusk.
4. Seasonal palette shifts (spring blossoms, autumn leaves) tied to the real calendar, so the garden always feels current.
5. A tiny breeze animation that occasionally sways the flowers, so the garden never looks static even at rest.

**Identity & ownership**
6. Let the child name their garden ("咪咪的秘密花園") instead of it always being "OO's garden."
7. Let the child name individual flowers once bloomed.
8. A "garden badge" the child designs (pick a fence style, a gate, a welcome sign) — decoration, not a competitive trophy.
9. A visiting garden-gnome or firefly mascot who "lives" in the garden and reacts (waves, naps) based on time of day, never based on performance.
10. Garden themes to unlock over time (moonlit garden, rainy-day garden, beach garden) purely cosmetic, never gated behind competitive metrics.

**Family connection**
11. A one-tap "花園明信片" postcard — auto-generated image of today's bloom to send grandparents, no login required to view.
12. A monthly auto-generated "garden timelapse" video/GIF for parents, showing the season's growth.
13. A shared "family greenhouse" view where siblings' gardens sit side-by-side, admired together rather than compared.
14. A birthday flower — once a year, a special one-of-a-kind bloom appears on the child's birthday regardless of practice.
15. A "leave a note in the garden" feature where a parent can plant a short encouraging note the child finds while watering.

**Long-term memory**
16. A "回憶花" (memory flower) — tapping any bloomed flower replays the word it represents, turning the garden into a living review deck instead of a static trophy case.
17. An end-of-year "garden almanac" — a simple auto-generated storybook of the whole year's blooms, exportable as a PDF keepsake.
18. A "first flower ever" plaque that's permanently pinned at the garden's entrance, so early progress is never buried by later growth.
19. Weather-worn detail on older flowers (a little extra shimmer, "established" styling) so long-term care is visible without numbers.
20. A "garden path" that visually winds further as months pass, so time itself becomes a gentle, ambient visual — not a countdown.

**Care & agency (never obligation)**
21. No streak counter, ever — instead, "the garden has been growing for X days total," which can only go up, never resets, never shames a gap.
22. A "rain day" mode — if a child skips several days, the garden shows gentle rain (not wilting) on return, implying it was cared for by nature while away.
23. Let the child choose which garden to water today with zero penalty for picking a favorite over "what's due."
24. A "quiet mode" toggle that removes all sound/animation for kids who get overstimulated, without losing any of the copy warmth.
25. An optional "water for someone else" moment — child can send a friend's/sibling's garden a "🌧 sent sunshine" gesture, a pure kindness action with no gameplay effect.

**Wonder & surprise**
26. Rare "shooting star" seeds that occasionally appear with a bonus flower species, found by chance rather than earned by performance.
27. A butterfly or ladybug that visits gardens with more flower *variety* (not more flowers), quietly encouraging trying different topics over grinding one.
28. A tiny hidden garden gnome the child can find by tapping around the background art — pure whimsy, no mechanical purpose.
29. Occasional "the garden dreamed of something" screen — a whimsical one-line surprise message on open, unrelated to performance, just for delight.
30. A "grow a wish" feature — child plants a wish (a drawing or a word) that "blooms" into a small animation after their next few sessions, regardless of how those sessions go.

---

*This document is a copy and concept reference. Everything in sections 3 and 6 maps directly onto screens that exist today and can be implemented as text-only changes. Sections 4, 5, and 8 are marked [future feature] because they need new data (flower species tracking, milestone counters, garden decorations) beyond what the app currently stores.*
