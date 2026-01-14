// Questionnaire Data - Psychology-informed compatibility assessment
// Version: v2.0

export const QUESTIONNAIRE_VERSION = "v2.0";

export type QuestionType = "mcq" | "likert";

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  required: boolean;
  skipable?: boolean; // Only "Prefer not to say" MCQs can be skipped
  weight?: number; // Extra weight for matching (default 1)
}

export interface Section {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  randomizeOrder?: boolean;
}

// Likert scale labels - standardized
export const LIKERT_LABELS = [
  "Strongly Disagree",
  "Disagree",
  "Neutral",
  "Agree",
  "Strongly Agree"
];

export const sections: Section[] = [
  {
    id: "intent",
    title: "Getting Started",
    description: "What brings you here",
    randomizeOrder: true,
    questions: [
      {
        id: "q1_open_to",
        type: "mcq",
        text: "What are you currently open to?",
        options: [
          "Just meeting someone",
          "Casual dating",
          "Serious dating",
          "Open to a relationship",
          "Prefer not to say"
        ],
        required: true,
        skipable: true,
      },
      {
        id: "q2_emotional_availability",
        type: "mcq",
        text: "How much emotional availability do you have right now?",
        options: [
          "Very low",
          "Somewhat low",
          "Moderate",
          "High",
          "Very high"
        ],
        required: true,
      },
      {
        id: "q3_ready_invest",
        type: "likert",
        text: "I am emotionally ready to invest time in one person.",
        required: true,
      },
      {
        id: "q4_comfortable_vulnerable",
        type: "likert",
        text: "I am comfortable being vulnerable with someone new.",
        required: true,
      },
      {
        id: "q5_not_bored",
        type: "likert",
        text: "I am not just here out of boredom.",
        required: true,
      },
    ],
  },
  {
    id: "communication",
    title: "Communication & Conflict",
    description: "How do you navigate conversations and disagreements",
    randomizeOrder: true,
    questions: [
      {
        id: "q6_direct_issues",
        type: "likert",
        text: "I prefer addressing issues directly rather than avoiding them.",
        required: true,
      },
      {
        id: "q7_regular_comm",
        type: "likert",
        text: "I need regular communication to feel secure.",
        required: true,
      },
      {
        id: "q8_space_conflicts",
        type: "likert",
        text: "I'm okay with taking space during conflicts.",
        required: true,
      },
      {
        id: "q9_long_silences",
        type: "likert",
        text: "I get uncomfortable with long silences.",
        required: true,
      },
      {
        id: "q10_clarity_politeness",
        type: "likert",
        text: "I value clarity over politeness.",
        required: true,
      },
      {
        id: "q11_conflict_style",
        type: "mcq",
        text: "During conflict, you usually:",
        options: [
          "Talk it out immediately",
          "Take time, then talk",
          "Avoid until it passes",
          "Shut down emotionally"
        ],
        required: true,
      },
    ],
  },
  {
    id: "affection",
    title: "Affection & Expression",
    description: "How you give and receive love",
    randomizeOrder: true,
    questions: [
      {
        id: "q12_express_openly",
        type: "likert",
        text: "I express affection openly.",
        required: true,
      },
      {
        id: "q13_verbal_reassurance",
        type: "likert",
        text: "I appreciate verbal reassurance.",
        required: true,
      },
      {
        id: "q14_quality_time",
        type: "likert",
        text: "I feel loved through quality time.",
        required: true,
      },
      {
        id: "q15_physical_closeness",
        type: "likert",
        text: "Physical closeness is important to me.",
        required: true,
      },
      {
        id: "q16_feelings_first",
        type: "likert",
        text: "I am comfortable expressing my feelings first.",
        required: true,
      },
    ],
  },
  {
    id: "social",
    title: "Social Life & Independence",
    description: "Balancing togetherness and individuality",
    randomizeOrder: true,
    questions: [
      {
        id: "q17_independent_life",
        type: "likert",
        text: "I value having my own independent life outside a relationship.",
        required: true,
      },
      {
        id: "q18_most_time_together",
        type: "likert",
        text: "I like spending most of my free time with one person.",
        required: true,
      },
      {
        id: "q19_group_hangouts",
        type: "likert",
        text: "I enjoy group hangouts more than one-on-one time.",
        required: true,
      },
      {
        id: "q20_active_social",
        type: "likert",
        text: "I'm comfortable dating someone with a very active social life.",
        required: true,
      },
      {
        id: "q21_ideal_weekend",
        type: "mcq",
        text: "Your ideal weekend looks like:",
        options: [
          "Quiet + personal time",
          "One-on-one plans",
          "Friends + social outings",
          "A mix of everything"
        ],
        required: true,
      },
    ],
  },
  {
    id: "values",
    title: "Values & Worldview",
    description: "What matters most to you",
    randomizeOrder: true,
    questions: [
      {
        id: "q22_ambition_career",
        type: "likert",
        text: "Ambition and career growth are important to me.",
        required: true,
      },
      {
        id: "q23_emotional_intelligence",
        type: "likert",
        text: "I value emotional intelligence in a partner.",
        required: true,
      },
      {
        id: "q24_respect_chemistry",
        type: "likert",
        text: "I believe mutual respect matters more than chemistry.",
        required: true,
      },
      {
        id: "q25_open_minded",
        type: "likert",
        text: "I am open-minded about different opinions.",
        required: true,
      },
      {
        id: "q26_personal_growth",
        type: "likert",
        text: "I think personal growth should be constant.",
        required: true,
      },
    ],
  },
  {
    id: "cultural",
    title: "Cultural Realities",
    description: "Navigating campus and social dynamics",
    randomizeOrder: true,
    questions: [
      {
        id: "q27_private_relationship",
        type: "likert",
        text: "I'm comfortable keeping relationships private.",
        required: true,
      },
      {
        id: "q28_social_perception",
        type: "likert",
        text: "I care about how a relationship is perceived socially.",
        required: true,
      },
      {
        id: "q29_different_background",
        type: "likert",
        text: "I'm okay dating someone from a very different background.",
        required: true,
      },
      {
        id: "q30_discretion_trust",
        type: "likert",
        text: "I value discretion and trust highly.",
        required: true,
      },
      {
        id: "q31_public_preference",
        type: "mcq",
        text: "How public do you prefer a relationship to be?",
        options: [
          "Very private",
          "Mostly private",
          "Balanced",
          "Mostly public",
          "Very public"
        ],
        required: true,
      },
    ],
  },
  {
    id: "availability",
    title: "Time & Energy",
    description: "What you can realistically offer",
    randomizeOrder: true,
    questions: [
      {
        id: "q32_consistent_time",
        type: "likert",
        text: "I can make time consistently for someone I care about.",
        required: true,
      },
      {
        id: "q33_workload_manageable",
        type: "likert",
        text: "My academic workload is manageable.",
        required: true,
      },
      {
        id: "q34_planned_dates",
        type: "likert",
        text: "I prefer planned dates over spontaneous ones.",
        required: true,
      },
      {
        id: "q35_frequent_checkins",
        type: "likert",
        text: "I like frequent check-ins.",
        required: true,
      },
      {
        id: "q36_meet_frequency",
        type: "mcq",
        text: "How often would you ideally like to meet?",
        options: [
          "Once a week",
          "2–3 times a week",
          "Almost daily",
          "Depends on situation"
        ],
        required: true,
      },
    ],
  },
  {
    id: "decision",
    title: "Decision-Making",
    description: "How you approach relationships",
    randomizeOrder: true,
    questions: [
      {
        id: "q37_depth_over_options",
        type: "likert",
        text: "I prefer depth over multiple options.",
        required: true,
      },
      {
        id: "q38_commit_slowly",
        type: "likert",
        text: "I commit slowly but seriously.",
        required: true,
      },
      {
        id: "q39_trust_intuition",
        type: "likert",
        text: "I trust my intuition when choosing people.",
        required: true,
      },
      {
        id: "q40_value_exclusivity",
        type: "likert",
        text: "I value exclusivity once I feel a connection.",
        required: true,
      },
    ],
  },
  {
    id: "boundaries",
    title: "Boundaries & Expectations",
    description: "What you need to feel safe",
    randomizeOrder: true,
    questions: [
      {
        id: "q41_clear_boundaries",
        type: "likert",
        text: "I'm clear about my boundaries.",
        required: true,
      },
      {
        id: "q42_respect_boundaries",
        type: "likert",
        text: "I respect others' boundaries even if I don't agree.",
        required: true,
      },
      {
        id: "q43_comfortable_no",
        type: "likert",
        text: "I'm comfortable saying no.",
        required: true,
      },
      {
        id: "q44_emotional_safety",
        type: "likert",
        text: "I need emotional safety to open up.",
        required: true,
      },
    ],
  },
  {
    id: "attraction",
    title: "Attraction & Chemistry",
    description: "What draws you to someone",
    randomizeOrder: true,
    questions: [
      {
        id: "q45_emotional_increases_physical",
        type: "likert",
        text: "Emotional connection increases physical attraction for me.",
        required: true,
      },
      {
        id: "q46_physical_important",
        type: "likert",
        text: "Physical attraction is important for me to feel interested.",
        required: true,
      },
      {
        id: "q47_attraction_grow",
        type: "likert",
        text: "I believe attraction can grow over time.",
        required: true,
      },
      {
        id: "q48_both_chemistry",
        type: "likert",
        text: "I need both emotional and physical chemistry.",
        required: true,
      },
    ],
  },
  {
    id: "tempo",
    title: "Relationship Tempo",
    description: "Your natural pace in relationships",
    randomizeOrder: false,
    questions: [
      {
        id: "q49_feelings_pace",
        type: "mcq",
        text: "You usually:",
        options: [
          "Develop feelings slowly",
          "Warm up gradually",
          "Feel connections quickly",
          "Feel intense connections fast"
        ],
        required: true,
      },
      {
        id: "q50_dating_pace",
        type: "mcq",
        text: "When dating someone new, you prefer:",
        options: [
          "Taking things very slow",
          "Going with the flow",
          "Clear direction early"
        ],
        required: true,
      },
    ],
  },
  {
    id: "reflection",
    title: "Self-Awareness",
    description: "Your relationship with yourself",
    randomizeOrder: true,
    questions: [
      {
        id: "q51_reflect_past",
        type: "likert",
        text: "I reflect on my past relationships to improve.",
        required: true,
      },
      {
        id: "q52_take_responsibility",
        type: "likert",
        text: "I take responsibility when things go wrong.",
        required: true,
      },
      {
        id: "q53_aware_triggers",
        type: "likert",
        text: "I'm aware of my emotional triggers.",
        required: true,
      },
      {
        id: "q54_better_partner",
        type: "likert",
        text: "I'm actively working on becoming a better partner.",
        required: true,
      },
    ],
  },
  {
    id: "calibration",
    title: "Final Thought",
    description: "One last question",
    randomizeOrder: false,
    questions: [
      {
        id: "q55_meaningful_over_shallow",
        type: "likert",
        text: "I would rather have one meaningful connection than many shallow ones.",
        required: true,
        weight: 3, // High weight - core philosophy alignment
      },
    ],
  },
];

// Helper to get all questions flattened with section info
export interface FlatQuestion extends Question {
  sectionId: string;
  sectionTitle: string;
  sectionDescription: string;
  questionIndex: number;
  totalInSection: number;
}

export function getFlattenedQuestions(): FlatQuestion[] {
  const flat: FlatQuestion[] = [];
  
  for (const section of sections) {
    let questions = [...section.questions];
    
    // Randomize within section if specified
    if (section.randomizeOrder) {
      questions = shuffleArray(questions);
    }
    
    questions.forEach((q, idx) => {
      flat.push({
        ...q,
        sectionId: section.id,
        sectionTitle: section.title,
        sectionDescription: section.description,
        questionIndex: idx,
        totalInSection: questions.length,
      });
    });
  }
  
  return flat;
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getTotalQuestions(): number {
  return sections.reduce((acc, section) => acc + section.questions.length, 0);
}
