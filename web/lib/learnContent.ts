// ⚠️ PLACEHOLDER CONTENT — Phase 1 structure only.
// Phase 2 replaces all text in this file. No component changes needed for Phase 2.

// ── Daily insight pool ────────────────────────────────────────────────────────
// General pool — not stage-specific. Phase 2 will expand this to ~100+ real insights.
// InsightCard derives the day's entry from UTC date; swipe offset is session state.

export interface Insight {
  id: string;
  title: string; // short hook shown on the card
  detail: string; // expanded text shown in the tap-to-read sheet
}

export const DAILY_INSIGHTS: Insight[] = [
  {
    id: 'ins-1',
    title: '[PLACEHOLDER] Your body is doing something remarkable right now.',
    detail: '[PLACEHOLDER] First sentence of insight 1 detail — sets up the concept in warm, grounded language. [PLACEHOLDER] Second sentence expands on it with a practical observation relevant to women navigating hormonal change. [PLACEHOLDER] Third sentence closes with an encouraging, non-prescriptive note that makes the reader feel informed and supported.',
  },
  {
    id: 'ins-2',
    title: '[PLACEHOLDER] Sleep and hormones are more connected than you think.',
    detail: '[PLACEHOLDER] First sentence of insight 2 detail — introduces the connection between sleep and hormones in plain, warm language. [PLACEHOLDER] Second sentence goes deeper on why this matters specifically during the menopause journey, without being alarming. [PLACEHOLDER] Third sentence offers a gentle, actionable takeaway the reader can use today.',
  },
  {
    id: 'ins-3',
    title: '[PLACEHOLDER] What you eat in the morning sets your energy for the day.',
    detail: '[PLACEHOLDER] First sentence of insight 3 detail — frames how morning food choices shape energy and blood sugar for the day ahead. [PLACEHOLDER] Second sentence explains why this is particularly relevant during hormonal transition, in a practical and non-judgemental way. [PLACEHOLDER] Third sentence encourages the reader with a specific, easy action they can take at their next meal.',
  },
  {
    id: 'ins-4',
    title: '[PLACEHOLDER] Stress is a hormone too — and it affects everything else.',
    detail: '[PLACEHOLDER] First sentence of insight 4 detail — explains that stress is a hormonal event, not just a feeling, in a grounded and compassionate way. [PLACEHOLDER] Second sentence describes how cortisol interacts with oestrogen and progesterone during menopause, and why this matters for energy and sleep. [PLACEHOLDER] Third sentence validates what the reader is experiencing and offers a small, practical stress-reduction idea without pressure.',
  },
  {
    id: 'ins-5',
    title: '[PLACEHOLDER] Fasting works differently at different times of your cycle.',
    detail: '[PLACEHOLDER] First sentence of insight 5 detail — introduces the idea that fasting is not one-size-fits-all and varies across the menstrual cycle and hormonal stages. [PLACEHOLDER] Second sentence explains which phases call for lighter fasting and which offer more flexibility, grounded in Dr. Mindy Pelz\'s framework. [PLACEHOLDER] Third sentence reassures the reader that listening to their body is the right instinct, and that Fastwell is designed to help them do exactly that.',
  },
  {
    id: 'ins-6',
    title: '[PLACEHOLDER] Small consistent actions outperform big irregular ones.',
    detail: '[PLACEHOLDER] First sentence of insight 6 detail — reframes consistency as a gentle, sustainable practice rather than an all-or-nothing performance. [PLACEHOLDER] Second sentence explains why small daily habits compound over time, particularly during hormonal transition when the body benefits most from predictability and routine. [PLACEHOLDER] Third sentence celebrates the reader for showing up at all, and encourages them to keep going without pressure or judgement.',
  },
  {
    id: 'ins-7',
    title: '[PLACEHOLDER] Hydration matters more than you might expect during this stage.',
    detail: '[PLACEHOLDER] First sentence of insight 7 detail — explains that hydration needs change during hormonal transition and this is completely normal, not a sign something is wrong. [PLACEHOLDER] Second sentence describes how oestrogen influences fluid regulation and why symptoms like dryness, bloating, or increased thirst can appear during perimenopause and beyond. [PLACEHOLDER] Third sentence offers a simple, practical hydration habit the reader can try, framed warmly and without prescribing a specific amount.',
  },
];

export type LearnStageId = 'regular_cycle' | 'perimenopause' | 'transition' | 'post_menopause';

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  insight: string;
}

export interface StageDefinition {
  id: LearnStageId;
  label: string;
  emoji: string;
  subtitle: string;
  colour: string;
}

export interface StageContent {
  definition: StageDefinition;
  quiz: QuizQuestion[];
  insightCards: Array<{ id: string; text: string }>;
}

export const STAGE_DEFINITIONS: Record<LearnStageId, StageDefinition> = {
  regular_cycle: {
    id: 'regular_cycle',
    label: 'Regular Cycle',
    emoji: '🌙',
    subtitle: '[PLACEHOLDER] Your hormonal rhythm — understanding what\'s normal for you.',
    colour: '#D9ECE0',
  },
  perimenopause: {
    id: 'perimenopause',
    label: 'Perimenopause',
    emoji: '🌊',
    subtitle: '[PLACEHOLDER] The transition begins — what to expect and how to feel your best.',
    colour: '#D4E8F0',
  },
  transition: {
    id: 'transition',
    label: 'Transition Year',
    emoji: '🦋',
    subtitle: '[PLACEHOLDER] The year of significant change — you\'re not alone in this.',
    colour: '#F0E8D4',
  },
  post_menopause: {
    id: 'post_menopause',
    label: 'Post-Menopause',
    emoji: '☀️',
    subtitle: '[PLACEHOLDER] A new chapter of health, energy, and possibility.',
    colour: '#FBE4D6',
  },
};

// Maps profiles.menopause_stage → LearnStageId for "For You" personalisation.
// 'not_sure' and null are intentionally absent → null → gentle default shown.
export const MENOPAUSE_STAGE_TO_LEARN_ID: Partial<Record<string, LearnStageId>> = {
  perimenopause: 'perimenopause',
  transition: 'transition',
  post_menopause: 'post_menopause',
};

export const ALL_STAGES: LearnStageId[] = [
  'regular_cycle',
  'perimenopause',
  'transition',
  'post_menopause',
];

// ── Stage insight library (80 total, 20 per stage) ─────────────────────────────
// Source: Fastwell_Insight_Library_80.md — reproduced verbatim (hook → title,
// 2-sentence detail → detail). Reuses the Insight shape so InsightCard needs no
// change beyond taking its pool as a prop instead of a hardcoded import.
export const STAGE_INSIGHTS: Record<LearnStageId, Insight[]> = {
  regular_cycle: [
    { id: 'regular_cycle-1', title: 'Your energy follows your cycle.', detail: "Energy, mood and strength shift across the month as your hormones rise and fall. Learning your own pattern lets you plan harder days and rest days around it, instead of fighting yourself." },
    { id: 'regular_cycle-2', title: 'Fasting can follow your cycle too.', detail: "In the first half of your cycle, your body often handles longer fasting windows well. In the week before your period, easing off tends to feel better, and there's no downside to listening to that." },
    { id: 'regular_cycle-3', title: 'Protein early sets up your day.', detail: "A protein-rich breakfast steadies your blood sugar and curbs the afternoon slump. It's one of the simplest changes with the fastest payoff." },
    { id: 'regular_cycle-4', title: 'Strength training now pays off later.', detail: "Building muscle in your cycling years protects your metabolism and bones for the decades ahead. You're banking strength your future self will thank you for." },
    { id: 'regular_cycle-5', title: "The week before your period isn't the week to push.", detail: "Lower energy and more cravings in the lead-up are normal, not a lack of willpower. Plan lighter workouts and a bit more food, and you'll ride it out more easily." },
    { id: 'regular_cycle-6', title: 'Sleep is when your hormones reset.', detail: "Deep sleep is when a lot of your hormone balancing happens. Protecting it is one of the highest-value things you can do for how you feel all month." },
    { id: 'regular_cycle-7', title: 'Alcohol hits harder than it looks.', detail: "Alcohol disrupts your sleep, spikes your blood sugar and adds to the load your body clears. Cutting back even a little tends to show up quickly in your energy and mood." },
    { id: 'regular_cycle-8', title: 'Eat in the daylight hours where you can.', detail: "Your body handles food better earlier in the day, when your metabolism is primed for it. Front-loading your eating and closing the kitchen earlier can steady your energy and sleep." },
    { id: 'regular_cycle-9', title: 'Hydration affects more than thirst.', detail: "Even mild dehydration shows up as tiredness, headaches and cravings. A glass of water often settles what feels like hunger." },
    { id: 'regular_cycle-10', title: 'Track a little, learn a lot.', detail: "Logging your cycle, energy and sleep for a couple of months reveals patterns you'd never spot otherwise. The data becomes your own personal manual." },
    { id: 'regular_cycle-11', title: 'Cravings often mean blood sugar, not weakness.', detail: "Sharp cravings usually follow a blood sugar dip, not a lack of discipline. Pairing carbs with protein or fat keeps the dips shallow and the cravings quieter." },
    { id: 'regular_cycle-12', title: 'Movement you enjoy is the movement that lasts.', detail: "The best exercise isn't the most intense, it's the one you'll keep coming back to. Walking, dancing, swimming, lifting, whatever you actually like beats a punishing plan you'll quit." },
    { id: 'regular_cycle-13', title: 'Caffeine and your cycle.', detail: "Caffeine can hit harder in the second half of your cycle, adding to anxiety and disrupted sleep. Watching the timing and amount then can smooth things out." },
    { id: 'regular_cycle-14', title: 'Consistency beats perfection.', detail: "Habits that are 80% consistent for years beat a perfect week you can't sustain. Aim for repeatable, not flawless." },
    { id: 'regular_cycle-15', title: 'Stress shows up in your cycle.', detail: "High stress can delay your period, worsen PMS and throw off your energy. Managing it is part of managing your hormones, not separate from it." },
    { id: 'regular_cycle-16', title: 'Fibre feeds more than digestion.', detail: "Fibre steadies blood sugar, supports your gut and helps your body clear used hormones. Most of us get far less than we need." },
    { id: 'regular_cycle-17', title: "Your metabolism isn't a fixed number.", detail: 'Muscle, sleep, stress and movement all shift how your body uses energy day to day. You have more influence over it than the "slow metabolism" story suggests.' },
    { id: 'regular_cycle-18', title: 'Rest days are training days.', detail: "Your body adapts and gets stronger during recovery, not during the workout itself. Skipping rest doesn't speed progress, it stalls it." },
    { id: 'regular_cycle-19', title: 'Start the habits now.', detail: "The routines you build while cycling, steady eating, strength, sleep, become the foundation that carries you through perimenopause. Earlier is easier." },
    { id: 'regular_cycle-20', title: 'Small changes compound.', detail: "One better meal, one walk, one earlier night rarely feels dramatic on the day. Repeated over months, they add up to a genuinely different baseline." },
  ],
  perimenopause: [
    { id: 'perimenopause-1', title: "Hormones don't fall in a straight line.", detail: "In perimenopause, estrogen doesn't simply decline, it rises and dips unpredictably. That fluctuation is the real source of so many symptoms, and knowing that can be reassuring: it's not random, and it's not in your head." },
    { id: 'perimenopause-2', title: 'Gentler fasting often works better now.', detail: "Shorter windows of around 13 to 15 hours tend to suit fluctuating hormones better than long, aggressive fasts. On days you feel strong you can go longer, but there's no prize for pushing when your body is asking you to ease off." },
    { id: 'perimenopause-3', title: 'Steady blood sugar, steadier moods.', detail: "As estrogen shifts, your body can become more sensitive to blood sugar swings, and those swings ripple into your energy and mood. Pairing protein with your meals and going easy on sugar spikes helps keep things on an even keel." },
    { id: 'perimenopause-4', title: "Your sleep changing isn't your fault.", detail: "Waking at 3am or struggling to drop off is one of the most common perimenopause experiences, driven by the same hormonal shifts behind hot flushes. A cool, dark room and a consistent wind-down genuinely help, and it's worth knowing this is a phase, not a permanent new normal." },
    { id: 'perimenopause-5', title: 'Brain fog is real, and temporary.', detail: 'That fuzzy, "where did I put my keys" feeling is a recognised symptom of fluctuating estrogen, not a sign of anything more serious. For most women it eases as hormones settle into their steadier post-menopause baseline.' },
    { id: 'perimenopause-6', title: 'Rest is part of the plan, not a failure.', detail: "On lower-energy days your body genuinely needs more rest and a little more nourishment, not more discipline. Pushing harder when you're depleted tends to backfire, and can actually delay your results." },
    { id: 'perimenopause-7', title: 'Alcohol is not your friend right now.', detail: "In perimenopause, alcohol can worsen hot flushes, wreck your sleep and hit your mood harder than it used to. Cutting back is one of the changes women notice fastest." },
    { id: 'perimenopause-8', title: 'Eat in the daylight hours.', detail: "Closing the kitchen earlier and front-loading your eating gives your body time to settle before sleep. Late eating tends to worsen the night waking that's already common now." },
    { id: 'perimenopause-9', title: "Perimenopause can last years, and that's normal.", detail: 'This transition averages around four years but can stretch from two to ten, often starting in your 40s. There\'s no "right" timeline, and knowing the range makes the ups and downs feel less unsettling.' },
    { id: 'perimenopause-10', title: 'Protein matters more than ever.', detail: "As hormones shift, holding onto muscle gets harder, and muscle is what protects your metabolism and strength. Getting enough protein at each meal is one of the most useful things you can do now." },
    { id: 'perimenopause-11', title: 'Hot flushes have triggers worth knowing.', detail: "For many women, things like alcohol, caffeine, stress and spicy food can set flushes off or make them worse. Noticing your own triggers gives you something you can actually adjust." },
    { id: 'perimenopause-12', title: 'Strength training is non-negotiable now.', detail: "Lifting protects the muscle and bone that hormonal change chips away at. It doesn't need to be heavy or long, just regular." },
    { id: 'perimenopause-13', title: 'Your cravings are hormonal, not a failure.', detail: "Fluctuating estrogen affects the brain chemicals that manage appetite and mood, so stronger cravings are physiology, not weakness. Steady blood sugar and enough protein take the edge off." },
    { id: 'perimenopause-14', title: 'These symptoms are worth raising with your GP.', detail: 'Many women assume sleep changes, low mood or dryness are just "getting older" and stay quiet, but they\'re worth raising. A GP who understands menopause can offer real options, and speaking up isn\'t making a fuss.' },
    { id: 'perimenopause-15', title: 'Movement you enjoy beats punishing workouts.', detail: "Gentle, consistent movement supports mood, sleep and metabolism through this stage better than intense sessions that leave you wiped. The best exercise is the one you enjoy enough to keep doing." },
    { id: 'perimenopause-16', title: 'Weight shifting to your middle is hormonal.', detail: "Falling estrogen tends to move fat storage toward your midsection, even if nothing else has changed. It's a known effect of the transition, not a personal failing, and muscle and steady blood sugar are your best levers." },
    { id: 'perimenopause-17', title: "You don't have to white-knuckle it.", detail: "If symptoms are affecting your life, support is available, from lifestyle changes to HRT to a good clinician. Struggling in silence isn't a badge of honour." },
    { id: 'perimenopause-18', title: 'Stress makes everything louder.', detail: "Cortisol and your sex hormones are linked, so high stress tends to amplify perimenopause symptoms. Anything that genuinely lowers your stress is doing double duty." },
    { id: 'perimenopause-19', title: 'Some days will be better than others.', detail: "Because hormones fluctuate day to day, your energy and mood will too, and that unevenness is normal. Judge yourself over weeks, not single days." },
    { id: 'perimenopause-20', title: 'Knowledge takes the fear out.', detail: "So much perimenopause worry comes from not knowing what's happening or why. Understanding the mechanics of your own body is genuinely calming, and it's the whole point of this tab." },
  ],
  transition: [
    { id: 'transition-1', title: 'This is the year of the biggest shift.', detail: "The transition year is when hormonal change is often at its most noticeable, as your body moves toward its new baseline. It can feel like a lot at once, and that's expected, not a sign something's wrong." },
    { id: 'transition-2', title: '"Menopause" is a single day, not a phase.', detail: "Menopause is technically the point of 12 months with no period, everything before is perimenopause and everything after is post-menopause. Knowing where you are on that map makes the whole thing less confusing." },
    { id: 'transition-3', title: 'Gentle fasting still fits here.', detail: "Shorter, kinder fasting windows continue to suit your body better than aggressive ones through this stage. Consistency and listening to your body beat intensity every time." },
    { id: 'transition-4', title: 'Symptoms often peak, then ease.', detail: "For many women, this is when symptoms are strongest, but it's also the turning point, things frequently settle as hormones find their new, steadier level. Knowing the peak is often temporary helps you ride it out." },
    { id: 'transition-5', title: 'Protect your sleep fiercely.', detail: "Sleep can be at its most disrupted this year, which makes protecting it more important, not less. A cool room, a wind-down routine and earlier eating all stack in your favour." },
    { id: 'transition-6', title: 'Your bones need attention now.', detail: "The drop in estrogen speeds up bone loss around this time, which makes strength training and enough protein and calcium genuinely important. What you build now protects you for decades." },
    { id: 'transition-7', title: 'Alcohol works against you here.', detail: "Through the transition year, alcohol tends to worsen sleep, flushes and mood while adding load your body is already managing. This is a stage where cutting back pays off noticeably." },
    { id: 'transition-8', title: 'Eating earlier helps you sleep.', detail: "With sleep already fragile this year, eating in the daylight hours and closing the kitchen earlier gives your body the best shot at rest. Late meals tend to make night waking worse." },
    { id: 'transition-9', title: 'Your heart deserves attention now.', detail: "Estrogen offered some protection to your heart, and as it drops, looking after your cardiovascular health matters more. Movement, steady blood sugar and less alcohol all count here." },
    { id: 'transition-10', title: "Muscle is your metabolism's best friend.", detail: "Holding onto muscle through this stage protects your strength, your metabolism and your independence later. Strength work and protein are the two levers that matter most." },
    { id: 'transition-11', title: 'Mood swings are hormonal, not you failing.', detail: "Big hormonal movement this year can bring low mood, irritability or anxiety that feels out of proportion. It's physiology, and it's worth naming rather than blaming yourself for." },
    { id: 'transition-12', title: 'Hydration supports the transition.', detail: "Staying well hydrated helps with energy, skin, digestion and even the frequency of some symptoms. It's simple, and easy to let slip when life is busy." },
    { id: 'transition-13', title: 'This is worth a conversation with your GP.', detail: "If this year is hard, you don't have to just endure it, a clinician who understands menopause can talk through real options. Asking for help is sensible, not dramatic." },
    { id: 'transition-14', title: 'Movement you enjoy keeps you steady.', detail: "Regular movement you actually like supports your mood, sleep and bones through the wobbliest stretch. Forget punishing, aim for consistent and enjoyable." },
    { id: 'transition-15', title: 'Weight changes are expected here.', detail: "Shifting hormones commonly change where and how your body stores weight this year. Muscle, protein and steady blood sugar are more useful focuses than the number on the scale." },
    { id: 'transition-16', title: 'Your skin and hair may change too.', detail: "Lower estrogen can bring drier skin and thinner hair, which catches many women off guard. It's a normal part of the shift, and hydration, protein and gentleness help." },
    { id: 'transition-17', title: 'Be patient with yourself this year.', detail: "This is a big physiological transition, and expecting to feel completely steady through it isn't realistic. Lower the bar, be kind, and let your body find its footing." },
    { id: 'transition-18', title: 'Stress management is medicine now.', detail: "With hormones already in flux, unmanaged stress makes everything harder this year. Whatever genuinely calms you is worth prioritising, not squeezing in last." },
    { id: 'transition-19', title: 'The other side is steadier.', detail: "For most women, once you're through the transition and into post-menopause, hormones settle and many symptoms ease. This year is demanding, but it's leading somewhere calmer." },
    { id: 'transition-20', title: "You're not doing this wrong.", detail: "The transition year is meant to feel like change, that's literally what it is. Feeling it strongly doesn't mean you're failing, it means your body is doing exactly what it's supposed to." },
  ],
  post_menopause: [
    { id: 'post_menopause-1', title: 'Welcome to your new baseline.', detail: "Post-menopause, estrogen settles at a lower but steadier level, which is why many women find the day-to-day less turbulent than the years before. The fluctuation eases, and a lot of people feel more like themselves again." },
    { id: 'post_menopause-2', title: 'This is a stage to build on, not endure.', detail: "With hormones steadier, post-menopause is a genuine opportunity to focus on strength, energy and long-term health. Plenty of women feel freer and more settled here than they expected." },
    { id: 'post_menopause-3', title: 'Fasting can be a steady tool now.', detail: "With more stable hormones, many women find a consistent fasting rhythm sits comfortably. As always, it's about what leaves you feeling good, not about pushing for the longest window." },
    { id: 'post_menopause-4', title: 'Strength training is your priority.', detail: "Protecting muscle and bone becomes the single most valuable thing you can do for your future independence and metabolism. Regular strength work, even light, pays off enormously." },
    { id: 'post_menopause-5', title: 'Protein protects your future self.', detail: "Muscle is harder to hold onto now, and it's what keeps you strong, mobile and independent. Getting enough protein at each meal is one of the highest-value habits at this stage." },
    { id: 'post_menopause-6', title: 'Your bones need you.', detail: "Bone loss continues after menopause, so weight-bearing movement, strength work and enough calcium and vitamin D genuinely matter. Looking after your bones now protects your mobility later." },
    { id: 'post_menopause-7', title: "Alcohol still isn't doing you favours.", detail: "Post-menopause, alcohol continues to disrupt sleep, affect bone health and add unnecessary load. Keeping it modest supports nearly everything else you're working on." },
    { id: 'post_menopause-8', title: 'Eating in daylight hours still helps.', detail: "Front-loading your food and closing the kitchen earlier continues to support steady energy and better sleep. Your body still handles food best earlier in the day." },
    { id: 'post_menopause-9', title: 'Your heart health takes centre stage.', detail: "With estrogen's protective effect gone, cardiovascular health becomes a genuine priority. Movement, steady blood sugar, less alcohol and not smoking all matter more than ever." },
    { id: 'post_menopause-10', title: 'Sleep can improve now.', detail: "As hormones steady, the night sweats and 3am waking of earlier stages often ease. Protecting good sleep habits helps you make the most of it." },
    { id: 'post_menopause-11', title: 'Movement you enjoy keeps you thriving.', detail: "Consistent movement you actually like supports your heart, bones, mood and metabolism for the long haul. The goal is a lifelong habit, not a short intense push." },
    { id: 'post_menopause-12', title: 'Muscle matters more than the scale.', detail: "Body composition, how much muscle versus fat you carry, matters more for your health now than your weight alone. Strength training quietly reshapes that in your favour." },
    { id: 'post_menopause-13', title: 'Keep your mind active.', detail: "Staying mentally engaged, learning, socialising, challenging yourself, supports brain health as you age. It's as worthwhile an investment as physical exercise." },
    { id: 'post_menopause-14', title: 'Hydration and digestion.', detail: "Digestion can slow with age, and staying well hydrated with enough fibre keeps things comfortable and regular. Small, steady habits make a real difference here." },
    { id: 'post_menopause-15', title: 'Keep up with your health checks.', detail: "Post-menopause is the time to stay on top of bone density, heart health and regular screenings with your GP. Prevention is far easier than repair." },
    { id: 'post_menopause-16', title: 'Vaginal and urinary changes are common, and treatable.', detail: "Lower estrogen can bring dryness or urinary changes that many women stay quiet about, but effective treatments exist. It's well worth raising with your GP rather than putting up with it." },
    { id: 'post_menopause-17', title: 'Strength is independence.', detail: "The muscle and balance you maintain now are what keep you steady, mobile and independent for decades. Every bit of strength work is an investment in your future freedom." },
    { id: 'post_menopause-18', title: 'Consistency is the whole game now.', detail: "At this stage, steady, sustainable habits beat intensity every time. It's the things you do most weeks, for years, that shape how you age." },
    { id: 'post_menopause-19', title: 'Many women feel freer now.', detail: "With periods and hormonal swings behind them, plenty of women describe post-menopause as a genuinely liberating chapter. It's not just an ending, it's a different kind of beginning." },
    { id: 'post_menopause-20', title: "It's never too late to start.", detail: "Whatever your habits until now, your body still responds to strength work, better food and good sleep at any age. The best time to start looking after your future self is today." },
  ],
};

// ── Stage explainers (For You / Explore) ────────────────────────────────────────
export interface StageExplainer {
  card: string;
  detail: string;
}

export const STAGE_EXPLAINERS: Record<LearnStageId, StageExplainer> = {
  regular_cycle: {
    card: "Your hormones still follow a monthly rhythm, and that's your baseline to work with.",
    detail: "In your regular cycling years, estrogen and progesterone rise and fall in a predictable monthly pattern, shaping your energy, mood, sleep and appetite across the month. This is the stage to learn your own rhythm and build the habits, steady eating, strength work, good sleep, that carry you through the transitions ahead. Nothing is breaking down yet, so it's the ideal time to get to know your body and set yourself up well for what comes next.",
  },
  perimenopause: {
    card: 'The transition has begun, and your hormones are starting to fluctuate.',
    detail: "Perimenopause is the lead-up to menopause, and it can start in your 40s (sometimes earlier) and last anywhere from a few years to a decade. Estrogen doesn't just drop, it rises and dips unpredictably, which is what drives irregular periods, hot flushes, sleep changes, mood swings and brain fog. It's different for every woman, and if symptoms are affecting your life, a GP who understands menopause can talk through real options. The most useful things you can do now are keep your blood sugar steady, protect your sleep, hold onto muscle, and go gentler with fasting.",
  },
  transition: {
    card: "You're around the point of your final period, the biggest shift of the whole journey.",
    detail: "Menopause itself is a single point, twelve months after your last period, and the year around it is when hormonal change is often at its most noticeable. For many women this is when symptoms peak, but it's also the turning point, because things frequently settle as your body moves toward its new, steadier baseline. Your bones and heart start needing more attention as estrogen drops, so strength work, protein and looking after your cardiovascular health matter more now. Be patient with yourself through this stretch, it's demanding, but it's leading somewhere calmer.",
  },
  post_menopause: {
    card: "You're through the transition, and your hormones settle into a new, steadier baseline.",
    detail: "Post-menopause begins once you've gone twelve months without a period, and it lasts the rest of your life. Estrogen stays low but stops fluctuating, which is why many women find the day-to-day less turbulent than the years before, and often feel more like themselves again. The focus now shifts to long-term health: protecting muscle and bone with strength training and protein, looking after your heart, and staying on top of health checks. Plenty of women describe this as a genuinely freeing chapter, and it's never too late to start looking after your future self.",
  },
};

function makePlaceholderQuiz(stageLabel: string): QuizQuestion[] {
  return [
    {
      id: 'q1',
      prompt: `[PLACEHOLDER Q1] A gentle check-in question about ${stageLabel} goes here?`,
      options: [
        { id: 'a', label: '[PLACEHOLDER] Option A' },
        { id: 'b', label: '[PLACEHOLDER] Option B' },
        { id: 'c', label: '[PLACEHOLDER] Option C' },
      ],
      insight: `[PLACEHOLDER INSIGHT 1] A short, warm insight about ${stageLabel} revealed after answering Q1. One or two sentences.`,
    },
    {
      id: 'q2',
      prompt: `[PLACEHOLDER Q2] How is your energy or sleep feeling during ${stageLabel}?`,
      options: [
        { id: 'a', label: '[PLACEHOLDER] Really well' },
        { id: 'b', label: '[PLACEHOLDER] Variable' },
        { id: 'c', label: '[PLACEHOLDER] Pretty rough lately' },
      ],
      insight: `[PLACEHOLDER INSIGHT 2] A warm and encouraging observation for Q2, specific to ${stageLabel}.`,
    },
    {
      id: 'q3',
      prompt: `[PLACEHOLDER Q3] Are you noticing any symptoms in ${stageLabel}?`,
      options: [
        { id: 'a', label: '[PLACEHOLDER] Yes, quite a few' },
        { id: 'b', label: '[PLACEHOLDER] A couple' },
        { id: 'c', label: '[PLACEHOLDER] Not really' },
      ],
      insight: `[PLACEHOLDER INSIGHT 3] A reassuring note about common experiences in ${stageLabel}. Calm and non-alarming.`,
    },
    {
      id: 'q4',
      prompt: `[PLACEHOLDER Q4] How is fasting feeling for you right now in ${stageLabel}?`,
      options: [
        { id: 'a', label: '[PLACEHOLDER] Natural and easy' },
        { id: 'b', label: '[PLACEHOLDER] Some days are harder' },
        { id: 'c', label: '[PLACEHOLDER] Still finding my rhythm' },
      ],
      insight: `[PLACEHOLDER INSIGHT 4] A practical tip about fasting in ${stageLabel}. Warm and non-judgemental.`,
    },
    {
      id: 'q5',
      prompt: `[PLACEHOLDER Q5] What feels most important to you right now?`,
      options: [
        { id: 'a', label: '[PLACEHOLDER] Better sleep' },
        { id: 'b', label: '[PLACEHOLDER] More energy' },
        { id: 'c', label: '[PLACEHOLDER] Hormonal balance' },
        { id: 'd', label: '[PLACEHOLDER] All of the above' },
      ],
      insight: `[PLACEHOLDER INSIGHT 5] A closing warm note for ${stageLabel}. Encouraging — they completed the check-in.`,
    },
  ];
}

function makePlaceholderInsights(): Array<{ id: string; text: string }> {
  return [
    { id: 'i1', text: '[PLACEHOLDER TIP 1] Sample bite-size insight card. One sentence, warm and actionable.' },
    { id: 'i2', text: '[PLACEHOLDER TIP 2] Another helpful note for this stage. Short, specific, encouraging.' },
    { id: 'i3', text: '[PLACEHOLDER TIP 3] A third tip. Practical, calm, easy to act on today.' },
  ];
}

export const STAGE_CONTENT: Record<LearnStageId, StageContent> = {
  regular_cycle: {
    definition: STAGE_DEFINITIONS.regular_cycle,
    quiz: makePlaceholderQuiz('Regular Cycle'),
    insightCards: makePlaceholderInsights(),
  },
  perimenopause: {
    definition: STAGE_DEFINITIONS.perimenopause,
    quiz: makePlaceholderQuiz('Perimenopause'),
    insightCards: makePlaceholderInsights(),
  },
  transition: {
    definition: STAGE_DEFINITIONS.transition,
    quiz: makePlaceholderQuiz('Transition Year'),
    insightCards: makePlaceholderInsights(),
  },
  post_menopause: {
    definition: STAGE_DEFINITIONS.post_menopause,
    quiz: makePlaceholderQuiz('Post-Menopause'),
    insightCards: makePlaceholderInsights(),
  },
};
