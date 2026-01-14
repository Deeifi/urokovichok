from typing import List, Dict, Any

def has_gaps(mask: int, max_period: int) -> int:
    if mask == 0: return 0
    first = 0
    while not (mask & (1 << first)): first += 1
    last = max_period
    while last >= first and not (mask & (1 << last)): last -= 1
    if first >= last: return 0
    gaps = 0
    for i in range(first, last + 1):
        if not (mask & (1 << i)): gaps += 1
    return gaps

def can_move_lesson(lesson: Dict[str, Any], target_period: int, schedule: List[Dict[str, Any]]) -> bool:
    for other in schedule:
        if other == lesson: continue
        if (other["teacher_id"] == lesson["teacher_id"] and 
            other["day"] == lesson["day"] and 
            other["period"] == target_period):
            return False
        if (other["class_id"] == lesson["class_id"] and 
            other["day"] == lesson["day"] and 
            other["period"] == target_period):
            return False
    return True
