/*!
 * jQuery QueryBuilder 2.6.2
 * Locale: Arabic (ar)
 * Author: Mohamed YOUNES, https://github.com/MedYOUNES
 * Licensed under MIT (https://opensource.org/licenses/MIT)
 */

(function(root, factory) {
    if (typeof define == 'function' && define.amd) {
        define(['jquery', 'query-builder'], factory);
    }
    else {
        factory(root.jQuery);
    }
}(this, function($) {
"use strict";

var QueryBuilder = $.fn.queryBuilder;

QueryBuilder.regional['ar'] = {
  "__locale": "Arabic (ar)",
  "__author": "Mohamed YOUNES, https://github.com/MedYOUNES",
  "add_rule": "+ شرط",
  "add_group": "+ مجموعة",
  "delete_rule": "حذف",
  "delete_group": "حذف",
  "conditions": {
    "AND": "و",
    "OR": "أو"
  },
  "operators": {
    "equal": "يساوي",
    "not_equal": "لا يساوي",
    "in": "في",
    "not_in": "ليس في",
    "less": "أصغر من",
    "less_or_equal": "أصغر أو يساوي",
    "greater": "أكبر من",
    "greater_or_equal": "أكبر أو يساوي",
    "between": "محصور بين",
    "not_between": "غير محصور بين",
    "begins_with": "يبدأ بـ",
    "not_begins_with": "لا يبدأ بـ",
    "contains": "يحتوي على",
    "not_contains": "لا يحتوي على",
    "similar": "يشبه",
    "not_similar": "لا يشبه",
    "ends_with": "ينتهي بـ",
    "not_ends_with": "لا ينتهي بـ",
    "is_empty": "فارغ",
    "is_not_empty": "غير فارغ",
    "is_null": "يحمل قيمة",
    "is_not_null": "لا يحمل قيمة",
    "is_defined": "موجود",
    "is_not_defined": "غير موجود"
  },
  "errors": {
    "no_filter": "لم تحدد أي مرشح",
    "empty_group": "الزمرة فارغة",
    "radio_empty": "لم تحدد أي قيمة",
    "checkbox_empty": "لم تحدد أي قيمة",
    "select_empty": "لم تحدد أي قيمة",
    "string_empty": "النص فارغ",
    "string_exceed_min_length": "النص دون الأدنى المسموح به",
    "string_exceed_max_length": "النص فوق الأقصى المسموح به",
    "string_invalid_format": "تركيبة غير صحيحة",
    "number_nan": "ليس عددا",
    "number_not_integer": "ليس عددا صحيحا",
    "number_not_double": "ليس عددا كسريا",
    "number_exceed_min": "العدد أصغر من الأدنى المسموح به",
    "number_exceed_max": "العدد أكبر من الأقصى المسموح به",
    "number_wrong_step": "أخطأت في حساب مضاعفات العدد",
    "datetime_empty": "لم تحدد التاريخ",
    "datetime_invalid": "صيغة التاريخ غير صحيحة",
    "datetime_exceed_min": "التاريخ دون الأدنى المسموح به",
    "datetime_exceed_max": "التاريخ أكبر من الأقصى المسموح به",
    "boolean_not_valid": "ليست قيمة منطقية ثنائية",
    "operator_not_multiple": "العامل ليس متعدد القيَم"
  },
  "invert": "قَلْبُ"
};

QueryBuilder.defaults({ lang_code: 'ar' });
}));