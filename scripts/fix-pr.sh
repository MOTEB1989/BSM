#!/bin/bash

# ======================================================
# سكريبت آلي لإصلاح الطلبات (Pull Requests) في المستودع
# الإصدار: 1.0
# الوصف: يقوم هذا السكريبت بسحب آخر التغييرات من الفرع الرئيسي،
#        حل التعارضات تلقائياً، تشغيل الاختبارات، وإصلاح الأخطاء الشائعة.
# ======================================================

set -euo pipefail

# إعدادات
MAIN_BRANCH="${MAIN_BRANCH:-main}"           # اسم الفرع الرئيسي (يمكن تغييره إلى master)
AUTO_RESOLVE_STRATEGY="${AUTO_RESOLVE_STRATEGY:-theirs}"  # استراتيجية حل التعارضات: ours أو theirs
MAX_RETRIES="${MAX_RETRIES:-3}"               # عدد محاولات إعادة المحاولة في حال فشل الدمج
RUN_TESTS="${RUN_TESTS:-true}"                # تشغيل الاختبارات بعد الدمج؟
FIX_LINT="${FIX_LINT:-true}"                  # محاولة إصلاح أخطاء التنسيق تلقائياً؟
PUSH_CHANGES="${PUSH_CHANGES:-true}"          # دفع التغييرات بعد النجاح؟

# ======================================================
# دوال مساعدة
# ======================================================

# دالة لعرض الأخطاء والخروج
function error_exit {
    echo "❌ خطأ: $1"
    exit 1
}

# دالة لعرض معلومات التنفيذ
function info {
    echo "🔹 $1"
}

# دالة للتحقق من وجود git repository
function check_git_repo {
    git rev-parse --git-dir > /dev/null 2>&1 || error_exit "هذا المجلد ليس مستودع Git."
}

# دالة للتحقق من نظافة مساحة العمل
function check_clean_working_tree {
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        error_exit "مساحة العمل غير نظيفة. يرجى commit أو stash التغييرات قبل تشغيل هذا السكربت."
    fi
    if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
        error_exit "توجد ملفات غير محفوظة. يرجى commit أو stash التغييرات قبل تشغيل هذا السكربت."
    fi
}

# دالة لتحديد الفرع الحالي
function get_current_branch {
    git branch --show-current 2>/dev/null || error_exit "لا يمكن تحديد الفرع الحالي."
}

# دالة للجلب من remote
function fetch_updates {
    info "جلب آخر التحديثات من remote..."
    git fetch origin || error_exit "فشل جلب التحديثات من origin."
}

# دالة لمحاولة الدمج مع استراتيجية حل تلقائي
function merge_with_strategy {
    local branch=$1
    local strategy=$2
    info "محاولة دمج الفرع $branch مع استراتيجية $strategy..."

    if [ "$strategy" == "ours" ]; then
        git merge -X ours "origin/$branch" --no-edit 2>/dev/null
    elif [ "$strategy" == "theirs" ]; then
        git merge -X theirs "origin/$branch" --no-edit 2>/dev/null
    else
        git merge "origin/$branch" --no-edit 2>/dev/null
    fi
}

# دالة لحل التعارضات باستخدام mergetool (إذا كان متاحاً)
function resolve_conflicts_with_mergetool {
    info "محاولة حل التعارضات باستخدام mergetool..."
    
    # أولاً: محاولة استخدام أداة الدمج الافتراضية التي تم إعدادها في git
    if git mergetool --no-prompt 2>/dev/null; then
        return 0
    fi

    # ثانياً: محاولة استخدام vimdiff كخيار احتياطي إذا كان متاحاً
    if command -v vimdiff >/dev/null 2>&1; then
        info "استخدام vimdiff كأداة دمج احتياطية..."
        if git mergetool --tool=vimdiff --no-prompt 2>/dev/null; then
            return 0
        fi
    fi

    info "لم يتمكن mergetool من حل جميع التعارضات، سيتم استخدام استراتيجية $AUTO_RESOLVE_STRATEGY."
    return 1
}

# دالة لإصلاح مشاكل التنسيق (lint)
function fix_lint_issues {
    info "تشغيل إصلاح التنسيق التلقائي..."
    if [ -f "package.json" ]; then
        if grep -q '"lint"' package.json; then
            npm run lint -- --fix 2>/dev/null || npm run lint 2>/dev/null || info "فشل إصلاح lint، قد تحتاج إلى مراجعة يدوية."
        elif grep -q '"eslint"' package.json; then
            npx eslint . --fix 2>/dev/null || info "فشل تشغيل eslint."
        else
            info "لا يوجد سكربت lint مخصص."
        fi
    elif [ -f "requirements.txt" ] || [ -f "setup.py" ]; then
        if command -v black &> /dev/null; then
            black . 2>/dev/null || info "فشل تشغيل black."
        elif command -v autopep8 &> /dev/null; then
            autopep8 --in-place --recursive . 2>/dev/null || info "فشل تشغيل autopep8."
        else
            info "لم يتم العثور على أداة تنسيق Python مثبتة (black/autopep8)."
        fi
    else
        info "لا يمكن التعرف على نوع المشروع لتنسيق الكود."
    fi
}

# دالة لتشغيل الاختبارات
function run_tests {
    info "تشغيل الاختبارات..."
    if [ -f "package.json" ]; then
        if grep -q '"ci:check"' package.json; then
            npm run ci:check || return 1
        else
            npm test 2>/dev/null || npm run test 2>/dev/null || return 1
        fi
    elif [ -f "pom.xml" ]; then
        mvn test || return 1
    elif [ -f "build.gradle" ]; then
        gradle test || return 1
    elif [ -f "requirements.txt" ] || [ -f "setup.py" ]; then
        python -m pytest 2>/dev/null || python -m unittest discover 2>/dev/null || return 1
    else
        info "لم يتم العثور على أمر اختبار معروف، سيتم تخطي الاختبارات."
    fi
    return 0
}

# دالة للتراجع عن آخر دمج في حال الفشل
function abort_merge {
    info "التراجع عن آخر دمج..."
    git merge --abort 2>/dev/null || true
    git reset --hard HEAD@{1} 2>/dev/null || git reset --hard ORIG_HEAD 2>/dev/null || true
}

# ======================================================
# السكربت الرئيسي
# ======================================================

info "بدء سكربت إصلاح الطلبات..."

# التحقق من وجود git
check_git_repo

# التحقق من نظافة مساحة العمل قبل البدء
check_clean_working_tree

# الحصول على اسم الفرع الحالي
CURRENT_BRANCH=$(get_current_branch)
info "الفرع الحالي: $CURRENT_BRANCH"

# التأكد من أننا لسنا في الفرع الرئيسي
if [ "$CURRENT_BRANCH" == "$MAIN_BRANCH" ]; then
    error_exit "أنت في الفرع الرئيسي ($MAIN_BRANCH). الرجاء التبديل إلى فرع الطلب."
fi

# جلب آخر التحديثات
fetch_updates

# محاولة الدمج مع الفرع الرئيسي
for ((attempt=1; attempt<=MAX_RETRIES; attempt++)); do
    info "محاولة الدمج رقم $attempt..."

    # تعطيل set -e مؤقتاً لالتقاط رمز الخروج دون إنهاء السكربت
    set +e
    merge_with_strategy "$MAIN_BRANCH" "$AUTO_RESOLVE_STRATEGY"
    merge_exit_code=$?
    set -e

    if [ $merge_exit_code -eq 0 ]; then
        info "تم الدمج بنجاح دون تعارضات."
        break
    else
        info "حدثت تعارضات أثناء الدمج."

        set +e
        resolve_conflicts_with_mergetool
        mergetool_result=$?
        set -e

        if [ $mergetool_result -eq 0 ]; then
            git add -A 2>/dev/null || true
            git commit --no-edit 2>/dev/null || info "لا يوجد تغييرات جديدة بعد حل التعارضات."
            break
        else
            info "فشل حل التعارضات، سيتم التراجع وإعادة المحاولة."
            abort_merge
        fi
    fi

    if [ $attempt -eq $MAX_RETRIES ]; then
        error_exit "فشل الدمج بعد $MAX_RETRIES محاولات. يرجى حل التعارضات يدوياً."
    fi
done

# بعد الدمج الناجح، إصلاح مشاكل التنسيق إن وجدت
if [ "$FIX_LINT" = true ]; then
    fix_lint_issues
fi

# تشغيل الاختبارات
if [ "$RUN_TESTS" = true ]; then
    info "تشغيل الاختبارات..."
    
    # تعطيل set -e مؤقتاً لالتقاط رمز الخروج
    set +e
    run_tests
    test_result=$?
    set -e

    if [ $test_result -ne 0 ]; then
        info "فشلت الاختبارات. تم التراجع عن الدمج."
        abort_merge
        error_exit "فشلت الاختبارات بعد الدمج. تم التراجع عن التغييرات."
    else
        info "جميع الاختبارات ناجحة."
    fi
fi

# دفع التغييرات إلى الفرع البعيد
if [ "$PUSH_CHANGES" = true ]; then
    info "دفع التغييرات إلى origin/$CURRENT_BRANCH..."
    git push -u origin "$CURRENT_BRANCH" || error_exit "فشل الدفع. قد تحتاج إلى دفع يدوياً."
    info "تم دفع التغييرات بنجاح."
fi

info "✅ اكتمل إصلاح الطلب بنجاح."

exit 0
