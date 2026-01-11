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
      "name": "5-А",
      "grade": 5
    },
    {
      "id": "5-B",
      "name": "5-Б",
      "grade": 5
    },
    {
      "id": "6-A",
      "name": "6-А",
      "grade": 6
    },
    {
      "id": "6-B",
      "name": "6-Б",
      "grade": 6
    },
    {
      "id": "7-A",
      "name": "7-А",
      "grade": 7
    },
    {
      "id": "7-B",
      "name": "7-Б",
      "grade": 7
    },
    {
      "id": "8-A",
      "name": "8-А",
      "grade": 8
    },
    {
      "id": "8-B",
      "name": "8-Б",
      "grade": 8
    },
    {
      "id": "9-A",
      "name": "9-А",
      "grade": 9
    },
    {
      "id": "9-B",
      "name": "9-Б",
      "grade": 9
    },
    {
      "id": "10-A",
      "name": "10-А",
      "grade": 10
    },
    {
      "id": "10-B",
      "name": "10-Б",
      "grade": 10
    },
    {
      "id": "11-A",
      "name": "11-А",
      "grade": 11
    },
    {
      "id": "11-B",
      "name": "11-Б",
      "grade": 11
    }
  ],
  "subjects": [
    {
      "id": "ukr_lang",
      "name": "Українська мова"
    },
    {
      "id": "ukr_lit",
      "name": "Українська література"
    },
    {
      "id": "for_lit",
      "name": "Зарубіжна література"
    },
    {
      "id": "eng",
      "name": "Іноземна мова"
    },
    {
      "id": "math",
      "name": "Математика"
    },
    {
      "id": "alg",
      "name": "Алгебра"
    },
    {
      "id": "geom",
      "name": "Геометрія"
    },
    {
      "id": "bio",
      "name": "Біологія"
    },
    {
      "id": "chem",
      "name": "Хімія"
    },
    {
      "id": "phys",
      "name": "Фізика"
    },
    {
      "id": "geog",
      "name": "Географія"
    },
    {
      "id": "hist_ukr",
      "name": "Історія України"
    },
    {
      "id": "hist_world",
      "name": "Всесвітня історія"
    },
    {
      "id": "civic",
      "name": "Громадянська освіта"
    },
    {
      "id": "art",
      "name": "Мистецтво"
    },
    {
      "id": "tech",
      "name": "Технології"
    },
    {
      "id": "cs",
      "name": "Інформатика"
    },
    {
      "id": "health",
      "name": "Основи здоров'я"
    },
    {
      "id": "pe",
      "name": "Фізична культура"
    },
    {
      "id": "defense",
      "name": "Захист України"
    },
    {
      "id": "astro",
      "name": "Астрономія"
    },
    {
      "id": "nat_sci",
      "name": "Природознавство"
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