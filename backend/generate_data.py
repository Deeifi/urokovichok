import json
import random

# --- Constants & Configuration ---
CLASSES = [
    {'id': '5-A', 'name': '5-А', 'grade': 5}, {'id': '5-B', 'name': '5-Б', 'grade': 5},
    {'id': '6-A', 'name': '6-А', 'grade': 6}, {'id': '6-B', 'name': '6-Б', 'grade': 6},
    {'id': '7-A', 'name': '7-А', 'grade': 7}, {'id': '7-B', 'name': '7-Б', 'grade': 7},
    {'id': '8-A', 'name': '8-А', 'grade': 8}, {'id': '8-B', 'name': '8-Б', 'grade': 8},
    {'id': '9-A', 'name': '9-А', 'grade': 9}, {'id': '9-B', 'name': '9-Б', 'grade': 9},
    {'id': '10-A', 'name': '10-А', 'grade': 10}, {'id': '10-B', 'name': '10-Б', 'grade': 10},
    {'id': '11-A', 'name': '11-А', 'grade': 11}, {'id': '11-B', 'name': '11-Б', 'grade': 11},
]

SUBJECTS = [
    {'id': 'ukr_lang', 'name': 'Українська мова'},
    {'id': 'ukr_lit', 'name': 'Українська література'},
    {'id': 'for_lit', 'name': 'Зарубіжна література'},
    {'id': 'eng', 'name': 'Іноземна мова'},
    {'id': 'math', 'name': 'Математика'}, # 5-6 + 10-11 std
    {'id': 'alg', 'name': 'Алгебра'}, # 7-9
    {'id': 'geom', 'name': 'Геометрія'}, # 7-9
    {'id': 'bio', 'name': 'Біологія'},
    {'id': 'chem', 'name': 'Хімія'},
    {'id': 'phys', 'name': 'Фізика'},
    {'id': 'geog', 'name': 'Географія'},
    {'id': 'hist_ukr', 'name': 'Історія України'},
    {'id': 'hist_world', 'name': 'Всесвітня історія'},
    {'id': 'civic', 'name': 'Громадянська освіта'}, # In 9th it's jurisprudence, let's merge
    {'id': 'art', 'name': 'Мистецтво'},
    {'id': 'tech', 'name': 'Технології'},
    {'id': 'cs', 'name': 'Інформатика'},
    {'id': 'health', 'name': 'Основи здоров\'я'},
    {'id': 'pe', 'name': 'Фізична культура'},
    {'id': 'defense', 'name': 'Захист України'},
    {'id': 'astro', 'name': 'Астрономія'}, # Usually with Physics
    {'id': 'nat_sci', 'name': 'Природознавство'}, # 5-6 Bio/Geo/Phys mix often called this or separate. Table says "Bio, Chem, Phys, Geog separate" for 7-9. 5-6 says "separate Bio..."
]

# Table Data (Hours per week)
CURRICULUM = {
    5: {
        'ukr_lang': 4, 'ukr_lit': 2, 'for_lit': 1, 'eng': 4, 'math': 5,
        'nat_sci': 2, 'hist_ukr': 1, 'art': 2, 'tech': 2, 'cs': 2, 'health': 1, 'pe': 3
    },
    6: {
        'ukr_lang': 4, 'ukr_lit': 2, 'for_lit': 1, 'eng': 4, 'math': 5,
        'nat_sci': 2, 'hist_ukr': 2, 'art': 2, 'tech': 2, 'cs': 2, 'health': 1, 'pe': 3
    },
    7: {
        'ukr_lang': 3, 'ukr_lit': 2, 'for_lit': 1, 'eng': 3, 'alg': 3, 'geom': 3,
        'bio': 2, 'chem': 1, 'phys': 1, 'geog': 2, 'hist_ukr': 2, 'hist_world': 1,
        'art': 1, 'tech': 2, 'cs': 2, 'health': 1, 'pe': 3
    },
    8: {
        'ukr_lang': 3, 'ukr_lit': 2, 'for_lit': 1, 'eng': 3, 'alg': 3, 'geom': 3,
        'bio': 2, 'chem': 1, 'phys': 2, 'geog': 2, 'hist_ukr': 2, 'hist_world': 1, 'civic': 1,
        'art': 1, 'tech': 2, 'cs': 2, 'health': 1, 'pe': 3
    },
    9: {
        'ukr_lang': 3, 'ukr_lit': 2, 'for_lit': 2, 'eng': 3, 'alg': 3, 'geom': 3,
        'bio': 2, 'chem': 2, 'phys': 3, 'geog': 2, 'hist_ukr': 2, 'hist_world': 1, 'civic': 1,
        'art': 1, 'tech': 2, 'cs': 2, 'health': 1, 'pe': 3
    },
    10: {
        'ukr_lang': 2, 'ukr_lit': 2, 'for_lit': 1, 'eng': 3, 'math': 3,
        'hist_ukr': 2, 'hist_world': 1, 'civic': 2, 'bio': 2, 'geog': 2, 'phys': 3,
        'chem': 2, 'art': 2, 'cs': 2, 'tech': 1, 'defense': 2, 'pe': 3
    },
    11: {
        'ukr_lang': 2, 'ukr_lit': 2, 'for_lit': 1, 'eng': 3, 'math': 3,
        'hist_ukr': 2, 'hist_world': 1, 'bio': 2, 'geog': 2, 'phys': 3,
        'chem': 2, 'art': 2, 'cs': 2, 'tech': 1, 'defense': 2, 'pe': 3
    }
}

# 28 Teachers with Specializations
TEACHERS = [
    {'id': 't1', 'name': 'Шевченко Т.Г.', 'subjects': ['ukr_lang', 'ukr_lit']},
    {'id': 't2', 'name': 'Франко І.Я.', 'subjects': ['ukr_lang', 'ukr_lit']},
    {'id': 't3', 'name': 'Леся Українка', 'subjects': ['ukr_lang', 'ukr_lit', 'for_lit']},
    {'id': 't4', 'name': 'Костенко Л.В.', 'subjects': ['for_lit', 'art']},
    {'id': 't5', 'name': 'Шекспір В.', 'subjects': ['eng']},
    {'id': 't6', 'name': 'Байрон Д.', 'subjects': ['eng']},
    {'id': 't7', 'name': 'Твен М.', 'subjects': ['eng']},
    {'id': 't8', 'name': 'Архімед С.', 'subjects': ['math', 'alg', 'geom']},
    {'id': 't9', 'name': 'Піфагор С.', 'subjects': ['math', 'alg', 'geom']},
    {'id': 't10', 'name': 'Евклід О.', 'subjects': ['math', 'alg', 'geom']},
    {'id': 't11', 'name': 'Ейнштейн А.', 'subjects': ['phys', 'astro', 'nat_sci']},
    {'id': 't12', 'name': 'Ньютон І.', 'subjects': ['phys', 'math']},
    {'id': 't13', 'name': 'Менделєєв Д.', 'subjects': ['chem', 'bio']},
    {'id': 't14', 'name': 'Дарвін Ч.', 'subjects': ['bio', 'nat_sci', 'health']},
    {'id': 't15', 'name': 'Колумб Х.', 'subjects': ['geog', 'hist_world']},
    {'id': 't16', 'name': 'Грушевський М.', 'subjects': ['hist_ukr', 'hist_world', 'civic']},
    {'id': 't17', 'name': 'Мазепа І.', 'subjects': ['hist_ukr', 'defense']},
    {'id': 't18', 'name': 'Гейтс Б.', 'subjects': ['cs', 'tech']},
    {'id': 't19', 'name': 'Джобс С.', 'subjects': ['cs', 'tech']},
    {'id': 't20', 'name': 'Маск І.', 'subjects': ['tech', 'phys']},
    {'id': 't21', 'name': 'Да Вінчі Л.', 'subjects': ['art', 'tech']},
    {'id': 't22', 'name': 'Моцарт В.', 'subjects': ['art']},
    {'id': 't23', 'name': 'Павлов І.', 'subjects': ['bio', 'health']},
    {'id': 't24', 'name': 'Амосов М.', 'subjects': ['health', 'defense']},
    {'id': 't25', 'name': 'Усик О.', 'subjects': ['pe']},
    {'id': 't26', 'name': 'Шевченко А.', 'subjects': ['pe']},
    {'id': 't27', 'name': 'Кличко В.', 'subjects': ['pe', 'defense']},
    {'id': 't28', 'name': 'Сікорський І.', 'subjects': ['tech', 'phys']}
]

# --- Logic ---

def generate_data():
    plan = []
    teacher_load = {t['id']: 0 for t in TEACHERS}

    for cls in CLASSES:
        grad_curr = CURRICULUM.get(cls['grade'], {})
        
        for subj_id, hours in grad_curr.items():
            # Find eligible teachers
            eligible = [t for t in TEACHERS if subj_id in t['subjects']]
            if not eligible:
                # print(f"WARNING: No teacher for {subj_id}")
                continue
            
            # Sort by load to balance
            eligible.sort(key=lambda t: teacher_load[t['id']])
            
            # Pick best candidate (simplest greedy: least loaded)
            teacher = eligible[0]
            # Ensure integer hours (rounding up to be safe)
            import math
            int_hours = math.ceil(hours)
            
            teacher_load[teacher['id']] += int_hours
            
            plan.append({
                'class_id': cls['id'],
                'subject_id': subj_id,
                'teacher_id': teacher['id'],
                'hours_per_week': int_hours
            })

    output = {
        'teachers': TEACHERS,
        'classes': CLASSES,
        'subjects': SUBJECTS,
        'plan': plan
    }
    
    # Print load stats
    # for t_id, load in teacher_load.items():
    #     print(f"{t_id}: {load}h")

    return output

if __name__ == "__main__":
    import os
    data = generate_data()
    
    # Calculate path relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, '../frontend/src/initialData.ts')
    
    content = "import type { ScheduleRequest } from './types';\n\n"
    content += "export const INITIAL_DATA: ScheduleRequest = " + json.dumps(data, ensure_ascii=False, indent=2) + ";"
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Successfully generated data to {output_path}")
