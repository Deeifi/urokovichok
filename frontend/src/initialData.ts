import type { ScheduleRequest } from './types';

export const INITIAL_DATA: ScheduleRequest = {
  "teachers": [
    {
      "id": "t1",
      "name": "Шевченко Т.Г.",
      "subjects": [
        "ukr_lang",
        "ukr_lit"
      ]
    },
    {
      "id": "t2",
      "name": "Франко І.Я.",
      "subjects": [
        "ukr_lang",
        "ukr_lit"
      ]
    },
    {
      "id": "t3",
      "name": "Леся Українка",
      "subjects": [
        "ukr_lang",
        "ukr_lit",
        "for_lit"
      ]
    },
    {
      "id": "t4",
      "name": "Костенко Л.В.",
      "subjects": [
        "for_lit",
        "art"
      ]
    },
    {
      "id": "t5",
      "name": "Шекспір В.",
      "subjects": [
        "eng"
      ]
    },
    {
      "id": "t6",
      "name": "Байрон Д.",
      "subjects": [
        "eng"
      ]
    },
    {
      "id": "t7",
      "name": "Твен М.",
      "subjects": [
        "eng"
      ]
    },
    {
      "id": "t8",
      "name": "Архімед С.",
      "subjects": [
        "math",
        "alg",
        "geom"
      ]
    },
    {
      "id": "t9",
      "name": "Піфагор С.",
      "subjects": [
        "math",
        "alg",
        "geom"
      ]
    },
    {
      "id": "t10",
      "name": "Евклід О.",
      "subjects": [
        "math",
        "alg",
        "geom"
      ]
    },
    {
      "id": "t11",
      "name": "Ейнштейн А.",
      "subjects": [
        "phys",
        "astro",
        "nat_sci"
      ]
    },
    {
      "id": "t12",
      "name": "Ньютон І.",
      "subjects": [
        "phys",
        "math"
      ]
    },
    {
      "id": "t13",
      "name": "Менделєєв Д.",
      "subjects": [
        "chem",
        "bio"
      ]
    },
    {
      "id": "t14",
      "name": "Дарвін Ч.",
      "subjects": [
        "bio",
        "nat_sci",
        "health"
      ]
    },
    {
      "id": "t15",
      "name": "Колумб Х.",
      "subjects": [
        "geog",
        "hist_world"
      ]
    },
    {
      "id": "t16",
      "name": "Грушевський М.",
      "subjects": [
        "hist_ukr",
        "hist_world",
        "civic"
      ]
    },
    {
      "id": "t17",
      "name": "Мазепа І.",
      "subjects": [
        "hist_ukr",
        "defense"
      ]
    },
    {
      "id": "t18",
      "name": "Гейтс Б.",
      "subjects": [
        "cs",
        "tech"
      ]
    },
    {
      "id": "t19",
      "name": "Джобс С.",
      "subjects": [
        "cs",
        "tech"
      ]
    },
    {
      "id": "t20",
      "name": "Маск І.",
      "subjects": [
        "tech",
        "phys"
      ]
    },
    {
      "id": "t21",
      "name": "Да Вінчі Л.",
      "subjects": [
        "art",
        "tech"
      ]
    },
    {
      "id": "t22",
      "name": "Моцарт В.",
      "subjects": [
        "art"
      ]
    },
    {
      "id": "t23",
      "name": "Павлов І.",
      "subjects": [
        "bio",
        "health"
      ]
    },
    {
      "id": "t24",
      "name": "Амосов М.",
      "subjects": [
        "health",
        "defense"
      ]
    },
    {
      "id": "t25",
      "name": "Усик О.",
      "subjects": [
        "pe"
      ]
    },
    {
      "id": "t26",
      "name": "Шевченко А.",
      "subjects": [
        "pe"
      ]
    },
    {
      "id": "t27",
      "name": "Кличко В.",
      "subjects": [
        "pe",
        "defense"
      ]
    },
    {
      "id": "t28",
      "name": "Сікорський І.",
      "subjects": [
        "tech",
        "phys"
      ]
    }
  ],
  "classes": [
    {
      "id": "5-A",
      "name": "5-А"
    },
    {
      "id": "5-B",
      "name": "5-Б"
    },
    {
      "id": "6-A",
      "name": "6-А"
    },
    {
      "id": "6-B",
      "name": "6-Б"
    },
    {
      "id": "7-A",
      "name": "7-А"
    },
    {
      "id": "7-B",
      "name": "7-Б"
    },
    {
      "id": "8-A",
      "name": "8-А"
    },
    {
      "id": "8-B",
      "name": "8-Б"
    },
    {
      "id": "9-A",
      "name": "9-А"
    },
    {
      "id": "9-B",
      "name": "9-Б"
    },
    {
      "id": "10-A",
      "name": "10-А"
    },
    {
      "id": "10-B",
      "name": "10-Б"
    },
    {
      "id": "11-A",
      "name": "11-А"
    },
    {
      "id": "11-B",
      "name": "11-Б"
    }
  ],
  "subjects": [
    {
      "id": "ukr_lang",
      "name": "Українська мова",
      "color": "#3b82f6",
      "icon": "Languages"
    },
    {
      "id": "ukr_lit",
      "name": "Українська література",
      "color": "#6366f1",
      "icon": "Book"
    },
    {
      "id": "for_lit",
      "name": "Зарубіжна література",
      "color": "#8b5cf6",
      "icon": "Library"
    },
    {
      "id": "eng",
      "name": "Іноземна мова",
      "color": "#ec4899",
      "icon": "Globe2"
    },
    {
      "id": "math",
      "name": "Математика",
      "color": "#ef4444",
      "icon": "Calculator"
    },
    {
      "id": "alg",
      "name": "Алгебра",
      "color": "#f87171",
      "icon": "Divide"
    },
    {
      "id": "geom",
      "name": "Геометрія",
      "color": "#fca5a5",
      "icon": "Shapes"
    },
    {
      "id": "bio",
      "name": "Біологія",
      "color": "#10b981",
      "icon": "Dna"
    },
    {
      "id": "chem",
      "name": "Хімія",
      "color": "#059669",
      "icon": "FlaskConical"
    },
    {
      "id": "phys",
      "name": "Фізика",
      "color": "#06b6d4",
      "icon": "Atom"
    },
    {
      "id": "geog",
      "name": "Географія",
      "color": "#0ea5e9",
      "icon": "Map"
    },
    {
      "id": "hist_ukr",
      "name": "Історія України",
      "color": "#f59e0b",
      "icon": "Scroll"
    },
    {
      "id": "hist_world",
      "name": "Всесвітня історія",
      "color": "#fbbf24",
      "icon": "Landmark"
    },
    {
      "id": "civic",
      "name": "Громадянська освіта",
      "color": "#fcd34d",
      "icon": "Users2"
    },
    {
      "id": "art",
      "name": "Мистецтво",
      "color": "#d946ef",
      "icon": "Palette"
    },
    {
      "id": "tech",
      "name": "Технології",
      "color": "#71717a",
      "icon": "Hammer"
    },
    {
      "id": "cs",
      "name": "Інформатика",
      "color": "#334155",
      "icon": "Cpu"
    },
    {
      "id": "health",
      "name": "Основи здоров'я",
      "color": "#22c55e",
      "icon": "HeartPulse"
    },
    {
      "id": "pe",
      "name": "Фізична культура",
      "color": "#f97316",
      "icon": "Dumbbell"
    },
    {
      "id": "defense",
      "name": "Захист України",
      "color": "#166534",
      "icon": "Shield"
    },
    {
      "id": "astro",
      "name": "Астрономія",
      "color": "#1e293b",
      "icon": "Telescope"
    },
    {
      "id": "nat_sci",
      "name": "Природознавство",
      "color": "#4ade80",
      "icon": "Leaf"
    }
  ],
  "plan": [
    {
      "class_id": "5-A",
      "subject_id": "ukr_lang",
      "teacher_id": "t1",
      "hours_per_week": 4
    },
    {
      "class_id": "5-A",
      "subject_id": "ukr_lit",
      "teacher_id": "t2",
      "hours_per_week": 2
    },
    {
      "class_id": "5-A",
      "subject_id": "for_lit",
      "teacher_id": "t3",
      "hours_per_week": 1
    },
    {
      "class_id": "5-A",
      "subject_id": "eng",
      "teacher_id": "t5",
      "hours_per_week": 4
    },
    {
      "class_id": "5-A",
      "subject_id": "math",
      "teacher_id": "t8",
      "hours_per_week": 5
    },
    {
      "class_id": "5-A",
      "subject_id": "nat_sci",
      "teacher_id": "t11",
      "hours_per_week": 2
    },
    {
      "class_id": "5-A",
      "subject_id": "hist_ukr",
      "teacher_id": "t16",
      "hours_per_week": 1
    },
    {
      "class_id": "5-A",
      "subject_id": "art",
      "teacher_id": "t4",
      "hours_per_week": 2
    },
    {
      "class_id": "5-A",
      "subject_id": "tech",
      "teacher_id": "t18",
      "hours_per_week": 2
    },
    {
      "class_id": "5-A",
      "subject_id": "cs",
      "teacher_id": "t19",
      "hours_per_week": 2
    },
    {
      "class_id": "5-A",
      "subject_id": "health",
      "teacher_id": "t14",
      "hours_per_week": 1
    },
    {
      "class_id": "5-A",
      "subject_id": "pe",
      "teacher_id": "t25",
      "hours_per_week": 3
    },
    {
      "class_id": "5-B",
      "subject_id": "ukr_lang",
      "teacher_id": "t3",
      "hours_per_week": 4
    },
    {
      "class_id": "5-B",
      "subject_id": "ukr_lit",
      "teacher_id": "t2",
      "hours_per_week": 2
    },
    {
      "class_id": "5-B",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 1
    },
    {
      "class_id": "5-B",
      "subject_id": "eng",
      "teacher_id": "t6",
      "hours_per_week": 4
    },
    {
      "class_id": "5-B",
      "subject_id": "math",
      "teacher_id": "t9",
      "hours_per_week": 5
    },
    {
      "class_id": "5-B",
      "subject_id": "nat_sci",
      "teacher_id": "t14",
      "hours_per_week": 2
    },
    {
      "class_id": "5-B",
      "subject_id": "hist_ukr",
      "teacher_id": "t17",
      "hours_per_week": 1
    },
    {
      "class_id": "5-B",
      "subject_id": "art",
      "teacher_id": "t21",
      "hours_per_week": 2
    },
    {
      "class_id": "5-B",
      "subject_id": "tech",
      "teacher_id": "t20",
      "hours_per_week": 2
    },
    {
      "class_id": "5-B",
      "subject_id": "cs",
      "teacher_id": "t18",
      "hours_per_week": 2
    },
    {
      "class_id": "5-B",
      "subject_id": "health",
      "teacher_id": "t23",
      "hours_per_week": 1
    },
    {
      "class_id": "5-B",
      "subject_id": "pe",
      "teacher_id": "t26",
      "hours_per_week": 3
    },
    {
      "class_id": "6-A",
      "subject_id": "ukr_lang",
      "teacher_id": "t1",
      "hours_per_week": 4
    },
    {
      "class_id": "6-A",
      "subject_id": "ukr_lit",
      "teacher_id": "t2",
      "hours_per_week": 2
    },
    {
      "class_id": "6-A",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 1
    },
    {
      "class_id": "6-A",
      "subject_id": "eng",
      "teacher_id": "t7",
      "hours_per_week": 4
    },
    {
      "class_id": "6-A",
      "subject_id": "math",
      "teacher_id": "t10",
      "hours_per_week": 5
    },
    {
      "class_id": "6-A",
      "subject_id": "nat_sci",
      "teacher_id": "t11",
      "hours_per_week": 2
    },
    {
      "class_id": "6-A",
      "subject_id": "hist_ukr",
      "teacher_id": "t16",
      "hours_per_week": 2
    },
    {
      "class_id": "6-A",
      "subject_id": "art",
      "teacher_id": "t22",
      "hours_per_week": 2
    },
    {
      "class_id": "6-A",
      "subject_id": "tech",
      "teacher_id": "t28",
      "hours_per_week": 2
    },
    {
      "class_id": "6-A",
      "subject_id": "cs",
      "teacher_id": "t19",
      "hours_per_week": 2
    },
    {
      "class_id": "6-A",
      "subject_id": "health",
      "teacher_id": "t24",
      "hours_per_week": 1
    },
    {
      "class_id": "6-A",
      "subject_id": "pe",
      "teacher_id": "t27",
      "hours_per_week": 3
    },
    {
      "class_id": "6-B",
      "subject_id": "ukr_lang",
      "teacher_id": "t3",
      "hours_per_week": 4
    },
    {
      "class_id": "6-B",
      "subject_id": "ukr_lit",
      "teacher_id": "t2",
      "hours_per_week": 2
    },
    {
      "class_id": "6-B",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 1
    },
    {
      "class_id": "6-B",
      "subject_id": "eng",
      "teacher_id": "t5",
      "hours_per_week": 4
    },
    {
      "class_id": "6-B",
      "subject_id": "math",
      "teacher_id": "t12",
      "hours_per_week": 5
    },
    {
      "class_id": "6-B",
      "subject_id": "nat_sci",
      "teacher_id": "t14",
      "hours_per_week": 2
    },
    {
      "class_id": "6-B",
      "subject_id": "hist_ukr",
      "teacher_id": "t17",
      "hours_per_week": 2
    },
    {
      "class_id": "6-B",
      "subject_id": "art",
      "teacher_id": "t21",
      "hours_per_week": 2
    },
    {
      "class_id": "6-B",
      "subject_id": "tech",
      "teacher_id": "t20",
      "hours_per_week": 2
    },
    {
      "class_id": "6-B",
      "subject_id": "cs",
      "teacher_id": "t18",
      "hours_per_week": 2
    },
    {
      "class_id": "6-B",
      "subject_id": "health",
      "teacher_id": "t23",
      "hours_per_week": 1
    },
    {
      "class_id": "6-B",
      "subject_id": "pe",
      "teacher_id": "t25",
      "hours_per_week": 3
    },
    {
      "class_id": "7-A",
      "subject_id": "ukr_lang",
      "teacher_id": "t1",
      "hours_per_week": 3
    },
    {
      "class_id": "7-A",
      "subject_id": "ukr_lit",
      "teacher_id": "t2",
      "hours_per_week": 2
    },
    {
      "class_id": "7-A",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 1
    },
    {
      "class_id": "7-A",
      "subject_id": "eng",
      "teacher_id": "t6",
      "hours_per_week": 3
    },
    {
      "class_id": "7-A",
      "subject_id": "alg",
      "teacher_id": "t8",
      "hours_per_week": 3
    },
    {
      "class_id": "7-A",
      "subject_id": "geom",
      "teacher_id": "t9",
      "hours_per_week": 3
    },
    {
      "class_id": "7-A",
      "subject_id": "bio",
      "teacher_id": "t13",
      "hours_per_week": 2
    },
    {
      "class_id": "7-A",
      "subject_id": "chem",
      "teacher_id": "t13",
      "hours_per_week": 1
    },
    {
      "class_id": "7-A",
      "subject_id": "phys",
      "teacher_id": "t28",
      "hours_per_week": 1
    },
    {
      "class_id": "7-A",
      "subject_id": "geog",
      "teacher_id": "t15",
      "hours_per_week": 2
    },
    {
      "class_id": "7-A",
      "subject_id": "hist_ukr",
      "teacher_id": "t16",
      "hours_per_week": 2
    },
    {
      "class_id": "7-A",
      "subject_id": "hist_world",
      "teacher_id": "t15",
      "hours_per_week": 1
    },
    {
      "class_id": "7-A",
      "subject_id": "art",
      "teacher_id": "t22",
      "hours_per_week": 1
    },
    {
      "class_id": "7-A",
      "subject_id": "tech",
      "teacher_id": "t28",
      "hours_per_week": 2
    },
    {
      "class_id": "7-A",
      "subject_id": "cs",
      "teacher_id": "t19",
      "hours_per_week": 2
    },
    {
      "class_id": "7-A",
      "subject_id": "health",
      "teacher_id": "t24",
      "hours_per_week": 1
    },
    {
      "class_id": "7-A",
      "subject_id": "pe",
      "teacher_id": "t26",
      "hours_per_week": 3
    },
    {
      "class_id": "7-B",
      "subject_id": "ukr_lang",
      "teacher_id": "t3",
      "hours_per_week": 3
    },
    {
      "class_id": "7-B",
      "subject_id": "ukr_lit",
      "teacher_id": "t2",
      "hours_per_week": 2
    },
    {
      "class_id": "7-B",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 1
    },
    {
      "class_id": "7-B",
      "subject_id": "eng",
      "teacher_id": "t7",
      "hours_per_week": 3
    },
    {
      "class_id": "7-B",
      "subject_id": "alg",
      "teacher_id": "t10",
      "hours_per_week": 3
    },
    {
      "class_id": "7-B",
      "subject_id": "geom",
      "teacher_id": "t8",
      "hours_per_week": 3
    },
    {
      "class_id": "7-B",
      "subject_id": "bio",
      "teacher_id": "t23",
      "hours_per_week": 2
    },
    {
      "class_id": "7-B",
      "subject_id": "chem",
      "teacher_id": "t13",
      "hours_per_week": 1
    },
    {
      "class_id": "7-B",
      "subject_id": "phys",
      "teacher_id": "t11",
      "hours_per_week": 1
    },
    {
      "class_id": "7-B",
      "subject_id": "geog",
      "teacher_id": "t15",
      "hours_per_week": 2
    },
    {
      "class_id": "7-B",
      "subject_id": "hist_ukr",
      "teacher_id": "t17",
      "hours_per_week": 2
    },
    {
      "class_id": "7-B",
      "subject_id": "hist_world",
      "teacher_id": "t15",
      "hours_per_week": 1
    },
    {
      "class_id": "7-B",
      "subject_id": "art",
      "teacher_id": "t22",
      "hours_per_week": 1
    },
    {
      "class_id": "7-B",
      "subject_id": "tech",
      "teacher_id": "t20",
      "hours_per_week": 2
    },
    {
      "class_id": "7-B",
      "subject_id": "cs",
      "teacher_id": "t18",
      "hours_per_week": 2
    },
    {
      "class_id": "7-B",
      "subject_id": "health",
      "teacher_id": "t24",
      "hours_per_week": 1
    },
    {
      "class_id": "7-B",
      "subject_id": "pe",
      "teacher_id": "t27",
      "hours_per_week": 3
    },
    {
      "class_id": "8-A",
      "subject_id": "ukr_lang",
      "teacher_id": "t1",
      "hours_per_week": 3
    },
    {
      "class_id": "8-A",
      "subject_id": "ukr_lit",
      "teacher_id": "t2",
      "hours_per_week": 2
    },
    {
      "class_id": "8-A",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 1
    },
    {
      "class_id": "8-A",
      "subject_id": "eng",
      "teacher_id": "t6",
      "hours_per_week": 3
    },
    {
      "class_id": "8-A",
      "subject_id": "alg",
      "teacher_id": "t9",
      "hours_per_week": 3
    },
    {
      "class_id": "8-A",
      "subject_id": "geom",
      "teacher_id": "t10",
      "hours_per_week": 3
    },
    {
      "class_id": "8-A",
      "subject_id": "bio",
      "teacher_id": "t13",
      "hours_per_week": 2
    },
    {
      "class_id": "8-A",
      "subject_id": "chem",
      "teacher_id": "t13",
      "hours_per_week": 1
    },
    {
      "class_id": "8-A",
      "subject_id": "phys",
      "teacher_id": "t11",
      "hours_per_week": 2
    },
    {
      "class_id": "8-A",
      "subject_id": "geog",
      "teacher_id": "t15",
      "hours_per_week": 2
    },
    {
      "class_id": "8-A",
      "subject_id": "hist_ukr",
      "teacher_id": "t16",
      "hours_per_week": 2
    },
    {
      "class_id": "8-A",
      "subject_id": "hist_world",
      "teacher_id": "t16",
      "hours_per_week": 1
    },
    {
      "class_id": "8-A",
      "subject_id": "civic",
      "teacher_id": "t16",
      "hours_per_week": 1
    },
    {
      "class_id": "8-A",
      "subject_id": "art",
      "teacher_id": "t21",
      "hours_per_week": 1
    },
    {
      "class_id": "8-A",
      "subject_id": "tech",
      "teacher_id": "t21",
      "hours_per_week": 2
    },
    {
      "class_id": "8-A",
      "subject_id": "cs",
      "teacher_id": "t19",
      "hours_per_week": 2
    },
    {
      "class_id": "8-A",
      "subject_id": "health",
      "teacher_id": "t24",
      "hours_per_week": 1
    },
    {
      "class_id": "8-A",
      "subject_id": "pe",
      "teacher_id": "t25",
      "hours_per_week": 3
    },
    {
      "class_id": "8-B",
      "subject_id": "ukr_lang",
      "teacher_id": "t3",
      "hours_per_week": 3
    },
    {
      "class_id": "8-B",
      "subject_id": "ukr_lit",
      "teacher_id": "t1",
      "hours_per_week": 2
    },
    {
      "class_id": "8-B",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 1
    },
    {
      "class_id": "8-B",
      "subject_id": "eng",
      "teacher_id": "t7",
      "hours_per_week": 3
    },
    {
      "class_id": "8-B",
      "subject_id": "alg",
      "teacher_id": "t8",
      "hours_per_week": 3
    },
    {
      "class_id": "8-B",
      "subject_id": "geom",
      "teacher_id": "t9",
      "hours_per_week": 3
    },
    {
      "class_id": "8-B",
      "subject_id": "bio",
      "teacher_id": "t23",
      "hours_per_week": 2
    },
    {
      "class_id": "8-B",
      "subject_id": "chem",
      "teacher_id": "t13",
      "hours_per_week": 1
    },
    {
      "class_id": "8-B",
      "subject_id": "phys",
      "teacher_id": "t12",
      "hours_per_week": 2
    },
    {
      "class_id": "8-B",
      "subject_id": "geog",
      "teacher_id": "t15",
      "hours_per_week": 2
    },
    {
      "class_id": "8-B",
      "subject_id": "hist_ukr",
      "teacher_id": "t17",
      "hours_per_week": 2
    },
    {
      "class_id": "8-B",
      "subject_id": "hist_world",
      "teacher_id": "t16",
      "hours_per_week": 1
    },
    {
      "class_id": "8-B",
      "subject_id": "civic",
      "teacher_id": "t16",
      "hours_per_week": 1
    },
    {
      "class_id": "8-B",
      "subject_id": "art",
      "teacher_id": "t22",
      "hours_per_week": 1
    },
    {
      "class_id": "8-B",
      "subject_id": "tech",
      "teacher_id": "t28",
      "hours_per_week": 2
    },
    {
      "class_id": "8-B",
      "subject_id": "cs",
      "teacher_id": "t18",
      "hours_per_week": 2
    },
    {
      "class_id": "8-B",
      "subject_id": "health",
      "teacher_id": "t24",
      "hours_per_week": 1
    },
    {
      "class_id": "8-B",
      "subject_id": "pe",
      "teacher_id": "t26",
      "hours_per_week": 3
    },
    {
      "class_id": "9-A",
      "subject_id": "ukr_lang",
      "teacher_id": "t2",
      "hours_per_week": 3
    },
    {
      "class_id": "9-A",
      "subject_id": "ukr_lit",
      "teacher_id": "t3",
      "hours_per_week": 2
    },
    {
      "class_id": "9-A",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 2
    },
    {
      "class_id": "9-A",
      "subject_id": "eng",
      "teacher_id": "t5",
      "hours_per_week": 3
    },
    {
      "class_id": "9-A",
      "subject_id": "alg",
      "teacher_id": "t10",
      "hours_per_week": 3
    },
    {
      "class_id": "9-A",
      "subject_id": "geom",
      "teacher_id": "t8",
      "hours_per_week": 3
    },
    {
      "class_id": "9-A",
      "subject_id": "bio",
      "teacher_id": "t14",
      "hours_per_week": 2
    },
    {
      "class_id": "9-A",
      "subject_id": "chem",
      "teacher_id": "t13",
      "hours_per_week": 2
    },
    {
      "class_id": "9-A",
      "subject_id": "phys",
      "teacher_id": "t20",
      "hours_per_week": 3
    },
    {
      "class_id": "9-A",
      "subject_id": "geog",
      "teacher_id": "t15",
      "hours_per_week": 2
    },
    {
      "class_id": "9-A",
      "subject_id": "hist_ukr",
      "teacher_id": "t17",
      "hours_per_week": 2
    },
    {
      "class_id": "9-A",
      "subject_id": "hist_world",
      "teacher_id": "t16",
      "hours_per_week": 1
    },
    {
      "class_id": "9-A",
      "subject_id": "civic",
      "teacher_id": "t16",
      "hours_per_week": 1
    },
    {
      "class_id": "9-A",
      "subject_id": "art",
      "teacher_id": "t22",
      "hours_per_week": 1
    },
    {
      "class_id": "9-A",
      "subject_id": "tech",
      "teacher_id": "t21",
      "hours_per_week": 2
    },
    {
      "class_id": "9-A",
      "subject_id": "cs",
      "teacher_id": "t19",
      "hours_per_week": 2
    },
    {
      "class_id": "9-A",
      "subject_id": "health",
      "teacher_id": "t24",
      "hours_per_week": 1
    },
    {
      "class_id": "9-A",
      "subject_id": "pe",
      "teacher_id": "t27",
      "hours_per_week": 3
    },
    {
      "class_id": "9-B",
      "subject_id": "ukr_lang",
      "teacher_id": "t1",
      "hours_per_week": 3
    },
    {
      "class_id": "9-B",
      "subject_id": "ukr_lit",
      "teacher_id": "t2",
      "hours_per_week": 2
    },
    {
      "class_id": "9-B",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 2
    },
    {
      "class_id": "9-B",
      "subject_id": "eng",
      "teacher_id": "t6",
      "hours_per_week": 3
    },
    {
      "class_id": "9-B",
      "subject_id": "alg",
      "teacher_id": "t9",
      "hours_per_week": 3
    },
    {
      "class_id": "9-B",
      "subject_id": "geom",
      "teacher_id": "t10",
      "hours_per_week": 3
    },
    {
      "class_id": "9-B",
      "subject_id": "bio",
      "teacher_id": "t23",
      "hours_per_week": 2
    },
    {
      "class_id": "9-B",
      "subject_id": "chem",
      "teacher_id": "t13",
      "hours_per_week": 2
    },
    {
      "class_id": "9-B",
      "subject_id": "phys",
      "teacher_id": "t11",
      "hours_per_week": 3
    },
    {
      "class_id": "9-B",
      "subject_id": "geog",
      "teacher_id": "t15",
      "hours_per_week": 2
    },
    {
      "class_id": "9-B",
      "subject_id": "hist_ukr",
      "teacher_id": "t17",
      "hours_per_week": 2
    },
    {
      "class_id": "9-B",
      "subject_id": "hist_world",
      "teacher_id": "t16",
      "hours_per_week": 1
    },
    {
      "class_id": "9-B",
      "subject_id": "civic",
      "teacher_id": "t16",
      "hours_per_week": 1
    },
    {
      "class_id": "9-B",
      "subject_id": "art",
      "teacher_id": "t22",
      "hours_per_week": 1
    },
    {
      "class_id": "9-B",
      "subject_id": "tech",
      "teacher_id": "t28",
      "hours_per_week": 2
    },
    {
      "class_id": "9-B",
      "subject_id": "cs",
      "teacher_id": "t18",
      "hours_per_week": 2
    },
    {
      "class_id": "9-B",
      "subject_id": "health",
      "teacher_id": "t24",
      "hours_per_week": 1
    },
    {
      "class_id": "9-B",
      "subject_id": "pe",
      "teacher_id": "t25",
      "hours_per_week": 3
    },
    {
      "class_id": "10-A",
      "subject_id": "ukr_lang",
      "teacher_id": "t3",
      "hours_per_week": 2
    },
    {
      "class_id": "10-A",
      "subject_id": "ukr_lit",
      "teacher_id": "t1",
      "hours_per_week": 2
    },
    {
      "class_id": "10-A",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 1
    },
    {
      "class_id": "10-A",
      "subject_id": "eng",
      "teacher_id": "t7",
      "hours_per_week": 3
    },
    {
      "class_id": "10-A",
      "subject_id": "math",
      "teacher_id": "t12",
      "hours_per_week": 3
    },
    {
      "class_id": "10-A",
      "subject_id": "hist_ukr",
      "teacher_id": "t17",
      "hours_per_week": 2
    },
    {
      "class_id": "10-A",
      "subject_id": "hist_world",
      "teacher_id": "t15",
      "hours_per_week": 1
    },
    {
      "class_id": "10-A",
      "subject_id": "civic",
      "teacher_id": "t16",
      "hours_per_week": 2
    },
    {
      "class_id": "10-A",
      "subject_id": "bio",
      "teacher_id": "t14",
      "hours_per_week": 2
    },
    {
      "class_id": "10-A",
      "subject_id": "geog",
      "teacher_id": "t15",
      "hours_per_week": 2
    },
    {
      "class_id": "10-A",
      "subject_id": "phys",
      "teacher_id": "t20",
      "hours_per_week": 3
    },
    {
      "class_id": "10-A",
      "subject_id": "chem",
      "teacher_id": "t13",
      "hours_per_week": 2
    },
    {
      "class_id": "10-A",
      "subject_id": "art",
      "teacher_id": "t22",
      "hours_per_week": 2
    },
    {
      "class_id": "10-A",
      "subject_id": "cs",
      "teacher_id": "t19",
      "hours_per_week": 2
    },
    {
      "class_id": "10-A",
      "subject_id": "tech",
      "teacher_id": "t21",
      "hours_per_week": 1
    },
    {
      "class_id": "10-A",
      "subject_id": "defense",
      "teacher_id": "t24",
      "hours_per_week": 2
    },
    {
      "class_id": "10-A",
      "subject_id": "pe",
      "teacher_id": "t26",
      "hours_per_week": 3
    },
    {
      "class_id": "10-B",
      "subject_id": "ukr_lang",
      "teacher_id": "t2",
      "hours_per_week": 2
    },
    {
      "class_id": "10-B",
      "subject_id": "ukr_lit",
      "teacher_id": "t3",
      "hours_per_week": 2
    },
    {
      "class_id": "10-B",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 1
    },
    {
      "class_id": "10-B",
      "subject_id": "eng",
      "teacher_id": "t5",
      "hours_per_week": 3
    },
    {
      "class_id": "10-B",
      "subject_id": "math",
      "teacher_id": "t12",
      "hours_per_week": 3
    },
    {
      "class_id": "10-B",
      "subject_id": "hist_ukr",
      "teacher_id": "t17",
      "hours_per_week": 2
    },
    {
      "class_id": "10-B",
      "subject_id": "hist_world",
      "teacher_id": "t15",
      "hours_per_week": 1
    },
    {
      "class_id": "10-B",
      "subject_id": "civic",
      "teacher_id": "t16",
      "hours_per_week": 2
    },
    {
      "class_id": "10-B",
      "subject_id": "bio",
      "teacher_id": "t23",
      "hours_per_week": 2
    },
    {
      "class_id": "10-B",
      "subject_id": "geog",
      "teacher_id": "t15",
      "hours_per_week": 2
    },
    {
      "class_id": "10-B",
      "subject_id": "phys",
      "teacher_id": "t28",
      "hours_per_week": 3
    },
    {
      "class_id": "10-B",
      "subject_id": "chem",
      "teacher_id": "t13",
      "hours_per_week": 2
    },
    {
      "class_id": "10-B",
      "subject_id": "art",
      "teacher_id": "t22",
      "hours_per_week": 2
    },
    {
      "class_id": "10-B",
      "subject_id": "cs",
      "teacher_id": "t18",
      "hours_per_week": 2
    },
    {
      "class_id": "10-B",
      "subject_id": "tech",
      "teacher_id": "t21",
      "hours_per_week": 1
    },
    {
      "class_id": "10-B",
      "subject_id": "defense",
      "teacher_id": "t24",
      "hours_per_week": 2
    },
    {
      "class_id": "10-B",
      "subject_id": "pe",
      "teacher_id": "t27",
      "hours_per_week": 3
    },
    {
      "class_id": "11-A",
      "subject_id": "ukr_lang",
      "teacher_id": "t1",
      "hours_per_week": 2
    },
    {
      "class_id": "11-A",
      "subject_id": "ukr_lit",
      "teacher_id": "t2",
      "hours_per_week": 2
    },
    {
      "class_id": "11-A",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 1
    },
    {
      "class_id": "11-A",
      "subject_id": "eng",
      "teacher_id": "t6",
      "hours_per_week": 3
    },
    {
      "class_id": "11-A",
      "subject_id": "math",
      "teacher_id": "t12",
      "hours_per_week": 3
    },
    {
      "class_id": "11-A",
      "subject_id": "hist_ukr",
      "teacher_id": "t17",
      "hours_per_week": 2
    },
    {
      "class_id": "11-A",
      "subject_id": "hist_world",
      "teacher_id": "t16",
      "hours_per_week": 1
    },
    {
      "class_id": "11-A",
      "subject_id": "bio",
      "teacher_id": "t14",
      "hours_per_week": 2
    },
    {
      "class_id": "11-A",
      "subject_id": "geog",
      "teacher_id": "t15",
      "hours_per_week": 2
    },
    {
      "class_id": "11-A",
      "subject_id": "phys",
      "teacher_id": "t11",
      "hours_per_week": 3
    },
    {
      "class_id": "11-A",
      "subject_id": "chem",
      "teacher_id": "t13",
      "hours_per_week": 2
    },
    {
      "class_id": "11-A",
      "subject_id": "art",
      "teacher_id": "t21",
      "hours_per_week": 2
    },
    {
      "class_id": "11-A",
      "subject_id": "cs",
      "teacher_id": "t19",
      "hours_per_week": 2
    },
    {
      "class_id": "11-A",
      "subject_id": "tech",
      "teacher_id": "t20",
      "hours_per_week": 1
    },
    {
      "class_id": "11-A",
      "subject_id": "defense",
      "teacher_id": "t24",
      "hours_per_week": 2
    },
    {
      "class_id": "11-A",
      "subject_id": "pe",
      "teacher_id": "t25",
      "hours_per_week": 3
    },
    {
      "class_id": "11-B",
      "subject_id": "ukr_lang",
      "teacher_id": "t3",
      "hours_per_week": 2
    },
    {
      "class_id": "11-B",
      "subject_id": "ukr_lit",
      "teacher_id": "t1",
      "hours_per_week": 2
    },
    {
      "class_id": "11-B",
      "subject_id": "for_lit",
      "teacher_id": "t4",
      "hours_per_week": 1
    },
    {
      "class_id": "11-B",
      "subject_id": "eng",
      "teacher_id": "t7",
      "hours_per_week": 3
    },
    {
      "class_id": "11-B",
      "subject_id": "math",
      "teacher_id": "t12",
      "hours_per_week": 3
    },
    {
      "class_id": "11-B",
      "subject_id": "hist_ukr",
      "teacher_id": "t17",
      "hours_per_week": 2
    },
    {
      "class_id": "11-B",
      "subject_id": "hist_world",
      "teacher_id": "t16",
      "hours_per_week": 1
    },
    {
      "class_id": "11-B",
      "subject_id": "bio",
      "teacher_id": "t23",
      "hours_per_week": 2
    },
    {
      "class_id": "11-B",
      "subject_id": "geog",
      "teacher_id": "t15",
      "hours_per_week": 2
    },
    {
      "class_id": "11-B",
      "subject_id": "phys",
      "teacher_id": "t28",
      "hours_per_week": 3
    },
    {
      "class_id": "11-B",
      "subject_id": "chem",
      "teacher_id": "t13",
      "hours_per_week": 2
    },
    {
      "class_id": "11-B",
      "subject_id": "art",
      "teacher_id": "t22",
      "hours_per_week": 2
    },
    {
      "class_id": "11-B",
      "subject_id": "cs",
      "teacher_id": "t18",
      "hours_per_week": 2
    },
    {
      "class_id": "11-B",
      "subject_id": "tech",
      "teacher_id": "t20",
      "hours_per_week": 1
    },
    {
      "class_id": "11-B",
      "subject_id": "defense",
      "teacher_id": "t27",
      "hours_per_week": 2
    },
    {
      "class_id": "11-B",
      "subject_id": "pe",
      "teacher_id": "t26",
      "hours_per_week": 3
    }
  ]
};