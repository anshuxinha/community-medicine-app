"""Build src/data/foodData.json from IFCT 2017 index.csv plus a few documented recipes."""
import csv
import json
from pathlib import Path

CSV_PATH = Path("scripts/_ifct_index.csv")
OUT_PATH = Path("src/data/foodData.json")


def load_ifct():
    with CSV_PATH.open(encoding="utf-8", newline="") as f:
        rows = []
        for r in csv.DictReader(f):
            rows.append({(k.split("; ")[-1] if "; " in k else k): v for k, v in r.items()})
    return {r["code"]: r for r in rows}


def kcal(row):
    return round(float(row["enerc"]) / 4.184)


def g(row, key):
    return round(float(row[key]), 2)


def mg(row, key):
    return round(float(row[key]) * 1000, 2)


def ug(row, key):
    return round(float(row[key]) * 1_000_000, 1)


def from_ifct(code, by, **extra):
    r = by[code]
    category = extra.pop("category")
    item = {
        "id": extra.pop("id"),
        "name": extra.pop("name"),
        "category": category,
        "ifctCode": code,
        "source": extra.pop("source", "IFCT 2017"),
        "calories": extra.pop("calories", kcal(r) if float(r["enerc"]) else 900),
        "protein": extra.pop("protein", g(r, "protcnt")),
        "fat": extra.pop("fat", g(r, "fatce")),
        "carbs": extra.pop("carbs", g(r, "choavldf")),
        "calcium": extra.pop("calcium", mg(r, "ca")),
        "iron": extra.pop("iron", mg(r, "fe")),
        "vitC": extra.pop("vitC", mg(r, "vitc")),
        "folate": extra.pop("folate", ug(r, "folsum")),
        "visibleFat": extra.pop("visibleFat", category == "Fats & Oils"),
        "portions": extra.pop("portions"),
    }
    item.update(extra)
    return item


def mix(parts, by):
    """Weighted mix of IFCT foods. parts: [(code, grams_per_100g_product), ...]"""
    tot = {k: 0.0 for k in ["calories", "protein", "fat", "carbs", "calcium", "iron", "vitC", "folate"]}
    for code, grams in parts:
        r = by[code]
        f = grams / 100.0
        tot["calories"] += (kcal(r) if float(r["enerc"]) else 900) * f
        tot["protein"] += g(r, "protcnt") * f
        tot["fat"] += g(r, "fatce") * f
        tot["carbs"] += g(r, "choavldf") * f
        tot["calcium"] += mg(r, "ca") * f
        tot["iron"] += mg(r, "fe") * f
        tot["vitC"] += mg(r, "vitc") * f
        tot["folate"] += ug(r, "folsum") * f
    return {k: round(v, 2) if k != "calories" else round(v) for k, v in tot.items()}


def main():
    by = load_ifct()
    foods = []

    def add(*a, **k):
        foods.append(from_ifct(*a, **k))

    raw_g = {"id": "g", "label": "Grams, raw (g)", "grams": 1, "rawEquivalent": True}
    as_g = {"id": "g", "label": "Grams (g)", "grams": 1, "rawEquivalent": False}

    add(
        "A019",
        by,
        id="wheat_atta",
        name="Wheat flour, atta (whole wheat)",
        category="Cereals & Millets",
        portions=[
            {"id": "roti_med", "label": "Medium phulka / roti (~25 g atta)", "grams": 25, "rawEquivalent": True},
            {"id": "roti_lg", "label": "Large roti / paratha (~40 g atta)", "grams": 40, "rawEquivalent": True},
            {"id": "puri", "label": "Puri (~20 g atta, flour only)", "grams": 20, "rawEquivalent": True},
            {"id": "katori_flour", "label": "Flour, 1 katori (~100 g)", "grams": 100, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "A015",
        by,
        id="rice_raw",
        name="Rice, raw, milled (white)",
        category="Cereals & Millets",
        portions=[
            {"id": "katori_cooked", "label": "Cooked rice, 1 katori (~50 g raw)", "grams": 50, "rawEquivalent": True},
            {"id": "half_katori", "label": "Cooked rice, 1/2 katori (~25 g raw)", "grams": 25, "rawEquivalent": True},
            {"id": "plate_cooked", "label": "Cooked rice, 1 plate (~100 g raw)", "grams": 100, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "A014",
        by,
        id="rice_parboiled",
        name="Rice, parboiled, milled",
        category="Cereals & Millets",
        portions=[
            {"id": "katori_cooked", "label": "Cooked rice, 1 katori (~50 g raw)", "grams": 50, "rawEquivalent": True},
            {"id": "plate_cooked", "label": "Cooked rice, 1 plate (~100 g raw)", "grams": 100, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "A011",
        by,
        id="poha",
        name="Rice flakes (poha)",
        category="Cereals & Millets",
        portions=[
            {"id": "katori_dry", "label": "Raw poha, 1 katori (~40 g)", "grams": 40, "rawEquivalent": True},
            {"id": "plate_cooked", "label": "Cooked poha, 1 plate (~50 g raw)", "grams": 50, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "A012",
        by,
        id="murmura",
        name="Rice, puffed (murmura)",
        category="Cereals & Millets",
        portions=[
            {"id": "katori", "label": "1 katori (~20 g)", "grams": 20, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "A010",
        by,
        id="ragi",
        name="Ragi / finger millet",
        category="Cereals & Millets",
        portions=[
            {"id": "roti_ragi", "label": "Ragi roti / mudde (~35 g flour)", "grams": 35, "rawEquivalent": True},
            {"id": "katori_flour", "label": "Flour, 1 katori (~100 g)", "grams": 100, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "A003",
        by,
        id="bajra",
        name="Bajra / pearl millet",
        category="Cereals & Millets",
        portions=[
            {"id": "roti_bajra", "label": "Bajra roti (~40 g flour)", "grams": 40, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "A005",
        by,
        id="jowar",
        name="Jowar / sorghum",
        category="Cereals & Millets",
        portions=[
            {"id": "roti_jowar", "label": "Jowar bhakri / roti (~40 g flour)", "grams": 40, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "A022",
        by,
        id="suji",
        name="Wheat, semolina (suji / rava)",
        category="Cereals & Millets",
        portions=[
            {"id": "katori_cooked", "label": "Upma / halwa, 1 katori (~40 g suji)", "grams": 40, "rawEquivalent": True},
            {"id": "tbsp", "label": "1 tablespoon (~15 g)", "grams": 15, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "A018",
        by,
        id="maida",
        name="Wheat flour, refined (maida)",
        category="Cereals & Millets",
        portions=[
            {"id": "naan", "label": "Naan / bhatura flour (~60 g maida)", "grams": 60, "rawEquivalent": True},
            raw_g,
        ],
    )

    dal_portions = [
        {"id": "katori_med", "label": "Cooked dal, 1 medium katori (~25 g raw)", "grams": 25, "rawEquivalent": True},
        {"id": "katori_thin", "label": "Cooked dal, thin, 1 katori (~15 g raw)", "grams": 15, "rawEquivalent": True},
        {"id": "katori_thick", "label": "Cooked dal, thick, 1 katori (~35 g raw)", "grams": 35, "rawEquivalent": True},
        raw_g,
    ]
    add("B021", by, id="dal_toor", name="Red gram dal (toor / arhar)", category="Pulses & Legumes", portions=dal_portions)
    add("B010", by, id="dal_moong", name="Green gram dal (moong, split)", category="Pulses & Legumes", portions=dal_portions)
    add(
        "B011",
        by,
        id="moong_whole",
        name="Green gram, whole (moong)",
        category="Pulses & Legumes",
        portions=[
            {"id": "katori_cooked", "label": "Cooked whole moong, 1 katori (~30 g raw)", "grams": 30, "rawEquivalent": True},
            raw_g,
        ],
    )
    add("B001", by, id="dal_chana", name="Bengal gram dal (chana dal)", category="Pulses & Legumes", portions=dal_portions)
    add(
        "B002",
        by,
        id="kala_chana",
        name="Bengal gram, whole (kala chana / sattu base)",
        category="Pulses & Legumes",
        portions=[
            {"id": "katori_cooked", "label": "Cooked chana, 1 katori (~35 g raw)", "grams": 35, "rawEquivalent": True},
            {"id": "sattu_30", "label": "Sattu / roasted flour, 2 tbsp (~30 g)", "grams": 30, "rawEquivalent": True},
            raw_g,
        ],
    )
    add("B013", by, id="dal_masoor", name="Lentil dal (masoor)", category="Pulses & Legumes", portions=dal_portions)
    add("B003", by, id="dal_urad", name="Black gram dal (urad)", category="Pulses & Legumes", portions=dal_portions)
    add(
        "B020",
        by,
        id="rajma",
        name="Rajmah, red (kidney beans)",
        category="Pulses & Legumes",
        portions=[
            {"id": "katori_cooked", "label": "Cooked rajma, 1 katori (~35 g raw)", "grams": 35, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "B025",
        by,
        id="soya_bean",
        name="Soya bean, white",
        category="Pulses & Legumes",
        portions=[
            {"id": "katori_cooked", "label": "Cooked soya, 1 katori (~30 g raw)", "grams": 30, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "B001",
        by,
        id="besan",
        name="Bengal gram dal flour (besan)",
        category="Pulses & Legumes",
        portions=[
            {"id": "tbsp", "label": "1 tablespoon (~10 g)", "grams": 10, "rawEquivalent": True},
            raw_g,
        ],
    )

    glv_portions = [
        {"id": "katori_cooked", "label": "Cooked sabzi, 1 katori (~100 g raw)", "grams": 100, "rawEquivalent": True},
        {"id": "half_katori", "label": "Cooked sabzi, 1/2 katori (~50 g raw)", "grams": 50, "rawEquivalent": True},
        raw_g,
    ]
    add("C033", by, id="spinach", name="Spinach / palak (raw IFCT values)", category="Green Leafy Vegetables", portions=glv_portions)
    add("C020", by, id="methi_leaves", name="Fenugreek leaves / methi", category="Green Leafy Vegetables", portions=glv_portions)
    add("C019", by, id="drumstick_leaves", name="Drumstick leaves / moringa", category="Green Leafy Vegetables", portions=glv_portions)
    add("C026", by, id="mustard_leaves", name="Mustard leaves / sarson", category="Green Leafy Vegetables", portions=glv_portions)
    add("C002", by, id="amaranth_leaves", name="Amaranth leaves, green / chaulai", category="Green Leafy Vegetables", portions=glv_portions)

    add(
        "F006",
        by,
        id="potato",
        name="Potato, brown skin",
        category="Roots & Tubers",
        portions=[
            {"id": "katori_sabzi", "label": "Sabzi, 1 katori (~60 g)", "grams": 60, "rawEquivalent": True},
            {"id": "med", "label": "1 medium potato (~80 g)", "grams": 80, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "G017",
        by,
        id="onion",
        name="Onion, big",
        category="Other Vegetables",
        portions=[
            {"id": "med_onion", "label": "1 medium onion (~60 g)", "grams": 60, "rawEquivalent": True},
            {"id": "salad", "label": "Salad / cooking (~30 g)", "grams": 30, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "F002",
        by,
        id="carrot",
        name="Carrot, orange",
        category="Roots & Tubers",
        portions=[
            {"id": "med_carrot", "label": "1 medium carrot (~70 g)", "grams": 70, "rawEquivalent": True},
            {"id": "katori_sabzi", "label": "Sabzi / salad, 1 katori (~80 g)", "grams": 80, "rawEquivalent": True},
            raw_g,
        ],
    )
    add(
        "F013",
        by,
        id="sweet_potato",
        name="Sweet potato, brown skin",
        category="Roots & Tubers",
        portions=[
            {"id": "med", "label": "1 medium (~100 g)", "grams": 100, "rawEquivalent": True},
            raw_g,
        ],
    )

    veg_katori = [
        {"id": "katori", "label": "1 katori (~80 g)", "grams": 80, "rawEquivalent": True},
        raw_g,
    ]
    add("D075", by, id="tomato", name="Tomato, ripe, hybrid", category="Other Vegetables", portions=[
        {"id": "med", "label": "1 medium tomato (~80 g)", "grams": 80, "rawEquivalent": True},
        {"id": "katori", "label": "1 katori (~80 g)", "grams": 80, "rawEquivalent": True},
        raw_g,
    ])
    add("D036", by, id="cauliflower", name="Cauliflower", category="Other Vegetables", portions=veg_katori)
    add("C015", by, id="cabbage", name="Cabbage, green", category="Other Vegetables", portions=veg_katori)
    add("D056", by, id="bhindi", name="Ladies finger / bhindi / okra", category="Other Vegetables", portions=veg_katori)
    add("D007", by, id="lauki", name="Bottle gourd / lauki", category="Other Vegetables", portions=veg_katori)
    add("D061", by, id="green_peas", name="Peas, fresh (matar)", category="Other Vegetables", portions=veg_katori)
    add("D031", by, id="brinjal", name="Brinjal / baingan (all varieties)", category="Other Vegetables", portions=veg_katori)
    add("D043", by, id="cucumber", name="Cucumber, green", category="Other Vegetables", portions=[
        {"id": "salad", "label": "Salad, 1 katori (~80 g)", "grams": 80, "rawEquivalent": True},
        raw_g,
    ])

    add("E012", by, id="banana", name="Banana, ripe, robusta", category="Fruits", portions=[
        {"id": "one", "label": "1 medium banana (~100 g pulp)", "grams": 100, "rawEquivalent": True},
        raw_g,
    ])
    add("E028", by, id="guava", name="Guava, white flesh", category="Fruits", portions=[
        {"id": "one", "label": "1 medium guava (~80 g)", "grams": 80, "rawEquivalent": True},
        raw_g,
    ])
    add("E021", by, id="amla", name="Gooseberry / amla (IFCT 'Goosberry')", category="Fruits", portions=[
        {"id": "amla_pc", "label": "1 amla (~20 g)", "grams": 20, "rawEquivalent": True},
        {"id": "amla_juice", "label": "Juice, 1 tbsp (~15 g)", "grams": 15, "rawEquivalent": True},
        raw_g,
    ])
    add("E047", by, id="orange", name="Orange, pulp", category="Fruits", portions=[
        {"id": "one", "label": "1 medium orange pulp (~100 g)", "grams": 100, "rawEquivalent": True},
        raw_g,
    ])
    add("E049", by, id="papaya", name="Papaya, ripe", category="Fruits", portions=[
        {"id": "katori", "label": "1 katori (~100 g)", "grams": 100, "rawEquivalent": True},
        raw_g,
    ])
    add("E041", by, id="mango", name="Mango, ripe, paheri", category="Fruits", portions=[
        {"id": "katori", "label": "1 katori pulp (~100 g)", "grams": 100, "rawEquivalent": True},
        raw_g,
    ])
    add("E001", by, id="apple", name="Apple, big", category="Fruits", portions=[
        {"id": "one", "label": "1 apple (~150 g)", "grams": 150, "rawEquivalent": True},
        raw_g,
    ])
    add("E033", by, id="lemon_juice", name="Lemon juice", category="Fruits", portions=[
        {"id": "tbsp", "label": "1 tablespoon (~15 ml)", "grams": 15, "rawEquivalent": False},
        as_g,
    ])

    milk_portions = [
        {"id": "glass", "label": "1 glass (200 ml)", "grams": 200, "rawEquivalent": False},
        {"id": "cup", "label": "1 tea cup (100 ml)", "grams": 100, "rawEquivalent": False},
        {"id": "half_glass", "label": "1/2 glass (100 ml)", "grams": 100, "rawEquivalent": False},
        as_g,
    ]
    add("L002", by, id="milk_cow", name="Milk, whole, cow", category="Milk & Dairy", portions=milk_portions)
    add("L001", by, id="milk_buffalo", name="Milk, whole, buffalo", category="Milk & Dairy", portions=milk_portions)
    add(
        "L002",
        by,
        id="curd_dahi",
        name="Curd / dahi (IFCT cow milk; macros nearly unchanged by fermentation)",
        category="Milk & Dairy",
        portions=[
            {"id": "katori", "label": "1 katori (~100 g)", "grams": 100, "rawEquivalent": False},
            {"id": "glass", "label": "1 glass buttermilk-style (~200 g)", "grams": 200, "rawEquivalent": False},
            as_g,
        ],
    )
    add("L003", by, id="paneer", name="Paneer", category="Milk & Dairy", portions=[
        {"id": "cube", "label": "2 cubes (~30 g)", "grams": 30, "rawEquivalent": False},
        {"id": "katori", "label": "1 katori cubes (~50 g)", "grams": 50, "rawEquivalent": False},
        as_g,
    ])

    oil_portions = [
        {"id": "tsp", "label": "1 teaspoon (5 g)", "grams": 5, "rawEquivalent": False},
        {"id": "tbsp", "label": "1 tablespoon (15 g)", "grams": 15, "rawEquivalent": False},
        {"id": "ladle", "label": "Small ladle in cooking (~20 g)", "grams": 20, "rawEquivalent": False},
        as_g,
    ]
    add(
        "T006",
        by,
        id="cooking_oil",
        name="Mustard oil (visible fat; 9 kcal/g Atwater)",
        category="Fats & Oils",
        calories=900,
        protein=0,
        fat=100,
        carbs=0,
        calcium=0,
        iron=0,
        vitC=0,
        folate=0,
        visibleFat=True,
        portions=oil_portions,
    )
    add(
        "T013",
        by,
        id="ghee",
        name="Ghee (visible fat; 9 kcal/g Atwater)",
        category="Fats & Oils",
        calories=900,
        protein=0,
        fat=100,
        carbs=0,
        calcium=0,
        iron=0,
        vitC=0,
        folate=0,
        visibleFat=True,
        portions=oil_portions,
    )

    add("M004", by, id="egg_whole", name="Egg, poultry, whole, boiled", category="Egg & Meat", portions=[
        {"id": "one", "label": "1 boiled egg (~50 g)", "grams": 50, "rawEquivalent": False},
        {"id": "two", "label": "2 boiled eggs (~100 g)", "grams": 100, "rawEquivalent": False},
        as_g,
    ])
    add("M002", by, id="egg_white", name="Egg, poultry, white, raw", category="Egg & Meat", portions=[
        {"id": "one", "label": "White of 1 egg (~30 g)", "grams": 30, "rawEquivalent": False},
        as_g,
    ])
    add("N003", by, id="chicken_lean", name="Chicken, breast, skinless", category="Egg & Meat", portions=[
        {"id": "piece", "label": "1 piece (~80 g)", "grams": 80, "rawEquivalent": False},
        as_g,
    ])
    add("S006", by, id="fish_rohu", name="Rohu (freshwater fish)", category="Egg & Meat", portions=[
        {"id": "piece", "label": "1 piece (~80 g)", "grams": 80, "rawEquivalent": False},
        as_g,
    ])
    add("O002", by, id="mutton", name="Goat chops", category="Egg & Meat", portions=[
        {"id": "piece", "label": "1 piece (~80 g)", "grams": 80, "rawEquivalent": False},
        as_g,
    ])

    add("H012", by, id="groundnuts", name="Ground nut", category="Nuts & Oilseeds", portions=[
        {"id": "handful", "label": "1 handful, roasted (~30 g)", "grams": 30, "rawEquivalent": True},
        {"id": "tbsp", "label": "1 tablespoon (~15 g)", "grams": 15, "rawEquivalent": True},
        raw_g,
    ])
    add("H010", by, id="sesame_seeds", name="Gingelly seeds, brown (til)", category="Nuts & Oilseeds", portions=[
        {"id": "tsp", "label": "1 teaspoon (~5 g)", "grams": 5, "rawEquivalent": True},
        {"id": "tbsp", "label": "1 tablespoon (~10 g)", "grams": 10, "rawEquivalent": True},
        raw_g,
    ])
    add("H001", by, id="almonds", name="Almond", category="Nuts & Oilseeds", portions=[
        {"id": "five_almonds", "label": "4-5 almonds (~6 g)", "grams": 6, "rawEquivalent": True},
        {"id": "ten_almonds", "label": "10 almonds (~12 g)", "grams": 12, "rawEquivalent": True},
        raw_g,
    ])

    foods.append({
        "id": "sugar",
        "name": "Sugar, sucrose (Atwater 4 kcal/g; not an IFCT key food)",
        "category": "Sugars & Sweets",
        "ifctCode": None,
        "source": "ICMR Atwater factor for carbohydrate",
        "calories": 400,
        "protein": 0,
        "fat": 0,
        "carbs": 100,
        "calcium": 0,
        "iron": 0,
        "vitC": 0,
        "folate": 0,
        "visibleFat": False,
        "portions": [
            {"id": "tsp", "label": "1 level teaspoon in tea (~5 g)", "grams": 5, "rawEquivalent": False},
            {"id": "tsp_heap", "label": "1 heaped teaspoon (~7.5 g)", "grams": 7.5, "rawEquivalent": False},
            {"id": "tbsp", "label": "1 tablespoon (~15 g)", "grams": 15, "rawEquivalent": False},
            as_g,
        ],
    })
    add("I001", by, id="jaggery", name="Jaggery, cane", category="Sugars & Sweets", portions=[
        {"id": "small_cube", "label": "1 small piece (~15 g)", "grams": 15, "rawEquivalent": False},
        {"id": "tsp", "label": "1 teaspoon grated (~5 g)", "grams": 5, "rawEquivalent": False},
        as_g,
    ])

    idli = mix([("A014", 32), ("B003", 8)], by)
    foods.append({
        "id": "snack_idli",
        "name": "Idli (steamed; 32 g parboiled rice + 8 g urad dal per 100 g)",
        "category": "Cooked Snacks",
        "ifctCode": "recipe:A014+B003",
        "source": "Derived from IFCT 2017 (parboiled milled rice + black gram dal)",
        "countsAsCerealGramsPer100": 32,
        "countsAsPulseGramsPer100": 8,
        **idli,
        "visibleFat": False,
        "portions": [
            {"id": "one_idli", "label": "1 medium idli (~50 g)", "grams": 50, "rawEquivalent": False},
            {"id": "two_idlis", "label": "2 idlis (~100 g)", "grams": 100, "rawEquivalent": False},
            {"id": "three_idlis", "label": "3 idlis (~150 g)", "grams": 150, "rawEquivalent": False},
            as_g,
        ],
    })
    dosa = mix([("A014", 35), ("B003", 10)], by)
    dosa["calories"] = round(dosa["calories"] + 45)
    dosa["fat"] = round(dosa["fat"] + 5, 2)
    foods.append({
        "id": "snack_dosa",
        "name": "Plain dosa (35 g parboiled rice + 10 g urad + 5 g oil per 100 g)",
        "category": "Cooked Snacks",
        "ifctCode": "recipe:A014+B003+T006",
        "source": "Derived from IFCT 2017 (parboiled rice + black gram dal + mustard oil)",
        "countsAsCerealGramsPer100": 35,
        "countsAsPulseGramsPer100": 10,
        "countsAsVisibleFatPer100": 5,
        **dosa,
        "visibleFat": False,
        "portions": [
            {"id": "one_dosa", "label": "1 medium dosa (~75 g)", "grams": 75, "rawEquivalent": False},
            as_g,
        ],
    })

    # Fix cabbage: C015 exists
    ids = [f["id"] for f in foods]
    if ids.count("cabbage") != 1:
        raise SystemExit("cabbage mapping failed")

    OUT_PATH.write_text(json.dumps(foods, indent=2) + "\n", encoding="utf-8")
    print("wrote", OUT_PATH, "n=", len(foods))
    print("ids", ids)


if __name__ == "__main__":
    main()
